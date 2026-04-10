import { pool } from '../../config/postgresdb';
import {
    InstructionTemplate, CreateTemplateInput, UpdateTemplateInput,
    DrugDefaultInstruction, UpsertDrugDefaultInput,
} from '../../models/Medication Management/med-instruction.model';


export class MedInstructionRepository {

    static generateTemplateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `MIT_${yy}${mm}${dd}_${rand}`;
    }

    static generateDefaultId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `DDI_${yy}${mm}${dd}_${rand}`;
    }

    // ========== TEMPLATES ==========

    /** Danh sách mẫu (filter type, search) */
    static async findTemplates(type?: string, search?: string): Promise<InstructionTemplate[]> {
        const conditions: string[] = ['t.is_active = TRUE'];
        const values: any[] = [];
        let paramIdx = 1;

        if (type) {
            conditions.push(`t.type = $${paramIdx++}`);
            values.push(type);
        }
        if (search) {
            conditions.push(`(t.label ILIKE $${paramIdx} OR t.value ILIKE $${paramIdx})`);
            values.push(`%${search}%`);
            paramIdx++;
        }

        const result = await pool.query(
            `SELECT * FROM medication_instruction_templates t
             WHERE ${conditions.join(' AND ')}
             ORDER BY t.type, t.sort_order ASC`, values
        );
        return result.rows;
    }

    static async findTemplateById(id: string): Promise<InstructionTemplate | null> {
        const r = await pool.query(`SELECT * FROM medication_instruction_templates WHERE template_id = $1`, [id]);
        return r.rows[0] || null;
    }

    static async templateValueExists(type: string, value: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT EXISTS(SELECT 1 FROM medication_instruction_templates WHERE type = $1 AND value = $2`;
        const values: any[] = [type, value];
        if (excludeId) { query += ` AND template_id != $3`; values.push(excludeId); }
        query += `) AS exists`;
        const r = await pool.query(query, values);
        return r.rows[0].exists;
    }

    static async createTemplate(id: string, input: CreateTemplateInput): Promise<InstructionTemplate> {
        const r = await pool.query(
            `INSERT INTO medication_instruction_templates (template_id, type, label, value, sort_order)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, input.type, input.label, input.value, input.sort_order || 0]
        );
        return r.rows[0];
    }

    static async updateTemplate(id: string, input: UpdateTemplateInput): Promise<InstructionTemplate> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const fields: (keyof UpdateTemplateInput)[] = ['label', 'value', 'sort_order', 'is_active'];
        for (const field of fields) {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        }
        updates.push(`updated_at = NOW()`);

        const r = await pool.query(
            `UPDATE medication_instruction_templates SET ${updates.join(', ')} WHERE template_id = $1 RETURNING *`, params
        );
        return r.rows[0];
    }

    /** Soft delete */
    static async deleteTemplate(id: string): Promise<void> {
        await pool.query(
            `UPDATE medication_instruction_templates SET is_active = FALSE, updated_at = NOW() WHERE template_id = $1`, [id]
        );
    }

    // ========== DRUG DEFAULTS ==========

    static async drugActive(drugId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM drugs WHERE drugs_id = $1 AND is_active = TRUE) AS ok`, [drugId]
        );
        return r.rows[0].ok;
    }

    static async findDefaultByDrug(drugId: string): Promise<DrugDefaultInstruction | null> {
        const r = await pool.query(
            `SELECT ddi.*, d.drug_code, d.brand_name, d.dispensing_unit
             FROM drug_default_instructions ddi
             LEFT JOIN drugs d ON d.drugs_id = ddi.drug_id
             WHERE ddi.drug_id = $1`, [drugId]
        );
        return r.rows[0] || null;
    }

    /** Upsert: tạo mới hoặc cập nhật */
    static async upsertDefault(id: string, drugId: string, input: UpsertDrugDefaultInput): Promise<DrugDefaultInstruction> {
        const r = await pool.query(
            `INSERT INTO drug_default_instructions
                (default_instruction_id, drug_id, default_dosage, default_frequency,
                 default_duration_days, default_route, default_instruction, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (drug_id) DO UPDATE SET
                default_dosage = EXCLUDED.default_dosage,
                default_frequency = EXCLUDED.default_frequency,
                default_duration_days = EXCLUDED.default_duration_days,
                default_route = EXCLUDED.default_route,
                default_instruction = EXCLUDED.default_instruction,
                notes = EXCLUDED.notes,
                updated_at = NOW()
             RETURNING *`,
            [id, drugId, input.default_dosage || null, input.default_frequency || null,
             input.default_duration_days || null, input.default_route || null,
             input.default_instruction || null, input.notes || null]
        );
        return r.rows[0];
    }

    static async deleteDefault(drugId: string): Promise<void> {
        await pool.query(`DELETE FROM drug_default_instructions WHERE drug_id = $1`, [drugId]);
    }

    /** Danh sách thuốc có hướng dẫn mặc định */
    static async findAllDefaults(search?: string): Promise<DrugDefaultInstruction[]> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (search) {
            conditions.push(`(d.drug_code ILIKE $${paramIdx} OR d.brand_name ILIKE $${paramIdx})`);
            values.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

        const r = await pool.query(
            `SELECT ddi.*, d.drug_code, d.brand_name, d.dispensing_unit
             FROM drug_default_instructions ddi
             LEFT JOIN drugs d ON d.drugs_id = ddi.drug_id
             WHERE 1=1 ${whereClause}
             ORDER BY d.brand_name ASC`, values
        );
        return r.rows;
    }
}
