import { pool } from '../../config/postgresdb';
import { CreateLicenseInput, UpdateLicenseInput } from '../../models/Facility Management/staff.model';
import { randomUUID } from 'crypto';

export class UserLicenseRepository {
    /**
     * Lấy danh sách bằng cấp chứng chỉ của người dùng
     */
    static async getLicensesByUserId(userId: string) {
        const query = `SELECT * FROM user_licenses WHERE user_id = $1 ORDER BY issue_date DESC`;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Lấy chi tiết một chứng chỉ
     */
    static async getLicenseById(licenseId: string) {
        const query = `SELECT * FROM user_licenses WHERE licenses_id = $1`;
        const result = await pool.query(query, [licenseId]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra số chứng chỉ đã tồn tại chưa
     */
    static async checkLicenseNumberExists(licenseNumber: string, excludeLicenseId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM user_licenses WHERE license_number = $1`;
        const params: any[] = [licenseNumber];

        if (excludeLicenseId) {
            query += ` AND licenses_id != $2`;
            params.push(excludeLicenseId);
        }

        const result = await pool.query(query, params);
        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * Tạo chứng chỉ mới
     */
    static async createLicense(userId: string, data: CreateLicenseInput): Promise<string> {
        const licenseId = `LIC_${randomUUID()}`;
        const query = `
            INSERT INTO user_licenses (
                licenses_id, user_id, license_type, license_number, 
                issue_date, expiry_date, issued_by, document_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING licenses_id;
        `;
        const params = [
            licenseId, userId, data.license_type, data.license_number,
            data.issue_date, data.expiry_date || null, data.issued_by || null, data.document_url || null
        ];

        const result = await pool.query(query, params);
        return result.rows[0].licenses_id;
    }

    /**
     * Cập nhật chứng chỉ
     */
    static async updateLicense(licenseId: string, data: UpdateLicenseInput): Promise<boolean> {
        const updates: string[] = [];
        const params: any[] = [];
        let index = 1;

        if (data.license_type) { updates.push(`license_type = $${index++}`); params.push(data.license_type); }
        if (data.license_number) { updates.push(`license_number = $${index++}`); params.push(data.license_number); }
        if (data.issue_date) { updates.push(`issue_date = $${index++}`); params.push(data.issue_date); }
        if (data.expiry_date !== undefined) { updates.push(`expiry_date = $${index++}`); params.push(data.expiry_date); }
        if (data.issued_by !== undefined) { updates.push(`issued_by = $${index++}`); params.push(data.issued_by); }
        if (data.document_url !== undefined) { updates.push(`document_url = $${index++}`); params.push(data.document_url); }

        if (updates.length === 0) return true;

        params.push(licenseId);
        const query = `UPDATE user_licenses SET ${updates.join(', ')} WHERE licenses_id = $${index}`;
        const result = await pool.query(query, params);
        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * Xóa chứng chỉ
     */
    static async deleteLicense(licenseId: string): Promise<boolean> {
        const query = `DELETE FROM user_licenses WHERE licenses_id = $1`;
        const result = await pool.query(query, [licenseId]);
        return result.rowCount !== null && result.rowCount > 0;
    }
}
