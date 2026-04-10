import { Request, Response } from 'express';
import { WarehouseService } from '../../services/Medication Management/warehouse.service';
import { WAREHOUSE_SUCCESS } from '../../constants/warehouse.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class WarehouseController {

    /** GET /api/warehouses */
    static async getAll(req: Request, res: Response) {
        try {
            const branchId = req.query.branch_id as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await WarehouseService.getAll(branchId, search);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.LIST_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[WarehouseController.getAll] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/warehouses/:id */
    static async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const result = await WarehouseService.getById(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.DETAIL_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[WarehouseController.getById] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** POST /api/warehouses */
    static async create(req: Request, res: Response) {
        try {
            const result = await WarehouseService.create(req.body);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: WAREHOUSE_SUCCESS.CREATED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[WarehouseController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/warehouses/:id */
    static async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const result = await WarehouseService.update(id, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.UPDATED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[WarehouseController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/warehouses/:id/toggle */
    static async toggle(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const result = await WarehouseService.toggle(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.TOGGLED,
                data: result,
            });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[WarehouseController.toggle] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
