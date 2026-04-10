import { pool } from '../../config/postgresdb';
import { UserNotification } from '../../models/Core/notification.model';

export class UserNotificationRepository {
    /**
     * Lưu một thông báo In-app vào Inbox của user
     */
    static async createUserNotification(
        id: string,
        userId: string,
        templateId: string | null,
        title: string,
        content: string,
        dataPayload: any
    ): Promise<UserNotification> {
        const query = `
            INSERT INTO user_notifications (
                user_notifications_id, user_id, template_id, title, content, data_payload
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [id, userId, templateId, title, content, dataPayload]);
        return result.rows[0];
    }

    /**
     * Lấy danh sách Inbox của user
     */
    static async getUserInbox(
        userId: string,
        page: number,
        limit: number
    ): Promise<{ data: UserNotification[]; total: number; unreadCount: number; page: number; limit: number; totalPages: number }> {
        const offset = (page - 1) * limit;

        // Đếm tổng số
        const countQuery = `SELECT COUNT(*) FROM user_notifications WHERE user_id = $1`;
        const countResult = await pool.query(countQuery, [userId]);
        const total = parseInt(countResult.rows[0].count, 10);

        // Đếm số chưa đọc
        const unreadQuery = `SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = FALSE`;
        const unreadResult = await pool.query(unreadQuery, [userId]);
        const unreadCount = parseInt(unreadResult.rows[0].count, 10);

        // Lấy Data
        const dataQuery = `
            SELECT * FROM user_notifications 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const dataResult = await pool.query(dataQuery, [userId, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            unreadCount,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    static async markAsRead(id: string, userId: string): Promise<boolean> {
        const query = `
            UPDATE user_notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE user_notifications_id = $1 AND user_id = $2 AND is_read = FALSE
        `;
        const result = await pool.query(query, [id, userId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Đánh dấu TẤT CẢ là đã đọc
     */
    static async markAllAsRead(userId: string): Promise<number> {
        const query = `
            UPDATE user_notifications
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND is_read = FALSE
        `;
        const result = await pool.query(query, [userId]);
        return result.rowCount ?? 0;
    }
}
