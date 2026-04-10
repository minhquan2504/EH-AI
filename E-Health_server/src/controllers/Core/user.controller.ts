import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/Facility Management/user.service';
import { CreateUserInput, UpdateUserByAdminInput, UpdateUserStatusInput, ResetPasswordAdminInput, ChangePasswordInput, AssignRoleInput } from '../../models/Core/user.model';

export class UserController {
    /**
     * Dành cho Dropdown: Lấy danh sách trạng thái Account
     */
    static getAccountStatuses(req: Request, res: Response, next: NextFunction): void {
        try {
            const statuses = [
                { code: 'ACTIVE', label: 'Hoạt động' },
                { code: 'INACTIVE', label: 'Vô hiệu hóa (Đã xóa)' },
                { code: 'BANNED', label: 'Bị khóa' },
                { code: 'PENDING', label: 'Chờ xác thực' }
            ];
            res.status(200).json({
                success: true,
                data: statuses
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo người dùng mới
     */
    static async createUser(req: Request, res: Response): Promise<Response> {
        try {
            const data = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            const result = await UserService.createUser(data, adminId, ipAddress, userAgent);

            return res.status(201).json({
                success: true,
                message: "Tạo tài khoản người dùng thành công",
                data: result
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_CREATE_FAILED',
                message: error.message || 'Lỗi hệ thống khi tạo người dùng'
            });
        }
    }

    /**
     * Lấy danh sách người dùng
     */
    static async getUsers(req: Request, res: Response): Promise<Response> {
        try {
            const { page, limit, role, status, search } = req.query;

            const filter = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                role: typeof role === 'string' ? role : undefined,
                status: typeof status === 'string' ? status : undefined,
                search: typeof search === 'string' ? search : undefined
            };

            const data = await UserService.getUsers(filter);

            return res.status(200).json({
                success: true,
                message: "Lấy danh sách người dùng thành công",
                data
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_LIST_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Lấy chi tiết người dùng
     */
    static async getUserById(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const data = await UserService.getUserById(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy thông tin chi tiết người dùng thành công",
                data
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_DETAIL_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Cập nhật thông tin người dùng
     */
    static async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.updateUser(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Cập nhật tài khoản người dùng thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_UPDATE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Xóa / vô hiệu hóa người dùng (Soft Delete)
     */
    static async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.deleteUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Vô hiệu hóa người dùng thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_DELETE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Tìm kiếm người dùng nhanh (Optional, can alias getUsers)
     */
    static async searchUsers(req: Request, res: Response): Promise<Response> {
        try {
            // Re-use getUsers logic basically, assuming `search` query param is provided explicitly.
            const { q, role, page, limit } = req.query;

            const filter = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
                search: typeof q === 'string' ? q : undefined,
                role: typeof role === 'string' ? role : undefined
            };

            const data = await UserService.getUsers(filter);

            return res.status(200).json({
                success: true,
                message: "Tìm kiếm người dùng thành công",
                data
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_SEARCH_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Khóa tài khoản
     */
    static async lockUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.lockUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Khóa tài khoản thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_LOCK_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Mở khóa tài khoản
     */
    static async unlockUser(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.unlockUser(userId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Mở khóa tài khoản thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_UNLOCK_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Thay đổi trạng thái tài khoản
     */
    static async updateUserStatus(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data: UpdateUserStatusInput = req.body;

            // Lấy thông tin user thực hiện (từ middleware config)
            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            if (!data.status) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_INPUT',
                    message: 'Vui lòng cung cấp trạng thái mới (status).'
                });
            }

            await UserService.updateUserStatus(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Thay đổi trạng thái tài khoản thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_STATUS_UPDATE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Lấy lịch sử thay đổi trạng thái
     */
    static async getStatusHistory(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;

            const history = await UserService.getStatusHistory(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy lịch sử trạng thái thành công",
                data: history
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_HISTORY_FETCH_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Admin reset mật khẩu cho User
     */
    static async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data: ResetPasswordAdminInput = req.body;

            await UserService.resetPasswordByAdmin(userId, data);

            return res.status(200).json({
                success: true,
                message: "Reset mật khẩu thành công. Mật khẩu điểm được gửi qua Email (nếu hệ thống tự tạo)."
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_PASSWORD_RESET_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * User tự đổi mật khẩu cá nhân
     */
    static async changePassword(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data: ChangePasswordInput = req.body;

            // Lấy ID thật của User từ Access Token ở header
            const tokenUserId = (req as any).auth?.user_id;

            if (!tokenUserId) {
                return res.status(401).json({
                    success: false,
                    code: 'UNAUTHORIZED',
                    message: 'Không tìm thấy thông tin xác thực'
                });
            }

            await UserService.changePasswordByUser(userId, data, tokenUserId);

            return res.status(200).json({
                success: true,
                message: "Đổi mật khẩu thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_PASSWORD_CHANGE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Lấy các role của user
     */
    static async getUserRoles(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const roles = await UserService.getUserRoles(userId);

            return res.status(200).json({
                success: true,
                message: "Lấy danh sách vai trò thành công",
                data: roles
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_ROLES_FETCH_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Gán role cho user
     */
    static async assignRole(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const data: AssignRoleInput = req.body;

            if (!data.role) {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_INPUT',
                    message: 'Vui lòng cung cấp mã hoặc ID của vai trò (role).'
                });
            }

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.assignRole(userId, data, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Gán vai trò thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_ROLE_ASSIGN_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }

    /**
     * Xoá role của user
     */
    static async removeRole(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.params.userId as string;
            const roleId = req.params.roleId as string;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserService.removeRole(userId, roleId, adminId, ipAddress, userAgent);

            return res.status(200).json({
                success: true,
                message: "Xoá vai trò thành công"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'USER_ROLE_REMOVE_FAILED',
                message: error.message || 'Lỗi hệ thống'
            });
        }
    }
}
