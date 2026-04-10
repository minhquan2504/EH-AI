import { Request, Response } from 'express';
import { SupplierService } from '../../services/Medication Management/supplier.service';
import { SUPPLIER_SUCCESS } from '../../constants/stock-in.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class SupplierController {

    static async getAll(req: Request, res: Response) {
        try {
            const search = req.query.search as string | undefined;
            const activeOnly = req.query.active_only === 'true';
            const result = await SupplierService.getAll(search, activeOnly);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.LIST_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[SupplierController.getAll] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const result = await SupplierService.getById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.DETAIL_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[SupplierController.getById] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const result = await SupplierService.create(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SUPPLIER_SUCCESS.CREATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[SupplierController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const result = await SupplierService.update(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.UPDATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[SupplierController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
