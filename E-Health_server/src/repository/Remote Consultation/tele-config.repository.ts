import { pool } from '../../config/postgresdb';
import { TeleSystemConfig, TeleServicePricing, TeleConfigAuditLog, PricingFilter } from '../../models/Remote Consultation/tele-config.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho cấu hình & quản trị hệ thống teleconsultation
 */
export class TeleConfigRepository {

    // ═══════════════════════════════════════════════════
    // CONFIGS
    // ═══════════════════════════════════════════════════

    /** DS configs (filter category) */
    static async getAllConfigs(category?: string): Promise<TeleSystemConfig[]> {
        let query = `
            SELECT c.*, up.full_name AS updater_name
            FROM tele_system_configs c
            LEFT JOIN user_profiles up ON c.updated_by = up.user_id
        `;
        const params: any[] = [];
        if (category) { query += ` WHERE c.category = $1`; params.push(category); }
        query += ` ORDER BY c.category, c.config_key`;
        const r = await pool.query(query, params);
        return r.rows;
    }

    /** Lấy 1 config */
    static async getConfig(configKey: string): Promise<TeleSystemConfig | null> {
        const r = await pool.query(`SELECT * FROM tele_system_configs WHERE config_key = $1`, [configKey]);
        return r.rows[0] || null;
    }

    /** Cập nhật config */
    static async updateConfig(configKey: string, value: string, userId: string): Promise<void> {
        await pool.query(`
            UPDATE tele_system_configs SET config_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE config_key = $3
        `, [value, userId, configKey]);
    }

    /** Ghi audit log */
    static async writeAuditLog(configKey: string, oldValue: string, newValue: string, userId: string): Promise<void> {
        const logId = `CAL_${uuidv4().substring(0, 12)}`;
        await pool.query(`
            INSERT INTO tele_config_audit_log (log_id, config_key, old_value, new_value, changed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [logId, configKey, oldValue, newValue, userId]);
    }

    /** DS audit log */
    static async getAuditLog(page: number, limit: number, configKey?: string): Promise<{ data: TeleConfigAuditLog[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;
        if (configKey) { where += ` AND al.config_key = $${idx++}`; params.push(configKey); }

        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_config_audit_log al ${where}`, params);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT al.*, up.full_name AS changer_name
            FROM tele_config_audit_log al
            LEFT JOIN user_profiles up ON al.changed_by = up.user_id
            ${where}
            ORDER BY al.changed_at DESC LIMIT $${idx++} OFFSET $${idx}
        `, [...params, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    // ═══════════════════════════════════════════════════
    // PRICING
    // ═══════════════════════════════════════════════════

    /** Tạo pricing */
    static async createPricing(data: Record<string, any>): Promise<TeleServicePricing> {
        const r = await pool.query(`
            INSERT INTO tele_service_pricing (
                pricing_id, type_id, specialty_id, facility_id,
                base_price, currency, discount_percent,
                effective_from, effective_to, created_by, updated_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *
        `, [
            data.pricing_id, data.type_id, data.specialty_id, data.facility_id,
            data.base_price, data.currency, data.discount_percent,
            data.effective_from, data.effective_to, data.created_by
        ]);
        return r.rows[0];
    }

    /** Cập nhật pricing */
    static async updatePricing(pricingId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(pricingId);
        await pool.query(`UPDATE tele_service_pricing SET ${setClauses.join(', ')} WHERE pricing_id = $${idx}`, values);
    }

    /** Xóa pricing */
    static async deletePricing(pricingId: string): Promise<void> {
        await pool.query(`DELETE FROM tele_service_pricing WHERE pricing_id = $1`, [pricingId]);
    }

    /** Tìm pricing theo ID */
    static async findPricingById(pricingId: string): Promise<TeleServicePricing | null> {
        const r = await pool.query(`SELECT * FROM tele_service_pricing WHERE pricing_id = $1`, [pricingId]);
        return r.rows[0] || null;
    }

    /** DS pricing (filter) */
    static async findAllPricing(filters: PricingFilter): Promise<{ data: TeleServicePricing[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.type_id) { where += ` AND p.type_id = $${idx++}`; params.push(filters.type_id); }
        if (filters.specialty_id) { where += ` AND p.specialty_id = $${idx++}`; params.push(filters.specialty_id); }
        if (filters.facility_id) { where += ` AND p.facility_id = $${idx++}`; params.push(filters.facility_id); }
        if (filters.is_active !== undefined) { where += ` AND p.is_active = $${idx++}`; params.push(filters.is_active); }

        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_service_pricing p ${where}`, params);
        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT p.*,
                   tct.name AS type_name,
                   s.name AS specialty_name,
                   f.name AS facility_name
            FROM tele_service_pricing p
            LEFT JOIN tele_consultation_types tct ON p.type_id = tct.type_id
            LEFT JOIN specialties s ON p.specialty_id = s.specialties_id
            LEFT JOIN facilities f ON p.facility_id = f.facilities_id
            ${where}
            ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Tra cứu giá hiện hành */
    static async lookupPrice(typeId: string, specialtyId?: string, facilityId?: string): Promise<TeleServicePricing | null> {
        const r = await pool.query(`
            SELECT p.*, tct.name AS type_name
            FROM tele_service_pricing p
            LEFT JOIN tele_consultation_types tct ON p.type_id = tct.type_id
            WHERE p.type_id = $1
              AND ($2::varchar IS NULL OR p.specialty_id = $2)
              AND ($3::varchar IS NULL OR p.facility_id = $3)
              AND p.is_active = TRUE
              AND p.effective_from <= CURRENT_DATE
              AND (p.effective_to IS NULL OR p.effective_to >= CURRENT_DATE)
            ORDER BY p.effective_from DESC LIMIT 1
        `, [typeId, specialtyId || null, facilityId || null]);
        return r.rows[0] || null;
    }

    // ═══════════════════════════════════════════════════
    // SLA
    // ═══════════════════════════════════════════════════

    /** SLA dashboard: aggregate từ tele_consultations */
    static async getSlaDashboard(): Promise<any> {
        const r = await pool.query(`
            SELECT
                COUNT(*)::int AS total_consultations,
                COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
                ROUND(
                    (COUNT(*) FILTER (WHERE status = 'COMPLETED')::float /
                     NULLIF(COUNT(*)::float, 0) * 100)::numeric, 2
                )::float AS completion_rate
            FROM tele_consultations
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);
        return r.rows[0];
    }

    /** DS vi phạm SLA (consultations chờ lâu / bị cancel) */
    static async getSlaBreaches(page: number, limit: number): Promise<{ data: any[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_consultations tc
            WHERE tc.status = 'CANCELLED'
              AND tc.created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT tc.tele_consultations_id, tc.status, tc.cancel_reason,
                   tc.created_at, tc.scheduled_start, tc.actual_start,
                   up_pat.full_name AS patient_name, up_doc.full_name AS doctor_name
            FROM tele_consultations tc
            LEFT JOIN user_profiles up_pat ON tc.patient_id = up_pat.user_id
            LEFT JOIN user_profiles up_doc ON tc.doctor_id = up_doc.user_id
            WHERE tc.status = 'CANCELLED'
              AND tc.created_at >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY tc.created_at DESC LIMIT $1 OFFSET $2
        `, [limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }
}
