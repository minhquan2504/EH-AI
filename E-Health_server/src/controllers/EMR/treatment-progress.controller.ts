import { Request, Response } from 'express';
import { TreatmentProgressService } from '../../services/EMR/treatment-progress.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TREATMENT_SUCCESS } from '../../constants/treatment-progress.constant';


export class TreatmentProgressController {

    /** API 1: POST /api/treatment-plans — Tạo kế hoạch */
    static async createPlan(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createPlan(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.PLAN_CREATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.createPlan] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 2: GET /api/treatment-plans/:planId — Chi tiết */
    static async getPlanDetail(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getPlanDetail(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.getPlanDetail] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 3: PATCH /api/treatment-plans/:planId — Cập nhật */
    static async updatePlan(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.updatePlan(planId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_UPDATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.updatePlan] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 4: PATCH /api/treatment-plans/:planId/status — Chuyển trạng thái */
    static async changeStatus(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.changeStatus(planId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PLAN_STATUS_CHANGED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.changeStatus] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 5: GET /api/treatment-plans/by-patient/:patientId — DS theo BN */
    static async getPatientPlans(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const { status, page, limit } = req.query;
            const data = await TreatmentProgressService.getPatientPlans(
                patientId, status as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.PATIENT_PLANS_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.getPatientPlans] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 6: POST /api/treatment-plans/:planId/notes — Thêm ghi nhận */
    static async createNote(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createNote(planId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.NOTE_CREATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.createNote] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 7: GET /api/treatment-plans/:planId/notes — DS ghi nhận */
    static async getNotes(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const { note_type, severity, encounter_id, from_date, to_date, page, limit } = req.query;
            const data = await TreatmentProgressService.getNotes(
                planId, note_type as string, severity as string,
                encounter_id as string, from_date as string, to_date as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTES_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.getNotes] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 8: PATCH /api/treatment-plans/:planId/notes/:noteId — Sửa ghi nhận */
    static async updateNote(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const noteId = req.params.noteId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.updateNote(planId, noteId, req.body, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTE_UPDATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.updateNote] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 9: DELETE /api/treatment-plans/:planId/notes/:noteId — Xóa ghi nhận */
    static async deleteNote(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const noteId = req.params.noteId as string;
            const userId = (req as any).auth?.user_id;
            await TreatmentProgressService.deleteNote(planId, noteId, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.NOTE_DELETED });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.deleteNote] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 10: POST /api/treatment-plans/:planId/follow-ups — Liên kết tái khám */
    static async createFollowUp(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const userId = (req as any).auth?.user_id;
            const data = await TreatmentProgressService.createFollowUp(planId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TREATMENT_SUCCESS.FOLLOWUP_CREATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.createFollowUp] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 11: GET /api/treatment-plans/:planId/follow-up-chain — Chuỗi tái khám */
    static async getFollowUpChain(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getFollowUpChain(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.CHAIN_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.getFollowUpChain] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 12: GET /api/treatment-plans/:planId/summary — Tổng hợp */
    static async getSummary(req: Request, res: Response) {
        try {
            const planId = req.params.planId as string;
            const data = await TreatmentProgressService.getSummary(planId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TREATMENT_SUCCESS.SUMMARY_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[TreatmentProgressController.getSummary] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
