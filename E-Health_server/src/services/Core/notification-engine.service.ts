import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../utils/app-error.util';
import { UserRepository } from '../../repository/Core/user.repository';
import { NotificationTemplateRepository } from '../../repository/Core/notification-template.repository';
import { NotificationRoleConfigRepository } from '../../repository/Core/notification-role-config.repository';
import { UserNotificationRepository } from '../../repository/Core/user-notification.repository';
import { CustomNotificationInput, TriggerEventInput } from '../../models/Core/notification.model';
import { MailService } from './auth_mail.service';
import { fcmAdmin } from '../../config/firebase';
import { FcmTokenRepository } from '../../repository/Core/fcm-token.repository';

export class NotificationEngineService {
    /**
     * Hàm Parse Template
     */
    private static parseTemplate(templateString: string, variables: Record<string, any>): string {
        if (!templateString) return '';
        return templateString.replace(/{{(.*?)}}/g, (match, key) => {
            const trimmedKey = key.trim();
            return variables[trimmedKey] !== undefined ? String(variables[trimmedKey]) : match;
        });
    }

    /**
     * Gửi Email 
     */
    private static async sendEmail(email: string, subject: string, htmlContent: string) {
        await MailService.send({
            to: email,
            subject: subject,
            html: htmlContent
        });
        console.log(`[EMAIL DISPATCHER] -> Đã gửi mail thành công tới: ${email}`);
    }

    /**
     * Gửi Push Notification Mobile (FCM)
     */
    private static async sendPush(userId: string, title: string, body: string, dataPayload: any) {

        const tokens = await FcmTokenRepository.getTokensByUser(userId);
        if (tokens.length === 0) return; // User không đăng kí nhận push

        // Chuyển payload thành dạng chuỗi để truyền đi (Firebase bắt buộc)
        const stringifiedData: Record<string, string> = {};
        if (dataPayload) {
            for (const key in dataPayload) {
                if (dataPayload[key] !== null && dataPayload[key] !== undefined) {
                    stringifiedData[key] = String(dataPayload[key]);
                }
            }
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: stringifiedData,
            tokens: tokens
        };

        try {
            // BẤM NÚT GỬI FIREBASE !!
            const response = await fcmAdmin.messaging().sendEachForMulticast(message);

            console.log(`[FIREBASE] Đã gửi ${response.successCount} tin, Thất bại ${response.failureCount} tin`);

            // Nếu gửi thất bại vì User đã Xóa App, Firebase sẽ báo lại. 
            // Ta phải XÓA token đó khỏi DB để lần sau code không bị gửi thừa.
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                await FcmTokenRepository.removeTokens(failedTokens);
            }

        } catch (error) {
            console.error('Lỗi khi gọi Firebase:', error);
        }
    }

    /**
     * Gửi thông báo thủ công 
     */
    static async sendCustomNotification(input: CustomNotificationInput) {
        // Lấy danh sách User mục tiêu
        let q = `SELECT users_id, email FROM users u WHERE deleted_at IS NULL AND status = 'ACTIVE'`;
        const params: any[] = [];

        if (input.role_id) {
            q = `
                SELECT u.users_id, u.email 
                FROM users u
                JOIN user_roles ur ON u.users_id = ur.user_id
                WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE' AND ur.role_id = $1
            `;
            params.push(input.role_id);
        }

        const { pool } = require('../../config/postgresdb');
        const targetUsers = await pool.query(q, params);

        if (targetUsers.rowCount === 0) return 0;

        // Xử lý song song bằng Promise.all thay vì vòng lặp for..of tuần tự
        const promises = targetUsers.rows.map(async (user: any) => {
            try {
                // Lưu In-App Inbox
                await UserNotificationRepository.createUserNotification(
                    `UNOT_${uuidv4()}`,
                    user.users_id,
                    null,
                    input.title,
                    input.content,
                    input.data_payload || {}
                );

                const externalTasks = [];
                // Gửi Email thật
                if (input.body_email && user.email) {
                    externalTasks.push(this.sendEmail(user.email, input.title, input.body_email));
                }

                // Gửi Push
                if (input.body_push) {
                    externalTasks.push(this.sendPush(user.users_id, input.title, input.body_push, input.data_payload));
                }

                if (externalTasks.length > 0) {
                    await Promise.allSettled(externalTasks);
                }
            } catch (err: any) {
                console.error(`Lỗi gửi Broadcast cho user ${user.users_id}:`, err);
            }
        });

        await Promise.all(promises);
        return targetUsers.rowCount;
    }

    /**
     * Trigger Event tự động từ luồng hệ thống
     */
    static async triggerEvent(input: TriggerEventInput) {
        // Lấy thông tin user nhận và Role của user đó
        const user = await UserRepository.getUserById(input.target_user_id);
        if (!user || user.status !== 'ACTIVE') return; // Bỏ qua nếu user khóa/bị xóa

        const roleCode = user.roles && user.roles.length > 0 ? user.roles[0] : null;

        // Lấy role_id từ database bằng roleCode
        const { pool } = require('../../config/postgresdb');
        let roleId = null;
        if (roleCode) {
            const roleRes = await pool.query('SELECT roles_id FROM roles WHERE code = $1', [roleCode]);
            if (roleRes.rowCount > 0) roleId = roleRes.rows[0].roles_id;
        }

        // Lấy Template
        const template = await NotificationTemplateRepository.getTemplateByCode(input.template_code);
        if (!template || !template.is_active) {
            throw new AppError(404, 'TEMPLATE_NOT_FOUND', `Không tìm thấy template đang kích hoạt: ${input.template_code}`);
        }

        // Lấy cấu hình Role Matrix
        let allowInapp = true;
        let allowEmail = false;
        let allowPush = false;

        if (roleId) {
            const config = await NotificationRoleConfigRepository.getConfig(roleId, template.category_id);
            if (config) {
                allowInapp = config.allow_inapp;
                allowEmail = config.allow_email;
                allowPush = config.allow_push;
            }
        }

        const finalTitle = this.parseTemplate(template.title_template, input.variables);

        // Kênh IN-APP
        if (allowInapp && template.body_inapp) {
            const finalInapp = this.parseTemplate(template.body_inapp, input.variables);
            await UserNotificationRepository.createUserNotification(
                `UNOT_${uuidv4()}`,
                input.target_user_id,
                template.notification_templates_id,
                finalTitle,
                finalInapp,
                input.variables
            );
        }

        // Kênh EMAIL
        if (allowEmail && template.body_email && user.email) {
            const finalEmail = this.parseTemplate(template.body_email, input.variables);
            await this.sendEmail(user.email, finalTitle, finalEmail);
        }

        // Kênh PUSH
        if (allowPush && template.body_push) {
            const finalPush = this.parseTemplate(template.body_push, input.variables);
            await this.sendPush(input.target_user_id, finalTitle, finalPush, input.variables);
        }

        return true;
    }
}
