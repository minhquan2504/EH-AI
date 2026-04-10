import { randomUUID } from 'crypto';
import { PatientTagRepository } from '../../repository/Patient Management/patient-tag.repository';
import {
    Tag,
    PatientTagAssignment,
    CreateTagInput,
    UpdateTagInput,
    PaginatedTags
} from '../../models/Patient Management/patient-tag.model';
import {
    TAG_ID_PREFIX,
    PATIENT_TAG_ID_PREFIX,
    COLOR_HEX_REGEX,
    TAG_ERRORS,
    PATIENT_TAG_ERRORS
} from '../../constants/patient-tag.constant';

export class PatientTagService {

    /**
     * Tạo thẻ phân loại mới. Code phải duy nhất, màu HEX phải hợp lệ.
     */
    static async create(input: CreateTagInput): Promise<Tag> {
        const codeExists = await PatientTagRepository.isCodeExists(input.code);
        if (codeExists) {
            throw TAG_ERRORS.CODE_ALREADY_EXISTS;
        }

        if (input.color_hex && !COLOR_HEX_REGEX.test(input.color_hex)) {
            throw TAG_ERRORS.INVALID_COLOR_HEX;
        }

        const newId = this.generateTagId();
        return await PatientTagRepository.create(newId, input);
    }

    /**
     * Danh sách Tag có phân trang
     */
    static async getAll(page: number, limit: number, isActive?: boolean): Promise<PaginatedTags> {
        return await PatientTagRepository.getAll(page, limit, isActive);
    }

    /**
     * Chi tiết 1 Tag
     */
    static async getById(id: string): Promise<Tag> {
        const tag = await PatientTagRepository.getById(id);
        if (!tag) {
            throw TAG_ERRORS.NOT_FOUND;
        }
        return tag;
    }

    /**
     * Cập nhật Tag (không cho đổi code)
     */
    static async update(id: string, input: UpdateTagInput): Promise<Tag> {
        const existing = await PatientTagRepository.getById(id);
        if (!existing) {
            throw TAG_ERRORS.NOT_FOUND;
        }

        if (input.color_hex && !COLOR_HEX_REGEX.test(input.color_hex)) {
            throw TAG_ERRORS.INVALID_COLOR_HEX;
        }

        return await PatientTagRepository.update(id, input);
    }

    /**
     * Xóa mềm Tag
     */
    static async delete(id: string): Promise<void> {
        const existing = await PatientTagRepository.getById(id);
        if (!existing) {
            throw TAG_ERRORS.NOT_FOUND;
        }
        await PatientTagRepository.softDelete(id);
    }

    /**
     * Gắn thẻ cho bệnh nhân. Kiểm tra bệnh nhân & tag tồn tại, chống trùng lặp.
     */
    static async assignTag(
        patientId: string,
        tagId: string,
        assignedBy: string | null
    ): Promise<PatientTagAssignment> {
        const patientExists = await PatientTagRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_TAG_ERRORS.PATIENT_NOT_FOUND;
        }

        const tagActive = await PatientTagRepository.checkTagActive(tagId);
        if (!tagActive) {
            throw PATIENT_TAG_ERRORS.TAG_NOT_FOUND;
        }

        const already = await PatientTagRepository.isAssigned(patientId, tagId);
        if (already) {
            throw PATIENT_TAG_ERRORS.ALREADY_ASSIGNED;
        }

        const newId = this.generatePatientTagId();
        return await PatientTagRepository.assign(newId, patientId, tagId, assignedBy);
    }

    /**
     * Danh sách tag đang gắn trên bệnh nhân (kèm thông tin tag)
     */
    static async getPatientTags(patientId: string): Promise<PatientTagAssignment[]> {
        const patientExists = await PatientTagRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_TAG_ERRORS.PATIENT_NOT_FOUND;
        }
        return await PatientTagRepository.getByPatient(patientId);
    }

    /**
     * Gỡ bỏ tag khỏi bệnh nhân (Hard Delete record mapping)
     */
    static async removeTag(patientId: string, tagId: string): Promise<void> {
        const removed = await PatientTagRepository.remove(patientId, tagId);
        if (!removed) {
            throw PATIENT_TAG_ERRORS.ASSIGNMENT_NOT_FOUND;
        }
    }


    /** Sinh ID Tag: TAG_YYMMDD_8charUUID */
    private static generateTagId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${TAG_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    /** Sinh ID PatientTag assignment: PTAG_YYMMDD_8charUUID */
    private static generatePatientTagId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${PATIENT_TAG_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }
}
