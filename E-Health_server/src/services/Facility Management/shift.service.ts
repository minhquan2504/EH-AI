// src/services/shift.service.ts
import { ShiftRepository } from '../../repository/Facility Management/shift.repository';
import { CreateShiftInput, Shift, UpdateShiftInput } from '../../models/Facility Management/shift.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ShiftService {

    /**
     * Kiểm tra logic giờ mở phải nhỏ hơn giờ đóng
     */
    private static validateShiftTime(startTime: string, endTime: string): void {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TIME_FORMAT', 'Định dạng thời gian không hợp lệ. Vui lòng dùng định dạng HH:mm:ss');
        }

        const start = this.parseTimeToMinutes(startTime);
        const end = this.parseTimeToMinutes(endTime);

        if (start === end) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TIME_RANGE', 'Thời gian bắt đầu và kết thúc ca làm việc không được trùng nhau (0 phút)');
        }
    }

    /**
     * Parse HH:mm:ss sang phút để đối chiếu so sánh
     */
    private static parseTimeToMinutes(timeString: string): number {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }

    /**
     * Thêm mới Ca làm việc
     */
    static async createShift(input: CreateShiftInput): Promise<Shift> {
        // Kiểm tra tồn tại
        const existShift = await ShiftRepository.getShiftByCode(input.code);
        if (existShift) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SHIFT_CODE_EXISTS', `Mã Ca làm việc '${input.code}' đã tồn tại trong hệ thống`);
        }

        // Validate thời gian
        this.validateShiftTime(input.start_time, input.end_time);

        return await ShiftRepository.createShift(input);
    }

    /**
     * Lấy danh sách Ca làm việc
     */
    static async getShifts(facilityId?: string, status?: string, keyword?: string): Promise<Shift[]> {
        return await ShiftRepository.getShifts(facilityId, status, keyword);
    }

    /**
     * Lấy Chi tiết Ca làm
     */
    static async getShiftById(id: string): Promise<Shift> {
        const shift = await ShiftRepository.getShiftById(id);
        if (!shift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Không tìm thấy thông tin ca làm việc quy định');
        }
        return shift;
    }

    /**
     * Cập nhật Ca làm việc
     */
    static async updateShift(id: string, updateData: UpdateShiftInput): Promise<Shift> {
        const existShift = await ShiftRepository.getShiftById(id);
        if (!existShift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Không tìm thấy thông tin ca làm việc để cập nhật');
        }

        if (updateData.code && updateData.code !== existShift.code) {
            const codeCheck = await ShiftRepository.getShiftByCode(updateData.code);
            if (codeCheck) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SHIFT_CODE_EXISTS', `Không thể đổi sang Mã ca làm '${updateData.code}', mã này đã được sử dụng rồi`);
            }
        }

        const startTime = updateData.start_time || existShift.start_time;
        const endTime = updateData.end_time || existShift.end_time;
        this.validateShiftTime(startTime, endTime);

        const updatedShift = await ShiftRepository.updateShift(id, updateData);
        if (!updatedShift) {
            throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi cập nhật ca làm việc');
        }
        return updatedShift;
    }

    /**
     * Xóa Ca (Soft delete)
     */
    static async deleteShift(id: string): Promise<void> {
        const existShift = await ShiftRepository.getShiftById(id);
        if (!existShift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Không tìm thấy thông tin ca làm việc để xóa');
        }

        // Tại đây nếu mở rộng sẽ viết logic: Kiểm tra bảng staff_schedules xem ca này còn đang dính tới ai mở lịch trong tương lai không
        // Nếu có ai đang có lịch mở theo CA NÀY ở tuần sau -> Quăng lỗi không cho xóa. (To-do Phase tiếp theo)

        await ShiftRepository.softDeleteShift(id);
    }
}
