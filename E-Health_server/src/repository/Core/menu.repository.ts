import { pool } from '../../config/postgresdb';
import { MenuDetail, CreateMenuInput, UpdateMenuInput, MenuQueryFilter } from '../../models/Core/menu.model';
import { randomUUID } from 'crypto';

export class MenuRepository {
    /**
     * Lấy danh sách toàn bộ Menu hệ thống
     */
    static async getAllMenus(filter?: MenuQueryFilter): Promise<MenuDetail[]> {
        let query = `
            SELECT menus_id, code, name, url, icon, parent_id, sort_order, status
            FROM menus
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filter) {
            if (filter.search) {
                query += ` AND (code ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
                params.push(`%${filter.search}%`);
                paramIndex++;
            }
            if (filter.status) {
                query += ` AND status = $${paramIndex}`;
                params.push(filter.status);
                paramIndex++;
            }
            if (filter.parent_id) {
                query += ` AND parent_id = $${paramIndex}`;
                params.push(filter.parent_id);
                paramIndex++;
            }
        }

        query += ` ORDER BY sort_order ASC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy chi tiết Menu theo ID hoặc Code
     */
    static async getMenuByIdOrCode(identifier: string): Promise<MenuDetail | null> {
        const query = `
            SELECT menus_id, code, name, url, icon, parent_id, sort_order, status
            FROM menus
            WHERE (menus_id = $1 OR code = $1) AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [identifier]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Tạo Menu mới
     */
    static async createMenu(
        menuId: string,
        data: CreateMenuInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<MenuDetail> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertQuery = `
                INSERT INTO menus (menus_id, code, name, url, icon, parent_id, sort_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING menus_id, code, name, url, icon, parent_id, sort_order, status
            `;
            const params = [menuId, data.code, data.name, data.url || null, data.icon || null, data.parent_id || null, data.sort_order || 0];
            const result = await client.query(insertQuery, params);
            const newMenu = result.rows[0];




            await client.query('COMMIT');
            return newMenu;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cập nhật Menu
     */
    static async updateMenu(
        menuId: string,
        data: UpdateMenuInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<MenuDetail> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const oldMenuRes = await client.query(`SELECT * FROM menus WHERE menus_id = $1`, [menuId]);
            const oldMenu = oldMenuRes.rows[0];

            const updates: string[] = [];
            const params: any[] = [menuId];
            let paramIndex = 2;

            if (data.name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                params.push(data.name);
            }
            if (data.url !== undefined) {
                updates.push(`url = $${paramIndex++}`);
                params.push(data.url === "" ? null : data.url);
            }
            if (data.icon !== undefined) {
                updates.push(`icon = $${paramIndex++}`);
                params.push(data.icon === "" ? null : data.icon);
            }
            if (data.parent_id !== undefined) {
                updates.push(`parent_id = $${paramIndex++}`);
                params.push(data.parent_id === "" ? null : data.parent_id);
            }
            if (data.sort_order !== undefined) {
                updates.push(`sort_order = $${paramIndex++}`);
                params.push(data.sort_order);
            }
            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex++}`);
                params.push(data.status);
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            const updateQuery = `
                UPDATE menus
                SET ${updates.join(', ')}
                WHERE menus_id = $1 AND deleted_at IS NULL
                RETURNING menus_id, code, name, url, icon, parent_id, sort_order, status
            `;

            const result = await client.query(updateQuery, params);
            const updatedMenu = result.rows[0];




            await client.query('COMMIT');
            return updatedMenu;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa mềm Menu
     */
    static async deleteMenu(
        menuId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const oldMenuRes = await client.query(`SELECT * FROM menus WHERE menus_id = $1`, [menuId]);
            const oldMenu = oldMenuRes.rows[0];

            await client.query(`
                UPDATE menus 
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE menus_id = $1
            `, [menuId]);

            // Xóa rác: Gỡ Menu này khỏi các Role đang map
            await client.query(`DELETE FROM role_menus WHERE menu_id = $1`, [menuId]);

            // Nếu menu này là gốc của menu khác, thì các menu con sẽ set parent_id = NULL
            await client.query(`UPDATE menus SET parent_id = NULL WHERE parent_id = $1`, [menuId]);




            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách Menu không trùng lặp dựa trên mảng Role ID
     */
    static async getMenusByRoleIds(roleIds: string[]): Promise<MenuDetail[]> {
        if (!roleIds || roleIds.length === 0) return [];

        const placeholders = roleIds.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            SELECT DISTINCT m.menus_id, m.code, m.name, m.url, m.icon, m.parent_id, m.sort_order, m.status, m.created_at, m.updated_at
            FROM role_menus rm
            JOIN menus m ON rm.menu_id = m.menus_id
            WHERE rm.role_id IN (${placeholders}) 
              AND m.deleted_at IS NULL 
              AND m.status = 'ACTIVE'
            ORDER BY m.sort_order ASC
        `;
        const result = await pool.query(query, roleIds);
        return result.rows;
    }
}
