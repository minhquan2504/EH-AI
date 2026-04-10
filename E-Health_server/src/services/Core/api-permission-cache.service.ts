import { pool } from '../../config/postgresdb';
import { ApiMatcherUtil } from '../../utils/api-matcher.util';

interface CachedApiPermission {
    method: string;
    endpoint: string;
}

export class ApiPermissionCacheService {
    // Map lưu trữ: [Role Code] => Mảng các API được phép
    private static cache: Map<string, CachedApiPermission[]> = new Map();

    /**
     * Khởi tạo bộ nhớ Cache lúc Server mới Start.
     */
    static async initCache(): Promise<void> {
        await this.loadFromDatabase();
        console.log('✅ Load cấu hình Dynamic API Permissions vào Cache thành công!');
    }

    /**
     * Tải lại bộ đệm từ Database
     */
    static async refreshCache(): Promise<void> {
        console.log('🔄 Đang Refresh Dynamic API Cache...');
        await this.loadFromDatabase();
        console.log('✅ Refresh API Cache hoàn tất!');
    }

    private static async loadFromDatabase() {
        try {
            // Join 3 bảng để ra được map
            const query = `
                SELECT r.code as role_code, a.method, a.endpoint 
                FROM roles r
                JOIN role_api_permissions rap ON r.roles_id = rap.role_id
                JOIN api_permissions a ON rap.api_id = a.api_id
                WHERE r.deleted_at IS NULL AND a.deleted_at IS NULL AND a.status = 'ACTIVE' AND r.status = 'ACTIVE'
            `;
            const { rows } = await pool.query(query);

            const newCache = new Map<string, CachedApiPermission[]>();

            for (const row of rows) {
                const roleCode = row.role_code;
                const permissions = newCache.get(roleCode) || [];
                permissions.push({
                    method: row.method,
                    endpoint: row.endpoint
                });
                newCache.set(roleCode, permissions);
            }

            this.cache = newCache;
        } catch (error) {
            console.error('❌ Lỗi khi nạp API Permission Cache:', error);
        }
    }

    /**
     * Hàm dùng ở Middleware để check nhanh
     */
    static hasAccess(roles: string[], method: string, path: string): boolean {

        if (roles.includes('ADMIN')) return true;

        const checkMethod = method.trim().toUpperCase();

        for (const roleCode of roles) {
            const apiList = this.cache.get(roleCode);
            if (!apiList) continue;

            // Duyệt danh sách API của Role này
            for (const api of apiList) {
                if (api.method !== checkMethod) continue;

                if (ApiMatcherUtil.isMatch(path, api.endpoint)) {
                    return true;
                }
            }
        }

        return false;
    }
}
