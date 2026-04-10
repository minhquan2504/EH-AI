import { Request, Response } from 'express';
import { PaymentGatewayService } from '../../services/Billing/billing-payment-gateway.service';
import {
    PAYMENT_GATEWAY_SUCCESS,
    PAYMENT_GATEWAY_CONFIG,
} from '../../constants/billing-payment-gateway.constant';

/** Sinh QR Code thanh toán */
export const generateQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const order = await PaymentGatewayService.generateQR(req.body, userId);
        res.status(201).json({ success: true, message: PAYMENT_GATEWAY_SUCCESS.QR_GENERATED, data: order });
    } catch (error: any) {
        const status = error.code ? 400 : 500;
        res.status(status).json({ success: false, ...error });
    }
};

/** Xem chi tiết lệnh thanh toán */
export const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const order = await PaymentGatewayService.getOrderById(String(req.params.orderId));
        res.json({ success: true, data: order });
    } catch (error: any) {
        const status = error.code === 'PGW_001' ? 404 : 400;
        res.status(status).json({ success: false, ...error });
    }
};

/** Kiểm tra trạng thái (polling) */
export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await PaymentGatewayService.getOrderStatus(String(req.params.orderId));
        res.json({ success: true, data: result });
    } catch (error: any) {
        const status = error.code === 'PGW_001' ? 404 : 400;
        res.status(status).json({ success: false, ...error });
    }
};

/** Hủy lệnh thanh toán */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const order = await PaymentGatewayService.cancelOrder(String(req.params.orderId));
        res.json({ success: true, message: PAYMENT_GATEWAY_SUCCESS.ORDER_CANCELLED, data: order });
    } catch (error: any) {
        const status = error.code ? 400 : 500;
        res.status(status).json({ success: false, ...error });
    }
};

/** Danh sách QR đã sinh cho 1 HĐ */
export const getOrdersByInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await PaymentGatewayService.getOrdersByInvoice(String(req.params.invoiceId));
        res.json({ success: true, data: orders });
    } catch (error: any) {
        const status = error.code === 'PGW_005' ? 404 : 400;
        res.status(status).json({ success: false, ...error });
    }
};

/** Webhook callback từ SePay — KHÔNG cần JWT, xác thực bằng API Key */
export const sepayWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await PaymentGatewayService.handleWebhook(req.body);
        res.json({ success: true, ...result });
    } catch (error: any) {
        /* Luôn trả 200 cho SePay để tránh retry loop */
        res.json({ success: false, message: error.message || 'Webhook processing error' });
    }
};

/** Xác minh thủ công giao dịch */
export const manualVerify = async (req: Request, res: Response): Promise<void> => {
    try {
        const order = await PaymentGatewayService.manualVerify(String(req.params.orderId));
        res.json({ success: true, data: order });
    } catch (error: any) {
        const status = error.code ? 400 : 500;
        res.status(status).json({ success: false, ...error });
    }
};

/** Xem cấu hình gateway */
export const getGatewayConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const config = await PaymentGatewayService.getGatewayConfig();
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(400).json({ success: false, ...error });
    }
};

/** Cập nhật cấu hình gateway */
export const updateGatewayConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const config = await PaymentGatewayService.updateGatewayConfig(req.body);
        res.json({ success: true, message: PAYMENT_GATEWAY_SUCCESS.CONFIG_UPDATED, data: config });
    } catch (error: any) {
        res.status(400).json({ success: false, ...error });
    }
};

/** Test kết nối gateway */
export const testGatewayConnection = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await PaymentGatewayService.testConnection();
        const status = result.success ? 200 : 502;
        res.status(status).json({ success: result.success, message: result.message });
    } catch (error: any) {
        res.status(500).json({ success: false, ...error });
    }
};

/** Lịch sử thanh toán online */
export const getOnlineHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, date_from, date_to, search, page, limit } = req.query;
        const result = await PaymentGatewayService.getOnlinePaymentHistory(
            status as string,
            date_from as string,
            date_to as string,
            search as string,
            parseInt(page as string) || PAYMENT_GATEWAY_CONFIG.DEFAULT_PAGE,
            parseInt(limit as string) || PAYMENT_GATEWAY_CONFIG.DEFAULT_LIMIT
        );
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Thống kê thanh toán online */
export const getOnlineStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date_from, date_to } = req.query;
        const stats = await PaymentGatewayService.getOnlinePaymentStats(
            date_from as string,
            date_to as string
        );
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
