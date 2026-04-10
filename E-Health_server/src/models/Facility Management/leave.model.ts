// src/models/Facility Management/leave.model.ts

/**
 * Trạng thái Đơn nghỉ phép
 */
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Entity Đơn nghỉ phép
 */
export interface LeaveRequest {
    leave_requests_id: string;
    user_id: string;
    start_date: Date | string;
    end_date: Date | string;
    reason: string;
    status: LeaveStatus;
    approver_id?: string;
    approver_note?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
    deleted_at?: Date | string | null;

    full_name?: string;
    approver_name?: string;
}

/**
 * Input khi Nhân viên tạo Đơn nghỉ phép mới
 */
export interface CreateLeaveInput {
    user_id: string;
    start_date: string;
    end_date: string;
    reason: string;
}

/**
 * Input khi Nhân viên chỉnh sửa Đơn (chỉ khi PENDING)
 */
export interface UpdateLeaveInput {
    start_date?: string;
    end_date?: string;
    reason?: string;
}
