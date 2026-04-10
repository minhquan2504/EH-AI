import { pool } from '../../config/postgresdb';
import { UserProfileResponse, UpdateProfileInput, UpdateSettingsInput } from '../../models/Core/profile.model';

export class ProfileRepository {
    /**
     * Lấy thông tin chi tiết hồ sơ cá nhân của một người dùng
     */
    static async getProfileByUserId(userId: string): Promise<UserProfileResponse | null> {
        const query = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number, 
                u.status, 
                u.last_login_at, 
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address,
                COALESCE(up.preferences, '{}'::jsonb) AS preferences,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
            FROM users u
            JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            WHERE u.users_id = $1 AND u.deleted_at IS NULL
            GROUP BY u.users_id, up.user_profiles_id
        `;

        const result = await pool.query(query, [userId]);
        if (result.rowCount === 0) return null;

        return result.rows[0] as UserProfileResponse;
    }

    /**
     * Cập nhật thông tin hồ sơ cơ bản
     */
    static async updateProfile(userId: string, data: UpdateProfileInput): Promise<boolean> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (data.full_name !== undefined) {
            fields.push(`full_name = $${paramIdx++}`);
            values.push(data.full_name);
        }
        if (data.dob !== undefined) {
            fields.push(`dob = $${paramIdx++}`);
            values.push(data.dob);
        }
        if (data.gender !== undefined) {
            fields.push(`gender = $${paramIdx++}`);
            values.push(data.gender);
        }
        if (data.address !== undefined) {
            fields.push(`address = $${paramIdx++}`);
            values.push(data.address);
        }
        if (data.avatar_url !== undefined) {
            fields.push(`avatar_url = $${paramIdx++}`);
            values.push(data.avatar_url);
        }
        if (data.identity_card_number !== undefined) {
            fields.push(`identity_card_number = $${paramIdx++}`);
            values.push(data.identity_card_number);
        }

        if (fields.length === 0) return true;

        values.push(userId);
        const query = `
            UPDATE user_profiles 
            SET ${fields.join(', ')}
            WHERE user_id = $${paramIdx}
        `;

        const result = await pool.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Cập nhật cài đặt cá nhân
     */
    static async updateSettings(userId: string, data: UpdateSettingsInput): Promise<boolean> {
        const query = `
            UPDATE user_profiles
            SET preferences = $1
            WHERE user_id = $2
        `;
        const result = await pool.query(query, [data.preferences, userId]);
        return (result.rowCount ?? 0) > 0;
    }
}
