import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    TimelineEvent,
    TimelineSummary,
    TrackConditionResult,
    CreateTimelineEventInput,
    TimelineFilters,
} from '../../models/EHR/health-timeline.model';
import { AUTO_EVENT_TYPE } from '../../constants/health-timeline.constant';

/**
 * Repository cho module Health Timeline (6.2)
 * Tổng hợp sự kiện y tế từ 11 bảng EMR bằng UNION ALL + events thủ công từ DB
 */
export class HealthTimelineRepository {

    // VALIDATION

    /** Kiểm tra bệnh nhân tồn tại */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    /** Kiểm tra encounter thuộc bệnh nhân */
    static async encounterBelongsToPatient(encounterId: string, patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM encounters WHERE encounters_id = $1 AND patient_id = $2) AS exists`,
            [encounterId, patientId]
        );
        return result.rows[0].exists;
    }

    // CTE: UNION ALL 11 BẢNG NGUỒN

    /**
     * CTE (Common Table Expression) gộp toàn bộ events tự động.
     * Mỗi SELECT trả về cùng schema: event_id, event_type, event_time, title, description, encounter_id, source_id, metadata
     */
    private static buildAutoEventsCTE(patientId: string, paramOffset: number): { cte: string; params: string[] } {
        const pid = `$${paramOffset}`;

        const cte = `
        auto_events AS (
            -- 1. ENCOUNTER_START
            SELECT
                e.encounters_id AS event_id,
                '${AUTO_EVENT_TYPE.ENCOUNTER_START}' AS event_type,
                e.start_time AS event_time,
                CONCAT('Bắt đầu khám - ', COALESCE(e.encounter_type, 'OUTPATIENT')) AS title,
                e.notes AS description,
                e.encounters_id AS encounter_id,
                e.encounters_id AS source_id,
                jsonb_build_object(
                    'encounter_type', e.encounter_type,
                    'status', e.status,
                    'doctor_name', COALESCE(up.full_name, 'N/A'),
                    'room_id', e.room_id
                ) AS metadata,
                NULL AS created_by,
                NULL AS created_by_name
            FROM encounters e
            LEFT JOIN user_profiles up ON e.doctor_id = up.user_id
            WHERE e.patient_id = ${pid}

            UNION ALL

            -- 2. ENCOUNTER_END
            SELECT
                CONCAT(e.encounters_id, '_END'),
                '${AUTO_EVENT_TYPE.ENCOUNTER_END}',
                e.end_time,
                CONCAT('Kết thúc khám - ', COALESCE(e.encounter_type, 'OUTPATIENT')),
                NULL,
                e.encounters_id,
                e.encounters_id,
                jsonb_build_object('status', e.status),
                NULL, NULL
            FROM encounters e
            WHERE e.patient_id = ${pid} AND e.end_time IS NOT NULL

            UNION ALL

            -- 3. VITALS_RECORDED
            SELECT
                ce.clinical_examinations_id,
                '${AUTO_EVENT_TYPE.VITALS_RECORDED}',
                ce.created_at,
                'Ghi nhận sinh hiệu',
                NULL,
                ce.encounter_id,
                ce.clinical_examinations_id,
                jsonb_build_object(
                    'pulse', ce.pulse,
                    'blood_pressure', CONCAT(ce.blood_pressure_systolic, '/', ce.blood_pressure_diastolic),
                    'temperature', ce.temperature,
                    'spo2', ce.spo2,
                    'bmi', ce.bmi
                ),
                NULL, NULL
            FROM clinical_examinations ce
            JOIN encounters e ON ce.encounter_id = e.encounters_id
            WHERE e.patient_id = ${pid}

            UNION ALL

            -- 4. DIAGNOSIS
            SELECT
                ed.encounter_diagnoses_id,
                '${AUTO_EVENT_TYPE.DIAGNOSIS}',
                ed.created_at,
                CONCAT('Chẩn đoán: ', ed.diagnosis_name),
                ed.notes,
                ed.encounter_id,
                ed.encounter_diagnoses_id,
                jsonb_build_object(
                    'icd10_code', ed.icd10_code,
                    'diagnosis_type', ed.diagnosis_type,
                    'diagnosed_by', ed.diagnosed_by
                ),
                NULL, NULL
            FROM encounter_diagnoses ed
            JOIN encounters e ON ed.encounter_id = e.encounters_id
            WHERE e.patient_id = ${pid}

            UNION ALL

            -- 5. LAB_ORDER
            SELECT
                mo.medical_orders_id,
                '${AUTO_EVENT_TYPE.LAB_ORDER}',
                mo.ordered_at,
                CONCAT('Chỉ định: ', mo.service_name),
                mo.clinical_indicator,
                mo.encounter_id,
                mo.medical_orders_id,
                jsonb_build_object(
                    'service_code', mo.service_code,
                    'priority', mo.priority,
                    'status', mo.status
                ),
                NULL, NULL
            FROM medical_orders mo
            JOIN encounters e ON mo.encounter_id = e.encounters_id
            WHERE e.patient_id = ${pid}

            UNION ALL

            -- 6. LAB_RESULT
            SELECT
                mor.medical_order_results_id,
                '${AUTO_EVENT_TYPE.LAB_RESULT}',
                mor.performed_at,
                CONCAT('Kết quả: ', mo.service_name),
                mor.result_summary,
                mo.encounter_id,
                mor.medical_order_results_id,
                jsonb_build_object(
                    'order_id', mor.order_id,
                    'result_summary', mor.result_summary
                ),
                NULL, NULL
            FROM medical_order_results mor
            JOIN medical_orders mo ON mor.order_id = mo.medical_orders_id
            JOIN encounters e ON mo.encounter_id = e.encounters_id
            WHERE e.patient_id = ${pid}

            UNION ALL

            -- 7. PRESCRIPTION
            SELECT
                p.prescriptions_id,
                '${AUTO_EVENT_TYPE.PRESCRIPTION}',
                p.prescribed_at,
                CONCAT('Đơn thuốc: ', p.prescription_code),
                p.doctor_notes,
                p.encounter_id,
                p.prescriptions_id,
                jsonb_build_object(
                    'prescription_code', p.prescription_code,
                    'status', p.status,
                    'clinical_diagnosis', p.clinical_diagnosis,
                    'drug_count', (SELECT COUNT(*) FROM prescription_details pd WHERE pd.prescription_id = p.prescriptions_id)
                ),
                NULL, NULL
            FROM prescriptions p
            WHERE p.patient_id = ${pid}

            UNION ALL

            -- 8. EMR_FINALIZED
            SELECT
                es.emr_record_snapshots_id,
                '${AUTO_EVENT_TYPE.EMR_FINALIZED}',
                es.finalized_at,
                CONCAT('Khóa bệnh án - ', es.record_type),
                es.notes,
                es.encounter_id,
                es.emr_record_snapshots_id,
                jsonb_build_object('record_type', es.record_type),
                NULL, NULL
            FROM emr_record_snapshots es
            WHERE es.patient_id = ${pid}

            UNION ALL

            -- 9. EMR_SIGNED
            SELECT
                sig.emr_signatures_id,
                '${AUTO_EVENT_TYPE.EMR_SIGNED}',
                sig.signed_at,
                'Ký số bệnh án',
                NULL,
                sig.encounter_id,
                sig.emr_signatures_id,
                jsonb_build_object(
                    'signed_by', sig.signed_by,
                    'signer_name', COALESCE(up.full_name, 'N/A')
                ),
                NULL, NULL
            FROM emr_signatures sig
            LEFT JOIN user_profiles up ON sig.signed_by = up.user_id
            WHERE sig.encounter_id IN (SELECT encounters_id FROM encounters WHERE patient_id = ${pid})

            UNION ALL

            -- 10. TREATMENT_PLAN
            SELECT
                tp.treatment_plans_id,
                '${AUTO_EVENT_TYPE.TREATMENT_PLAN}',
                tp.created_at,
                CONCAT('KHĐT: ', tp.title),
                tp.description,
                tp.created_encounter_id,
                tp.treatment_plans_id,
                jsonb_build_object(
                    'plan_code', tp.plan_code,
                    'status', tp.status,
                    'primary_diagnosis', tp.primary_diagnosis_name,
                    'icd10_code', tp.primary_diagnosis_code
                ),
                NULL, NULL
            FROM treatment_plans tp
            WHERE tp.patient_id = ${pid}

            UNION ALL

            -- 11. TREATMENT_NOTE
            SELECT
                tpn.treatment_progress_notes_id,
                '${AUTO_EVENT_TYPE.TREATMENT_NOTE}',
                tpn.created_at,
                COALESCE(tpn.title, CONCAT('Diễn tiến: ', tpn.note_type)),
                tpn.content,
                tpn.encounter_id,
                tpn.treatment_progress_notes_id,
                jsonb_build_object(
                    'note_type', tpn.note_type,
                    'severity', tpn.severity,
                    'plan_id', tpn.plan_id
                ),
                NULL, NULL
            FROM treatment_progress_notes tpn
            JOIN treatment_plans tp ON tpn.plan_id = tp.treatment_plans_id
            WHERE tp.patient_id = ${pid}
        )`;

        return { cte, params: [patientId] };
    }

    // TIMELINE

    /**
     * Lấy dòng thời gian hợp nhất: UNION ALL 11 bảng + events thủ công.
     * Hỗ trợ filter theo event_type, from_date, to_date và phân trang.
     */
    static async getUnifiedTimeline(patientId: string, filters: TimelineFilters): Promise<{ data: TimelineEvent[]; total: number }> {
        const { cte, params } = this.buildAutoEventsCTE(patientId, 1);
        // params = [$1 = patientId]

        let paramIdx = 2; // $2 trở đi

        // Manual events CTE
        const manualCTE = `
        manual_events AS (
            SELECT
                hte.event_id,
                hte.event_type,
                hte.event_time,
                hte.title,
                hte.description,
                NULL::varchar AS encounter_id,
                hte.event_id AS source_id,
                hte.metadata,
                hte.created_by,
                COALESCE(up.full_name, 'N/A') AS created_by_name
            FROM health_timeline_events hte
            LEFT JOIN user_profiles up ON hte.created_by = up.user_id
            WHERE hte.patient_id = $1 AND hte.deleted_at IS NULL
        )`;

        // Merge + filter
        const whereConditions: string[] = [];
        const extraParams: any[] = [];

        if (filters.event_type) {
            whereConditions.push(`event_type = $${paramIdx}`);
            extraParams.push(filters.event_type);
            paramIdx++;
        }
        if (filters.from_date) {
            whereConditions.push(`event_time >= $${paramIdx}::timestamptz`);
            extraParams.push(filters.from_date);
            paramIdx++;
        }
        if (filters.to_date) {
            whereConditions.push(`event_time <= $${paramIdx}::timestamptz`);
            extraParams.push(filters.to_date);
            paramIdx++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const offset = (filters.page - 1) * filters.limit;

        const fullQuery = `
            WITH ${cte},
            ${manualCTE},
            all_events AS (
                SELECT *, 'AUTO' AS source FROM auto_events
                UNION ALL
                SELECT *, 'MANUAL' AS source FROM manual_events
            )
            SELECT * FROM all_events
            ${whereClause}
            ORDER BY event_time DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;

