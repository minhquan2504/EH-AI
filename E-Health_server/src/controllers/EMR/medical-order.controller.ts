import { Request, Response } from 'express';
import { MedicalOrderService } from '../../services/EMR/medical-order.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ORDER_SUCCESS, ORDER_CONFIG } from '../../constants/medical-order.constant';


export class MedicalOrderController {

    /** API 1: POST /api/medical-orders/:encounterId */
    static async create(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const record = await MedicalOrderService.create(encounterId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: ORDER_SUCCESS.CREATED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo chỉ định' });
            }
        }
    }

    /** API 2: GET /api/medical-orders/:encounterId */
    static async getByEncounterId(req: Request, res: Response) {
        try {
            const data = await MedicalOrderService.getByEncounterId(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.LIST_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.getByEncounterId] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 3: GET /api/medical-orders/detail/:orderId */
    static async getDetail(req: Request, res: Response) {
        try {
            const data = await MedicalOrderService.getDetail(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.DETAIL_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.getDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 4: PATCH /api/medical-orders/:orderId */
    static async update(req: Request, res: Response) {
        try {
            const record = await MedicalOrderService.update(req.params.orderId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.UPDATED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 5: PATCH /api/medical-orders/:orderId/cancel */
    static async cancel(req: Request, res: Response) {
        try {
            const record = await MedicalOrderService.cancel(req.params.orderId as string, req.body.cancelled_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.CANCELLED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.cancel] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 6: PATCH /api/medical-orders/:orderId/start */
    static async start(req: Request, res: Response) {
        try {
            const record = await MedicalOrderService.start(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.STARTED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.start] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 7: POST /api/medical-orders/:orderId/result */
    static async createResult(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await MedicalOrderService.createResult(req.params.orderId as string, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: ORDER_SUCCESS.RESULT_CREATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.createResult] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 8: PATCH /api/medical-orders/:orderId/result */
    static async updateResult(req: Request, res: Response) {
        try {
            const data = await MedicalOrderService.updateResult(req.params.orderId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.RESULT_UPDATED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.updateResult] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 9: GET /api/medical-orders/by-patient/:patientId */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : ORDER_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : ORDER_CONFIG.DEFAULT_LIMIT;
            const orderType = req.query.order_type?.toString();
            const status = req.query.status?.toString();
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();

            const result = await MedicalOrderService.getByPatientId(patientId, page, limit, orderType, status, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ORDER_SUCCESS.HISTORY_FETCHED,
                data: result.data,
                pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.getByPatient] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 10: GET /api/medical-orders/pending */
    static async getPending(req: Request, res: Response) {
        try {
            const page = req.query.page ? parseInt(req.query.page.toString()) : ORDER_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : ORDER_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status?.toString() || 'PENDING';
            const orderType = req.query.order_type?.toString();
            const priority = req.query.priority?.toString();

            const result = await MedicalOrderService.getPending(status, orderType, priority, page, limit);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ORDER_SUCCESS.PENDING_FETCHED,
                data: result.data,
                pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.getPending] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 11: GET /api/medical-orders/search-services */
    static async searchServices(req: Request, res: Response) {
        try {
            const data = await MedicalOrderService.searchServices(
                req.query.q?.toString() || '',
                req.query.service_type?.toString()
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.SERVICES_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.searchServices] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 12: GET /api/medical-orders/:encounterId/summary */
    static async getSummary(req: Request, res: Response) {
        try {
            const data = await MedicalOrderService.getSummary(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: ORDER_SUCCESS.SUMMARY_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedicalOrderController.getSummary] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
