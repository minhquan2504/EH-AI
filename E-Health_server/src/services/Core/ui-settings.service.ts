import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { UiSettings, UpdateUiSettingsInput } from '../../models/Core/system-settings.model';
import {
    ALLOWED_THEMES,
    ALLOWED_FONTS,
    ALLOWED_DATE_FORMATS,
    ALLOWED_TIME_FORMATS,
    ALLOWED_TIMEZONES,
    HEX_COLOR_REGEX,
    UI_ERRORS,
} from '../../constants/system.constant';

export class UiSettingsService {
    /**
     * Lấy toàn bộ cấu hình giao diện.
     */
    static async getUiSettings(): Promise<UiSettings> {
        return await SystemSettingsRepository.getUiSettings();
    }

    /**
     * Validate từng field theo whitelist rồi upsert vào DB.
     */
    static async updateUiSettings(input: UpdateUiSettingsInput, updatedBy: string): Promise<UiSettings> {
        UiSettingsService.validateInput(input);
        await SystemSettingsRepository.upsertUiSettings(input, updatedBy);
        return await SystemSettingsRepository.getUiSettings();
    }

    /** Validate từng field tùy chọn theo whitelist/regex */
    private static validateInput(input: UpdateUiSettingsInput): void {
        if (input.theme !== undefined && !(ALLOWED_THEMES as readonly string[]).includes(input.theme)) {
            throw UI_ERRORS.INVALID_THEME;
        }
        if (input.primary_color !== undefined && !HEX_COLOR_REGEX.test(input.primary_color)) {
            throw UI_ERRORS.INVALID_COLOR;
        }
        if (input.font_family !== undefined && !(ALLOWED_FONTS as readonly string[]).includes(input.font_family)) {
            throw UI_ERRORS.INVALID_FONT;
        }
        if (input.date_format !== undefined && !(ALLOWED_DATE_FORMATS as readonly string[]).includes(input.date_format)) {
            throw UI_ERRORS.INVALID_DATE_FORMAT;
        }
        if (input.timezone !== undefined && !(ALLOWED_TIMEZONES as readonly string[]).includes(input.timezone)) {
            throw UI_ERRORS.INVALID_TIMEZONE;
        }
        if (input.time_format !== undefined && !(ALLOWED_TIME_FORMATS as readonly string[]).includes(input.time_format)) {
            throw UI_ERRORS.INVALID_TIME_FORMAT;
        }
    }
}
