import { pool } from '../../config/postgresdb';
import { MasterDataItem, CreateItemInput, UpdateItemInput, PaginatedItems } from '../../models/Core/master-data-item.model';

export class MasterDataItemRepository {
    /**
     * Lấy danh sách items có phân trang và tìm kiếm
     */
    static async getItems(
        search: string | undefined,
        categoryCode: string | undefined,
        page: number,
        limit: number
    ): Promise<PaginatedItems> {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIdx = 1;

        if (categoryCode) {
            conditions.push(`category_code = $${paramIdx}`);
            params.push(categoryCode);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(code ILIKE $${paramIdx} OR value ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM master_data_items ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT master_data_items_id, category_code, code, value, sort_order, is_active
            FROM master_data_items
            ${whereClause}
            ORDER BY category_code ASC, sort_order ASC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy danh sách items public của 1 category
     */
    static async getActiveItemsByCategory(categoryCode: string): Promise<MasterDataItem[]> {
        const query = `
            SELECT master_data_items_id, category_code, code, value, sort_order, is_active
            FROM master_data_items
            WHERE category_code = $1 AND is_active = TRUE
            ORDER BY sort_order ASC
        `;
        const result = await pool.query(query, [categoryCode]);
        return result.rows;
    }

    /**
     * Lấy toàn bộ items của 1 category (dùng cho Export)
     */
    static async getAllItemsByCategory(categoryCode: string): Promise<MasterDataItem[]> {
        const query = `
            SELECT master_data_items_id, category_code, code, value, sort_order, is_active
            FROM master_data_items
            WHERE category_code = $1
            ORDER BY sort_order ASC
        `;
        const result = await pool.query(query, [categoryCode]);
        return result.rows;
    }

    /**
     * Upsert 1 item (dùng cho Import)
     */
    static async upsertItem(
        id: string,
        categoryCode: string,
        code: string,
        value: string,
        sortOrder: number,
        isActive: boolean
    ): Promise<MasterDataItem> {
        const query = `
            INSERT INTO master_data_items (
                master_data_items_id, category_code, code, value, sort_order, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (category_code, code) DO UPDATE 
            SET value = excluded.value, 
                sort_order = excluded.sort_order,
                is_active = excluded.is_active
            RETURNING master_data_items_id, category_code, code, value, sort_order, is_active
        `;
        const result = await pool.query(query, [id, categoryCode, code, value, sortOrder, isActive]);
        return result.rows[0];
    }

    /**
     * Lấy chi tiết 1 item theo ID
     */
    static async getItemById(id: string): Promise<MasterDataItem | null> {
        const query = `
            SELECT master_data_items_id, category_code, code, value, sort_order, is_active
            FROM master_data_items
            WHERE master_data_items_id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy chi tiết 1 item theo category_code và code
     */
    static async getItemByCode(categoryCode: string, code: string): Promise<MasterDataItem | null> {
        const query = `
            SELECT master_data_items_id, category_code, code, value, sort_order, is_active
            FROM master_data_items
            WHERE category_code = $1 AND code = $2
        `;
        const result = await pool.query(query, [categoryCode, code]);
        return result.rows[0] || null;
    }

    /**
     * Thêm mới 1 item
     */
    static async createItem(id: string, categoryCode: string, input: CreateItemInput): Promise<MasterDataItem> {
        const query = `
            INSERT INTO master_data_items (
                master_data_items_id, 
                category_code, 
                code, 
                value, 
                sort_order, 
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING master_data_items_id, category_code, code, value, sort_order, is_active
        `;
        const result = await pool.query(query, [
            id,
            categoryCode,
            input.code,
            input.value,
            input.sort_order ?? 0,
            input.is_active ?? true
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật 1 item
     */
    static async updateItem(id: string, input: UpdateItemInput): Promise<MasterDataItem> {
        const updates: string[] = [];
        const params: (string | number | boolean)[] = [id];
        let paramIdx = 2;

        if (input.value !== undefined) {
            updates.push(`value = $${paramIdx++}`);
            params.push(input.value);
        }
        if (input.sort_order !== undefined) {
            updates.push(`sort_order = $${paramIdx++}`);
            params.push(input.sort_order);
        }
        if (input.is_active !== undefined) {
            updates.push(`is_active = $${paramIdx++}`);
            params.push(input.is_active);
        }

        if (updates.length === 0) {
            return (await this.getItemById(id)) as MasterDataItem;
        }

        const query = `
            UPDATE master_data_items
            SET ${updates.join(', ')}
            WHERE master_data_items_id = $1
            RETURNING master_data_items_id, category_code, code, value, sort_order, is_active
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Delete an item 
     */
    static async deleteItem(id: string): Promise<void> {
        const query = `
            UPDATE master_data_items 
            SET is_active = FALSE 
            WHERE master_data_items_id = $1
        `;
        await pool.query(query, [id]);
    }
}
