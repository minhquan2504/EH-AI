import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { RoleService } from '../../services/Core/role.service';
import { CreateRoleInput, UpdateRoleInput, RoleQueryFilter } from '../../models/Core/role.model';
import { RolePermissionService } from '../../services/Core/role-permission.service';
import { AssignPermissionInput, ReplacePermissionsInput } from '../../models/Core/role-permission.model';
import { RoleMenuService } from '../../services/Core/role-menu.service';
import { AssignMenuInput } from '../../models/Core/role-menu.model';
import { RoleApiPermissionService } from '../../services/Core/role-api-permission.service';
import { AssignApiPermissionInput } from '../../models/Core/role-api-permission.model';
import { AppError } from '../../utils/app-error.util';

export class RoleController {
    /**
     * Lấy danh sách Vai trò
     */
    static async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter: RoleQueryFilter = {
                search: req.query.search as string,
                status: req.query.status as 'ACTIVE' | 'INACTIVE',
                is_system: req.query.is_system ? req.query.is_system === 'true' : undefined
            };

            const roles = await RoleService.getRoles(filter);
            res.status(200).json({
                success: true,
                data: roles
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết Vai trò
     */
    static async getRoleById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const role = await RoleService.getRoleById(req.params.roleId as string);
            res.status(200).json({
                success: true,
                data: role
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo Vai trò mới
     */
    static async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreateRoleInput = {
                code: req.body.code,
                name: req.body.name,
                description: req.body.description
            };

            const newRole = await RoleService.createRole(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo vai trò thành công',
                data: newRole
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật Vai trò
     */
    static async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdateRoleInput = {
                name: req.body.name,
                description: req.body.description,
                status: req.body.status
            };

            const updatedRole = await RoleService.updateRole(req.params.roleId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật vai trò thành công',
                data: updatedRole
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật Trạng thái Vai trò (Bật/Tắt)
     */
    static async updateRoleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const status = req.body.status;
            if (status !== 'ACTIVE' && status !== 'INACTIVE') {
                throw new AppError(400, 'INVALID_STATUS', 'Trạng thái không hợp lệ (ACTIVE/INACTIVE)');
            }

            const updatedRole = await RoleService.updateRole(req.params.roleId as string, { status }, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: `Đã đổi trạng thái thành ${status}`,
                data: updatedRole
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa Vai trò
     */
    static async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await RoleService.deleteRole(req.params.roleId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa vai trò thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // PHÂN QUYỀN (ROLE-PERMISSIONS)
    // =========================================================================

    /**
     * Lấy danh sách quyền của Role
     */
    static async getRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const permissions = await RolePermissionService.getPermissionsByRoleId(req.params.roleId as string);
            res.status(200).json({
                success: true,
                data: permissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thay thế toàn bộ quyền của Role
     */
    static async replaceRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: ReplacePermissionsInput = {
                permissions: req.body.permissions || []
            };

            await RolePermissionService.replacePermissions(req.params.roleId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật phân quyền cho hệ thống thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán lẻ một quyền cho Role
     */
    static async assignRolePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: AssignPermissionInput = {
                permission_id: req.body.permission_id
            };

            if (!input.permission_id) {
                throw new AppError(400, 'INVALID_INPUT', 'permission_id không được để trống');
            }

            await RolePermissionService.assignPermission(req.params.roleId as string, input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Gán quyền thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa vĩnh viễn quyền khỏi Role
     */
    static async removeRolePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await RolePermissionService.removePermission(req.params.roleId as string, req.params.permissionId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa quyền khỏi vai trò thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // QUẢN LÝ MENU (ROLE-MENUS)
    // =========================================================================

    /**
     * Lấy danh sách Menu của Role
     */
    static async getRoleMenus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const menus = await RoleMenuService.getMenusByRoleId(req.params.roleId as string);
            res.status(200).json({
                success: true,
                data: menus
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán lẻ một Menu cho Role
     */
    static async assignRoleMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: AssignMenuInput = {
                menu_id: req.body.menu_id
            };

            if (!input.menu_id) {
                throw new AppError(400, 'INVALID_INPUT', 'menu_id không được để trống');
            }

            await RoleMenuService.assignMenu(req.params.roleId as string, input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Gán menu thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa vĩnh viễn menu khỏi Role
     */
    static async removeRoleMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await RoleMenuService.removeMenu(req.params.roleId as string, req.params.menuId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Gỡ menu khỏi vai trò thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // =========================================================================
    // QUẢN LÝ API (ROLE-API-PERMISSIONS)
    // =========================================================================

    /**
     * Lấy danh sách API do Role quản lý
     */
    static async getRoleApiPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const apiPermissions = await RoleApiPermissionService.getApiPermissionsByRoleId(req.params.roleId as string);
            res.status(200).json({
                success: true,
                data: apiPermissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán 1 API permission cho Vai trò
     */
    static async assignRoleApiPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: AssignApiPermissionInput = req.body;
            if (!input.api_id) {
                throw new AppError(400, 'INVALID_INPUT', 'Vui lòng cung cấp ID của API Endpoint');
            }

            await RoleApiPermissionService.assignApiPermission(req.params.roleId as string, input.api_id, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Phân quyền API cho Vai trò thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gỡ API Permission khỏi Vai trò
     */
    static async removeRoleApiPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await RoleApiPermissionService.removeApiPermission(req.params.roleId as string, req.params.apiId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Đã gỡ quyền truy cập API khỏi Vai trò'
            });
        } catch (error) {
            next(error);
        }
    }
}
