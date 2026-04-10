import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { SystemSettingRow, SystemSettingsPaginated, CreateSystemSettingInput, UpdateSystemSettingInput, } from '../../models/Core/system-settings.model';
import { PROTECTED_SETTING_KEYS, SYSTEM_SETTINGS_ERRORS, } from '../../constants/system.constant';
import { randomUUID } from 'crypto';

export class SystemParamsService {
    /**
     * Lấy danh sách settings có phân trang và filter.
     */
    static async listSettings(filters: {
        module?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<SystemSettingsPaginated> {
        return await SystemSettingsRepository.listSettings(filters);
    }

    /**
     * Lấy danh sách module distinct để dùng cho dropdown filter.
     */
    static async getDistinctModules(): Promise<string[]> {
        return await SystemSettingsRepository.getDistinctModules();
    }

    /**
     * Lấy 1 setting theo key. Ném 404 nếu không tìm thấy.
     */
    static async getSettingByKey(key: string): Promise<SystemSettingRow> {
        const row = await SystemSettingsRepository.getSettingByKey(key);
        if (!row) throw SYSTEM_SETTINGS_ERRORS.KEY_NOT_FOUND;
        return row;
    }

    /**
     * Tạo mới setting. Ném 409 nếu key đã tồn tại.
     * setting_value phải là JSON object.
     */
    static async createSetting(
        input: CreateSystemSettingInput,
        updatedBy: string,
    ): Promise<SystemSettingRow> {
        // Validate JSON object
        if (typeof input.setting_value !== 'object' || Array.isArray(input.setting_value)) {
            throw SYSTEM_SETTINGS_ERRORS.INVALID_VALUE;
        }

        const existing = await SystemSettingsRepository.getSettingByKey(input.setting_key);
        if (existing) throw SYSTEM_SETTINGS_ERRORS.KEY_EXISTS;

        const id = `SS_CUSTOM_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
        return await SystemSettingsRepository.createSetting(input, id, updatedBy);
    }

    /**
     * Cập nhật giá trị setting theo key. Ném 404 nếu không tìm thấy.
     */
    static async updateSetting(
        key: string,
        input: UpdateSystemSettingInput,
        updatedBy: string,
    ): Promise<SystemSettingRow> {
        if (typeof input.setting_value !== 'object' || Array.isArray(input.setting_value)) {
            throw SYSTEM_SETTINGS_ERRORS.INVALID_VALUE;
        }

        const existing = await SystemSettingsRepository.getSettingByKey(key);
        if (!existing) throw SYSTEM_SETTINGS_ERRORS.KEY_NOT_FOUND;

        return await SystemSettingsRepository.updateSetting(key, input, updatedBy);
    }

    /**
     * Xóa setting. Ném 403 nếu là protected key, 404 nếu không tồn tại.
     */
    static async deleteSetting(key: string): Promise<void> {
        if (PROTECTED_SETTING_KEYS.has(key)) throw SYSTEM_SETTINGS_ERRORS.PROTECTED_KEY;

        const existing = await SystemSettingsRepository.getSettingByKey(key);
        if (!existing) throw SYSTEM_SETTINGS_ERRORS.KEY_NOT_FOUND;

        await SystemSettingsRepository.deleteSetting(key);
    }
}
