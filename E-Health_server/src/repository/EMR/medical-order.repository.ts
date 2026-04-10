import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
    MedicalOrderRecord,
    CreateOrderInput,
    UpdateOrderInput,
    OrderResultRecord,
    CreateOrderResultInput,
    UpdateOrderResultInput,
    ServiceSearchResult,
    OrderSummaryItem,
} from '../../models/EMR/medical-order.model';
import { ORDER_CONFIG } from '../../constants/medical-order.constant';

type QueryExecutor = Pool | PoolClient;

/**
 * Tạo ID chỉ định: ORD_yymmdd_uuid
 */
function generateOrderId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `ORD_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/**
 * Tạo ID kết quả: RES_yymmdd_uuid
 */
function generateResultId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `RES_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class MedicalOrderRepository {

    // Chỉ định (Medical Orders)

    /**
     * Tạo chỉ định CLS mới
     */
    static async create(
        encounterId: string,
        data: CreateOrderInput & { service_name: string; service_id: string | null },
        orderedBy: string,
        client: QueryExecutor = pool
    ): Promise<MedicalOrderRecord> {
        const id = generateOrderId();
        const result = await client.query(
            `INSERT INTO medical_orders (
                medical_orders_id, encounter_id,
                service_code, service_name, service_id,
                order_type, clinical_indicator, priority,
                status, notes, ordered_by, ordered_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, encounterId,
                data.service_code, data.service_name, data.service_id || null,
                data.order_type,
                data.clinical_indicator || null,
                data.priority || 'ROUTINE',
                data.notes || null,
                orderedBy,
            ]
        );
        return result.rows[0];
    }

    /**
     * Lấy danh sách chỉ định theo encounter_id
     */
    static async findByEncounterId(encounterId: string): Promise<MedicalOrderRecord[]> {
        const result = await pool.query(
            `SELECT mo.*,
                    up.full_name AS orderer_name
             FROM medical_orders mo
             LEFT JOIN user_profiles up ON up.user_id = mo.ordered_by
             WHERE mo.encounter_id = $1
             ORDER BY mo.ordered_at DESC`,
            [encounterId]
        );
        return result.rows;
    }

    /**
     * Chi tiết 1 chỉ định kèm kết quả (nếu có)
     */
    static async findById(orderId: string): Promise<MedicalOrderRecord | null> {
        const result = await pool.query(
            `SELECT mo.*,
                    up.full_name AS orderer_name,
                    e.patient_id,
                    p.full_name AS patient_name,
                    upd.full_name AS doctor_name
             FROM medical_orders mo
             LEFT JOIN user_profiles up ON up.user_id = mo.ordered_by
             LEFT JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles upd ON upd.user_id = d.user_id
             WHERE mo.medical_orders_id = $1`,
            [orderId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật chỉ định (notes, priority, clinical_indicator)
     */
    static async update(orderId: string, data: UpdateOrderInput): Promise<MedicalOrderRecord | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.clinical_indicator !== undefined) {
            setClauses.push(`clinical_indicator = $${paramIndex++}`);
            values.push(data.clinical_indicator);
        }
        if (data.priority !== undefined) {
            setClauses.push(`priority = $${paramIndex++}`);
            values.push(data.priority);
        }
        if (data.notes !== undefined) {
            setClauses.push(`notes = $${paramIndex++}`);
            values.push(data.notes);
        }

        if (values.length === 0) return this.findById(orderId);

        values.push(orderId);
        const result = await pool.query(
            `UPDATE medical_orders SET ${setClauses.join(', ')} WHERE medical_orders_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật trạng thái chỉ định
     */
    static async updateStatus(orderId: string, newStatus: string, cancelledReason?: string, client: QueryExecutor = pool): Promise<MedicalOrderRecord | null> {
        const extra = cancelledReason ? `, cancelled_reason = '${cancelledReason.replace(/'/g, "''")}'` : '';
        const result = await client.query(
            `UPDATE medical_orders SET status = $1, updated_at = CURRENT_TIMESTAMP ${extra} WHERE medical_orders_id = $2 RETURNING *`,
            [newStatus, orderId]
        );
        return result.rows[0] || null;
    }

    /**
     * Đếm số chỉ định chưa hoàn tất (PENDING + IN_PROGRESS) trong encounter
     */
    static async countPendingByEncounterId(encounterId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM medical_orders
             WHERE encounter_id = $1 AND status IN ('PENDING', 'IN_PROGRESS')`,
            [encounterId]
        );
        return result.rows[0].total;
    }

    // Kết quả (Medical Order Results)

    /**
     * Tạo kết quả CLS
     */
    static async createResult(orderId: string, data: CreateOrderResultInput, performedBy: string, client: QueryExecutor = pool): Promise<OrderResultRecord> {
        const id = generateResultId();
        const result = await client.query(
            `INSERT INTO medical_order_results (
                medical_order_results_id, order_id,
                result_summary, result_details, attachment_urls,
                performed_by, performed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, orderId,
                data.result_summary,
                data.result_details ? JSON.stringify(data.result_details) : null,
                data.attachment_urls ? JSON.stringify(data.attachment_urls) : null,
                performedBy,
            ]
        );
        return result.rows[0];
    }

    /**
     * Lấy kết quả theo order_id
     */
    static async findResultByOrderId(orderId: string): Promise<OrderResultRecord | null> {
        const result = await pool.query(
            `SELECT mor.*,
                    up.full_name AS performer_name
             FROM medical_order_results mor
             LEFT JOIN user_profiles up ON up.user_id = mor.performed_by
             WHERE mor.order_id = $1`,
            [orderId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật kết quả CLS
     */
    static async updateResult(orderId: string, data: UpdateOrderResultInput): Promise<OrderResultRecord | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.result_summary !== undefined) {
            setClauses.push(`result_summary = $${paramIndex++}`);
            values.push(data.result_summary);
        }
        if (data.result_details !== undefined) {
            setClauses.push(`result_details = $${paramIndex++}`);
            values.push(JSON.stringify(data.result_details));
        }
        if (data.attachment_urls !== undefined) {
            setClauses.push(`attachment_urls = $${paramIndex++}`);
            values.push(JSON.stringify(data.attachment_urls));
        }

        if (values.length === 0) return this.findResultByOrderId(orderId);

        values.push(orderId);
        const result = await pool.query(
            `UPDATE medical_order_results SET ${setClauses.join(', ')} WHERE order_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    // Truy vấn nâng cao

    /**
     * Lịch sử chỉ định theo bệnh nhân (phân trang + filter)
     */
    static async findByPatientId(
        patientId: string,
        page: number,
        limit: number,
        orderType?: string,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: MedicalOrderRecord[]; total: number }> {
        const conditions: string[] = ['e.patient_id = $1'];
        const values: any[] = [patientId];
        let paramIndex = 2;

        if (orderType) {
            conditions.push(`mo.order_type = $${paramIndex++}`);
            values.push(orderType);
        }
        if (status) {
            conditions.push(`mo.status = $${paramIndex++}`);
            values.push(status);
        }
        if (fromDate) {
            conditions.push(`mo.ordered_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`mo.ordered_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT mo.*,
                    up.full_name AS orderer_name,
                    p.full_name AS patient_name,
                    e.patient_id
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN user_profiles up ON up.user_id = mo.ordered_by
             WHERE ${whereClause}
             ORDER BY mo.ordered_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Dashboard: chỉ định đang chờ thực hiện (filter status, order_type, priority)
     */
    static async findPending(
        status: string = 'PENDING',
        orderType?: string,
        priority?: string,
        page: number = 1,
        limit: number = ORDER_CONFIG.DEFAULT_LIMIT
    ): Promise<{ data: MedicalOrderRecord[]; total: number }> {
        const conditions: string[] = ['mo.status = $1'];
        const values: any[] = [status];
        let paramIndex = 2;

        if (orderType) {
            conditions.push(`mo.order_type = $${paramIndex++}`);
            values.push(orderType);
        }
        if (priority) {
            conditions.push(`mo.priority = $${paramIndex++}`);
            values.push(priority);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM medical_orders mo WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT mo.*,
                    up.full_name AS orderer_name,
                    p.full_name AS patient_name,
                    e.patient_id,
                    upd.full_name AS doctor_name
             FROM medical_orders mo
             LEFT JOIN user_profiles up ON up.user_id = mo.ordered_by
             LEFT JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles upd ON upd.user_id = d.user_id
             WHERE ${whereClause}
             ORDER BY
                CASE WHEN mo.priority = 'URGENT' THEN 0 ELSE 1 END,
                mo.ordered_at ASC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Tìm kiếm dịch vụ CLS trong bảng services
     */
    static async searchServices(query: string, serviceType?: string, limit: number = ORDER_CONFIG.SERVICE_SEARCH_LIMIT): Promise<ServiceSearchResult[]> {
        const conditions: string[] = ['is_active = TRUE'];
        const values: any[] = [];
        let paramIndex = 1;

        if (query) {
            conditions.push(`(LOWER(code) LIKE LOWER($${paramIndex}) OR LOWER(name) LIKE LOWER($${paramIndex}))`);
            values.push(`%${query}%`);
            paramIndex++;
        }

        if (serviceType) {
            conditions.push(`service_type = $${paramIndex++}`);
            values.push(serviceType);
        }

        values.push(limit);
        const result = await pool.query(
            `SELECT services_id, code, name, service_group, service_type, description
             FROM services
             WHERE ${conditions.join(' AND ')}
             ORDER BY service_group, name
             LIMIT $${paramIndex}`,
            values
        );
        return result.rows;
    }

    /**
     * Tóm tắt chỉ định + kết quả cho encounter (cho BS review)
     */
    static async getSummary(encounterId: string): Promise<OrderSummaryItem[]> {
        const result = await pool.query(
            `SELECT mo.medical_orders_id, mo.service_code, mo.service_name,
                    mo.order_type, mo.priority, mo.status, mo.ordered_at,
                    mor.result_summary, mor.performed_at
             FROM medical_orders mo
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             WHERE mo.encounter_id = $1
             ORDER BY mo.ordered_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    //  Validation helpers

    /**
     * Kiểm tra encounter tồn tại và trả về status
     */
    static async getEncounterStatus(encounterId: string): Promise<{ exists: boolean; status: string | null }> {
        const result = await pool.query(
            `SELECT status FROM encounters WHERE encounters_id = $1`,
            [encounterId]
        );
        if (result.rows.length === 0) return { exists: false, status: null };
        return { exists: true, status: result.rows[0].status };
    }

    /**
     * Validate service_code tồn tại và active
     */
    static async findServiceByCode(serviceCode: string): Promise<{ services_id: string; code: string; name: string; service_type: string } | null> {
        const result = await pool.query(
            `SELECT services_id, code, name, service_type
             FROM services
             WHERE code = $1 AND is_active = TRUE AND deleted_at IS NULL`,
            [serviceCode]
        );
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra bệnh nhân tồn tại
     */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id::text = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    /**
     * Cập nhật encounter status (dùng khi auto chuyển WAITING_FOR_RESULTS)
     */
    static async updateEncounterStatus(encounterId: string, newStatus: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE encounters SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE encounters_id = $2`,
            [newStatus, encounterId]
        );
    }
}
