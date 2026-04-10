import { RoomServiceRepository } from '../../repository/Facility Management/room-service.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { ROOM_SERVICE_ERRORS } from '../../constants/room-service.constant';

/**
 * Service quản lý mapping phòng ↔ dịch vụ cơ sở.
 */
export class RoomServiceService {

    /**
     * Gán danh sách dịch vụ cho phòng
     */
    static async assignServices(roomId: string, facilityServiceIds: string[]): Promise<{ assigned: number }> {
        if (!facilityServiceIds || !Array.isArray(facilityServiceIds) || facilityServiceIds.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_IDS', ROOM_SERVICE_ERRORS.MISSING_SERVICE_IDS + ' (phải là mảng, vd: ["FS_abc"])');
        }

        const roomExists = await RoomServiceRepository.isRoomExists(roomId);
        if (!roomExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', ROOM_SERVICE_ERRORS.ROOM_NOT_FOUND);
        }

        // Validate từng service tồn tại
        for (const fsId of facilityServiceIds) {
            const exists = await RoomServiceRepository.isServiceExists(fsId);
            if (!exists) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', `${ROOM_SERVICE_ERRORS.SERVICE_NOT_FOUND} (${fsId})`);
            }
        }

        const assigned = await RoomServiceRepository.assignServices(roomId, facilityServiceIds);
        return { assigned };
    }

    /**
     * Lấy danh sách dịch vụ đã gán cho phòng
     */
    static async getServicesByRoom(roomId: string): Promise<any[]> {
        const roomExists = await RoomServiceRepository.isRoomExists(roomId);
        if (!roomExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', ROOM_SERVICE_ERRORS.ROOM_NOT_FOUND);
        }

        return await RoomServiceRepository.getServicesByRoom(roomId);
    }

    /**
     * Gỡ 1 dịch vụ khỏi phòng
     */
    static async removeService(roomId: string, facilityServiceId: string): Promise<void> {
        const success = await RoomServiceRepository.removeService(roomId, facilityServiceId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_ASSIGNED', ROOM_SERVICE_ERRORS.NOT_ASSIGNED);
        }
    }
}
