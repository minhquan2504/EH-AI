import { pool } from '../../config/postgresdb';
import { UserDetail, UserQueryFilter, PaginatedUsers, CreateUserInput, UpdateUserByAdminInput, AccountStatusHistory } from '../../models/Core/user.model';
import { AccountRole } from '../../models/Core/auth_account.model';
import { SecurityUtil } from '../../utils/auth-security.util';
import { AppError } from '../../utils/app-error.util';
import { randomUUID } from 'crypto';

export class UserRepository {

    /**
     * Tạo tài khoản người dùng mới (dành cho Admin)
     */
    static async createUser(
        data: CreateUserInput & { hashedPassword?: string },
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<string> {
        // Validate Role
        let validatedRoles: { roles_id: string, code: string }[] = [];
        if (data.roles && data.roles.length > 0) {
            const placeholders = data.roles.map((_, i) => `$${i + 1}`).join(',');
            const roleResult = await pool.query(`SELECT roles_id, code FROM roles WHERE code IN (${placeholders})`, data.roles);

            if (roleResult.rows.length !== data.roles.length) {
                throw new AppError(400, 'USER_INVALID_ROLE', 'Một hoặc nhiều vai trò (Role) truyền vào không tồn tại trong hệ thống.');
            }
            validatedRoles = roleResult.rows;
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Generate IDs based on actual Main Role
            const primaryRole = (data.roles && data.roles.length > 0) ? (data.roles[0] as AccountRole) : 'CUSTOMER';
            const userId = await SecurityUtil.generateUsersId(primaryRole);
            const profileId = SecurityUtil.generateUserProfileId(userId);

            // Insert into users
            const passwordHash = data.hashedPassword || '';
            const status = 'ACTIVE';

            await client.query(`
                INSERT INTO users (users_id, email, phone_number, password_hash, status)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, data.email || null, data.phone || null, passwordHash, status]);

            // Insert into user_profiles
            await client.query(`
                INSERT INTO user_profiles (user_profiles_id, user_id, full_name, dob, gender, identity_card_number, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                profileId,
                userId,
                data.full_name,
                data.dob || null,
                data.gender || null,
                data.identity_card_number || null,
                data.address || null
            ]);

            // Assign Roles
            if (validatedRoles.length > 0) {
                const values: any[] = [];
                const insertPlaceholders: string[] = [];

                validatedRoles.forEach((row, index) => {
                    insertPlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(userId, row.roles_id);
                });

                await client.query(`
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES ${insertPlaceholders.join(',')}
                `, values);
            }

            await client.query('COMMIT');
            return userId;
        } catch (error: any) {
            await client.query('ROLLBACK');

            if (error.code === '23505') {
                const detail = error.detail || '';
                if (detail.includes('email')) {
                    throw new AppError(400, 'USER_EMAIL_EXISTED', 'Email đã tồn tại trong hệ thống.');
                }
                if (detail.includes('phone')) {
                    throw new AppError(400, 'USER_PHONE_EXISTED', 'Số điện thoại đã tồn tại trong hệ thống.');
                }
            }

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách người dùng với các bộ lọc phân trang
     */
    static async getUsers(filter: UserQueryFilter): Promise<PaginatedUsers> {
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const offset = (page - 1) * limit;

        let queryParams: any[] = [];
        let whereClauses: string[] = ['u.deleted_at IS NULL'];

        if (filter.search) {
            queryParams.push(`%${filter.search}%`);
            whereClauses.push(`(u.email ILIKE $${queryParams.length} OR u.phone_number ILIKE $${queryParams.length} OR up.full_name ILIKE $${queryParams.length})`);
        }

        if (filter.status) {
            queryParams.push(filter.status);
            whereClauses.push(`u.status = $${queryParams.length}`);
        }

        if (filter.role) {
            queryParams.push(filter.role);
            whereClauses.push(`$${queryParams.length} = ANY(ARRAY(SELECT r2.code FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.roles_id WHERE ur2.user_id = u.users_id))`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(u.users_id) as total
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            ${whereString}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        // Get data
        queryParams.push(limit);
        const limitParamIdx = queryParams.length;
        queryParams.push(offset);
        const offsetParamIdx = queryParams.length;

        const dataQuery = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.last_login_at, 
                u.failed_login_count, 
                u.locked_until, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            ${whereString}
            GROUP BY u.users_id, up.user_profiles_id
            ORDER BY u.created_at DESC
            LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
        `;

        const result = await pool.query(dataQuery, queryParams);

        const items: UserDetail[] = result.rows.map(row => ({
            users_id: row.users_id,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            status: row.status,
            last_login_at: row.last_login_at,
            failed_login_count: row.failed_login_count,
            locked_until: row.locked_until,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: {
                user_profiles_id: row.user_profiles_id,
                full_name: row.full_name,
                dob: row.dob,
                gender: row.gender,
                identity_card_number: row.identity_card_number,
                avatar_url: row.avatar_url,
                address: row.address
            }
        }));

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Lấy danh sách người dùng chuyên dùng cho Export
     */
    static async getExportUsers(filter: UserQueryFilter): Promise<UserDetail[]> {
        let queryParams: any[] = [];
        let whereClauses: string[] = ['u.deleted_at IS NULL'];

        if (filter.search) {
            queryParams.push(`%${filter.search}%`);
            whereClauses.push(`(u.email ILIKE $${queryParams.length} OR u.phone_number ILIKE $${queryParams.length} OR up.full_name ILIKE $${queryParams.length})`);
        }

        if (filter.status) {
            queryParams.push(filter.status);
            whereClauses.push(`u.status = $${queryParams.length}`);
        }

        if (filter.role) {
            queryParams.push(filter.role);
            whereClauses.push(`$${queryParams.length} = ANY(ARRAY(SELECT r2.code FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.roles_id WHERE ur2.user_id = u.users_id))`);
        }

        if (filter.fromDate) {
            queryParams.push(filter.fromDate);
            whereClauses.push(`u.created_at >= $${queryParams.length}`);
        }

        if (filter.toDate) {
            queryParams.push(`${filter.toDate} 23:59:59`);
            whereClauses.push(`u.created_at <= $${queryParams.length}`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const dataQuery = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.last_login_at, 
                u.failed_login_count, 
                u.locked_until, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            ${whereString}
            GROUP BY u.users_id, up.user_profiles_id
            ORDER BY u.created_at DESC
        `;

        const result = await pool.query(dataQuery, queryParams);

        return result.rows.map(row => ({
            users_id: row.users_id,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            status: row.status,
            last_login_at: row.last_login_at,
            failed_login_count: row.failed_login_count,
            locked_until: row.locked_until,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: {
                user_profiles_id: row.user_profiles_id,
                full_name: row.full_name,
                dob: row.dob,
                gender: row.gender,
                identity_card_number: row.identity_card_number,
                avatar_url: row.avatar_url,
                address: row.address
            }
        }));
    }

    /**
     * Lấy chi tiết user bằng ID
     */
    static async getUserById(userId: string): Promise<UserDetail | null> {
        const query = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.last_login_at, 
                u.failed_login_count, 
                u.locked_until, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            WHERE u.users_id = $1 AND u.deleted_at IS NULL
            GROUP BY u.users_id, up.user_profiles_id
        `;

        const result = await pool.query(query, [userId]);

        if (result.rowCount === 0) return null;

        const row = result.rows[0];

        return {
            users_id: row.users_id,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            status: row.status,
            last_login_at: row.last_login_at,
            failed_login_count: row.failed_login_count,
            locked_until: row.locked_until,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: {
                user_profiles_id: row.user_profiles_id,
                full_name: row.full_name,
                dob: row.dob,
                gender: row.gender,
                identity_card_number: row.identity_card_number,
                avatar_url: row.avatar_url,
                address: row.address
            }
        };
    }

    /**
     * Cập nhật thông tin profile của User (Bởi admin)
     */
    static async updateUser(
        userId: string,
        data: UpdateUserByAdminInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {

        // Validate Role
        let validRolesData: { roles_id: string, code: string }[] = [];
        if (data.roles && data.roles.length > 0) {
            const placeholders = data.roles.map((_, i) => `$${i + 1}`).join(',');
            const roleResult = await pool.query(`SELECT roles_id, code FROM roles WHERE code IN (${placeholders})`, data.roles);

            if (roleResult.rows.length !== data.roles.length) {
                throw new AppError(400, 'USER_INVALID_ROLE', 'Một hoặc nhiều vai trò (Role) bổ sung không tồn tại trong hệ thống.');
            }
            validRolesData = roleResult.rows;
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Update Users Table
            const userFields: string[] = [];
            const userValues: any[] = [];
            let userParamIdx = 1;

            if (data.email !== undefined) {
                userFields.push(`email = $${userParamIdx++}`);
                userValues.push(data.email);
            }
            if (data.phone !== undefined) {
                userFields.push(`phone_number = $${userParamIdx++}`);
                userValues.push(data.phone);
            }
            if (data.status !== undefined) {
                userFields.push(`status = $${userParamIdx++}`);
                userValues.push(data.status);
            }

            if (userFields.length > 0) {
                userFields.push(`updated_at = CURRENT_TIMESTAMP`);
                userValues.push(userId);

                await client.query(`
                    UPDATE users 
                    SET ${userFields.join(', ')} 
                    WHERE users_id = $${userParamIdx}
                `, userValues);
            }

            // Update User Profiles Table
            const profileFields: string[] = [];
            const profileValues: any[] = [];
            let profileParamIdx = 1;

            if (data.full_name !== undefined) {
                profileFields.push(`full_name = $${profileParamIdx++}`);
                profileValues.push(data.full_name);
            }
            if (data.dob !== undefined) {
                profileFields.push(`dob = $${profileParamIdx++}`);
                profileValues.push(data.dob);
            }
            if (data.gender !== undefined) {
                profileFields.push(`gender = $${profileParamIdx++}`);
                profileValues.push(data.gender);
            }
            if (data.identity_card_number !== undefined) {
                profileFields.push(`identity_card_number = $${profileParamIdx++}`);
                profileValues.push(data.identity_card_number);
            }
            if (data.avatar_url !== undefined) {
                profileFields.push(`avatar_url = $${profileParamIdx++}`);
                profileValues.push(data.avatar_url);
            }
            if (data.address !== undefined) {
                profileFields.push(`address = $${profileParamIdx++}`);
                profileValues.push(data.address);
            }

            if (profileFields.length > 0) {
                profileValues.push(userId);
                await client.query(`
                    UPDATE user_profiles 
                    SET ${profileFields.join(', ')} 
                    WHERE user_id = $${profileParamIdx}
                `, profileValues);
            }

            // Update User Roles 
            if (data.roles !== undefined) {
                // Lấy mảng role hiện tại
                const currentRolesResult = await client.query(`
                    SELECT r.code, ur.role_id 
                    FROM user_roles ur 
                    JOIN roles r ON ur.role_id = r.roles_id 
                    WHERE ur.user_id = $1
                `, [userId]);

                const currentRoleCodes = currentRolesResult.rows.map(r => r.code);

                // Tìm role cần thêm và role cần xóa
                const rolesToAdd = data.roles.filter(role => !currentRoleCodes.includes(role));
                const rolesToRemove = currentRoleCodes.filter(role => !data.roles!.includes(role));

                // Xóa các role không còn nằm trong mảng mới
                if (rolesToRemove.length > 0) {
                    const removePlaceholders = rolesToRemove.map((_: any, i: number) => `$${i + 2}`).join(',');
                    await client.query(`
                        DELETE FROM user_roles 
                        WHERE user_id = $1 
                        AND role_id IN (SELECT roles_id FROM roles WHERE code IN (${removePlaceholders}))
                    `, [userId, ...rolesToRemove]);
                }

                // Thêm các role mới
                if (rolesToAdd.length > 0) {

                    // Lọc ra các ID
                    const roleToAddResultRows = validRolesData.filter(r => rolesToAdd.includes(r.code));

                    if (roleToAddResultRows.length > 0) {
                        const values: any[] = [];
                        const insertPlaceholders: string[] = [];

                        roleToAddResultRows.forEach((row, index) => {
                            insertPlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                            values.push(userId, row.roles_id);
                        });

                        await client.query(`
                            INSERT INTO user_roles (user_id, role_id)
                            VALUES ${insertPlaceholders.join(',')}
                        `, values);
                    }
                }
            }

            await client.query('COMMIT');
        } catch (error: any) {
            await client.query('ROLLBACK');

            if (error.code === '23505') {
                const detail = error.detail || '';
                if (detail.includes('email')) {
                    throw new AppError(400, 'USER_EMAIL_EXISTED', 'Email đã tồn tại trong hệ thống.');
                }
                if (detail.includes('phone')) {
                    throw new AppError(400, 'USER_PHONE_EXISTED', 'Số điện thoại đã tồn tại trong hệ thống.');
                }
            }

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Soft delete user
     */
    static async deleteUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const query = `
            UPDATE users
            SET deleted_at = CURRENT_TIMESTAMP, 
                status = 'INACTIVE',
                updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [userId]);

        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Khóa tài khoản (Cập nhật status = BANNED)
     */
    static async lockUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const query = `
            UPDATE users
            SET status = 'BANNED', updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [userId]);

        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Mở khóa tài khoản (Cập nhật status = ACTIVE, xóa thông tin khóa tự động do dăng nhập sai)
     */
    static async unlockUser(
        userId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const query = `
            UPDATE users
            SET status = 'ACTIVE', 
                failed_login_count = 0, 
                locked_until = NULL, 
                updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [userId]);

        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Cập nhật trạng thái người dùng có kèm ghi Audit Log
     */
    static async updateUserStatus(
        userId: string,
        oldStatus: string,
        newStatus: string,
        adminId: string,
        reason: string | undefined,
        ipAddress: string | null,
        userAgent: string | null
    ): Promise<boolean> {
        const updateQuery = `
            UPDATE users
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(updateQuery, [newStatus, userId]);

        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy lịch sử thay đổi trạng thái của người dùng
     */
    static async getStatusHistory(userId: string): Promise<AccountStatusHistory[]> {
        const query = `
            SELECT 
                a.log_id, a.user_id, a.action_type, a.old_value, a.new_value, 
                a.ip_address, a.user_agent, a.created_at,
                up.full_name as changed_by_name
            FROM audit_logs a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            WHERE a.module_name = 'users' AND a.action_type = 'UPDATE' AND a.target_id = $1
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Lấy chuỗi password hash của người dùng
     */
    static async getUserPasswordHash(userId: string): Promise<string | null> {
        const query = `
            SELECT password_hash FROM users
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [userId]);
        if (result.rowCount === 0) return null;
        return result.rows[0].password_hash;
    }

    /**
     * Cập nhật mật khẩu người dùng
     */
    static async updateUserPassword(userId: string, hashedPassword: string | null): Promise<boolean> {
        const query = `
            UPDATE users
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [hashedPassword, userId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy các role của user
     */
    static async getUserRoles(userId: string): Promise<{ roles_id: string; code: string; name: string }[]> {
        const query = `
            SELECT r.roles_id, r.code, r.name 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.roles_id
            WHERE ur.user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Gán role cho user bằng code hoặc id
     */
    static async assignRoleToUser(
        userId: string,
        roleCodeOrId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        // Tìm ID của role
        const roleQuery = `SELECT roles_id, code FROM roles WHERE code = $1 OR roles_id = $1`;
        const roleResult = await pool.query(roleQuery, [roleCodeOrId]);

        if (roleResult.rowCount === 0) return false;
        const roleId = roleResult.rows[0].roles_id;

        const query = `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, role_id) DO NOTHING
        `;
        await pool.query(query, [userId, roleId]);

        return true;
    }

    /**
     * Xóa role của user
     */
    static async removeRoleFromUser(
        userId: string,
        roleIdOrCode: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const query = `
            DELETE FROM user_roles 
            WHERE user_id = $1 
            AND role_id IN (SELECT roles_id FROM roles WHERE code = $2 OR roles_id = $2)
        `;
        const result = await pool.query(query, [userId, roleIdOrCode]);

        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy toàn bộ email và số điện thoại đang hoạt động để validate Bulk Import
     */
    static async getAllEmailsAndPhones(): Promise<{ email: string | null, phone: string | null }[]> {
        const query = `SELECT email, phone_number as phone FROM users WHERE deleted_at IS NULL`;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Insert người dùng từ import
     */
    static async batchInsertUsers(
        usersData: {
            users_id: string;
            email: string | null;
            phone: string | null;
            password_hash: string;
            full_name: string;
            dob: string | null;
            gender: string | null;
            identity_card_number: string | null;
            address: string | null;
            roles: string[];
        }[],
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<number> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const data of usersData) {
                // Insert User
                await client.query(`
                    INSERT INTO users (users_id, email, phone_number, password_hash, status)
                    VALUES ($1, $2, $3, $4, 'ACTIVE')
                `, [data.users_id, data.email, data.phone, data.password_hash]);

                // Insert Profile
                const profileId = `UPRF_${Date.now()}_${randomUUID().substring(0, 8)}`;
                await client.query(`
                    INSERT INTO user_profiles (user_profiles_id, user_id, full_name, dob, gender, identity_card_number, address)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    profileId, data.users_id, data.full_name, data.dob,
                    data.gender, data.identity_card_number, data.address
                ]);

                // Insert Roles
                if (data.roles && data.roles.length > 0) {
                    // Fetch role IDs
                    const rolePlaceholders = data.roles.map((_, i) => `$${i + 1}`).join(',');
                    const rolesResult = await client.query(`SELECT roles_id, code FROM roles WHERE code IN (${rolePlaceholders})`, data.roles);

                    if (rolesResult.rows.length > 0) {
                        for (const roleRow of rolesResult.rows) {
                            await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [data.users_id, roleRow.roles_id]);
                        }
                    }
                }
            }

            await client.query('COMMIT');
            return usersData.length;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy lịch sử Import
     */
    static async getImportHistory(): Promise<any[]> {
        const query = `
            SELECT 
                a.log_id, a.user_id, a.action_type, a.new_value, 
                a.ip_address, a.created_at,
                up.full_name as import_by_name
            FROM audit_logs a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            WHERE a.module_name = 'users' AND a.action_type = 'CREATE' AND a.target_id = 'BULK'
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}
