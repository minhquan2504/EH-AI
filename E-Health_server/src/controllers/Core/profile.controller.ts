import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../../services/Core/profile.service';
import { UpdateProfileInput, ChangePasswordInput, UpdateSettingsInput } from '../../models/Core/profile.model';

export class ProfileController {
    /**
     * Xem hồ sơ cá nhân
     */
    static async getMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const profile = await ProfileService.getMyProfile(userId!);

            res.status(200).json({
                success: true,
                message: 'Lấy thông tin hồ sơ thành công.',
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin hồ sơ cơ bản
     */
    static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const data: UpdateProfileInput = req.body;

            const profile = await ProfileService.updateMyProfile(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ thành công.',
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đổi mật khẩu
     */
    static async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const data: ChangePasswordInput = req.body;

            await ProfileService.changePassword(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xem danh sách các phiên đăng nhập đang Active
     */
    static async getMySessions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;

            const sessions = await ProfileService.getMySessions(userId!, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách phiên bản đăng nhập thành công.',
                data: sessions
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng xuất/Thu hồi một thiết bị cụ thể 
     */
    static async revokeSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;
            const sessionId = req.params.sessionId as string;

            await ProfileService.revokeSession(userId!, sessionId, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Đã thu hồi phiên bản đăng nhập thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng xuất tất cả thiết bị khác
     */
    static async revokeAllOtherSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const currentSessionId = (req as any).auth?.sessionId;

            await ProfileService.revokeAllOtherSessions(userId!, currentSessionId!);

            res.status(200).json({
                success: true,
                message: 'Đã thu hồi tất cả các thiết bị đăng nhập khác thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật Cài đặt cá nhân
     */
    static async updateMySettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).auth?.user_id;
            const data: UpdateSettingsInput = req.body;

            const profile = await ProfileService.updateMySettings(userId!, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật cài đặt cá nhân thành công.',
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }
}
