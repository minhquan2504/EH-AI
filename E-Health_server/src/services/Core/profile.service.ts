import bcrypt from 'bcrypt';
import { ProfileRepository } from '../../repository/Core/profile.repository';
import { UserRepository } from '../../repository/Core/user.repository';
import { UserSessionRepository } from '../../repository/Core/auth_user-session.repository';
import { MasterDataItemRepository } from '../../repository/Core/master-data-item.repository';
import { AppError } from '../../utils/app-error.util';
import { UserProfileResponse, UpdateProfileInput, ChangePasswordInput, UpdateSettingsInput, SessionResponse } from '../../models/Core/profile.model';

export class ProfileService {
    /**
     * Lấy thông tin hồ sơ người dùng
     */
    static async getMyProfile(userId: string): Promise<UserProfileResponse> {
        const profile = await ProfileRepository.getProfileByUserId(userId);
        if (!profile) {
            throw new AppError(404, 'PROFILE_NOT_FOUND', 'Không tìm thấy thông tin hồ sơ người dùng.');
        }
        return profile;
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân
     */
    static async updateMyProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileResponse> {
        // Validation
        if (input.gender) {
            const genderItem = await MasterDataItemRepository.getItemByCode('GENDER', input.gender);
            if (!genderItem || !genderItem.is_active) {
                throw new AppError(400, 'PROFILE_INVALID_GENDER', 'Giới tính không hợp lệ theo quy chuẩn của Master Data.');
            }
        }

        // Thực hiện update
        const updated = await ProfileRepository.updateProfile(userId, input);
        if (!updated) {
            throw new AppError(400, 'PROFILE_UPDATE_FAILED', 'Cập nhật hồ sơ thất bại.');
        }

        return this.getMyProfile(userId);
    }

    /**
     * Thay đổi mật khẩu người dùng
     */
    static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
        // Lấy mật khẩu cũ để kiểm tra
        const currentHash = await UserRepository.getUserPasswordHash(userId);
        if (!currentHash) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại.');
        }

        // So khớp mật khẩu cũ
        const isMatch = await bcrypt.compare(input.old_password, currentHash);
        if (!isMatch) {
            throw new AppError(400, 'PASSWORD_INCORRECT', 'Mật khẩu cũ không chính xác.');
        }

        // Hash và cập nhật mật khẩu mới
        const newHash = await bcrypt.hash(input.new_password, 10);
        const updated = await UserRepository.updateUserPassword(userId, newHash);

        if (!updated) {
            throw new AppError(400, 'PASSWORD_UPDATE_FAILED', 'Cập nhật mật khẩu thất bại.');
        }

        await UserSessionRepository.revokeAllByAccount(userId);
    }

    /**
     * Lấy lịch sử phiên đăng nhập của người dùng
     */
    static async getMySessions(userId: string, currentSessionId: string): Promise<SessionResponse[]> {
        const sessions = await UserSessionRepository.findActiveByAccount(userId);

        return sessions.map((session: any) => ({
            user_sessions_id: session.user_sessions_id,
            device_name: session.device_name,
            ip_address: session.ip_address,
            last_used_at: session.last_used_at,
            expired_at: session.expired_at,
            revoked_at: session.revoked_at,
            is_current: session.user_sessions_id === currentSessionId
        }));
    }

    /**
     * Đăng xuất / thu hồi 1 thiết bị đăng nhập khác
     */
    static async revokeSession(userId: string, sessionIdToRevoke: string, currentSessionId: string): Promise<void> {
        if (sessionIdToRevoke === currentSessionId) {
            throw new AppError(400, 'SESSION_REVOKE_CURRENT', 'Không thể thu hồi phiên đăng nhập hiện tại bằng API này. Vui lòng dùng tính năng Đăng xuất.');
        }

        const success = await UserSessionRepository.revokeBySessionId(sessionIdToRevoke, userId);
        if (!success) {
            throw new AppError(404, 'SESSION_NOT_FOUND', 'Không tìm thấy phiên đăng nhập hoặc phiên đã bị thu hồi.');
        }
    }

    /**
     * Đăng xuất tất cả thiết bị khác
     */
    static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
        const sessions = await UserSessionRepository.findActiveByAccount(userId);

        for (const session of sessions) {
            if (session.user_sessions_id !== currentSessionId) {
                await UserSessionRepository.revokeBySessionId(session.user_sessions_id, userId);
            }
        }
    }

    /**
     * Cập nhật Cài đặt cá nhân
     */
    static async updateMySettings(userId: string, input: UpdateSettingsInput): Promise<UserProfileResponse> {
        const updated = await ProfileRepository.updateSettings(userId, input);
        if (!updated) {
            throw new AppError(400, 'SETTINGS_UPDATE_FAILED', 'Cập nhật cài đặt thất bại.');
        }

        return this.getMyProfile(userId);
    }
}
