import { randomUUID } from 'crypto';
import { BillingReconciliationRepository } from '../../repository/Billing/billing-reconciliation.repository';
import {
    ReconciliationSession,
    ReconciliationItem,
    SettlementReport,
    RunOnlineReconcInput,
    RunShiftReconcInput,
    ResolveItemInput,
    CreateSettlementInput,
    ApproveRejectInput,
    DiscrepancyReport,
    PaginatedResult,
} from '../../models/Billing/billing-reconciliation.model';
import {
    RECONCILE_ERRORS,
    RECONCILE_CONFIG,
    RECONCILIATION_TYPE,
    RECONCILIATION_STATUS,
    MATCH_STATUS,
    RESOLUTION_STATUS,
    SETTLEMENT_STATUS,
    DISCREPANCY_SEVERITY,
} from '../../constants/billing-reconciliation.constant';

export class BillingReconciliationService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    private static generateCode(prefix: string): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${dateStr}-${rand}`;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: ĐỐI SOÁT GIAO DỊCH ONLINE
    // ═══════════════════════════════════════════════════

    /**
     * Chạy đối soát online: so sánh giao dịch SePay vs payment_transactions
     * 
     * Flow:
     * 1. Gọi SePay API lấy danh sách GD bank ngày reconcile_date
     * 2. Lấy GD system method=BANK_TRANSFER cùng ngày
     * 3. Match: gateway_transaction_id (system) ↔ reference_number (bank)
     * 4. Phân loại: MATCHED / SYSTEM_ONLY / EXTERNAL_ONLY / AMOUNT_MISMATCH
     * 5. Lưu session + items
     */
    static async runOnlineReconciliation(
        input: RunOnlineReconcInput, userId: string
    ): Promise<ReconciliationSession> {
        if (!input.reconcile_date) throw RECONCILE_ERRORS.INVALID_DATE_RANGE;

        /* Kiểm tra đã đối soát ngày này chưa */
        const exists = await BillingReconciliationRepository.checkExistingSession(
            RECONCILIATION_TYPE.ONLINE, input.reconcile_date
        );
        if (exists) throw RECONCILE_ERRORS.RECONCILIATION_EXISTS;

        /* Lấy giao dịch system (BANK_TRANSFER) */
        const systemTxns = await BillingReconciliationRepository.getOnlineTransactionsByDate(input.reconcile_date);

        /* Lấy giao dịch từ SePay API */
        let bankTxns: any[] = [];
        try {
            const config = await BillingReconciliationRepository.getGatewayConfig('SEPAY');
            if (config && config.is_active && config.api_key) {
                const bankAccount = config.va_account || config.bank_account_number;
                const response = await fetch(
                    `https://my.sepay.vn/userapi/transactions/list?account_number=${bankAccount}&limit=100&transaction_date_min=${input.reconcile_date}&transaction_date_max=${input.reconcile_date}`,
                    { headers: { 'Authorization': `Bearer ${config.api_key}`, 'Content-Type': 'application/json' } }
                );
                if (response.ok) {
                    const data = await response.json();
                    bankTxns = (data.transactions || []).filter((t: any) => t.amount_in > 0);
                }
            }
        } catch (_) {
            /* Nếu không kết nối được SePay, vẫn tạo session nhưng chỉ có system data */
        }

        /* Match logic */
        const items: Partial<ReconciliationItem>[] = [];
        const matchedBankRefs = new Set<string>();
        let matched = 0, unmatched = 0;
        let totalSystem = 0, totalExternal = 0;

        /* 1. Duyệt system → tìm match ở bank */
        for (const sysTxn of systemTxns) {
            const sysAmt = parseFloat(sysTxn.amount);
            totalSystem += sysAmt;

            const bankMatch = bankTxns.find((bt: any) =>
                bt.reference_number && sysTxn.gateway_transaction_id &&
                bt.reference_number === sysTxn.gateway_transaction_id
            );

            if (bankMatch) {
                const bankAmt = parseFloat(bankMatch.amount_in);
                matchedBankRefs.add(bankMatch.reference_number);

                if (Math.abs(sysAmt - bankAmt) <= 1) {
                    matched++;
                    items.push({
                        item_id: this.generateId('RI'),
                        match_status: MATCH_STATUS.MATCHED,
                        system_transaction_id: sysTxn.payment_transactions_id,
                        system_transaction_code: sysTxn.transaction_code,
                        system_amount: sysAmt.toFixed(2),
                        system_method: sysTxn.payment_method,
                        system_date: sysTxn.paid_at,
                        external_reference: bankMatch.reference_number,
                        external_amount: bankAmt.toFixed(2),
                        external_date: bankMatch.transaction_date,
                        external_raw: bankMatch,
                        discrepancy_amount: '0',
                    });
                } else {
                    unmatched++;
                    items.push({
                        item_id: this.generateId('RI'),
                        match_status: MATCH_STATUS.AMOUNT_MISMATCH,
                        system_transaction_id: sysTxn.payment_transactions_id,
                        system_transaction_code: sysTxn.transaction_code,
                        system_amount: sysAmt.toFixed(2),
                        system_method: sysTxn.payment_method,
                        system_date: sysTxn.paid_at,
                        external_reference: bankMatch.reference_number,
                        external_amount: bankAmt.toFixed(2),
                        external_date: bankMatch.transaction_date,
                        external_raw: bankMatch,
                        discrepancy_amount: (bankAmt - sysAmt).toFixed(2),
                        discrepancy_reason: `Chênh lệch số tiền: system=${sysAmt}, bank=${bankAmt}`,
                    });
                }
            } else {
                unmatched++;
                items.push({
                    item_id: this.generateId('RI'),
                    match_status: MATCH_STATUS.SYSTEM_ONLY,
                    system_transaction_id: sysTxn.payment_transactions_id,
                    system_transaction_code: sysTxn.transaction_code,
                    system_amount: sysAmt.toFixed(2),
                    system_method: sysTxn.payment_method,
                    system_date: sysTxn.paid_at,
                    discrepancy_amount: (-sysAmt).toFixed(2),
                    discrepancy_reason: 'Giao dịch có trên hệ thống nhưng không tìm thấy trên ngân hàng.',
                });
            }
        }

        /* 2. Duyệt bank → tìm GD chưa match (EXTERNAL_ONLY) */
        for (const bankTxn of bankTxns) {
            if (!matchedBankRefs.has(bankTxn.reference_number)) {
                const bankAmt = parseFloat(bankTxn.amount_in);
                totalExternal += bankAmt;
                unmatched++;
                items.push({
                    item_id: this.generateId('RI'),
                    match_status: MATCH_STATUS.EXTERNAL_ONLY,
                    external_reference: bankTxn.reference_number,
                    external_amount: bankAmt.toFixed(2),
                    external_date: bankTxn.transaction_date,
                    external_raw: bankTxn,
                    discrepancy_amount: bankAmt.toFixed(2),
                    discrepancy_reason: 'Giao dịch có trên ngân hàng nhưng chưa ghi nhận trên hệ thống.',
                });
            } else {
                totalExternal += parseFloat(bankTxn.amount_in);
            }
        }

        /* 3. Tạo session + items */
        const client = await BillingReconciliationRepository.getClient();
        try {
            await client.query('BEGIN');

            const sessionId = this.generateId('REC');
            const sessionCode = this.generateCode(RECONCILE_CONFIG.SESSION_CODE_PREFIX);
            const session = await BillingReconciliationRepository.createSession({
                session_id: sessionId,
                session_code: sessionCode,
                reconciliation_type: RECONCILIATION_TYPE.ONLINE,
                reconcile_date: input.reconcile_date,
                facility_id: input.facility_id || null,
                total_system_amount: totalSystem.toFixed(2),
                total_external_amount: totalExternal.toFixed(2),
                discrepancy_amount: (totalExternal - totalSystem).toFixed(2),
                total_transactions_matched: matched,
                total_transactions_unmatched: unmatched,
                gateway_name: 'SEPAY',
                created_by: userId,
            } as any, client);

            const itemsWithSession = items.map(i => ({ ...i, session_id: sessionId }));
            if (itemsWithSession.length > 0) {
                await BillingReconciliationRepository.createItems(itemsWithSession, client);
            }

            await client.query('COMMIT');
            return (await BillingReconciliationRepository.getSessionById(sessionId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: ĐỐI SOÁT CA THU NGÂN
    // ═══════════════════════════════════════════════════

    /**
     * Đối soát ca — So sánh 3 giá trị:
     * ① system_calculated_balance (hệ thống tự tính)
     * ② actual_closing_balance (thu ngân kê khai)
     * ③ Σ denominations (tổng mệnh giá × số lượng)
     */
    static async runShiftReconciliation(
        shiftId: string, input: RunShiftReconcInput, userId: string
    ): Promise<ReconciliationSession> {
        const shift = await BillingReconciliationRepository.getClosedShift(shiftId);
        if (!shift) throw RECONCILE_ERRORS.SHIFT_NOT_FOUND;
        if (shift.status !== 'CLOSED') throw RECONCILE_ERRORS.SHIFT_NOT_CLOSED;

        /* Kiểm tra đã đối soát ca này chưa */
        const shiftDate = new Date(shift.shift_start).toISOString().slice(0, 10);
        const exists = await BillingReconciliationRepository.checkExistingSession(
            RECONCILIATION_TYPE.CASHIER_SHIFT, shiftDate, shiftId
        );
        if (exists) throw RECONCILE_ERRORS.RECONCILIATION_EXISTS;

        /* Giao dịch trong ca */
        const txns = await BillingReconciliationRepository.getTransactionsByShift(shiftId);

        /* Mệnh giá */
        const denominations = await BillingReconciliationRepository.getShiftDenominations(shiftId);
        const totalDenominationAmount = denominations.reduce(
            (sum: number, d: any) => sum + (d.denomination_value * d.quantity), 0
        );

        const systemBalance = parseFloat(shift.system_calculated_balance || '0');
        const actualBalance = parseFloat(shift.actual_closing_balance || '0');
        const openingBalance = parseFloat(shift.opening_balance || '0');

        /* Tạo items từ giao dịch */
        const items: Partial<ReconciliationItem>[] = [];
        let totalPayments = 0, totalRefunds = 0, totalVoids = 0;

        for (const txn of txns) {
            const amount = parseFloat(txn.amount);
            const isRefund = txn.transaction_type === 'REFUND';
            const isVoid = txn.status === 'VOIDED';

            if (isVoid) { totalVoids += amount; }
            else if (isRefund) { totalRefunds += amount; }
            else { totalPayments += amount; }

            items.push({
                item_id: this.generateId('RI'),
                match_status: isVoid ? MATCH_STATUS.SYSTEM_ONLY : MATCH_STATUS.MATCHED,
                system_transaction_id: txn.payment_transactions_id,
                system_transaction_code: txn.transaction_code,
                system_amount: amount.toFixed(2),
                system_method: txn.payment_method,
                system_date: txn.paid_at,
                discrepancy_amount: '0',
                resolution_status: RESOLUTION_STATUS.UNRESOLVED,
            });
        }

        /* Tính chênh lệch */
        const systemVsActual = actualBalance - systemBalance;
        const actualVsDenomination = totalDenominationAmount > 0 ? totalDenominationAmount - actualBalance : 0;
        const totalDiscrepancy = systemVsActual;

        /* Item tổng kết chênh lệch */
        if (Math.abs(systemVsActual) > 1) {
            items.push({
                item_id: this.generateId('RI'),
                match_status: MATCH_STATUS.AMOUNT_MISMATCH,
                system_amount: systemBalance.toFixed(2),
                external_amount: actualBalance.toFixed(2),
                discrepancy_amount: systemVsActual.toFixed(2),
                discrepancy_reason: `Chênh lệch ca: system=${systemBalance}, actual=${actualBalance}`,
            });
        }

        if (totalDenominationAmount > 0 && Math.abs(actualVsDenomination) > 1) {
            items.push({
                item_id: this.generateId('RI'),
                match_status: MATCH_STATUS.AMOUNT_MISMATCH,
                system_amount: actualBalance.toFixed(2),
                external_amount: totalDenominationAmount.toFixed(2),
                discrepancy_amount: actualVsDenomination.toFixed(2),
                discrepancy_reason: `Chênh lệch mệnh giá: declared=${actualBalance}, denominations=${totalDenominationAmount}`,
            });
        }

        const matchedCount = items.filter(i => i.match_status === MATCH_STATUS.MATCHED).length;
        const unmatchedCount = items.length - matchedCount;

        const client = await BillingReconciliationRepository.getClient();
        try {
            await client.query('BEGIN');

            const sessionId = this.generateId('REC');
            const sessionCode = this.generateCode(RECONCILE_CONFIG.SESSION_CODE_PREFIX);
            await BillingReconciliationRepository.createSession({
                session_id: sessionId,
                session_code: sessionCode,
                reconciliation_type: RECONCILIATION_TYPE.CASHIER_SHIFT,
                reconcile_date: shiftDate,
                facility_id: null,
                total_system_amount: systemBalance.toFixed(2),
                total_external_amount: actualBalance.toFixed(2),
                discrepancy_amount: totalDiscrepancy.toFixed(2),
                total_transactions_matched: matchedCount,
                total_transactions_unmatched: unmatchedCount,
                shift_id: shiftId,
                notes: input.notes || null,
                created_by: userId,
            } as any, client);

            const itemsWithSession = items.map(i => ({ ...i, session_id: sessionId }));
            if (itemsWithSession.length > 0) {
                await BillingReconciliationRepository.createItems(itemsWithSession, client);
            }

            await client.query('COMMIT');
            return (await BillingReconciliationRepository.getSessionById(sessionId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Chi tiết chênh lệch ca — trả về session kèm items + shift info */
    static async getShiftDiscrepancy(shiftId: string): Promise<any> {
        const shift = await BillingReconciliationRepository.getClosedShift(shiftId);
        if (!shift) throw RECONCILE_ERRORS.SHIFT_NOT_FOUND;

        const denominations = await BillingReconciliationRepository.getShiftDenominations(shiftId);
        const totalDenominationAmount = denominations.reduce(
            (sum: number, d: any) => sum + (d.denomination_value * d.quantity), 0
        );

        return {
            shift_id: shiftId,
            cashier_name: shift.cashier_name,
            shift_start: shift.shift_start,
            shift_end: shift.shift_end,
            opening_balance: shift.opening_balance,
            system_calculated_balance: shift.system_calculated_balance,
            actual_closing_balance: shift.actual_closing_balance,
            denomination_total: totalDenominationAmount,
            discrepancy_system_vs_actual:
                parseFloat(shift.actual_closing_balance || '0') - parseFloat(shift.system_calculated_balance || '0'),
            discrepancy_actual_vs_denomination:
                totalDenominationAmount > 0 ? totalDenominationAmount - parseFloat(shift.actual_closing_balance || '0') : 0,
            denominations,
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: XỬ LÝ CHÊNH LỆCH
    // ═══════════════════════════════════════════════════

    /** Báo cáo chênh lệch tổng hợp */
    static async getDiscrepancyReport(facilityId?: string): Promise<DiscrepancyReport> {
        const summary = await BillingReconciliationRepository.getDiscrepancySummary(facilityId);
        const bySeverity = await BillingReconciliationRepository.getDiscrepancyBySeverity(
            DISCREPANCY_SEVERITY.MINOR_THRESHOLD, DISCREPANCY_SEVERITY.MAJOR_THRESHOLD, facilityId
        );
        const byType = await BillingReconciliationRepository.getDiscrepancyByType(facilityId);
        const recentItems = await BillingReconciliationRepository.getRecentUnresolvedItems(20);

        return {
            total_unresolved: parseInt(summary.total_unresolved) || 0,
            total_discrepancy_amount: summary.total_discrepancy_amount || '0',
            by_severity: bySeverity.map(s => ({
                severity: s.severity, count: parseInt(s.count), total: s.total,
            })),
            by_type: byType.map(t => ({
                reconciliation_type: t.reconciliation_type, count: parseInt(t.count), total: t.total,
            })),
            recent_items: recentItems,
        };
    }

    /** Xử lý chênh lệch: RESOLVED / WRITTEN_OFF */
    static async resolveItem(itemId: string, input: ResolveItemInput, userId: string): Promise<ReconciliationItem> {
        if (!input.resolution_status || ![RESOLUTION_STATUS.RESOLVED, RESOLUTION_STATUS.WRITTEN_OFF].includes(input.resolution_status as any)) {
            throw RECONCILE_ERRORS.RESOLUTION_REQUIRED;
        }
        if (!input.resolution_notes) throw RECONCILE_ERRORS.NOTES_REQUIRED;

        const item = await BillingReconciliationRepository.getItemById(itemId);
        if (!item) throw RECONCILE_ERRORS.ITEM_NOT_FOUND;
        if (item.resolution_status !== RESOLUTION_STATUS.UNRESOLVED) throw RECONCILE_ERRORS.ITEM_ALREADY_RESOLVED;

        return await BillingReconciliationRepository.resolveItem(itemId, input.resolution_status, input.resolution_notes, userId);
    }

    /** Review phiên đối soát: PENDING → REVIEWED */
    static async reviewSession(sessionId: string, notes: string | undefined, userId: string): Promise<ReconciliationSession> {
        const session = await BillingReconciliationRepository.getSessionById(sessionId);
        if (!session) throw RECONCILE_ERRORS.SESSION_NOT_FOUND;
        if (session.status !== RECONCILIATION_STATUS.PENDING) throw RECONCILE_ERRORS.SESSION_NOT_PENDING;

        return await BillingReconciliationRepository.updateSessionStatus(sessionId, RECONCILIATION_STATUS.REVIEWED, {
            reviewed_by: userId, reviewed_at: new Date(), notes: notes || session.notes,
        });
    }

    /** Phê duyệt: REVIEWED → APPROVED */
    static async approveSession(sessionId: string, userId: string): Promise<ReconciliationSession> {
        const session = await BillingReconciliationRepository.getSessionById(sessionId);
        if (!session) throw RECONCILE_ERRORS.SESSION_NOT_FOUND;
        if (session.status !== RECONCILIATION_STATUS.REVIEWED) throw RECONCILE_ERRORS.SESSION_NOT_REVIEWED;

        return await BillingReconciliationRepository.updateSessionStatus(sessionId, RECONCILIATION_STATUS.APPROVED, {
            approved_by: userId, approved_at: new Date(),
        });
    }

    /** Từ chối: REVIEWED → REJECTED */
    static async rejectSession(sessionId: string, reason: string, userId: string): Promise<ReconciliationSession> {
        if (!reason) throw RECONCILE_ERRORS.REJECT_REASON_REQUIRED;
        const session = await BillingReconciliationRepository.getSessionById(sessionId);
        if (!session) throw RECONCILE_ERRORS.SESSION_NOT_FOUND;
        if (session.status !== RECONCILIATION_STATUS.REVIEWED) throw RECONCILE_ERRORS.SESSION_NOT_REVIEWED;

        return await BillingReconciliationRepository.updateSessionStatus(sessionId, RECONCILIATION_STATUS.REJECTED, {
            reject_reason: reason,
        });
    }

    /** Danh sách phiên đối soát */
    static async getSessions(
        type?: string, status?: string, facilityId?: string,
        dateFrom?: string, dateTo?: string,
        page: number = RECONCILE_CONFIG.DEFAULT_PAGE,
        limit: number = RECONCILE_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ReconciliationSession>> {
        const safeLimit = Math.min(limit, RECONCILE_CONFIG.MAX_LIMIT);
        return await BillingReconciliationRepository.getSessions(type, status, facilityId, dateFrom, dateTo, page, safeLimit);
    }

    /** Chi tiết phiên */
    static async getSessionById(sessionId: string): Promise<ReconciliationSession> {
        const session = await BillingReconciliationRepository.getSessionById(sessionId);
        if (!session) throw RECONCILE_ERRORS.SESSION_NOT_FOUND;
        return session;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: QUYẾT TOÁN
    // ═══════════════════════════════════════════════════

    /**
     * Tạo phiếu quyết toán — tổng hợp revenue + discrepancies
     */
    static async createSettlement(input: CreateSettlementInput, userId: string): Promise<SettlementReport> {
        if (!input.period_start || !input.period_end) throw RECONCILE_ERRORS.INVALID_DATE_RANGE;
        if (new Date(input.period_start) > new Date(input.period_end)) throw RECONCILE_ERRORS.INVALID_DATE_RANGE;

        if (input.facility_id) {
            const exists = await BillingReconciliationRepository.checkFacilityExists(input.facility_id);
            if (!exists) throw RECONCILE_ERRORS.FACILITY_NOT_FOUND;
        }

        /* Tổng hợp revenue */
        const revenue = await BillingReconciliationRepository.getRevenueByPeriod(
            input.period_start, input.period_end, input.facility_id
        );

        /* Đếm discrepancies */
        const disc = await BillingReconciliationRepository.countDiscrepancies(
            input.period_start, input.period_end, input.facility_id
        );

        const totalRevenue = parseFloat(revenue.total_revenue);
        const totalRefunds = parseFloat(revenue.total_refunds);
        const totalVoids = parseFloat(revenue.total_voids);
        const netRevenue = totalRevenue - totalRefunds - totalVoids;

        const exportData = {
            generated_at: new Date().toISOString(),
            period: { start: input.period_start, end: input.period_end },
            revenue_breakdown: revenue,
            discrepancy_summary: disc,
        };

        const reportId = this.generateId('STL');
        const reportCode = this.generateCode(RECONCILE_CONFIG.SETTLEMENT_CODE_PREFIX);

        return await BillingReconciliationRepository.createSettlement({
            report_id: reportId,
            report_code: reportCode,
            report_type: input.report_type,
            period_start: input.period_start,
            period_end: input.period_end,
            facility_id: input.facility_id || null,
            total_revenue: totalRevenue.toFixed(2),
            total_cash: revenue.total_cash,
            total_card: revenue.total_card,
            total_transfer: revenue.total_transfer,
            total_online: revenue.total_online,
            total_refunds: totalRefunds.toFixed(2),
            total_voids: totalVoids.toFixed(2),
            net_revenue: netRevenue.toFixed(2),
            total_discrepancies: parseInt(disc.total_discrepancies) || 0,
            unresolved_discrepancies: parseInt(disc.unresolved_discrepancies) || 0,
            notes: input.notes || null,
            export_data: exportData,
            created_by: userId,
        } as any);
    }

    /** DRAFT → SUBMITTED */
    static async submitSettlement(reportId: string, userId: string): Promise<SettlementReport> {
        const report = await BillingReconciliationRepository.getSettlementById(reportId);
        if (!report) throw RECONCILE_ERRORS.SETTLEMENT_NOT_FOUND;
        if (report.status !== SETTLEMENT_STATUS.DRAFT) throw RECONCILE_ERRORS.SETTLEMENT_NOT_DRAFT;

        return await BillingReconciliationRepository.updateSettlementStatus(reportId, SETTLEMENT_STATUS.SUBMITTED, {
            submitted_by: userId, submitted_at: new Date(),
        });
    }

    /** SUBMITTED → APPROVED */
    static async approveSettlement(reportId: string, userId: string): Promise<SettlementReport> {
        const report = await BillingReconciliationRepository.getSettlementById(reportId);
        if (!report) throw RECONCILE_ERRORS.SETTLEMENT_NOT_FOUND;
        if (report.status !== SETTLEMENT_STATUS.SUBMITTED) throw RECONCILE_ERRORS.SETTLEMENT_NOT_SUBMITTED;

        return await BillingReconciliationRepository.updateSettlementStatus(reportId, SETTLEMENT_STATUS.APPROVED, {
            approved_by: userId, approved_at: new Date(),
        });
    }

    /** SUBMITTED → REJECTED */
    static async rejectSettlement(reportId: string, input: ApproveRejectInput, userId: string): Promise<SettlementReport> {
        if (!input.reject_reason) throw RECONCILE_ERRORS.REJECT_REASON_REQUIRED;
        const report = await BillingReconciliationRepository.getSettlementById(reportId);
        if (!report) throw RECONCILE_ERRORS.SETTLEMENT_NOT_FOUND;
        if (report.status !== SETTLEMENT_STATUS.SUBMITTED) throw RECONCILE_ERRORS.SETTLEMENT_NOT_SUBMITTED;

        return await BillingReconciliationRepository.updateSettlementStatus(reportId, SETTLEMENT_STATUS.REJECTED, {
            reject_reason: input.reject_reason,
        });
    }

    /** Danh sách phiếu quyết toán */
    static async getSettlements(
        type?: string, status?: string, facilityId?: string,
        dateFrom?: string, dateTo?: string,
        page: number = RECONCILE_CONFIG.DEFAULT_PAGE,
        limit: number = RECONCILE_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<SettlementReport>> {
        const safeLimit = Math.min(limit, RECONCILE_CONFIG.MAX_LIMIT);
        return await BillingReconciliationRepository.getSettlements(type, status, facilityId, dateFrom, dateTo, page, safeLimit);
    }

    /** Chi tiết phiếu */
    static async getSettlementById(reportId: string): Promise<SettlementReport> {
        const report = await BillingReconciliationRepository.getSettlementById(reportId);
        if (!report) throw RECONCILE_ERRORS.SETTLEMENT_NOT_FOUND;
        return report;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 5: LỊCH SỬ & XUẤT BÁO CÁO
    // ═══════════════════════════════════════════════════

    /** Lịch sử đối soát (alias cho getSessions với full filter) */
    static async getReconciliationHistory(
        type?: string, status?: string, facilityId?: string,
        dateFrom?: string, dateTo?: string,
        page: number = RECONCILE_CONFIG.DEFAULT_PAGE,
        limit: number = RECONCILE_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ReconciliationSession>> {
        return await this.getSessions(type, status, facilityId, dateFrom, dateTo, page, limit);
    }

    /**
     * Xuất data quyết toán — trả về export_data snapshot (JSON)
     * Frontend dùng data này render Excel/PDF
     */
    static async exportSettlementData(reportId: string): Promise<any> {
        const report = await BillingReconciliationRepository.getSettlementById(reportId);
        if (!report) throw RECONCILE_ERRORS.SETTLEMENT_NOT_FOUND;

        return {
            report_code: report.report_code,
            report_type: report.report_type,
            period_start: report.period_start,
            period_end: report.period_end,
            facility_name: report.facility_name,
            status: report.status,
            totals: {
                total_revenue: report.total_revenue,
                total_cash: report.total_cash,
                total_card: report.total_card,
                total_transfer: report.total_transfer,
                total_online: report.total_online,
                total_refunds: report.total_refunds,
                total_voids: report.total_voids,
                net_revenue: report.net_revenue,
            },
            discrepancies: {
                total: report.total_discrepancies,
                unresolved: report.unresolved_discrepancies,
            },
            export_data: report.export_data,
            approved_by: report.approved_by_name,
            approved_at: report.approved_at,
            generated_at: new Date().toISOString(),
        };
    }
}
