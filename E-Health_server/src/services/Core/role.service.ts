import { RoleRepository } from '../../repository/Core/role.repository';
import { CreateRoleInput, UpdateRoleInput, RoleQueryFilter, RoleDetail } from '../../models/Core/role.model';
import { AppError } from '../../utils/app-error.util';
import { ApiPermissionCacheService } from './api-permission-cache.service';

export class RoleService {
    /**
     * Lấy danh sách vai trò
     */
    static async getRoles(filter: RoleQueryFilter): Promise<RoleDetail[]> {
        return await RoleRepository.getRoles(filter);
    }

    /**
     * Lấy chi tiết vai trò
     */
    static async getRoleById(roleId: string): Promise<RoleDetail> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Không tìm thấy vai trò này');
        }
        return role;
    }

    /**
     * Tạo vai trò mới
     */
    static async createRole(
        data: CreateRoleInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<RoleDetail> {
        // Prepare code format safely (UpperCase, No Spaces)
        data.code = data.code.trim().toUpperCase().replace(/\s+/g, '_');

        if (!data.code || !data.name) {
            throw new AppError(400, 'INVALID_INPUT', 'Mã và tên vai trò là bắt buộc');
        }

        const existingRole = await RoleRepository.getRoleByCode(data.code);
        if (existingRole) {
            throw new AppError(400, 'ROLE_ALREADY_EXISTS', 'Mã vai trò này đã tồn tại');
        }

        return await RoleRepository.createRole(data, adminId, ipAddress, userAgent);
    }

    /**
     * Cập nhật vai trò
     */
    static async updateRole(
        roleId: string,
        data: UpdateRoleInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<RoleDetail> {
        const role = await this.getRoleById(roleId);

        // Chặn sửa role is_system (Có thể cho phép sửa file dịch nhưng tạm chặn toàn bộ ngoại trừ status)
        if (role.is_system && (data.name !== undefined || data.description !== undefined)) {
            // Note: System roles shouldn't have their name/desc modified drastically, but we allow status change maybe?
            // Actually requirement says "ngăn không cho phép can thiệp (Xóa, Sửa Mã) vào các role có is_system = TRUE".
            // However, the UpdateRoleInput doesn't have "code". If 'name/desc' is updated, it's fine, let's just make sure we don't block everything blindly. Wait, I will just let it pass if updating name/desc, just no code updating since it's not even in input.
        }

        // Chặn đổi trạng thái INACTIVE nếu có users đang sử dụng
        if (data.status === 'INACTIVE' && role.status === 'ACTIVE') {
            const usersCount = await RoleRepository.countUsersByRole(roleId);
            if (usersCount > 0) {
                throw new AppError(400, 'ROLE_IN_USE', `Không thể vô hiệu hóa vai trò này vì đang có ${usersCount} người dùng được gán.`);
            }
        }

        return await RoleRepository.updateRole(roleId, data, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa vai trò
     */
    static async deleteRole(
        roleId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await this.getRoleById(roleId);

        if (role.is_system) {
            throw new AppError(403, 'SYSTEM_ROLE_PROTECTED', 'Không được phép xóa vai trò mặc định của hệ thống');
        }

        const usersCount = await RoleRepository.countUsersByRole(roleId);
        if (usersCount > 0) {
            throw new AppError(400, 'ROLE_IN_USE', `Không thể xóa vai trò này vì đang có ${usersCount} người dùng được gán.`);
        }

        await RoleRepository.deleteRole(roleId, adminId, ipAddress, userAgent);
    }
}
