/** Lệnh thanh toán QR */
export interface PaymentOrder {
    payment_orders_id: string;
    order_code: string;
    invoice_id: string;
    amount: string;
    description: string | null;
    qr_code_url: string | null;
    payment_url: string | null;
    gateway_order_id: string | null;
    status: string;
    expires_at: string;
    paid_at: string | null;
    gateway_transaction_id: string | null;
    gateway_response: any;
    created_by: string | null;
    created_at: string;
    updated_at: string;

    invoice_code?: string;
    patient_name?: string;
    remaining_seconds?: number;
}

/** Input tạo QR Code */
export interface QRGenerateInput {
    invoice_id: string;
    amount?: number;
    description?: string;
}

/** Cấu hình cổng thanh toán */
export interface GatewayConfig {
    config_id: string;
    gateway_name: string;
    merchant_id: string | null;
    api_key: string | null;
    secret_key: string | null;
    webhook_secret: string | null;
    environment: string;
    bank_account_number: string | null;
    bank_name: string | null;
    account_holder: string | null;
    va_account: string | null;
    is_active: boolean;
    config_data: any;
    created_at: string;
    updated_at: string;
}

/** Input cập nhật cấu hình */
export interface UpdateGatewayConfigInput {
    merchant_id?: string;
    api_key?: string;
    secret_key?: string;
    webhook_secret?: string;
    environment?: string;
    bank_account_number?: string;
    bank_name?: string;
    account_holder?: string;
    va_account?: string;
    is_active?: boolean;
}

/**
 * Payload webhook từ SePay
 */
export interface SepayWebhookPayload {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    subAccount: string | null;
    transferType: string;
    transferAmount: number;
    accumulated: number;
    code: string | null;
    content: string;
    referenceNumber: string;
    description: string;
}

/** Kết quả phân trang */
export interface PaginatedPaymentOrders {
    data: PaymentOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Thống kê thanh toán online */
export interface OnlinePaymentStats {
    total_orders: string;
    total_paid: string;
    total_expired: string;
    total_cancelled: string;
    total_pending: string;
    total_amount_paid: string;
    orders_by_status: Array<{ status: string; count: string; amount: string }>;
}
