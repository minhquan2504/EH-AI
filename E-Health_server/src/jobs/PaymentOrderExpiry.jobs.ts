import cron from 'node-cron';
import { PaymentGatewayRepository } from '../repository/Billing/billing-payment-gateway.repository';

/**
 * Cron job: Tự động chuyển các lệnh thanh toán QR đã quá hạn sang EXPIRED
 */
export const startPaymentOrderExpiryJob = (): void => {
    cron.schedule('* * * * *', async () => {
        try {
            const expiredCount = await PaymentGatewayRepository.expirePendingOrders();
            if (expiredCount > 0) {
                console.log(`[PaymentOrderExpiry] Đã chuyển ${expiredCount} lệnh thanh toán sang EXPIRED.`);
            }
        } catch (error) {
            console.error('[PaymentOrderExpiry] Lỗi khi xử lý hết hạn:', error);
        }
    });
    console.log('[PaymentOrderExpiry] Cron job đã khởi động (mỗi 1 phút).');
};
