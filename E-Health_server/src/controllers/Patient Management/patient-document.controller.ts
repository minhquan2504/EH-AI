import { Request, Response, NextFunction } from 'express';
import { PatientDocumentService } from '../../services/Patient Management/patient-document.service';
import {
    CreatePatientDocumentInput,
    UpdatePatientDocumentInput
} from '../../models/Patient Management/patient-document.model';
import { DOCUMENT_MESSAGES, DOCUMENT_VERSION_MESSAGES } from '../../constants/document.constant';

export class PatientDocumentController {
    /**
     * Upload tài liệu bệnh nhân (multipart/form-data)
     */
    static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreatePatientDocumentInput = {
                patient_id: req.body.patient_id,
                document_type_id: req.body.document_type_id,
                document_name: req.body.document_name,
                notes: req.body.notes,
            };
            const file = req.file as Express.Multer.File;
            const uploadedBy = (req as any).user?.userId || null;

            const data = await PatientDocumentService.upload(input, file, uploadedBy);
            res.status(201).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_UPLOAD_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Danh sách tài liệu bệnh nhân (phân trang, filter)
     */
    static async getList(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.query.patient_id as string;
            const documentTypeId = (req.query.document_type_id as string) || null;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await PatientDocumentService.getByPatient(patientId, documentTypeId, page, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Chi tiết tài liệu
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientDocumentService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật metadata tài liệu
     */
    static async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdatePatientDocumentInput = req.body;

            // Capture old value cho audit middleware
            const oldDoc = await PatientDocumentService.getById(id);
            (req as any).auditOldValue = oldDoc;

            const data = await PatientDocumentService.updateMetadata(id, input);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_UPDATE_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm tài liệu
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await PatientDocumentService.delete(id);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.DOC_DELETE_SUCCESS
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload phiên bản mới cho tài liệu
     */
    static async uploadVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const file = req.file as Express.Multer.File;
            const uploadedBy = (req as any).user?.userId || null;

            const data = await PatientDocumentService.uploadNewVersion(id, file, uploadedBy);
            res.status(201).json({
                success: true,
                message: DOCUMENT_VERSION_MESSAGES.VERSION_UPLOAD_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy lịch sử tất cả phiên bản của tài liệu
     */
    static async listVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientDocumentService.getVersionHistory(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Chi tiết 1 phiên bản cụ thể
     */
    static async getVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id, versionId } = req.params as { id: string; versionId: string };
            const data = await PatientDocumentService.getVersionById(id, versionId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xem tài liệu trực tiếp (inline — trình duyệt hiển thị, không tải về)
     */
    static async viewFile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const fileUrl = await PatientDocumentService.getFileUrl(id);
            res.redirect(302, fileUrl);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Ép trình duyệt tải file về máy (download attachment).
     * Dùng Cloudinary transformation flag fl_attachment để ép download.
     */
    static async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const fileUrl = await PatientDocumentService.getFileUrl(id);

            // Thêm fl_attachment vào URL Cloudinary để ép trình duyệt tải file
            const downloadUrl = fileUrl.includes('cloudinary.com')
                ? fileUrl.replace('/upload/', '/upload/fl_attachment/')
                : fileUrl;

            res.redirect(302, downloadUrl);
        } catch (error) {
            next(error);
        }
    }
}
