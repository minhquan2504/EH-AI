import { AccountRepository } from "../../repository/Core/auth_account.repository";
import { AuthValidation } from "../../utils/auth-validation.util";
import { ClientInfo } from "../../models/Core/auth_user-session.model";
import { User, AccountStatus } from "../../models/Core/auth_account.model";
import { AuthSessionUtil } from "../../utils/auth-session.util";
import { SecurityUtil } from "../../utils/auth-security.util";
import { UserSessionRepository } from "../../repository/Core/auth_user-session.repository";
import { AUTH_ERRORS } from "../../constants/auth-error.constant";
import { PasswordResetRepository } from "../../repository/Core/auth_password-reset.repository";
import { AuthMailUtil } from "../../utils/auth-mail.util";
import { AccountVerificationRepository } from "../../repository/Core/auth_verification.repository";
import { AUTH_CONSTANTS } from "../../constants/auth.constant";
import { PermissionRepository } from "../../repository/Core/permission.repository";

export class AuthService {
  /**
   * Đăng nhập bằng Email
   */
  static async loginByEmail(email: string, password: string, clientInfo: ClientInfo) {
    AuthValidation.validateLoginInput(email, password, "EMAIL");

    const user = await AccountRepository.findByEmail(email);

    if (!user) throw AUTH_ERRORS.INVALID_CREDENTIAL;

    await this.handleLoginAttempt(user, password);

    return this.processLoginSuccess(user, clientInfo);
  }

  /**
   * Đăng nhập bằng SĐT
   */
  static async loginByPhone(phone: string, password: string, clientInfo: ClientInfo) {
    AuthValidation.validateLoginInput(phone, password, "PHONE");

    const user = await AccountRepository.findByPhone(phone);

    if (!user) {
      throw AUTH_ERRORS.INVALID_CREDENTIAL;
    }

    await this.handleLoginAttempt(user, password);

    return this.processLoginSuccess(user, clientInfo);
  }

  /**
   * Xử lý kiểm tra khóa và xác thực mật khẩu
   */
  private static async handleLoginAttempt(user: User, passwordInput: string) {

    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      throw AUTH_ERRORS.ACCOUNT_LOCKED;
    }

    const isPasswordValid = await SecurityUtil.verifyPasswordSafe(passwordInput, user.password_hash);

    if (!isPasswordValid) {
      const newFailedCount = await AccountRepository.incrementFailedLogin(user.users_id);

      if (newFailedCount >= AUTH_CONSTANTS.LOGIN_LIMIT.MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + AUTH_CONSTANTS.LOGIN_LIMIT.LOCK_DURATION_MS);
        await AccountRepository.lockAccount(user.users_id, lockUntil);
      }

