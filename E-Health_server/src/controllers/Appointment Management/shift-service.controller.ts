import { Request, Response } from 'express';
import { ShiftServiceService } from '../../services/Appointment Management/shift-service.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SHIFT_SERVICE_SUCCESS, SHIFT_SERVICE_ERRORS } from '../../constants/shift-service.constant';

/**
 * Controller quản lý liên kết ca khám – dịch vụ.
 * Chỉ parse request → gọi Service → trả response.
 */
export class ShiftServiceController {

    /**
     * POST /api/shift-services — Gán dịch vụ cho ca khám (đơn hoặc hàng loạt)
     */
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const { shift_id, facility_service_id, facility_service_ids } = req.body;

            // Hỗ trợ bulk: nếu truyền facility_service_ids (mảng)
            if (facility_service_ids && Array.isArray(facility_service_ids)) {
                const result = await ShiftServiceService.bulkCreate(shift_id, facility_service_ids);
                res.status(HTTP_STATUS.CREATED).json({
                    success: true,
                    message: SHIFT_SERVICE_SUCCESS.BULK_CREATED,
                    data: result.created,
                    total_requested: result.total_requested,
                });
                return;
            }

            // Tạo đơn
            if (!shift_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', SHIFT_SERVICE_ERRORS.MISSING_SHIFT_ID);
            }
            if (!facility_service_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_ID', SHIFT_SERVICE_ERRORS.MISSING_SERVICE_ID);
            }

            const data = await ShiftServiceService.create(shift_id, facility_service_id);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.CREATED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi gán dịch vụ cho ca' });
            }
        }
    }

    /**
     * GET /api/shift-services — Danh sách liên kết (filter)
     */
    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const shiftId = req.query.shift_id?.toString();
            const facilityServiceId = req.query.facility_service_id?.toString();

            const data = await ShiftServiceService.getAll(shiftId, facilityServiceId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.LIST_FETCHED,
                data,
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
        }
    }

    /**
     * GET /api/shift-services/by-shift/:shiftId
     */
    static async getByShift(req: Request, res: Response): Promise<void> {
        try {
            const shiftId = req.params.shiftId as string;
            const data = await ShiftServiceService.getByShift(shiftId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.BY_SHIFT_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * GET /api/shift-services/by-service/:facilityServiceId
     */
    static async getByService(req: Request, res: Response): Promise<void> {
        try {
            const facilityServiceId = req.params.facilityServiceId as string;
            const data = await ShiftServiceService.getByService(facilityServiceId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.BY_SERVICE_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * DELETE /api/shift-services/:id
     */
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            await ShiftServiceService.delete(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.DELETED,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * PATCH /api/shift-services/:id/toggle
     */
    static async toggle(req: Request, res: Response): Promise<void> {
        try {
            const { is_active } = req.body;
            if (is_active === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_IS_ACTIVE', 'Thiếu trạng thái is_active.');
            }
            const data = await ShiftServiceService.toggle(req.params.id as string, is_active);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SHIFT_SERVICE_SUCCESS.TOGGLED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
