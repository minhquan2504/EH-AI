import { Request, Response, NextFunction } from 'express';
import { UserNotificationRepository } from '../../repository/Core/user-notification.repository';
import { NotificationEngineService } from '../../services/Core/notification-engine.service';
import { CustomNotificationInput } from '../../models/Core/notification.model';

export class UserNotificationController {
    /**
     * [USER] Xem hộp thư In-app cá nhân
     */
    static async getMyInbox(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await UserNotificationRepository.getUserInbox(userId!, page, limit);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách thông báo thành công.',
                data: result.data,
                meta: {
                    unread_count: result.unreadCount
                },
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * [USER] Đọc 1 thông báo
     */
    static async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const id = req.params.id as string;

            await UserNotificationRepository.markAsRead(id, userId!);

            res.status(200).json({
                success: true,
                message: 'Đã đánh dấu đã đọc.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * [USER] Đọc tất cả thông báo
     */
    static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;

            const updatedCount = await UserNotificationRepository.markAllAsRead(userId!);

            res.status(200).json({
                success: true,
                message: `Đã đánh dấu ${updatedCount} thông báo là đã đọc.`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN/SYSTEM] Broadcast/ Gửi thông báo thủ công bằng tay (Không cần trigger template)
     */
    static async sendManualNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CustomNotificationInput = req.body;

            const sentCount = await NotificationEngineService.sendCustomNotification(data);

            res.status(200).json({
                success: true,
                message: `Đã gửi thông báo thành công cho ${sentCount} người dùng.`,
                data: { sent_count: sentCount }
            });
        } catch (error) {
            next(error);
        }
    }
}
