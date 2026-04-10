import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    ReconciliationSession,
    ReconciliationItem,
    SettlementReport,
    PaginatedResult,
} from '../../models/Billing/billing-reconciliation.model';

export class BillingReconciliationRepository {

    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // ═══════════════════════════════════════════════════
    // RECONCILIATION SESSIONS
    // ═══════════════════════════════════════════════════

    /** Tạo phiên đối soát */
    static async createSession(data: Partial<ReconciliationSession>, client?: PoolClient): Promise<ReconciliationSession> {
        const sql = `
            INSERT INTO reconciliation_sessions (
                session_id, session_code, reconciliation_type, reconcile_date,
                facility_id, total_system_amount, total_external_amount,
                discrepancy_amount, total_transactions_matched, total_transactions_unmatched,
                status, notes, shift_id, gateway_name, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            data.session_id, data.session_code, data.reconciliation_type, data.reconcile_date,
            data.facility_id || null, data.total_system_amount || 0, data.total_external_amount || 0,
            data.discrepancy_amount || 0, data.total_transactions_matched || 0,
            data.total_transactions_unmatched || 0,
            data.status || 'PENDING', data.notes || null,
            data.shift_id || null, data.gateway_name || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Tạo dòng đối soát */
    static async createItems(items: Partial<ReconciliationItem>[], client?: PoolClient): Promise<void> {
        const executor = client || pool;
        for (const item of items) {
            const sql = `
                INSERT INTO reconciliation_items (
                    item_id, session_id, match_status,
                    system_transaction_id, system_transaction_code, system_amount, system_method, system_date,
                    external_reference, external_amount, external_date, external_raw,
                    discrepancy_amount, discrepancy_reason, resolution_status
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            `;
            await executor.query(sql, [
                item.item_id, item.session_id, item.match_status,
                item.system_transaction_id || null, item.system_transaction_code || null,
                item.system_amount || null, item.system_method || null, item.system_date || null,
                item.external_reference || null, item.external_amount || null,
                item.external_date || null, item.external_raw ? JSON.stringify(item.external_raw) : null,
                item.discrepancy_amount || 0, item.discrepancy_reason || null,
                item.resolution_status || 'UNRESOLVED',
            ]);
        }
    }

    /** Cập nhật tổng kết session */
    static async updateSessionSummary(
        sessionId: string, systemAmt: number, externalAmt: number,
        matched: number, unmatched: number, client?: PoolClient
    ): Promise<void> {
        const sql = `
            UPDATE reconciliation_sessions SET
                total_system_amount = $2, total_external_amount = $3,
                discrepancy_amount = $4,
                total_transactions_matched = $5, total_transactions_unmatched = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = $1
        `;
        const executor = client || pool;
        await executor.query(sql, [sessionId, systemAmt, externalAmt, externalAmt - systemAmt, matched, unmatched]);
    }

    /** Cập nhật trạng thái session */
    static async updateSessionStatus(
        sessionId: string, status: string, extraFields: Record<string, any> = {}
    ): Promise<ReconciliationSession> {
        const sets = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [sessionId, status];
        let idx = 3;
        for (const [key, value] of Object.entries(extraFields)) {
            sets.push(`${key} = $${idx++}`);
            params.push(value);
        }
        const sql = `UPDATE reconciliation_sessions SET ${sets.join(', ')} WHERE session_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết phiên kèm items */
    static async getSessionById(sessionId: string): Promise<ReconciliationSession | null> {
        const sql = `
            SELECT rs.*, f.name as facility_name,
                   up1.full_name as created_by_name,
                   up2.full_name as reviewed_by_name,
                   up3.full_name as approved_by_name
            FROM reconciliation_sessions rs
            LEFT JOIN facilities f ON rs.facility_id = f.facilities_id
            LEFT JOIN user_profiles up1 ON rs.created_by = up1.user_id
            LEFT JOIN user_profiles up2 ON rs.reviewed_by = up2.user_id
            LEFT JOIN user_profiles up3 ON rs.approved_by = up3.user_id
            WHERE rs.session_id = $1
        `;
        const result = await pool.query(sql, [sessionId]);
        if (result.rows.length === 0) return null;

        const session = result.rows[0];
        const itemsSql = `
            SELECT ri.*, up.full_name as resolved_by_name
            FROM reconciliation_items ri
            LEFT JOIN user_profiles up ON ri.resolved_by = up.user_id
            WHERE ri.session_id = $1 ORDER BY ri.created_at
        `;
        const itemsResult = await pool.query(itemsSql, [sessionId]);
        session.items = itemsResult.rows;

        return session;
    }

    /** Danh sách phiên */
    static async getSessions(
        type?: string, status?: string, facilityId?: string,
        dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<ReconciliationSession>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (type) { conditions.push(`rs.reconciliation_type = $${idx++}`); params.push(type); }
        if (status) { conditions.push(`rs.status = $${idx++}`); params.push(status); }
        if (facilityId) { conditions.push(`rs.facility_id = $${idx++}`); params.push(facilityId); }
        if (dateFrom) { conditions.push(`rs.reconcile_date >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`rs.reconcile_date <= $${idx++}`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await pool.query(`SELECT COUNT(*) as total FROM reconciliation_sessions rs ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT rs.*, f.name as facility_name, up.full_name as created_by_name
            FROM reconciliation_sessions rs
            LEFT JOIN facilities f ON rs.facility_id = f.facilities_id
            LEFT JOIN user_profiles up ON rs.created_by = up.user_id
            ${where}
            ORDER BY rs.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Kiểm tra session đã tồn tại cho ngày/ca */
    static async checkExistingSession(type: string, date: string, shiftId?: string): Promise<boolean> {
        let sql = `SELECT 1 FROM reconciliation_sessions WHERE reconciliation_type = $1 AND reconcile_date = $2 AND status NOT IN ('REJECTED')`;
        const params: any[] = [type, date];
        if (shiftId) { sql += ` AND shift_id = $3`; params.push(shiftId); }
        const result = await pool.query(sql, params);
        return result.rows.length > 0;
    }

    // ═══════════════════════════════════════════════════
    // RECONCILIATION ITEMS
    // ═══════════════════════════════════════════════════

    /** Chi tiết dòng đối soát */
    static async getItemById(itemId: string): Promise<ReconciliationItem | null> {
        const sql = `
            SELECT ri.*, up.full_name as resolved_by_name
            FROM reconciliation_items ri
            LEFT JOIN user_profiles up ON ri.resolved_by = up.user_id
            WHERE ri.item_id = $1
        `;
        const result = await pool.query(sql, [itemId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Xử lý chênh lệch */
    static async resolveItem(
        itemId: string, resolutionStatus: string, notes: string, userId: string
    ): Promise<ReconciliationItem> {
        const sql = `
            UPDATE reconciliation_items SET
                resolution_status = $2, resolution_notes = $3,
                resolved_by = $4, resolved_at = CURRENT_TIMESTAMP
            WHERE item_id = $1 RETURNING *
        `;
        const result = await pool.query(sql, [itemId, resolutionStatus, notes, userId]);
        return result.rows[0];
    }

    // ═══════════════════════════════════════════════════
    // DISCREPANCY REPORT
    // ═══════════════════════════════════════════════════

    /** Tổng hợp chênh lệch chưa xử lý */
    static async getDiscrepancySummary(facilityId?: string): Promise<any> {
        let facilityCondition = '';
        const params: any[] = [];
        if (facilityId) { facilityCondition = 'AND rs.facility_id = $1'; params.push(facilityId); }

        const sql = `
            SELECT
                COUNT(*) as total_unresolved,
                COALESCE(SUM(ABS(ri.discrepancy_amount)), 0) as total_discrepancy_amount
            FROM reconciliation_items ri
            JOIN reconciliation_sessions rs ON ri.session_id = rs.session_id
            WHERE ri.resolution_status = 'UNRESOLVED' AND ri.match_status != 'MATCHED'
            ${facilityCondition}
        `;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chênh lệch theo severity */
    static async getDiscrepancyBySeverity(minorThreshold: number, majorThreshold: number, facilityId?: string): Promise<any[]> {
        let facilityCondition = '';
        const params: any[] = [minorThreshold, majorThreshold];
        if (facilityId) { facilityCondition = 'AND rs.facility_id = $3'; params.push(facilityId); }

        const sql = `
            SELECT
                CASE
                    WHEN ABS(ri.discrepancy_amount) < $1 THEN 'MINOR'
                    WHEN ABS(ri.discrepancy_amount) < $2 THEN 'MAJOR'
                    ELSE 'CRITICAL'
                END as severity,
                COUNT(*) as count,
                COALESCE(SUM(ABS(ri.discrepancy_amount)), 0) as total
            FROM reconciliation_items ri
            JOIN reconciliation_sessions rs ON ri.session_id = rs.session_id
            WHERE ri.resolution_status = 'UNRESOLVED' AND ri.match_status != 'MATCHED'
            ${facilityCondition}
            GROUP BY severity ORDER BY total DESC
        `;
        const result = await pool.query(sql, params);
        return result.rows;
    }

    /** Chênh lệch theo loại đối soát */
    static async getDiscrepancyByType(facilityId?: string): Promise<any[]> {
        let facilityCondition = '';
        const params: any[] = [];
        if (facilityId) { facilityCondition = 'AND rs.facility_id = $1'; params.push(facilityId); }

        const sql = `
            SELECT
                rs.reconciliation_type,
                COUNT(*) as count,
                COALESCE(SUM(ABS(ri.discrepancy_amount)), 0) as total
            FROM reconciliation_items ri
            JOIN reconciliation_sessions rs ON ri.session_id = rs.session_id
            WHERE ri.resolution_status = 'UNRESOLVED' AND ri.match_status != 'MATCHED'
            ${facilityCondition}
            GROUP BY rs.reconciliation_type ORDER BY total DESC
        `;
        const result = await pool.query(sql, params);
        return result.rows;
    }

    /** Dòng chưa xử lý gần đây */
    static async getRecentUnresolvedItems(limit: number = 20): Promise<ReconciliationItem[]> {
        const sql = `
            SELECT ri.*, up.full_name as resolved_by_name
            FROM reconciliation_items ri
            LEFT JOIN user_profiles up ON ri.resolved_by = up.user_id
            WHERE ri.resolution_status = 'UNRESOLVED' AND ri.match_status != 'MATCHED'
            ORDER BY ri.created_at DESC LIMIT $1
        `;
        const result = await pool.query(sql, [limit]);
        return result.rows;
    }

    // ═══════════════════════════════════════════════════
    // SYSTEM TRANSACTIONS (đọc từ Module 9.2/9.4)
    // ═══════════════════════════════════════════════════

    /** Lấy giao dịch online (BANK_TRANSFER) theo ngày */
    static async getOnlineTransactionsByDate(date: string): Promise<any[]> {
        const sql = `
            SELECT pt.payment_transactions_id, pt.transaction_code, pt.amount,
                   pt.payment_method, pt.paid_at, pt.status,
                   pt.gateway_transaction_id, pt.gateway_response
            FROM payment_transactions pt
            WHERE pt.payment_method = 'BANK_TRANSFER'
              AND pt.status = 'SUCCESS'
              AND pt.paid_at::date = $1
            ORDER BY pt.paid_at
        `;
        const result = await pool.query(sql, [date]);
        return result.rows;
    }

    /** Lấy thông tin ca đã đóng */
    static async getClosedShift(shiftId: string): Promise<any | null> {
        const sql = `
            SELECT cs.*, up.full_name as cashier_name
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            WHERE cs.cashier_shifts_id = $1
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Giao dịch trong ca */
    static async getTransactionsByShift(shiftId: string): Promise<any[]> {
        const sql = `
            SELECT pt.payment_transactions_id, pt.transaction_code, pt.amount,
                   pt.payment_method, pt.paid_at, pt.status, pt.transaction_type
            FROM payment_transactions pt
            WHERE pt.shift_id = $1
            ORDER BY pt.paid_at
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows;
    }

    /** Mệnh giá ca (Module 9.4) */
    static async getShiftDenominations(shiftId: string): Promise<any[]> {
        const sql = `SELECT * FROM shift_cash_denominations WHERE shift_id = $1 ORDER BY denomination_value DESC`;
        const result = await pool.query(sql, [shiftId]);
        return result.rows;
    }

    // ═══════════════════════════════════════════════════
    // SETTLEMENT REPORTS
    // ═══════════════════════════════════════════════════

    /** Tạo phiếu quyết toán */
    static async createSettlement(data: Partial<SettlementReport>): Promise<SettlementReport> {
        const sql = `
            INSERT INTO settlement_reports (
                report_id, report_code, report_type, period_start, period_end,
                facility_id, total_revenue, total_cash, total_card, total_transfer,
                total_online, total_refunds, total_voids, net_revenue,
                total_discrepancies, unresolved_discrepancies,
                status, notes, export_data, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.report_id, data.report_code, data.report_type, data.period_start, data.period_end,
            data.facility_id || null, data.total_revenue || 0, data.total_cash || 0,
            data.total_card || 0, data.total_transfer || 0, data.total_online || 0,
            data.total_refunds || 0, data.total_voids || 0, data.net_revenue || 0,
            data.total_discrepancies || 0, data.unresolved_discrepancies || 0,
            data.status || 'DRAFT', data.notes || null,
            data.export_data ? JSON.stringify(data.export_data) : null,
            data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật trạng thái phiếu quyết toán */
    static async updateSettlementStatus(
        reportId: string, status: string, extraFields: Record<string, any> = {}
    ): Promise<SettlementReport> {
        const sets = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [reportId, status];
        let idx = 3;
        for (const [key, value] of Object.entries(extraFields)) {
            sets.push(`${key} = $${idx++}`);
            params.push(value);
        }
        const sql = `UPDATE settlement_reports SET ${sets.join(', ')} WHERE report_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết phiếu quyết toán */
    static async getSettlementById(reportId: string): Promise<SettlementReport | null> {
        const sql = `
            SELECT sr.*, f.name as facility_name,
                   up1.full_name as created_by_name,
                   up2.full_name as submitted_by_name,
                   up3.full_name as approved_by_name
            FROM settlement_reports sr
            LEFT JOIN facilities f ON sr.facility_id = f.facilities_id
            LEFT JOIN user_profiles up1 ON sr.created_by = up1.user_id
            LEFT JOIN user_profiles up2 ON sr.submitted_by = up2.user_id
            LEFT JOIN user_profiles up3 ON sr.approved_by = up3.user_id
            WHERE sr.report_id = $1
        `;
        const result = await pool.query(sql, [reportId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách phiếu quyết toán */
    static async getSettlements(
        type?: string, status?: string, facilityId?: string,
        dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<SettlementReport>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (type) { conditions.push(`sr.report_type = $${idx++}`); params.push(type); }
        if (status) { conditions.push(`sr.status = $${idx++}`); params.push(status); }
        if (facilityId) { conditions.push(`sr.facility_id = $${idx++}`); params.push(facilityId); }
        if (dateFrom) { conditions.push(`sr.period_start >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`sr.period_end <= $${idx++}`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM settlement_reports sr ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT sr.*, f.name as facility_name, up.full_name as created_by_name
            FROM settlement_reports sr
            LEFT JOIN facilities f ON sr.facility_id = f.facilities_id
            LEFT JOIN user_profiles up ON sr.created_by = up.user_id
            ${where}
            ORDER BY sr.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Tổng hợp revenue theo khoảng ngày */
    static async getRevenueByPeriod(periodStart: string, periodEnd: string, facilityId?: string): Promise<any> {
        let facilityCondition = '';
        const params: any[] = [periodStart, periodEnd];
        if (facilityId) { facilityCondition = 'AND i.facility_id = $3'; params.push(facilityId); }

        const sql = `
            SELECT
                COALESCE(SUM(CASE WHEN pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN pt.payment_method = 'CASH' AND pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_cash,
                COALESCE(SUM(CASE WHEN pt.payment_method = 'CREDIT_CARD' AND pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_card,
                COALESCE(SUM(CASE WHEN pt.payment_method = 'BANK_TRANSFER' AND pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_transfer,
                COALESCE(SUM(CASE WHEN pt.payment_method IN ('VNPAY','MOMO') AND pt.transaction_type = 'PAYMENT' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_online,
                COALESCE(SUM(CASE WHEN pt.transaction_type = 'REFUND' AND pt.status = 'SUCCESS' THEN pt.amount ELSE 0 END), 0) as total_refunds,
                COALESCE(SUM(CASE WHEN pt.status = 'VOIDED' THEN pt.amount ELSE 0 END), 0) as total_voids
            FROM payment_transactions pt
            JOIN invoices i ON pt.invoice_id = i.invoices_id
            WHERE pt.paid_at::date BETWEEN $1 AND $2
            ${facilityCondition}
        `;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Đếm discrepancies trong khoảng ngày */
    static async countDiscrepancies(periodStart: string, periodEnd: string, facilityId?: string): Promise<any> {
        let facilityCondition = '';
        const params: any[] = [periodStart, periodEnd];
        if (facilityId) { facilityCondition = 'AND rs.facility_id = $3'; params.push(facilityId); }

        const sql = `
            SELECT
                COUNT(*) FILTER (WHERE ri.match_status != 'MATCHED') as total_discrepancies,
                COUNT(*) FILTER (WHERE ri.resolution_status = 'UNRESOLVED' AND ri.match_status != 'MATCHED') as unresolved_discrepancies
            FROM reconciliation_items ri
            JOIN reconciliation_sessions rs ON ri.session_id = rs.session_id
            WHERE rs.reconcile_date BETWEEN $1 AND $2
            ${facilityCondition}
        `;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM facilities WHERE facilities_id = $1', [facilityId]);
        return r.rows.length > 0;
    }

    /** Lấy cấu hình gateway (Module 9.3) */
    static async getGatewayConfig(gatewayName: string): Promise<any | null> {
        const sql = `SELECT * FROM payment_gateway_config WHERE gateway_name = $1`;
        const result = await pool.query(sql, [gatewayName]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}
