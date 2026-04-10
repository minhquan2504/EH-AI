import { randomUUID } from 'crypto';
import { RelationTypeRepository } from '../../repository/Patient Management/relation-type.repository';
import {
    RelationType,
    CreateRelationTypeInput,
    UpdateRelationTypeInput
} from '../../models/Patient Management/relation-type.model';
import {
    RELATION_TYPE_ID_PREFIX,
    RELATION_TYPE_ERRORS
} from '../../constants/patient-relation.constant';

export class RelationTypeService {
    /**
     * Sinh ID theo format: REL_YYMMDD_8charUUID
     */
    private static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${RELATION_TYPE_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách tất cả loại quan hệ đang hoạt động
     */
    static async getAll(): Promise<RelationType[]> {
        return await RelationTypeRepository.getAll();
    }

    /**
     * Tạo mới loại quan hệ, kiểm tra trùng mã code
     */
    static async create(input: CreateRelationTypeInput): Promise<RelationType> {
        if (!input.code || !input.name) {
            throw RELATION_TYPE_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        const exists = await RelationTypeRepository.checkCodeExists(input.code.toUpperCase());
        if (exists) {
            throw RELATION_TYPE_ERRORS.CODE_ALREADY_EXISTS;
        }

        const newId = this.generateId();
        return await RelationTypeRepository.create(newId, input);
    }

    /**
     * Cập nhật loại quan hệ theo ID
     */
    static async update(id: string, input: UpdateRelationTypeInput): Promise<RelationType> {
        const existing = await RelationTypeRepository.getById(id);
        if (!existing) {
            throw RELATION_TYPE_ERRORS.NOT_FOUND;
        }

        // Kiểm tra trùng code khi đổi code
        if (input.code && input.code.toUpperCase() !== existing.code) {
            const codeExists = await RelationTypeRepository.checkCodeExists(input.code.toUpperCase(), id);
            if (codeExists) {
                throw RELATION_TYPE_ERRORS.CODE_ALREADY_EXISTS;
            }
        }

        return await RelationTypeRepository.update(id, input);
    }

    /**
     * Xóa mềm loại quan hệ, chặn xóa nếu đang được sử dụng bởi patient_contacts
     */
    static async delete(id: string): Promise<void> {
        const existing = await RelationTypeRepository.getById(id);
        if (!existing) {
            throw RELATION_TYPE_ERRORS.NOT_FOUND;
        }

        const inUse = await RelationTypeRepository.isInUse(id);
        if (inUse) {
            throw RELATION_TYPE_ERRORS.IN_USE;
        }

        await RelationTypeRepository.softDelete(id);
    }
}
