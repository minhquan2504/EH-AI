import { TeleFollowUpRepository } from '../../repository/Remote Consultation/tele-followup.repository';
import {
    CreatePlanInput, UpdatePlanInput, CompletePlanInput,
    AddHealthUpdateInput, RespondUpdateInput, FollowUpPlanFilter,
} from '../../models/Remote Consultation/tele-followup.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_FU_ERRORS, FOLLOW_UP_PLAN_STATUS, SEVERITY_LEVEL,
} from '../../constants/remote-consultation.constant';
import { v4 as uuidv4 } from 'uuid';

/** Số ngày trước tái khám để nhắc */
const REMINDER_DAYS_AHEAD = 3;

/**
 * Business Logic Layer cho theo dõi sau tư vấn
 * Quản lý follow-up plans, health updates, reminders, convert in-person, treatment reports
 */
export class TeleFollowUpService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: KẾ HOẠCH THEO DÕI
    // ═══════════════════════════════════════════════════

    /** Tạo follow-up plan */
    static async createPlan(consultationId: string, userId: string, input: CreatePlanInput): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        const planId = `FUP_${uuidv4().substring(0, 12)}`;
        const plan = await TeleFollowUpRepository.createPlan({
            plan_id: planId,
            tele_consultation_id: consultationId,
            patient_id: consultation.patient_id,
            doctor_id: consultation.doctor_id,
            encounter_id: consultation.encounter_id || null,
            plan_type: input.plan_type,
            description: input.description || null,
            instructions: input.instructions || null,
            monitoring_items: input.monitoring_items || null,
            frequency: input.frequency || 'WEEKLY',
            start_date: input.start_date,
            end_date: input.end_date || null,
            next_follow_up_date: input.next_follow_up_date || null,
            follow_up_type: input.follow_up_type || null,
        });

        return await TeleFollowUpRepository.findPlanById(planId);
    }

    /** Cập nhật plan */
    static async updatePlan(planId: string, input: UpdatePlanInput): Promise<any> {
        const plan = await this.getPlanOrThrow(planId);
        this.assertActive(plan);

        const updateData: Record<string, any> = {};
        if (input.description !== undefined) updateData.description = input.description;
        if (input.instructions !== undefined) updateData.instructions = input.instructions;
        if (input.monitoring_items !== undefined) updateData.monitoring_items = input.monitoring_items;
        if (input.frequency !== undefined) updateData.frequency = input.frequency;
        if (input.end_date !== undefined) updateData.end_date = input.end_date;
        if (input.next_follow_up_date !== undefined) updateData.next_follow_up_date = input.next_follow_up_date;
        if (input.follow_up_type !== undefined) updateData.follow_up_type = input.follow_up_type;

        if (Object.keys(updateData).length > 0) {
            await TeleFollowUpRepository.updatePlan(planId, updateData);
        }
        return await TeleFollowUpRepository.findPlanById(planId);
    }

    /** Chi tiết plan */
    static async getPlanDetail(planId: string): Promise<any> {
        return await this.getPlanOrThrow(planId);
    }

    /**
     * Hoàn thành plan + ghi outcome
     * Bắt buộc: outcome + outcome_rating
     */
    static async completePlan(planId: string, input: CompletePlanInput): Promise<void> {
        const plan = await this.getPlanOrThrow(planId);
        this.assertActive(plan);

        if (!input.outcome || !input.outcome_rating) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_FU_ERRORS.MISSING_OUTCOME.code, TELE_FU_ERRORS.MISSING_OUTCOME.message);
        }

        await TeleFollowUpRepository.updatePlan(planId, {
            status: FOLLOW_UP_PLAN_STATUS.COMPLETED,
            outcome: input.outcome,
            outcome_rating: input.outcome_rating,
            completed_at: new Date(),
        });
    }

    /**
     * Chuyển sang khám trực tiếp
     */
    static async convertToPerson(planId: string, reason: string): Promise<void> {
        const plan = await this.getPlanOrThrow(planId);
        this.assertActive(plan);

        await TeleFollowUpRepository.updatePlan(planId, {
            status: FOLLOW_UP_PLAN_STATUS.CONVERTED_IN_PERSON,
            converted_reason: reason,
            completed_at: new Date(),
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: DIỄN BIẾN SỨC KHỎE
    // ═══════════════════════════════════════════════════

    /**
     * BN/BS ghi nhận diễn biến
     * SEVERE/CRITICAL → auto requires_attention
     */
    static async addHealthUpdate(planId: string, userId: string, role: string, input: AddHealthUpdateInput): Promise<any> {
        await this.getPlanOrThrow(planId);

        const severityLevel = input.severity_level || SEVERITY_LEVEL.NORMAL;
        const requiresAttention = severityLevel === SEVERITY_LEVEL.SEVERE || severityLevel === SEVERITY_LEVEL.CRITICAL;

        const updateId = `HU_${uuidv4().substring(0, 12)}`;
        const update = await TeleFollowUpRepository.createUpdate({
            update_id: updateId,
            plan_id: planId,
            reported_by: userId,
            reporter_type: role === 'PATIENT' ? 'PATIENT' : 'DOCTOR',
            update_type: input.update_type,
            content: input.content || null,
            vital_data: input.vital_data || null,
            severity_level: severityLevel,
            attachments: input.attachments || null,
            requires_attention: requiresAttention,
        });

        return update;
    }

    /** DS diễn biến */
    static async getHealthUpdates(planId: string, page: number, limit: number): Promise<any> {
        await this.getPlanOrThrow(planId);
        return await TeleFollowUpRepository.getUpdates(planId, page, limit);
    }

    /** BS phản hồi diễn biến */
    static async respondToUpdate(updateId: string, input: RespondUpdateInput): Promise<void> {
        const update = await TeleFollowUpRepository.findUpdateById(updateId);
        if (!update) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_FU_ERRORS.UPDATE_NOT_FOUND.code, TELE_FU_ERRORS.UPDATE_NOT_FOUND.message);
        }
        if (update.doctor_response) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_FU_ERRORS.UPDATE_ALREADY_RESPONDED.code, TELE_FU_ERRORS.UPDATE_ALREADY_RESPONDED.message);
        }

        await TeleFollowUpRepository.respondToUpdate(updateId, input.doctor_response);
    }

    /** DS cần BS xem xét */
    static async getAttentionUpdates(doctorId: string, page: number, limit: number): Promise<any> {
        return await TeleFollowUpRepository.getAttentionUpdates(doctorId, page, limit);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: NHẮC TÁI KHÁM
    // ═══════════════════════════════════════════════════

    /** Gửi nhắc tái khám (đánh dấu reminder_sent) */
    static async sendReminder(planId: string): Promise<void> {
        const plan = await this.getPlanOrThrow(planId);
        this.assertActive(plan);

        if (plan.reminder_sent) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_FU_ERRORS.REMINDER_ALREADY_SENT.code, TELE_FU_ERRORS.REMINDER_ALREADY_SENT.message);
        }

        await TeleFollowUpRepository.updatePlan(planId, {
            reminder_sent: true,
            reminder_sent_at: new Date(),
        });
    }

    /** DS plans sắp tái khám */
    static async getUpcomingPlans(doctorId: string): Promise<any[]> {
        return await TeleFollowUpRepository.getUpcomingPlans(doctorId, REMINDER_DAYS_AHEAD);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: TRA CỨU & BÁO CÁO
    // ═══════════════════════════════════════════════════

    static async listPlans(filters: FollowUpPlanFilter): Promise<any> {
        return await TeleFollowUpRepository.findAllPlans(filters);
    }

    static async getPatientPlans(patientId: string, page: number, limit: number): Promise<any> {
        return await TeleFollowUpRepository.findByPatient(patientId, page, limit);
    }

    /** Báo cáo kết quả điều trị: plan + tất cả updates */
    static async getReport(planId: string): Promise<any> {
        const plan = await this.getPlanOrThrow(planId);
        const updates = await TeleFollowUpRepository.getUpdates(planId, 1, 1000);
        return { plan, updates: updates.data, total_updates: updates.total };
    }

    /** Thống kê */
    static async getStats(doctorId?: string): Promise<any> {
        return await TeleFollowUpRepository.getStats(doctorId);
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConsultationOrThrow(consultationId: string): Promise<any> {
        const c = await TeleFollowUpRepository.getConsultation(consultationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_FU_ERRORS.CONSULTATION_NOT_FOUND.code, TELE_FU_ERRORS.CONSULTATION_NOT_FOUND.message);
        return c;
    }

    private static async getPlanOrThrow(planId: string): Promise<any> {
        const p = await TeleFollowUpRepository.findPlanById(planId);
        if (!p) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_FU_ERRORS.PLAN_NOT_FOUND.code, TELE_FU_ERRORS.PLAN_NOT_FOUND.message);
        return p;
    }

    private static assertActive(plan: any): void {
        if (plan.status !== FOLLOW_UP_PLAN_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_FU_ERRORS.PLAN_NOT_ACTIVE.code, TELE_FU_ERRORS.PLAN_NOT_ACTIVE.message);
        }
    }
}
