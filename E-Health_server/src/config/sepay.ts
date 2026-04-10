export interface SepayConfig {
    merchantId: string;
    apiKey: string;
    webhookSecret: string;
    environment: string;
    bankAccount: string;
    bankName: string;
    vaAccount: string;
    qrBaseUrl: string;
    apiBaseUrl: string;
}

/** Đọc cấu hình SePay từ biến môi trường */
export function getSepayConfig(): SepayConfig {
    return {
        merchantId: process.env.SEPAY_MERCHANT_ID || '',
        apiKey: process.env.SEPAY_API_KEY || '',
        webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
        environment: process.env.SEPAY_ENVIRONMENT || 'SANDBOX',
        bankAccount: process.env.SEPAY_BANK_ACCOUNT || '',
        bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
        vaAccount: process.env.SEPAY_VA_ACCOUNT || '',
        qrBaseUrl: 'https://qr.sepay.vn/img',
        apiBaseUrl: 'https://my.sepay.vn/userapi',
    };
}

/**
 * Sinh URL ảnh QR Code thanh toán SePay
 */
export function generateSepayQRUrl(
    vaAccount: string,
    bankName: string,
    amount: number,
    content: string
): string {
    const params = new URLSearchParams({
        acc: vaAccount,
        bank: bankName,
        amount: amount.toString(),
        des: content,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
}
