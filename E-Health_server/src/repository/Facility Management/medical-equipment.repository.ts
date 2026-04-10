import { pool } from '../../config/postgresdb';
import {
    MedicalEquipment,
    CreateEquipmentInput,
    UpdateEquipmentInput,
    PaginatedEquipments
} from '../../models/Facility Management/medical-equipment.model';

export class MedicalEquipmentRepository {
    /**
     * Lấy danh sách thiết bị y tế có phân trang, tìm kiếm, lọc
     */
    static async getEquipments(
        facilityId?: string,
        branchId?: string,
        roomId?: string,
        status?: string,
        search?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedEquipments> {
        const conditions: string[] = ['e.deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (facilityId) {
            conditions.push(`e.facility_id = $${paramIdx}`);
            params.push(facilityId);
            paramIdx++;
        }

        if (branchId) {
            conditions.push(`e.branch_id = $${paramIdx}`);
            params.push(branchId);
            paramIdx++;
        }

        if (roomId) {
            conditions.push(`e.current_room_id = $${paramIdx}`);
            params.push(roomId);
            paramIdx++;
        }

        if (status) {
            conditions.push(`e.status = $${paramIdx}`);
            params.push(status);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(e.code ILIKE $${paramIdx} OR e.name ILIKE $${paramIdx} OR e.serial_number ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*)
            FROM medical_equipments e
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                e.equipment_id, e.facility_id, e.branch_id,
                e.code, e.name, e.serial_number, e.manufacturer,
                e.manufacturing_date, e.purchase_date, e.warranty_expiration,
                e.status, e.current_room_id,
                e.created_at, e.updated_at,
                b.name AS branch_name,
                r.name AS room_name,
                r.code AS room_code,
                f.name AS facility_name
            FROM medical_equipments e
            LEFT JOIN branches b ON e.branch_id = b.branches_id
            LEFT JOIN medical_rooms r ON e.current_room_id = r.medical_rooms_id
            LEFT JOIN facilities f ON e.facility_id = f.facilities_id
            ${whereClause}
            ORDER BY e.created_at DESC
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
     * Lấy chi tiết thiết bị theo ID (JOIN thông tin phòng, chi nhánh)
     */
    static async getEquipmentById(id: string): Promise<MedicalEquipment | null> {
        const query = `
            SELECT
                e.*,
                b.name AS branch_name,
                r.name AS room_name,
                r.code AS room_code,
                f.name AS facility_name
            FROM medical_equipments e
            LEFT JOIN branches b ON e.branch_id = b.branches_id
            LEFT JOIN medical_rooms r ON e.current_room_id = r.medical_rooms_id
            LEFT JOIN facilities f ON e.facility_id = f.facilities_id
            WHERE e.equipment_id = $1 AND e.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra mã tài sản đã tồn tại chưa (dùng cho validate khi tạo mới)
     */
    static async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM medical_equipments WHERE code = $1 AND deleted_at IS NULL`;
        const params: any[] = [code];
        if (excludeId) {
            query += ` AND equipment_id != $2`;
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra cơ sở có tồn tại không
     */
    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facilities WHERE facilities_id = $1`;
        const result = await pool.query(query, [facilityId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra chi nhánh có tồn tại và thuộc cơ sở đã chọn không
     */
    static async checkBranchBelongsToFacility(branchId: string, facilityId: string): Promise<boolean> {
        const query = `SELECT 1 FROM branches WHERE branches_id = $1 AND facility_id = $2`;
        const result = await pool.query(query, [branchId, facilityId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra phòng có tồn tại và thuộc cùng chi nhánh với thiết bị không
     */
    static async checkRoomBelongsToBranch(roomId: string, branchId: string): Promise<boolean> {
        const query = `SELECT 1 FROM medical_rooms WHERE medical_rooms_id = $1 AND branch_id = $2 AND deleted_at IS NULL`;
        const result = await pool.query(query, [roomId, branchId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo mới thiết bị y tế
     */
    static async createEquipment(id: string, input: CreateEquipmentInput): Promise<MedicalEquipment> {
        const query = `
            INSERT INTO medical_equipments (
                equipment_id, facility_id, branch_id, code, name,
                serial_number, manufacturer, manufacturing_date,
                purchase_date, warranty_expiration, status, current_room_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        await pool.query(query, [
            id,
            input.facility_id,
            input.branch_id,
            input.code,
            input.name,
            input.serial_number ?? null,
            input.manufacturer ?? null,
            input.manufacturing_date ?? null,
            input.purchase_date ?? null,
            input.warranty_expiration ?? null,
            input.status ?? 'ACTIVE',
            input.current_room_id ?? null,
        ]);
        return (await this.getEquipmentById(id)) as MedicalEquipment;
    }

    /**
     * Cập nhật thông tin thiết bị (chỉ các trường thông tin cơ bản)
     */
    static async updateEquipment(id: string, input: UpdateEquipmentInput): Promise<MedicalEquipment> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const updateFields: (keyof UpdateEquipmentInput)[] = [
            'name', 'serial_number', 'manufacturer',
            'manufacturing_date', 'purchase_date', 'warranty_expiration'
        ];

        updateFields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        if (updates.length === 0) {
            return (await this.getEquipmentById(id)) as MedicalEquipment;
        }

        updates.push(`updated_at = NOW()`);

        const query = `
            UPDATE medical_equipments
            SET ${updates.join(', ')}
            WHERE equipment_id = $1 AND deleted_at IS NULL
        `;
        await pool.query(query, params);
        return (await this.getEquipmentById(id)) as MedicalEquipment;
    }

    /**
     * Cập nhật trạng thái thiết bị
     */
    static async updateStatus(id: string, status: string): Promise<MedicalEquipment> {
        const query = `
            UPDATE medical_equipments
            SET status = $2, updated_at = NOW()
            WHERE equipment_id = $1 AND deleted_at IS NULL
        `;
        await pool.query(query, [id, status]);
        return (await this.getEquipmentById(id)) as MedicalEquipment;
    }

    /**
     * Gán / thu hồi phòng cho thiết bị
     */
    static async assignRoom(id: string, roomId: string | null): Promise<MedicalEquipment> {
        const query = `
            UPDATE medical_equipments
            SET current_room_id = $2, updated_at = NOW()
            WHERE equipment_id = $1 AND deleted_at IS NULL
        `;
        await pool.query(query, [id, roomId]);
        return (await this.getEquipmentById(id)) as MedicalEquipment;
    }

    /**
     * Soft delete thiết bị
     */
    static async softDeleteEquipment(id: string): Promise<void> {
        const query = `
            UPDATE medical_equipments
            SET deleted_at = NOW()
            WHERE equipment_id = $1
        `;
        await pool.query(query, [id]);
    }
}
