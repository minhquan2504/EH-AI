// src/services/Facility Management/staff-schedule.service.ts
import { StaffScheduleRepository } from '../../repository/Facility Management/staff-schedule.repository';
import { ShiftRepository } from '../../repository/Facility Management/shift.repository';
import { LeaveRepository } from '../../repository/Facility Management/leave.repository';
import { CreateStaffScheduleInput, StaffSchedule, UpdateStaffScheduleInput } from '../../models/Facility Management/staff-schedule.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class StaffScheduleService {

    /**
     * Helper check logic trùng giờ nội bộ tuyệt đối vắt qua ngày
     */
    private static isTimeOverlapping(date1: string | Date, start1: string, end1: string, date2: string | Date, start2: string, end2: string): boolean {
        const toUnixTime = (dObj: string | Date, tStr: string, isNextDay: boolean) => {
            const d = new Date(dObj);

            const y = d.getFullYear(); const m = d.getMonth(); const day = d.getDate();
            const [hh, mm] = tStr.split(':').map(Number);
            return Date.UTC(y, m, day, hh, mm, 0) + (isNextDay ? 86400000 : 0);
        };

        const tsStart1 = toUnixTime(date1, start1, false);
        const tsEnd1 = toUnixTime(date1, end1, start1 >= end1);
        const tsStart2 = toUnixTime(date2, start2, false);
        const tsEnd2 = toUnixTime(date2, end2, start2 >= end2);

        return tsStart1 < tsEnd2 && tsEnd1 > tsStart2;
    }

    /**
     * Phân công lịch làm việc mới
     */
    static async createSchedule(data: CreateStaffScheduleInput): Promise<StaffSchedule> {
        // Lấy thông tin Ca (Shift) để lấy được Start Time và End Time
        const shift = await ShiftRepository.getShiftById(data.shift_id);
        if (!shift) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca làm việc không tồn tại');
        }

        const newStartTime = shift.start_time;
        const newEndTime = shift.end_time;
        data.start_time = newStartTime;
        data.end_time = newEndTime;

        // Chặn xếp lịch vào ngày nhân viên đã có đơn nghỉ phép APPROVED
        const approvedLeave = await LeaveRepository.findApprovedLeaveByUserAndDate(data.user_id, data.working_date);
        if (approvedLeave) {
            const sDate = new Date(approvedLeave.start_date);
            const eDate = new Date(approvedLeave.end_date);
            const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'LEAVE_CONFLICT',
                `Nhân viên này đang có đơn nghỉ phép đã duyệt từ ${fmt(sDate)} đến ${fmt(eDate)} (Lý do: ${approvedLeave.reason}). Không thể xếp lịch vào ngày này.`
            );
        }
        const existingSchedules = await StaffScheduleRepository.findSchedulesByUserIdAndDateRange(data.user_id, data.working_date);

        for (const oldSchedule of existingSchedules) {
            if (this.isTimeOverlapping(data.working_date, newStartTime, newEndTime, oldSchedule.working_date, oldSchedule.start_time, oldSchedule.end_time)) {

                const d = new Date(oldSchedule.working_date);
                const dtStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

                throw new AppError(
                    HTTP_STATUS.BAD_REQUEST,
                    'SCHEDULE_OVERLAP',
                    `Nhân viên này đã có lịch làm việc vướng vào khoảng từ ${oldSchedule.start_time} (ngày ${dtStr}) đến ${oldSchedule.end_time}. Vui lòng chọn Ca khác.`
                );
            }
        }

        // Kiểm tra trùng phòng: 2 nhân viên khác nhau cùng phòng cùng giờ
        const roomSchedules = await StaffScheduleRepository.findSchedulesByRoomAndDate(data.medical_room_id, data.working_date);
        for (const roomSch of roomSchedules) {
            // Bỏ qua chính nhân viên đang xét (đã check ở trên)
            if (roomSch.user_id === data.user_id) continue;

            if (this.isTimeOverlapping(data.working_date, newStartTime, newEndTime, roomSch.working_date, roomSch.start_time, roomSch.end_time)) {
                throw new AppError(
                    HTTP_STATUS.BAD_REQUEST,
                    'ROOM_CONFLICT',
                    `Phòng này đã có nhân viên khác (${roomSch.user_id}) được xếp lịch từ ${roomSch.start_time} đến ${roomSch.end_time}. Vui lòng chọn phòng hoặc ca khác.`
                );
            }
        }

        // Kiểm tra phòng đang trong lịch bảo trì
        try {
            const { pool: dbPool } = await import('../../config/postgresdb');
            const maintenanceCheck = await dbPool.query(
                `SELECT 1 FROM room_maintenance_schedules
                 WHERE room_id = $1 AND $2::date BETWEEN start_date AND end_date AND deleted_at IS NULL LIMIT 1`,
                [data.medical_room_id, data.working_date]
            );
            if ((maintenanceCheck.rowCount ?? 0) > 0) {
                throw new AppError(
                    HTTP_STATUS.BAD_REQUEST,
                    'ROOM_MAINTENANCE',
                    'Phòng này đang trong thời gian bảo trì. Vui lòng chọn phòng khác.'
                );
            }
        } catch (e: any) {
            // Bỏ qua nếu bảng chưa tồn tại (chưa chạy migration)
            if (e instanceof AppError) throw e;
        }

        return await StaffScheduleRepository.create(data);
    }

    /**
     * Lấy danh sách lịch phân công có filter
     */
    static async getSchedules(filters: { staff_schedules_id?: string; user_id?: string; shift_id?: string; working_date?: string; medical_room_id?: string; branch_id?: string }): Promise<StaffSchedule[]> {

        if (filters.working_date) {
            const isDate = /^\d{4}-\d{2}-\d{2}$/.test(filters.working_date) || /^\d{4}-\d{2}-\d{2}T/.test(filters.working_date);
            if (!isDate) {

                return [];
            }
        }
        return await StaffScheduleRepository.findAll(filters);
    }

    /**
     * Lấy chi tiết lịch theo ID
     */
    static async getScheduleById(id: string): Promise<StaffSchedule> {
        const schedule = await StaffScheduleRepository.findById(id);
        if (!schedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch phân công không tồn tại');
        }
        return schedule;
    }

    /**
     * Cập nhật lịch làm việc
     */
    static async updateSchedule(id: string, data: UpdateStaffScheduleInput): Promise<StaffSchedule> {
        // Kiểm tra lịch tồn tại
        const existingSchedule = await StaffScheduleRepository.findById(id);
        if (!existingSchedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch phân công không tồn tại');
        }

        // Nếu có thay đổi Ca (Shift) hoặc Ngày (Working Date), cần kiểm tra lấp giờ lại
        let validateOverlap = false;
        let checkUserId = existingSchedule.user_id;
        let checkDate = (data.working_date) ? data.working_date : new Date(existingSchedule.working_date).toISOString().split('T')[0];
        let newStartTime = existingSchedule.start_time;
        let newEndTime = existingSchedule.end_time;

        if (data.shift_id && data.shift_id !== existingSchedule.shift_id) {
            const shift = await ShiftRepository.getShiftById(data.shift_id);
            if (!shift) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', 'Ca làm việc không tồn tại');
            }
            newStartTime = shift.start_time;
            newEndTime = shift.end_time;
            data.start_time = newStartTime;
            data.end_time = newEndTime;
            validateOverlap = true;
        }

        if (data.working_date && data.working_date !== checkDate) {
            validateOverlap = true;
        }

        if (validateOverlap) {
            const schedulesOfDay = await StaffScheduleRepository.findSchedulesByUserIdAndDateRange(checkUserId, checkDate);
            for (const oldSchedule of schedulesOfDay) {

                if (oldSchedule.staff_schedules_id === existingSchedule.staff_schedules_id) continue;

                if (this.isTimeOverlapping(checkDate, newStartTime, newEndTime, oldSchedule.working_date, oldSchedule.start_time, oldSchedule.end_time)) {
                    throw new AppError(
                        HTTP_STATUS.BAD_REQUEST,
                        'SCHEDULE_OVERLAP',
                        `Lịch cập nhật bị trùng giờ với một khoảng từ ${oldSchedule.start_time} đến ${oldSchedule.end_time} đang có trong ngày liên quan.`
                    );
                }
            }
        }

        const result = await StaffScheduleRepository.update(id, data);
        if (!result) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi cập nhật CSDL');
        return result;
    }

    /**
     * Xóa lịch làm việc (Chỉ xóa nếu lịch >= Hôm nay)
     */
    static async deleteSchedule(id: string): Promise<boolean> {
        const schedule = await StaffScheduleRepository.findById(id);
        if (!schedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch phân công không tồn tại');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const workingDate = new Date(schedule.working_date);

        if (workingDate.getTime() < today.getTime()) {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'PAST_SCHEDULE_DELETE_FORBIDDEN',
                'Không thể xóa lịch làm việc trong quá khứ để bảo vệ dữ liệu công. Chỉ có thể xóa lịch tương lai.'
            );
        }

        return await StaffScheduleRepository.delete(id);
    }

    /**
     * Tạm ngưng (Suspend) lịch làm việc
     */
    static async suspendSchedule(id: string): Promise<StaffSchedule> {
        const schedule = await StaffScheduleRepository.findById(id);
        if (!schedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch phân công không tồn tại');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const workingDate = new Date(schedule.working_date);

        if (workingDate.getTime() < today.getTime()) {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'PAST_SCHEDULE_SUSPEND_FORBIDDEN',
                'Không thể tạm ngưng lịch làm việc trong quá khứ.'
            );
        }

        if (schedule.status === 'SUSPENDED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_SUSPENDED', 'Lịch làm việc này đã bị tạm ngưng từ trước.');
        }

        const success = await StaffScheduleRepository.changeStatus(id, 'SUSPENDED');
        if (!success) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi tạm ngưng lịch.');

        return { ...schedule, status: 'SUSPENDED' };
    }

    /**
     * Mở lại (Resume) lịch làm việc
     */
    static async resumeSchedule(id: string): Promise<StaffSchedule> {
        const schedule = await StaffScheduleRepository.findById(id);
        if (!schedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch phân công không tồn tại');
        }

        if (schedule.status === 'ACTIVE') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_ACTIVE', 'Lịch làm việc này đang hoạt động bình thường, không cần mở lại.');
        }

        const success = await StaffScheduleRepository.changeStatus(id, 'ACTIVE');
        if (!success) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi mở lại lịch.');

        return { ...schedule, status: 'ACTIVE' };
    }
}
