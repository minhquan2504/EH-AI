import { pool } from '../../config/postgresdb';
import {
    FacilityService,
    CreateFacilityServiceInput,
    UpdateFacilityServiceInput,
    PaginatedFacilityServices
} from '../../models/Facility Management/facility-service.model';

export class FacilityServiceRepository {
    /**
     * Lấy danh sách dịch vụ tại cơ sở (Dành cho Admin/Manager)
     */
    static async getFacilityServices(
        facilityId: string,
        departmentId?: string,
        search?: string,
        isActive?: boolean,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedFacilityServices> {
        const conditions: string[] = ['fs.facility_id = $1'];
        const params: any[] = [facilityId];
        let paramIdx = 2;

        if (departmentId) {
            conditions.push(`fs.department_id = $${paramIdx}`);
            params.push(departmentId);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`fs.is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        conditions.push(`s.deleted_at IS NULL`);

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*) 
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT 
                fs.facility_services_id,
                fs.facility_id,
                fs.service_id,
                fs.department_id,
                fs.base_price,
                fs.insurance_price,
                fs.vip_price,
                fs.estimated_duration_minutes,
                fs.is_active,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            ${whereClause}
            ORDER BY s.name ASC
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
     * Lấy danh sách dịch vụ ACTIVE theo Khoa/Phòng (Dùng cho Bác sĩ chọn khi Chỉ định)
     */
    static async getActiveFacilityServices(
        facilityId: string,
        departmentId?: string,
        search?: string
    ): Promise<FacilityService[]> {
        const conditions: string[] = [
            'fs.facility_id = $1',
            'fs.is_active = TRUE',
            's.is_active = TRUE',
            's.deleted_at IS NULL'
        ];
        const params: any[] = [facilityId];
        let paramIdx = 2;

        if (departmentId) {
            conditions.push(`fs.department_id = $${paramIdx}`);
            params.push(departmentId);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const query = `
            SELECT 
                fs.facility_services_id,
                fs.facility_id,
                fs.service_id,
                fs.department_id,
                fs.base_price,
                fs.insurance_price,
                fs.vip_price,
                fs.estimated_duration_minutes,
                fs.is_active,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            ${whereClause}
            ORDER BY s.name ASC
            LIMIT 50
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy thông tin 1 dịch vụ cơ sở theo ID
     */
    static async getFacilityServiceById(id: string): Promise<FacilityService | null> {
        const query = `
            SELECT 
                fs.*,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            WHERE fs.facility_services_id = $1 AND s.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ dịch vụ của cơ sở (dùng cho Export)
     */
    static async getAllFacilityServices(facilityId: string): Promise<FacilityService[]> {
        const query = `
            SELECT 
                fs.*,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            WHERE fs.facility_id = $1 AND s.deleted_at IS NULL
            ORDER BY s.name ASC
        `;
        const result = await pool.query(query, [facilityId]);
        return result.rows;
    }

    /**
     * Upsert cấu hình dịch vụ cơ sở (dùng cho Import)
     */
    static async upsertFacilityService(id: string, input: CreateFacilityServiceInput): Promise<FacilityService> {
        const checkQuery = `SELECT facility_services_id FROM facility_services WHERE facility_id = $1 AND service_id = $2`;
        const checkResult = await pool.query(checkQuery, [input.facility_id, input.service_id]);

        if (checkResult.rowCount && checkResult.rowCount > 0) {
            const existingId = checkResult.rows[0].facility_services_id;
            const updateQuery = `
                UPDATE facility_services 
                SET department_id = $2, base_price = $3, insurance_price = $4, 
                    vip_price = $5, estimated_duration_minutes = $6, is_active = $7
                WHERE facility_services_id = $1
            `;
            await pool.query(updateQuery, [
                existingId, input.department_id ?? null, input.base_price,
                input.insurance_price ?? null, input.vip_price ?? 0,
                input.estimated_duration_minutes ?? 15, input.is_active ?? true
            ]);
            return (await this.getFacilityServiceById(existingId)) as FacilityService;
        } else {
            const insertQuery = `
                INSERT INTO facility_services (
                    facility_services_id, facility_id, service_id, department_id, 
                    base_price, insurance_price, vip_price, estimated_duration_minutes, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            await pool.query(insertQuery, [
                id, input.facility_id, input.service_id, input.department_id ?? null,
                input.base_price, input.insurance_price ?? null, input.vip_price ?? 0,
                input.estimated_duration_minutes ?? 15, input.is_active ?? true
            ]);
            return (await this.getFacilityServiceById(id)) as FacilityService;
        }
    }

    /**
     * Kiểm tra xem cơ sở đã map dịch vụ này chưa
     */
    static async checkFacilityServiceExists(facilityId: string, serviceId: string): Promise<boolean> {
        const query = `
            SELECT 1 
            FROM facility_services 
            WHERE facility_id = $1 AND service_id = $2
        `;
        const result = await pool.query(query, [facilityId, serviceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Cấu hình dịch vụ mới cho cơ sở
     */
    static async createFacilityService(id: string, input: CreateFacilityServiceInput): Promise<FacilityService> {
        const query = `
            INSERT INTO facility_services (
                facility_services_id, 
                facility_id, 
                service_id, 
                department_id, 
                base_price, 
                insurance_price, 
                vip_price,
                estimated_duration_minutes, 
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.facility_id,
            input.service_id,
            input.department_id ?? null,
            input.base_price,
            input.insurance_price ?? null,
            input.vip_price ?? 0,
            input.estimated_duration_minutes ?? 15,
            input.is_active ?? true
        ]);

        return (await this.getFacilityServiceById(id)) as FacilityService;
    }

    /**
     * Cập nhật cấu hình dịch vụ cơ sở
     */
    static async updateFacilityService(id: string, input: UpdateFacilityServiceInput): Promise<FacilityService> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const updateFields: (keyof UpdateFacilityServiceInput)[] = [
            'department_id',
            'base_price',
            'insurance_price',
            'vip_price',
            'estimated_duration_minutes',
            'is_active'
        ];

        updateFields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            } else if (input[field] === null && field === 'department_id') {
                updates.push(`${field} = NULL`);
            }
        });

        if (updates.length === 0) {
            return (await this.getFacilityServiceById(id)) as FacilityService;
        }

        const query = `
            UPDATE facility_services
            SET ${updates.join(', ')}
            WHERE facility_services_id = $1
            RETURNING *
        `;

        await pool.query(query, params);

        return (await this.getFacilityServiceById(id)) as FacilityService;
    }

    /**
     * Tắt/Bật dịch vụ tại cơ sở
     */
    static async toggleFacilityServiceStatus(id: string, is_active: boolean): Promise<FacilityService> {
        const query = `
            UPDATE facility_services
            SET is_active = $2
            WHERE facility_services_id = $1
            RETURNING *
        `;
        await pool.query(query, [id, is_active]);
        return (await this.getFacilityServiceById(id)) as FacilityService;
    }

    /**
     * Kiểm tra cơ sở có tồn tại trong hệ thống hay không
     */
    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facilities WHERE facilities_id = $1`;
        const result = await pool.query(query, [facilityId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra khoa/phòng có thuộc về cơ sở được chỉ định hay không
     */
    static async checkDepartmentBelongsToFacility(departmentId: string, facilityId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM departments d
            JOIN branches b ON d.branch_id = b.branches_id
            WHERE d.departments_id = $1 AND b.facility_id = $2
        `;
        const result = await pool.query(query, [departmentId, facilityId]);
        return (result.rowCount ?? 0) > 0;
    }
}
