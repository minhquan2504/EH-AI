// src/services/Facility Management/shift-swap.service.ts
import { ShiftSwapRepository } from '../../repository/Facility Management/shift-swap.repository';
import { StaffScheduleRepository } from '../../repository/Facility Management/staff-schedule.repository';
import { CreateShiftSwapInput, ShiftSwap } from '../../models/Facility Management/shift-swap.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ShiftSwapService {

    /**
     * Tạo yêu cầu đổi ca
     */
    static async createSwapRequest(data: CreateShiftSwapInput, requesterId: string): Promise<ShiftSwap> {
        // Kiểm tra 2 schedule tồn tại
        const reqSchedule = await StaffScheduleRepository.findById(data.requester_schedule_id);
        if (!reqSchedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch trực của người yêu cầu không tồn tại.');
        }

        const tgtSchedule = await StaffScheduleRepository.findById(data.target_schedule_id);
        if (!tgtSchedule) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SCHEDULE_NOT_FOUND', 'Lịch trực của người được đổi không tồn tại.');
        }

        // Kiểm tra người tạo là owner của requester_schedule
        if (reqSchedule.user_id !== requesterId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'NOT_SCHEDULE_OWNER', 'Bạn chỉ được phép tạo yêu cầu đổi ca cho lịch trực của chính mình.');
        }

        // Không cho đổi ca với chính mình
        if (reqSchedule.user_id === tgtSchedule.user_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SAME_USER_SWAP', 'Không thể đổi ca với chính mình.');
        }

        // Kiểm tra cả 2 schedule phải ở tương lai
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (new Date(reqSchedule.working_date) < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PAST_SCHEDULE', 'Lịch trực của bạn đã qua ngày. Không thể tạo yêu cầu đổi ca.');
        }
        if (new Date(tgtSchedule.working_date) < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PAST_SCHEDULE', 'Lịch trực của người được đổi đã qua ngày.');
        }

        // Kiểm tra không có Swap PENDING nào liên quan đến 2 schedule này
        const pendingA = await ShiftSwapRepository.findPendingSwapByScheduleId(data.requester_schedule_id);
        if (pendingA) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'SWAP_PENDING_EXISTS', `Lịch trực "${data.requester_schedule_id}" đã nằm trong 1 yêu cầu đổi ca khác đang chờ duyệt.`);
        }
        const pendingB = await ShiftSwapRepository.findPendingSwapByScheduleId(data.target_schedule_id);
        if (pendingB) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'SWAP_PENDING_EXISTS', `Lịch trực "${data.target_schedule_id}" đã nằm trong 1 yêu cầu đổi ca khác đang chờ duyệt.`);
        }

        return await ShiftSwapRepository.create(data);
    }

    /**
     * Lấy danh sách yêu cầu đổi ca
     */
    static async getSwapRequests(filters: { status?: string }): Promise<ShiftSwap[]> {
        return await ShiftSwapRepository.findAll(filters);
    }

    /**
     * Xem chi tiết 1 yêu cầu đổi ca
     */
    static async getSwapById(id: string): Promise<ShiftSwap> {
        const swap = await ShiftSwapRepository.findById(id);
        if (!swap) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SWAP_NOT_FOUND', 'Yêu cầu đổi ca không tồn tại.');
        }
        return swap;
    }

    /**
     * Duyệt yêu cầu đổi ca (APPROVE)
     */
    static async approveSwap(id: string, approverId: string, approverNote?: string): Promise<ShiftSwap> {
        const swap = await this.getSwapById(id);

        if (swap.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'SWAP_ALREADY_PROCESSED',
                `Yêu cầu này đã được xử lý (Trạng thái: ${swap.status}). Không thể duyệt lại.`
            );
        }

        // Cập nhật trạng thái -> APPROVED
        const updated = await ShiftSwapRepository.updateStatus(id, 'APPROVED', approverId, approverNote);
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'APPROVE_FAILED', 'Lỗi hệ thống khi duyệt yêu cầu đổi ca.');

        await StaffScheduleRepository.swapUsers(swap.requester_schedule_id, swap.target_schedule_id);

        return updated;
    }

    /**
     * Từ chối yêu cầu đổi ca (REJECT)
     */
    static async rejectSwap(id: string, approverId: string, approverNote: string): Promise<ShiftSwap> {
        const swap = await this.getSwapById(id);

        if (swap.status !== 'PENDING') {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'SWAP_ALREADY_PROCESSED',
                `Yêu cầu này đã được xử lý (Trạng thái: ${swap.status}). Không thể từ chối lại.`
            );
        }

        if (!approverNote || approverNote.trim().length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REJECT_NOTE', 'Vui lòng nhập lý do từ chối yêu cầu đổi ca.');
        }

        const updated = await ShiftSwapRepository.updateStatus(id, 'REJECTED', approverId, approverNote);
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'REJECT_FAILED', 'Lỗi hệ thống khi từ chối yêu cầu.');
        return updated;
    }
}
