import { pool } from '../../config/postgresdb';
import {
    InsuranceCoverage,
    CreateInsuranceCoverageInput,
    UpdateInsuranceCoverageInput,
    PaginatedInsuranceCoverages
} from '../../models/Patient Management/insurance-coverage.model';

export class InsuranceCoverageRepository {
    /**
     * Lấy danh sách tỷ lệ chi trả
     */
    static async getCoverages(
        providerId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedInsuranceCoverages> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereClauses: string[] = ['1=1'];
        let paramIndex = 1;

        if (providerId) {
            whereClauses.push(`ic.provider_id = $${paramIndex}`);
            params.push(providerId);
            paramIndex++;
        }

        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM insurance_coverages ic WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT ic.*, ip.provider_name, ip.insurance_type
            FROM insurance_coverages ic
            LEFT JOIN insurance_providers ip ON ic.provider_id = ip.insurance_providers_id
            WHERE ${whereSql}
            ORDER BY ic.created_at DESC
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
     * Chi tiết 1 tỷ lệ chi trả 
     */
    static async getCoverageById(id: string): Promise<InsuranceCoverage | null> {
        const query = `
            SELECT ic.*, ip.provider_name, ip.insurance_type
            FROM insurance_coverages ic
            LEFT JOIN insurance_providers ip ON ic.provider_id = ip.insurance_providers_id
            WHERE ic.insurance_coverages_id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rowCount ? result.rows[0] : null;
    }

    /**
     * Kiểm tra trùng tên gói cho cùng 1 provider
     */
    static async checkDuplicateName(coverageName: string, providerId: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM insurance_coverages WHERE coverage_name = $1 AND provider_id = $2`;
        const params: any[] = [coverageName, providerId];

        if (excludeId) {
            query += ` AND insurance_coverages_id != $3`;
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo mới tỷ lệ chi trả
     */
    static async createCoverage(id: string, input: CreateInsuranceCoverageInput): Promise<InsuranceCoverage> {
        const query = `
            INSERT INTO insurance_coverages (
                insurance_coverages_id, coverage_name, provider_id, coverage_percent, description
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [
            id,
            input.coverage_name,
            input.provider_id,
            input.coverage_percent,
            input.description || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật tỷ lệ chi trả
     */
    static async updateCoverage(id: string, input: UpdateInsuranceCoverageInput): Promise<InsuranceCoverage> {
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

        fields.push(`updated_at = NOW()`);

        const query = `
            UPDATE insurance_coverages
            SET ${fields.join(', ')}
            WHERE insurance_coverages_id = $${paramIndex}
            RETURNING *
        `;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Xóa tỷ lệ chi trả
     */
    static async deleteCoverage(id: string): Promise<void> {
        await pool.query(`DELETE FROM insurance_coverages WHERE insurance_coverages_id = $1`, [id]);
    }
}
