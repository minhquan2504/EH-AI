import { pool } from '../../config/postgresdb';
import {
    InsuranceProvider,
    CreateInsuranceProviderInput,
    UpdateInsuranceProviderInput,
    PaginatedInsuranceProviders
} from '../../models/Patient Management/insurance-provider.model';

export class InsuranceProviderRepository {
    /**
     * Lấy danh sách đơn vị bảo hiểm (hỗ trợ phân trang, tìm kiếm, lọc)
     */
    static async getProviders(
        search?: string,
        insuranceType?: string,
        isActive?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedInsuranceProviders> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereClauses: string[] = ['1=1'];
        let paramIndex = 1;

        if (search) {
            whereClauses.push(`(provider_code ILIKE $${paramIndex} OR provider_name ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (insuranceType) {
            whereClauses.push(`insurance_type = $${paramIndex}`);
            params.push(insuranceType);
            paramIndex++;
        }

        if (isActive !== undefined) {
            whereClauses.push(`is_active = $${paramIndex}`);
            params.push(isActive === 'true');
            paramIndex++;
        }

        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM insurance_providers WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT * FROM insurance_providers 
            WHERE ${whereSql}
            ORDER BY created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataParams = [...params, limit, offset];
        const dataResult = await pool.query(dataQuery, dataParams);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Lấy chi tiết bằng ID
     */
    static async getProviderById(id: string): Promise<InsuranceProvider | null> {
        const query = `SELECT * FROM insurance_providers WHERE insurance_providers_id = $1`;
        const result = await pool.query(query, [id]);
        return result.rowCount ? result.rows[0] : null;
    }

    /**
     * Kiểm tra tính duy nhất của provider_code (loại trừ bản ghi đang sửa)
     */
    static async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM insurance_providers WHERE provider_code = $1`;
        const params: any[] = [code];

        if (excludeId) {
            query += ` AND insurance_providers_id != $2`;
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Thêm mới đơn vị bảo hiểm
     */
    static async createProvider(id: string, input: CreateInsuranceProviderInput): Promise<InsuranceProvider> {
        const query = `
            INSERT INTO insurance_providers (
                insurance_providers_id, provider_code, provider_name, insurance_type, 
                contact_phone, contact_email, address, support_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `;
        const values = [
            id,
            input.provider_code,
            input.provider_name,
            input.insurance_type,
            input.contact_phone || null,
            input.contact_email || null,
            input.address || null,
            input.support_notes || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin đơn vị bảo hiểm
     */
    static async updateProvider(id: string, input: UpdateInsuranceProviderInput): Promise<InsuranceProvider> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.entries(input).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE insurance_providers 
            SET ${fields.join(', ')} 
            WHERE insurance_providers_id = $${paramIndex} 
            RETURNING *
        `;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0];
    }
}
