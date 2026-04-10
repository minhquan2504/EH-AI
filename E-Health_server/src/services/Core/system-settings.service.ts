import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { FacilityRepository } from '../../repository/Facility Management/facility.repository';
import { WorkingHoursConfig, UpdateWorkingHoursInput, SlotConfig, UpdateSlotConfigInput, } from '../../models/Core/system-settings.model';
import { WORKING_HOURS_ERRORS, SYSTEM_ERRORS, DAY_OF_WEEK_LABELS, DEFAULT_SLOT_CONFIG, } from '../../constants/system.constant';

/** Sinh ID cho operation_hours dựa trên facilityId và day_of_week */
const generateOperationHoursId = (facilityId: string) => (dayOfWeek: number): string =>
    `OH_${facilityId}_${dayOfWeek}`;

/** Sinh ID cho system_settings key */
const generateSettingId = (key: string): string =>
    `SS_${key}`;

export class SystemSettingsService {
    /**
     * Lấy cấu hình giờ làm việc 7 ngày của cơ sở y tế.
     * Nếu DB chưa có dữ liệu, trả về mảng rỗng (client tự khởi tạo mặc định).
     */
    static async getWorkingHours(): Promise<WorkingHoursConfig> {
        const facility = await FacilityRepository.getFacilityInfo();
        if (!facility) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        return await SystemSettingsRepository.getWorkingHours(facility.facilities_id);
    }

    /**
     * Validate và UPSERT cấu hình giờ làm việc.
     */
    static async updateWorkingHours(input: UpdateWorkingHoursInput): Promise<WorkingHoursConfig> {
        const facility = await FacilityRepository.getFacilityInfo();
        if (!facility) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        // Validate từng ngày
        for (const day of input.days) {
            if (day.day_of_week < 0 || day.day_of_week > 6 || !Number.isInteger(day.day_of_week)) {
                throw WORKING_HOURS_ERRORS.INVALID_DAY_OF_WEEK;
            }

            const isClosed = day.is_closed ?? false;
            if (!isClosed && day.open_time && day.close_time) {
                if (day.close_time <= day.open_time) {
                    throw WORKING_HOURS_ERRORS.INVALID_TIME_RANGE;
                }
            }
        }

        await SystemSettingsRepository.upsertWorkingHours(
            facility.facilities_id,
            input.days,
            generateOperationHoursId(facility.facilities_id),
        );

        return await SystemSettingsRepository.getWorkingHours(facility.facilities_id);
    }

    /**
     * Lấy cấu hình slot khám bệnh từ system_settings.
     */
    static async getSlotConfig(): Promise<SlotConfig> {
        return await SystemSettingsRepository.getSlotConfig();
    }

    /**
     * Validate và cập nhật cấu hình slot.
     */
    static async updateSlotConfig(
        input: UpdateSlotConfigInput,
        updatedBy: string,
    ): Promise<SlotConfig> {
        if (input.duration_minutes !== undefined) {
            const d = input.duration_minutes;
            if (d % 5 !== 0 || d < 5 || d > 120) {
                throw WORKING_HOURS_ERRORS.INVALID_SLOT_DURATION;
            }
        }

        if (input.max_patients_per_slot !== undefined) {
            const m = input.max_patients_per_slot;
            if (m < 1 || m > 20 || !Number.isInteger(m)) {
                throw WORKING_HOURS_ERRORS.INVALID_MAX_PATIENTS;
            }
        }

        await SystemSettingsRepository.upsertSlotConfig(input, updatedBy, generateSettingId);

        return await SystemSettingsRepository.getSlotConfig();
    }
}
