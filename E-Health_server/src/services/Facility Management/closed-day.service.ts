// src/services/Facility Management/closed-day.service.ts
import { ClosedDayRepository } from '../../repository/Facility Management/closed-day.repository';
import { OperatingHourRepository } from '../../repository/Facility Management/operating-hour.repository';
import { CreateClosedDayInput, ClosedDay, DAY_OF_WEEK_MAP } from '../../models/Facility Management/closed-day.model';
import { AppError } from '../../utils/app-error.util';

/** Giới hạn day_of_week hợp lệ */
const MIN_DAY = 0;
const MAX_DAY = 6;

/** Ngưỡng xác định ngày nghỉ "cả ngày" (00:00 → 23:59) */
const FULL_DAY_START = '00:01';
const FULL_DAY_END = '23:58';

export class ClosedDayService {

    /**
     * Gắn tên ngày tiếng Việt vào kết quả
     */
    private static enrichDayName(item: ClosedDay): ClosedDay {
        return { ...item, day_name: DAY_OF_WEEK_MAP[item.day_of_week] || `Day ${item.day_of_week}` };
    }

    /**
     * Kiểm tra xem khoảng giờ nghỉ có phủ "cả ngày" không.
     * Ví dụ: start_time = 00:00 và end_time = 23:59 → cả ngày.
     */
    private static isFullDayClosure(startTime: string, endTime: string): boolean {
        return startTime <= FULL_DAY_START && endTime >= FULL_DAY_END;
    }

    /**
     * Tạo ngày nghỉ cố định mới.
     * - Validate: day_of_week 0-6, start < end, chống overlap.
     * - Auto-sync: Nếu ngày nghỉ cả ngày → set is_closed = true ở bảng Operating Hours.
     */
    static async createClosedDay(input: CreateClosedDayInput): Promise<ClosedDay> {
        // Validate day_of_week
        if (input.day_of_week < MIN_DAY || input.day_of_week > MAX_DAY) {
            throw new AppError(400, 'INVALID_DAY', `day_of_week phải nằm trong khoảng ${MIN_DAY}-${MAX_DAY} (0=CN, 6=T7).`);
        }

        // Validate thời gian
        if (!input.start_time || !input.end_time) {
            throw new AppError(400, 'MISSING_TIME', 'Bắt buộc phải có start_time và end_time.');
        }
        if (input.start_time >= input.end_time) {
            throw new AppError(400, 'INVALID_TIME_RANGE', 'start_time phải nhỏ hơn end_time.');
        }

        // Kiểm tra overlap với ngày nghỉ hiện có
        const overlap = await ClosedDayRepository.findOverlapping(
            input.facility_id, input.day_of_week, input.start_time, input.end_time
        );
        if (overlap) {
            const dayName = DAY_OF_WEEK_MAP[input.day_of_week] || `Day ${input.day_of_week}`;
            throw new AppError(409, 'OVERLAP_CLOSED_DAY',
                `${dayName} đã có ngày nghỉ "${overlap.title}" (${overlap.start_time} - ${overlap.end_time}) bị chồng chéo.`
            );
        }

        const result = await ClosedDayRepository.create(input);

        // [AUTO-SYNC] Nếu nghỉ cả ngày → đồng bộ is_closed = true ở Operating Hours
        if (this.isFullDayClosure(input.start_time, input.end_time)) {
            await OperatingHourRepository.updateIsClosedByFacilityAndDay(
                input.facility_id, input.day_of_week, true
            );
        }

        return this.enrichDayName(result);
    }

    /**
     * Lấy danh sách ngày nghỉ (filter facility_id tùy chọn)
     */
    static async getClosedDays(facilityId?: string): Promise<ClosedDay[]> {
        const data = await ClosedDayRepository.findAll(facilityId);
        return data.map(item => this.enrichDayName(item));
    }

    /**
     * Xóa mềm ngày nghỉ.
     */
    static async deleteClosedDay(id: string): Promise<void> {
        // Lấy thông tin ngày nghỉ trước khi xóa (để biết facility_id + day_of_week)
        const closedDay = await ClosedDayRepository.findById(id);
        if (!closedDay) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy ngày nghỉ hoặc đã bị xóa.');
        }

        const wasFullDay = this.isFullDayClosure(closedDay.start_time, closedDay.end_time);

        await ClosedDayRepository.softDelete(id);

        // Nếu ngày nghỉ cả ngày vừa bị xóa → kiểm tra còn ngày nghỉ nào khác không
        if (wasFullDay) {
            const remaining = await ClosedDayRepository.countByFacilityAndDay(
                closedDay.facility_id, closedDay.day_of_week
            );
            // Nếu không còn ngày nghỉ nào active → bỏ cờ is_closed
            if (remaining === 0) {
                await OperatingHourRepository.updateIsClosedByFacilityAndDay(
                    closedDay.facility_id, closedDay.day_of_week, false
                );
            }
        }
    }
}
