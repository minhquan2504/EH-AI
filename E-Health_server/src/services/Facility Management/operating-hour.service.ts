// src/services/Facility Management/operating-hour.service.ts
import { OperatingHourRepository } from '../../repository/Facility Management/operating-hour.repository';
import { ClosedDayRepository } from '../../repository/Facility Management/closed-day.repository';
import { CreateOperatingHourInput, UpdateOperatingHourInput, OperatingHour, DAY_OF_WEEK_MAP } from '../../models/Facility Management/operating-hour.model';
import { AppError } from '../../utils/app-error.util';

/** Giới hạn day_of_week hợp lệ */
const MIN_DAY = 0;
const MAX_DAY = 6;

export class OperatingHourService {

    /**
     * Gắn tên ngày tiếng Việt vào kết quả trả về
     */
    private static enrichDayName(item: OperatingHour): OperatingHour {
        return { ...item, day_name: DAY_OF_WEEK_MAP[item.day_of_week] || `Day ${item.day_of_week}` };
    }

    /**
     * Tạo mới cấu hình giờ hoạt động.
     * - Cross-validation: Nếu ngày đó đã có Closed Day cả ngày → cảnh báo.
     */
    static async createOperatingHour(input: CreateOperatingHourInput): Promise<OperatingHour> {
        // Validate day_of_week
        if (input.day_of_week < MIN_DAY || input.day_of_week > MAX_DAY) {
            throw new AppError(400, 'INVALID_DAY', `day_of_week phải nằm trong khoảng ${MIN_DAY}-${MAX_DAY} (0=CN, 6=T7).`);
        }

        // Nếu không đóng cửa thì bắt buộc có giờ mở/đóng
        if (!input.is_closed) {
            if (!input.open_time || !input.close_time) {
                throw new AppError(400, 'MISSING_TIME', 'Khi cơ sở mở cửa (is_closed=false), bắt buộc phải có open_time và close_time.');
            }
            if (input.open_time >= input.close_time) {
                throw new AppError(400, 'INVALID_TIME_RANGE', 'open_time phải nhỏ hơn close_time.');
            }
        }

        // Kiểm tra trùng lặp (facility_id + day_of_week)
        const existing = await OperatingHourRepository.findByFacilityAndDay(input.facility_id, input.day_of_week);
        if (existing) {
            const dayName = DAY_OF_WEEK_MAP[input.day_of_week] || `Day ${input.day_of_week}`;
            throw new AppError(409, 'DUPLICATE_OPERATING_HOUR', `Cơ sở này đã có cấu hình giờ hoạt động cho ${dayName}.`);
        }

        // [CROSS-VALIDATION] Cảnh báo nếu ngày đó đã có Closed Day cả ngày
        if (!input.is_closed) {
            const hasFullClosure = await ClosedDayRepository.hasFullDayClosure(input.facility_id, input.day_of_week);
            if (hasFullClosure) {
                const dayName = DAY_OF_WEEK_MAP[input.day_of_week] || `Day ${input.day_of_week}`;
                throw new AppError(409, 'CONFLICT_CLOSED_DAY',
                    `${dayName} đã được thiết lập nghỉ cả ngày trong Closed Days. Vui lòng xóa ngày nghỉ trước khi tạo giờ hoạt động mở cửa.`
                );
            }
        }

        const result = await OperatingHourRepository.create(input);
        return this.enrichDayName(result);
    }

    /**
     * Lấy danh sách giờ hoạt động (filter facility_id tùy chọn)
     */
    static async getOperatingHours(facilityId?: string): Promise<OperatingHour[]> {
        const data = await OperatingHourRepository.findAll(facilityId);
        return data.map(item => this.enrichDayName(item));
    }

    /**
     * Lấy chi tiết 1 cấu hình giờ hoạt động
     */
    static async getOperatingHourById(id: string): Promise<OperatingHour> {
        const data = await OperatingHourRepository.findById(id);
        if (!data) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy cấu hình giờ hoạt động.');
        }
        return this.enrichDayName(data);
    }

    /**
     * Cập nhật giờ hoạt động.
     * - Cross-validation: Nếu set is_closed = false (mở cửa) mà ngày đó có Closed Day → cảnh báo.
     */
    static async updateOperatingHour(id: string, input: UpdateOperatingHourInput): Promise<OperatingHour> {
        const existing = await OperatingHourRepository.findById(id);
        if (!existing) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy cấu hình giờ hoạt động.');
        }

        // Xác định trạng thái is_closed cuối cùng sau khi merge
        const finalIsClosed = input.is_closed !== undefined ? input.is_closed : existing.is_closed;
        const finalOpenTime = input.open_time !== undefined ? input.open_time : existing.open_time;
        const finalCloseTime = input.close_time !== undefined ? input.close_time : existing.close_time;

        if (!finalIsClosed && finalOpenTime >= finalCloseTime) {
            throw new AppError(400, 'INVALID_TIME_RANGE', 'open_time phải nhỏ hơn close_time.');
        }

        // [CROSS-VALIDATION] Nếu chuyển từ đóng cửa → mở cửa, kiểm tra Closed Day
        if (existing.is_closed && !finalIsClosed) {
            const hasFullClosure = await ClosedDayRepository.hasFullDayClosure(existing.facility_id, existing.day_of_week);
            if (hasFullClosure) {
                const dayName = DAY_OF_WEEK_MAP[existing.day_of_week] || `Day ${existing.day_of_week}`;
                throw new AppError(409, 'CONFLICT_CLOSED_DAY',
                    `${dayName} đang được thiết lập nghỉ cả ngày trong Closed Days. Vui lòng xóa ngày nghỉ trước khi mở cửa.`
                );
            }
        }

        const result = await OperatingHourRepository.update(id, input);
        return this.enrichDayName(result!);
    }

    /**
     * Xóa mềm cấu hình giờ hoạt động
     */
    static async deleteOperatingHour(id: string): Promise<void> {
        const deleted = await OperatingHourRepository.softDelete(id);
        if (!deleted) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy cấu hình giờ hoạt động hoặc đã bị xóa.');
        }
    }
}
