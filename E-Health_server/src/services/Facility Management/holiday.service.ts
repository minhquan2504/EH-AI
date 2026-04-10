// src/services/Facility Management/holiday.service.ts
import { HolidayRepository } from '../../repository/Facility Management/holiday.repository';
import { CreateHolidayInput, UpdateHolidayInput, Holiday } from '../../models/Facility Management/holiday.model';
import { AppError } from '../../utils/app-error.util';

export class HolidayService {

    /**
     * Tạo ngày lễ mới.
     */
    static async createHoliday(input: CreateHolidayInput): Promise<Holiday> {
        // Mặc định is_closed = true nếu không truyền
        const isClosed = input.is_closed !== undefined ? input.is_closed : true;

        // Nếu mở giờ đặc biệt → bắt buộc có special_open_time và special_close_time
        if (!isClosed) {
            if (!input.special_open_time || !input.special_close_time) {
                throw new AppError(400, 'MISSING_SPECIAL_TIME',
                    'Khi ngày lễ mở cửa (is_closed=false), bắt buộc phải có special_open_time và special_close_time.'
                );
            }
            if (input.special_open_time >= input.special_close_time) {
                throw new AppError(400, 'INVALID_TIME_RANGE', 'special_open_time phải nhỏ hơn special_close_time.');
            }
        }

        // Kiểm tra trùng (facility_id + holiday_date)
        const existing = await HolidayRepository.findByFacilityAndDate(input.facility_id, input.holiday_date);
        if (existing) {
            throw new AppError(409, 'DUPLICATE_HOLIDAY',
                `Cơ sở này đã có ngày lễ "${existing.title}" vào ngày ${input.holiday_date}.`
            );
        }

        return await HolidayRepository.create({ ...input, is_closed: isClosed });
    }

    /**
     * Lấy danh sách ngày lễ (có filter)
     */
    static async getHolidays(filters: {
        facilityId?: string;
        year?: number;
        from?: string;
        to?: string;
    }): Promise<Holiday[]> {
        return await HolidayRepository.findAll(filters);
    }

    /**
     * Lấy chi tiết 1 ngày lễ
     */
    static async getHolidayById(id: string): Promise<Holiday> {
        const data = await HolidayRepository.findById(id);
        if (!data) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy ngày lễ.');
        }
        return data;
    }

    /**
     * Cập nhật ngày lễ.
     */
    static async updateHoliday(id: string, input: UpdateHolidayInput): Promise<Holiday> {
        const existing = await HolidayRepository.findById(id);
        if (!existing) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy ngày lễ.');
        }

        // Merge trạng thái cuối cùng
        const finalIsClosed = input.is_closed !== undefined ? input.is_closed : existing.is_closed;
        const finalOpenTime = input.special_open_time !== undefined ? input.special_open_time : existing.special_open_time;
        const finalCloseTime = input.special_close_time !== undefined ? input.special_close_time : existing.special_close_time;

        // Nếu mở cửa đặc biệt → validate giờ
        if (!finalIsClosed) {
            if (!finalOpenTime || !finalCloseTime) {
                throw new AppError(400, 'MISSING_SPECIAL_TIME',
                    'Khi ngày lễ mở cửa (is_closed=false), bắt buộc phải có special_open_time và special_close_time.'
                );
            }
            if (finalOpenTime >= finalCloseTime) {
                throw new AppError(400, 'INVALID_TIME_RANGE', 'special_open_time phải nhỏ hơn special_close_time.');
            }
        }

        const result = await HolidayRepository.update(id, input);
        return result!;
    }

    /**
     * Xóa mềm ngày lễ
     */
    static async deleteHoliday(id: string): Promise<void> {
        const deleted = await HolidayRepository.softDelete(id);
        if (!deleted) {
            throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy ngày lễ hoặc đã bị xóa.');
        }
    }
}
