import { Request, Response } from "express";
import { AuthService } from "../../services/Core/auth.service";
import { AUTH_ERRORS } from "../../constants/auth-error.constant";

export class AuthController {
    /**
     * Đăng nhập bằng Email + mật khẩu
     */
    static async loginByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password, clientInfo } = req.body;

            const data = await AuthService.loginByEmail(
                email,
                password,
                {
                    deviceId: clientInfo?.deviceId,
                    deviceName: clientInfo?.deviceName,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
                }
            );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "INTERNAL_ERROR",
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * Đăng nhập bằng SĐT + mật khẩu
     */
    static async loginByPhone(req: Request, res: Response): Promise<Response> {
        try {
            const { phone, password, clientInfo } = req.body;

            const data = await AuthService.loginByPhone(
                phone,
                password,
                {
                    deviceId: clientInfo?.deviceId,
                    deviceName: clientInfo?.deviceName,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] ?? clientInfo?.userAgent ?? "",
                }
            );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "INTERNAL_ERROR",
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
    * Đăng xuất session hiện tại
    */
    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }

            await AuthService.logout({ refreshToken });

            return res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công',
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }

    /**
     * Yêu cầu quên mật khẩu
     */
    static async forgotPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;

            // Luôn trả về 200 dù email có tồn tại hay không (theo Docs)
            await AuthService.forgotPassword({ email });

            return res.status(200).json({
                success: true,
                message: "Nếu tài khoản tồn tại, một liên kết đặt lại mật khẩu đã được gửi",
            });
        } catch (error: any) {
            // Log lỗi hệ thống nếu có, nhưng vẫn trả về thông báo chung hoặc lỗi server
            return res.status(500).json({
                success: false,
                code: 'AUTH_999',
                message: 'Lỗi máy chủ nội bộ',
            });
        }
    }



    /**
     * Đặt lại mật khẩu
     */
    static async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { otp, newPassword } = req.body;

            if (!otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp mã OTP và mật khẩu mới",
                });
            }

            await AuthService.resetPassword({ otp, newPassword });

            return res.status(200).json({
                success: true,
                message: "Mật khẩu đã được đặt lại thành công",
            });
        } catch (error: any) {
            // Mapping lỗi từ Service ra HTTP code tương ứng
            const httpCode = error.httpCode || 500;
            return res.status(httpCode).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }



    /**
     * Đăng ký bằng Email
     */
    static async registerByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password, name } = req.body;

            const data = await AuthService.registerByEmail({ email, password, name });

            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "AUTH_999",
                message: error.message || "Lỗi máy chủ nội bộ",
            });
        }
    }

    /**
     * Đăng ký bằng SĐT
     */
    static async registerByPhone(req: Request, res: Response): Promise<Response> {
        try {
            const { phone, password, name } = req.body;

            const data = await AuthService.registerByPhone({ phone, password, name });

            return res.status(201).json({
                success: true,
                message: "Register successfully",
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || "AUTH_999",
                message: error.message || "Lỗi máy chủ nội bộ",
            });
        }
    }

    /**
     * Xác thực OTP Email
     */
    static async verifyEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Email và mã OTP",
                });
            }

            // Gọi AuthService dùng property otp: code
            await AuthService.verifyEmailOTP({ email, otp: code });

            return res.status(200).json({
                success: true,
                message: "Xác thực tài khoản thành công!",
            });

        } catch (error: any) {
            return res.status(400).json({
                success: false,
                code: error.code || "AUTH_VERIFY_FAILED",
                message: error.message || "Xác thực thất bại",
            });
        }
    }


    /**
     * Mở khóa tài khoản (Thường dành cho Admin)
     */
    static async unlockAccount(req: Request, res: Response): Promise<Response> {
        try {
            const { accountId } = req.body; // Lấy ID tài khoản cần mở khóa

            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp accountId",
                });
            }

            await AuthService.unlockAccount({ accountId });

            return res.status(200).json({
                success: true,
                message: "Đã mở khóa tài khoản thành công",
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                code: "AUTH_UNLOCK_FAILED",
                message: error.message || "Lỗi mở khóa tài khoản",
            });
        }
    }

    /*
     * Làm mới Token (Refresh Token)
     */
    static async refreshToken(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng cung cấp Refresh Token",
                });
            }

            const data = await AuthService.refreshToken({ refreshToken });

            return res.status(200).json({
                success: true,
                message: "Làm mới token thành công",
                data,
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'AUTH_999',
                message: error.message || 'Lỗi máy chủ nội bộ',
            });
        }
    }

}