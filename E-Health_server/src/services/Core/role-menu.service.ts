import { RoleMenuDetail, AssignMenuInput } from '../../models/Core/role-menu.model';
import { RoleMenuRepository } from '../../repository/Core/role-menu.repository';
import { RoleRepository } from '../../repository/Core/role.repository';
import { MenuRepository } from '../../repository/Core/menu.repository';
import { AppError } from '../../utils/app-error.util';

export class RoleMenuService {
    /**
     * Lấy danh sách Menu của một Vai trò cụ thể
     */
    static async getMenusByRoleId(roleId: string): Promise<RoleMenuDetail[]> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        return await RoleMenuRepository.getMenusByRoleId(roleId);
    }

    /**
     * Gán lẻ một Menu vào Vai trò
     */
    static async assignMenu(
        roleId: string,
        data: AssignMenuInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        const menu = await MenuRepository.getMenuByIdOrCode(data.menu_id);
        if (!menu) {
            throw new AppError(404, 'MENU_NOT_FOUND', 'Menu không khả dụng hoặc không tồn tại');
        }

        await RoleMenuRepository.assignMenu(roleId, menu.menus_id, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa vĩnh viễn một Menu khỏi Vai trò
     */
    static async removeMenu(
        roleId: string,
        menuIdOrCode: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const role = await RoleRepository.getRoleById(roleId);
        if (!role) {
            throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò không tồn tại');
        }

        const menu = await MenuRepository.getMenuByIdOrCode(menuIdOrCode);
        if (!menu) {
            throw new AppError(404, 'MENU_NOT_FOUND', 'Menu không khả dụng hoặc không tồn tại');
        }

        await RoleMenuRepository.removeMenu(roleId, menu.menus_id, adminId, ipAddress, userAgent);
    }
}
