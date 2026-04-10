import { Request, Response, NextFunction } from 'express';
import { DocumentTypeService } from '../../services/Patient Management/document-type.service';
import {
    CreateDocumentTypeInput,
    UpdateDocumentTypeInput
} from '../../models/Patient Management/document-type.model';
import { DOCUMENT_MESSAGES } from '../../constants/document.constant';

export class DocumentTypeController {
    /**
     * Lấy danh sách loại tài liệu
     */
    static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await DocumentTypeService.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới loại tài liệu
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateDocumentTypeInput = req.body;
            const data = await DocumentTypeService.create(input);
            res.status(201).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_CREATE_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật loại tài liệu
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateDocumentTypeInput = req.body;
            const data = await DocumentTypeService.update(id, input);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_UPDATE_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm loại tài liệu
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await DocumentTypeService.delete(id);
            res.status(200).json({
                success: true,
                message: DOCUMENT_MESSAGES.TYPE_DELETE_SUCCESS
            });
        } catch (error) {
            next(error);
        }
    }
}
