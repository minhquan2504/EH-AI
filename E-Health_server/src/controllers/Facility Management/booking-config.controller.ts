import { Request, Response, NextFunction } from 'express';
import { BookingConfigService } from '../../services/Facility Management/booking-config.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

/**
 * Controller cho Module 2.12 – Cấu hình Quy tắc đặt khám.
 * Chỉ tiếp nhận HTTP Request, gọi Service và trả về HTTP Response.
 */
export class BookingConfigController {

    /**
     * Lấy cấu hình ĐÃ KẾT HỢP (Resolved) của chi nhánh.
     */
    static async getResolvedConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const branchId = req.params.branchId as string;
            const config = await BookingConfigService.getResolvedConfig(branchId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy cấu hình đặt khám (Resolved) thành công',
                data: config,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy cấu hình thô (Raw) từ DB.
     */
    static async getRawConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const branchId = req.params.branchId as string;
            const config = await BookingConfigService.getRawConfig(branchId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: config
                    ? 'Lấy cấu hình thô của chi nhánh thành công'
                    : 'Chi nhánh này chưa có cấu hình riêng, đang sử dụng cấu hình mặc định của hệ thống.',
                data: config,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật (UPSERT) cấu hình đặt khám cho chi nhánh.
     */
    static async upsertConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const branchId = req.params.branchId as string;
            const input = req.body;

            const config = await BookingConfigService.upsertBranchConfig(branchId, input);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Cập nhật cấu hình đặt khám cho chi nhánh thành công',
                data: config,
            });
        } catch (error) {
            next(error);
        }
    }
}
