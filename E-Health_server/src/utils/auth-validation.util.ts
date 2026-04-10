import { AUTH_ERRORS } from '../constants/auth-error.constant';
import { SecurityUtil } from './auth-security.util';
import { ClientInfo } from '../models/Core/auth_user-session.model';
import { User } from '../models/Core/auth_account.model';

export type LoginIdentifierType = 'EMAIL' | 'PHONE';

export class AuthValidation {
    /*
     * Xác thực thiết bị
     */
    static validateDevice(clientInfo: ClientInfo) {
        if (!clientInfo.deviceId) {
            throw AUTH_ERRORS.INVALID_DEVICE;
        }
    }

    /*
     * Xác thực thông tin đăng nhập
     */
    static async validateCredential(
        user: User | null,
        password: string
    ) {
        if (!user) {
            throw AUTH_ERRORS.INVALID_CREDENTIAL;
        }

        const isPasswordValid =
            await SecurityUtil.verifyPasswordSafe(password, user.password_hash);

        if (!isPasswordValid) {
            throw AUTH_ERRORS.INVALID_CREDENTIAL;
        }

        if (user.status !== 'ACTIVE') {
            throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
        }
    }


    /*
     * Xác thực đầu vào đăng nhập
     */
    static validateLoginInput(identifier: string, password: string, type: LoginIdentifierType): void {
        if (!identifier || !password) {
            throw AUTH_ERRORS.INVALID_INPUT;
        }

        if (password.length < 6) {
            throw AUTH_ERRORS.INVALID_PASSWORD_FORMAT;
        }

        if (type === 'EMAIL' && !this.isValidEmail(identifier)) {
            throw AUTH_ERRORS.INVALID_EMAIL_FORMAT;
        }

        if (type === 'PHONE' && !this.isValidPhone(identifier)) {
            throw AUTH_ERRORS.INVALID_PHONE_FORMAT;
        }
    }



    /**
     * Chỉ validate Email (Dùng cho Forgot Password)
     */
    static validateEmailOnly(email: string): void {
        if (!email) throw AUTH_ERRORS.INVALID_INPUT;
        if (!this.isValidEmail(email)) throw AUTH_ERRORS.INVALID_EMAIL_FORMAT;
    }

    /**
     * Chỉ validate Password (Dùng cho Reset Password)
     */
    static validatePasswordOnly(password: string): void {
        if (!password) throw AUTH_ERRORS.INVALID_INPUT;
        if (password.length < 6) throw AUTH_ERRORS.INVALID_PASSWORD_FORMAT;
    }

    /*
     * Kiểm tra định dạng email
     */
    private static isValidEmail(email: string): boolean {
        if (!email) return false;

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex =
            /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

        return emailRegex.test(normalizedEmail);
    }

    /*
     * Kiểm tra định dạng số điện thoại
     */
    private static isValidPhone(phone: string): boolean {
        if (!phone) return false;

        const normalizedPhone = phone
            .replace(/\s+/g, '')
            .replace(/[-()]/g, '');

        const vnPhoneRegex = /^(0\d{9}|(\+84)\d{9})$/;

        const internationalPhoneRegex = /^\+\d{10,15}$/;

        return (
            vnPhoneRegex.test(normalizedPhone) ||
            internationalPhoneRegex.test(normalizedPhone)
        );
    }

    /**
     * Validate đăng ký bằng Email
     */
    static validateEmailRegister(email?: string, password?: string, name?: string) {
        if (!email || !password || !name) throw AUTH_ERRORS.INVALID_DATA;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) throw AUTH_ERRORS.INVALID_DATA;

        if (password.length < 6) throw AUTH_ERRORS.INVALID_DATA;
    }

    /**
     * Validate đăng ký bằng SĐT
     */

    static validatePhoneRegister(phone?: string, password?: string, name?: string) {
        if (!phone || !password || !name) throw AUTH_ERRORS.INVALID_DATA;

        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

        if (!phoneRegex.test(phone)) throw AUTH_ERRORS.INVALID_DATA;

        if (password.length < 6) throw AUTH_ERRORS.INVALID_DATA;
    }



}