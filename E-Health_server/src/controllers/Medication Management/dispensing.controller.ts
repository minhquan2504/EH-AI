import { Request, Response } from 'express';
import { DispensingService } from '../../services/Medication Management/dispensing.service';
import {
    DISPENSE_CONFIG,
    DISPENSE_SUCCESS,
} from '../../constants/dispensing.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };

/**
 * Controller cho module Cấp phát thuốc.
 * Chỉ tiếp nhận HTTP Request, gọi Service và trả HTTP Response.
 */
export class DispensingController {

    /** API 1: POST /api/dispensing/:prescriptionId — Cấp phát thuốc */
    static async dispense(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const pharmacistId = (req as any).auth.user_id;
            const input = req.body;

            const result = await DispensingService.dispense(prescriptionId, pharmacistId, input);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: DISPENSE_SUCCESS.DISPENSED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.dispense] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 2: GET /api/dispensing/:prescriptionId — Xem phiếu cấp phát */
    static async getByPrescription(req: Request, res: Response) {
        try {
            const prescriptionId = req.params.prescriptionId as string;
            const result = await DispensingService.getByPrescriptionId(prescriptionId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.getByPrescription] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 3: GET /api/dispensing/history — Lịch sử cấp phát */
    static async getHistory(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || DISPENSE_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || DISPENSE_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await DispensingService.getHistory(page, limit, status, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.getHistory] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 4: GET /api/dispensing/inventory/:drugId — Tồn kho theo thuốc */
    static async getInventory(req: Request, res: Response) {
        try {
            const drugId = req.params.drugId as string;
            const result = await DispensingService.getInventory(drugId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.INVENTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.getInventory] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 5: GET /api/dispensing/inventory/:drugId/check — Kiểm tra tồn kho */
    static async checkStock(req: Request, res: Response) {
        try {
            const drugId = req.params.drugId as string;
            const quantity = parseInt(req.query.quantity as string) || 0;

            const result = await DispensingService.checkStock(drugId, quantity);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.STOCK_CHECKED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.checkStock] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 6: GET /api/dispensing/by-pharmacist/:pharmacistId — Lịch sử theo DS */
    static async getByPharmacist(req: Request, res: Response) {
        try {
            const pharmacistId = req.params.pharmacistId as string;
            const page = parseInt(req.query.page as string) || DISPENSE_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || DISPENSE_CONFIG.DEFAULT_LIMIT;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await DispensingService.getByPharmacist(pharmacistId, page, limit, fromDate, toDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.PHARMACIST_HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.getByPharmacist] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 7: POST /api/dispensing/:dispenseOrderId/cancel — Hủy phiếu cấp phát */
    static async cancel(req: Request, res: Response) {
        try {
            const dispenseOrderId = req.params.dispenseOrderId as string;
            const { cancelled_reason } = req.body;

            await DispensingService.cancel(dispenseOrderId, cancelled_reason);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DISPENSE_SUCCESS.CANCELLED,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DispensingController.cancel] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
