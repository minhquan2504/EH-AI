import { pool } from '../../config/postgresdb';
import { AuditLog, AuditLogQueryFilters } from '../../models/Core/audit-log.model';
import { randomUUID } from 'crypto';

export class AuditLogRepository {
    /**
     * Ghi 1 dòng Log mới vào CSDL (Hàm này có thể được gọi bởi Middleware hoặc Service)
     */
    static async createLog(logData: Partial<AuditLog>): Promise<void> {
        try {
            const logId = `AUDIT_${Date.now()}_${randomUUID().substring(0, 8)}`;
            const query = `
                INSERT INTO audit_logs 
                (log_id, user_id, action_type, module_name, target_id, old_value, new_value, ip_address, user_agent) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;

            const values = [
                logId,
                logData.user_id || null,
                logData.action_type,
                logData.module_name,
                logData.target_id || null,
                logData.old_value ? JSON.stringify(logData.old_value) : null,
                logData.new_value ? JSON.stringify(logData.new_value) : null,
                logData.ip_address || null,
                logData.user_agent || null
            ];

            await pool.query(query, values);
        } catch (error) {
            // Không nên throw error làm đứt mạch luồng chính của App, chỉ console.error
            console.error('[AUDIT_LOG_ERROR] Lỗi khi ghi log thao tác:', error);
        }
    }

    /**
     * Truy vấn danh sách Audit Logs kèm bộ lọc phục vụ Admin Dashboard
     */
    static async getLogs(filters: AuditLogQueryFilters): Promise<{ logs: any[], total: number }> {
        const params: any[] = [];
        const whereClauses: string[] = ['1=1'];

        if (filters.user_id) {
            params.push(filters.user_id);
            whereClauses.push(`a.user_id = $${params.length}`);
        }

        if (filters.module_name) {
            params.push(filters.module_name);
            whereClauses.push(`a.module_name = $${params.length}`);
        }

        if (filters.action_type) {
            params.push(filters.action_type);
            whereClauses.push(`a.action_type = $${params.length}`);
        }

        if (filters.target_id) {
            params.push(filters.target_id);
            whereClauses.push(`a.target_id = $${params.length}`);
        }

        if (filters.start_date) {
            params.push(filters.start_date);
            whereClauses.push(`a.created_at >= $${params.length}`);
        }

        if (filters.end_date) {
            // Bao gồm hết ngày
            params.push(`${filters.end_date} 23:59:59`);
            whereClauses.push(`a.created_at <= $${params.length}`);
        }

        const whereSql = whereClauses.join(' AND ');

        // Đếm tổng số lượng
        const countQuery = `SELECT COUNT(*) FROM audit_logs a WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        // Lấy dữ liệu phân trang (Kèm thêm thông tin Email user nếu có)
        const limitStr = filters.limit ? `LIMIT ${filters.limit}` : '';
        const offsetStr = filters.page && filters.limit ? `OFFSET ${(filters.page - 1) * filters.limit}` : '';

        const dataQuery = `
            SELECT a.*, u.email as user_email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.users_id
            WHERE ${whereSql}
            ORDER BY a.created_at DESC
            ${limitStr} ${offsetStr}
        `;
        const dataResult = await pool.query(dataQuery, params);

        return {
            logs: dataResult.rows,
            total
        };
    }

    /**
     * Lấy chi tiết rành mạch 1 dòng Log để Validate Before/After
     */
    static async getLogById(logId: string): Promise<any> {
        const query = `
            SELECT a.*, u.email as user_email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.users_id
            WHERE a.log_id = $1
        `;
        const result = await pool.query(query, [logId]);
        return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
    }
}
