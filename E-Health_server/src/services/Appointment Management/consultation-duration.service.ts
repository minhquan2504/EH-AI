import { ConsultationDurationRepository, ServiceDurationRow } from '../../repository/Appointment Management/consultation-duration.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DURATION_LIMITS, DURATION_ERRORS } from '../../constants/consultation-duration.constant';

/**
 * Service quản lý thời lượng mỗi lượt khám.
 * Cho phép xem tổng hợp và cập nhật estimated_duration_minutes
 * cho các dịch vụ tại cơ sở y tế.
 */
export class ConsultationDurationService {

    /**
     * Validate giá trị thời lượng khám (phút)
     */
    private static validateDuration(minutes: number): void {
        if (!Number.isInteger(minutes) || minutes < DURATION_LIMITS.MIN_MINUTES || minutes > DURATION_LIMITS.MAX_MINUTES) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DURATION', DURATION_ERRORS.INVALID_DURATION);
        }
    }

    /**
     * Lấy danh sách thời lượng khám tất cả dịch vụ tại cơ sở
     */
    static async getServiceDurations(
        facilityId: string,
        isActive?: boolean,
        search?: string
    ): Promise<ServiceDurationRow[]> {
        const exists = await ConsultationDurationRepository.checkFacilityExists(facilityId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'FACILITY_NOT_FOUND', DURATION_ERRORS.FACILITY_NOT_FOUND);
        }

        return await ConsultationDurationRepository.getServiceDurations(facilityId, isActive, search);
    }

    /**
     * Cập nhật thời lượng khám cho 1 dịch vụ cơ sở
     */
    static async updateSingleDuration(
        facilityId: string,
        facilityServiceId: string,
        durationMinutes: number
    ): Promise<ServiceDurationRow> {
        const exists = await ConsultationDurationRepository.checkFacilityExists(facilityId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'FACILITY_NOT_FOUND', DURATION_ERRORS.FACILITY_NOT_FOUND);
        }

        const belongs = await ConsultationDurationRepository.belongsToFacility(facilityServiceId, facilityId);
        if (!belongs) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_BELONG', DURATION_ERRORS.SERVICE_NOT_BELONG);
        }

        this.validateDuration(durationMinutes);

        const updated = await ConsultationDurationRepository.updateDuration(facilityServiceId, durationMinutes);
        if (!updated) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', DURATION_ERRORS.SERVICE_NOT_FOUND);
        }

        return updated;
    }

    /**
     * Batch cập nhật thời lượng khám cho nhiều dịch vụ cơ sở
     */
    static async batchUpdateDurations(
        facilityId: string,
        updates: Array<{ facility_service_id: string; estimated_duration_minutes: number }>
    ): Promise<{ updated_count: number; total_requested: number }> {
        const exists = await ConsultationDurationRepository.checkFacilityExists(facilityId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'FACILITY_NOT_FOUND', DURATION_ERRORS.FACILITY_NOT_FOUND);
        }

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_UPDATES', DURATION_ERRORS.EMPTY_UPDATES);
        }

        // Validate từng item
        for (const item of updates) {
            if (!item.facility_service_id || item.estimated_duration_minutes === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_UPDATE_ITEM', DURATION_ERRORS.INVALID_UPDATE_ITEM);
            }
            this.validateDuration(item.estimated_duration_minutes);

            // Kiểm tra dịch vụ thuộc cơ sở
            const belongs = await ConsultationDurationRepository.belongsToFacility(item.facility_service_id, facilityId);
            if (!belongs) {
                throw new AppError(
                    HTTP_STATUS.NOT_FOUND,
                    'SERVICE_NOT_BELONG',
                    `Dịch vụ ${item.facility_service_id} không thuộc cơ sở được chỉ định.`
                );
            }
        }

        const updatedCount = await ConsultationDurationRepository.batchUpdateDurations(updates);

        return {
            updated_count: updatedCount,
            total_requested: updates.length,
        };
    }
}
