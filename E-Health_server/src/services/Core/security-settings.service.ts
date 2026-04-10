import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { SecurityConfig, UpdateSecurityConfigInput } from '../../models/Core/system-settings.model';
import { SECURITY_SETTING_ERRORS, DEFAULT_SECURITY_CONFIG } from '../../constants/system.constant';

export class SecuritySettingsService {
    /**
     * Lấy toàn bộ cấu hình bảo mật dưới dạng SecurityConfig object.
     */
    static async getSecurityConfig(): Promise<SecurityConfig> {
        return await SystemSettingsRepository.getSecurityConfig();
    }

    /**
     * Validate các field bảo mật rồi upsert vào DB.
     */
    static async updateSecurityConfig(
        input: UpdateSecurityConfigInput,
        updatedBy: string,
    ): Promise<SecurityConfig> {
        SecuritySettingsService.validateInput(input);

        await SystemSettingsRepository.upsertSecurityConfig(input, updatedBy);
        return await SystemSettingsRepository.getSecurityConfig();
    }

    /**
     * Validate từng field theo business rules bảo mật.
     */
    private static validateInput(input: UpdateSecurityConfigInput): void {
        const { DEFAULT_SECURITY_CONFIG: defaults } = { DEFAULT_SECURITY_CONFIG };

        if (input.password_min_length !== undefined) {
            if (!Number.isInteger(input.password_min_length) ||
                input.password_min_length < 8 ||
                input.password_min_length > 32) {
                throw SECURITY_SETTING_ERRORS.INVALID_PASSWORD_LENGTH;
            }
        }

        if (input.session_duration_days !== undefined) {
            if (!Number.isInteger(input.session_duration_days) ||
                input.session_duration_days < 1 ||
                input.session_duration_days > 365) {
                throw SECURITY_SETTING_ERRORS.INVALID_SESSION_DURATION;
            }
        }

        if (input.access_token_expiry_minutes !== undefined) {
            if (!Number.isInteger(input.access_token_expiry_minutes) ||
                input.access_token_expiry_minutes < 5 ||
                input.access_token_expiry_minutes > 1440) {
                throw SECURITY_SETTING_ERRORS.INVALID_TOKEN_EXPIRY;
            }
        }

        if (input.refresh_token_expiry_days !== undefined) {
            if (!Number.isInteger(input.refresh_token_expiry_days) ||
                input.refresh_token_expiry_days < 1 ||
                input.refresh_token_expiry_days > 365) {
                throw SECURITY_SETTING_ERRORS.INVALID_TOKEN_EXPIRY;
            }
        }

        if (input.max_login_attempts !== undefined) {
            if (!Number.isInteger(input.max_login_attempts) ||
                input.max_login_attempts < 3 ||
                input.max_login_attempts > 20) {
                throw SECURITY_SETTING_ERRORS.INVALID_SESSION_DURATION;
            }
        }

        if (input.lock_duration_minutes !== undefined) {
            if (!Number.isInteger(input.lock_duration_minutes) ||
                input.lock_duration_minutes < 5 ||
                input.lock_duration_minutes > 1440) {
                throw SECURITY_SETTING_ERRORS.INVALID_SESSION_DURATION;
            }
        }
    }
}
