import { pool } from '../../config/postgresdb';
import {
    MasterService,
    CreateServiceInput,
    UpdateServiceInput,
    PaginatedServices
} from '../../models/Facility Management/service.model';

export class ServiceRepository {
    /**
     * Lấy danh sách dịch vụ chuẩn
     */
    static async getServices(
        search: string | undefined,
        serviceGroup: string | undefined,
        isActive: boolean | undefined,
        page: number,
        limit: number
    ): Promise<PaginatedServices> {
        const conditions: string[] = ['deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (serviceGroup) {
            conditions.push(`service_group = $${paramIdx}`);
            params.push(serviceGroup);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(code ILIKE $${paramIdx} OR name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM services ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT *
            FROM services
            ${whereClause}
            ORDER BY name ASC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy thông tin 1 dịch vụ theo ID
     */
    static async getServiceById(id: string): Promise<MasterService | null> {
        const query = `
            SELECT * FROM services
            WHERE services_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy dịch vụ theo mã Code
     */
    static async getServiceByCode(code: string): Promise<MasterService | null> {
        const query = `
            SELECT * FROM services
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ dịch vụ (dùng cho Export)
     */
    static async getAllServices(): Promise<MasterService[]> {
        const query = `
            SELECT *
            FROM services
            WHERE deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Upsert dịch vụ (dùng cho Import)
     */
    static async upsertService(id: string, input: CreateServiceInput): Promise<MasterService> {
        const query = `
            INSERT INTO services (services_id, code, name, service_group, service_type, insurance_code, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (code) DO UPDATE 
            SET name = excluded.name, 
                service_group = excluded.service_group,
                service_type = excluded.service_type,
                insurance_code = excluded.insurance_code,
                description = excluded.description,
                is_active = excluded.is_active,
                updated_at = CURRENT_TIMESTAMP,
                deleted_at = NULL
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.code,
            input.name,
            input.service_group ?? null,
            input.service_type ?? null,
            input.insurance_code ?? null,
            input.description ?? null,
            input.is_active ?? true
        ]);
        return result.rows[0];
    }

    /**
     * Thêm mới dịch vụ chuẩn
     */
    static async createService(id: string, input: CreateServiceInput): Promise<MasterService> {
        const query = `
            INSERT INTO services (services_id, code, name, service_group, service_type, insurance_code, description, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.code,
            input.name,
            input.service_group ?? null,
            input.service_type ?? null,
            input.insurance_code ?? null,
            input.description ?? null,
            input.is_active ?? true
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin dịch vụ
     */
    static async updateService(id: string, input: UpdateServiceInput): Promise<MasterService> {
        const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [id];
        let paramIdx = 2;

        const updateFields: (keyof UpdateServiceInput)[] = ['name', 'service_group', 'service_type', 'insurance_code', 'description', 'is_active'];

        updateFields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        if (updates.length === 1) { // Chỉ có updated_at
            return (await this.getServiceById(id)) as MasterService;
        }

        const query = `
            UPDATE services
            SET ${updates.join(', ')}
            WHERE services_id = $1 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Khóa/Mở khóa dịch vụ
     */
    static async toggleServiceStatus(id: string, is_active: boolean): Promise<MasterService> {
        const query = `
            UPDATE services
            SET is_active = $2, updated_at = CURRENT_TIMESTAMP
            WHERE services_id = $1 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, [id, is_active]);
        return result.rows[0];
    }

    /**
     * Xóa mềm dịch vụ
     */
    static async deleteService(id: string): Promise<void> {
        const query = `
            UPDATE services
            SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
            WHERE services_id = $1
        `;
        await pool.query(query, [id]);
    }
}
