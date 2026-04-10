import { pool } from '../../config/postgresdb';
import {
    TeleConsultationType,
    TeleTypeSpecialtyConfig,
    PaginatedResult,
} from '../../models/Remote Consultation/tele-consultation-type.model';

export class TeleConsultationTypeRepository {

    // ═══════════════════════════════════════════════════
    // CONSULTATION TYPES
    // ═══════════════════════════════════════════════════

    /** Tạo loại hình khám từ xa */
    static async createType(data: Partial<TeleConsultationType>): Promise<TeleConsultationType> {
        const sql = `
            INSERT INTO tele_consultation_types (
                type_id, code, name, description, default_platform,
                requires_video, requires_audio, allows_file_sharing, allows_screen_sharing,
                default_duration_minutes, min_duration_minutes, max_duration_minutes,
                icon_url, sort_order, is_active, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.type_id, data.code, data.name, data.description || null,
            data.default_platform || 'AGORA',
            data.requires_video || false, data.requires_audio || false,
            data.allows_file_sharing || false, data.allows_screen_sharing || false,
            data.default_duration_minutes || 30, data.min_duration_minutes || 10,
            data.max_duration_minutes || 120, data.icon_url || null,
            data.sort_order || 0, data.is_active !== false, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật loại hình */
    static async updateType(typeId: string, data: Record<string, any>): Promise<TeleConsultationType> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [typeId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) { sets.push(`${key} = $${idx++}`); params.push(value); }
        }
        const sql = `UPDATE tele_consultation_types SET ${sets.join(', ')} WHERE type_id = $1 AND deleted_at IS NULL RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết loại hình */
    static async getTypeById(typeId: string): Promise<TeleConsultationType | null> {
        const sql = `
            SELECT t.*, up.full_name as created_by_name,
                   (SELECT COUNT(*) FROM tele_type_specialty_config c
                    WHERE c.type_id = t.type_id AND c.deleted_at IS NULL)::int as total_configs
            FROM tele_consultation_types t
            LEFT JOIN user_profiles up ON t.created_by = up.user_id
            WHERE t.type_id = $1 AND t.deleted_at IS NULL
        `;
        const result = await pool.query(sql, [typeId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tìm theo code */
    static async getTypeByCode(code: string): Promise<TeleConsultationType | null> {
        const sql = `SELECT * FROM tele_consultation_types WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(sql, [code]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tìm theo code (bao gồm cả soft-deleted) */
    static async getTypeByCodeIncludeDeleted(code: string): Promise<TeleConsultationType | null> {
        const sql = `SELECT * FROM tele_consultation_types WHERE code = $1`;
        const result = await pool.query(sql, [code]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách có phân trang */
    static async getTypes(
        isActive?: boolean, keyword?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<TeleConsultationType>> {
        const conditions: string[] = ['t.deleted_at IS NULL'];
        const params: any[] = [];
        let idx = 1;

        if (isActive !== undefined) { conditions.push(`t.is_active = $${idx++}`); params.push(isActive); }
        if (keyword) {
            conditions.push(`(t.name ILIKE $${idx} OR t.code ILIKE $${idx} OR t.description ILIKE $${idx})`);
            params.push(`%${keyword}%`); idx++;
        }

        const where = 'WHERE ' + conditions.join(' AND ');
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM tele_consultation_types t ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT t.*, up.full_name as created_by_name,
                   (SELECT COUNT(*) FROM tele_type_specialty_config c
                    WHERE c.type_id = t.type_id AND c.deleted_at IS NULL)::int as total_configs
            FROM tele_consultation_types t
            LEFT JOIN user_profiles up ON t.created_by = up.user_id
            ${where}
            ORDER BY t.sort_order ASC, t.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Danh sách active (cho dropdown) */
    static async getActiveTypes(): Promise<TeleConsultationType[]> {
        const sql = `
            SELECT t.*, 
                   (SELECT COUNT(*) FROM tele_type_specialty_config c
                    WHERE c.type_id = t.type_id AND c.deleted_at IS NULL AND c.is_enabled = TRUE)::int as total_configs
            FROM tele_consultation_types t
            WHERE t.is_active = TRUE AND t.deleted_at IS NULL
            ORDER BY t.sort_order ASC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    /** Soft delete */
    static async softDeleteType(typeId: string): Promise<void> {
        await pool.query(
            `UPDATE tele_consultation_types SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE type_id = $1`,
            [typeId]
        );
    }

    /** Đếm config đang sử dụng type */
    static async countConfigsByType(typeId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*) as cnt FROM tele_type_specialty_config WHERE type_id = $1 AND deleted_at IS NULL`,
            [typeId]
        );
        return parseInt(result.rows[0].cnt);
    }

    // ═══════════════════════════════════════════════════
    // SPECIALTY CONFIGS
    // ═══════════════════════════════════════════════════

    /** Tạo cấu hình chuyên khoa */
    static async createConfig(data: Partial<TeleTypeSpecialtyConfig>): Promise<TeleTypeSpecialtyConfig> {
        const sql = `
            INSERT INTO tele_type_specialty_config (
                config_id, type_id, specialty_id, facility_id, facility_service_id,
                is_enabled, allowed_platforms, min_duration_minutes, max_duration_minutes, default_duration_minutes,
                base_price, insurance_price, vip_price,
                max_patients_per_slot, advance_booking_days, cancellation_hours,
                auto_record, priority, notes, is_active, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.config_id, data.type_id, data.specialty_id, data.facility_id,
            data.facility_service_id || null,
            data.is_enabled !== false,
            data.allowed_platforms ? JSON.stringify(data.allowed_platforms) : '["AGORA"]',
            data.min_duration_minutes || null, data.max_duration_minutes || null,
            data.default_duration_minutes || null,
            data.base_price || 0, data.insurance_price || null, data.vip_price || null,
            data.max_patients_per_slot || 1, data.advance_booking_days || 30,
            data.cancellation_hours || 2,
            data.auto_record || false, data.priority || 0,
            data.notes || null, data.is_active !== false, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật cấu hình */
    static async updateConfig(configId: string, data: Record<string, any>): Promise<TeleTypeSpecialtyConfig> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [configId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                if (key === 'allowed_platforms' && Array.isArray(value)) {
                    sets.push(`${key} = $${idx++}`);
                    params.push(JSON.stringify(value));
                } else {
                    sets.push(`${key} = $${idx++}`);
                    params.push(value);
                }
            }
        }
        const sql = `UPDATE tele_type_specialty_config SET ${sets.join(', ')} WHERE config_id = $1 AND deleted_at IS NULL RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết cấu hình */
    static async getConfigById(configId: string): Promise<TeleTypeSpecialtyConfig | null> {
        const sql = `
            SELECT c.*, 
                   t.code as type_code, t.name as type_name,
                   s.name as specialty_name, s.code as specialty_code,
                   f.name as facility_name,
                   fs.service_name as facility_service_name,
                   up.full_name as created_by_name
            FROM tele_type_specialty_config c
            LEFT JOIN tele_consultation_types t ON c.type_id = t.type_id
            LEFT JOIN specialties s ON c.specialty_id = s.specialties_id
            LEFT JOIN facilities f ON c.facility_id = f.facilities_id
            LEFT JOIN facility_services fs ON c.facility_service_id = fs.facility_services_id
            LEFT JOIN user_profiles up ON c.created_by = up.user_id
            WHERE c.config_id = $1 AND c.deleted_at IS NULL
        `;
        const result = await pool.query(sql, [configId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Kiểm tra config trùng (type + specialty + facility) */
    static async findDuplicateConfig(typeId: string, specialtyId: string, facilityId: string): Promise<TeleTypeSpecialtyConfig | null> {
        const sql = `
            SELECT * FROM tele_type_specialty_config
            WHERE type_id = $1 AND specialty_id = $2 AND facility_id = $3 AND deleted_at IS NULL
        `;
        const result = await pool.query(sql, [typeId, specialtyId, facilityId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách cấu hình có phân trang */
    static async getConfigs(
        typeId?: string, specialtyId?: string, facilityId?: string,
        isEnabled?: boolean, isActive?: boolean,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<TeleTypeSpecialtyConfig>> {
        const conditions: string[] = ['c.deleted_at IS NULL'];
        const params: any[] = [];
        let idx = 1;

        if (typeId) { conditions.push(`c.type_id = $${idx++}`); params.push(typeId); }
        if (specialtyId) { conditions.push(`c.specialty_id = $${idx++}`); params.push(specialtyId); }
        if (facilityId) { conditions.push(`c.facility_id = $${idx++}`); params.push(facilityId); }
        if (isEnabled !== undefined) { conditions.push(`c.is_enabled = $${idx++}`); params.push(isEnabled); }
        if (isActive !== undefined) { conditions.push(`c.is_active = $${idx++}`); params.push(isActive); }

        const where = 'WHERE ' + conditions.join(' AND ');
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM tele_type_specialty_config c ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT c.*,
                   t.code as type_code, t.name as type_name,
                   s.name as specialty_name, s.code as specialty_code,
                   f.name as facility_name,
                   fs.service_name as facility_service_name,
                   up.full_name as created_by_name
            FROM tele_type_specialty_config c
            LEFT JOIN tele_consultation_types t ON c.type_id = t.type_id
            LEFT JOIN specialties s ON c.specialty_id = s.specialties_id
            LEFT JOIN facilities f ON c.facility_id = f.facilities_id
            LEFT JOIN facility_services fs ON c.facility_service_id = fs.facility_services_id
            LEFT JOIN user_profiles up ON c.created_by = up.user_id
            ${where}
            ORDER BY c.priority DESC, c.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Danh sách CK đã cấu hình cho 1 loại hình */
    static async getSpecialtiesByType(typeId: string, facilityId?: string): Promise<TeleTypeSpecialtyConfig[]> {
        const conditions = ['c.type_id = $1', 'c.deleted_at IS NULL'];
        const params: any[] = [typeId];
        let idx = 2;
        if (facilityId) { conditions.push(`c.facility_id = $${idx++}`); params.push(facilityId); }

        const sql = `
            SELECT c.*,
                   s.name as specialty_name, s.code as specialty_code,
                   f.name as facility_name
            FROM tele_type_specialty_config c
            LEFT JOIN specialties s ON c.specialty_id = s.specialties_id
            LEFT JOIN facilities f ON c.facility_id = f.facilities_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY c.priority DESC, s.name ASC
        `;
        const result = await pool.query(sql, params);
        return result.rows;
    }

    /** Danh sách loại hình khả dụng cho 1 CK */
    static async getTypesBySpecialty(specialtyId: string, facilityId?: string): Promise<any[]> {
        const conditions = [
            'c.specialty_id = $1', 'c.is_enabled = TRUE', 'c.is_active = TRUE', 'c.deleted_at IS NULL',
            't.is_active = TRUE', 't.deleted_at IS NULL',
        ];
        const params: any[] = [specialtyId];
        let idx = 2;
        if (facilityId) { conditions.push(`c.facility_id = $${idx++}`); params.push(facilityId); }

        const sql = `
            SELECT t.type_id, t.code, t.name, t.description, t.default_platform,
                   t.requires_video, t.requires_audio, t.allows_file_sharing, t.allows_screen_sharing,
                   c.config_id, c.facility_id, c.allowed_platforms,
                   COALESCE(c.default_duration_minutes, t.default_duration_minutes) as duration_minutes,
                   COALESCE(c.min_duration_minutes, t.min_duration_minutes) as min_duration,
                   COALESCE(c.max_duration_minutes, t.max_duration_minutes) as max_duration,
                   c.base_price, c.insurance_price, c.vip_price,
                   c.max_patients_per_slot, c.advance_booking_days, c.cancellation_hours,
                   c.auto_record,
                   f.name as facility_name
            FROM tele_type_specialty_config c
            JOIN tele_consultation_types t ON c.type_id = t.type_id
            LEFT JOIN facilities f ON c.facility_id = f.facilities_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY t.sort_order ASC, c.priority DESC
        `;
        const result = await pool.query(sql, params);
        return result.rows;
    }

    /** Soft delete config */
    static async softDeleteConfig(configId: string): Promise<void> {
        await pool.query(
            `UPDATE tele_type_specialty_config SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE config_id = $1`,
            [configId]
        );
    }

    // ═══════════════════════════════════════════════════
    // VALIDATION HELPERS
    // ═══════════════════════════════════════════════════

    /** Kiểm tra chuyên khoa tồn tại */
    static async specialtyExists(specialtyId: string): Promise<boolean> {
        const result = await pool.query(`SELECT 1 FROM specialties WHERE specialties_id = $1`, [specialtyId]);
        return result.rows.length > 0;
    }

    /** Kiểm tra cơ sở tồn tại */
    static async facilityExists(facilityId: string): Promise<boolean> {
        const result = await pool.query(`SELECT 1 FROM facilities WHERE facilities_id = $1`, [facilityId]);
        return result.rows.length > 0;
    }

    /** Kiểm tra dịch vụ cơ sở tồn tại */
    static async facilityServiceExists(serviceId: string): Promise<boolean> {
        const result = await pool.query(`SELECT 1 FROM facility_services WHERE facility_services_id = $1`, [serviceId]);
        return result.rows.length > 0;
    }

    // ═══════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════

    /** Thống kê tổng quan */
    static async getStats(): Promise<any> {
        const [types, configs, specialties, prices, topFacility] = await Promise.all([
            pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN is_active THEN 1 END) as active
                FROM tele_consultation_types WHERE deleted_at IS NULL
            `),
            pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN is_enabled THEN 1 END) as enabled
                FROM tele_type_specialty_config WHERE deleted_at IS NULL
            `),
            pool.query(`
                SELECT COUNT(DISTINCT specialty_id) as configured,
                       (SELECT COUNT(*) FROM specialties) as total
                FROM tele_type_specialty_config WHERE deleted_at IS NULL AND is_enabled = TRUE
            `),
            pool.query(`
                SELECT t.code,
                       COALESCE(AVG(c.base_price), 0) as avg_price,
                       COALESCE(MIN(c.base_price), 0) as min_price,
                       COALESCE(MAX(c.base_price), 0) as max_price
                FROM tele_consultation_types t
                LEFT JOIN tele_type_specialty_config c ON t.type_id = c.type_id AND c.deleted_at IS NULL
                WHERE t.deleted_at IS NULL
                GROUP BY t.code, t.sort_order
                ORDER BY t.sort_order ASC
            `),
            pool.query(`
                SELECT f.name as facility_name, COUNT(*) as config_count
                FROM tele_type_specialty_config c
                JOIN facilities f ON c.facility_id = f.facilities_id
                WHERE c.deleted_at IS NULL
                GROUP BY f.name
                ORDER BY config_count DESC
                LIMIT 5
            `),
        ]);
        return {
            total_types: parseInt(types.rows[0].total),
            active_types: parseInt(types.rows[0].active),
            total_configs: parseInt(configs.rows[0].total),
            enabled_configs: parseInt(configs.rows[0].enabled),
            specialties_configured: parseInt(specialties.rows[0].configured),
            specialties_total: parseInt(specialties.rows[0].total),
            specialties_unconfigured: parseInt(specialties.rows[0].total) - parseInt(specialties.rows[0].configured),
            price_by_type: prices.rows.map((r: any) => ({
                type_code: r.code,
                avg_price: parseFloat(r.avg_price).toFixed(0),
                min_price: parseFloat(r.min_price).toFixed(0),
                max_price: parseFloat(r.max_price).toFixed(0),
            })),
            top_facilities: topFacility.rows,
        };
    }

    /** Kiểm tra availability cho 1 CK + 1 cơ sở */
    static async checkAvailability(specialtyId: string, facilityId: string): Promise<any[]> {
        const sql = `
            SELECT t.type_id, t.code, t.name, t.description, t.default_platform, t.icon_url,
                   t.requires_video, t.requires_audio, t.allows_file_sharing, t.allows_screen_sharing,
                   c.config_id, c.allowed_platforms,
                   COALESCE(c.default_duration_minutes, t.default_duration_minutes) as duration_minutes,
                   COALESCE(c.min_duration_minutes, t.min_duration_minutes) as min_duration,
                   COALESCE(c.max_duration_minutes, t.max_duration_minutes) as max_duration,
                   c.base_price, c.insurance_price, c.vip_price,
                   c.max_patients_per_slot, c.advance_booking_days, c.cancellation_hours,
                   c.auto_record
            FROM tele_type_specialty_config c
            JOIN tele_consultation_types t ON c.type_id = t.type_id
            WHERE c.specialty_id = $1 AND c.facility_id = $2
              AND c.is_enabled = TRUE AND c.is_active = TRUE AND c.deleted_at IS NULL
              AND t.is_active = TRUE AND t.deleted_at IS NULL
            ORDER BY t.sort_order ASC, c.priority DESC
        `;
        const result = await pool.query(sql, [specialtyId, facilityId]);
        return result.rows;
    }
}
