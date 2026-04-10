import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { PermissionService } from '../../services/Core/permission.service';
import { CreatePermissionInput, UpdatePermissionInput, PermissionQueryFilter } from '../../models/Core/permission.model';
import { AppError } from '../../utils/app-error.util';

export class PermissionController {
    /**
     * Lấy danh sách Quyền hạn
     */
    static async getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter: PermissionQueryFilter = {
                search: req.query.search as string,
                module: req.query.module as string
            };

            const permissions = await PermissionService.getPermissions(filter);
            res.status(200).json({
                success: true,
                data: permissions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết Quyền hạn
     */
    static async getPermissionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const permission = await PermissionService.getPermissionById(req.params.permissionId as string);
            res.status(200).json({
                success: true,
                data: permission
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo Quyền mới
     */
    static async createPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreatePermissionInput = {
                code: req.body.code,
                module: req.body.module,
                description: req.body.description
            };

            const newPermission = await PermissionService.createPermission(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo quyền mới thành công',
                data: newPermission
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật Quyền hạn
     */
    static async updatePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdatePermissionInput = {
                module: req.body.module,
                description: req.body.description
            };

            const updatedPermission = await PermissionService.updatePermission(req.params.permissionId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật quyền thành công',
                data: updatedPermission
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa Quyền
     */
    static async deletePermission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính người dùng');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await PermissionService.deletePermission(req.params.permissionId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa quyền thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}
