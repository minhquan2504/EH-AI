// src/services/Facility Management/leave.service.ts
import { LeaveRepository } from '../../repository/Facility Management/leave.repository';
import { StaffScheduleRepository } from '../../repository/Facility Management/staff-schedule.repository';
import { CreateLeaveInput, LeaveRequest, UpdateLeaveInput } from '../../models/Facility Management/leave.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class LeaveService {

    /**
     * Tạo đơn xin nghỉ phép
     */
    static async createLeave(data: CreateLeaveInput): Promise<LeaveRequest> {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', 'Ngày bắt đầu hoặc kết thúc không đúng định dạng (YYYY-MM-DD).');
        }

        if (startDate > endDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', 'Ngày bắt đầu nghỉ phải trước hoặc bằng ngày kết thúc.');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PAST_DATE_FORBIDDEN', 'Không thể tạo đơn nghỉ phép cho ngày đã qua.');
        }

        return await LeaveRepository.create(data);
    }

    /**
     * Lấy danh sách đơn nghỉ phép
     */
    static async getLeaves(filters: { user_id?: string; status?: string }): Promise<LeaveRequest[]> {
        return await LeaveRepository.findAll(filters);
    }

    /**
     * Lấy chi tiết 1 đơn
     */
    static async getLeaveById(id: string): Promise<LeaveRequest> {
        const leave = await LeaveRepository.findById(id);
        if (!leave) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'LEAVE_NOT_FOUND', 'Đơn nghỉ phép không tồn tại hoặc đã bị hủy.');
        }
        return leave;
    }

    /**
     * Chỉnh sửa đơn nghỉ phép (chỉ khi PENDING)
     */
    static async updateLeave(id: string, data: UpdateLeaveInput): Promise<LeaveRequest> {
        const leave = await this.getLeaveById(id);

        if (leave.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'LEAVE_NOT_EDITABLE',
                `Chỉ được chỉnh sửa đơn đang ở trạng thái CHỜ DUYỆT (PENDING). Đơn này hiện là "${leave.status}".`
            );
        }

        if (data.start_date && data.end_date) {
            if (new Date(data.start_date) > new Date(data.end_date)) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', 'Ngày bắt đầu nghỉ phải trước hoặc bằng ngày kết thúc.');
            }
        }

        const updated = await LeaveRepository.update(id, data);
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi cập nhật đơn.');
        return updated;
    }

    /**
     * Hủy / rút đơn (Soft delete, chỉ khi PENDING)
     */
    static async deleteLeave(id: string): Promise<void> {
        const leave = await this.getLeaveById(id);

        if (leave.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'LEAVE_CANNOT_DELETE',
                `Chỉ có thể hủy đơn đang ở trạng thái CHỜ DUYỆT (PENDING). Đơn này hiện là "${leave.status}".`
            );
        }

        const success = await LeaveRepository.softDelete(id);
        if (!success) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DELETE_FAILED', 'Lỗi hệ thống khi hủy đơn.');
    }

    /**
     * Duyệt đơn nghỉ phép (APPROVE)
     */
    static async approveLeave(id: string, approverId: string, approverNote?: string): Promise<LeaveRequest> {
        const leave = await this.getLeaveById(id);

        if (leave.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'LEAVE_ALREADY_PROCESSED',
                `Đơn này đã được xử lý (Trạng thái: ${leave.status}). Không thể duyệt lại.`
            );
        }

        // Cập nhật trạng thái đơn -> APPROVED
        const updated = await LeaveRepository.update(id, {
            status: 'APPROVED',
            approver_id: approverId,
            approver_note: approverNote || null,
        });
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'APPROVE_FAILED', 'Lỗi hệ thống khi duyệt đơn.');

        await this.markSchedulesAsLeave(leave.user_id, leave.start_date as string, leave.end_date as string, leave.reason);

        return updated;
    }

    /**
     * Từ chối đơn nghỉ phép
     */
    static async rejectLeave(id: string, approverId: string, approverNote: string): Promise<LeaveRequest> {
        const leave = await this.getLeaveById(id);

        if (leave.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'LEAVE_ALREADY_PROCESSED',
                `Đơn này đã được xử lý (Trạng thái: ${leave.status}). Không thể từ chối lại.`
            );
        }

        if (!approverNote || approverNote.trim().length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REJECT_NOTE', 'Vui lòng nhập lý do từ chối đơn nghỉ phép.');
        }

        const updated = await LeaveRepository.update(id, {
            status: 'REJECTED',
            approver_id: approverId,
            approver_note: approverNote,
        });
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'REJECT_FAILED', 'Lỗi hệ thống khi từ chối đơn.');
        return updated;
    }

    /**
     * Quét bảng staff_schedules và đánh dấu is_leave = true cho mọi lịch
     */
    private static async markSchedulesAsLeave(userId: string, startDate: string, endDate: string, reason: string): Promise<void> {
        const { pool: dbPool } = await import('../../config/postgresdb');
        const query = `
            UPDATE staff_schedules
            SET is_leave = true, leave_reason = $1
            WHERE user_id = $2
              AND working_date >= $3::date
              AND working_date <= $4::date
        `;
        await dbPool.query(query, [reason, userId, startDate, endDate]);
    }
}
