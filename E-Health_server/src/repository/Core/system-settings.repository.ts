import { pool } from '../../config/postgresdb';
import { WorkingHoursDay, UpdateWorkingHoursInput, SlotConfig, UpdateSlotConfigInput, BusinessRule, SecurityConfig, UpdateSecurityConfigInput, I18nConfig, UpdateI18nConfigInput, UiSettings, UpdateUiSettingsInput } from '../../models/Core/system-settings.model';
import { SLOT_CONFIG_KEYS, DEFAULT_SLOT_CONFIG, DAY_OF_WEEK_LABELS, SECURITY_SETTING_KEYS, DEFAULT_SECURITY_CONFIG, I18N_SETTING_KEYS, UI_SETTING_KEYS, DEFAULT_UI_SETTINGS } from '../../constants/system.constant';

export class SystemSettingsRepository {
    /**
     * Lấy cấu hình giờ làm việc 7 ngày của facility.
     */
    static async getWorkingHours(facilityId: string): Promise<WorkingHoursDay[]> {
        const query = `
            SELECT
                operation_hours_id,
                day_of_week,
                TO_CHAR(open_time,  'HH24:MI') AS open_time,
                TO_CHAR(close_time, 'HH24:MI') AS close_time,
                is_closed
            FROM facility_operation_hours
            WHERE facility_id = $1
            ORDER BY day_of_week ASC
        `;
        const result = await pool.query(query, [facilityId]);

        return result.rows.map((row: any) => ({
            ...row,
            day_label: DAY_OF_WEEK_LABELS[row.day_of_week] ?? `Ngày ${row.day_of_week}`,
        }));
    }

    /**
     * UPSERT cấu hình giờ làm việc.
     */
    static async upsertWorkingHours(
        facilityId: string,
        days: UpdateWorkingHoursInput['days'],
        operationHoursIdGen: (index: number) => string,
    ): Promise<void> {
        for (const day of days) {
            const id = operationHoursIdGen(day.day_of_week);
            const query = `
                INSERT INTO facility_operation_hours
                    (operation_hours_id, facility_id, day_of_week, open_time, close_time, is_closed)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (facility_id, day_of_week)
                DO UPDATE SET
                    open_time  = COALESCE(EXCLUDED.open_time,  facility_operation_hours.open_time),
                    close_time = COALESCE(EXCLUDED.close_time, facility_operation_hours.close_time),
                    is_closed  = COALESCE(EXCLUDED.is_closed,  facility_operation_hours.is_closed)
            `;
            await pool.query(query, [
                id,
                facilityId,
                day.day_of_week,
                day.open_time ?? '08:00',
                day.close_time ?? '17:00',
                day.is_closed ?? false,
            ]);
        }
    }

