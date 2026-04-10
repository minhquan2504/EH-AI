import { pool } from '../../config/postgresdb';
import {
    DrugCategory,
    CreateDrugCategoryInput,
    UpdateDrugCategoryInput,
    PaginatedDrugCategories
} from '../../models/Medication Management/drug-category.model';

export class DrugCategoryRepository {
    /**
     * Lấy danh sách nhóm thuốc có phân trang và tìm kiếm.
     */
    static async getCategories(
        search: string | undefined,
        page: number,
        limit: number
    ): Promise<PaginatedDrugCategories> {
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

        const countQuery = `SELECT COUNT(*) FROM drug_categories ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT drug_categories_id, code, name, description
            FROM drug_categories
            ${whereClause}
            ORDER BY name ASC
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
     * Lấy chi tiết 1 nhóm thuốc theo ID.
     */
    static async getCategoryById(id: string): Promise<DrugCategory | null> {
        const query = `
            SELECT drug_categories_id, code, name, description, deleted_at
            FROM drug_categories
            WHERE drug_categories_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy chi tiết 1 nhóm thuốc theo code
     */
    static async getCategoryByCode(code: string): Promise<DrugCategory | null> {
        const query = `
            SELECT drug_categories_id, code, name, description, deleted_at
            FROM drug_categories
            WHERE code = $1 AND deleted_at IS NULL
        `;

        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ nhóm thuốc (dùng cho Export)
     */
    static async getAllCategories(): Promise<DrugCategory[]> {
        const query = `
            SELECT drug_categories_id, code, name, description, deleted_at
            FROM drug_categories
            WHERE deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Upsert nhóm thuốc (dùng cho Import)
     */
    static async upsertCategory(id: string, code: string, name: string, description: string | null): Promise<DrugCategory> {
        const query = `
            INSERT INTO drug_categories (drug_categories_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE 
            SET name = excluded.name, 
                description = excluded.description, 
                deleted_at = NULL
            RETURNING drug_categories_id, code, name, description, deleted_at
        `;
        const result = await pool.query(query, [id, code, name, description]);
        return result.rows[0];
    }

    /**
     * Tạo mới nhóm thuốc.
     */
    static async createCategory(id: string, input: CreateDrugCategoryInput): Promise<DrugCategory> {
        const query = `
            INSERT INTO drug_categories (drug_categories_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING drug_categories_id, code, name, description
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
     * Cập nhật thông tin nhóm thuốc
     */
    static async updateCategory(id: string, input: UpdateDrugCategoryInput): Promise<DrugCategory> {
        const updates: string[] = [];
        const params: (string | number)[] = [id];
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
            return (await this.getCategoryById(id)) as DrugCategory;
        }

        const query = `
            UPDATE drug_categories
            SET ${updates.join(', ')}
            WHERE drug_categories_id = $1
            RETURNING drug_categories_id, code, name, description
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa nhóm thuốc 
     */
    static async deleteCategory(id: string): Promise<void> {
        const query = `
            UPDATE drug_categories 
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE drug_categories_id = $1
        `;
        await pool.query(query, [id]);
    }

    /**
     * Kiểm tra xem category này có đang chứa thuốc không
     */
    static async hasDrugsInCategory(id: string): Promise<boolean> {
        const query = `
            SELECT 1 
            FROM drugs 
            WHERE category_id = $1 
            LIMIT 1
        `;
        const result = await pool.query(query, [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}
