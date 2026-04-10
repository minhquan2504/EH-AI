import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TreatmentProgressRepository } from '../../repository/EMR/treatment-progress.repository';
import { MedicalRecordRepository } from '../../repository/EMR/medical-record.repository';
import {
    CreatePlanInput,
    UpdatePlanInput,
    StatusChangeInput,
    CreateNoteInput,
    UpdateNoteInput,
    CreateFollowUpInput,
    PlanDetail,
    TreatmentSummary,
} from '../../models/EMR/treatment-progress.model';
import {
    TREATMENT_PLAN_STATUS,
    VALID_STATUS_TRANSITIONS,
    PROGRESS_NOTE_TYPE,
    NOTE_SEVERITY,
    TREATMENT_ERRORS,
    TREATMENT_CONFIG,
} from '../../constants/treatment-progress.constant';


export class TreatmentProgressService {

    //  KẾ HOẠCH ĐIỀU TRỊ 

    /**
     * Tạo kế hoạch điều trị mới.
     * Tự ghi timeline event.
     */
    static async createPlan(input: CreatePlanInput, userId: string) {
        if (!input.patient_id || !input.primary_diagnosis_code || !input.title || !input.start_date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', TREATMENT_ERRORS.MISSING_REQUIRED);
        }

        const patientExists = await TreatmentProgressRepository.patientExists(input.patient_id);
        if (!patientExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', TREATMENT_ERRORS.PATIENT_NOT_FOUND);
        }

        if (input.created_encounter_id) {
            const enc = await TreatmentProgressRepository.getEncounterPatient(input.created_encounter_id);
            if (!enc) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', TREATMENT_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const plan = await TreatmentProgressRepository.createPlan(
                input.patient_id, input.primary_diagnosis_code, input.primary_diagnosis_name,
                input.title, input.description || null, input.goals || null,
                input.start_date, input.expected_end_date || null,
                userId, input.created_encounter_id || null, client
            );

            /** Ghi timeline event */
            await MedicalRecordRepository.addTimelineEvent(
                input.patient_id, new Date().toISOString(), 'TREATMENT_PLAN_CREATED',
                `Kế hoạch điều trị: ${input.title}`,
                `Chẩn đoán: ${input.primary_diagnosis_name} (${input.primary_diagnosis_code})`,
                plan.treatment_plans_id, 'treatment_plans', client
            );

            await client.query('COMMIT');
            return plan;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Chi tiết kế hoạch (plan + recent notes + encounter chain + stats)
     */
    static async getPlanDetail(planId: string): Promise<PlanDetail> {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);

        const [recentNotes, encounterChain, totalNotes, notesByType] = await Promise.all([
            TreatmentProgressRepository.getRecentNotes(planId, TREATMENT_CONFIG.RECENT_NOTES_LIMIT),
            TreatmentProgressRepository.getFollowUpChain(planId),
            TreatmentProgressRepository.countTotalNotes(planId),
            TreatmentProgressRepository.countNotesByType(planId),
        ]);

        const daysInTreatment = Math.max(1, Math.ceil(
            (Date.now() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24)
        ));

        return {
            plan,
            recent_notes: recentNotes,
            encounter_chain: encounterChain,
            stats: {
                total_notes: totalNotes,
                total_encounters: encounterChain.length,
                days_in_treatment: daysInTreatment,
                notes_by_type: notesByType,
            },
        };
    }

