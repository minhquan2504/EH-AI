import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Encounter, EncounterFilter } from '../../models/EMR/encounter.model';
import { ENCOUNTER_CONFIG } from '../../constants/encounter.constant';

/** Type cho query executor — dùng chung cho pool và client trong transaction */
type QueryExecutor = Pool | PoolClient;

/**
 * Tạo ID encounter theo format: ENC_yymmdd_uuid
 */
function generateEncounterId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `ENC_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class EncounterRepository {

    /**
     * Tạo bản ghi encounter mới
     */
    static async create(data: {
        appointment_id?: string | null;
        patient_id: string;
        doctor_id: string;
        room_id: string;
        encounter_type: string;
        visit_number: number;
        notes?: string | null;
    }, client: QueryExecutor = pool): Promise<Encounter> {
        const id = generateEncounterId();
        const result = await client.query(
            `INSERT INTO encounters (
                encounters_id, appointment_id, patient_id, doctor_id, room_id,
                encounter_type, start_time, status, visit_number, notes,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'IN_PROGRESS', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id,
                data.appointment_id || null,
                data.patient_id,
                data.doctor_id,
                data.room_id,
                data.encounter_type,
                data.visit_number,
                data.notes || null,
            ]
        );
        return result.rows[0];
    }

    /**
     * Tìm encounter theo ID (kèm thông tin join)
     */
    static async findById(encounterId: string): Promise<Encounter | null> {
        const result = await pool.query(
            `SELECT 
                e.*,
                p.full_name AS patient_name,
                p.patient_code,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                sp.name AS specialty_name,
                mr.name AS room_name,
                mr.code AS room_code,
                a.appointment_code
            FROM encounters e
            LEFT JOIN patients p ON p.id::text = e.patient_id
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN users u ON u.users_id = d.user_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN specialties sp ON sp.specialties_id = d.specialty_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN appointments a ON a.appointments_id = e.appointment_id
            WHERE e.encounters_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Tìm encounter theo appointment_id
     */
    static async findByAppointmentId(appointmentId: string): Promise<Encounter | null> {
        const result = await pool.query(
            `SELECT 
                e.*,
                p.full_name AS patient_name,
                p.patient_code,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                mr.name AS room_name,
                a.appointment_code
            FROM encounters e
            LEFT JOIN patients p ON p.id::text = e.patient_id
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN appointments a ON a.appointments_id = e.appointment_id
            WHERE e.appointment_id = $1`,
            [appointmentId]
        );
        return result.rows[0] || null;
    }

    /**
     * Đếm số encounter đã tạo cho 1 appointment (kiểm tra 1:1)
     */
    static async countByAppointmentId(appointmentId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM encounters WHERE appointment_id = $1`,
            [appointmentId]
        );
        return result.rows[0].total;
    }

    /**
     * Đếm số encounter trước đó của bệnh nhân (để xác định visit_number)
     */
    static async getVisitNumber(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM encounters WHERE patient_id = $1`,
            [patientId]
        );
        return result.rows[0].total + 1;
    }

    /**
     * Kiểm tra bệnh nhân đã từng khám chưa (để auto-detect FIRST_VISIT / FOLLOW_UP)
     */
    static async hasExistingEncounters(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM encounters WHERE patient_id = $1) AS has_encounters`,
            [patientId]
        );
        return result.rows[0].has_encounters;
    }

    /**
     * Danh sách encounters có filter + phân trang
     */
    static async findAll(filter: EncounterFilter): Promise<{ data: Encounter[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (filter.patient_id) {
            conditions.push(`e.patient_id = $${paramIndex++}`);
            values.push(filter.patient_id);
        }
        if (filter.doctor_id) {
            conditions.push(`e.doctor_id = $${paramIndex++}`);
            values.push(filter.doctor_id);
        }
        if (filter.room_id) {
            conditions.push(`e.room_id = $${paramIndex++}`);
            values.push(filter.room_id);
        }
        if (filter.encounter_type) {
            conditions.push(`e.encounter_type = $${paramIndex++}`);
            values.push(filter.encounter_type);
        }
        if (filter.status) {
            conditions.push(`e.status = $${paramIndex++}`);
            values.push(filter.status);
        }
        if (filter.from_date) {
            conditions.push(`e.start_time >= $${paramIndex++}`);
            values.push(filter.from_date);
        }
        if (filter.to_date) {
            conditions.push(`e.start_time <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(filter.to_date);
        }
        if (filter.keyword) {
            conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.patient_code ILIKE $${paramIndex} OR up.full_name ILIKE $${paramIndex})`);
            values.push(`%${filter.keyword}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (filter.page - 1) * filter.limit;

        const countQuery = `SELECT COUNT(*)::int AS total FROM encounters e
            LEFT JOIN patients p ON p.id::text = e.patient_id
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            ${whereClause}`;

        const dataQuery = `SELECT 
                e.*,
                p.full_name AS patient_name,
                p.patient_code,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                sp.name AS specialty_name,
                mr.name AS room_name,
                mr.code AS room_code,
                a.appointment_code
            FROM encounters e
            LEFT JOIN patients p ON p.id::text = e.patient_id
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN users u ON u.users_id = d.user_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN specialties sp ON sp.specialties_id = d.specialty_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN appointments a ON a.appointments_id = e.appointment_id
            ${whereClause}
            ORDER BY e.start_time DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

        const countValues = [...values];
        values.push(filter.limit, offset);

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, countValues),
            pool.query(dataQuery, values),
        ]);

        return {
            data: dataResult.rows,
            total: countResult.rows[0].total,
        };
    }

    /**
     * Lấy danh sách encounter theo patient_id
     */
    static async findByPatientId(
        patientId: string,
        page: number = ENCOUNTER_CONFIG.DEFAULT_PAGE,
        limit: number = ENCOUNTER_CONFIG.DEFAULT_LIMIT
    ): Promise<{ data: Encounter[]; total: number }> {
        return this.findAll({ patient_id: patientId, page, limit });
    }

    /**
     * Lấy danh sách encounter đang hoạt động (IN_PROGRESS + WAITING_FOR_RESULTS)
     */
    static async findActive(branchId?: string): Promise<Encounter[]> {
        const conditions = [`e.status IN ('IN_PROGRESS', 'WAITING_FOR_RESULTS')`];
        const values: any[] = [];

        if (branchId) {
            conditions.push(`mr.branch_id = $1`);
            values.push(branchId);
        }

        const result = await pool.query(
            `SELECT 
                e.*,
                p.full_name AS patient_name,
                p.patient_code,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                mr.name AS room_name,
                mr.code AS room_code,
                a.appointment_code
            FROM encounters e
            LEFT JOIN patients p ON p.id::text = e.patient_id
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN appointments a ON a.appointments_id = e.appointment_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY e.start_time ASC`,
            values
        );
        return result.rows;
    }

    /**
     * Cập nhật encounter_type, notes
     */
    static async update(encounterId: string, data: {
        encounter_type?: string;
        notes?: string;
    }): Promise<Encounter | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.encounter_type !== undefined) {
            setClauses.push(`encounter_type = $${paramIndex++}`);
            values.push(data.encounter_type);
        }
        if (data.notes !== undefined) {
            setClauses.push(`notes = $${paramIndex++}`);
            values.push(data.notes);
        }

        values.push(encounterId);

        const result = await pool.query(
            `UPDATE encounters SET ${setClauses.join(', ')} WHERE encounters_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật bác sĩ phụ trách
     */
    static async updateDoctor(encounterId: string, doctorId: string, client: QueryExecutor = pool): Promise<Encounter | null> {
        const result = await client.query(
            `UPDATE encounters SET doctor_id = $1, updated_at = CURRENT_TIMESTAMP WHERE encounters_id = $2 RETURNING *`,
            [doctorId, encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật phòng khám
     */
    static async updateRoom(encounterId: string, roomId: string, client: QueryExecutor = pool): Promise<Encounter | null> {
        const result = await client.query(
            `UPDATE encounters SET room_id = $1, updated_at = CURRENT_TIMESTAMP WHERE encounters_id = $2 RETURNING *`,
            [roomId, encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật trạng thái encounter
     */
    static async updateStatus(encounterId: string, newStatus: string, client: QueryExecutor = pool): Promise<Encounter | null> {
        const endTime = (newStatus === 'COMPLETED' || newStatus === 'CLOSED')
            ? ', end_time = CURRENT_TIMESTAMP'
            : '';

        const result = await client.query(
            `UPDATE encounters SET status = $1, updated_at = CURRENT_TIMESTAMP ${endTime} WHERE encounters_id = $2 RETURNING *`,
            [newStatus, encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Tìm encounter đang active từ appointment_id (dùng khi completeExam)
     */
    static async findActiveByAppointmentId(appointmentId: string): Promise<Encounter | null> {
        const result = await pool.query(
            `SELECT * FROM encounters 
             WHERE appointment_id = $1 AND status IN ('IN_PROGRESS', 'WAITING_FOR_RESULTS')
             LIMIT 1`,
            [appointmentId]
        );
        return result.rows[0] || null;
    }

    /**
     * Tìm encounter đang active của 1 bệnh nhân (tránh tạo trùng walk-in)
     */
    static async findActiveByPatientId(patientId: string): Promise<Encounter | null> {
        const result = await pool.query(
            `SELECT * FROM encounters 
             WHERE patient_id = $1 AND status IN ('IN_PROGRESS', 'WAITING_FOR_RESULTS')
             LIMIT 1`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    // ─── Validation helpers (cho Service gọi thay vì truy vấn trực tiếp) ───

    /**
     * Kiểm tra bệnh nhân tồn tại và chưa bị xóa
     */
    static async findPatientById(patientId: string): Promise<{ id: string; full_name: string } | null> {
        const result = await pool.query(
            `SELECT id, full_name FROM patients WHERE id::text = $1 AND deleted_at IS NULL`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra bác sĩ tồn tại và trạng thái hoạt động
     */
    static async findDoctorById(doctorId: string): Promise<{ doctors_id: string; is_active: boolean } | null> {
        const result = await pool.query(
            `SELECT d.doctors_id, d.is_active FROM doctors d WHERE d.doctors_id = $1`,
            [doctorId]
        );
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra phòng khám tồn tại và trạng thái
     */
    static async findRoomById(roomId: string): Promise<{ medical_rooms_id: string; room_status: string } | null> {
        const result = await pool.query(
            `SELECT medical_rooms_id, room_status FROM medical_rooms WHERE medical_rooms_id = $1`,
            [roomId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật trạng thái phòng khám (OCCUPIED / AVAILABLE)
     */
    static async updateRoomStatus(
        roomId: string,
        status: string,
        currentAppointmentId: string | null = null,
        client: QueryExecutor = pool
    ): Promise<void> {
        await client.query(
            `UPDATE medical_rooms SET room_status = $1, current_appointment_id = $2 WHERE medical_rooms_id = $3`,
            [status, currentAppointmentId, roomId]
        );
    }

    /**
     * Tìm appointment theo ID kèm thông tin bệnh nhân
     */
    static async findAppointmentById(appointmentId: string): Promise<any | null> {
        const result = await pool.query(
            `SELECT a.*, p.full_name AS patient_name 
             FROM appointments a 
             LEFT JOIN patients p ON p.id::text = a.patient_id 
             WHERE a.appointments_id = $1`,
            [appointmentId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật trạng thái appointment → IN_PROGRESS
     */
    static async updateAppointmentToInProgress(appointmentId: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE appointments SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE appointments_id = $1`,
            [appointmentId]
        );
    }

    /**
     * Cập nhật trạng thái appointment → COMPLETED
     */
    static async updateAppointmentToCompleted(appointmentId: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE appointments SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE appointments_id = $1 AND status = 'IN_PROGRESS'`,
            [appointmentId]
        );
    }
}
