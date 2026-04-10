import { Request, Response, NextFunction } from 'express';
import { SpecialtyServiceLogic } from '../../services/Facility Management/specialty-service.service';
import { AssignSpecialtyServicesInput } from '../../models/Facility Management/specialty-service.model';

export class SpecialtyServiceController {
    /**
     * Lấy danh sách dịch vụ gán cho chuyên khoa
     */
    static async getServicesBySpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { specialtyId } = req.params as { specialtyId: string };
            const data = await SpecialtyServiceLogic.getServicesBySpecialtyId(specialtyId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách chuyên khoa gán cho 1 dịch vụ
     */
    static async getSpecialtiesByService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { serviceId } = req.params as { serviceId: string };
            const data = await SpecialtyServiceLogic.getSpecialtiesByServiceId(serviceId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán danh sách dịch vụ vào chuyên khoa (Replace strategy)
     */
    static async assignServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { specialtyId } = req.params as { specialtyId: string };
            const input: AssignSpecialtyServicesInput = req.body;

            const result = await SpecialtyServiceLogic.assignServices(specialtyId, input.service_ids);

            res.status(200).json({
                success: true,
                message: `Đã gán ${result.assigned} dịch vụ cho chuyên khoa thành công.`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gỡ 1 dịch vụ khỏi chuyên khoa
     */
    static async removeService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { specialtyId, serviceId } = req.params as { specialtyId: string; serviceId: string };

            await SpecialtyServiceLogic.removeService(specialtyId, serviceId);

            res.status(200).json({
                success: true,
                message: 'Đã gỡ dịch vụ khỏi chuyên khoa thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
