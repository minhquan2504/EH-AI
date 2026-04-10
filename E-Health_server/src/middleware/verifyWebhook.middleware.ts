import { Request, Response, NextFunction } from 'express';
import { PAYMENT_GATEWAY_ERRORS } from '../constants/billing-payment-gateway.constant';

/**
 * Middleware xác thực webhook từ SePay
 */
export const verifySepayWebhook = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET || '';

    /* SePay format: "Apikey xxx" */
    const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, '');

    if (token !== webhookSecret) {
        res.status(401).json({
            success: false,
            ...PAYMENT_GATEWAY_ERRORS.WEBHOOK_AUTH_FAILED,
        });
        return;
    }

    next();
};
