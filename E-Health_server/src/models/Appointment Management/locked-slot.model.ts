/** Slot bị khoá theo ngày cụ thể */
export interface LockedSlot {
    locked_slot_id: string;
    slot_id: string;
    locked_date: string;
    lock_reason: string | null;
    locked_by: string | null;
    created_at: string;
    deleted_at: string | null;

    start_time?: string;
    end_time?: string;
    shift_name?: string;
    shift_code?: string;
    locked_by_name?: string;
}

/** Input khoá 1 hoặc nhiều slot */
export interface LockSlotsInput {
    slot_ids: string[];
    locked_date: string;
    lock_reason?: string;
}

/** Input khoá theo ca */
export interface LockByShiftInput {
    shift_id: string;
    locked_date: string;
    lock_reason?: string;
}