      throw AUTH_ERRORS.INVALID_CREDENTIAL;
    }

    if (user.failed_login_count > 0 || user.locked_until) {
      await AccountRepository.resetFailedLogin(user.users_id);
    }

    if (user.status !== 'ACTIVE') {
      throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
    }
  }

  /**
   * Xử lý khi đăng nhập thành công
   */
  private static async processLoginSuccess(user: User, clientInfo: ClientInfo) {
    let sessionId: string;

    // Nếu client gửi device info thì check xem có session cũ của device không
    if (clientInfo.deviceId) {
      const existingSession = await UserSessionRepository.findByAccountAndDevice(
        user.users_id,
        clientInfo.deviceId,
      );
      // Nếu có session cũ thì dùng lại, không có thì tạo mới
      sessionId = existingSession
        ? existingSession.user_sessions_id
        : AuthSessionUtil.generate(user.users_id);
    } else {
      sessionId = AuthSessionUtil.generate(user.users_id);
    }

    const { accessToken, refreshToken, refreshTokenHash, expiresIn } =
      SecurityUtil.generateToken(user, sessionId);

    await AuthSessionUtil.upsertSession(
      sessionId,
      user.users_id,
      refreshTokenHash,
      clientInfo,
    );

    await AccountRepository.updateLastLogin(user.users_id);

    const profile = await AccountRepository.findProfileById(user.users_id);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        userId: user.users_id,
        name: profile?.full_name || "",
        avatar: profile?.avatar_url || null,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
      },
    };
  }

  /**
   * Mở khóa tài khoản thủ công
   */
  static async unlockAccount(input: { accountId: string }): Promise<void> {
    await AccountRepository.unlockAccount(input.accountId);
  }

  /**
   * Đăng xuất
   */
  static async logout(input: { refreshToken: string }): Promise<void> {
    try {
      SecurityUtil.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    }

    const refreshTokenHash = SecurityUtil.hashRefreshToken(input.refreshToken);

    const session = await UserSessionRepository.findActiveSessionByRefreshToken(
      refreshTokenHash
    );

    if (!session) {
      throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    await UserSessionRepository.logoutCurrentSession(
      session.user_id,
      refreshTokenHash
    );
  }

  /**
   * Quên mật khẩu – gửi OTP
   */
  static async forgotPassword(input: { email: string }): Promise<void> {
    try {
      AuthValidation.validateEmailOnly(input.email);

      const user = await AccountRepository.findByEmail(input.email);

      if (!user || user.status !== "ACTIVE") return;

      if (!user.email) return;

      const resetId = SecurityUtil.generateResetPasswordId(user.users_id);

      const resetToken = SecurityUtil.generateOTP(6);
      const resetTokenHash = SecurityUtil.hashTokenResetPassword(resetToken);

      const expiredAt = new Date(
        Date.now() + AUTH_CONSTANTS.RESET_PASSWORD.EXPIRES_IN_MS,
      );

      await PasswordResetRepository.createResetToken(
        resetId,
        user.users_id,
        resetTokenHash,
        expiredAt,
      );

      await AuthMailUtil.sendResetPasswordOtpEmail(user.email, resetToken);
    } catch (error) {
      console.error("Lỗi quên mật khẩu:", error);
    }
  }

  /**
   * Đặt lại mật khẩu
   */
  static async resetPassword(input: {
    otp: string;
    newPassword: string;
  }): Promise<void> {
    const { otp, newPassword } = input;

    AuthValidation.validatePasswordOnly(newPassword);

    const resetTokenHash = SecurityUtil.hashTokenResetPassword(otp);

    const resetRecord =
      await PasswordResetRepository.findValidToken(resetTokenHash);

    if (!resetRecord) throw AUTH_ERRORS.INVALID_RESET_TOKEN;

    const hashedPassword = await SecurityUtil.hashPassword(newPassword);

    await AccountRepository.updatePassword(
      resetRecord.userId,
      hashedPassword,
    );

    await PasswordResetRepository.markAsUsed(resetRecord.password_resets_id);

    await UserSessionRepository.revokeAllByAccount(resetRecord.userId);
  }

  /**
   * Đăng ký bằng Email
   */
  static async registerByEmail(input: {
    email: string;
    password: string;
    name: string;
  }) {
    AuthValidation.validateEmailRegister(
      input.email,
      input.password,
      input.name,
    );

    const existAccount = await AccountRepository.findByEmail(input.email);
    if (existAccount) throw AUTH_ERRORS.EMAIL_EXISTED;

    const result = await this.processRegister({
      name: input.name,
      password: input.password,
      email: input.email,
      phone: null,
      status: AUTH_CONSTANTS.ACCOUNT_STATUS.PENDING,
    });

    try {
      const { userCode } = result;

      await AccountVerificationRepository.invalidateOldTokens(userCode);

      const otpCode = SecurityUtil.generateOTP(6);
      const otpHash = SecurityUtil.hashTokenResetPassword(otpCode);

      const verifyId = SecurityUtil.generateVerificationId(userCode);

      const expiredAt = new Date(
        Date.now() + AUTH_CONSTANTS.VERIFY_EMAIL.EXPIRES_IN_MS,
      );

      await AccountVerificationRepository.createVerificationToken(
        verifyId,
        userCode,
        otpHash,
        expiredAt,
      );

      await AuthMailUtil.sendOtpEmail(input.email, otpCode);
    } catch (error) {
      console.error("⚠️ Lỗi gửi OTP:", error);
    }

    return result;
  }

  /**
   * Đăng ký bằng SĐT
   */
  static async registerByPhone(input: {
    phone: string;
    password: string;
    name: string;
  }) {
    AuthValidation.validatePhoneRegister(
      input.phone,
      input.password,
      input.name,
    );

    const existAccount = await AccountRepository.findByPhone(input.phone);
    if (existAccount) throw AUTH_ERRORS.PHONE_EXISTED;

    const result = await this.processRegister({
      name: input.name,
      password: input.password,
      email: null,
      phone: input.phone,
      status: AUTH_CONSTANTS.ACCOUNT_STATUS.ACTIVE,
    });

    return result;
  }

  /*
   * Xử lý đăng ký chung 
   */
  private static async processRegister(payload: {
    name: string;
    password: string;
    email: string | null;
    phone: string | null;
    status: AccountStatus;
  }) {
    const hashedPassword = await SecurityUtil.hashPassword(payload.password);

    const userCode = await SecurityUtil.generateUsersId("CUSTOMER");

    const newUser: User = {
      users_id: userCode,
      email: payload.email,
      phone: payload.phone,
      password_hash: hashedPassword,
      roles: ["CUSTOMER"],
      status: payload.status,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      failed_login_count: 0,
      locked_until: null
    };

    const userProfileId = SecurityUtil.generateUserProfileId(userCode);

    await AccountRepository.createAccountWithProfileAndRole(newUser, userProfileId, payload.name, "CUSTOMER");

    return {
      userCode: newUser.users_id,
      email: newUser.email,
      phone: newUser.phone,
      status: newUser.status,
    };
  }

  /**
   * Xác thực Email từ Token
   */
  static async verifyEmail(token: string): Promise<void> {
    const tokenHash = SecurityUtil.hashTokenResetPassword(token);

    const verificationRecord =
      await AccountVerificationRepository.findValidToken(tokenHash);

    if (!verificationRecord)
      throw new Error("Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.");

    await AccountRepository.activateAccount(verificationRecord.userId);

    await AccountVerificationRepository.markAsUsed(verificationRecord.account_verifications_id);
  }

  /**
   * Xác thực Email bằng OTP
   */
  static async verifyEmailOTP(input: {
    email: string;
    otp: string;
  }): Promise<void> {
    const { email, otp } = input;

    const user = await AccountRepository.findByEmail(email);
    if (!user) {
      throw new Error("Email không tồn tại.");
    }

    const otpHash = SecurityUtil.hashTokenResetPassword(otp);

    const verificationRecord = await AccountVerificationRepository.findValidOTP(
      user.users_id,
      otpHash,
    );

    if (!verificationRecord)
      throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn.");

    await AccountRepository.activateAccount(verificationRecord.userId);

    await AccountVerificationRepository.markAsUsed(verificationRecord.account_verifications_id);
  }


  /**
   * Làm mới Access Token & Refresh Token
   */
  static async refreshToken(input: { refreshToken: string }) {
    try {
      SecurityUtil.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    }

    const refreshTokenHash = SecurityUtil.hashRefreshToken(input.refreshToken);

    const session = await UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);

    if (!session) {
      throw AUTH_ERRORS.SESSION_EXPIRED;
    }

    const now = new Date().getTime();
    const lastUsed = new Date(session.last_used_at).getTime();
    const idleTime = now - lastUsed;

    if (idleTime > AUTH_CONSTANTS.SESSION.IDLE_TIMEOUT_MS) {
      await UserSessionRepository.revokeBySessionId(session.user_sessions_id, session.user_id);
      throw AUTH_ERRORS.SESSION_EXPIRED;
    }

    const user = await AccountRepository.findById(session.user_id);

    if (!user || user.status !== 'ACTIVE') {
      throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
    }

    const { accessToken, refreshToken: newRefreshToken, expiresIn } =
      SecurityUtil.generateToken(user, session.user_sessions_id);

    await UserSessionRepository.updateSessionBySessionId(session.user_sessions_id, {
      refreshTokenHash: SecurityUtil.hashRefreshToken(newRefreshToken),
      expiredAt: SecurityUtil.getRefreshTokenExpiredAt(),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn
    };
  }
}
