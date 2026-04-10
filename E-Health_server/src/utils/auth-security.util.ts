import bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { TOKEN_CONFIG } from '../constants/auth_token.constant';
import { TokenUtil } from './token.util';
import { User, AccountRole } from '../models/Core/auth_account.model';

export class SecurityUtil {
    /*
      * Tạo access token và refresh token
      */
    static generateToken(user: User, sessionId: string) {
        const { accessToken, refreshToken, expiresIn } = TokenUtil.generateAuthTokens(user, sessionId);

        const refreshTokenHash = SecurityUtil.hashRefreshToken(refreshToken);

        return {
            accessToken,
            refreshToken,
            refreshTokenHash,
            expiresIn,
        };
    }

    /**
     * Xác thực refresh token
     */
    static verifyRefreshToken(token: string) {
        return TokenUtil.verifyRefreshToken(token);
    }

    /**
     * Hash refresh token
     */
    static hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /**
     * Hash password (bcrypt)
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    /**
     * Verify password an toàn
     */
    static async verifyPasswordSafe(inputPassword: string, storedHash: string | null | undefined,): Promise<boolean> {

        const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO5Q7GkE1E7dBDEuDfSU/EYEYVplpXCMu';

        return bcrypt.compare(inputPassword, storedHash ?? DUMMY_HASH);
    }

    /**
     * Lấy thời điểm hết hạn của refresh token
     */
    static getRefreshTokenExpiredAt(): Date {
        return new Date(
            Date.now() +
            TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN_SECONDS * 1000
        );
    }

    /**
     * Sinh token ngẫu nhiên dùng cho reset password
     */
    static generateRandomTokenResetPassword(length = 32): string {
        return randomBytes(length).toString('hex');
    }

    /**
     * Hash token dùng cho reset password
     */
    static hashTokenResetPassword(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    /**
     * Tạo ID cho request reset password
     */
    static generateResetPasswordId(userId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        // Tổng chiều dài sẽ là: 5(PRST_) + 6(Date) + 1(_) + len(userId) + 1(_) + 16(UUID)
        // Tổng chiều dài sẽ là: 5(PRST_) + 6(Date) + 1(_) + len(userId ~ 22) + 1(_) + 8(UUID) ~ 43 chars <= 50
        return `PRST_${datePart}_${userId}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh ID cho bảng users tự động dựa trên Role
     */
    static async generateUsersId(role: AccountRole): Promise<string> {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const rolePrefix = "USR";

        return `${rolePrefix}_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh ID cho bảng roles tự động
     */
    static generateRoleId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const rolePrefix = "ROL";

        return `${rolePrefix}_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh ID cho bảng permissions tự động
     */
    static generatePermissionId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const permissionPrefix = "PER";

        return `${permissionPrefix}_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh ID cho bảng menus tự động
     */
    static generateMenuId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const menuPrefix = "MNU";

        return `${menuPrefix}_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh mã định danh cho API Permission
     */
    static generateApiPermissionId(): string {
        const timestamp = Date.now();
        const shortUuid = crypto.randomUUID().substring(0, 8);
        return `API_${timestamp}_${shortUuid}`;
    }

    /**
     * Tạo ID cho record Verification
     */
    static generateVerificationId(userId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `VER_${datePart}_${userId}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Sinh mã OTP ngẫu nhiên (chỉ chứa số)
     */
    static generateOTP(length: number = 6): string {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += randomInt(0, 10).toString();
        }
        return otp;
    }

    /**
     * Tạo ID cho record User Profile
     */
    static generateUserProfileId(userId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `UPRF_${datePart}_${userId}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Tạo ID cho record gán Cơ sở/Chi nhánh (User Branch Dept)
     */
    static generateUserFacilityId(userId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `UBD_${datePart}_${userId}_${randomUUID().substring(0, 8)}`;
    }
}