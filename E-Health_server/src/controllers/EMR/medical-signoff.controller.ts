import { Request, Response } from 'express';
import { SignOffService } from '../../services/EMR/medical-signoff.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SIGNOFF_SUCCESS } from '../../constants/medical-signoff.constant';


export class SignOffController {

    /** API 1: PATCH /api/sign-off/:encounterId/complete */
    static async completeEncounter(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const roles = (req as any).auth?.roles || [];
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.completeEncounter(encounterId, userId, roles, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.COMPLETED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.completeEncounter] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 2: POST /api/sign-off/:encounterId/draft-sign */
    static async draftSign(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.draftSign(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SIGNOFF_SUCCESS.DRAFT_SIGNED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.draftSign] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 3: POST /api/sign-off/:encounterId/official-sign */
    static async officialSign(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.officialSign(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SIGNOFF_SUCCESS.OFFICIAL_SIGNED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.officialSign] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 4: POST /api/sign-off/:encounterId/revoke */
    static async revoke(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.revoke(encounterId, req.body, userId, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.REVOKED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.revoke] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 5: GET /api/sign-off/:encounterId/signatures */
    static async getSignatures(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getSignatures(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.SIGNATURES_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.getSignatures] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 6: GET /api/sign-off/:encounterId/verify */
    static async verify(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await SignOffService.verify(encounterId, userId, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.VERIFIED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.verify] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 7: GET /api/sign-off/:encounterId/audit-log */
    static async getAuditLog(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getAuditLog(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.AUDIT_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.getAuditLog] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 8: GET /api/sign-off/:encounterId/lock-status */
    static async getLockStatus(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await SignOffService.getLockStatus(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.LOCK_STATUS_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.getLockStatus] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 9: GET /api/sign-off/by-doctor/pending */
    static async getPending(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const roles = (req as any).auth?.roles || [];
            const data = await SignOffService.getPendingForDoctor(userId, roles);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SIGNOFF_SUCCESS.PENDING_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[SignOffController.getPending] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
