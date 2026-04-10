// src/models/Facility Management/shift-swap.model.ts

export type SwapStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Entity đầy đủ của bảng shift_swaps
 */
export interface ShiftSwap {
    swap_id: string;
    requester_schedule_id: string;
    target_schedule_id: string;
    reason: string;
    status: SwapStatus;
    approver_id: string | null;
    approver_note: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    requester_name?: string;
    requester_working_date?: string;
    requester_start_time?: string;
    requester_end_time?: string;
    requester_shift_name?: string;
    requester_room_name?: string;

    target_name?: string;
    target_working_date?: string;
    target_start_time?: string;
    target_end_time?: string;
    target_shift_name?: string;
    target_room_name?: string;

    approver_name?: string;
}

/**
 * DTO tạo yêu cầu đổi ca
 */
export interface CreateShiftSwapInput {
    requester_schedule_id: string;
    target_schedule_id: string;
    reason: string;
}
