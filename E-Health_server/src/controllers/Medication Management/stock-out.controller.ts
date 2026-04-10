import { Request, Response } from 'express';
import { StockOutService } from '../../services/Medication Management/stock-out.service';
import { STOCK_OUT_SUCCESS, STOCK_OUT_CONFIG } from '../../constants/stock-out.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class StockOutController {

    /** POST /api/stock-out */
    static async createOrder(req: Request, res: Response) {
        try {
            const userId = (req as any).auth.user_id;
            const { warehouse_id, reason_type, supplier_id, dest_warehouse_id, notes } = req.body;
            const result = await StockOutService.createOrder(warehouse_id, reason_type, userId, supplier_id, dest_warehouse_id, notes);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_OUT_SUCCESS.ORDER_CREATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.createOrder] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** POST /api/stock-out/:orderId/items */
    static async addItem(req: Request, res: Response) {
        try {
            const result = await StockOutService.addItem(req.params.orderId as string, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_OUT_SUCCESS.ITEM_ADDED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.addItem] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** DELETE /api/stock-out/:orderId/items/:detailId */
    static async deleteItem(req: Request, res: Response) {
        try {
            await StockOutService.deleteItem(req.params.orderId as string, req.params.detailId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.ITEM_DELETED });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.deleteItem] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/stock-out/:orderId/confirm */
    static async confirm(req: Request, res: Response) {
        try {
            const userId = (req as any).auth.user_id;
            const result = await StockOutService.confirm(req.params.orderId as string, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.CONFIRMED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.confirm] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/stock-out/:orderId/cancel */
    static async cancel(req: Request, res: Response) {
        try {
            const result = await StockOutService.cancel(req.params.orderId as string, req.body.cancelled_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.CANCELLED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.cancel] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/stock-out */
    static async getHistory(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || STOCK_OUT_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || STOCK_OUT_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const reasonType = req.query.reason_type as string | undefined;
            const warehouseId = req.query.warehouse_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await StockOutService.getHistory(page, limit, status, reasonType, warehouseId, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.LIST_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.getHistory] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/stock-out/:orderId */
    static async getDetail(req: Request, res: Response) {
        try {
            const result = await StockOutService.getDetail(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.DETAIL_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[StockOutController.getDetail] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
