import { randomUUID } from 'crypto';
import { PatientContactRepository } from '../../repository/Patient Management/patient-contact.repository';
import { RelationTypeRepository } from '../../repository/Patient Management/relation-type.repository';
import {
    PatientContact,
    CreatePatientContactInput,
    UpdatePatientContactInput,
    PaginatedPatientContacts
} from '../../models/Patient Management/patient-contact.model';
import {
    PATIENT_CONTACT_ID_PREFIX,
    PATIENT_CONTACT_ERRORS,
    PATIENT_CONTACT_CONFIG
} from '../../constants/patient-relation.constant';

export class PatientContactService {
    /**
     * Sinh ID theo format: PTC_YYMMDD_8charUUID
     */
    private static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${PATIENT_CONTACT_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách người thân (có phân trang, lọc theo patient_id)
     */
    static async getContacts(
        patientId?: string,
        page: number = PATIENT_CONTACT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONTACT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatientContacts> {
        const safeLimit = Math.min(limit, PATIENT_CONTACT_CONFIG.MAX_LIMIT);
        return await PatientContactRepository.getContacts(patientId, page, safeLimit);
    }

    /**
     * Lấy chi tiết người thân theo ID
     */
    static async getById(id: string): Promise<PatientContact> {
        const contact = await PatientContactRepository.getById(id);
        if (!contact) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }
        return contact;
    }

    /**
     * Tạo mới người thân cho bệnh nhân
     * Validate: bệnh nhân tồn tại, loại quan hệ hợp lệ
     */
    static async create(input: CreatePatientContactInput): Promise<PatientContact> {
        if (!input.patient_id || !input.relation_type_id || !input.contact_name || !input.phone_number) {
            throw PATIENT_CONTACT_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        // Kiểm tra bệnh nhân tồn tại
        const patientExists = await PatientContactRepository.checkPatientExists(input.patient_id);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }

        // Kiểm tra loại quan hệ hợp lệ (tồn tại và chưa bị xóa mềm)
        const relationType = await RelationTypeRepository.getById(input.relation_type_id);
        if (!relationType || !relationType.is_active) {
            throw PATIENT_CONTACT_ERRORS.RELATION_TYPE_INVALID;
        }

        const newId = this.generateId();
        return await PatientContactRepository.create(newId, input);
    }

    /**
     * Cập nhật thông tin người thân
     */
    static async update(id: string, input: UpdatePatientContactInput): Promise<PatientContact> {
        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        // Nếu đổi loại quan hệ, kiểm tra tồn tại
        if (input.relation_type_id && input.relation_type_id !== existing.relation_type_id) {
            const relationType = await RelationTypeRepository.getById(input.relation_type_id);
            if (!relationType || !relationType.is_active) {
                throw PATIENT_CONTACT_ERRORS.RELATION_TYPE_INVALID;
            }
        }

        return await PatientContactRepository.update(id, input);
    }

    /**
     * Xóa mềm người thân
     */
    static async delete(id: string): Promise<void> {
        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        await PatientContactRepository.softDelete(id);
    }

    /**
    * Đặt/hủy cờ liên hệ khẩn cấp cho người thân.
    */
    static async setEmergencyContact(id: string, isEmergency: boolean): Promise<PatientContact> {
        if (typeof isEmergency !== 'boolean') {
            throw PATIENT_CONTACT_ERRORS.MISSING_EMERGENCY_FLAG;
        }

        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        return await PatientContactRepository.setEmergencyContact(id, isEmergency);
    }

    /**
     * Lấy danh sách liên hệ khẩn cấp của 1 bệnh nhân
     */
    static async getEmergencyContacts(patientId: string): Promise<PatientContact[]> {
        const patientExists = await PatientContactRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }

        return await PatientContactRepository.getEmergencyContacts(patientId);
    }

    /**
     * Chỉ định/hủy người đại diện pháp lý.
     */
    static async setLegalRepresentative(id: string, isLegalRep: boolean): Promise<PatientContact> {
        if (typeof isLegalRep !== 'boolean') {
            throw PATIENT_CONTACT_ERRORS.MISSING_LEGAL_REP_FLAG;
        }

        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        return await PatientContactRepository.setLegalRepresentative(id, existing.patient_id, isLegalRep);
    }

    /**
     * Lấy người đại diện pháp lý hiện tại của bệnh nhân
     */
    static async getLegalRepresentative(patientId: string): Promise<PatientContact | null> {
        const patientExists = await PatientContactRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }

        return await PatientContactRepository.getLegalRepresentative(patientId);
    }

    /**
     * Cập nhật ghi chú quyền quyết định y tế cho người thân
     */
    static async updateMedicalDecisionNote(id: string, note: string): Promise<PatientContact> {
        if (!note || note.trim().length === 0) {
            throw PATIENT_CONTACT_ERRORS.MISSING_MEDICAL_NOTE;
        }

        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        return await PatientContactRepository.updateMedicalDecisionNote(id, note.trim());
    }

    /**
     * Lấy ghi chú quyền quyết định y tế của 1 người thân
     */
    static async getMedicalDecisionNote(id: string): Promise<{ medical_decision_note: string | null }> {
        const existing = await PatientContactRepository.getById(id);
        if (!existing) {
            throw PATIENT_CONTACT_ERRORS.NOT_FOUND;
        }

        const result = await PatientContactRepository.getMedicalDecisionNote(id);
        return result || { medical_decision_note: null };
    }

    // 2.4.6: Phân biệt người thân – liên hệ khẩn cấp

    /**
     * Lấy tất cả người liên hệ của bệnh nhân (không phân biệt cờ)
     */
    static async getAllRelations(patientId: string): Promise<PatientContact[]> {
        const patientExists = await PatientContactRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }
        return await PatientContactRepository.getAllRelations(patientId);
    }

    /**
     * Lấy người thân thông thường (không phải khẩn cấp, không phải đại diện pháp lý)
     */
    static async getNormalRelatives(patientId: string): Promise<PatientContact[]> {
        const patientExists = await PatientContactRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }
        return await PatientContactRepository.getNormalRelatives(patientId);
    }

    /**
     * Lấy danh sách người giám hộ (is_legal_representative = true)
     */
    static async getGuardians(patientId: string): Promise<PatientContact[]> {
        const patientExists = await PatientContactRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_CONTACT_ERRORS.PATIENT_NOT_FOUND;
        }
        return await PatientContactRepository.getGuardians(patientId);
    }
}
