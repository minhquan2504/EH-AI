import { pool } from '../../config/postgresdb';
import { User } from '../../models/Core/auth_account.model';

export class AccountRepository {
  /**
   * Tìm kiếm tài khoản theo email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT 
        u.users_id, 
        u.email, 
        u.phone_number AS phone, 
        u.password_hash, 
        u.status, 
        u.last_login_at, 
        u.failed_login_count, 
        u.locked_until, 
        u.created_at, 
        u.updated_at,
        COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.users_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.roles_id
      WHERE u.email = $1 AND u.deleted_at IS NULL
      GROUP BY u.users_id
      LIMIT 1;
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] ?? null;
  }

  /**
   * Tìm kiếm tài khoản theo số điện thoại
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const query = `
      SELECT 
        u.users_id, 
        u.email, 
        u.phone_number AS phone, 
        u.password_hash, 
        u.status, 
        u.last_login_at, 
        u.failed_login_count, 
        u.locked_until, 
        u.created_at, 
        u.updated_at,
        COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.users_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.roles_id
      WHERE u.phone_number = $1 AND u.deleted_at IS NULL
      GROUP BY u.users_id
      LIMIT 1;
    `;
    const result = await pool.query(query, [phone]);
    return result.rows[0] ?? null;
  }

  /**
   * Tìm kiếm tài khoản theo users_id
   */
  static async findById(userId: string): Promise<User | null> {
    const query = `
      SELECT 
        u.users_id, 
        u.email, 
        u.phone_number AS phone, 
        u.password_hash, 
        u.status, 
        u.last_login_at, 
        u.failed_login_count, 
        u.locked_until, 
        u.created_at, 
        u.updated_at,
        COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.users_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.roles_id
      WHERE u.users_id = $1 AND u.deleted_at IS NULL
      GROUP BY u.users_id
      LIMIT 1;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] ?? null;
  }

  /**
   * Lấy thêm thông tin user profile sau khi đăng nhập (Tùy chọn hiển thị tên)
   */
  static async findProfileById(userId: string): Promise<any> {
    const query = `
      SELECT full_name, avatar_url 
      FROM user_profiles 
      WHERE user_id = $1 
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] ?? null;
  }

  /**
   * Cập nhật thời gian đăng nhập cuối cùng cho tài khoản
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await pool.query(
      `
      UPDATE users
      SET
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $1
      `,
      [userId]
    );
  }

  /**
   * Cập nhật mật khẩu mới cho user
   */
  static async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<void> {
    const query = `
      UPDATE users
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $2
    `;

    await pool.query(query, [hashedPassword, userId]);
  }

  /**
   * Tạo tài khoản mới
   */
  static async createAccountWithProfileAndRole(
    user: User,
    profileId: string,
    fullName: string,
    roleCode: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert bảng users
      await client.query(`
            INSERT INTO users (users_id, email, phone_number, password_hash, status)
            VALUES ($1, $2, $3, $4, $5)
        `, [user.users_id, user.email, user.phone, user.password_hash, user.status]);

      //Insert bảng user_profiles
      await client.query(`
            INSERT INTO user_profiles (user_profiles_id, user_id, full_name)
            VALUES ($1, $2, $3)
        `, [profileId, user.users_id, fullName]);

      // Tìm roles_id
      const roleResult = await client.query(`SELECT roles_id FROM roles WHERE code = $1 LIMIT 1`,
        [roleCode]);

      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].roles_id;
        // Insert bảng user_roles
        await client.query(`
                INSERT INTO user_roles (user_id, role_id)
                VALUES ($1, $2)
            `, [user.users_id, roleId]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Kích hoạt tài khoản
   */
  static async activateAccount(userId: string): Promise<void> {
    const query = `
            UPDATE users
            SET status = 'ACTIVE',
                updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1
        `;
    await pool.query(query, [userId]);
  }

  /**
   * Tăng số lần đăng nhập sai
   */
  static async incrementFailedLogin(userId: string): Promise<number> {
    const result = await pool.query(
      `
      UPDATE users
      SET failed_login_count = failed_login_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $1
      RETURNING failed_login_count
      `,
      [userId]
    );
    return result.rows[0]?.failed_login_count || 0;
  }

  /**
   * Khóa tài khoản
   */
  static async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    await pool.query(
      `
      UPDATE users
      SET locked_until = $1,
          failed_login_count = 0,  
          updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $2
      `,
      [lockedUntil, userId]
    );
  }

  /**
   * Reset số lần sai và mở khóa
   */
  static async resetFailedLogin(userId: string): Promise<void> {
    await pool.query(
      `
      UPDATE users
      SET failed_login_count = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $1
      `,
      [userId]
    );
  }

  /**
   * Chủ động mở khóa tài khoản
   */
  static async unlockAccount(userId: string): Promise<void> {
    await pool.query(
      `
      UPDATE users
      SET locked_until = NULL,
          failed_login_count = 0,
          status = 'ACTIVE', 
          updated_at = CURRENT_TIMESTAMP
      WHERE users_id = $1
      `,
      [userId]
    );
  }
}