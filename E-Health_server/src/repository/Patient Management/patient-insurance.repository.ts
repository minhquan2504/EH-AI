import { pool } from '../../config/postgresdb';
import {
    PatientInsurance,
    CreatePatientInsuranceInput,
    UpdatePatientInsuranceInput,
    PaginatedPatientInsurances
} from '../../models/Patient Management/patient-insurance.model';

export class PatientInsuranceRepository {
    /**
     * Lấy danh sách thẻ bảo hiểm (JOIN bảng insurance_providers)
     */
    static async getInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereClauses: string[] = ['1=1'];
        let paramIndex = 1;

        if (patientId) {
            whereClauses.push(`pi.patient_id = $${paramIndex}`);
            params.push(patientId);
            paramIndex++;
        }

        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM patient_insurances pi WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT pi.*, ip.provider_name, ip.insurance_type
            FROM patient_insurances pi
            LEFT JOIN insurance_providers ip ON pi.provider_id = ip.insurance_providers_id
            WHERE ${whereSql}
            ORDER BY pi.is_primary DESC, pi.created_at DESC
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
     * Chi tiết 1 thẻ (JOIN provider)
     */
    static async getInsuranceById(id: string): Promise<PatientInsurance | null> {
        const query = `
            SELECT pi.*, ip.provider_name, ip.insurance_type
            FROM patient_insurances pi
            LEFT JOIN insurance_providers ip ON pi.provider_id = ip.insurance_providers_id
            WHERE pi.patient_insurances_id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rowCount ? result.rows[0] : null;
    }

    /**
     * Kiểm tra trùng số thẻ bảo hiểm
     */
    static async checkDuplicateNumber(insuranceNumber: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM patient_insurances WHERE insurance_number = $1`;
        const params: any[] = [insuranceNumber];

        if (excludeId) {
            query += ` AND patient_insurances_id != $2`;
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy thẻ chính (is_primary = true) của bệnh nhân
     */
    static async getPrimaryInsurance(patientId: string): Promise<PatientInsurance | null> {
        const query = `
            SELECT pi.*, ip.provider_name, ip.insurance_type
            FROM patient_insurances pi
            LEFT JOIN insurance_providers ip ON pi.provider_id = ip.insurance_providers_id
            WHERE pi.patient_id = $1 AND pi.is_primary = TRUE
            LIMIT 1
        `;
        const result = await pool.query(query, [patientId]);
        return result.rowCount ? result.rows[0] : null;
    }

    /**
     * Bỏ đánh dấu primary tất cả thẻ của bệnh nhân
     */
    static async unsetAllPrimary(patientId: string): Promise<void> {
        await pool.query(`UPDATE patient_insurances SET is_primary = FALSE WHERE patient_id = $1`, [patientId]);
    }

    /**
     * Tạo mới thẻ bảo hiểm
     */
    static async createInsurance(id: string, input: CreatePatientInsuranceInput): Promise<PatientInsurance> {
        const query = `
            INSERT INTO patient_insurances (
                patient_insurances_id, patient_id, insurance_type, provider_id, insurance_number, 
                start_date, end_date, coverage_percent, is_primary, document_url
            ) VALUES (
                $1, $2, 
                (SELECT insurance_type FROM insurance_providers WHERE insurance_providers_id = $3),
                $3, $4, $5, $6, $7, $8, $9
            )
            RETURNING *
        `;
        const values = [
            id,
            input.patient_id,
            input.provider_id,
            input.insurance_number,
            input.start_date,
            input.end_date,
            input.coverage_percent || null,
            input.is_primary ?? false,
            input.document_url || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật thẻ bảo hiểm
     */
    static async updateInsurance(id: string, input: UpdatePatientInsuranceInput): Promise<PatientInsurance> {
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

        const query = `
            UPDATE patient_insurances 
            SET ${fields.join(', ')} 
            WHERE patient_insurances_id = $${paramIndex} 
            RETURNING *
        `;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Xóa thẻ bảo hiểm (Hard Delete)
     */
    static async deleteInsurance(id: string): Promise<void> {
        await pool.query(`DELETE FROM patient_insurances WHERE patient_insurances_id = $1`, [id]);
    }

    /**
     * Danh sách thẻ bảo hiểm còn hiệu lực (end_date >= CURRENT_DATE)
     */
    static async getActiveInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereClauses: string[] = ['pi.end_date >= CURRENT_DATE', 'pi.start_date <= CURRENT_DATE'];
        let paramIndex = 1;

        if (patientId) {
            whereClauses.push(`pi.patient_id = $${paramIndex}`);
            params.push(patientId);
            paramIndex++;
        }

        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM patient_insurances pi WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT pi.*, ip.provider_name, ip.insurance_type
            FROM patient_insurances pi
            LEFT JOIN insurance_providers ip ON pi.provider_id = ip.insurance_providers_id
            WHERE ${whereSql}
            ORDER BY pi.is_primary DESC, pi.end_date ASC
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
     * Danh sách thẻ bảo hiểm đã hết hạn (end_date < CURRENT_DATE)
     */
    static async getExpiredInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereClauses: string[] = ['pi.end_date < CURRENT_DATE'];
        let paramIndex = 1;

        if (patientId) {
            whereClauses.push(`pi.patient_id = $${paramIndex}`);
            params.push(patientId);
            paramIndex++;
        }

        const whereSql = whereClauses.join(' AND ');

        const countQuery = `SELECT COUNT(*) FROM patient_insurances pi WHERE ${whereSql}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT pi.*, ip.provider_name, ip.insurance_type
            FROM patient_insurances pi
            LEFT JOIN insurance_providers ip ON pi.provider_id = ip.insurance_providers_id
            WHERE ${whereSql}
            ORDER BY pi.end_date DESC
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
     * Đếm số thẻ bảo hiểm còn hiệu lực của bệnh nhân
     */
    static async countActiveInsurances(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*) FROM patient_insurances WHERE patient_id = $1 AND end_date >= CURRENT_DATE AND start_date <= CURRENT_DATE`,
            [patientId]
        );
        return parseInt(result.rows[0].count, 10);
    }
}
