import { Request, Response } from 'express';
import { InventoryService } from '../../services/Medication Management/inventory.service';
import { INVENTORY_CONFIG, INVENTORY_SUCCESS } from '../../constants/inventory.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class InventoryController {

    /** API 1: GET /api/inventory — Danh sách tồn kho */
    static async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || INVENTORY_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || INVENTORY_CONFIG.DEFAULT_LIMIT;
            const drugId = req.query.drug_id as string | undefined;
            const search = req.query.search as string | undefined;
            const expiryBefore = req.query.expiry_before as string | undefined;
            const lowStockOnly = req.query.low_stock_only === 'true';

            const result = await InventoryService.getAll(page, limit, drugId, search, expiryBefore, lowStockOnly);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: INVENTORY_SUCCESS.LIST_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.getAll] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 2: GET /api/inventory/:batchId — Chi tiết 1 lô */
    static async getById(req: Request, res: Response) {
        try {
            const batchId = req.params.batchId as string;
            const result = await InventoryService.getById(batchId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: INVENTORY_SUCCESS.DETAIL_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.getById] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 3: GET /api/inventory/alerts/expiring — Cảnh báo sắp hết hạn */
    static async getExpiringAlerts(req: Request, res: Response) {
        try {
            const days = parseInt(req.query.days as string) || INVENTORY_CONFIG.DEFAULT_EXPIRY_DAYS;
            const result = await InventoryService.getExpiringAlerts(days);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: INVENTORY_SUCCESS.EXPIRING_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.getExpiringAlerts] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 4: GET /api/inventory/alerts/low-stock — Cảnh báo tồn kho thấp */
    static async getLowStockAlerts(req: Request, res: Response) {
        try {
            const result = await InventoryService.getLowStockAlerts();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: INVENTORY_SUCCESS.LOW_STOCK_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.getLowStockAlerts] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 5: POST /api/inventory — Nhập kho lô mới */
    static async create(req: Request, res: Response) {
        try {
            const result = await InventoryService.create(req.body);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: INVENTORY_SUCCESS.CREATED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** API 6: PATCH /api/inventory/:batchId — Cập nhật tồn kho */
    static async update(req: Request, res: Response) {
        try {
            const batchId = req.params.batchId as string;
            const result = await InventoryService.update(batchId, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: INVENTORY_SUCCESS.UPDATED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[InventoryController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
