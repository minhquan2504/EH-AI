import { pool } from "../../config/postgresdb";
import { AssignUserFacilityInput, UserFacilityInfo } from "../../models/Facility Management/facility.model";
import { SecurityUtil } from "../../utils/auth-security.util";
import { randomUUID } from "crypto";

export class UserFacilityRepository {
    /**
     * Lấy danh sách chi nhánh và cơ sở gốc của User
     */
    static async getUserFacilities(userId: string): Promise<UserFacilityInfo[]> {
        const query = `
            SELECT 
                ubd.user_branch_dept_id,
                ubd.branch_id,
                b.code AS branch_code,
                b.name AS branch_name,
                b.facility_id,
                f.code AS facility_code,
                f.name AS facility_name,
                ubd.department_id,
                d.code AS department_code,
                d.name AS department_name,
                ubd.role_title,
                ubd.status
            FROM user_branch_dept ubd
            JOIN branches b ON ubd.branch_id = b.branches_id
            JOIN facilities f ON b.facility_id = f.facilities_id
            LEFT JOIN departments d ON ubd.department_id = d.departments_id
            WHERE ubd.user_id = $1
            ORDER BY f.name, b.name
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Kiểm tra chi nhánh có tồn tại hay không
     */
    static async checkBranchExists(branchId: string): Promise<boolean> {
        const query = `SELECT 1 FROM branches WHERE branches_id = $1 LIMIT 1`;
        const result = await pool.query(query, [branchId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra khoa có tồn tại trong chi nhánh không
     */
    static async checkDepartmentExists(departmentId: string, branchId: string): Promise<boolean> {
        const query = `SELECT 1 FROM departments WHERE departments_id = $1 AND branch_id = $2 LIMIT 1`;
        const result = await pool.query(query, [departmentId, branchId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gán user vào chi nhánh (user_branch_dept)
     */
    static async assignUserToFacility(
        userId: string,
        data: AssignUserFacilityInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO user_branch_dept (
                    user_branch_dept_id, 
                    user_id, 
                    branch_id, 
                    department_id, 
                    role_title
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, branch_id) 
                DO UPDATE SET 
                    department_id = EXCLUDED.department_id,
                    role_title = EXCLUDED.role_title,
                    status = 'ACTIVE'
            `;

            const id = SecurityUtil.generateUserFacilityId(userId);
            const result = await client.query(query, [
                id,
                userId,
                data.branchId,
                data.departmentId || null,
                data.roleTitle || null
            ]);

            if ((result.rowCount ?? 0) > 0) {

            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa record của user tại chi nhánh
     */
    static async removeUserFromFacility(
        userId: string,
        branchId: string,
        reason: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                DELETE FROM user_branch_dept 
                WHERE user_id = $1 AND branch_id = $2
            `;
            const result = await client.query(query, [userId, branchId]);

            if ((result.rowCount ?? 0) === 0) {
                await client.query('ROLLBACK');
                return false;
            }



            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Thuyên chuyển nhân sự sang chi nhánh mới
     */
    static async transferUserToFacility(
        userId: string,
        oldBranchId: string,
        newData: AssignUserFacilityInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete old binding
            const deleteQuery = `
                DELETE FROM user_branch_dept 
                WHERE user_id = $1 AND branch_id = $2
            `;
            const delResult = await client.query(deleteQuery, [userId, oldBranchId]);

            if ((delResult.rowCount ?? 0) === 0) {
                await client.query('ROLLBACK');
                return false; // User not found in old branch
            }

            // 2. Insert new binding
            const insertQuery = `
                INSERT INTO user_branch_dept (
                    user_branch_dept_id, 
                    user_id, 
                    branch_id, 
                    department_id, 
                    role_title
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, branch_id) 
                DO UPDATE SET 
                    department_id = EXCLUDED.department_id,
                    role_title = EXCLUDED.role_title,
                    status = 'ACTIVE'
            `;

            const id = SecurityUtil.generateUserFacilityId(userId);
            await client.query(insertQuery, [
                id,
                userId,
                newData.branchId,
                newData.departmentId || null,
                newData.roleTitle || null
            ]);

            // 3. Log Audit


            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
