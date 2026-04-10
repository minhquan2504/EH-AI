import { pool } from '../../config/postgresdb';
import { FcmToken } from '../../models/Core/notification.model';
import { v4 as uuidv4 } from 'uuid';

export class FcmTokenRepository {
    /**
     * Upsert (Insert or Update) Token của User
     */
    static async upsertToken(userId: string, fcmToken: string, deviceName?: string): Promise<FcmToken> {
        // Kiểm tra xem token này đã tồn tại chưa
        const checkQuery = `SELECT token_id FROM user_fcm_tokens WHERE fcm_token = $1`;
        const checkRes = await pool.query(checkQuery, [fcmToken]);

        if (checkRes.rowCount && checkRes.rowCount > 0) {
            // Update
            const updateQuery = `
                UPDATE user_fcm_tokens 
                SET user_id = $1, device_name = $2, last_active = CURRENT_TIMESTAMP
                WHERE fcm_token = $3
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [userId, deviceName || null, fcmToken]);
            return result.rows[0];
        } else {
            // Insert
            const id = `FCM_${uuidv4()}`;
            const insertQuery = `
                INSERT INTO user_fcm_tokens (token_id, user_id, fcm_token, device_name)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const result = await pool.query(insertQuery, [id, userId, fcmToken, deviceName || null]);
            return result.rows[0];
        }
    }

    /**
     * Lấy toàn bộ Tokens của một User
     */
    static async getTokensByUser(userId: string): Promise<string[]> {
        const query = `SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        return result.rows.map(row => row.fcm_token);
    }

    /**
     * Xóa các token (ví dụ: device đã gỡ App)
     */
    static async removeTokens(tokens: string[]): Promise<void> {
        if (!tokens || tokens.length === 0) return;
        const query = `DELETE FROM user_fcm_tokens WHERE fcm_token = ANY($1)`;
        await pool.query(query, [tokens]);
    }
}
