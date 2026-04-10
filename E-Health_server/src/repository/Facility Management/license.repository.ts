// src/repository/Facility Management/license.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateLicenseInput, UpdateLicenseInput, UserLicense } from '../../models/Facility Management/license.model';
import { v4 as uuidv4 } from 'uuid';

export class LicenseRepository {

    /**
     * Sinh mã License ID theo format chuẩn
     */
    static generateLicenseId(): string {
        const yy = String(new Date().getFullYear()).slice(-2);
        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        return `LIC_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo giấy phép mới
     */
    static async create(data: CreateLicenseInput): Promise<UserLicense> {
        const id = this.generateLicenseId();
        const query = `
            INSERT INTO user_licenses (licenses_id, user_id, license_type, license_number, issue_date, expiry_date, issued_by, document_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *,
                TO_CHAR(issue_date, 'YYYY-MM-DD') AS issue_date,
                TO_CHAR(expiry_date, 'YYYY-MM-DD') AS expiry_date;
        `;
        const values = [
            id, data.user_id, data.license_type, data.license_number,
            data.issue_date, data.expiry_date || null,
            data.issued_by || null, data.document_url || null
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách giấy phép (có filter theo user_id, license_type, expiring_in_days)
     */
    static async findAll(filters: { user_id?: string; license_type?: string; expiring_in_days?: number }): Promise<UserLicense[]> {
        let query = `
            SELECT ul.*,
                   TO_CHAR(ul.issue_date, 'YYYY-MM-DD') AS issue_date,
                   TO_CHAR(ul.expiry_date, 'YYYY-MM-DD') AS expiry_date,
                   up.full_name,
                   CASE
                       WHEN ul.expiry_date IS NOT NULL
                       THEN (ul.expiry_date - CURRENT_DATE)
                       ELSE NULL
                   END AS days_remaining,
                   CASE
                       WHEN ul.expiry_date IS NOT NULL AND ul.expiry_date < CURRENT_DATE
                       THEN true
                       ELSE false
                   END AS is_expired
            FROM user_licenses ul
            LEFT JOIN user_profiles up ON ul.user_id = up.user_id
            WHERE ul.deleted_at IS NULL
        `;
        const values: any[] = [];
        let index = 1;

        if (filters.user_id) {
            query += ` AND ul.user_id = $${index++}`;
            values.push(filters.user_id);
        }
        if (filters.license_type) {
            query += ` AND ul.license_type = $${index++}`;
            values.push(filters.license_type);
        }
        if (filters.expiring_in_days !== undefined) {
            query += ` AND ul.expiry_date IS NOT NULL AND ul.expiry_date <= CURRENT_DATE + $${index++}::integer`;
            values.push(filters.expiring_in_days);
        }

        query += ` ORDER BY ul.created_at DESC`;
        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Xem chi tiết 1 giấy phép (JOIN tên nhân viên)
     */
    static async findById(id: string): Promise<UserLicense | null> {
        const query = `
            SELECT ul.*,
                   TO_CHAR(ul.issue_date, 'YYYY-MM-DD') AS issue_date,
                   TO_CHAR(ul.expiry_date, 'YYYY-MM-DD') AS expiry_date,
                   up.full_name,
                   CASE
                       WHEN ul.expiry_date IS NOT NULL
                       THEN (ul.expiry_date - CURRENT_DATE)
                       ELSE NULL
                   END AS days_remaining,
                   CASE
                       WHEN ul.expiry_date IS NOT NULL AND ul.expiry_date < CURRENT_DATE
                       THEN true
                       ELSE false
                   END AS is_expired
            FROM user_licenses ul
            LEFT JOIN user_profiles up ON ul.user_id = up.user_id
            WHERE ul.licenses_id = $1 AND ul.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật giấy phép
     */
    static async update(id: string, data: UpdateLicenseInput): Promise<UserLicense | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let index = 1;

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                setClauses.push(`${key} = $${index++}`);
                values.push(value);
            }
        }

        if (setClauses.length === 0) return null;

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE user_licenses SET ${setClauses.join(', ')}
            WHERE licenses_id = $${index} AND deleted_at IS NULL
            RETURNING *,
                TO_CHAR(issue_date, 'YYYY-MM-DD') AS issue_date,
                TO_CHAR(expiry_date, 'YYYY-MM-DD') AS expiry_date;
        `;
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Xóa (Soft Delete) giấy phép
     */
    static async softDelete(id: string): Promise<boolean> {
        const query = `
            UPDATE user_licenses SET deleted_at = NOW()
            WHERE licenses_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra trùng lặp license_number (dùng khi tạo/sửa)
     */
    static async findByLicenseNumber(licenseNumber: string, excludeId?: string): Promise<UserLicense | null> {
        let query = `SELECT * FROM user_licenses WHERE license_number = $1 AND deleted_at IS NULL`;
        const values: any[] = [licenseNumber];

        if (excludeId) {
            query += ` AND licenses_id != $2`;
            values.push(excludeId);
        }

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật đường dẫn file đính kèm (document_url) một cách độc lập.
     */
    static async updateDocumentUrl(id: string, url: string | null): Promise<boolean> {
        const query = `
            UPDATE user_licenses SET document_url = $1, updated_at = NOW()
            WHERE licenses_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [url, id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy danh sách giấy phép SẮP hết hạn (trong vòng N ngày tới, chưa qua hạn).
     */
    static async findExpiringLicenses(days: number): Promise<UserLicense[]> {
        const query = `
            SELECT ul.*,
                   TO_CHAR(ul.issue_date, 'YYYY-MM-DD') AS issue_date,
                   TO_CHAR(ul.expiry_date, 'YYYY-MM-DD') AS expiry_date,
                   up.full_name,
                   (ul.expiry_date - CURRENT_DATE) AS days_remaining
            FROM user_licenses ul
            LEFT JOIN user_profiles up ON ul.user_id = up.user_id
            WHERE ul.deleted_at IS NULL
              AND ul.expiry_date IS NOT NULL
              AND ul.expiry_date >= CURRENT_DATE
              AND ul.expiry_date <= CURRENT_DATE + $1::integer
            ORDER BY ul.expiry_date ASC
        `;
        const result = await pool.query(query, [days]);
        return result.rows;
    }

    /**
     * Lấy danh sách giấy phép ĐÃ hết hạn (expiry_date < hôm nay).
     */
    static async findExpiredLicenses(): Promise<UserLicense[]> {
        const query = `
            SELECT ul.*,
                   TO_CHAR(ul.issue_date, 'YYYY-MM-DD') AS issue_date,
                   TO_CHAR(ul.expiry_date, 'YYYY-MM-DD') AS expiry_date,
                   up.full_name,
                   (ul.expiry_date - CURRENT_DATE) AS days_remaining
            FROM user_licenses ul
            LEFT JOIN user_profiles up ON ul.user_id = up.user_id
            WHERE ul.deleted_at IS NULL
              AND ul.expiry_date IS NOT NULL
              AND ul.expiry_date < CURRENT_DATE
            ORDER BY ul.expiry_date ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}
