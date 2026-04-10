import { pool } from '../../config/postgresdb';
import {
    MasterDataCategory,
    CreateCategoryInput,
    UpdateCategoryInput,
    PaginatedCategories
} from '../../models/Core/master-data.model';

export class MasterDataRepository {
    /**
     * Lấy danh sách nhóm danh mục có phân trang và tìm kiếm.
     */
    static async getCategories(
        search: string | undefined,
        page: number,
        limit: number
    ): Promise<PaginatedCategories> {
        const conditions: string[] = ['deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (search) {
            conditions.push(`(code ILIKE $${paramIdx} OR name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM master_data_categories ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT master_data_categories_id, code, name, description
            FROM master_data_categories
            ${whereClause}
            ORDER BY code ASC
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
     * Lấy chi tiết 1 nhóm danh mục theo mã code.
     */
    static async getCategoryById(id: string): Promise<MasterDataCategory | null> {
        const query = `
            SELECT master_data_categories_id, code, name, description
            FROM master_data_categories
            WHERE master_data_categories_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ nhóm danh mục (dùng cho Export)
     */
    static async getAllCategories(): Promise<MasterDataCategory[]> {
        const query = `
            SELECT master_data_categories_id, code, name, description
            FROM master_data_categories
            WHERE deleted_at IS NULL
            ORDER BY code ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Upsert nhóm danh mục (dùng cho Import)
     */
    static async upsertCategory(id: string, code: string, name: string, description: string | null): Promise<MasterDataCategory> {
        const query = `
            INSERT INTO master_data_categories (master_data_categories_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE 
            SET name = excluded.name, 
                description = excluded.description, 
                deleted_at = NULL
            RETURNING master_data_categories_id, code, name, description
        `;
        const result = await pool.query(query, [id, code, name, description]);
        return result.rows[0];
    }

    /**
     * Lấy chi tiết 1 nhóm danh mục theo mã code
     */
    static async getCategoryByCode(code: string): Promise<MasterDataCategory | null> {
        const query = `
            SELECT master_data_categories_id, code, name, description
            FROM master_data_categories
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Tạo mới nhóm danh mục.
     */
    static async createCategory(id: string, input: CreateCategoryInput): Promise<MasterDataCategory> {
        const query = `
            INSERT INTO master_data_categories (master_data_categories_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING master_data_categories_id, code, name, description
        `;
        const result = await pool.query(query, [
            id,
            input.code,
            input.name,
            input.description ?? null
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin nhóm danh mục
     */
    static async updateCategory(id: string, input: UpdateCategoryInput): Promise<MasterDataCategory> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        if (input.name !== undefined) {
            updates.push(`name = $${paramIdx++}`);
            params.push(input.name);
        }
        if (input.description !== undefined) {
            updates.push(`description = $${paramIdx++}`);
            params.push(input.description);
        }

        if (updates.length === 0) {
            return (await this.getCategoryById(id)) as MasterDataCategory;
        }

        const query = `
            UPDATE master_data_categories
            SET ${updates.join(', ')}
            WHERE master_data_categories_id = $1 AND deleted_at IS NULL
            RETURNING master_data_categories_id, code, name, description
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm nhóm danh mục
     */
    static async deleteCategory(id: string): Promise<void> {
        const query = `
            UPDATE master_data_categories 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE master_data_categories_id = $1 AND deleted_at IS NULL
        `;
        await pool.query(query, [id]);
    }

    /**
     * Đếm số lượng items con thuộc về category này.
     */
    static async countActiveItemsInCategory(code: string): Promise<number> {
        const query = `
            SELECT COUNT(*) 
            FROM master_data_items 
            WHERE category_code = $1 AND is_active = TRUE
        `;
        const result = await pool.query(query, [code]);
        return parseInt(result.rows[0].count, 10);
    }
}