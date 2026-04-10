import { Request, Response } from 'express';
import { PrescriptionService } from '../../services/EMR/prescription.service';
import { AppError } from '../../utils/app-error.util';
import { PRESCRIPTION_SUCCESS, PRESCRIPTION_CONFIG } from '../../constants/prescription.constant';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class PrescriptionController {


    /** API 1: POST /api/prescriptions/:encounterId — Tạo đơn thuốc */
    static async create(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const prescription = await PrescriptionService.create(encounterId, req.body, userId);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CREATED,
                data: prescription,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn thuốc' });
            }
        }
    }

    /** API 2: GET /api/prescriptions/:encounterId — Lấy đơn thuốc theo encounter */
    static async getByEncounterId(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const result = await PrescriptionService.getByEncounterId(encounterId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getByEncounterId] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 3: PATCH /api/prescriptions/:prescriptionId/update — Cập nhật header */
    static async update(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const prescription = await PrescriptionService.update(prescriptionId, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.UPDATED,
                data: prescription,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 4: PATCH /api/prescriptions/:prescriptionId/confirm — Xác nhận đơn */
    static async confirm(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const prescription = await PrescriptionService.confirm(prescriptionId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CONFIRMED,
                data: prescription,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.confirm] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 5: PATCH /api/prescriptions/:prescriptionId/cancel — Hủy đơn */
    static async cancel(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const { cancelled_reason } = req.body;
            const prescription = await PrescriptionService.cancel(prescriptionId, cancelled_reason);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CANCELLED,
                data: prescription,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.cancel] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 6: GET /api/prescriptions/by-patient/:patientId — Lịch sử đơn thuốc */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getByPatientId(patientId, page, limit, status, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getByPatient] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }


    /** API 7: POST /api/prescriptions/:prescriptionId/details — Thêm dòng thuốc */
    static async addDetail(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const detail = await PrescriptionService.addDetail(prescriptionId, req.body);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_ADDED,
                data: detail,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.addDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 8: PATCH /api/prescriptions/details/:detailId — Sửa dòng thuốc */
    static async updateDetail(req: Request, res: Response) {
        try {
            const detailId = req.params.detailId as string;
            const detail = await PrescriptionService.updateDetail(detailId, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_UPDATED,
                data: detail,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.updateDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 9: DELETE /api/prescriptions/details/:detailId — Xóa dòng thuốc */
    static async deleteDetail(req: Request, res: Response) {
        try {
            const detailId = req.params.detailId as string;
            await PrescriptionService.deleteDetail(detailId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAIL_DELETED,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.deleteDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 10: GET /api/prescriptions/:prescriptionId/details — Danh sách dòng thuốc */
    static async getDetails(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const details = await PrescriptionService.getDetails(prescriptionId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DETAILS_FETCHED,
                data: details,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getDetails] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }


    /** API 11: GET /api/prescriptions/search-drugs — Tìm kiếm thuốc */
    static async searchDrugs(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            const categoryId = req.query.category_id as string | undefined;
            const drugs = await PrescriptionService.searchDrugs(query, categoryId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DRUGS_SEARCHED,
                data: drugs,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.searchDrugs] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 12: GET /api/prescriptions/:encounterId/summary — Tóm tắt đơn thuốc */
    static async getSummary(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const summary = await PrescriptionService.getSummary(encounterId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getSummary] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 13: GET /api/prescriptions/by-doctor/:doctorId — Lịch sử đơn thuốc theo bác sĩ */
    static async getByDoctor(req: Request, res: Response) {
        try {
            const doctorId = req.params.doctorId as string;
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getByDoctorId(doctorId, page, limit, status, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.DOCTOR_HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getByDoctor] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    //  SEARCH (Module 5.9) 

    /** API 14: GET /api/prescriptions/search — Tìm kiếm tổng hợp */
    static async search(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || PRESCRIPTION_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PRESCRIPTION_CONFIG.DEFAULT_LIMIT;
            const q = req.query.q as string | undefined;
            const status = req.query.status as string | undefined;
            const doctorId = req.query.doctor_id as string | undefined;
            const patientId = req.query.patient_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.search(page, limit, q, status, doctorId, patientId, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.SEARCH_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.search] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 15: GET /api/prescriptions/search/by-code/:code — Tìm theo mã đơn */
    static async searchByCode(req: Request, res: Response) {
        try {
            const code = req.params.code as string;
            const result = await PrescriptionService.findByCode(code);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.CODE_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.searchByCode] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 16: GET /api/prescriptions/search/stats — Thống kê */
    static async getStats(req: Request, res: Response) {
        try {
            const doctorId = req.query.doctor_id as string | undefined;
            const patientId = req.query.patient_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await PrescriptionService.getStats(doctorId, patientId, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: PRESCRIPTION_SUCCESS.STATS_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[PrescriptionController.getStats] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
