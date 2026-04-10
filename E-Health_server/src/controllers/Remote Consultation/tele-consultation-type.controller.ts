import { Request, Response, NextFunction } from 'express';
import { TeleConsultationTypeService } from '../../services/Remote Consultation/tele-consultation-type.service';
import { REMOTE_CONSULTATION_CONFIG, REMOTE_CONSULTATION_SUCCESS } from '../../constants/remote-consultation.constant';

export class TeleConsultationTypeController {

    // ═══ NHÓM 1: QUẢN LÝ LOẠI HÌNH ═══

    static async createType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.createType(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { is_active, keyword } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT;
            const data = await TeleConsultationTypeService.getTypes(
                is_active as string, keyword as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    static async getTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getTypeById(String(req.params.typeId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async updateType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.updateType(String(req.params.typeId), req.body);
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async deleteType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await TeleConsultationTypeService.deleteType(String(req.params.typeId));
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.TYPE_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getActiveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getActiveTypes();
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    // ═══ NHÓM 2: CẤU HÌNH CHUYÊN KHOA ═══

    static async createConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.createConfig(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { type_id, specialty_id, facility_id, is_enabled, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT;
            const data = await TeleConsultationTypeService.getConfigs(
                type_id as string, specialty_id as string, facility_id as string,
                is_enabled as string, is_active as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    static async getConfigById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getConfigById(String(req.params.configId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.updateConfig(String(req.params.configId), req.body);
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async deleteConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await TeleConsultationTypeService.deleteConfig(String(req.params.configId));
            res.json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.CONFIG_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getSpecialtiesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getSpecialtiesByType(
                String(req.params.typeId), req.query.facility_id as string
            );
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    static async getTypesBySpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getTypesBySpecialty(
                String(req.params.specialtyId), req.query.facility_id as string
            );
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    static async batchCreateConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await TeleConsultationTypeService.batchCreateConfigs(req.body, userId);
            res.status(201).json({ success: true, message: REMOTE_CONSULTATION_SUCCESS.BATCH_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: TRA CỨU & THỐNG KÊ ═══

    static async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.checkAvailability(
                req.query.specialty_id as string, req.query.facility_id as string
            );
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await TeleConsultationTypeService.getStats();
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }
}
