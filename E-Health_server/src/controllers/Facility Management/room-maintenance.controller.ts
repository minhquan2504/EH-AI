import { Request, Response } from 'express';
import { RoomMaintenanceService } from '../../services/Facility Management/room-maintenance.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_MAINTENANCE_SUCCESS } from '../../constants/room-maintenance.constant';

/**
 * Controller quản lý lịch bảo trì phòng.
 */
export class RoomMaintenanceController {

    /**
     * POST /api/room-maintenance/:roomId — Tạo lịch bảo trì
     */
    static async createMaintenance(req: Request, res: Response): Promise<void> {
        try {
            const roomId = req.params.roomId as string;
            const createdBy = (req as any).auth?.user_id;
            const { start_date, end_date, reason } = req.body;

            const data = await RoomMaintenanceService.createMaintenance(
                roomId, start_date, end_date, reason || null, createdBy
            );

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.CREATED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lịch bảo trì' });
            }
        }
    }

    /**
     * GET /api/room-maintenance/:roomId — Lịch bảo trì của phòng
     */
    static async getMaintenanceByRoom(req: Request, res: Response): Promise<void> {
        try {
            const roomId = req.params.roomId as string;
            const data = await RoomMaintenanceService.getMaintenanceByRoom(roomId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.LIST_FETCHED,
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
     * DELETE /api/room-maintenance/schedule/:maintenanceId — Huỷ lịch bảo trì
     */
    static async deleteMaintenance(req: Request, res: Response): Promise<void> {
        try {
            const maintenanceId = req.params.maintenanceId as string;
            await RoomMaintenanceService.deleteMaintenance(maintenanceId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.DELETED,
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
     * GET /api/room-maintenance/active — DS phòng đang/sắp bảo trì
     */
    static async getActiveMaintenances(req: Request, res: Response): Promise<void> {
        try {
            const data = await RoomMaintenanceService.getActiveMaintenances();

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ROOM_MAINTENANCE_SUCCESS.ACTIVE_FETCHED,
                data,
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
        }
    }
}
