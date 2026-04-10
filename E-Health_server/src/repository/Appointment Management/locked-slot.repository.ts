import crypto from 'crypto';
import { pool } from '../../config/postgresdb';
import { LockedSlot } from '../../models/Appointment Management/locked-slot.model';

/**
 * Sinh ID duy nhất: LKSL_xxxxxxxx
 */
const generateLockedSlotId = (): string =>
    `LKSL_${crypto.randomBytes(4).toString('hex')}`;

/**
 * Repository quản lý khoá slot theo ngày cụ thể.
 */
export class LockedSlotRepository {

    /**
     * Khoá nhiều slot cùng ngày (batch insert, bỏ qua đã tồn tại)
     */
    static async lockSlots(
        slotIds: string[],
        lockedDate: string,
        lockReason: string | null,
        lockedBy: string | null
    ): Promise<LockedSlot[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results: LockedSlot[] = [];

            for (const slotId of slotIds) {
                const id = generateLockedSlotId();

                // ON CONFLICT DO NOTHING để bỏ qua slot đã khoá ngày đó
                const query = `
                    INSERT INTO locked_slots (locked_slot_id, slot_id, locked_date, lock_reason, locked_by)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (slot_id, locked_date) DO NOTHING
                    RETURNING *
                `;
                const result = await client.query(query, [id, slotId, lockedDate, lockReason, lockedBy]);

                if (result.rows[0]) {
                    results.push(result.rows[0]);
                }
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách slot đã khoá (filter theo ngày, shift, slot)
     */
    static async getLockedSlots(
        date: string,
        shiftId?: string,
        slotId?: string
    ): Promise<LockedSlot[]> {
        const conditions: string[] = [
            'ls.locked_date = $1',
            'ls.deleted_at IS NULL',
        ];
        const params: any[] = [date];
        let paramIdx = 2;

        if (shiftId) {
            conditions.push(`sl.shift_id = $${paramIdx}`);
            params.push(shiftId);
            paramIdx++;
        }

        if (slotId) {
            conditions.push(`ls.slot_id = $${paramIdx}`);
            params.push(slotId);
            paramIdx++;
        }

        const query = `
            SELECT
                ls.locked_slot_id,
                ls.slot_id,
                ls.locked_date,
                ls.lock_reason,
                ls.locked_by,
                ls.created_at,
                sl.start_time,
                sl.end_time,
                sh.name AS shift_name,
                sh.code AS shift_code,
                up.full_name AS locked_by_name
            FROM locked_slots ls
            JOIN appointment_slots sl ON ls.slot_id = sl.slot_id
            JOIN shifts sh ON sl.shift_id = sh.shifts_id
            LEFT JOIN users u ON ls.locked_by = u.users_id
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY sl.start_time ASC
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Mở khoá slot (soft delete)
     */
    static async unlockSlot(lockedSlotId: string): Promise<boolean> {
        const query = `
            UPDATE locked_slots
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE locked_slot_id = $1 AND deleted_at IS NULL
            RETURNING locked_slot_id
        `;
        const result = await pool.query(query, [lockedSlotId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Mở khoá tất cả slot trong 1 ca theo ngày (soft delete batch)
     */
    static async unlockByShift(shiftId: string, lockedDate: string): Promise<number> {
        const query = `
            UPDATE locked_slots ls
            SET deleted_at = CURRENT_TIMESTAMP
            FROM appointment_slots sl
            WHERE ls.slot_id = sl.slot_id
              AND sl.shift_id = $1
              AND ls.locked_date = $2
              AND ls.deleted_at IS NULL
        `;
        const result = await pool.query(query, [shiftId, lockedDate]);
        return result.rowCount ?? 0;
    }

    /**
     * Kiểm tra locked_slot_id tồn tại và chưa bị xoá
     */
    static async findById(lockedSlotId: string): Promise<LockedSlot | null> {
        const query = `
            SELECT * FROM locked_slots
            WHERE locked_slot_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [lockedSlotId]);
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách slot_id đang active thuộc 1 shift
     */
    static async getActiveSlotIdsByShift(shiftId: string): Promise<string[]> {
        const query = `
            SELECT slot_id FROM appointment_slots
            WHERE shift_id = $1 AND is_active = true
        `;
        const result = await pool.query(query, [shiftId]);
        return result.rows.map((r: any) => r.slot_id);
    }

    /**
     * Kiểm tra slot tồn tại và active
     */
    static async isSlotActive(slotId: string): Promise<boolean> {
        const query = `SELECT 1 FROM appointment_slots WHERE slot_id = $1 AND is_active = true`;
        const result = await pool.query(query, [slotId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra shift tồn tại
     */
    static async isShiftExists(shiftId: string): Promise<boolean> {
        const query = `SELECT 1 FROM shifts WHERE shifts_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`;
        const result = await pool.query(query, [shiftId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Đếm lịch hẹn bị ảnh hưởng khi khoá slot vào ngày cụ thể
     */
    static async countAffectedAppointments(slotIds: string[], date: string): Promise<number> {
        if (slotIds.length === 0) return 0;

        const placeholders = slotIds.map((_, i) => `$${i + 2}`).join(',');
        const query = `
            SELECT COUNT(*) FROM appointments
            WHERE slot_id IN (${placeholders})
              AND appointment_date = $1
              AND status IN ('PENDING', 'CONFIRMED')
        `;
        const result = await pool.query(query, [date, ...slotIds]);
        return parseInt(result.rows[0].count, 10);
    }
}
