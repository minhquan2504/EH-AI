import { MailService } from '../services/Core/auth_mail.service';

export class AuthMailUtil {

    /*
    * Template chung cho email
    */

    private static getTemplate(title: string, contentBody: string): string {
        const currentYear = new Date().getFullYear();

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .header { background-color: #1e88e5; padding: 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
                .content { padding: 30px 25px; color: #333333; line-height: 1.6; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
                .btn { display: inline-block; padding: 12px 30px; background-color: #1e88e5; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 6px rgba(30,136,229,0.3); }
                .otp-box { background-color: #e3f2fd; color: #1565c0; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px dashed #1e88e5; }
                .link-text { color: #1e88e5; word-break: break-all; font-size: 13px; }
                .warning { font-size: 13px; color: #666; font-style: italic; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div style="padding: 20px 0;">
                <div class="container">
                    <div class="header">
                        <h1>E-Health System</h1>
                    </div>

                    <div class="content">
                        <h2 style="color: #1e88e5; margin-top: 0;">${title}</h2>
                        ${contentBody}
                    </div>

                    <div class="footer">
                        <p>&copy; ${currentYear} E-Health System. All rights reserved.</p>
                        <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        <p>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    /**
     * Gửi email reset password bằng OTP
     */
    static async sendResetPasswordOtpEmail(toEmail: string, otp: string): Promise<void> {
        const subject = `[E-Health] Mã xác thực đặt lại mật khẩu: ${otp}`;

        const body = `
            <p>Xin chào,</p>
            <p>Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${toEmail}</strong>. Dưới đây là mã xác thực (OTP) của bạn:</p>
            
            <div class="otp-box">${otp}</div>
            
            <p><strong>Lưu ý:</strong></p>
            <ul>
                <li>Mã này có hiệu lực trong vòng <strong>15 phút</strong>.</li>
                <li>Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.</li>
            </ul>
            
            <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn được bảo mật an toàn.</p>
        `;

        await MailService.send({
            to: toEmail,
            subject,
            html: this.getTemplate('Quên Mật Khẩu?', body)
        });
    }

    /**
     * Gửi email xác thực tài khoản (Link Verify)
     */
    static async sendVerifyEmail(email: string, verifyLink: string): Promise<void> {
        const subject = '[E-Health] Kích hoạt tài khoản';

        const body = `
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đăng ký tham gia <strong>E-Health System</strong>. Để bắt đầu sử dụng dịch vụ, vui lòng xác thực địa chỉ email của bạn.</p>
            
            <div style="text-align: center;">
                <a href="${verifyLink}" class="btn">Kích Hoạt Tài Khoản Ngay</a>
            </div>

            <p class="warning">Hoặc truy cập trực tiếp đường dẫn bên dưới:</p>
            <p><a href="${verifyLink}" class="link-text">${verifyLink}</a></p>
        `;

        await MailService.send({
            to: email,
            subject,
            html: this.getTemplate('Xác Thực Tài Khoản', body)
        });
    }

    /**
     * Gửi email mã OTP
     */
    static async sendOtpEmail(email: string, otp: string): Promise<void> {
        const subject = `[E-Health] Mã xác thực: ${otp}`;

        const body = `
            <p>Xin chào,</p>
            <p>Bạn đang thực hiện đăng ký hoặc đăng nhập vào hệ thống <strong>E-Health</strong>. Dưới đây là mã xác thực (OTP) của bạn:</p>
            
            <div class="otp-box">${otp}</div>
            
            <p><strong>Lưu ý:</strong></p>
            <ul>
                <li>Mã này có hiệu lực trong vòng <strong>5 phút</strong>.</li>
                <li>Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ.</li>
            </ul>
            
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay lập tức.</p>
        `;

        await MailService.send({
            to: email,
            subject,
            html: this.getTemplate('Mã Xác Thực OTP', body)
        });
    }
    /**
     * Gửi email thông báo tài khoản mới được tạo bởi Admin
     */
    static async sendNewAccountEmail(email: string, rawPassword?: string): Promise<void> {
        const subject = `[E-Health] Tài khoản của bạn đã được tạo`;

        const passwordHtml = rawPassword
            ? `<p>Mật khẩu tạm thời đăng nhập của bạn là:</p><div class="otp-box">${rawPassword}</div><p><i>Vui lòng đổi mật khẩu ngay trong lần đăng nhập đầu tiên để bảo mật tài khoản.</i></p>`
            : `<p>Vui lòng liên hệ với Quản trị viên để nhận mật khẩu hoặc sử dụng chức năng Quên Mật Khẩu trên hệ thống.</p>`;

        const body = `
            <p>Xin chào,</p>
            <p>Một tài khoản mới đã được tạo cho bạn bằng địa chỉ email <strong>${email}</strong> trên hệ thống <strong>E-Health</strong>.</p>
            
            ${passwordHtml}
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || '#'}/login" class="btn">Đăng Nhập Ngay</a>
            </div>
            
            <p>Trân trọng,<br>Ban Quản Trị Hệ Thống E-Health.</p>
        `;

        await MailService.send({
            to: email,
            subject,
            html: this.getTemplate('Chào Mừng Thành Viên Mới', body)
        });
    }
}