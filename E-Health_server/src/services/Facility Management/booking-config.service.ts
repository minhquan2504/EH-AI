import crypto from 'crypto';
import { BookingConfigRepository } from '../../repository/Facility Management/booking-config.repository';
import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { ResolvedBookingConfig, UpdateBookingConfigInput } from '../../models/Facility Management/booking-config.model';
import {
    DEFAULT_BOOKING_CONFIG,
    GLOBAL_FALLBACK_KEYS,
    BOOKING_CONFIG_LIMITS,
    BOOKING_CONFIG_ERRORS,
} from '../../constants/booking-config.constant';

/**
 * Sinh Config ID duy nhất: BKCFG_xxxxxxxx
 */
const generateConfigId = (): string =>
    `BKCFG_${crypto.randomBytes(4).toString('hex')}`;


export class BookingConfigService {

    /**
     * Lấy cấu hình ĐÃ KẾT HỢP (Resolved) của chi nhánh.
     */
    static async getResolvedConfig(branchId: string): Promise<ResolvedBookingConfig> {
        // Kiểm tra chi nhánh tồn tại
        const facilityId = await BookingConfigRepository.getBranchFacilityId(branchId);
        if (!facilityId) throw BOOKING_CONFIG_ERRORS.BRANCH_NOT_FOUND;

        // Lấy cấu hình Branch (có thể null nếu chưa setup)
        const branchConfig = await BookingConfigRepository.getRawConfigByBranch(branchId);

        // Lấy cấu hình Global từ system_settings
        const globalSlotConfig = await SystemSettingsRepository.getSlotConfig();
        const globalValues: Record<string, number | null> = {
            max_patients_per_slot: globalSlotConfig.max_patients_per_slot,
        };

        // Lấy thêm business rules liên quan
        const advanceRule = await SystemSettingsRepository.getBusinessRuleByKey(
            GLOBAL_FALLBACK_KEYS.advance_booking_days,
        );
        if (advanceRule) globalValues.advance_booking_days = advanceRule.value as number;

        const cancelRule = await SystemSettingsRepository.getBusinessRuleByKey(
            GLOBAL_FALLBACK_KEYS.cancellation_allowed_hours,
        );
        if (cancelRule) globalValues.cancellation_allowed_hours = cancelRule.value as number;

        // Resolve: Branch → Global → Default
        const resolve = (field: keyof typeof DEFAULT_BOOKING_CONFIG, branchVal: number | null | undefined): { value: number; source: 'branch' | 'global' | 'default' } => {
            if (branchVal !== null && branchVal !== undefined) {
                return { value: branchVal, source: 'branch' };
            }
            const globalVal = globalValues[field.toLowerCase()];
            if (globalVal !== null && globalVal !== undefined) {
                return { value: globalVal, source: 'global' };
            }
            return { value: DEFAULT_BOOKING_CONFIG[field], source: 'default' };
        };

        const maxPatients = resolve('MAX_PATIENTS_PER_SLOT', branchConfig?.max_patients_per_slot);
        const bufferDuration = resolve('BUFFER_DURATION', branchConfig?.buffer_duration);
        const advanceDays = resolve('ADVANCE_BOOKING_DAYS', branchConfig?.advance_booking_days);
        const minHours = resolve('MINIMUM_BOOKING_HOURS', branchConfig?.minimum_booking_hours);
        const cancelHours = resolve('CANCELLATION_ALLOWED_HOURS', branchConfig?.cancellation_allowed_hours);

        return {
            branch_id: branchId,
            max_patients_per_slot: maxPatients.value,
            buffer_duration: bufferDuration.value,
            advance_booking_days: advanceDays.value,
            minimum_booking_hours: minHours.value,
            cancellation_allowed_hours: cancelHours.value,
            sources: {
                max_patients_per_slot: maxPatients.source,
                buffer_duration: bufferDuration.source,
                advance_booking_days: advanceDays.source,
                minimum_booking_hours: minHours.source,
                cancellation_allowed_hours: cancelHours.source,
            },
        };
    }

    /**
     * Lấy cấu hình thô (Raw) từ DB cho form Admin chỉnh sửa.
     */
    static async getRawConfig(branchId: string) {
        const facilityId = await BookingConfigRepository.getBranchFacilityId(branchId);
        if (!facilityId) throw BOOKING_CONFIG_ERRORS.BRANCH_NOT_FOUND;

        return await BookingConfigRepository.getRawConfigByBranch(branchId);
    }

    /**
     * Tạo mới hoặc cập nhật cấu hình cho chi nhánh (UPSERT).
     */
    static async upsertBranchConfig(branchId: string, input: UpdateBookingConfigInput): Promise<ResolvedBookingConfig> {
        // Kiểm tra chi nhánh tồn tại, lấy facility_id
        const facilityId = await BookingConfigRepository.getBranchFacilityId(branchId);
        if (!facilityId) throw BOOKING_CONFIG_ERRORS.BRANCH_NOT_FOUND;

        // Validate từng field
        if (input.max_patients_per_slot !== undefined && input.max_patients_per_slot !== null) {
            const v = input.max_patients_per_slot;
            if (!Number.isInteger(v) || v < BOOKING_CONFIG_LIMITS.MAX_PATIENTS_PER_SLOT.min || v > BOOKING_CONFIG_LIMITS.MAX_PATIENTS_PER_SLOT.max) {
                throw BOOKING_CONFIG_ERRORS.INVALID_MAX_PATIENTS;
            }
        }

        if (input.buffer_duration !== undefined && input.buffer_duration !== null) {
            const v = input.buffer_duration;
            if (!Number.isInteger(v) || v < BOOKING_CONFIG_LIMITS.BUFFER_DURATION.min || v > BOOKING_CONFIG_LIMITS.BUFFER_DURATION.max) {
                throw BOOKING_CONFIG_ERRORS.INVALID_BUFFER_DURATION;
            }
        }

        if (input.advance_booking_days !== undefined && input.advance_booking_days !== null) {
            const v = input.advance_booking_days;
            if (!Number.isInteger(v) || v < BOOKING_CONFIG_LIMITS.ADVANCE_BOOKING_DAYS.min || v > BOOKING_CONFIG_LIMITS.ADVANCE_BOOKING_DAYS.max) {
                throw BOOKING_CONFIG_ERRORS.INVALID_ADVANCE_DAYS;
            }
        }

        if (input.minimum_booking_hours !== undefined && input.minimum_booking_hours !== null) {
            const v = input.minimum_booking_hours;
            if (!Number.isInteger(v) || v < BOOKING_CONFIG_LIMITS.MINIMUM_BOOKING_HOURS.min || v > BOOKING_CONFIG_LIMITS.MINIMUM_BOOKING_HOURS.max) {
                throw BOOKING_CONFIG_ERRORS.INVALID_MIN_BOOKING_HOURS;
            }
        }

        if (input.cancellation_allowed_hours !== undefined && input.cancellation_allowed_hours !== null) {
            const v = input.cancellation_allowed_hours;
            if (!Number.isInteger(v) || v < BOOKING_CONFIG_LIMITS.CANCELLATION_ALLOWED_HOURS.min || v > BOOKING_CONFIG_LIMITS.CANCELLATION_ALLOWED_HOURS.max) {
                throw BOOKING_CONFIG_ERRORS.INVALID_CANCEL_HOURS;
            }
        }

        const configId = generateConfigId();
        await BookingConfigRepository.upsertConfig(configId, facilityId, branchId, input);

        return await this.getResolvedConfig(branchId);
    }
}
