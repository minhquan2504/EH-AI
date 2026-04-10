import { pool } from '../../config/postgresdb';
import { UserSession } from '../../models/Core/auth_user-session.model';
import { CreateSessionInput } from '../../models/Core/auth_user-session.model';
import { AuthSessionUtil } from '../../utils/auth-session.util';

export class UserSessionRepository {
  /**
   * Tạo mới một user session
   */
  static async createSession(input: CreateSessionInput): Promise<void> {
    const {
      user_sessions_id = AuthSessionUtil.generate(input.userId),
      userId,
      refreshTokenHash,
      deviceId,
      deviceName,
      ipAddress,
      userAgent,
      expiredAt,
    } = input;

    await pool.query(
      `
      INSERT INTO user_sessions (
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        expired_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      `,
      [
        user_sessions_id,
        userId,
        refreshTokenHash,
        deviceId ?? null,
        deviceName ?? null,
        ipAddress ?? null,
        userAgent ?? null,
        expiredAt,
      ]
    );
  }

  /**
   * Tìm session theo userId và deviceId, bất kể trạng thái revoked/expired.
   */
  static async findByAccountAndDevice(userId: string, deviceId: string | null): Promise<UserSession | null> {
    const result = await pool.query(
      `
      SELECT
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM user_sessions
      WHERE user_id = $1
        AND (device_id = $2 OR (device_id IS NULL AND $2 IS NULL))
      ORDER BY
        CASE WHEN revoked_at IS NULL AND expired_at > NOW() THEN 0 ELSE 1 END,
        last_used_at DESC
      LIMIT 1
      `,
      [userId, deviceId]
    );

    if (result.rowCount === 0) return null;
    return result.rows[0] as UserSession;
  }

  /**
   * Cập nhật (hoặc re-activate) session theo ID.
   */
  static async updateSessionBySessionId(sessionId: string, input: { refreshTokenHash: string; ipAddress?: string; userAgent?: string; deviceName?: string; deviceId?: string; expiredAt: Date; }): Promise<void> {
    await pool.query(
      `
      UPDATE user_sessions
      SET
        refresh_token_hash = $1,
        ip_address = $2,
        user_agent = $3,
        device_name = COALESCE($4, device_name),
        device_id = COALESCE($5, device_id),
        expired_at = $6,
        last_used_at = NOW(),
        revoked_at = NULL
      WHERE user_sessions_id = $7
      `,
      [
        input.refreshTokenHash,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.deviceName ?? null,
        input.deviceId ?? null,
        input.expiredAt,
        sessionId,
      ]
    );
  }

  /**
   * Đăng xuất session hiện tại 
   */
  static async logoutCurrentSession(userId: string, refreshTokenHash: string): Promise<boolean> {
    const result = await pool.query(
      `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND refresh_token_hash = $2
        AND revoked_at IS NULL
        AND expired_at > NOW()
      `,
      [userId, refreshTokenHash]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Đăng xuất toàn bộ session của một tài khoản
   */
  static async revokeAllByAccount(userId: string): Promise<number> {
    const result = await pool.query(
      `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
      `,
      [userId]
    );

    return result.rowCount ?? 0;
  }


  /**
   * Tìm session còn hiệu lực theo refresh token
   */
  static async findActiveSessionByRefreshToken(
    refreshTokenHash: string
  ): Promise<UserSession | null> {
    const result = await pool.query(
      `
      SELECT
        user_sessions_id,
        user_id,
        refresh_token_hash,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_used_at,
        expired_at,
        revoked_at,
        created_at
      FROM user_sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expired_at > NOW()
      LIMIT 1
      `,
      [refreshTokenHash]
    );

    if (result.rowCount === 0) return null;
    return result.rows[0] as UserSession;
  }

  /**
  * Cập nhật thời gian sử dụng cuối cùng của session
  */
  static async updateLastUsed(sessionId: string): Promise<void> {
    await pool.query(
      `
      UPDATE user_sessions
      SET last_used_at = NOW()
      WHERE user_sessions_id = $1
      `,
      [sessionId]
    );
  }

  /*
   * Lấy danh sách session còn hiệu lực của một tài khoản
   */
  static async findActiveByAccount(userId: string): Promise<UserSession[]> {
    const result = await pool.query(
      `SELECT user_sessions_id, device_name, ip_address, last_used_at, created_at, expired_at
         FROM user_sessions
         WHERE user_id = $1 AND revoked_at IS NULL AND expired_at > NOW()
         ORDER BY last_used_at DESC`,
      [userId]
    );
    return result.rows as UserSession[];
  }

  /*
   * Thu hồi (revoke) một session theo sessionId
   */
  static async revokeBySessionId(sessionId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE user_sessions
         SET revoked_at = NOW()
         WHERE user_sessions_id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [sessionId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /*
   * Thu hồi (revoke) một session theo sessionId
   */
  static async findActiveBySessionId(sessionId: string): Promise<UserSession | null> {
    const result = await pool.query(
      `SELECT user_sessions_id, user_id, refresh_token_hash, device_id, device_name, ip_address, user_agent, last_used_at, expired_at, revoked_at, created_at 
         FROM user_sessions 
         WHERE user_sessions_id = $1 AND revoked_at IS NULL AND expired_at > NOW() 
         LIMIT 1`,
      [sessionId]
    );
    if (result.rowCount === 0) return null;
    return result.rows[0] as UserSession;
  }

  /**
   * Dọn dẹp các session hết hạn
   */
  static async revokeExpiredSessions(idleTimeoutDays: number): Promise<number> {
    const result = await pool.query(
      `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE revoked_at IS NULL
        AND (
            expired_at < NOW() 
            OR 
            last_used_at < (NOW() - make_interval(days => $1))
        )
      `,
      [idleTimeoutDays]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Xóa các session đã revoked cũ của user, chỉ giữ lại N session gần nhất.
   * Giúp tránh bảng user_sessions phình to khi user login/logout liên tục không có deviceId.
   */
  static async deleteOldRevokedSessions(userId: string, keepCount: number = 5): Promise<void> {
    await pool.query(
      `
      DELETE FROM user_sessions
      WHERE user_id = $1
        AND revoked_at IS NOT NULL
        AND user_sessions_id NOT IN (
          SELECT user_sessions_id FROM user_sessions
          WHERE user_id = $1 AND revoked_at IS NOT NULL
          ORDER BY revoked_at DESC
          LIMIT $2
        )
      `,
      [userId, keepCount]
    );
  }
}