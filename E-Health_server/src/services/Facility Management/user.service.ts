import { UserRepository } from '../../repository/Core/user.repository';
import { CreateUserInput, UpdateUserByAdminInput, UserQueryFilter, PaginatedUsers, UserDetail, UpdateUserStatusInput, AccountStatusHistory, ResetPasswordAdminInput, ChangePasswordInput, AssignRoleInput } from '../../models/Core/user.model';
import { SecurityUtil } from '../../utils/auth-security.util';
import { AuthMailUtil } from '../../utils/auth-mail.util';
import { AppError } from '../../utils/app-error.util';
import { randomBytes } from 'crypto';

export class UserService {
    /**
     * Tạo user mới từ Admin
     */
    static async createUser(
        data: CreateUserInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<{ userId: string }> {
        // Validate
        if (!data.email && !data.phone) {
            throw new AppError(400, 'USER_MISSING_CONTACT', 'Vui lòng cung cấp ít nhất Email hoặc Số điện thoại.');
        }

        if (!data.roles || data.roles.length === 0) {
            throw new AppError(400, 'USER_MISSING_ROLE', 'Vui lòng cung cấp ít nhất một vai trò (Role).');
        }

        if (data.roles.length > 20) {
            throw new AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
        }

        // Lọc trùng lặp Role
        data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));

        if (!data.full_name) {
            throw new AppError(400, 'USER_MISSING_NAME', 'Vui lòng cung cấp họ tên.');
        }

        // Tự động sinh mật khẩu ngẫu nhiên
        const rawPassword = data.password || randomBytes(8).toString('hex');
        const hashedPassword = await SecurityUtil.hashPassword(rawPassword);

        const userId = await UserRepository.createUser(
            {
                ...data,
                hashedPassword
            },
            adminId,
            ipAddress,
            userAgent
        );

        // Gửi thông báo email cho User nếu account có gắn Email
        if (data.email) {
            AuthMailUtil.sendNewAccountEmail(data.email, data.password ? undefined : rawPassword).catch(console.error);
        }

