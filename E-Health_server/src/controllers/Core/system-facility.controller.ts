import { Request, Response, NextFunction } from 'express';
import { FacilityService } from '../../services/Facility Management/facility.service';
import { FacilityController as FacilityDropdownController } from '../../controllers/Facility Management/facility.controller';
import { UpdateFacilityInfoInput } from '../../models/Facility Management/facility.model';

export class SystemFacilityController {
    /**
     * Lấy thông tin chi tiết cơ sở y tế
     */
    static async getFacilityInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await FacilityService.getFacilityInfo();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin cơ sở y tế (Admin only)
     */
    static async updateFacilityInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateFacilityInfoInput = req.body;
            const data = await FacilityService.updateFacilityInfo(input);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload logo cơ sở y tế lên Cloudinary (Admin only)
     */
    static async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    code: 'SYS_005',
                    message: 'Không tìm thấy file tải lên.',
                });
                return;
            }

            const data = await FacilityService.uploadLogo(req.file);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

// Re-export controller cũ để không break existing route
export { FacilityDropdownController };
