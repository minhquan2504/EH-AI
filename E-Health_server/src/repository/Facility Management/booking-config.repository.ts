import { pool } from '../../config/postgresdb';
import { BookingConfigEntity } from '../../models/Facility Management/booking-config.model';


export class BookingConfigRepository {

    /**
     * Lấy cấu hình thô (Raw) của chi nhánh.
     */
    static async getRawConfigByBranch(branchId: string): Promise<BookingConfigEntity | null> {
        const query = `
            SELECT config_id, facility_id, branch_id,
                   max_patients_per_slot, buffer_duration,
                   advance_booking_days, minimum_booking_hours,
                   cancellation_allowed_hours,
                   created_at, updated_at
            FROM booking_configurations
            WHERE branch_id = $1
        `;
        const result = await pool.query(query, [branchId]);
        return result.rows[0] || null;
    }

    /**
     * Tạo mới hoặc cập nhật cấu hình cho chi nhánh (UPSERT).
     */
    static async upsertConfig(
        configId: string,
        facilityId: string,
        branchId: string,
        data: {
            max_patients_per_slot?: number | null;
            buffer_duration?: number | null;
            advance_booking_days?: number | null;
            minimum_booking_hours?: number | null;
            cancellation_allowed_hours?: number | null;
        },
    ): Promise<BookingConfigEntity> {
        const query = `
            INSERT INTO booking_configurations (
                config_id, facility_id, branch_id,
                max_patients_per_slot, buffer_duration,
                advance_booking_days, minimum_booking_hours,
                cancellation_allowed_hours
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (branch_id) DO UPDATE SET
                max_patients_per_slot = COALESCE($4, booking_configurations.max_patients_per_slot),
                buffer_duration = COALESCE($5, booking_configurations.buffer_duration),
                advance_booking_days = COALESCE($6, booking_configurations.advance_booking_days),
                minimum_booking_hours = COALESCE($7, booking_configurations.minimum_booking_hours),
                cancellation_allowed_hours = COALESCE($8, booking_configurations.cancellation_allowed_hours),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await pool.query(query, [
            configId,
            facilityId,
            branchId,
            data.max_patients_per_slot ?? null,
            data.buffer_duration ?? null,
            data.advance_booking_days ?? null,
            data.minimum_booking_hours ?? null,
            data.cancellation_allowed_hours ?? null,
        ]);
        return result.rows[0];
    }

    /**
     * Kiểm tra chi nhánh có tồn tại và thuộc cơ sở nào.
     */
    static async getBranchFacilityId(branchId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT facility_id FROM branches WHERE branches_id = $1 AND status = 'ACTIVE'`,
            [branchId],
        );
        return result.rows[0]?.facility_id || null;
    }
}
