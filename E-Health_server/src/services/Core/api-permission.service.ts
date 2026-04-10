import { ApiPermissionDetail, CreateApiPermissionInput, UpdateApiPermissionInput, ApiPermissionQueryFilter } from '../../models/Core/api-permission.model';
import { ApiPermissionRepository } from '../../repository/Core/api-permission.repository';
import { AppError } from '../../utils/app-error.util';
import { SecurityUtil } from '../../utils/auth-security.util';
import { ApiPermissionCacheService } from './api-permission-cache.service';

export class ApiPermissionService {
    /**
     * Lấy danh sách API Permissions
     */
    static async getAllApiPermissions(filter?: ApiPermissionQueryFilter): Promise<ApiPermissionDetail[]> {
        return await ApiPermissionRepository.getAllApiPermissions(filter);
    }

    /**
     * Tạo mới API Permission
     */
    static async createApiPermission(
        input: CreateApiPermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<ApiPermissionDetail> {
        input.method = input.method.trim().toUpperCase();
        input.endpoint = input.endpoint.trim();

        const existingApi = await ApiPermissionRepository.getApiByMethodAndEndpoint(input.method, input.endpoint);
        if (existingApi) {
            throw new AppError(400, 'API_PERMISSION_EXISTS', 'Cặp Method và Endpoint API này đã tồn tại');
        }

        const apiId = SecurityUtil.generateApiPermissionId();
        const result = await ApiPermissionRepository.createApiPermission(apiId, input, adminId, ipAddress, userAgent);

        await ApiPermissionCacheService.refreshCache();

        return result;
    }

    /**
     * Cập nhật API Permission thông tin
     */
    static async updateApiPermission(
        apiId: string,
        input: UpdateApiPermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<ApiPermissionDetail> {
        const existingApi = await ApiPermissionRepository.getApiPermissionById(apiId);
        if (!existingApi) {
            throw new AppError(404, 'API_PERMISSION_NOT_FOUND', 'Không tìm thấy API Permission');
        }

        if (input.method || input.endpoint) {
            const checkMethod = input.method ? input.method.trim().toUpperCase() : existingApi.method;
            const checkEndpoint = input.endpoint ? input.endpoint.trim() : existingApi.endpoint;

            const duplicateCheck = await ApiPermissionRepository.getApiByMethodAndEndpoint(checkMethod, checkEndpoint);
            if (duplicateCheck && duplicateCheck.api_id !== apiId) {
                throw new AppError(400, 'API_PERMISSION_EXISTS', 'Cặp Method và Endpoint API này đã bị trùng lắp');
            }
        }

        if (input.method) input.method = input.method.trim().toUpperCase();
        if (input.endpoint) input.endpoint = input.endpoint.trim();

        const result = await ApiPermissionRepository.updateApiPermission(apiId, input, adminId, ipAddress, userAgent);

        await ApiPermissionCacheService.refreshCache();

        return result;
    }

    /**
     * Xóa vô hiệu hoá API
     */
    static async deleteApiPermission(
        apiId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const existingApi = await ApiPermissionRepository.getApiPermissionById(apiId);
        if (!existingApi) {
            throw new AppError(404, 'API_PERMISSION_NOT_FOUND', 'Không tìm thấy API Permission');
        }

        await ApiPermissionRepository.deleteApiPermission(apiId, adminId, ipAddress, userAgent);
        await ApiPermissionCacheService.refreshCache();
    }
}
