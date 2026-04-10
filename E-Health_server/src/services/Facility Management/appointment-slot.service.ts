// src/services/Facility Management/appointment-slot.service.ts
import { AppointmentSlotRepository } from '../../repository/Facility Management/appointment-slot.repository';
import { ShiftRepository } from '../../repository/Facility Management/shift.repository';
import { AppointmentSlot, CreateAppointmentSlotInput, BulkCreateAppointmentSlotInput, UpdateAppointmentSlotInput } from '../../models/Facility Management/appointment-slot.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class AppointmentSlotService {

    /**
     * Chuyển đổi HH:mm:ss thành Phút (Integer)
     */
    private static parseTimeToMinutes(timeString: string): number {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }

    /**
     * Chuyển đổi Phút về định dạng HH:mm:00
     */
    private static formatMinutesToTime(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const minutes = (totalMinutes % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:00`;
    }

    /**
     * Hàm check xem slot có nằm trọn trong shift không (hỗ trợ ca trực đêm qua 24h)
     */
    private static validateSlotTimeWithinShift(slotStartMinutes: number, slotEndMinutes: number, shiftStartMinutes: number, shiftEndMinutes: number): void {
        const normalizedShiftEnd = shiftStartMinutes <= shiftEndMinutes ? shiftEndMinutes : shiftEndMinutes + 1440;


        let normalizedSlotStart = slotStartMinutes;
        if (slotStartMinutes < shiftStartMinutes && shiftStartMinutes > shiftEndMinutes) {
            normalizedSlotStart += 1440;
        }

        let normalizedSlotEnd = slotEndMinutes;
        if (slotEndMinutes <= slotStartMinutes) {
            normalizedSlotEnd += 1440;
        } else if (slotStartMinutes < shiftStartMinutes && shiftStartMinutes > shiftEndMinutes) {
            normalizedSlotEnd += 1440;
        }

        if (normalizedSlotStart < shiftStartMinutes || normalizedSlotEnd > normalizedShiftEnd) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SLOT_TIME_OUT_OF_BOUNDS', 'Khung giờ của Slot Khám bệnh vượt ra ngoài Khung giờ quy định của Ca Làm Việc');
        }
    }

    /**
     * Tạo 1 Slot khám bệnh thủ công
     */
    static async createSlot(input: CreateAppointmentSlotInput): Promise<AppointmentSlot> {
        const shift = await ShiftRepository.getShiftById(input.shift_id);
        if (!shift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca làm việc không tồn tại trên hệ thống');
        }

        const slotStart = this.parseTimeToMinutes(input.start_time);
        const slotEnd = this.parseTimeToMinutes(input.end_time);

        if (slotStart === slotEnd) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_SLOT_TIME', 'Thời gian bắt đầu và kết thúc Slot không được trùng nhau');
        }

        const shiftStart = this.parseTimeToMinutes(shift.start_time);
        const shiftEnd = this.parseTimeToMinutes(shift.end_time);

        this.validateSlotTimeWithinShift(slotStart, slotEnd, shiftStart, shiftEnd);

        // Kiểm tra xem slot này có bị overlap (trùng) với bất kỳ slot nào khác trong cùng shift không
        const existingSlots = await AppointmentSlotRepository.getSlots(shift.shifts_id, true);
        for (const ext of existingSlots) {
            const extStart = this.parseTimeToMinutes(ext.start_time);
            const extEnd = this.parseTimeToMinutes(ext.end_time);
            // Logic Check overlap (rất phức tạp với ca đêm, nếu rảnh ta sẽ filter, hiện tại tạm cho phép hoặc check mảng tĩnh)
            if (slotStart === extStart && slotEnd === extEnd) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SLOT_DUPLICATED', 'Slot với khoảng thời gian này đã tồn tại trong Ca Làm Việc');
            }
        }

        return await AppointmentSlotRepository.createSlot(input);
    }

    /**
     * Vòng lặp Auto-gen toàn bộ các Slot theo Khoảng Thời gian (Interval)
     */
    static async bulkCreateSlots(input: BulkCreateAppointmentSlotInput): Promise<AppointmentSlot[]> {
        const shift = await ShiftRepository.getShiftById(input.shift_id);
        if (!shift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca làm việc không tồn tại trên hệ thống');
        }

        if (input.interval_minutes < 5 || input.interval_minutes > 120) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_INTERVAL', 'Interval time chỉ hỗ trợ từ 5 đến 120 phút');
        }

        const shiftStart = this.parseTimeToMinutes(shift.start_time);
        const shiftEnd = this.parseTimeToMinutes(shift.end_time);

        const normalizedEnd = shiftStart <= shiftEnd ? shiftEnd : shiftEnd + 1440;

        let currentStart = shiftStart;
        const slotsToCreate = [];

        // Chạy vòng lặp tịnh tiến minutes
        while (currentStart + input.interval_minutes <= normalizedEnd) {
            const end = currentStart + input.interval_minutes;

            slotsToCreate.push({
                shift_id: shift.shifts_id,
                start_time: this.formatMinutesToTime(currentStart % 1440),
                end_time: this.formatMinutesToTime(end % 1440)
            });

            currentStart = end;
        }

        if (slotsToCreate.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INTERVAL_TOO_LARGE', 'Khung giờ chia slot quá lớn so với độ dài của Ca làm việc');
        }

        // Lưu tuần tự (có thể optimize Bulk Insert SQL nếu scale lớn)
        const createdSlots = [];
        for (const slotData of slotsToCreate) {
            // Bỏ qua check trùng cho đơn giản trong lệnh Bulk, nhưng thực tế CSDL nên handle
            const slot = await AppointmentSlotRepository.createSlot(slotData);
            createdSlots.push(slot);
        }

        return createdSlots;
    }


    /*
    / Lấy danh sách các Slot khám bệnh
    */
    static async getSlots(shiftId?: string, isActive?: boolean): Promise<AppointmentSlot[]> {
        return await AppointmentSlotRepository.getSlots(shiftId, isActive);
    }


    /*
    / Lấy danh sách Slot theo ID
    */
    static async getSlotById(id: string): Promise<AppointmentSlot> {
        const slot = await AppointmentSlotRepository.getSlotById(id);
        if (!slot) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', 'Không tìm thấy Slot yêu cầu');
        }
        return slot;
    }


    /*
    / Cập nhật Slot khám bệnh
    */
    static async updateSlot(id: string, updateData: UpdateAppointmentSlotInput): Promise<AppointmentSlot> {
        const existing = await AppointmentSlotRepository.getSlotById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', 'Không tìm thấy Slot khám để cập nhật');
        }

        if (updateData.start_time || updateData.end_time || updateData.shift_id) {
            const shiftIdToCheck = updateData.shift_id || existing.shift_id;
            const shift = await ShiftRepository.getShiftById(shiftIdToCheck);
            if (!shift) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca làm việc chỉ định không tồn tại');
            }

            const slotStart = this.parseTimeToMinutes(updateData.start_time || existing.start_time);
            const slotEnd = this.parseTimeToMinutes(updateData.end_time || existing.end_time);

            const shiftStart = this.parseTimeToMinutes(shift.start_time);
            const shiftEnd = this.parseTimeToMinutes(shift.end_time);

            this.validateSlotTimeWithinShift(slotStart, slotEnd, shiftStart, shiftEnd);
        }

        const updated = await AppointmentSlotRepository.updateSlot(id, updateData);
        if (!updated) {
            throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Cập nhật thất bại');
        }
        return updated;
    }


    /*
    / Vô hiệu hóa Slot khám bệnh
    */
    static async disableSlot(id: string): Promise<void> {
        const existing = await AppointmentSlotRepository.getSlotById(id);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SLOT_NOT_FOUND', 'Không tìm thấy Slot khám để vô hiệu hóa');
        }
        await AppointmentSlotRepository.disableSlot(id);
    }
}
