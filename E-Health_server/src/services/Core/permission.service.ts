import { PermissionDetail, CreatePermissionInput, UpdatePermissionInput } from '../../models/Core/permission.model';
import { PermissionRepository } from '../../repository/Core/permission.repository';
import { AppError } from '../../utils/app-error.util';

export class PermissionService {
    /**
     * Lấy danh sách Vai trò
     */
    static async getPermissions(filter: any): Promise<PermissionDetail[]> {
        return await PermissionRepository.getPermissions(filter);
    }

    /**
     * Lấy danh sách Vai trò (Modules)
     */
    static async getDistinctModules(): Promise<string[]> {
        return await PermissionRepository.getDistinctModules();
    }

    /**
     * Lấy chi tiết Vai trò
     */
    static async getPermissionById(permissionId: string): Promise<PermissionDetail> {
        const permission = await PermissionRepository.getPermissionById(permissionId);
        if (!permission) {
            throw new AppError(404, 'NOT_FOUND', 'Quyền này không tồn tại');
        }
        return permission;
    }

    /**
     * Lấy chi tiết bằng Code
     */
    static async getPermissionByCode(code: string): Promise<PermissionDetail> {
        const permission = await PermissionRepository.getPermissionByCode(code);
        if (!permission) {
            throw new AppError(404, 'NOT_FOUND', 'Mã quyền này không tồn tại');
        }
        return permission;
    }

    /**
     * Tạo quyền mới
     */
    static async createPermission(
        data: CreatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        data.code = data.code.trim().toUpperCase().replace(/\s+/g, '_');

        if (!data.code || !data.module) {
            throw new AppError(400, 'INVALID_INPUT', 'Mã và module quyền là bắt buộc');
        }

        const existingPermission = await PermissionRepository.getPermissionByCode(data.code);
        if (existingPermission) {
            throw new AppError(400, 'PERMISSION_ALREADY_EXISTS', 'Mã quyền này đã tồn tại');
        }

        return await PermissionRepository.createPermission(data, adminId, ipAddress, userAgent);
    }

    /**
     * Cập nhật thông tin quyền
     */
    static async updatePermission(
        permissionId: string,
        data: UpdatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        await this.getPermissionById(permissionId);
        return await PermissionRepository.updatePermission(permissionId, data, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa quyền
     */
    static async deletePermission(
        permissionId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        await this.getPermissionById(permissionId);

        const rolesCount = await PermissionRepository.countRolesByPermission(permissionId);
        if (rolesCount > 0) {
            throw new AppError(400, 'PERMISSION_IN_USE', `Không thể xóa quyền này vì đang được gán cho ${rolesCount} vai trò.`);
        }

        await PermissionRepository.deletePermission(permissionId, adminId, ipAddress, userAgent);
    }
}
