import { pool } from '../../config/postgresdb';
import {
    EquipmentMaintenanceLog,
    CreateMaintenanceLogInput,
    UpdateMaintenanceLogInput,
    PaginatedMaintenanceLogs
} from '../../models/Facility Management/medical-equipment.model';

export class MaintenanceLogRepository {
    /**
     * Lấy danh sách lịch sử bảo trì theo thiết bị (phân trang, sắp xếp mới nhất)
     */
    static async getLogsByEquipmentId(
        equipmentId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedMaintenanceLogs> {
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*)
            FROM equipment_maintenance_logs
            WHERE equipment_id = $1
        `;
        const countResult = await pool.query(countQuery, [equipmentId]);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                l.*,
                e.name AS equipment_name,
                e.code AS equipment_code
            FROM equipment_maintenance_logs l
            JOIN medical_equipments e ON l.equipment_id = e.equipment_id
            WHERE l.equipment_id = $1
            ORDER BY l.maintenance_date DESC, l.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const dataResult = await pool.query(dataQuery, [equipmentId, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết 1 log bảo trì theo ID
     */
    static async getLogById(logId: string): Promise<EquipmentMaintenanceLog | null> {
        const query = `
            SELECT
                l.*,
                e.name AS equipment_name,
                e.code AS equipment_code
            FROM equipment_maintenance_logs l
            JOIN medical_equipments e ON l.equipment_id = e.equipment_id
            WHERE l.log_id = $1
        `;
        const result = await pool.query(query, [logId]);
        return result.rows[0] || null;
    }

    /**
     * Tạo mới log bảo trì
     */
    static async createLog(logId: string, equipmentId: string, input: CreateMaintenanceLogInput): Promise<EquipmentMaintenanceLog> {
        const query = `
            INSERT INTO equipment_maintenance_logs (
                log_id, equipment_id, maintenance_date, maintenance_type,
                description, performed_by, cost, next_maintenance_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await pool.query(query, [
            logId,
            equipmentId,
            input.maintenance_date,
            input.maintenance_type,
            input.description ?? null,
            input.performed_by ?? null,
            input.cost ?? 0,
            input.next_maintenance_date ?? null,
        ]);
        return (await this.getLogById(logId)) as EquipmentMaintenanceLog;
    }

    /**
     * Cập nhật log bảo trì
     */
    static async updateLog(logId: string, input: UpdateMaintenanceLogInput): Promise<EquipmentMaintenanceLog> {
        const updates: string[] = [];
        const params: any[] = [logId];
        let paramIdx = 2;

        const updateFields: (keyof UpdateMaintenanceLogInput)[] = [
            'maintenance_date', 'maintenance_type', 'description',
            'performed_by', 'cost', 'next_maintenance_date'
        ];

        updateFields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        if (updates.length === 0) {
            return (await this.getLogById(logId)) as EquipmentMaintenanceLog;
        }

        updates.push(`updated_at = NOW()`);

        const query = `
            UPDATE equipment_maintenance_logs
            SET ${updates.join(', ')}
            WHERE log_id = $1
        `;
        await pool.query(query, params);
        return (await this.getLogById(logId)) as EquipmentMaintenanceLog;
    }

    /**
     * Xóa log bảo trì
     */
    static async deleteLog(logId: string): Promise<void> {
        const query = `DELETE FROM equipment_maintenance_logs WHERE log_id = $1`;
        await pool.query(query, [logId]);
    }
}
