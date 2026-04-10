import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { I18nConfig, LangMeta, UpdateI18nConfigInput, } from '../../models/Core/system-settings.model';
import { AVAILABLE_LANGUAGES, VALID_LANGUAGE_CODES, I18N_ERRORS, } from '../../constants/system.constant';

export class I18nSettingsService {
    /**
     * Lấy toàn bộ danh sách ngôn ngữ tĩnh kèm trạng thái kích hoạt.
     */
    static async getSupportedLanguages(): Promise<LangMeta[]> {
        const config = await SystemSettingsRepository.getI18nConfig();
        const activeSet = new Set(config.supported_languages);

        return AVAILABLE_LANGUAGES.map(lang => ({
            ...lang,
            is_active: activeSet.has(lang.code),
        }));
    }

    /**
     * Lấy cấu hình ngôn ngữ hiện tại (ngôn ngữ mặc định + danh sách đang bật).
     */
    static async getI18nConfig(): Promise<I18nConfig> {
        return await SystemSettingsRepository.getI18nConfig();
    }

    /**
     * Validate rồi cập nhật cấu hình ngôn ngữ.
     */
    static async updateI18nConfig(input: UpdateI18nConfigInput, updatedBy: string): Promise<I18nConfig> {
        // Lấy config hiện tại để merge validate
        const current = await SystemSettingsRepository.getI18nConfig();
        const finalSupported = input.supported_languages ?? current.supported_languages;
        const finalDefault = input.default_language ?? current.default_language;

        // Validate supported_languages
        if (input.supported_languages !== undefined) {
            if (input.supported_languages.length === 0) {
                throw I18N_ERRORS.MIN_ONE_LANGUAGE;
            }
            for (const code of input.supported_languages) {
                if (!VALID_LANGUAGE_CODES.has(code as any)) {
                    throw I18N_ERRORS.INVALID_LANGUAGE_CODE;
                }
            }
        }

        // Validate default_language nằm trong finalSupported
        if (!finalSupported.includes(finalDefault)) {
            throw I18N_ERRORS.DEFAULT_LANG_NOT_IN_SUPPORTED;
        }

        await SystemSettingsRepository.upsertI18nConfig(input, updatedBy);
        return await SystemSettingsRepository.getI18nConfig();
    }
}
