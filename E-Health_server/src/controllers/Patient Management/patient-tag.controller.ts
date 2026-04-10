import { Request, Response, NextFunction } from 'express';
import { PatientTagService } from '../../services/Patient Management/patient-tag.service';
import {
    TAG_MESSAGES,
    PATIENT_TAG_MESSAGES,
    TAG_PAGINATION
} from '../../constants/patient-tag.constant';

export class PatientTagController {


    /** Tạo mới Tag */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await PatientTagService.create(req.body);
            res.status(201).json({ success: true, message: TAG_MESSAGES.CREATE_SUCCESS, data });
        } catch (error) {
            next(error);
        }
    }

    /** Danh sách Tag */
    static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string, 10) || TAG_PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || TAG_PAGINATION.DEFAULT_LIMIT;
            const isActive = req.query.is_active !== undefined
                ? req.query.is_active === 'true'
                : undefined;

            const result = await PatientTagService.getAll(page, limit, isActive);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    /** Chi tiết Tag */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientTagService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** Cập nhật Tag */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientTagService.update(id, req.body);
            res.status(200).json({ success: true, message: TAG_MESSAGES.UPDATE_SUCCESS, data });
        } catch (error) {
            next(error);
        }
    }

    /** Xóa mềm Tag */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await PatientTagService.delete(id);
            res.status(200).json({ success: true, message: TAG_MESSAGES.DELETE_SUCCESS });
        } catch (error) {
            next(error);
        }
    }

    /** Gắn tag cho bệnh nhân */
    static async assignTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const { tag_id } = req.body;
            const assignedBy = (req as any).user?.userId || null;

            const data = await PatientTagService.assignTag(patientId, tag_id, assignedBy);
            res.status(201).json({ success: true, message: PATIENT_TAG_MESSAGES.ASSIGN_SUCCESS, data });
        } catch (error) {
            next(error);
        }
    }

    /** Danh sách tag của bệnh nhân */
    static async getPatientTags(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientTagService.getPatientTags(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** Gỡ tag khỏi bệnh nhân */
    static async removeTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId, tagId } = req.params as { patientId: string; tagId: string };
            await PatientTagService.removeTag(patientId, tagId);
            res.status(200).json({ success: true, message: PATIENT_TAG_MESSAGES.REMOVE_SUCCESS });
        } catch (error) {
            next(error);
        }
    }
}