        return { userId };
    }

    /**
     * Lấy danh sách users
     */
    static async getUsers(filter: UserQueryFilter): Promise<PaginatedUsers> {
        return UserRepository.getUsers(filter);
    }

    /**
     * Lấy chi tiết một user
     */
    static async getUserById(userId: string): Promise<UserDetail> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        return user;
    }

    /**
     * Cập nhật thông tin User (Bởi Admin)
     */
    static async updateUser(
        userId: string,
        data: UpdateUserByAdminInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        // Kiểm tra xem User có tồn tại không
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        // Lọc trùng lặp Role
        if (data.roles) {
            if (data.roles.length > 20) {
                throw new AppError(400, 'USER_TOO_MANY_ROLES', 'Số lượng vai trò cung cấp cho một tài khoản vượt quá giới hạn.');
            }
            data.roles = Array.from(new Set(data.roles.map(r => r.toUpperCase())));
        }

        await UserRepository.updateUser(userId, data, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa mềm user (Soft Delete)
     */
    static async deleteUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const isActiveOrBanned = await UserRepository.getUserById(userId);
        if (!isActiveOrBanned) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        const success = await UserRepository.deleteUser(userId, adminId, ipAddress, userAgent);
        if (!success) {
            throw new AppError(500, 'USER_DELETE_FAILED', 'Xóa người dùng thất bại.');
        }
    }

    /**
     * Khóa tài khoản
     */
    static async lockUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'BANNED') {
            throw new AppError(400, 'USER_ALREADY_LOCKED', 'Tài khoản này đã bị khóa từ trước.');
        }

        const success = await UserRepository.lockUser(userId, adminId, ipAddress, userAgent);
        if (!success) {
            throw new AppError(500, 'USER_LOCK_FAILED', 'Khóa tài khoản thất bại.');
        }
    }

    /**
     * Mở khóa tài khoản
     */
    static async unlockUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }
        if (user.status === 'ACTIVE' && user.locked_until === null && user.failed_login_count === 0) {
            throw new AppError(400, 'USER_NOT_LOCKED', 'Tài khoản đang hoạt động bình thường, không bị khóa.');
        }

        const success = await UserRepository.unlockUser(userId, adminId, ipAddress, userAgent);
        if (!success) {
            throw new AppError(500, 'USER_UNLOCK_FAILED', 'Mở khóa tài khoản thất bại.');
        }
    }

    /**
     * Thay đổi trạng thái tài khoản
     */
    static async updateUserStatus(
        userId: string,
        data: UpdateUserStatusInput,
        adminId: string,
        ipAddress: string | null,
        userAgent: string | null
    ): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        if (user.status === data.status) {
            throw new AppError(400, 'USER_STATUS_UNCHANGED', 'Người dùng đang ở trạng thái này.');
        }

        const success = await UserRepository.updateUserStatus(
            userId,
            user.status,
            data.status,
            adminId,
            data.reason,
            ipAddress,
            userAgent
        );

        if (!success) {
            throw new AppError(500, 'USER_STATUS_UPDATE_FAILED', 'Cập nhật trạng thái thất bại.');
        }
    }

    /**
     * Lấy lịch sử thay đổi trạng thái
     */
    static async getStatusHistory(userId: string): Promise<AccountStatusHistory[]> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        return UserRepository.getStatusHistory(userId);
    }

    /**
     * Admin reset mật khẩu cho user
     */
    static async resetPasswordByAdmin(userId: string, data: ResetPasswordAdminInput): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        let newPassword = data.newPassword;
        let isAutoGenerated = false;

        // Nếu admin không truyền pass, tự động sinh
        if (!newPassword) {
            newPassword = randomBytes(8).toString('hex');
            isAutoGenerated = true;
        }

        const hashedPassword = await SecurityUtil.hashPassword(newPassword);
        const success = await UserRepository.updateUserPassword(userId, hashedPassword);

        if (!success) {
            throw new AppError(500, 'USER_PASSWORD_RESET_FAILED', 'Reset mật khẩu thất bại.');
        }

        // Nếu có email và tự generate pass thì gửi thư báo cho user
        if (isAutoGenerated && user.email) {
            try {
                await AuthMailUtil.sendNewAccountEmail(user.email, newPassword);
            } catch (error) {
                console.error("Failed to send reset password email", error);
                throw new AppError(500, 'USER_PASSWORD_RESET_EMAIL_FAILED', 'Đã reset nhưng gửi email thất bại.');
            }
        }
    }

    /**
     * User tự đổi mật khẩu
     */
    static async changePasswordByUser(userId: string, data: ChangePasswordInput, tokenUserId: string): Promise<void> {
        // Chỉ user chủ account mới được phép tự đổi
        if (userId !== tokenUserId) {
            throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thay đổi mật khẩu của người dùng khác.');
        }

        if (!data.oldPassword || !data.newPassword) {
            throw new AppError(400, 'INVALID_INPUT', 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.');
        }

        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng này.');
        }

        const currentHash = await UserRepository.getUserPasswordHash(userId);
        if (!currentHash) {
            throw new AppError(400, 'PASSWORD_NOT_SET', 'Tài khoản này chưa có mật khẩu để thay đổi.');
        }

        const isMatch = await SecurityUtil.verifyPasswordSafe(data.oldPassword, currentHash);
        if (!isMatch) {
            throw new AppError(400, 'INCORRECT_PASSWORD', 'Mật khẩu cũ không chính xác.');
        }

        const hashedNewPassword = await SecurityUtil.hashPassword(data.newPassword);
        const success = await UserRepository.updateUserPassword(userId, hashedNewPassword);

        if (!success) {
            throw new AppError(500, 'USER_PASSWORD_CHANGE_FAILED', 'Đổi mật khẩu thất bại.');
        }
    }

    /**
     * Lấy danh sách Role
     */
    static async getUserRoles(userId: string) {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
        }
        return UserRepository.getUserRoles(userId);
    }

    /**
     * Gán Role
     */
    static async assignRole(
        userId: string,
        data: AssignRoleInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ) {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
        }

        const success = await UserRepository.assignRoleToUser(userId, data.role, adminId, ipAddress, userAgent);
        if (!success) {
            throw new AppError(400, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại.');
        }
    }

    /**
     * Xóa Role
     */
    static async removeRole(
        userId: string,
        roleIdOrCode: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ) {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
        }

        const success = await UserRepository.removeRoleFromUser(userId, roleIdOrCode, adminId, ipAddress, userAgent);
        if (!success) {
            throw new AppError(400, 'ROLE_NOT_FOUND_OR_NOT_ASSIGNED', 'Người dùng không có vai trò này hoặc vai trò không tồn tại.');
        }
    }
}
