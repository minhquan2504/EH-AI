import { Request, Response } from 'express';
import { RoomServiceService } from '../../services/Facility Management/room-service.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_SERVICE_SUCCESS } from '../../constants/room-service.constant';

/**
 * Controller quản lý mapping phòng ↔ dịch vụ.
 */
export class RoomServiceController {

    /**
     * POST /api/medical-rooms/:roomId/services — Gán dịch vụ cho phòng
     */
    static async assignServices(req: Request, res: Response): Promise<void> {
        try {
            const roomId = req.params.roomId as string;
            const { facility_service_ids } = req.body;

            const result = await RoomServiceService.assignServices(roomId, facility_service_ids);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.ASSIGNED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi gán dịch vụ' });
            }
        }
    }

    /**
     * GET /api/medical-rooms/:roomId/services — Xem dịch vụ đã gán
     */
    static async getServicesByRoom(req: Request, res: Response): Promise<void> {
        try {
            const roomId = req.params.roomId as string;
            const data = await RoomServiceService.getServicesByRoom(roomId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.LIST_FETCHED,
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
     * DELETE /api/medical-rooms/:roomId/services/:facilityServiceId — Gỡ dịch vụ
     */
    static async removeService(req: Request, res: Response): Promise<void> {
        try {
            const roomId = req.params.roomId as string;
            const facilityServiceId = req.params.facilityServiceId as string;

            await RoomServiceService.removeService(roomId, facilityServiceId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_SERVICE_SUCCESS.REMOVED,
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
