import { Request, Response, NextFunction } from 'express';
import { SignOffRepository } from '../repository/EMR/medical-signoff.repository';
import { HTTP_STATUS } from '../constants/httpStatus.constant';
import { SIGNOFF_ERRORS } from '../constants/medical-signoff.constant';

/**
 * Middleware kiểm tra khóa chỉnh sửa.
 */
export const checkEditLock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const encounterId =
            (req.params.encounterId as string) ||
            (req.body?.encounter_id as string) ||
            null;

        if (!encounterId) {
            return next();
        }

        const isLocked = await SignOffRepository.isOfficiallyLocked(encounterId);
        if (isLocked) {
            res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                code: 'ENCOUNTER_LOCKED',
                message: SIGNOFF_ERRORS.ENCOUNTER_LOCKED,
            });
            return;
        }

        next();
    } catch (error) {
        console.error('[checkEditLock] Error:', error);
        next();
    }
};
