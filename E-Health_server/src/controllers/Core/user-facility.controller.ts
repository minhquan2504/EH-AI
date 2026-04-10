import { Request, Response, NextFunction } from "express";
import { UserFacilityService } from "../../services/Facility Management/user-facility.service";
import { AssignUserFacilityInput, RemoveUserFacilityInput } from "../../models/Facility Management/facility.model";
import { AppError } from "../../utils/app-error.util";

export class UserFacilityController {
    /**
     * Lấy danh sách cơ sở/chi nhánh của người dùng
     */
    static async getUserFacilities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const facilities = await UserFacilityService.getUserFacilities(userId);

            res.status(200).json({
                status: "success",
                data: facilities
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán người dùng vào một Chi nhánh / Phòng ban
     */
    static async assignUserToFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const assignData: AssignUserFacilityInput = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserFacilityService.assignUserToFacility(userId, assignData, adminId, ipAddress, userAgent);

            res.status(200).json({
                status: "success",
                message: "Gán nhân sự vào chi nhánh thành công"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa người dùng khỏi Chi nhánh
     */
    static async removeUserFromFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const branchId = req.params.facilityId as string;

            const reqBody: RemoveUserFacilityInput = req.body;
            if (!reqBody.reason) {
                throw new AppError(400, 'MISSING_REASON', 'Vui lòng cung cấp lý do xóa nhân sự khỏi chi nhánh');
            }

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserFacilityService.removeUserFromFacility(userId, branchId, reqBody.reason, adminId, ipAddress, userAgent);

            res.status(200).json({
                status: "success",
                message: "Đã hủy bổ nhiệm nhân sự tại chi nhánh này"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thuyên chuyển nhân sự sang Chi nhánh khác
     */
    static async transferUserToFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId as string;
            const oldBranchId = req.params.facilityId as string;
            const assignData: AssignUserFacilityInput = req.body;

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            await UserFacilityService.transferUserToFacility(userId, oldBranchId, assignData, adminId, ipAddress, userAgent);

            res.status(200).json({
                status: "success",
                message: "Thuyên chuyển nhân sự thành công"
            });
        } catch (error) {
            next(error);
        }
    }
}