    /**
     * Cập nhật kế hoạch (chỉ ACTIVE/ON_HOLD) + auto ghi PLAN_UPDATE note
     */
    static async updatePlan(planId: string, input: UpdatePlanInput, userId: string) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);
        if (plan.status !== TREATMENT_PLAN_STATUS.ACTIVE && plan.status !== TREATMENT_PLAN_STATUS.ON_HOLD) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PLAN_NOT_ACTIVE', TREATMENT_ERRORS.PLAN_NOT_ACTIVE);
        }

        const fields: Record<string, any> = {};
        if (input.title !== undefined) fields.title = input.title;
        if (input.description !== undefined) fields.description = input.description;
        if (input.goals !== undefined) fields.goals = input.goals;
        if (input.expected_end_date !== undefined) fields.expected_end_date = input.expected_end_date;

        if (Object.keys(fields).length === 0) return plan;

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const updated = await TreatmentProgressRepository.updatePlan(planId, fields, client);

            /** Auto ghi note PLAN_UPDATE */
            const changedFields = Object.keys(fields).join(', ');
            await TreatmentProgressRepository.createNote(
                planId, null, PROGRESS_NOTE_TYPE.PLAN_UPDATE,
                'Cập nhật kế hoạch điều trị',
                `Đã cập nhật: ${changedFields}`, NOTE_SEVERITY.NORMAL, userId, client
            );

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Chuyển trạng thái kế hoạch (state machine validation)
     */
    static async changeStatus(planId: string, input: StatusChangeInput, userId: string) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);

        const newStatus = input.status;
        const allowed = VALID_STATUS_TRANSITIONS[plan.status];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TRANSITION', TREATMENT_ERRORS.INVALID_TRANSITION);
        }

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const fields: Record<string, any> = { status: newStatus };
            if (newStatus === TREATMENT_PLAN_STATUS.COMPLETED) {
                fields.actual_end_date = new Date().toISOString().split('T')[0];
            }
            const updated = await TreatmentProgressRepository.updatePlan(planId, fields, client);

            /** Auto ghi note + timeline */
            const reasonText = input.reason ? ` — Lý do: ${input.reason}` : '';
            await TreatmentProgressRepository.createNote(
                planId, null, PROGRESS_NOTE_TYPE.PLAN_UPDATE,
                `Chuyển trạng thái: ${plan.status} → ${newStatus}`,
                `Kế hoạch "${plan.title}" chuyển sang ${newStatus}${reasonText}`,
                newStatus === TREATMENT_PLAN_STATUS.CANCELLED ? NOTE_SEVERITY.IMPORTANT : NOTE_SEVERITY.NORMAL,
                userId, client
            );

            if (newStatus === TREATMENT_PLAN_STATUS.COMPLETED) {
                await MedicalRecordRepository.addTimelineEvent(
                    plan.patient_id, new Date().toISOString(), 'TREATMENT_PLAN_COMPLETED',
                    `Hoàn tất kế hoạch: ${plan.title}`,
                    input.reason || null,
                    plan.treatment_plans_id, 'treatment_plans', client
                );
            }

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** DS kế hoạch theo bệnh nhân */
    static async getPatientPlans(patientId: string, status?: string, page?: number, limit?: number) {
        const exists = await TreatmentProgressRepository.patientExists(patientId);
        if (!exists) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', TREATMENT_ERRORS.PATIENT_NOT_FOUND);
        return TreatmentProgressRepository.findPlansByPatient(
            patientId, status, page || TREATMENT_CONFIG.DEFAULT_PAGE, limit || TREATMENT_CONFIG.DEFAULT_LIMIT
        );
    }

    //  GHI NHẬN DIỄN TIẾN 

    /**
     * Thêm ghi nhận diễn tiến.
     * Validate note_type, severity, plan status. Ghi timeline event.
     */
    static async createNote(planId: string, input: CreateNoteInput, userId: string) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);
        if (plan.status !== TREATMENT_PLAN_STATUS.ACTIVE && plan.status !== TREATMENT_PLAN_STATUS.ON_HOLD) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PLAN_NOT_ACTIVE', TREATMENT_ERRORS.PLAN_NOT_ACTIVE);
        }

        if (!input.content || !input.note_type) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', TREATMENT_ERRORS.MISSING_REQUIRED);
        }

        const validTypes = Object.values(PROGRESS_NOTE_TYPE);
        if (!validTypes.includes(input.note_type as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_NOTE_TYPE', TREATMENT_ERRORS.INVALID_NOTE_TYPE);
        }

        const severity = input.severity || NOTE_SEVERITY.NORMAL;
        const validSeverities = Object.values(NOTE_SEVERITY);
        if (!validSeverities.includes(severity as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_SEVERITY', TREATMENT_ERRORS.INVALID_SEVERITY);
        }

        if (input.encounter_id) {
            const enc = await TreatmentProgressRepository.getEncounterPatient(input.encounter_id);
            if (!enc) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', TREATMENT_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const note = await TreatmentProgressRepository.createNote(
                planId, input.encounter_id || null, input.note_type,
                input.title || null, input.content, severity, userId, client
            );

            /** Ghi timeline cho note CRITICAL hoặc COMPLICATION */
            if (severity === NOTE_SEVERITY.CRITICAL || input.note_type === PROGRESS_NOTE_TYPE.COMPLICATION) {
                await MedicalRecordRepository.addTimelineEvent(
                    plan.patient_id, new Date().toISOString(), 'TREATMENT_NOTE',
                    input.title || `Ghi nhận ${input.note_type}`,
                    input.content.substring(0, 200),
                    note.treatment_progress_notes_id, 'treatment_progress_notes', client
                );
            }

            await client.query('COMMIT');
            return note;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** DS ghi nhận */
    static async getNotes(
        planId: string, noteType?: string, severity?: string,
        encounterId?: string, fromDate?: string, toDate?: string,
        page?: number, limit?: number
    ) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);

        return TreatmentProgressRepository.findNotesByPlan(
            planId, noteType, severity, encounterId, fromDate, toDate,
            page || TREATMENT_CONFIG.DEFAULT_PAGE, limit || TREATMENT_CONFIG.DEFAULT_LIMIT
        );
    }

    /** Sửa ghi nhận (chỉ tác giả) */
    static async updateNote(planId: string, noteId: string, input: UpdateNoteInput, userId: string) {
        const note = await TreatmentProgressRepository.findNoteById(noteId);
        if (!note || note.plan_id !== planId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOTE_NOT_FOUND', TREATMENT_ERRORS.NOTE_NOT_FOUND);
        }
        if (note.recorded_by !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'NOT_NOTE_AUTHOR', TREATMENT_ERRORS.NOT_NOTE_AUTHOR);
        }

        if (input.note_type) {
            const validTypes = Object.values(PROGRESS_NOTE_TYPE);
            if (!validTypes.includes(input.note_type as any)) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_NOTE_TYPE', TREATMENT_ERRORS.INVALID_NOTE_TYPE);
            }
        }
        if (input.severity) {
            const validSeverities = Object.values(NOTE_SEVERITY);
            if (!validSeverities.includes(input.severity as any)) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_SEVERITY', TREATMENT_ERRORS.INVALID_SEVERITY);
            }
        }

        const fields: Record<string, any> = {};
        if (input.note_type !== undefined) fields.note_type = input.note_type;
        if (input.title !== undefined) fields.title = input.title;
        if (input.content !== undefined) fields.content = input.content;
        if (input.severity !== undefined) fields.severity = input.severity;

        if (Object.keys(fields).length === 0) return note;
        return TreatmentProgressRepository.updateNote(noteId, fields);
    }

    /** Xóa ghi nhận (chỉ tác giả) */
    static async deleteNote(planId: string, noteId: string, userId: string) {
        const note = await TreatmentProgressRepository.findNoteById(noteId);
        if (!note || note.plan_id !== planId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOTE_NOT_FOUND', TREATMENT_ERRORS.NOTE_NOT_FOUND);
        }
        if (note.recorded_by !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'NOT_NOTE_AUTHOR', TREATMENT_ERRORS.NOT_NOTE_AUTHOR);
        }
        await TreatmentProgressRepository.deleteNote(noteId);
    }

    //  FOLLOW-UP & SUMMARY 

    /**
     * Liên kết encounter tái khám.
     * Validate: cùng bệnh nhân, khác encounter, không duplicate.
     */
    static async createFollowUp(planId: string, input: CreateFollowUpInput, userId: string) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);
        if (plan.status !== TREATMENT_PLAN_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PLAN_NOT_ACTIVE', TREATMENT_ERRORS.PLAN_NOT_ACTIVE);
        }

        if (!input.previous_encounter_id || !input.follow_up_encounter_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', TREATMENT_ERRORS.MISSING_REQUIRED);
        }
        if (input.previous_encounter_id === input.follow_up_encounter_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SAME_ENCOUNTER', TREATMENT_ERRORS.SAME_ENCOUNTER);
        }

        /** Validate cùng bệnh nhân */
        const [prevEnc, fuEnc] = await Promise.all([
            TreatmentProgressRepository.getEncounterPatient(input.previous_encounter_id),
            TreatmentProgressRepository.getEncounterPatient(input.follow_up_encounter_id),
        ]);
        if (!prevEnc || !fuEnc) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', TREATMENT_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        if (prevEnc.patient_id !== fuEnc.patient_id || prevEnc.patient_id !== plan.patient_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DIFFERENT_PATIENT', TREATMENT_ERRORS.DIFFERENT_PATIENT);
        }

        /** Check duplicate */
        const exists = await TreatmentProgressRepository.followUpLinkExists(
            input.previous_encounter_id, input.follow_up_encounter_id
        );
        if (exists) throw new AppError(HTTP_STATUS.CONFLICT, 'DUPLICATE_LINK', TREATMENT_ERRORS.DUPLICATE_LINK);

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const link = await TreatmentProgressRepository.createFollowUpLink(
                planId, input.previous_encounter_id, input.follow_up_encounter_id,
                input.follow_up_reason || null, input.scheduled_date || null,
                input.notes || null, userId, client
            );

            /** Auto ghi FOLLOW_UP note */
            await TreatmentProgressRepository.createNote(
                planId, input.follow_up_encounter_id, PROGRESS_NOTE_TYPE.FOLLOW_UP,
                'Liên kết tái khám',
                `Tái khám từ ${input.previous_encounter_id}${input.follow_up_reason ? ': ' + input.follow_up_reason : ''}`,
                NOTE_SEVERITY.NORMAL, userId, client
            );

            /** Ghi timeline */
            await MedicalRecordRepository.addTimelineEvent(
                plan.patient_id, new Date().toISOString(), 'FOLLOW_UP_LINKED',
                'Liên kết tái khám',
                input.follow_up_reason || null,
                link.encounter_follow_up_links_id, 'encounter_follow_up_links', client
            );

            await client.query('COMMIT');
            return link;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Chuỗi tái khám */
    static async getFollowUpChain(planId: string) {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);

        const chain = await TreatmentProgressRepository.getFollowUpChain(planId);
        const firstDate = chain.length > 0 ? new Date(chain[0].date) : new Date();
        const lastDate = chain.length > 0 ? new Date(chain[chain.length - 1].date) : new Date();
        const daysBetween = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
            chain,
            total_encounters: chain.length,
            days_between_first_last: daysBetween,
        };
    }

    /**
     * Tổng hợp lịch sử điều trị:
     * plan + notes aggregation + vital signs + prescriptions + chain
     */
    static async getSummary(planId: string): Promise<TreatmentSummary> {
        const plan = await TreatmentProgressRepository.findPlanById(planId);
        if (!plan) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PLAN_NOT_FOUND', TREATMENT_ERRORS.PLAN_NOT_FOUND);

        const [
            totalNotes, notesByType, notesBySeverity,
            recentNotes, chain, vitalSigns, prescriptions,
            totalEncounters
        ] = await Promise.all([
            TreatmentProgressRepository.countTotalNotes(planId),
            TreatmentProgressRepository.countNotesByType(planId),
            TreatmentProgressRepository.countNotesBySeverity(planId),
            TreatmentProgressRepository.getRecentNotes(planId, TREATMENT_CONFIG.SUMMARY_NOTES_LIMIT),
            TreatmentProgressRepository.getFollowUpChain(planId),
            TreatmentProgressRepository.getVitalSignsTrend(planId),
            TreatmentProgressRepository.getPrescriptionsHistory(planId),
            TreatmentProgressRepository.countLinkedEncounters(planId),
        ]);

        const endDate = plan.actual_end_date ? new Date(plan.actual_end_date) : new Date();
        const totalDays = Math.max(1, Math.ceil(
            (endDate.getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24)
        ));

        return {
            plan,
            total_days: totalDays,
            total_encounters: totalEncounters,
            total_notes: totalNotes,
            notes_by_type: notesByType,
            notes_by_severity: notesBySeverity,
            vital_signs_trend: vitalSigns,
            prescriptions_history: prescriptions,
            recent_notes: recentNotes,
            follow_up_chain: chain,
        };
    }
}
