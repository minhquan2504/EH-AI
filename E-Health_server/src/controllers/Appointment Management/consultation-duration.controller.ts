import { Request, Response } from 'express';
import { ConsultationDurationService } from '../../services/Appointment Management/consultation-duration.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DURATION_SUCCESS, DURATION_ERRORS } from '../../constants/consultation-duration.constant';

/**
 * Controller quản lý thời lượng lượt khám.
 * Chỉ parse request → gọi Service → trả response.
 */
export class ConsultationDurationController {

    /**
     * GET /api/facilities/:facilityId/service-durations
     * Lấy danh sách thời lượng khám tại cơ sở
     */
    static async getServiceDurations(req: Request, res: Response): Promise<void> {
        try {
            const facilityId = req.params.facilityId as string;
            const isActive = req.query.is_active !== undefined
                ? req.query.is_active === 'true'
                : undefined;
            const search = req.query.search?.toString();

            const data = await ConsultationDurationService.getServiceDurations(facilityId, isActive, search);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DURATION_SUCCESS.LIST_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách thời lượng khám' });
            }
        }
    }

    /**
     * PATCH /api/facilities/:facilityId/service-durations/:serviceId
     * Cập nhật thời lượng 1 dịch vụ
     */
    static async updateSingleDuration(req: Request, res: Response): Promise<void> {
        try {
            const facilityId = req.params.facilityId as string;
            const serviceId = req.params.serviceId as string;
            const { estimated_duration_minutes } = req.body;

            if (estimated_duration_minutes === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DURATION', DURATION_ERRORS.MISSING_DURATION);
            }

            const data = await ConsultationDurationService.updateSingleDuration(facilityId, serviceId, estimated_duration_minutes);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DURATION_SUCCESS.UPDATED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật thời lượng khám' });
            }
        }
    }

    /**
     * PATCH /api/facilities/:facilityId/service-durations
     * Batch cập nhật thời lượng nhiều dịch vụ
     */
    static async batchUpdateDurations(req: Request, res: Response): Promise<void> {
        try {
            const facilityId = req.params.facilityId as string;
            const { updates } = req.body;

            if (!updates) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_UPDATES', DURATION_ERRORS.MISSING_UPDATES);
            }

            const result = await ConsultationDurationService.batchUpdateDurations(facilityId, updates);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DURATION_SUCCESS.BATCH_UPDATED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật hàng loạt thời lượng khám' });
            }
        }
    }
}
