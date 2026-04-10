import { Request, Response } from 'express';
import { ClinicalExamService } from '../../services/EMR/clinical-exam.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    CLINICAL_EXAM_SUCCESS,
    CLINICAL_EXAM_CONFIG,
} from '../../constants/clinical-exam.constant';


export class ClinicalExamController {

    /**
     * POST /api/clinical-examinations/:encounterId — Tạo phiếu khám lâm sàng
     */
    static async create(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const record = await ClinicalExamService.create(encounterId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.CREATED,
                data: record,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo phiếu khám lâm sàng' });
            }
        }
    }

    /**
     * GET /api/clinical-examinations/:encounterId — Chi tiết phiếu khám
     */
    static async getByEncounterId(req: Request, res: Response) {
        try {
            const record = await ClinicalExamService.getByEncounterId(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.DETAIL_FETCHED,
                data: record,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.getByEncounterId] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy phiếu khám' });
            }
        }
    }

    /**
     * PATCH /api/clinical-examinations/:encounterId — Cập nhật phiếu khám
     */
    static async update(req: Request, res: Response) {
        try {
            const record = await ClinicalExamService.update(req.params.encounterId as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.UPDATED,
                data: record,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật phiếu khám' });
            }
        }
    }

    /**
     * PATCH /api/clinical-examinations/:encounterId/vitals — Cập nhật riêng sinh hiệu
     */
    static async updateVitals(req: Request, res: Response) {
        try {
            const record = await ClinicalExamService.updateVitals(req.params.encounterId as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.VITALS_UPDATED,
                data: record,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.updateVitals] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật sinh hiệu' });
            }
        }
    }

    /**
     * PATCH /api/clinical-examinations/:encounterId/finalize — Xác nhận phiếu khám
     */
    static async finalize(req: Request, res: Response) {
        try {
            const record = await ClinicalExamService.finalize(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.FINALIZED,
                data: record,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.finalize] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xác nhận phiếu khám' });
            }
        }
    }

    /**
     * GET /api/clinical-examinations/by-patient/:patientId — Lịch sử khám theo BN
     */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : CLINICAL_EXAM_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : CLINICAL_EXAM_CONFIG.DEFAULT_LIMIT;
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();

            const result = await ClinicalExamService.getByPatientId(patientId, page, limit, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.HISTORY_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.getByPatient] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * GET /api/clinical-examinations/:encounterId/summary — Tóm tắt khám lâm sàng
     */
    static async getSummary(req: Request, res: Response) {
        try {
            const summary = await ClinicalExamService.getSummary(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CLINICAL_EXAM_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[ClinicalExamController.getSummary] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
