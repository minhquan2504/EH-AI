import { MenuDetail, CreateMenuInput, UpdateMenuInput, MenuQueryFilter } from '../../models/Core/menu.model';
import { MenuRepository } from '../../repository/Core/menu.repository';
import { SecurityUtil } from '../../utils/auth-security.util';
import { AppError } from '../../utils/app-error.util';

export class MenuService {
    /**
     * Lấy danh sách toàn bộ Menu có trên giao diện
     */
    static async getAllMenus(filter?: MenuQueryFilter): Promise<MenuDetail[]> {
        return await MenuRepository.getAllMenus(filter);
    }

    /**
     * Tạo mới Menu
     */
    static async createMenu(
        data: CreateMenuInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<MenuDetail> {
        // Prepare Code
        data.code = data.code.trim().toUpperCase().replace(/\s+/g, '_');

        // Check duplicated code
        const existingMenu = await MenuRepository.getMenuByIdOrCode(data.code);
        if (existingMenu) {
            throw new AppError(400, 'MENU_ALREADY_EXISTS', 'Mã Menu này đã tồn tại trong hệ thống');
        }

        // Validate parent_id if provided
        if (data.parent_id) {
            const parentMenu = await MenuRepository.getMenuByIdOrCode(data.parent_id);
            if (!parentMenu) {
                throw new AppError(400, 'PARENT_MENU_NOT_FOUND', 'Menu cha không tồn tại');
            }
            if (parentMenu.parent_id) {
                // Prevent > 2 levels deep if logic requires, omitting for now depending on UI
            }
        }

        const menuId = SecurityUtil.generateMenuId();
        return await MenuRepository.createMenu(menuId, data, adminId, ipAddress, userAgent);
    }

    /**
     * Cập nhật Menu
     */
    static async updateMenu(
        menuId: string,
        data: UpdateMenuInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<MenuDetail> {
        const existingMenu = await MenuRepository.getMenuByIdOrCode(menuId);
        if (!existingMenu) {
            throw new AppError(404, 'MENU_NOT_FOUND', 'Menu không tồn tại');
        }

        if (data.parent_id) {
            if (data.parent_id === existingMenu.menus_id) {
                throw new AppError(400, 'INVALID_PARENT', 'Menu không thể nhận chính nó làm cha');
            }
            const parentMenu = await MenuRepository.getMenuByIdOrCode(data.parent_id);
            if (!parentMenu) {
                throw new AppError(400, 'PARENT_MENU_NOT_FOUND', 'Menu cha không tồn tại');
            }
        }

        return await MenuRepository.updateMenu(existingMenu.menus_id, data, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa Menu
     */
    static async deleteMenu(
        menuId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const existingMenu = await MenuRepository.getMenuByIdOrCode(menuId);
        if (!existingMenu) {
            throw new AppError(404, 'MENU_NOT_FOUND', 'Menu không tồn tại');
        }

        // Perform Soft Delete
        await MenuRepository.deleteMenu(existingMenu.menus_id, adminId, ipAddress, userAgent);
    }
}
