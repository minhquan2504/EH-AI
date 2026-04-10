import { ShiftServiceRepository } from '../../repository/Appointment Management/shift-service.repository';
import { ShiftService } from '../../models/Appointment Management/shift-service.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SHIFT_SERVICE_ERRORS } from '../../constants/shift-service.constant';

/**
 * Service quản lý liên kết ca khám – dịch vụ.
 * Cho phép phân chia dịch vụ nào khả dụng ở ca nào.
 */
export class ShiftServiceService {

    /**
     * Gán 1 dịch vụ cho 1 ca khám
     */
    static async create(shiftId: string, facilityServiceId: string): Promise<ShiftService> {
        if (!shiftId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', SHIFT_SERVICE_ERRORS.MISSING_SHIFT_ID);
        }
        if (!facilityServiceId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_ID', SHIFT_SERVICE_ERRORS.MISSING_SERVICE_ID);
        }

        // Validate shift tồn tại + active
        const shiftActive = await ShiftServiceRepository.isShiftActive(shiftId);
        if (!shiftActive) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', SHIFT_SERVICE_ERRORS.SHIFT_NOT_FOUND);
        }

        // Validate facility_service tồn tại + active
        const serviceActive = await ShiftServiceRepository.isFacilityServiceActive(facilityServiceId);
        if (!serviceActive) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', SHIFT_SERVICE_ERRORS.SERVICE_NOT_FOUND);
        }

        // Kiểm tra mapping đã tồn tại
        const exists = await ShiftServiceRepository.mappingExists(shiftId, facilityServiceId);
        if (exists) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'MAPPING_EXISTS', SHIFT_SERVICE_ERRORS.MAPPING_EXISTS);
        }

        return await ShiftServiceRepository.create(shiftId, facilityServiceId);
    }

    /**
     * Gán hàng loạt dịch vụ cho 1 ca khám
     */
    static async bulkCreate(shiftId: string, facilityServiceIds: string[]): Promise<{
        created: ShiftService[];
        total_requested: number;
    }> {
        if (!shiftId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', SHIFT_SERVICE_ERRORS.MISSING_SHIFT_ID);
        }
        if (!facilityServiceIds || facilityServiceIds.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_IDS', SHIFT_SERVICE_ERRORS.MISSING_SERVICE_IDS);
        }

        // Validate shift
        const shiftActive = await ShiftServiceRepository.isShiftActive(shiftId);
        if (!shiftActive) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', SHIFT_SERVICE_ERRORS.SHIFT_NOT_FOUND);
        }

        // Validate từng facility_service
        for (const fsId of facilityServiceIds) {
            const serviceActive = await ShiftServiceRepository.isFacilityServiceActive(fsId);
            if (!serviceActive) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', `${SHIFT_SERVICE_ERRORS.SERVICE_NOT_FOUND} (${fsId})`);
            }
        }

        const created = await ShiftServiceRepository.bulkCreate(shiftId, facilityServiceIds);

        return {
            created,
            total_requested: facilityServiceIds.length,
        };
    }

    /**
     * Lấy danh sách liên kết (filter tuỳ chọn)
     */
    static async getAll(shiftId?: string, facilityServiceId?: string): Promise<ShiftService[]> {
        return await ShiftServiceRepository.findAll(shiftId, facilityServiceId);
    }

    /**
     * Lấy danh sách dịch vụ thuộc 1 ca
     */
    static async getByShift(shiftId: string): Promise<ShiftService[]> {
        const shiftActive = await ShiftServiceRepository.isShiftActive(shiftId);
        if (!shiftActive) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', SHIFT_SERVICE_ERRORS.SHIFT_NOT_FOUND);
        }

        return await ShiftServiceRepository.findByShift(shiftId);
    }

    /**
     * Lấy danh sách ca khám hỗ trợ 1 dịch vụ
     */
    static async getByService(facilityServiceId: string): Promise<ShiftService[]> {
        const serviceActive = await ShiftServiceRepository.isFacilityServiceActive(facilityServiceId);
        if (!serviceActive) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', SHIFT_SERVICE_ERRORS.SERVICE_NOT_FOUND);
        }

        return await ShiftServiceRepository.findByService(facilityServiceId);
    }

    /**
     * Xoá liên kết ca-dịch vụ
     */
    static async delete(shiftServiceId: string): Promise<void> {
        const existing = await ShiftServiceRepository.findById(shiftServiceId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'MAPPING_NOT_FOUND', SHIFT_SERVICE_ERRORS.MAPPING_NOT_FOUND);
        }

        const success = await ShiftServiceRepository.delete(shiftServiceId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'MAPPING_NOT_FOUND', SHIFT_SERVICE_ERRORS.MAPPING_NOT_FOUND);
        }
    }

    /**
     * Bật/tắt liên kết ca-dịch vụ
     */
    static async toggle(shiftServiceId: string, isActive: boolean): Promise<ShiftService> {
        const existing = await ShiftServiceRepository.findById(shiftServiceId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'MAPPING_NOT_FOUND', SHIFT_SERVICE_ERRORS.MAPPING_NOT_FOUND);
        }

        const updated = await ShiftServiceRepository.toggleActive(shiftServiceId, isActive);
        if (!updated) {
            throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi cập nhật trạng thái.');
        }

        return updated;
    }
}
