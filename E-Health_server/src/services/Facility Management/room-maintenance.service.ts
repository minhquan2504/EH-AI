import { RoomMaintenanceRepository } from '../../repository/Facility Management/room-maintenance.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_MAINTENANCE_ERRORS } from '../../constants/room-maintenance.constant';

/**
 * Service quản lý lịch bảo trì phòng.
 * Hỗ trợ đặt lịch bảo trì theo date range + kiểm tra trùng lấp.
 */
export class RoomMaintenanceService {

    /** Validate định dạng ngày */
    private static isValidDate(dateStr: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr + 'T00:00:00').getTime());
    }

    /**
     * Tạo lịch bảo trì
     */
    static async createMaintenance(
        roomId: string,
        startDate: string,
        endDate: string,
        reason: string | null,
        createdBy: string | null
    ): Promise<any> {
        // Validate input
        if (!startDate || !endDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATES', ROOM_MAINTENANCE_ERRORS.MISSING_DATES);
        }
        if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', ROOM_MAINTENANCE_ERRORS.INVALID_DATE_FORMAT);
        }
        if (new Date(endDate) < new Date(startDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', ROOM_MAINTENANCE_ERRORS.INVALID_DATE_RANGE);
        }

        // Validate phòng tồn tại
        const roomExists = await RoomMaintenanceRepository.isRoomExists(roomId);
        if (!roomExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', ROOM_MAINTENANCE_ERRORS.ROOM_NOT_FOUND);
        }

        // Kiểm tra trùng lấp
        const hasOverlap = await RoomMaintenanceRepository.hasOverlap(roomId, startDate, endDate);
        if (hasOverlap) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'OVERLAP_EXISTS', ROOM_MAINTENANCE_ERRORS.OVERLAP_EXISTS);
        }

        return await RoomMaintenanceRepository.create(roomId, startDate, endDate, reason, createdBy);
    }

    /**
     * Lấy lịch bảo trì của 1 phòng
     */
    static async getMaintenanceByRoom(roomId: string): Promise<any[]> {
        const roomExists = await RoomMaintenanceRepository.isRoomExists(roomId);
        if (!roomExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', ROOM_MAINTENANCE_ERRORS.ROOM_NOT_FOUND);
        }
        return await RoomMaintenanceRepository.findByRoom(roomId);
    }

    /**
     * Huỷ lịch bảo trì (soft delete)
     */
    static async deleteMaintenance(maintenanceId: string): Promise<void> {
        const success = await RoomMaintenanceRepository.softDelete(maintenanceId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'MAINTENANCE_NOT_FOUND', ROOM_MAINTENANCE_ERRORS.MAINTENANCE_NOT_FOUND);
        }
    }

    /**
     * DS phòng đang/sắp bảo trì (tổng quát)
     */
    static async getActiveMaintenances(): Promise<any[]> {
        return await RoomMaintenanceRepository.getActiveMaintenances();
    }
}
