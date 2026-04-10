import { randomUUID } from 'crypto';
import { DocumentTypeRepository } from '../../repository/Patient Management/document-type.repository';
import {
    DocumentType,
    CreateDocumentTypeInput,
    UpdateDocumentTypeInput
} from '../../models/Patient Management/document-type.model';
import {
    DOCUMENT_TYPE_ID_PREFIX,
    DOCUMENT_TYPE_ERRORS
} from '../../constants/document.constant';

export class DocumentTypeService {
    /**
     * Sinh ID theo format
     */
    private static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${DOCUMENT_TYPE_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách loại tài liệu
     */
    static async getAll(): Promise<DocumentType[]> {
        return await DocumentTypeRepository.getAll();
    }

    /**
     * Tạo mới loại tài liệu, kiểm tra trùng code
     */
    static async create(input: CreateDocumentTypeInput): Promise<DocumentType> {
        if (!input.code || !input.name) {
            throw DOCUMENT_TYPE_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        const existing = await DocumentTypeRepository.findByCode(input.code.toUpperCase());
        if (existing) {
            throw DOCUMENT_TYPE_ERRORS.CODE_ALREADY_EXISTS;
        }

        const newId = this.generateId();
        return await DocumentTypeRepository.create(newId, input);
    }

    /**
     * Cập nhật loại tài liệu
     */
    static async update(id: string, input: UpdateDocumentTypeInput): Promise<DocumentType> {
        const existing = await DocumentTypeRepository.getById(id);
        if (!existing) {
            throw DOCUMENT_TYPE_ERRORS.NOT_FOUND;
        }

        if (input.code && input.code.toUpperCase() !== existing.code) {
            const duplicate = await DocumentTypeRepository.findByCode(input.code.toUpperCase());
            if (duplicate) {
                throw DOCUMENT_TYPE_ERRORS.CODE_ALREADY_EXISTS;
            }
        }

        return await DocumentTypeRepository.update(id, input);
    }

    /**
     * Xóa mềm loại tài liệu. Kiểm tra đang sử dụng trước khi xóa.
     */
    static async delete(id: string): Promise<void> {
        const existing = await DocumentTypeRepository.getById(id);
        if (!existing) {
            throw DOCUMENT_TYPE_ERRORS.NOT_FOUND;
        }

        const inUse = await DocumentTypeRepository.isInUse(id);
        if (inUse) {
            throw DOCUMENT_TYPE_ERRORS.IN_USE;
        }

        await DocumentTypeRepository.softDelete(id);
    }
}
