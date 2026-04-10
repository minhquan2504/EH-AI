import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    CashierProfile,
    CashierOperationLimit,
    CashierActivityLog,
    PaginatedResult,
} from '../../models/Billing/billing-cashier-auth.model';

export class BillingCashierAuthRepository {

    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // ═══════════════════════════════════════════════════
    // CASHIER PROFILES
    // ═══════════════════════════════════════════════════

    /** Tạo hồ sơ thu ngân */
    static async createProfile(data: Partial<CashierProfile>): Promise<CashierProfile> {
        const sql = `
            INSERT INTO cashier_profiles (
                cashier_profile_id, user_id, employee_code, branch_id, facility_id,
                can_collect_payment, can_process_refund, can_void_transaction,
                can_open_shift, can_close_shift, is_active, supervisor_id, notes, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.cashier_profile_id, data.user_id, data.employee_code || null,
            data.branch_id || null, data.facility_id || null,
            data.can_collect_payment !== false, data.can_process_refund || false, data.can_void_transaction || false,
            data.can_open_shift !== false, data.can_close_shift !== false,
            data.is_active !== false, data.supervisor_id || null, data.notes || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật */
    static async updateProfile(profileId: string, data: Record<string, any>): Promise<CashierProfile> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [profileId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) { sets.push(`${key} = $${idx++}`); params.push(value); }
        }
        const sql = `UPDATE cashier_profiles SET ${sets.join(', ')} WHERE cashier_profile_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết */
    static async getProfileById(profileId: string): Promise<CashierProfile | null> {
        const sql = `
            SELECT cp.*, up.full_name as user_name,
                   sup.full_name as supervisor_name,
                   b.name as branch_name, f.name as facility_name
            FROM cashier_profiles cp
            LEFT JOIN user_profiles up ON cp.user_id = up.user_id
            LEFT JOIN user_profiles sup ON cp.supervisor_id = sup.user_id
            LEFT JOIN branches b ON cp.branch_id = b.branches_id
            LEFT JOIN facilities f ON cp.facility_id = f.facilities_id
            WHERE cp.cashier_profile_id = $1
        `;
        const result = await pool.query(sql, [profileId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tìm theo user_id */
    static async getProfileByUserId(userId: string): Promise<CashierProfile | null> {
        const sql = `
            SELECT cp.*, up.full_name as user_name,
                   sup.full_name as supervisor_name,
                   b.name as branch_name, f.name as facility_name
            FROM cashier_profiles cp
            LEFT JOIN user_profiles up ON cp.user_id = up.user_id
            LEFT JOIN user_profiles sup ON cp.supervisor_id = sup.user_id
            LEFT JOIN branches b ON cp.branch_id = b.branches_id
            LEFT JOIN facilities f ON cp.facility_id = f.facilities_id
            WHERE cp.user_id = $1
        `;
        const result = await pool.query(sql, [userId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách */
    static async getProfiles(
        branchId?: string, facilityId?: string, isActive?: boolean,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<CashierProfile>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (branchId) { conditions.push(`cp.branch_id = $${idx++}`); params.push(branchId); }
        if (facilityId) { conditions.push(`cp.facility_id = $${idx++}`); params.push(facilityId); }
        if (isActive !== undefined) { conditions.push(`cp.is_active = $${idx++}`); params.push(isActive); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM cashier_profiles cp ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT cp.*, up.full_name as user_name, sup.full_name as supervisor_name,
                   b.name as branch_name, f.name as facility_name
            FROM cashier_profiles cp
            LEFT JOIN user_profiles up ON cp.user_id = up.user_id
            LEFT JOIN user_profiles sup ON cp.supervisor_id = sup.user_id
            LEFT JOIN branches b ON cp.branch_id = b.branches_id
            LEFT JOIN facilities f ON cp.facility_id = f.facilities_id
            ${where}
            ORDER BY cp.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Soft delete */
    static async softDeleteProfile(profileId: string): Promise<void> {
        await pool.query(`UPDATE cashier_profiles SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE cashier_profile_id = $1`, [profileId]);
    }

    // ═══════════════════════════════════════════════════
    // OPERATION LIMITS
    // ═══════════════════════════════════════════════════

    /** Tạo/set limit */
    static async createLimit(data: Partial<CashierOperationLimit>): Promise<CashierOperationLimit> {
        const sql = `
            INSERT INTO cashier_operation_limits (
                limit_id, cashier_profile_id,
                max_single_payment, max_single_refund, max_single_void,
                max_shift_total, max_shift_refund_total, max_shift_void_count,
                max_daily_total, max_daily_refund_total, max_daily_void_count,
                require_approval_above, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.limit_id, data.cashier_profile_id,
            data.max_single_payment || null, data.max_single_refund || null, data.max_single_void || null,
            data.max_shift_total || null, data.max_shift_refund_total || null, data.max_shift_void_count || null,
            data.max_daily_total || null, data.max_daily_refund_total || null, data.max_daily_void_count || null,
            data.require_approval_above || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật limit */
    static async updateLimit(profileId: string, data: Record<string, any>): Promise<CashierOperationLimit> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [profileId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) { sets.push(`${key} = $${idx++}`); params.push(value); }
        }
        const sql = `UPDATE cashier_operation_limits SET ${sets.join(', ')} WHERE cashier_profile_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Lấy limit theo profile */
    static async getLimitByProfile(profileId: string): Promise<CashierOperationLimit | null> {
        const result = await pool.query(`SELECT * FROM cashier_operation_limits WHERE cashier_profile_id = $1`, [profileId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tổng thu/hoàn/void trong ca hiện tại */
    static async getShiftUsage(shiftId: string, cashierId: string): Promise<{ total: number; refund: number; void_count: number }> {
        const sql = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND status = 'SUCCESS' AND voided_at IS NULL THEN amount ELSE 0 END), 0) as total,
                COALESCE(SUM(CASE WHEN type = 'REFUND' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as refund,
                COUNT(CASE WHEN voided_at IS NOT NULL THEN 1 END) as void_count
            FROM payment_transactions
            WHERE shift_id = $1 AND created_by = $2
        `;
        const result = await pool.query(sql, [shiftId, cashierId]);
        return {
            total: parseFloat(result.rows[0].total),
            refund: parseFloat(result.rows[0].refund),
            void_count: parseInt(result.rows[0].void_count),
        };
    }

    /** Tổng thu/hoàn/void hôm nay */
    static async getDailyUsage(cashierId: string): Promise<{ total: number; refund: number; void_count: number }> {
        const sql = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND status = 'SUCCESS' AND voided_at IS NULL THEN amount ELSE 0 END), 0) as total,
                COALESCE(SUM(CASE WHEN type = 'REFUND' AND status = 'SUCCESS' THEN amount ELSE 0 END), 0) as refund,
                COUNT(CASE WHEN voided_at IS NOT NULL THEN 1 END) as void_count
            FROM payment_transactions
            WHERE created_by = $1 AND created_at::date = CURRENT_DATE
        `;
        const result = await pool.query(sql, [cashierId]);
        return {
            total: parseFloat(result.rows[0].total),
            refund: parseFloat(result.rows[0].refund),
            void_count: parseInt(result.rows[0].void_count),
        };
    }

    // ═══════════════════════════════════════════════════
    // SHIFT CONTROL
    // ═══════════════════════════════════════════════════

    /** Lấy shift */
    static async getShiftById(shiftId: string): Promise<any | null> {
        const sql = `
            SELECT cs.*, up.full_name as cashier_name
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            WHERE cs.cashier_shifts_id = $1
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Khóa ca */
    static async lockShift(shiftId: string, lockedBy: string, reason: string): Promise<void> {
        await pool.query(
            `UPDATE cashier_shifts SET status = 'LOCKED', locked_at = CURRENT_TIMESTAMP, locked_by = $2, lock_reason = $3 WHERE cashier_shifts_id = $1`,
            [shiftId, lockedBy, reason]
        );
    }

    /** Mở khóa ca */
    static async unlockShift(shiftId: string): Promise<void> {
        await pool.query(
            `UPDATE cashier_shifts SET status = 'OPEN', locked_at = NULL, locked_by = NULL, lock_reason = NULL WHERE cashier_shifts_id = $1`,
            [shiftId]
        );
    }

    /** Force close */
    static async forceCloseShift(shiftId: string, closedBy: string): Promise<void> {
        await pool.query(
            `UPDATE cashier_shifts SET status = 'CLOSED', shift_end = CURRENT_TIMESTAMP, force_closed = TRUE, closed_by = $2 WHERE cashier_shifts_id = $1`,
            [shiftId, closedBy]
        );
    }

    /** Bàn giao: đóng ca cũ + mở ca mới */
    static async handoverShift(shiftId: string, closedBy: string, handoverTo: string): Promise<void> {
        await pool.query(
            `UPDATE cashier_shifts SET status = 'CLOSED', shift_end = CURRENT_TIMESTAMP, closed_by = $2, handover_to = $3 WHERE cashier_shifts_id = $1`,
            [shiftId, closedBy, handoverTo]
        );
    }

    /** Ca đang mở */
    static async getActiveShifts(): Promise<any[]> {
        const sql = `
            SELECT cs.*, up.full_name as cashier_name,
                   b.name as branch_name, f.name as facility_name
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            LEFT JOIN branches b ON cs.branch_id = b.branches_id
            LEFT JOIN facilities f ON cs.facility_id = f.facilities_id
            WHERE cs.status IN ('OPEN', 'LOCKED')
            ORDER BY cs.shift_start DESC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    // ═══════════════════════════════════════════════════
    // ACTIVITY LOGS
    // ═══════════════════════════════════════════════════

    /** Ghi nhật ký */
    static async createLog(data: Partial<CashierActivityLog>): Promise<CashierActivityLog> {
        const sql = `
            INSERT INTO cashier_activity_logs (
                log_id, cashier_profile_id, user_id, shift_id,
                action_type, action_detail, ip_address, user_agent, facility_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.log_id, data.cashier_profile_id || null, data.user_id,
            data.shift_id || null, data.action_type,
            data.action_detail ? JSON.stringify(data.action_detail) : null,
            data.ip_address || null, data.user_agent || null, data.facility_id || null,
        ]);
        return result.rows[0];
    }

    /** Danh sách nhật ký */
    static async getLogs(
        actionType?: string, userId?: string, dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<CashierActivityLog>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (actionType) { conditions.push(`cal.action_type = $${idx++}`); params.push(actionType); }
        if (userId) { conditions.push(`cal.user_id = $${idx++}`); params.push(userId); }
        if (dateFrom) { conditions.push(`cal.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`cal.created_at <= $${idx++}`); params.push(dateTo + ' 23:59:59'); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM cashier_activity_logs cal ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT cal.*, up.full_name as user_name, cp.employee_code
            FROM cashier_activity_logs cal
            LEFT JOIN user_profiles up ON cal.user_id = up.user_id
            LEFT JOIN cashier_profiles cp ON cal.cashier_profile_id = cp.cashier_profile_id
            ${where}
            ORDER BY cal.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Nhật ký theo profile */
    static async getLogsByProfile(profileId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<CashierActivityLog>> {
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM cashier_activity_logs WHERE cashier_profile_id = $1`, [profileId]);
        const total = parseInt(countResult.rows[0].total);
        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT cal.*, up.full_name as user_name
            FROM cashier_activity_logs cal
            LEFT JOIN user_profiles up ON cal.user_id = up.user_id
            WHERE cal.cashier_profile_id = $1
            ORDER BY cal.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const dataResult = await pool.query(dataSql, [profileId, limit, offset]);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Nhật ký theo shift */
    static async getLogsByShift(shiftId: string): Promise<CashierActivityLog[]> {
        const sql = `
            SELECT cal.*, up.full_name as user_name
            FROM cashier_activity_logs cal
            LEFT JOIN user_profiles up ON cal.user_id = up.user_id
            WHERE cal.shift_id = $1
            ORDER BY cal.created_at ASC
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows;
    }

    // ═══════════════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════════════

    /** Dashboard tổng quan */
    static async getDashboard(): Promise<any> {
        const [profiles, activeShifts, todayTxn, warnings] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active FROM cashier_profiles`),
            pool.query(`SELECT COUNT(*) as cnt FROM cashier_shifts WHERE status IN ('OPEN','LOCKED')`),
            pool.query(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total_amount FROM payment_transactions WHERE created_at::date = CURRENT_DATE AND status = 'SUCCESS' AND voided_at IS NULL`),
            pool.query(`
                SELECT cal.user_id, up.full_name as user_name, COUNT(*) as exceed_count
                FROM cashier_activity_logs cal
                LEFT JOIN user_profiles up ON cal.user_id = up.user_id
                WHERE cal.action_type = 'LIMIT_EXCEEDED' AND cal.created_at::date = CURRENT_DATE
                GROUP BY cal.user_id, up.full_name
            `),
        ]);
        return {
            total_cashiers: parseInt(profiles.rows[0].total),
            active_cashiers: parseInt(profiles.rows[0].active),
            active_shifts: parseInt(activeShifts.rows[0].cnt),
            today_transactions: parseInt(todayTxn.rows[0].cnt),
            today_total_amount: parseFloat(todayTxn.rows[0].total_amount),
            limit_warnings: warnings.rows,
        };
    }

    /** Thống kê cá nhân */
    static async getCashierStats(profileId: string): Promise<any> {
        const profile = await pool.query(`SELECT user_id FROM cashier_profiles WHERE cashier_profile_id = $1`, [profileId]);
        if (profile.rows.length === 0) return null;
        const userId = profile.rows[0].user_id;

        const [today, shifts, limits] = await Promise.all([
            pool.query(`
                SELECT
                    COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND voided_at IS NULL THEN amount ELSE 0 END), 0) as total_payment,
                    COALESCE(SUM(CASE WHEN type = 'REFUND' THEN amount ELSE 0 END), 0) as total_refund,
                    COUNT(CASE WHEN voided_at IS NOT NULL THEN 1 END) as void_count,
                    COUNT(*) as txn_count
                FROM payment_transactions WHERE created_by = $1 AND created_at::date = CURRENT_DATE AND status = 'SUCCESS'
            `, [userId]),
            pool.query(`SELECT COUNT(*) as total_shifts FROM cashier_shifts WHERE cashier_id = $1`, [userId]),
            pool.query(`SELECT * FROM cashier_operation_limits WHERE cashier_profile_id = $1`, [profileId]),
        ]);

        const limit = limits.rows[0] || null;
        return {
            today: {
                total_payment: parseFloat(today.rows[0].total_payment),
                total_refund: parseFloat(today.rows[0].total_refund),
                void_count: parseInt(today.rows[0].void_count),
                txn_count: parseInt(today.rows[0].txn_count),
            },
            total_shifts: parseInt(shifts.rows[0].total_shifts),
            limits: limit,
            limit_usage: limit ? {
                daily_total_pct: limit.max_daily_total ? (parseFloat(today.rows[0].total_payment) / parseFloat(limit.max_daily_total) * 100).toFixed(1) : null,
                daily_refund_pct: limit.max_daily_refund_total ? (parseFloat(today.rows[0].total_refund) / parseFloat(limit.max_daily_refund_total) * 100).toFixed(1) : null,
                daily_void_pct: limit.max_daily_void_count ? (parseInt(today.rows[0].void_count) / limit.max_daily_void_count * 100).toFixed(1) : null,
            } : null,
        };
    }
}
