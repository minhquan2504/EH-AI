import { randomUUID } from 'crypto';
import { PaymentGatewayRepository } from '../../repository/Billing/billing-payment-gateway.repository';
import { BillingInvoiceRepository } from '../../repository/Billing/billing-invoices.repository';
import {
    PaymentOrder,
    QRGenerateInput,
    GatewayConfig,
    UpdateGatewayConfigInput,
    SepayWebhookPayload,
    PaginatedPaymentOrders,
    OnlinePaymentStats,
} from '../../models/Billing/billing-payment-gateway.model';
import {
    PAYMENT_ORDER_STATUS,
    PAYMENT_GATEWAY_ERRORS,
    PAYMENT_GATEWAY_CONFIG,
    GATEWAY_NAME,
} from '../../constants/billing-payment-gateway.constant';
import { INVOICE_STATUS } from '../../constants/billing-invoices.constant';
import { generateSepayQRUrl } from '../../config/sepay';

export class PaymentGatewayService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /** Tạo mã lệnh thanh toán: EHealth + 5 số ngẫu nhiên (VD: EHealth83921) */
    private static generateOrderCode(): string {
        const rand = Math.floor(10000 + Math.random() * 90000);
        return `EHealth${rand}`;
    }

    // QR GENERATION

    /**
     * Sinh QR Code thanh toán cho hóa đơn
     */
    static async generateQR(input: QRGenerateInput, userId: string): Promise<PaymentOrder> {
        /* 1. Kiểm tra invoice */
        const invoice = await BillingInvoiceRepository.getInvoiceById(input.invoice_id);
        if (!invoice) throw PAYMENT_GATEWAY_ERRORS.INVOICE_NOT_FOUND;
        if (invoice.status === INVOICE_STATUS.CANCELLED) throw PAYMENT_GATEWAY_ERRORS.INVOICE_CANCELLED;
        if (invoice.status === INVOICE_STATUS.PAID) throw PAYMENT_GATEWAY_ERRORS.INVOICE_ALREADY_PAID;

        /* 2. Tính số tiền còn lại */
        const netAmount = parseFloat(invoice.net_amount);
        const paidAmount = parseFloat(invoice.paid_amount);
        const remaining = netAmount - paidAmount;

        if (remaining <= 0) throw PAYMENT_GATEWAY_ERRORS.INVOICE_ALREADY_PAID;

        const amount = input.amount || remaining;
        if (amount <= 0) throw PAYMENT_GATEWAY_ERRORS.INVALID_AMOUNT;
        if (amount > remaining) throw PAYMENT_GATEWAY_ERRORS.AMOUNT_EXCEEDS_REMAINING;

        /* 3. Kiểm tra nếu đã có order PENDING chưa hết hạn */
        const existingOrder = await PaymentGatewayRepository.getPendingOrderByInvoice(input.invoice_id);
        if (existingOrder) {
            /* Trả lại order cũ kèm thời gian còn lại */
            return (await PaymentGatewayRepository.getOrderById(existingOrder.payment_orders_id))!;
        }

        /* 4. Lấy cấu hình gateway */
        const config = await PaymentGatewayRepository.getGatewayConfig(GATEWAY_NAME.SEPAY);
        if (!config) throw PAYMENT_GATEWAY_ERRORS.GATEWAY_NOT_CONFIGURED;
        if (!config.is_active) throw PAYMENT_GATEWAY_ERRORS.GATEWAY_INACTIVE;

        /* 5. Sinh mã order + QR URL — nội dung CK chỉ là order_code */
        const orderId = this.generateId('PO');
        const orderCode = this.generateOrderCode();
        const transferContent = orderCode;

        const bankAccount = config.bank_account_number || config.va_account || '';
        const bankName = config.bank_name || 'MBBank';
        const qrCodeUrl = generateSepayQRUrl(bankAccount, bankName, amount, transferContent);

        /* 6. Tính thời gian hết hạn */
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + PAYMENT_GATEWAY_CONFIG.QR_EXPIRY_MINUTES);

        const description = input.description || `Thanh toán hóa đơn ${invoice.invoice_code}`;

        /* 7. Lưu DB */
        await PaymentGatewayRepository.createPaymentOrder(
            orderId, orderCode, input.invoice_id,
            amount, description, qrCodeUrl, expiresAt, userId
        );

        return (await PaymentGatewayRepository.getOrderById(orderId))!;
    }

    // WEBHOOK
    /**
     * Xử lý webhook callback từ SePay
     */
    static async handleWebhook(payload: SepayWebhookPayload): Promise<{ processed: boolean; message: string }> {
        /* 1. Chỉ xử lý giao dịch tiền vào */
        if (payload.transferType !== 'in') {
            return { processed: false, message: 'Bỏ qua: không phải giao dịch tiền vào.' };
        }

        /* 2. Tìm order từ nội dung chuyển khoản */
        const order = await PaymentGatewayRepository.findOrderByTransferContent(payload.content);
        if (!order) {
            return { processed: false, message: 'Không tìm thấy lệnh thanh toán phù hợp.' };
        }

        /* 3. Idempotent check — đã xử lý rồi thì skip */
        if (order.status === PAYMENT_ORDER_STATUS.PAID) {
            return { processed: false, message: 'Lệnh thanh toán đã được xử lý trước đó.' };
        }

        /* 4. Kiểm tra order còn hợp lệ */
        if (order.status === PAYMENT_ORDER_STATUS.EXPIRED) {
            return { processed: false, message: 'Lệnh thanh toán đã hết hạn.' };
        }
        if (order.status === PAYMENT_ORDER_STATUS.CANCELLED) {
            return { processed: false, message: 'Lệnh thanh toán đã bị hủy.' };
        }

        /* 5. Kiểm tra số tiền */
        const orderAmount = parseFloat(order.amount);
        if (payload.transferAmount < orderAmount) {
            return { processed: false, message: `Số tiền chuyển (${payload.transferAmount}) nhỏ hơn yêu cầu (${orderAmount}).` };
        }

        /* 6. Transaction: cập nhật order + tạo payment + update invoice */
        const client = await PaymentGatewayRepository.getClient();
        try {
            await client.query('BEGIN');

            /* Cập nhật order → PAID */
            await PaymentGatewayRepository.markOrderPaid(
                order.payment_orders_id,
                payload.referenceNumber,
                payload,
                client
            );

            /* Tạo payment_transactions */
            const txnId = this.generateId('TXN');
            const txnCode = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const txnSql = `
                INSERT INTO payment_transactions (
                    payment_transactions_id, transaction_code, invoice_id,
                    transaction_type, payment_method, amount,
                    gateway_transaction_id, gateway_response,
                    status, notes
                ) VALUES ($1, $2, $3, 'PAYMENT', 'BANK_TRANSFER', $4, $5, $6, 'SUCCESS', $7)
            `;
            await client.query(txnSql, [
                txnId, txnCode, order.invoice_id,
                payload.transferAmount,
                payload.referenceNumber,
                JSON.stringify(payload),
                `Thanh toán online qua SePay - ${order.order_code}`,
            ]);

            /* Cập nhật paid_amount + status trên invoice */
            await BillingInvoiceRepository.updatePaidAmount(order.invoice_id, client);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return { processed: true, message: 'Giao dịch đã được ghi nhận thành công.' };
    }

    // ORDER MANAGEMENT

    /** Lấy chi tiết lệnh thanh toán */
    static async getOrderById(orderId: string): Promise<PaymentOrder> {
        const order = await PaymentGatewayRepository.getOrderById(orderId);
        if (!order) throw PAYMENT_GATEWAY_ERRORS.ORDER_NOT_FOUND;
        return order;
    }

    /** Kiểm tra trạng thái (polling từ frontend) */
    static async getOrderStatus(orderId: string): Promise<{ status: string; remaining_seconds: number; paid_at: string | null }> {
        const order = await PaymentGatewayRepository.getOrderById(orderId);
        if (!order) throw PAYMENT_GATEWAY_ERRORS.ORDER_NOT_FOUND;

        /* Auto-expire nếu quá hạn */
        if (order.status === PAYMENT_ORDER_STATUS.PENDING && new Date(order.expires_at) <= new Date()) {
            await PaymentGatewayRepository.cancelOrder(orderId);
            return { status: PAYMENT_ORDER_STATUS.EXPIRED, remaining_seconds: 0, paid_at: null };
        }

        return {
            status: order.status,
            remaining_seconds: order.remaining_seconds || 0,
            paid_at: order.paid_at,
        };
    }

    /** Hủy lệnh thanh toán */
    static async cancelOrder(orderId: string): Promise<PaymentOrder> {
        const order = await PaymentGatewayRepository.getOrderById(orderId);
        if (!order) throw PAYMENT_GATEWAY_ERRORS.ORDER_NOT_FOUND;
        if (order.status === PAYMENT_ORDER_STATUS.PAID) throw PAYMENT_GATEWAY_ERRORS.ORDER_ALREADY_PAID;
        if (order.status === PAYMENT_ORDER_STATUS.CANCELLED) throw PAYMENT_GATEWAY_ERRORS.ORDER_CANCELLED;

        return await PaymentGatewayRepository.cancelOrder(orderId);
    }

    /** Danh sách QR đã sinh cho 1 HĐ */
    static async getOrdersByInvoice(invoiceId: string): Promise<PaymentOrder[]> {
        const invoice = await BillingInvoiceRepository.getInvoiceById(invoiceId);
        if (!invoice) throw PAYMENT_GATEWAY_ERRORS.INVOICE_NOT_FOUND;

        return await PaymentGatewayRepository.getOrdersByInvoice(invoiceId);
    }

    /**
     * Xác minh thủ công — kiểm tra giao dịch qua SePay API
     */
    static async manualVerify(orderId: string): Promise<PaymentOrder> {
        const order = await PaymentGatewayRepository.getOrderById(orderId);
        if (!order) throw PAYMENT_GATEWAY_ERRORS.ORDER_NOT_FOUND;
        if (order.status === PAYMENT_ORDER_STATUS.PAID) throw PAYMENT_GATEWAY_ERRORS.ORDER_ALREADY_PAID;

        /* Gọi SePay API kiểm tra giao dịch */
        const config = await PaymentGatewayRepository.getGatewayConfig(GATEWAY_NAME.SEPAY);
        if (!config) throw PAYMENT_GATEWAY_ERRORS.GATEWAY_NOT_CONFIGURED;

        try {
            const response = await fetch(
                `${PAYMENT_GATEWAY_CONFIG.SEPAY_API_BASE_URL}/transactions/list?limit=20&account_number=${config.va_account || config.bank_account_number}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.api_key}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw PAYMENT_GATEWAY_ERRORS.GATEWAY_CONNECTION_FAILED;

            const data = await response.json();
            const transactions = data.transactions || [];

            /* Tìm giao dịch có nội dung match order_code */
            const matchedTxn = transactions.find((txn: any) =>
                txn.transaction_content &&
                txn.transaction_content.includes(order.order_code) &&
                parseFloat(txn.amount_in) >= parseFloat(order.amount)
            );

            if (matchedTxn) {
                /* Tìm thấy → xử lý như webhook */
                const webhookPayload: SepayWebhookPayload = {
                    id: matchedTxn.id,
                    gateway: 'SEPAY',
                    transactionDate: matchedTxn.transaction_date,
                    accountNumber: config.va_account || config.bank_account_number || '',
                    subAccount: null,
                    transferType: 'in',
                    transferAmount: parseFloat(matchedTxn.amount_in),
                    accumulated: 0,
                    code: null,
                    content: matchedTxn.transaction_content,
                    referenceNumber: matchedTxn.reference_number || `MANUAL_${Date.now()}`,
                    description: matchedTxn.description || '',
                };
                await this.handleWebhook(webhookPayload);
                return (await PaymentGatewayRepository.getOrderById(orderId))!;
            }
        } catch (error: any) {
            if (error.code) throw error; /* Business error */
            throw PAYMENT_GATEWAY_ERRORS.GATEWAY_CONNECTION_FAILED;
        }

        /* Không tìm thấy giao dịch */
        return (await PaymentGatewayRepository.getOrderById(orderId))!;
    }

    // GATEWAY CONFIG

    /** Lấy cấu hình gateway (ẩn secret keys) */
    static async getGatewayConfig(): Promise<GatewayConfig> {
        const config = await PaymentGatewayRepository.getGatewayConfig(GATEWAY_NAME.SEPAY);
        if (!config) throw PAYMENT_GATEWAY_ERRORS.CONFIG_NOT_FOUND;

        /* Mask sensitive fields */
        return {
            ...config,
            api_key: config.api_key ? `****${config.api_key.slice(-4)}` : null,
            secret_key: config.secret_key ? '****' : null,
            webhook_secret: config.webhook_secret ? '****' : null,
        };
    }

    /** Cập nhật cấu hình gateway */
    static async updateGatewayConfig(input: UpdateGatewayConfigInput): Promise<GatewayConfig> {
        const config = await PaymentGatewayRepository.getGatewayConfig(GATEWAY_NAME.SEPAY);
        if (!config) throw PAYMENT_GATEWAY_ERRORS.CONFIG_NOT_FOUND;

        return await PaymentGatewayRepository.updateGatewayConfig(GATEWAY_NAME.SEPAY, input);
    }

    /** Test kết nối gateway — gọi SePay API list transactions */
    static async testConnection(): Promise<{ success: boolean; message: string }> {
        const config = await PaymentGatewayRepository.getGatewayConfig(GATEWAY_NAME.SEPAY);
        if (!config) throw PAYMENT_GATEWAY_ERRORS.GATEWAY_NOT_CONFIGURED;

        try {
            const response = await fetch(
                `${PAYMENT_GATEWAY_CONFIG.SEPAY_API_BASE_URL}/transactions/list?limit=1&account_number=${config.va_account || config.bank_account_number}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.api_key}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                return { success: true, message: 'Kết nối SePay thành công.' };
            } else {
                const errorData = await response.text();
                return { success: false, message: `SePay trả về lỗi ${response.status}: ${errorData}` };
            }
        } catch (error: any) {
            return { success: false, message: `Không thể kết nối: ${error.message}` };
        }
    }

    // =====================
    // HISTORY & STATS
    // =====================

    /** Lịch sử thanh toán online */
    static async getOnlinePaymentHistory(
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        page: number = PAYMENT_GATEWAY_CONFIG.DEFAULT_PAGE,
        limit: number = PAYMENT_GATEWAY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPaymentOrders> {
        const safeLimit = Math.min(limit, PAYMENT_GATEWAY_CONFIG.MAX_LIMIT);
        return await PaymentGatewayRepository.getOnlinePaymentHistory(status, dateFrom, dateTo, search, page, safeLimit);
    }

    /** Thống kê thanh toán online */
    static async getOnlinePaymentStats(
        dateFrom?: string,
        dateTo?: string
    ): Promise<OnlinePaymentStats> {
        return await PaymentGatewayRepository.getOnlinePaymentStats(dateFrom, dateTo);
    }
}
