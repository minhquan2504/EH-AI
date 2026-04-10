import { Request, Response, NextFunction } from 'express';
import { BillingCashierAuthService } from '../../services/Billing/billing-cashier-auth.service';
import { CASHIER_AUTH_CONFIG, CASHIER_AUTH_SUCCESS } from '../../constants/billing-cashier-auth.constant';

export class BillingCashierAuthController {

    // ═══ NHÓM 1: HỒ SƠ THU NGÂN ═══

    static async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.createProfile(req.body, userId);
            res.status(201).json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { branch_id, facility_id, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getProfiles(
                branch_id as string, facility_id as string, is_active as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    static async getProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getProfileById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.updateProfile(String(req.params.id), req.body, userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await BillingCashierAuthService.deleteProfile(String(req.params.id));
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.PROFILE_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getProfileByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getProfileByUserId(String(req.params.userId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 2: GIỚI HẠN ═══

    static async setLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingCashierAuthService.setLimit(req.body, userId);
            res.status(201).json({ success: true, message: CASHIER_AUTH_SUCCESS.LIMIT_SET, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getLimit(String(req.params.profileId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async updateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.updateLimit(String(req.params.profileId), req.body);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.LIMIT_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async checkLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.checkLimit(req.body);
            const statusCode = data.allowed ? 200 : 403;
            res.status(statusCode).json({
                success: data.allowed,
                message: data.allowed ? CASHIER_AUTH_SUCCESS.LIMIT_PASSED : 'Thao tác vượt giới hạn.',
                data,
            });
        } catch (error: any) {
            if (error.code) { res.status(403).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: KHÓA CA ═══

    static async lockShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.lockShift(String(req.params.shiftId), userId, req.body.reason);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_LOCKED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async unlockShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.unlockShift(String(req.params.shiftId), userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_UNLOCKED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async forceCloseShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.forceCloseShift(String(req.params.shiftId), userId);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_FORCE_CLOSED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async handoverShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            await BillingCashierAuthService.handoverShift(String(req.params.shiftId), userId, req.body.handover_to);
            res.json({ success: true, message: CASHIER_AUTH_SUCCESS.SHIFT_HANDOVER });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 4: NHẬT KÝ ═══

    static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { action_type, user_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getLogs(
                action_type as string, user_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    static async getLogsByProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = req.query.page ? parseInt(String(req.query.page)) : CASHIER_AUTH_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : CASHIER_AUTH_CONFIG.DEFAULT_LIMIT;
            const data = await BillingCashierAuthService.getLogsByProfile(String(req.params.profileId), page, limit);
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    static async getLogsByShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getLogsByShift(String(req.params.shiftId));
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    // ═══ NHÓM 5: DASHBOARD ═══

    static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getDashboard();
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    static async getCashierStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getCashierStats(String(req.params.profileId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getActiveShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingCashierAuthService.getActiveShifts();
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }
}
