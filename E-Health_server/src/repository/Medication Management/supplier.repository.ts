import { pool } from '../../config/postgresdb';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '../../models/Medication Management/stock-in.model';


export class SupplierRepository {

    static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `SUP_${yy}${mm}${dd}_${rand}`;
    }

    static async findAll(search?: string, activeOnly?: boolean): Promise<Supplier[]> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx} OR s.contact_person ILIKE $${paramIdx})`);
            values.push(`%${search}%`);
            paramIdx++;
        }
        if (activeOnly) {
            conditions.push(`s.is_active = TRUE`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(
            `SELECT * FROM suppliers s ${whereClause} ORDER BY s.name ASC`,
            values
        );
        return result.rows;
    }

    static async findById(id: string): Promise<Supplier | null> {
        const result = await pool.query(`SELECT * FROM suppliers WHERE supplier_id = $1`, [id]);
        return result.rows[0] || null;
    }

    static async codeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT EXISTS(SELECT 1 FROM suppliers WHERE code = $1`;
        const values: any[] = [code];
        if (excludeId) {
            query += ` AND supplier_id != $2`;
            values.push(excludeId);
        }
        query += `) AS exists`;
        const result = await pool.query(query, values);
        return result.rows[0].exists;
    }

    static async create(id: string, input: CreateSupplierInput): Promise<Supplier> {
        const result = await pool.query(
            `INSERT INTO suppliers (supplier_id, code, name, contact_person, phone, email, address, tax_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [id, input.code, input.name, input.contact_person || null, input.phone || null,
             input.email || null, input.address || null, input.tax_code || null]
        );
        return result.rows[0];
    }

    static async update(id: string, input: UpdateSupplierInput): Promise<Supplier> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const fields: (keyof UpdateSupplierInput)[] = [
            'name', 'contact_person', 'phone', 'email', 'address', 'tax_code', 'is_active',
        ];
        for (const field of fields) {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        }
        updates.push(`updated_at = NOW()`);

        const result = await pool.query(
            `UPDATE suppliers SET ${updates.join(', ')} WHERE supplier_id = $1 RETURNING *`,
            params
        );
        return result.rows[0];
    }
}