        const countQuery = `
            WITH ${cte},
            ${manualCTE},
            all_events AS (
                SELECT event_type, event_time FROM auto_events
                UNION ALL
                SELECT event_type, event_time FROM manual_events
            )
            SELECT COUNT(*)::int AS total FROM all_events
            ${whereClause}
        `;

        const allParams = [...params, ...extraParams];

        const [dataResult, countResult] = await Promise.all([
            pool.query(fullQuery, [...allParams, filters.limit, offset]),
            pool.query(countQuery, allParams),
        ]);

        return {
            data: dataResult.rows,
            total: countResult.rows[0].total,
        };
    }

    // SUMMARY

    /** Thống kê tổng quan timeline */
    static async getTimelineSummary(patientId: string): Promise<TimelineSummary> {
        const { cte, params } = this.buildAutoEventsCTE(patientId, 1);

        const query = `
            WITH ${cte},
            manual_events AS (
                SELECT event_type, event_time
                FROM health_timeline_events
                WHERE patient_id = $1 AND deleted_at IS NULL
            ),
            all_events AS (
                SELECT event_type, event_time FROM auto_events
                UNION ALL
                SELECT event_type, event_time FROM manual_events
            )
            SELECT
                COUNT(*)::int AS total_events,
                MIN(event_time) AS first_event_date,
                MAX(event_time) AS last_event_date,
                jsonb_object_agg(et.event_type, et.cnt) AS events_by_type
            FROM all_events ae,
            LATERAL (
                SELECT event_type, COUNT(*)::int AS cnt
                FROM all_events
                GROUP BY event_type
            ) et
            WHERE FALSE -- dummy, chỉ dùng sub
        `;

        // Dùng query đơn giản hơn để tránh bug LATERAL
        const summaryQuery = `
            WITH ${cte},
            manual_events AS (
                SELECT event_type, event_time
                FROM health_timeline_events
                WHERE patient_id = $1 AND deleted_at IS NULL
            ),
            all_events AS (
                SELECT event_type, event_time FROM auto_events
                UNION ALL
                SELECT event_type, event_time FROM manual_events
            ),
            stats AS (
                SELECT
                    COUNT(*)::int AS total_events,
                    MIN(event_time) AS first_event_date,
                    MAX(event_time) AS last_event_date
                FROM all_events
            ),
            type_counts AS (
                SELECT event_type, COUNT(*)::int AS cnt
                FROM all_events
                GROUP BY event_type
            )
            SELECT
                s.total_events,
                s.first_event_date,
                s.last_event_date,
                COALESCE(jsonb_object_agg(tc.event_type, tc.cnt), '{}'::jsonb) AS events_by_type
            FROM stats s
            LEFT JOIN type_counts tc ON TRUE
            GROUP BY s.total_events, s.first_event_date, s.last_event_date
        `;

        const encounterCountQuery = `
            SELECT COUNT(*)::int AS total_encounters
            FROM encounters WHERE patient_id = $1
        `;

        const [summaryResult, encounterResult] = await Promise.all([
            pool.query(summaryQuery, params),
            pool.query(encounterCountQuery, [patientId]),
        ]);

        const row = summaryResult.rows[0] || {
            total_events: 0,
            first_event_date: null,
            last_event_date: null,
            events_by_type: {},
        };

        /** Tính số tháng theo dõi */
        let monitoringMonths = 0;
        if (row.first_event_date && row.last_event_date) {
            const first = new Date(row.first_event_date);
            const last = new Date(row.last_event_date);
            monitoringMonths = Math.max(
                1,
                Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 30))
            );
        }

        return {
            total_events: row.total_events,
            total_encounters: encounterResult.rows[0].total_encounters,
            first_event_date: row.first_event_date,
            last_event_date: row.last_event_date,
            monitoring_months: monitoringMonths,
            events_by_type: row.events_by_type || {},
        };
    }

    // BY ENCOUNTER

    /** Lấy events thuộc 1 encounter cụ thể */
    static async getEventsByEncounter(patientId: string, encounterId: string): Promise<TimelineEvent[]> {
        const { cte, params } = this.buildAutoEventsCTE(patientId, 1);

        const query = `
            WITH ${cte}
            SELECT *, 'AUTO' AS source FROM auto_events
            WHERE encounter_id = $2
            ORDER BY event_time ASC
        `;

        const result = await pool.query(query, [...params, encounterId]);
        return result.rows;
    }

    // TRACK CONDITION

    /**
     * Theo dõi tiến triển 1 bệnh theo mã ICD-10 xuyên suốt thời gian.
     * Lọc: chẩn đoán mã ICD-10 + đơn thuốc/CLS cùng encounter có chẩn đoán đó.
     */
    static async trackCondition(
        patientId: string,
        icd10Code: string,
        fromDate?: string,
        toDate?: string
    ): Promise<TrackConditionResult> {
        const params: any[] = [patientId, icd10Code];
        let paramIdx = 3;

        let dateFilter = '';
        if (fromDate) {
            dateFilter += ` AND event_time >= $${paramIdx}::timestamptz`;
            params.push(fromDate);
            paramIdx++;
        }
        if (toDate) {
            dateFilter += ` AND event_time <= $${paramIdx}::timestamptz`;
            params.push(toDate);
            paramIdx++;
        }

        // Lấy tên bệnh từ chẩn đoán đầu tiên
        const nameQuery = `
            SELECT diagnosis_name FROM encounter_diagnoses ed
            JOIN encounters e ON ed.encounter_id = e.encounters_id
            WHERE e.patient_id = $1 AND ed.icd10_code = $2
            LIMIT 1
        `;

        // Lấy các encounter chứa ICD-10 code này
        const relatedEncountersQuery = `
            SELECT DISTINCT ed.encounter_id
            FROM encounter_diagnoses ed
            JOIN encounters e ON ed.encounter_id = e.encounters_id
            WHERE e.patient_id = $1 AND ed.icd10_code = $2
        `;

        // Lấy events liên quan: chẩn đoán + mọi event cùng encounter
        const eventsQuery = `
            WITH target_encounters AS (${relatedEncountersQuery}),
            related AS (
                -- Chẩn đoán trùng mã ICD-10
                SELECT
                    ed.encounter_diagnoses_id AS event_id,
                    'DIAGNOSIS' AS event_type,
                    ed.created_at AS event_time,
                    CONCAT('Chẩn đoán: ', ed.diagnosis_name) AS title,
                    ed.notes AS description,
                    ed.encounter_id,
                    ed.encounter_diagnoses_id AS source_id,
                    jsonb_build_object('icd10_code', ed.icd10_code, 'diagnosis_type', ed.diagnosis_type) AS metadata,
                    NULL::varchar AS created_by,
                    NULL::varchar AS created_by_name,
                    'AUTO' AS source
                FROM encounter_diagnoses ed
                WHERE ed.encounter_id IN (SELECT encounter_id FROM target_encounters)
                  AND ed.icd10_code = $2

                UNION ALL

                -- Đơn thuốc cùng encounter
                SELECT
                    p.prescriptions_id,
                    'PRESCRIPTION',
                    p.prescribed_at,
                    CONCAT('Đơn thuốc: ', p.prescription_code),
                    p.doctor_notes,
                    p.encounter_id,
                    p.prescriptions_id,
                    jsonb_build_object('prescription_code', p.prescription_code, 'status', p.status),
                    NULL, NULL, 'AUTO'
                FROM prescriptions p
                WHERE p.encounter_id IN (SELECT encounter_id FROM target_encounters)

                UNION ALL

                -- Chỉ định CLS cùng encounter
                SELECT
                    mo.medical_orders_id,
                    'LAB_ORDER',
                    mo.ordered_at,
                    CONCAT('Chỉ định: ', mo.service_name),
                    mo.clinical_indicator,
                    mo.encounter_id,
                    mo.medical_orders_id,
                    jsonb_build_object('service_code', mo.service_code, 'status', mo.status),
                    NULL, NULL, 'AUTO'
                FROM medical_orders mo
                WHERE mo.encounter_id IN (SELECT encounter_id FROM target_encounters)

                UNION ALL

                -- Ghi nhận diễn tiến liên quan
                SELECT
                    tpn.treatment_progress_notes_id,
                    'TREATMENT_NOTE',
                    tpn.created_at,
                    COALESCE(tpn.title, CONCAT('Diễn tiến: ', tpn.note_type)),
                    tpn.content,
                    tpn.encounter_id,
                    tpn.treatment_progress_notes_id,
                    jsonb_build_object('note_type', tpn.note_type, 'severity', tpn.severity),
                    NULL, NULL, 'AUTO'
                FROM treatment_progress_notes tpn
                JOIN treatment_plans tp ON tpn.plan_id = tp.treatment_plans_id
                WHERE tp.patient_id = $1 AND tp.primary_diagnosis_code = $2
            )
            SELECT * FROM related
            WHERE 1=1 ${dateFilter}
            ORDER BY event_time DESC
        `;

        const [nameResult, eventsResult] = await Promise.all([
            pool.query(nameQuery, [patientId, icd10Code]),
            pool.query(eventsQuery, params),
        ]);

        const diagnosisEvents = eventsResult.rows.filter((e: any) => e.event_type === 'DIAGNOSIS');

        return {
            icd10_code: icd10Code,
            condition_name: nameResult.rows[0]?.diagnosis_name || null,
            total_diagnoses: diagnosisEvents.length,
            first_diagnosed: diagnosisEvents.length > 0
                ? diagnosisEvents[diagnosisEvents.length - 1].event_time
                : null,
            last_diagnosed: diagnosisEvents.length > 0
                ? diagnosisEvents[0].event_time
                : null,
            related_events: eventsResult.rows,
        };
    }

    // MANUAL EVENTS CRUD

    /** Tạo event thủ công */
    static async createManualEvent(
        patientId: string,
        userId: string,
        input: CreateTimelineEventInput
    ): Promise<TimelineEvent> {
        const eventId = `EHTE_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${uuidv4().slice(0, 8)}`;

        const result = await pool.query(
            `INSERT INTO health_timeline_events
                (event_id, patient_id, event_type, event_time, title, description, metadata, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                eventId,
                patientId,
                input.event_type,
                input.event_time,
                input.title,
                input.description || null,
                input.metadata ? JSON.stringify(input.metadata) : null,
                userId,
            ]
        );

        const row = result.rows[0];
        return {
            ...row,
            source: 'MANUAL',
            encounter_id: null,
            source_id: row.event_id,
            created_by_name: null,
        };
    }

    /** Tìm event thủ công theo ID */
    static async findManualEventById(eventId: string): Promise<any | null> {
        const result = await pool.query(
            `SELECT * FROM health_timeline_events WHERE event_id = $1 AND deleted_at IS NULL`,
            [eventId]
        );
        return result.rows[0] || null;
    }

    /** Soft delete event thủ công */
    static async deleteManualEvent(eventId: string): Promise<void> {
        await pool.query(
            `UPDATE health_timeline_events SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE event_id = $1`,
            [eventId]
        );
    }
}
