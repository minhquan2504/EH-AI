import { Request, Response } from 'express';
import { StockInService } from '../../services/Medication Management/stock-in.service';
import { STOCK_IN_SUCCESS, STOCK_IN_CONFIG } from '../../constants/stock-in.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class StockInController {

    /** POST /api/stock-in — Tạo phiếu nhập */
    static async createOrder(req: Request, res: Response) {
        try {
            const userId = (req as any).auth.user_id;
            const { supplier_id, warehouse_id, notes } = req.body;
            const result = await StockInService.createOrder(supplier_id, warehouse_id, userId, notes);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_IN_SUCCESS.ORDER_CREATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.createOrder] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** POST /api/stock-in/:orderId/items — Thêm dòng thuốc */
    static async addItem(req: Request, res: Response) {
        try {
            const orderId = req.params.orderId as string;
            const result = await StockInService.addItem(orderId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_IN_SUCCESS.ITEM_ADDED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.addItem] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/stock-in/:orderId/confirm — Xác nhận */
    static async confirm(req: Request, res: Response) {
        try {
            const result = await StockInService.confirm(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.CONFIRMED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.confirm] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/stock-in/:orderId/receive — Nhận hàng */
    static async receive(req: Request, res: Response) {
        try {
            const userId = (req as any).auth.user_id;
            const result = await StockInService.receive(req.params.orderId as string, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.RECEIVED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.receive] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/stock-in/:orderId/cancel — Hủy phiếu */
    static async cancel(req: Request, res: Response) {
        try {
            const result = await StockInService.cancel(req.params.orderId as string, req.body.cancelled_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.CANCELLED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.cancel] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/stock-in — Lịch sử */
    static async getHistory(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || STOCK_IN_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || STOCK_IN_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const supplierId = req.query.supplier_id as string | undefined;
            const warehouseId = req.query.warehouse_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await StockInService.getHistory(page, limit, status, supplierId, warehouseId, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.LIST_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.getHistory] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/stock-in/:orderId — Chi tiết */
    static async getDetail(req: Request, res: Response) {
        try {
            const result = await StockInService.getDetail(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.DETAIL_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockInController.getDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
