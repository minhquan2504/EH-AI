import { pool } from '../../config/postgresdb';
import {
    Drug,
    CreateDrugInput,
    UpdateDrugInput,
    PaginatedDrugs
} from '../../models/Medication Management/drug.model';

export class DrugRepository {
    /**
     * Lấy danh sách thuốc TẤT CẢ
     */
    static async getDrugsAdmin(
        search: string | undefined,
        categoryId: string | undefined,
        isActive: boolean | undefined,
        isPrescriptionOnly: boolean | undefined,
        page: number,
        limit: number
    ): Promise<PaginatedDrugs> {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIdx = 1;

        if (categoryId) {
            conditions.push(`category_id = $${paramIdx}`);
            params.push(categoryId);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        if (isPrescriptionOnly !== undefined) {
            conditions.push(`is_prescription_only = $${paramIdx}`);
            params.push(isPrescriptionOnly);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(drug_code ILIKE $${paramIdx} OR brand_name ILIKE $${paramIdx} OR active_ingredients ILIKE $${paramIdx} OR national_drug_code ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM drugs ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT *
            FROM drugs
            ${whereClause}
            ORDER BY brand_name ASC
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
     * Lấy danh sách thuốc đang ACTIVE 
     */
    static async getActiveDrugs(search: string | undefined): Promise<Drug[]> {
        const conditions: string[] = ['is_active = TRUE'];
        const params: any[] = [];
        let paramIdx = 1;

        if (search) {
            conditions.push(`(brand_name ILIKE $${paramIdx} OR active_ingredients ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        // Giới hạn 50 kết quả để Dropdown không bị đơ
        const query = `
            SELECT *
            FROM drugs
            ${whereClause}
            ORDER BY brand_name ASC
            LIMIT 50 
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách thuốc theo một danh mục cụ thể (Còn ACTIVE)
     */
    static async getActiveDrugsByCategory(categoryId: string): Promise<Drug[]> {
        const query = `
            SELECT *
            FROM drugs
            WHERE category_id = $1 AND is_active = TRUE
            ORDER BY brand_name ASC
        `;
        const result = await pool.query(query, [categoryId]);
        return result.rows;
    }

    /**
     * Lấy chi tiết thuốc theo ID
     */
    static async getDrugById(id: string): Promise<Drug | null> {
        const query = `SELECT * FROM drugs WHERE drugs_id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy thông tin thuốc theo Mã nội bộ
     */
    static async getDrugByCode(drugCode: string): Promise<Drug | null> {
        const query = `SELECT * FROM drugs WHERE drug_code = $1`;
        const result = await pool.query(query, [drugCode]);
        return result.rows[0] || null;
    }

    /**
     * Lấy thông tin thuốc theo Mã quốc gia
     */
    static async getDrugByNationalCode(nationalCode: string): Promise<Drug | null> {
        const query = `SELECT * FROM drugs WHERE national_drug_code = $1`;
        const result = await pool.query(query, [nationalCode]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ thuốc (dùng cho Export)
     */
    static async getAllDrugs(): Promise<Drug[]> {
        const query = `
            SELECT *
            FROM drugs
            ORDER BY brand_name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Upsert thuốc (dùng cho Import)
     */
    static async upsertDrug(
        id: string,
        input: CreateDrugInput
    ): Promise<Drug> {
        const query = `
            INSERT INTO drugs (
                drugs_id, drug_code, national_drug_code, brand_name, 
                active_ingredients, category_id, route_of_administration, 
                dispensing_unit, is_prescription_only, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (drug_code) DO UPDATE 
            SET national_drug_code = excluded.national_drug_code,
                brand_name = excluded.brand_name,
                active_ingredients = excluded.active_ingredients,
                category_id = excluded.category_id,
                route_of_administration = excluded.route_of_administration,
                dispensing_unit = excluded.dispensing_unit,
                is_prescription_only = excluded.is_prescription_only,
                is_active = excluded.is_active
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.drug_code,
            input.national_drug_code ?? null,
            input.brand_name,
            input.active_ingredients,
            input.category_id,
            input.route_of_administration ?? null,
            input.dispensing_unit,
            input.is_prescription_only ?? true,
            input.is_active ?? true
        ]);
        return result.rows[0];
    }

    /**
     * Tạo mới thuốc
     */
    static async createDrug(id: string, input: CreateDrugInput): Promise<Drug> {
        const query = `
            INSERT INTO drugs (
                drugs_id, drug_code, national_drug_code, brand_name, 
                active_ingredients, category_id, route_of_administration, 
                dispensing_unit, is_prescription_only, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.drug_code,
            input.national_drug_code ?? null,
            input.brand_name,
            input.active_ingredients,
            input.category_id,
            input.route_of_administration ?? null,
            input.dispensing_unit,
            input.is_prescription_only ?? true,
            input.is_active ?? true
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin thuốc
     */
    static async updateDrug(id: string, input: UpdateDrugInput): Promise<Drug> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const updateFields: (keyof UpdateDrugInput)[] = [
            'national_drug_code', 'brand_name', 'active_ingredients',
            'category_id', 'route_of_administration', 'dispensing_unit',
            'is_prescription_only'
        ];

        updateFields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        if (updates.length === 0) {
            return (await this.getDrugById(id)) as Drug;
        }

        const query = `
            UPDATE drugs
            SET ${updates.join(', ')}
            WHERE drugs_id = $1
            RETURNING *
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Toggle status (Khóa / Mở khóa)
     */
    static async toggleDrugStatus(id: string, is_active: boolean): Promise<Drug> {
        const query = `
            UPDATE drugs
            SET is_active = $2
            WHERE drugs_id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, is_active]);
        return result.rows[0];
    }
}
