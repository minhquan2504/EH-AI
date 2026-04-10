import { randomUUID } from 'crypto';
import { BillingCashierAuthRepository } from '../../repository/Billing/billing-cashier-auth.repository';
import {
    CashierProfile,
    CashierOperationLimit,
    CashierActivityLog,
    CreateCashierProfileInput,
    UpdateCashierProfileInput,
    SetLimitInput,
    CheckLimitInput,
    CheckLimitResult,
    PaginatedResult,
} from '../../models/Billing/billing-cashier-auth.model';
import {
    CASHIER_ACTION_TYPE,
    CASHIER_AUTH_ERRORS,
    CASHIER_AUTH_CONFIG,
    SHIFT_STATUS,
    LIMIT_CHECK_TYPE,
} from '../../constants/billing-cashier-auth.constant';

export class BillingCashierAuthService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: HỒ SƠ THU NGÂN
    // ═══════════════════════════════════════════════════

    /** Gán user làm thu ngân */
    static async createProfile(input: CreateCashierProfileInput, createdBy: string): Promise<CashierProfile> {
        /* Check trùng user_id */
        const existing = await BillingCashierAuthRepository.getProfileByUserId(input.user_id);
        if (existing) throw CASHIER_AUTH_ERRORS.USER_ALREADY_CASHIER;

        const profileId = this.generateId('CSP');
        return await BillingCashierAuthRepository.createProfile({
            cashier_profile_id: profileId,
            user_id: input.user_id,
            employee_code: input.employee_code || null,
            branch_id: input.branch_id || null,
            facility_id: input.facility_id || null,
            can_collect_payment: input.can_collect_payment !== false,
            can_process_refund: input.can_process_refund || false,
            can_void_transaction: input.can_void_transaction || false,
            can_open_shift: input.can_open_shift !== false,
            can_close_shift: input.can_close_shift !== false,
            supervisor_id: input.supervisor_id || null,
            notes: input.notes || null,
            created_by: createdBy,
        } as any);
    }

    /** Danh sách */
    static async getProfiles(
        branchId?: string, facilityId?: string, isActive?: string,
        page: number = CASHIER_AUTH_CONFIG.DEFAULT_PAGE,
        limit: number = CASHIER_AUTH_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<CashierProfile>> {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return await BillingCashierAuthRepository.getProfiles(branchId, facilityId, active, page, Math.min(limit, CASHIER_AUTH_CONFIG.MAX_LIMIT));
    }

    /** Chi tiết */
    static async getProfileById(profileId: string): Promise<CashierProfile> {
        const profile = await BillingCashierAuthRepository.getProfileById(profileId);
        if (!profile) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;
        return profile;
    }

    /** Tìm theo userId */
    static async getProfileByUserId(userId: string): Promise<CashierProfile> {
        const profile = await BillingCashierAuthRepository.getProfileByUserId(userId);
        if (!profile) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;
        return profile;
    }

    /** Cập nhật */
    static async updateProfile(profileId: string, input: UpdateCashierProfileInput, userId: string): Promise<CashierProfile> {
        const existing = await BillingCashierAuthRepository.getProfileById(profileId);
        if (!existing) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;

        const updateData: Record<string, any> = {};
        if (input.employee_code !== undefined) updateData.employee_code = input.employee_code;
        if (input.branch_id !== undefined) updateData.branch_id = input.branch_id;
        if (input.facility_id !== undefined) updateData.facility_id = input.facility_id;
        if (input.can_collect_payment !== undefined) updateData.can_collect_payment = input.can_collect_payment;
        if (input.can_process_refund !== undefined) updateData.can_process_refund = input.can_process_refund;
        if (input.can_void_transaction !== undefined) updateData.can_void_transaction = input.can_void_transaction;
        if (input.can_open_shift !== undefined) updateData.can_open_shift = input.can_open_shift;
        if (input.can_close_shift !== undefined) updateData.can_close_shift = input.can_close_shift;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;
        if (input.supervisor_id !== undefined) updateData.supervisor_id = input.supervisor_id;
        if (input.notes !== undefined) updateData.notes = input.notes;

        const updated = await BillingCashierAuthRepository.updateProfile(profileId, updateData);

        /* Ghi nhật ký */
        await this.logActivity(existing.cashier_profile_id, userId, null, CASHIER_ACTION_TYPE.PROFILE_UPDATE, {
            changes: updateData,
        });

        return updated;
    }

    /** Soft delete */
    static async deleteProfile(profileId: string): Promise<void> {
        const existing = await BillingCashierAuthRepository.getProfileById(profileId);
        if (!existing) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;
        await BillingCashierAuthRepository.softDeleteProfile(profileId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: GIỚI HẠN THAO TÁC
    // ═══════════════════════════════════════════════════

    /** Đặt giới hạn */
    static async setLimit(input: SetLimitInput, createdBy: string): Promise<CashierOperationLimit> {
        const profile = await BillingCashierAuthRepository.getProfileById(input.cashier_profile_id);
        if (!profile) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;

        /* Check nếu đã có → update */
        const existing = await BillingCashierAuthRepository.getLimitByProfile(input.cashier_profile_id);
        if (existing) {
            return await BillingCashierAuthRepository.updateLimit(input.cashier_profile_id, {
                max_single_payment: input.max_single_payment,
                max_single_refund: input.max_single_refund,
                max_single_void: input.max_single_void,
                max_shift_total: input.max_shift_total,
                max_shift_refund_total: input.max_shift_refund_total,
                max_shift_void_count: input.max_shift_void_count,
                max_daily_total: input.max_daily_total,
                max_daily_refund_total: input.max_daily_refund_total,
                max_daily_void_count: input.max_daily_void_count,
                require_approval_above: input.require_approval_above,
            });
        }

        const limitId = this.generateId('LMT');
        return await BillingCashierAuthRepository.createLimit({
            limit_id: limitId,
            cashier_profile_id: input.cashier_profile_id,
            max_single_payment: input.max_single_payment?.toString() || null,
            max_single_refund: input.max_single_refund?.toString() || null,
            max_single_void: input.max_single_void?.toString() || null,
            max_shift_total: input.max_shift_total?.toString() || null,
            max_shift_refund_total: input.max_shift_refund_total?.toString() || null,
            max_shift_void_count: input.max_shift_void_count ?? null,
            max_daily_total: input.max_daily_total?.toString() || null,
            max_daily_refund_total: input.max_daily_refund_total?.toString() || null,
            max_daily_void_count: input.max_daily_void_count ?? null,
            require_approval_above: input.require_approval_above?.toString() || null,
            created_by: createdBy,
        } as any);
    }

    /** Xem giới hạn */
    static async getLimit(profileId: string): Promise<CashierOperationLimit> {
        const limit = await BillingCashierAuthRepository.getLimitByProfile(profileId);
        if (!limit) throw CASHIER_AUTH_ERRORS.LIMIT_NOT_FOUND;
        return limit;
    }

    /** Cập nhật giới hạn */
    static async updateLimit(profileId: string, input: Record<string, any>): Promise<CashierOperationLimit> {
        const existing = await BillingCashierAuthRepository.getLimitByProfile(profileId);
        if (!existing) throw CASHIER_AUTH_ERRORS.LIMIT_NOT_FOUND;
        return await BillingCashierAuthRepository.updateLimit(profileId, input);
    }

    /**
     * Kiểm tra giới hạn trước khi cho phép giao dịch
     * Check: single limit → shift limit → daily limit → supervisor approval
     */
    static async checkLimit(input: CheckLimitInput): Promise<CheckLimitResult> {
        const profile = await BillingCashierAuthRepository.getProfileByUserId(input.user_id);
        if (!profile) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;
        if (!profile.is_active) throw CASHIER_AUTH_ERRORS.PROFILE_INACTIVE;

        /* Check quyền */
        if (input.action_type === LIMIT_CHECK_TYPE.PAYMENT && !profile.can_collect_payment) throw CASHIER_AUTH_ERRORS.NO_COLLECT_PERMISSION;
        if (input.action_type === LIMIT_CHECK_TYPE.REFUND && !profile.can_process_refund) throw CASHIER_AUTH_ERRORS.NO_REFUND_PERMISSION;
        if (input.action_type === LIMIT_CHECK_TYPE.VOID && !profile.can_void_transaction) throw CASHIER_AUTH_ERRORS.NO_VOID_PERMISSION;

        const limit = await BillingCashierAuthRepository.getLimitByProfile(profile.cashier_profile_id);
        if (!limit) return { allowed: true, requires_approval: false, exceeded_limits: [], current_usage: {} };

        const exceededLimits: string[] = [];
        let requiresApproval = false;

        /* Check single transaction limit */
        if (input.action_type === LIMIT_CHECK_TYPE.PAYMENT && limit.max_single_payment && input.amount > parseFloat(limit.max_single_payment)) {
            exceededLimits.push('max_single_payment');
        }
        if (input.action_type === LIMIT_CHECK_TYPE.REFUND && limit.max_single_refund && input.amount > parseFloat(limit.max_single_refund)) {
            exceededLimits.push('max_single_refund');
        }
        if (input.action_type === LIMIT_CHECK_TYPE.VOID && limit.max_single_void && input.amount > parseFloat(limit.max_single_void)) {
            exceededLimits.push('max_single_void');
        }

        /* Check shift usage */
        let shiftUsage = { total: 0, refund: 0, void_count: 0 };
        if (input.shift_id) {
            shiftUsage = await BillingCashierAuthRepository.getShiftUsage(input.shift_id, input.user_id);
            if (input.action_type === LIMIT_CHECK_TYPE.PAYMENT && limit.max_shift_total && (shiftUsage.total + input.amount) > parseFloat(limit.max_shift_total)) {
                exceededLimits.push('max_shift_total');
            }
            if (input.action_type === LIMIT_CHECK_TYPE.REFUND && limit.max_shift_refund_total && (shiftUsage.refund + input.amount) > parseFloat(limit.max_shift_refund_total)) {
                exceededLimits.push('max_shift_refund_total');
            }
            if (input.action_type === LIMIT_CHECK_TYPE.VOID && limit.max_shift_void_count && (shiftUsage.void_count + 1) > limit.max_shift_void_count) {
                exceededLimits.push('max_shift_void_count');
            }
        }

        /* Check daily usage */
        const dailyUsage = await BillingCashierAuthRepository.getDailyUsage(input.user_id);
        if (input.action_type === LIMIT_CHECK_TYPE.PAYMENT && limit.max_daily_total && (dailyUsage.total + input.amount) > parseFloat(limit.max_daily_total)) {
            exceededLimits.push('max_daily_total');
        }
        if (input.action_type === LIMIT_CHECK_TYPE.REFUND && limit.max_daily_refund_total && (dailyUsage.refund + input.amount) > parseFloat(limit.max_daily_refund_total)) {
            exceededLimits.push('max_daily_refund_total');
        }
        if (input.action_type === LIMIT_CHECK_TYPE.VOID && limit.max_daily_void_count && (dailyUsage.void_count + 1) > limit.max_daily_void_count) {
            exceededLimits.push('max_daily_void_count');
        }

        /* Supervisor approval */
        if (limit.require_approval_above && input.amount > parseFloat(limit.require_approval_above)) {
            requiresApproval = true;
        }

        /* Ghi log nếu exceeded */
        if (exceededLimits.length > 0) {
            await this.logActivity(profile.cashier_profile_id, input.user_id, input.shift_id || null, CASHIER_ACTION_TYPE.LIMIT_EXCEEDED, {
                action_type: input.action_type, amount: input.amount, exceeded: exceededLimits,
            });
        }

        return {
            allowed: exceededLimits.length === 0,
            requires_approval: requiresApproval,
            exceeded_limits: exceededLimits,
            current_usage: {
                shift_total: shiftUsage.total,
                shift_refund: shiftUsage.refund,
                shift_void_count: shiftUsage.void_count,
                daily_total: dailyUsage.total,
                daily_refund: dailyUsage.refund,
                daily_void_count: dailyUsage.void_count,
            },
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: KHÓA CA / MỞ CA
    // ═══════════════════════════════════════════════════

    /** Khóa ca */
    static async lockShift(shiftId: string, userId: string, reason: string): Promise<void> {
        if (!reason) throw CASHIER_AUTH_ERRORS.LOCK_REASON_REQUIRED;
        const shift = await BillingCashierAuthRepository.getShiftById(shiftId);
        if (!shift) throw CASHIER_AUTH_ERRORS.SHIFT_NOT_FOUND;
        if (shift.status === SHIFT_STATUS.LOCKED) throw CASHIER_AUTH_ERRORS.SHIFT_ALREADY_LOCKED;
        if (shift.status === SHIFT_STATUS.CLOSED) throw CASHIER_AUTH_ERRORS.SHIFT_ALREADY_CLOSED;

        await BillingCashierAuthRepository.lockShift(shiftId, userId, reason);
        await this.logActivity(null, userId, shiftId, CASHIER_ACTION_TYPE.SHIFT_LOCK, {
            reason, cashier_id: shift.cashier_id,
        });
    }

    /** Mở khóa ca */
    static async unlockShift(shiftId: string, userId: string): Promise<void> {
        const shift = await BillingCashierAuthRepository.getShiftById(shiftId);
        if (!shift) throw CASHIER_AUTH_ERRORS.SHIFT_NOT_FOUND;
        if (shift.status !== SHIFT_STATUS.LOCKED) throw CASHIER_AUTH_ERRORS.SHIFT_NOT_LOCKED;

        await BillingCashierAuthRepository.unlockShift(shiftId);
        await this.logActivity(null, userId, shiftId, CASHIER_ACTION_TYPE.SHIFT_UNLOCK, {
            cashier_id: shift.cashier_id,
        });
    }

    /** Force close */
    static async forceCloseShift(shiftId: string, userId: string): Promise<void> {
        const shift = await BillingCashierAuthRepository.getShiftById(shiftId);
        if (!shift) throw CASHIER_AUTH_ERRORS.SHIFT_NOT_FOUND;
        if (shift.status === SHIFT_STATUS.CLOSED) throw CASHIER_AUTH_ERRORS.SHIFT_ALREADY_CLOSED;

        await BillingCashierAuthRepository.forceCloseShift(shiftId, userId);
        await this.logActivity(null, userId, shiftId, CASHIER_ACTION_TYPE.FORCE_CLOSE, {
            cashier_id: shift.cashier_id, previous_status: shift.status,
        });
    }

    /** Bàn giao ca */
    static async handoverShift(shiftId: string, userId: string, handoverToUserId: string): Promise<void> {
        if (!handoverToUserId) throw CASHIER_AUTH_ERRORS.HANDOVER_USER_REQUIRED;

        const shift = await BillingCashierAuthRepository.getShiftById(shiftId);
        if (!shift) throw CASHIER_AUTH_ERRORS.SHIFT_NOT_FOUND;
        if (shift.status === SHIFT_STATUS.CLOSED) throw CASHIER_AUTH_ERRORS.SHIFT_ALREADY_CLOSED;

        /* Check người nhận có profile */
        const receiverProfile = await BillingCashierAuthRepository.getProfileByUserId(handoverToUserId);
        if (!receiverProfile) throw CASHIER_AUTH_ERRORS.HANDOVER_USER_NO_PROFILE;

        await BillingCashierAuthRepository.handoverShift(shiftId, userId, handoverToUserId);
        await this.logActivity(null, userId, shiftId, CASHIER_ACTION_TYPE.HANDOVER, {
            from_cashier: shift.cashier_id, to_cashier: handoverToUserId,
        });
    }

    /** Ca đang mở */
    static async getActiveShifts(): Promise<any[]> {
        return await BillingCashierAuthRepository.getActiveShifts();
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: NHẬT KÝ HOẠT ĐỘNG
    // ═══════════════════════════════════════════════════

    /** Danh sách nhật ký */
    static async getLogs(
        actionType?: string, userId?: string, dateFrom?: string, dateTo?: string,
        page: number = CASHIER_AUTH_CONFIG.DEFAULT_PAGE,
        limit: number = CASHIER_AUTH_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<CashierActivityLog>> {
        return await BillingCashierAuthRepository.getLogs(actionType, userId, dateFrom, dateTo, page, Math.min(limit, CASHIER_AUTH_CONFIG.MAX_LIMIT));
    }

    /** Nhật ký theo profile */
    static async getLogsByProfile(
        profileId: string, page: number = CASHIER_AUTH_CONFIG.DEFAULT_PAGE,
        limit: number = CASHIER_AUTH_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<CashierActivityLog>> {
        return await BillingCashierAuthRepository.getLogsByProfile(profileId, page, Math.min(limit, CASHIER_AUTH_CONFIG.MAX_LIMIT));
    }

    /** Nhật ký theo shift */
    static async getLogsByShift(shiftId: string): Promise<CashierActivityLog[]> {
        return await BillingCashierAuthRepository.getLogsByShift(shiftId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 5: DASHBOARD
    // ═══════════════════════════════════════════════════

    /** Dashboard tổng quan */
    static async getDashboard(): Promise<any> {
        return await BillingCashierAuthRepository.getDashboard();
    }

    /** Thống kê cá nhân */
    static async getCashierStats(profileId: string): Promise<any> {
        const stats = await BillingCashierAuthRepository.getCashierStats(profileId);
        if (!stats) throw CASHIER_AUTH_ERRORS.PROFILE_NOT_FOUND;
        return stats;
    }

    // ═══════════════════════════════════════════════════
    // HELPER: Ghi nhật ký
    // ═══════════════════════════════════════════════════

    /**
     * Ghi 1 dòng nhật ký hoạt động
     */
    static async logActivity(
        profileId: string | null, userId: string,
        shiftId: string | null, actionType: string,
        detail?: any, ip?: string, ua?: string, facilityId?: string
    ): Promise<void> {
        const logId = this.generateId('LOG');
        await BillingCashierAuthRepository.createLog({
            log_id: logId,
            cashier_profile_id: profileId,
            user_id: userId,
            shift_id: shiftId,
            action_type: actionType,
            action_detail: detail || null,
            ip_address: ip || null,
            user_agent: ua || null,
            facility_id: facilityId || null,
        } as any);
    }
}