    /**
     * Lấy cấu hình slot từ system_settings.
     */
    static async getSlotConfig(): Promise<SlotConfig> {
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const keys = [SLOT_CONFIG_KEYS.DURATION_MINUTES, SLOT_CONFIG_KEYS.MAX_PATIENTS];
        const result = await pool.query(query, [keys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        return {
            duration_minutes: map[SLOT_CONFIG_KEYS.DURATION_MINUTES]?.value
                ?? DEFAULT_SLOT_CONFIG.duration_minutes,
            max_patients_per_slot: map[SLOT_CONFIG_KEYS.MAX_PATIENTS]?.value
                ?? DEFAULT_SLOT_CONFIG.max_patients_per_slot,
        };
    }

    /**
     * UPSERT cấu hình slot vào system_settings.
     */
    static async upsertSlotConfig(
        config: UpdateSlotConfigInput,
        updatedBy: string,
        idGen: (key: string) => string,
    ): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, description, updated_by, updated_at)
            VALUES ($1, $2, $3::json, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        if (config.duration_minutes !== undefined) {
            await pool.query(upsertQuery, [
                idGen(SLOT_CONFIG_KEYS.DURATION_MINUTES),
                SLOT_CONFIG_KEYS.DURATION_MINUTES,
                JSON.stringify({ value: config.duration_minutes }),
                'Thời lượng 1 slot khám bệnh (phút)',
                updatedBy,
            ]);
        }

        if (config.max_patients_per_slot !== undefined) {
            await pool.query(upsertQuery, [
                idGen(SLOT_CONFIG_KEYS.MAX_PATIENTS),
                SLOT_CONFIG_KEYS.MAX_PATIENTS,
                JSON.stringify({ value: config.max_patients_per_slot }),
                'Số bệnh nhân tối đa mỗi slot',
                updatedBy,
            ]);
        }
    }

    // BUSINESS RULES

    /**
     * Lấy tất cả business rules từ system_settings.
     */
    static async getAllBusinessRules(module?: string): Promise<BusinessRule[]> {
        const query = `
            SELECT system_settings_id, setting_key, setting_value,
                   module, description, updated_by, updated_at
            FROM system_settings
            WHERE module IS NOT NULL AND module != 'GENERAL'
              AND ($1::text IS NULL OR module = $1)
            ORDER BY module ASC, setting_key ASC
        `;
        const result = await pool.query(query, [module ?? null]);

        return result.rows.map((row: any) => ({
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        }));
    }

    /**
     * Lấy 1 business rule theo setting_key.
     */
    static async getBusinessRuleByKey(key: string): Promise<BusinessRule | null> {
        const query = `
            SELECT system_settings_id, setting_key, setting_value,
                   module, description, updated_by, updated_at
            FROM system_settings
            WHERE setting_key = $1
              AND module IS NOT NULL AND module != 'GENERAL'
        `;
        const result = await pool.query(query, [key]);
        if (!result.rows[0]) return null;

        const row = result.rows[0];
        return {
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        };
    }

    /**
     * UPSERT 1 business rule theo setting_key.
     */
    static async upsertBusinessRule(
        key: string,
        value: number | boolean,
        updatedBy: string,
    ): Promise<BusinessRule> {
        const id = `SS_BR_${key.substring(0, 10)}`.replace(/\s/g, '_');
        const query = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, updated_by, updated_at)
            VALUES ($1, $2, $3::json, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
            RETURNING system_settings_id, setting_key, setting_value,
                      module, description, updated_by, updated_at
        `;
        const result = await pool.query(query, [
            id,
            key,
            JSON.stringify({ value }),
            updatedBy,
        ]);

        const row = result.rows[0];
        return {
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        };
    }

    /**
     * Bulk UPSERT nhiều business rules trong 1 transaction.
     */
    static async bulkUpsertBusinessRules(
        rules: Array<{ key: string; value: number | boolean }>,
        updatedBy: string,
    ): Promise<BusinessRule[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results: BusinessRule[] = [];
            for (const { key, value } of rules) {
                const id = `SS_BR_${key.substring(0, 10)}`.replace(/\s/g, '_');
                const query = `
                    INSERT INTO system_settings
                        (system_settings_id, setting_key, setting_value, updated_by, updated_at)
                    VALUES ($1, $2, $3::json, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (setting_key)
                    DO UPDATE SET
                        setting_value = EXCLUDED.setting_value,
                        updated_by    = EXCLUDED.updated_by,
                        updated_at    = CURRENT_TIMESTAMP
                    RETURNING system_settings_id, setting_key, setting_value,
                              module, description, updated_by, updated_at
                `;
                const res = await client.query(query, [
                    id,
                    key,
                    JSON.stringify({ value }),
                    updatedBy,
                ]);
                const row = res.rows[0];
                results.push({
                    system_settings_id: row.system_settings_id,
                    setting_key: row.setting_key,
                    value: row.setting_value?.value,
                    module: row.module,
                    description: row.description,
                    updated_by: row.updated_by,
                    updated_at: row.updated_at,
                });
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

    // ============================================================
    // SECURITY SETTINGS (1.4.4)
    // ============================================================

    /**
     * Đọc 8 security setting keys từ DB và map thành SecurityConfig.
     * Fallback về DEFAULT_SECURITY_CONFIG nếu key chưa tồn tại.
     */
    static async getSecurityConfig(): Promise<SecurityConfig> {
        const allKeys = Object.values(SECURITY_SETTING_KEYS);
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const result = await pool.query(query, [allKeys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        const def = DEFAULT_SECURITY_CONFIG;
        return {
            max_login_attempts: map[SECURITY_SETTING_KEYS.MAX_LOGIN_ATTEMPTS]?.value ?? def.max_login_attempts,
            lock_duration_minutes: map[SECURITY_SETTING_KEYS.LOCK_ACCOUNT_DURATION_MINUTES]?.value ?? def.lock_duration_minutes,
            require_email_verification: map[SECURITY_SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION]?.value ?? def.require_email_verification,
            password_min_length: map[SECURITY_SETTING_KEYS.PASSWORD_MIN_LENGTH]?.value ?? def.password_min_length,
            session_duration_days: map[SECURITY_SETTING_KEYS.SESSION_DURATION_DAYS]?.value ?? def.session_duration_days,
            // REQUIRE_2FA_ROLES lưu dạng JSON array: {"value": ["ADMIN", ...]}
            require_2fa_roles: Array.isArray(map[SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES]?.value)
                ? map[SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES].value
                : [...def.require_2fa_roles],
            access_token_expiry_minutes: map[SECURITY_SETTING_KEYS.ACCESS_TOKEN_EXPIRY_MINUTES]?.value ?? def.access_token_expiry_minutes,
            refresh_token_expiry_days: map[SECURITY_SETTING_KEYS.REFRESH_TOKEN_EXPIRY_DAYS]?.value ?? def.refresh_token_expiry_days,
        };
    }

    /**
     * Partial UPSERT từng security setting key được truyền vào.
     * Mỗi field map sang setting_key tương ứng.
     */
    static async upsertSecurityConfig(
        config: UpdateSecurityConfigInput,
        updatedBy: string,
    ): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, module, updated_by, updated_at)
            VALUES ($1, $2, $3::json, 'SECURITY', $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        // Map từ UpdateSecurityConfigInput field → setting_key
        const fieldKeyMap: Array<[keyof UpdateSecurityConfigInput, string]> = [
            ['max_login_attempts', SECURITY_SETTING_KEYS.MAX_LOGIN_ATTEMPTS],
            ['lock_duration_minutes', SECURITY_SETTING_KEYS.LOCK_ACCOUNT_DURATION_MINUTES],
            ['require_email_verification', SECURITY_SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION],
            ['password_min_length', SECURITY_SETTING_KEYS.PASSWORD_MIN_LENGTH],
            ['session_duration_days', SECURITY_SETTING_KEYS.SESSION_DURATION_DAYS],
            ['require_2fa_roles', SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES],
            ['access_token_expiry_minutes', SECURITY_SETTING_KEYS.ACCESS_TOKEN_EXPIRY_MINUTES],
            ['refresh_token_expiry_days', SECURITY_SETTING_KEYS.REFRESH_TOKEN_EXPIRY_DAYS],
        ];

        for (const [field, key] of fieldKeyMap) {
            if (config[field] !== undefined) {
                const id = `SS_SEC_${key.replace(/_/g, '').substring(0, 12)}`;
                await pool.query(upsertQuery, [
                    id,
                    key,
                    JSON.stringify({ value: config[field] }),
                    updatedBy,
                ]);
            }
        }
    }

    // SYSTEM PARAMS CRUD 

    /**
     * Lấy danh sách settings có phân trang + filter theo module/search.
     */
    static async listSettings(filters: {
        module?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<import('../../models/Core/system-settings.model').SystemSettingsPaginated> {
        const { PROTECTED_SETTING_KEYS } = await import('../../constants/system.constant');

        const conditions: string[] = ['is_deleted = FALSE'];
        const params: any[] = [];
        let idx = 1;

        if (filters.module) {
            conditions.push(`module = $${idx++}`);
            params.push(filters.module);
        }
        if (filters.search) {
            conditions.push(`(setting_key ILIKE $${idx} OR description ILIKE $${idx})`);
            params.push(`%${filters.search}%`);
            idx++;
        }

        const where = `WHERE ${conditions.join(' AND ')}`;
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM system_settings ${where}`, params,
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const dataResult = await pool.query(
            `SELECT system_settings_id, setting_key, setting_value, module, description, updated_by, updated_at
             FROM system_settings ${where}
             ORDER BY module, setting_key
             LIMIT $${idx} OFFSET $${idx + 1}`,
            [...params, filters.limit, offset],
        );

        const data: import('../../models/Core/system-settings.model').SystemSettingRow[] = dataResult.rows.map((r: any) => ({
            ...r,
            is_protected: PROTECTED_SETTING_KEYS.has(r.setting_key),
        }));

        return { data, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) };
    }

    /** Lấy danh sách module distinct để dùng trong filter dropdown. */
    static async getDistinctModules(): Promise<string[]> {
        const result = await pool.query(
            `SELECT DISTINCT module FROM system_settings WHERE module IS NOT NULL ORDER BY module`,
        );
        return result.rows.map((r: any) => r.module as string);
    }

    /** Lấy 1 setting theo key kèm is_protected. Trả null nếu không tìm thấy. */
    static async getSettingByKey(
        key: string,
    ): Promise<import('../../models/Core/system-settings.model').SystemSettingRow | null> {
        const { PROTECTED_SETTING_KEYS } = await import('../../constants/system.constant');
        const result = await pool.query(
            `SELECT system_settings_id, setting_key, setting_value, module, description, updated_by, updated_at
             FROM system_settings WHERE setting_key = $1 AND is_deleted = FALSE`,
            [key],
        );
        if (!result.rows[0]) return null;
        return { ...result.rows[0], is_protected: PROTECTED_SETTING_KEYS.has(key) };
    }

    /** Tạo mới setting. ID do service cung cấp để đảm bảo unique. */
    static async createSetting(
        input: import('../../models/Core/system-settings.model').CreateSystemSettingInput,
        id: string,
        updatedBy: string,
    ): Promise<import('../../models/Core/system-settings.model').SystemSettingRow> {
        const result = await pool.query(
            `INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, module, description, updated_by, updated_at)
             VALUES ($1, $2, $3::json, $4, $5, $6, CURRENT_TIMESTAMP)
             RETURNING system_settings_id, setting_key, setting_value, module, description, updated_by, updated_at`,
            [id, input.setting_key, JSON.stringify(input.setting_value), input.module ?? 'GENERAL', input.description ?? null, updatedBy],
        );
        return { ...result.rows[0], is_protected: false };
    }

    /** Cập nhật setting_value (và optionally description) của 1 key. */
    static async updateSetting(
        key: string,
        input: import('../../models/Core/system-settings.model').UpdateSystemSettingInput,
        updatedBy: string,
    ): Promise<import('../../models/Core/system-settings.model').SystemSettingRow> {
        const { PROTECTED_SETTING_KEYS } = await import('../../constants/system.constant');
        const setParts = ['setting_value = $2::json', 'updated_by = $3', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [key, JSON.stringify(input.setting_value), updatedBy];

        if (input.description !== undefined) {
            setParts.push(`description = $${params.length + 1}`);
            params.push(input.description);
        }

        const result = await pool.query(
            `UPDATE system_settings SET ${setParts.join(', ')} WHERE setting_key = $1
             RETURNING system_settings_id, setting_key, setting_value, module, description, updated_by, updated_at`,
            params,
        );
        return { ...result.rows[0], is_protected: PROTECTED_SETTING_KEYS.has(key) };
    }

    // Xóa mềm setting theo key
    static async deleteSetting(key: string): Promise<void> {
        await pool.query(
            `UPDATE system_settings SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $1`,
            [key],
        );
    }

    // I18N (1.4.5)

    /**
     * Đọc DEFAULT_LANGUAGE và SUPPORTED_LANGUAGES từ DB.
     */
    static async getI18nConfig(): Promise<I18nConfig> {
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const keys = [I18N_SETTING_KEYS.DEFAULT_LANGUAGE, I18N_SETTING_KEYS.SUPPORTED_LANGUAGES];
        const result = await pool.query(query, [keys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        return {
            default_language: map[I18N_SETTING_KEYS.DEFAULT_LANGUAGE]?.value ?? 'vi',
            supported_languages: Array.isArray(map[I18N_SETTING_KEYS.SUPPORTED_LANGUAGES]?.value)
                ? map[I18N_SETTING_KEYS.SUPPORTED_LANGUAGES].value
                : ['vi'],
        };
    }

    /**
     * UPSERT DEFAULT_LANGUAGE và/hoặc SUPPORTED_LANGUAGES.
     */
    static async upsertI18nConfig(config: UpdateI18nConfigInput, updatedBy: string): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, module, updated_by, updated_at)
            VALUES ($1, $2, $3::json, 'I18N', $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        if (config.default_language !== undefined) {
            await pool.query(upsertQuery, [
                'SS_I18N_001',
                I18N_SETTING_KEYS.DEFAULT_LANGUAGE,
                JSON.stringify({ value: config.default_language }),
                updatedBy,
            ]);
        }

        if (config.supported_languages !== undefined) {
            await pool.query(upsertQuery, [
                'SS_I18N_002',
                I18N_SETTING_KEYS.SUPPORTED_LANGUAGES,
                JSON.stringify({ value: config.supported_languages }),
                updatedBy,
            ]);
        }
    }

    // UI SETTINGS 

    /**
     * Đọc 6 UI setting keys từ DB và map thành UiSettings object.
     */
    static async getUiSettings(): Promise<UiSettings> {
        const allKeys = Object.values(UI_SETTING_KEYS);
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const result = await pool.query(query, [allKeys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        const def = DEFAULT_UI_SETTINGS;
        return {
            theme: map[UI_SETTING_KEYS.THEME]?.value ?? def.theme,
            primary_color: map[UI_SETTING_KEYS.PRIMARY_COLOR]?.value ?? def.primary_color,
            font_family: map[UI_SETTING_KEYS.FONT_FAMILY]?.value ?? def.font_family,
            date_format: map[UI_SETTING_KEYS.DATE_FORMAT]?.value ?? def.date_format,
            timezone: map[UI_SETTING_KEYS.TIMEZONE]?.value ?? def.timezone,
            time_format: map[UI_SETTING_KEYS.TIME_FORMAT]?.value ?? def.time_format,
        };
    }

    /**
     * Partial UPSERT từng UI setting key được truyền vào.
     */
    static async upsertUiSettings(config: UpdateUiSettingsInput, updatedBy: string): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, module, updated_by, updated_at)
            VALUES ($1, $2, $3::json, 'UI', $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        const fieldKeyMap: Array<[keyof UpdateUiSettingsInput, string, string]> = [
            ['theme', UI_SETTING_KEYS.THEME, 'SS_UI_001'],
            ['primary_color', UI_SETTING_KEYS.PRIMARY_COLOR, 'SS_UI_002'],
            ['font_family', UI_SETTING_KEYS.FONT_FAMILY, 'SS_UI_003'],
            ['date_format', UI_SETTING_KEYS.DATE_FORMAT, 'SS_UI_004'],
            ['timezone', UI_SETTING_KEYS.TIMEZONE, 'SS_UI_005'],
            ['time_format', UI_SETTING_KEYS.TIME_FORMAT, 'SS_UI_006'],
        ];

        for (const [field, key, id] of fieldKeyMap) {
            if (config[field] !== undefined) {
                await pool.query(upsertQuery, [
                    id,
                    key,
                    JSON.stringify({ value: config[field] }),
                    updatedBy,
                ]);
            }
        }
    }
}

