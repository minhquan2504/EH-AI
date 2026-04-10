import { RolePermissionDetail, AssignPermissionInput, ReplacePermissionsInput } from '../../models/Core/role-permission.model';
import { RolePermissionRepository } from '../../repository/Core/role-permission.repository';
import { RoleRepository } from '../../repository/Core/role.repository';
import { PermissionRepository } from '../../repository/Core/permission.repository';
import { AppError } from '../../utils/app-error.util';

export class RolePermissionService {
    /**
     * Lấy danh sách quyền của một Vai trò
     */
    static async getPermissionsByRoleId(roleId: string): Promise<RolePermissionDetail[]> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'NOT_FOUND', 'Vai trò không tồn tại');
        }

        return await RolePermissionRepository.getPermissionsByRoleId(roleId);
    }

    /**
     * Thay thế (Replace) toàn bộ danh sách quyền của một Vai trò
     */
    static async replacePermissions(
        roleId: string,
        data: ReplacePermissionsInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        const validPermissionIds: string[] = [];

        // Kiểm tra xem tất cả các mã ID/Code truyền lên có hợp lệ không
        if (data.permissions && data.permissions.length > 0) {
            for (const value of data.permissions) {
                let dbPermId = value;
                const permissionById = await PermissionRepository.getPermissionById(value);

                if (!permissionById) {
                    const permissionByCode = await PermissionRepository.getPermissionByCode(value);
                    if (!permissionByCode) {
                        throw new AppError(400, 'INVALID_PERMISSION', `Mã hoặc ID quyền không tồn tại: ${value}`);
                    }
                    dbPermId = permissionByCode.permissions_id;
                }
                validPermissionIds.push(dbPermId);
            }
        }

        // Thực thi replace record DB N-N (permissionIds này là ID thực sự chứ không phải Code)
        await RolePermissionRepository.replacePermissions(roleId, validPermissionIds, adminId, ipAddress, userAgent);
    }

    /**
     * Gán thêm lẻ một Quyền vào Vai trò
     */
    static async assignPermission(
        roleId: string,
        data: AssignPermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        let dbPermissionId = data.permission_id;

        // Nếu client truyền lên Code thay vì ID, cần quy đổi ra ID
        const permissionById = await PermissionRepository.getPermissionById(data.permission_id);
        if (!permissionById) {
            const permissionByCode = await PermissionRepository.getPermissionByCode(data.permission_id);
            if (!permissionByCode) {
                throw new AppError(404, 'PERMISSION_NOT_FOUND', 'Quyền không tồn tại trên hệ thống');
            }
            dbPermissionId = permissionByCode.permissions_id;
        }

        await RolePermissionRepository.assignPermission(roleId, dbPermissionId, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa lẻ một Quyền khỏi Vai trò
     */
    static async removePermission(
        roleId: string,
        permissionIdOrCode: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        let dbPermissionId = permissionIdOrCode;

        // Tương tự, nếu client gọi ID bằng Code thì mapping query ra lại ID
        const permissionById = await PermissionRepository.getPermissionById(permissionIdOrCode);
        if (!permissionById) {
            const permissionByCode = await PermissionRepository.getPermissionByCode(permissionIdOrCode);
            if (!permissionByCode) {
                throw new AppError(404, 'PERMISSION_NOT_FOUND', 'Quyền không tồn tại trên hệ thống');
            }
            dbPermissionId = permissionByCode.permissions_id;
        }

        await RolePermissionRepository.removePermission(roleId, dbPermissionId, adminId, ipAddress, userAgent);
    }
}
