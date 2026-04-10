import { randomUUID } from 'crypto';
import { BillingRefundRepository } from '../../repository/Billing/billing-refund.repository';
import {
    RefundRequest,
    TransactionAdjustment,
    CreateRefundInput,
    CreateAdjustmentInput,
    ApproveRejectInput,
    RefundTimelineEvent,
    RefundDashboard,
    PaginatedResult,
} from '../../models/Billing/billing-refund.model';
import {
    REFUND_ERRORS,
    REFUND_CONFIG,
    REFUND_TYPE,
    REFUND_STATUS,
    ADJUSTMENT_STATUS,
    AUTO_APPROVE_THRESHOLD,
    VALID_REASON_CATEGORIES,
    VALID_ADJUSTMENT_TYPES,
} from '../../constants/billing-refund.constant';

export class BillingRefundService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    private static generateCode(prefix: string): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${dateStr}-${rand}`;
    }

    // NHÓM 1: YÊU CẦU HOÀN TIỀN

    /**
     * Tạo yêu cầu hoàn tiền
     * - FULL: hoàn toàn bộ số tiền GD gốc (trừ đã hoàn trước đó)
     * - PARTIAL: hoàn 1 phần
     * - Nếu ≤ AUTO_APPROVE_THRESHOLD → auto APPROVED
     */
    static async createRefundRequest(input: CreateRefundInput, userId: string): Promise<RefundRequest> {
        /* 1. Validate lý do */
        if (!VALID_REASON_CATEGORIES.includes(input.reason_category as any)) {
            throw REFUND_ERRORS.INVALID_REASON;
        }
        if (!input.reason_detail) throw REFUND_ERRORS.REASON_DETAIL_REQUIRED;

        /* 2. Lấy GD gốc */
        const txn = await BillingRefundRepository.getTransactionById(input.transaction_id);
        if (!txn) throw REFUND_ERRORS.TRANSACTION_NOT_FOUND;
        if (txn.status !== 'SUCCESS') throw REFUND_ERRORS.TRANSACTION_NOT_SUCCESS;

        /* 3. Tính remaining refundable */
        const originalAmount = parseFloat(txn.amount);
        const alreadyRefunded = await BillingRefundRepository.getTotalRefundedForTransaction(input.transaction_id);
        const maxRefundable = originalAmount - alreadyRefunded;

        if (maxRefundable <= 0) throw REFUND_ERRORS.TRANSACTION_FULLY_REFUNDED;

        /* 4. Xác định số tiền hoàn */
        let refundAmount: number;
        if (input.refund_type === REFUND_TYPE.FULL) {
            refundAmount = maxRefundable;
        } else {
            if (!input.refund_amount || input.refund_amount <= 0) throw REFUND_ERRORS.INVALID_AMOUNT;
            if (input.refund_amount > maxRefundable + 0.01) throw REFUND_ERRORS.REFUND_EXCEEDS_REMAINING;
            refundAmount = input.refund_amount;
        }

        /* 5. Phương thức hoàn (mặc định = PT gốc) */
        const refundMethod = input.refund_method || txn.payment_method;

        /* 6. Auto-approve nếu ≤ ngưỡng */
        const autoApprove = refundAmount <= AUTO_APPROVE_THRESHOLD;
        const status = autoApprove ? REFUND_STATUS.APPROVED : REFUND_STATUS.PENDING;

        const requestId = this.generateId('RFD');
        const requestCode = this.generateCode(REFUND_CONFIG.REQUEST_CODE_PREFIX);

        const refund = await BillingRefundRepository.createRefundRequest({
            request_id: requestId,
            request_code: requestCode,
            transaction_id: input.transaction_id,
            invoice_id: txn.invoice_id,
            patient_id: txn.patient_id,
            refund_type: input.refund_type,
            original_amount: originalAmount.toFixed(2),
            refund_amount: refundAmount.toFixed(2),
            refund_method: refundMethod,
            reason_category: input.reason_category,
            reason_detail: input.reason_detail,
            evidence_urls: input.evidence_urls || null,
            status,
            requested_by: userId,
            notes: input.notes || null,
            facility_id: input.facility_id || null,
        } as any);

        /* Nếu auto-approve, cập nhật approved fields */
        if (autoApprove) {
            await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.APPROVED, {
                approved_by: userId, approved_at: new Date(),
            });
        }

        return (await BillingRefundRepository.getRefundById(requestId))!;
    }

    /** Danh sách yêu cầu hoàn tiền */
    static async getRefundRequests(
        status?: string, refundType?: string, reasonCategory?: string,
        patientId?: string, dateFrom?: string, dateTo?: string,
        page: number = REFUND_CONFIG.DEFAULT_PAGE,
        limit: number = REFUND_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<RefundRequest>> {
        const safeLimit = Math.min(limit, REFUND_CONFIG.MAX_LIMIT);
        return await BillingRefundRepository.getRefundRequests(
            status, refundType, reasonCategory, patientId, dateFrom, dateTo, page, safeLimit
        );
    }

    /** Chi tiết */
    static async getRefundById(requestId: string): Promise<RefundRequest> {
        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;
        return refund;
    }

    // NHÓM 2: PHÊ DUYỆT HOÀN TIỀN

    /** PENDING → APPROVED */
    static async approveRefund(requestId: string, userId: string): Promise<RefundRequest> {
        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;
        if (refund.status !== REFUND_STATUS.PENDING) throw REFUND_ERRORS.NOT_PENDING;

        return await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.APPROVED, {
            approved_by: userId, approved_at: new Date(),
        });
    }

    /** PENDING → REJECTED */
    static async rejectRefund(requestId: string, input: ApproveRejectInput, userId: string): Promise<RefundRequest> {
        if (!input.reject_reason) throw REFUND_ERRORS.REJECT_REASON_REQUIRED;

        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;
        if (refund.status !== REFUND_STATUS.PENDING) throw REFUND_ERRORS.NOT_PENDING;

        return await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.REJECTED, {
            rejected_by: userId, rejected_at: new Date(), reject_reason: input.reject_reason,
        });
    }

    /**
     * APPROVED → PROCESSING → COMPLETED
     * Tạo txn REFUND trong payment_transactions, cập nhật invoice
     */
    static async processRefund(requestId: string, userId: string): Promise<RefundRequest> {
        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;
        if (refund.status !== REFUND_STATUS.APPROVED) throw REFUND_ERRORS.NOT_APPROVED;

        const client = await BillingRefundRepository.getClient();
        try {
            await client.query('BEGIN');

            /* Đánh dấu PROCESSING */
            await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.PROCESSING, {
                processed_by: userId, processed_at: new Date(),
            }, client);

            /* Tạo giao dịch REFUND trong payment_transactions */
            const txnId = this.generateId('TXN');
            const txnCode = this.generateCode('TXN');
            const refundAmount = parseFloat(refund.refund_amount);

            await BillingRefundRepository.createRefundTransaction(
                txnId, txnCode, refund.invoice_id,
                refundAmount, refund.refund_method,
                `Hoàn tiền theo yêu cầu ${refund.request_code}`,
                userId, client
            );

            /* Cập nhật paid_amount + status trên invoice */
            await BillingRefundRepository.updateInvoicePaidAmount(refund.invoice_id, client);

            /* Đánh dấu COMPLETED */
            await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.COMPLETED, {
                completed_at: new Date(), refund_transaction_id: txnId,
            }, client);

            await client.query('COMMIT');
            return (await BillingRefundRepository.getRefundById(requestId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            /* Đánh dấu FAILED nếu lỗi */
            await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.FAILED, {
                notes: `Lỗi xử lý: ${(error as any).message || 'Unknown'}`,
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /** Hủy yêu cầu (chỉ PENDING) */
    static async cancelRefund(requestId: string, userId: string): Promise<RefundRequest> {
        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;
        if (refund.status !== REFUND_STATUS.PENDING) throw REFUND_ERRORS.CANNOT_CANCEL;

        return await BillingRefundRepository.updateRefundStatus(requestId, REFUND_STATUS.CANCELLED, {
            notes: `Hủy bởi user`,
        });
    }

    // NHÓM 3: ĐIỀU CHỈNH GIAO DỊCH

    /** Tạo điều chỉnh */
    static async createAdjustment(input: CreateAdjustmentInput, userId: string): Promise<TransactionAdjustment> {
        if (!VALID_ADJUSTMENT_TYPES.includes(input.adjustment_type as any)) {
            throw REFUND_ERRORS.INVALID_ADJUSTMENT_TYPE;
        }
        if (!input.description) throw REFUND_ERRORS.DESCRIPTION_REQUIRED;

        /* Kiểm tra GD gốc */
        const txn = await BillingRefundRepository.getTransactionById(input.original_transaction_id);
        if (!txn) throw REFUND_ERRORS.TRANSACTION_NOT_FOUND;

        const adjustmentId = this.generateId('ADJ');
        const adjustmentCode = this.generateCode(REFUND_CONFIG.ADJUSTMENT_CODE_PREFIX);

        return await BillingRefundRepository.createAdjustment({
            adjustment_id: adjustmentId,
            adjustment_code: adjustmentCode,
            original_transaction_id: input.original_transaction_id,
            invoice_id: txn.invoice_id,
            adjustment_type: input.adjustment_type,
            adjustment_amount: input.adjustment_amount.toFixed(2),
            description: input.description,
            requested_by: userId,
            notes: input.notes || null,
        } as any);
    }

    /** Danh sách */
    static async getAdjustments(
        status?: string, adjustmentType?: string,
        dateFrom?: string, dateTo?: string,
        page: number = REFUND_CONFIG.DEFAULT_PAGE,
        limit: number = REFUND_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<TransactionAdjustment>> {
        const safeLimit = Math.min(limit, REFUND_CONFIG.MAX_LIMIT);
        return await BillingRefundRepository.getAdjustments(status, adjustmentType, dateFrom, dateTo, page, safeLimit);
    }

    /** Chi tiết */
    static async getAdjustmentById(adjustmentId: string): Promise<TransactionAdjustment> {
        const adj = await BillingRefundRepository.getAdjustmentById(adjustmentId);
        if (!adj) throw REFUND_ERRORS.ADJUSTMENT_NOT_FOUND;
        return adj;
    }

    /** PENDING → APPROVED */
    static async approveAdjustment(adjustmentId: string, userId: string): Promise<TransactionAdjustment> {
        const adj = await BillingRefundRepository.getAdjustmentById(adjustmentId);
        if (!adj) throw REFUND_ERRORS.ADJUSTMENT_NOT_FOUND;
        if (adj.status !== ADJUSTMENT_STATUS.PENDING) throw REFUND_ERRORS.ADJ_NOT_PENDING;

        return await BillingRefundRepository.updateAdjustmentStatus(adjustmentId, ADJUSTMENT_STATUS.APPROVED, {
            approved_by: userId, approved_at: new Date(),
        });
    }

    /**
     * APPROVED → APPLIED — tạo GD bù/hoàn tương ứng
     * amount > 0 (UNDERCHARGE) → tạo PAYMENT bổ sung
     * amount < 0 (OVERCHARGE) → tạo REFUND
     */
    static async applyAdjustment(adjustmentId: string, userId: string): Promise<TransactionAdjustment> {
        const adj = await BillingRefundRepository.getAdjustmentById(adjustmentId);
        if (!adj) throw REFUND_ERRORS.ADJUSTMENT_NOT_FOUND;
        if (adj.status !== ADJUSTMENT_STATUS.APPROVED) throw REFUND_ERRORS.ADJ_NOT_APPROVED;

        const adjustmentAmount = parseFloat(adj.adjustment_amount);
        const txn = await BillingRefundRepository.getTransactionById(adj.original_transaction_id);
        if (!txn) throw REFUND_ERRORS.TRANSACTION_NOT_FOUND;

        const client = await BillingRefundRepository.getClient();
        try {
            await client.query('BEGIN');

            const corrTxnId = this.generateId('TXN');
            const corrTxnCode = this.generateCode('TXN');
            const txnType = adjustmentAmount < 0 ? 'REFUND' : 'PAYMENT';
            const absAmount = Math.abs(adjustmentAmount);

            /* Tạo GD bù/hoàn */
            const corrSql = `
                INSERT INTO payment_transactions (
                    payment_transactions_id, transaction_code, invoice_id,
                    transaction_type, payment_method, amount,
                    status, cashier_id, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, 'SUCCESS', $7, $8)
                RETURNING *
            `;
            await client.query(corrSql, [
                corrTxnId, corrTxnCode, adj.invoice_id,
                txnType, txn.payment_method, absAmount,
                userId, `Điều chỉnh ${adj.adjustment_code}: ${adj.description}`,
            ]);

            /* Cập nhật invoice */
            await BillingRefundRepository.updateInvoicePaidAmount(adj.invoice_id, client);

            /* Cập nhật adjustment */
            await BillingRefundRepository.updateAdjustmentStatus(adjustmentId, ADJUSTMENT_STATUS.APPLIED, {
                applied_by: userId, applied_at: new Date(),
                corrective_transaction_id: corrTxnId,
            }, client);

            await client.query('COMMIT');
            return (await BillingRefundRepository.getAdjustmentById(adjustmentId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** PENDING → REJECTED */
    static async rejectAdjustment(adjustmentId: string, input: ApproveRejectInput, userId: string): Promise<TransactionAdjustment> {
        if (!input.reject_reason) throw REFUND_ERRORS.REJECT_REASON_REQUIRED;

        const adj = await BillingRefundRepository.getAdjustmentById(adjustmentId);
        if (!adj) throw REFUND_ERRORS.ADJUSTMENT_NOT_FOUND;
        if (adj.status !== ADJUSTMENT_STATUS.PENDING) throw REFUND_ERRORS.ADJ_NOT_PENDING;

        return await BillingRefundRepository.updateAdjustmentStatus(adjustmentId, ADJUSTMENT_STATUS.REJECTED, {
            reject_reason: input.reject_reason,
        });
    }

    // NHÓM 4: DASHBOARD & TRACKING

    /** Dashboard tổng quan */
    static async getDashboard(): Promise<RefundDashboard> {
        const stats = await BillingRefundRepository.getDashboardStats();
        const byReason = await BillingRefundRepository.getRefundsByReason();
        const byStatus = await BillingRefundRepository.getRefundsByStatus();
        const recentRequests = await BillingRefundRepository.getRecentPending(10);

        return {
            pending_count: parseInt(stats.pending_count) || 0,
            pending_amount: stats.pending_amount || '0',
            total_refunded: stats.total_refunded || '0',
            total_refund_count: parseInt(stats.total_refund_count) || 0,
            by_reason: byReason.map(r => ({
                reason_category: r.reason_category,
                count: parseInt(r.count),
                total: r.total,
            })),
            by_status: byStatus.map(s => ({
                status: s.status,
                count: parseInt(s.count),
            })),
            recent_requests: recentRequests,
        };
    }

    /** Timeline sự kiện cho yêu cầu hoàn tiền */
    static async getRefundTimeline(requestId: string): Promise<RefundTimelineEvent[]> {
        const refund = await BillingRefundRepository.getRefundById(requestId);
        if (!refund) throw REFUND_ERRORS.REQUEST_NOT_FOUND;

        const events: RefundTimelineEvent[] = [];

        events.push({
            event: 'CREATED',
            timestamp: refund.requested_at,
            user_name: refund.requested_by_name || null,
            detail: `Tạo yêu cầu hoàn tiền ${refund.refund_type} — ${parseFloat(refund.refund_amount).toLocaleString('vi-VN')} VND`,
        });

        if (refund.approved_at) {
            events.push({
                event: 'APPROVED',
                timestamp: refund.approved_at,
                user_name: refund.approved_by_name || null,
                detail: parseFloat(refund.refund_amount) <= AUTO_APPROVE_THRESHOLD ? 'Tự động phê duyệt (≤ 50,000 VND)' : 'Phê duyệt thủ công',
            });
        }

        if (refund.rejected_at) {
            events.push({
                event: 'REJECTED',
                timestamp: refund.rejected_at,
                user_name: refund.rejected_by_name || null,
                detail: refund.reject_reason,
            });
        }

        if (refund.processed_at) {
            events.push({
                event: 'PROCESSING',
                timestamp: refund.processed_at,
                user_name: refund.processed_by_name || null,
                detail: 'Đang xử lý hoàn tiền — tạo giao dịch hoàn',
            });
        }

        if (refund.completed_at) {
            events.push({
                event: 'COMPLETED',
                timestamp: refund.completed_at,
                user_name: refund.processed_by_name || null,
                detail: `Hoàn tiền thành công — GD hoàn: ${refund.refund_transaction_id || 'N/A'}`,
            });
        }

        if (refund.status === REFUND_STATUS.CANCELLED) {
            events.push({
                event: 'CANCELLED',
                timestamp: refund.updated_at,
                user_name: null,
                detail: 'Yêu cầu đã bị hủy',
            });
        }

        return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    /** Lịch sử hoàn/điều chỉnh cho 1 GD */
    static async getTransactionHistory(transactionId: string): Promise<any> {
        const txn = await BillingRefundRepository.getTransactionById(transactionId);
        if (!txn) throw REFUND_ERRORS.TRANSACTION_NOT_FOUND;

        const history = await BillingRefundRepository.getTransactionRefundHistory(transactionId);

        return {
            transaction_id: transactionId,
            transaction_code: txn.transaction_code,
            original_amount: txn.amount,
            payment_method: txn.payment_method,
            status: txn.status,
            refund_requests: history.refunds,
            adjustments: history.adjustments,
        };
    }
}
