import { LockedSlotRepository } from '../../repository/Appointment Management/locked-slot.repository';
import { LockedSlot, LockSlotsInput, LockByShiftInput } from '../../models/Appointment Management/locked-slot.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { LOCKED_SLOT_ERRORS } from '../../constants/locked-slot.constant';

/**
 * Service khoá slot khám bệnh theo ngày cụ thể.
 * Cho phép khoá từng slot hoặc toàn bộ slot trong 1 ca.
 */
export class LockedSlotService {

    /**
     * Validate ngày khoá >= hôm nay
     */
    private static validateDateNotPast(dateStr: string): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lockedDate = new Date(dateStr + 'T00:00:00');

        if (lockedDate.getTime() < today.getTime()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_PAST', LOCKED_SLOT_ERRORS.INVALID_DATE_PAST);
        }
    }

    /**
     * Khoá 1 hoặc nhiều slot theo ngày cụ thể
     */
    static async lockSlots(input: LockSlotsInput, userId: string): Promise<{
        locked: LockedSlot[];
        affected_appointments: number;
    }> {
        if (!input.slot_ids || input.slot_ids.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SLOT_IDS', LOCKED_SLOT_ERRORS.MISSING_SLOT_IDS);
        }

        if (!input.locked_date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_LOCKED_DATE', LOCKED_SLOT_ERRORS.MISSING_LOCKED_DATE);
        }

        this.validateDateNotPast(input.locked_date);

        // Validate từng slot tồn tại và active
        for (const slotId of input.slot_ids) {
            const isActive = await LockedSlotRepository.isSlotActive(slotId);
            if (!isActive) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', `${LOCKED_SLOT_ERRORS.SLOT_NOT_FOUND} (${slotId})`);
            }
        }

        // Đếm lịch hẹn bị ảnh hưởng (warning only, không block)
        const affectedCount = await LockedSlotRepository.countAffectedAppointments(input.slot_ids, input.locked_date);

        // Thực hiện khoá
        const locked = await LockedSlotRepository.lockSlots(
            input.slot_ids,
            input.locked_date,
            input.lock_reason || null,
            userId
        );

        return {
            locked,
            affected_appointments: affectedCount,
        };
    }

    /**
     * Lấy danh sách slot đã khoá (filter theo ngày, shift, slot)
     */
    static async getLockedSlots(date: string, shiftId?: string, slotId?: string): Promise<LockedSlot[]> {
        if (!date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_LOCKED_DATE', LOCKED_SLOT_ERRORS.MISSING_LOCKED_DATE);
        }

        return await LockedSlotRepository.getLockedSlots(date, shiftId, slotId);
    }

    /**
     * Mở khoá slot
     */
    static async unlockSlot(lockedSlotId: string): Promise<void> {
        const existing = await LockedSlotRepository.findById(lockedSlotId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'LOCKED_SLOT_NOT_FOUND', LOCKED_SLOT_ERRORS.LOCKED_SLOT_NOT_FOUND);
        }

        const success = await LockedSlotRepository.unlockSlot(lockedSlotId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'LOCKED_SLOT_NOT_FOUND', LOCKED_SLOT_ERRORS.LOCKED_SLOT_NOT_FOUND);
        }
    }

    /**
     * Khoá tất cả slot trong 1 ca theo ngày cụ thể
     */
    static async lockByShift(input: LockByShiftInput, userId: string): Promise<{
        locked: LockedSlot[];
        total_slots_in_shift: number;
        affected_appointments: number;
    }> {
        if (!input.shift_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', LOCKED_SLOT_ERRORS.MISSING_SHIFT_ID);
        }

        if (!input.locked_date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_LOCKED_DATE', LOCKED_SLOT_ERRORS.MISSING_LOCKED_DATE);
        }

        this.validateDateNotPast(input.locked_date);

        // Kiểm tra shift tồn tại
        const shiftExists = await LockedSlotRepository.isShiftExists(input.shift_id);
        if (!shiftExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', LOCKED_SLOT_ERRORS.SHIFT_NOT_FOUND);
        }

        // Lấy tất cả slot active thuộc shift
        const slotIds = await LockedSlotRepository.getActiveSlotIdsByShift(input.shift_id);
        if (slotIds.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_ACTIVE_SLOTS', LOCKED_SLOT_ERRORS.NO_ACTIVE_SLOTS);
        }

        // Đếm lịch hẹn bị ảnh hưởng
        const affectedCount = await LockedSlotRepository.countAffectedAppointments(slotIds, input.locked_date);

        // Thực hiện khoá batch
        const locked = await LockedSlotRepository.lockSlots(
            slotIds,
            input.locked_date,
            input.lock_reason || null,
            userId
        );

        return {
            locked,
            total_slots_in_shift: slotIds.length,
            affected_appointments: affectedCount,
        };
    }

    /**
     * Mở khoá tất cả slot trong 1 ca theo ngày cụ thể
     */
    static async unlockByShift(shiftId: string, lockedDate: string): Promise<{ unlocked_count: number }> {
        if (!shiftId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', LOCKED_SLOT_ERRORS.MISSING_SHIFT_ID);
        }

        if (!lockedDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_LOCKED_DATE', LOCKED_SLOT_ERRORS.MISSING_LOCKED_DATE);
        }

        // Kiểm tra shift tồn tại
        const shiftExists = await LockedSlotRepository.isShiftExists(shiftId);
        if (!shiftExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', LOCKED_SLOT_ERRORS.SHIFT_NOT_FOUND);
        }

        const unlockedCount = await LockedSlotRepository.unlockByShift(shiftId, lockedDate);

        if (unlockedCount === 0) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NO_LOCKED_SLOTS_IN_SHIFT', LOCKED_SLOT_ERRORS.NO_LOCKED_SLOTS_IN_SHIFT);
        }

        return { unlocked_count: unlockedCount };
    }
}
