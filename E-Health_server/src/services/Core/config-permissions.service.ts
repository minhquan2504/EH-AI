import { ConfigPermissionsRepository } from '../../repository/Core/config-permissions.repository';
import { ConfigPermissionMap, UpdateConfigPermissionsInput } from '../../models/Core/system-settings.model';
import { CONFIG_PERMISSION_ERRORS, SYSTEM_SETTINGS_MODULE_NAMES } from '../../constants/system.constant';

/** Danh sách role codes hợp lệ (đồng bộ với roles table) */
const VALID_ROLE_CODES = ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'CUSTOMER'] as const;
const VALID_MODULES = SYSTEM_SETTINGS_MODULE_NAMES as readonly string[];

export class ConfigPermissionsService {
    /** Lấy toàn bộ phân quyền chỉnh sửa cấu hình. */
    static async getConfigPermissions(): Promise<ConfigPermissionMap> {
        return await ConfigPermissionsRepository.getAll();
    }

    /**
     * Cập nhật phân quyền chỉnh sửa cấu hình.
     */
    static async updateConfigPermissions(
        input: UpdateConfigPermissionsInput,
        updatedBy: string,
    ): Promise<ConfigPermissionMap> {
        const { permissions } = input;

        for (const [roleCode, modules] of Object.entries(permissions)) {
            // Validate role code
            if (!VALID_ROLE_CODES.includes(roleCode as any)) {
                throw { ...CONFIG_PERMISSION_ERRORS.INVALID_ROLE, message: `Role '${roleCode}' không hợp lệ.` };
            }

            // Validate từng module
            for (const mod of modules) {
                if (!VALID_MODULES.includes(mod)) {
                    throw { ...CONFIG_PERMISSION_ERRORS.INVALID_MODULE, message: `Module '${mod}' không hợp lệ.` };
                }
            }
        }

        // Ràng buộc nghiệp vụ: ADMIN phải giữ quyền trên SECURITY để tránh lock out
        const adminModules = permissions['ADMIN'] ?? [];
        if (adminModules.length > 0 && !adminModules.includes('SECURITY')) {
            throw CONFIG_PERMISSION_ERRORS.ADMIN_MUST_HAVE_SECURITY;
        }

        await ConfigPermissionsRepository.bulkReplace(permissions, updatedBy);
        return await ConfigPermissionsRepository.getAll();
    }
}
