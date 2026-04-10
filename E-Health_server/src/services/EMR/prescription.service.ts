import { PrescriptionRepository } from '../../repository/EMR/prescription.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    PRESCRIPTION_STATUS,
    PRESCRIPTION_EDITABLE_ENCOUNTER_STATUSES,
    PRESCRIPTION_ERRORS,
    PRESCRIPTION_CONFIG,
    VALID_ROUTES_OF_ADMINISTRATION,
} from '../../constants/prescription.constant';
import {
    PrescriptionRecord,
    CreatePrescriptionInput,
    UpdatePrescriptionInput,
    PrescriptionDetailRecord,
    CreateDetailInput,
    UpdateDetailInput,
    DrugSearchResult,
    PrescriptionSummary,
} from '../../models/EMR/prescription.model';


export class PrescriptionService {

    //  HELPERS 

    /**
     * Kiểm tra encounter tồn tại và ở trạng thái cho phép kê đơn
     */
    private static async validateEncounterEditable(encounterId: string) {
        const enc = await PrescriptionRepository.getEncounterInfo(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', PRESCRIPTION_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        if (!(PRESCRIPTION_EDITABLE_ENCOUNTER_STATUSES as readonly string[]).includes(enc.status!)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ENCOUNTER_NOT_EDITABLE', PRESCRIPTION_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }
        return enc;
    }

    /**
     * Lấy prescription và kiểm tra tồn tại
     */
    private static async getPrescription(prescriptionId: string): Promise<PrescriptionRecord> {
        const prescription = await PrescriptionRepository.findById(prescriptionId);
        if (!prescription) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', PRESCRIPTION_ERRORS.NOT_FOUND);
        }
        return prescription;
    }

    /**
     * Kiểm tra đơn thuốc ở trạng thái DRAFT (cho phép chỉnh sửa)
     */
    private static ensureDraft(prescription: PrescriptionRecord): void {
        if (prescription.status !== PRESCRIPTION_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', PRESCRIPTION_ERRORS.NOT_DRAFT);
        }
    }

    /**
     * Validate liên kết chẩn đoán (nếu có primary_diagnosis_id)
     */
    private static async validateDiagnosisLink(diagnosisId: string, encounterId: string): Promise<void> {
        const belongs = await PrescriptionRepository.diagnosisBelongsToEncounter(diagnosisId, encounterId);
        if (!belongs) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DIAGNOSIS_NOT_FOUND', PRESCRIPTION_ERRORS.DIAGNOSIS_NOT_FOUND);
        }
    }

    //   Tạo đơn thuốc 
    /**
     * Tạo đơn thuốc mới cho encounter.
     * Nghiệp vụ: 1 encounter = tối đa 1 đơn thuốc
     */
    static async create(encounterId: string, data: CreatePrescriptionInput, userId: string): Promise<PrescriptionRecord> {
        const enc = await this.validateEncounterEditable(encounterId);

        /** Kiểm tra chưa có đơn thuốc cho encounter này */
        const existing = await PrescriptionRepository.findByEncounterId(encounterId);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_EXISTS', PRESCRIPTION_ERRORS.ALREADY_EXISTS);
        }

        /** Validate liên kết chẩn đoán (nếu có) */
        if (data.primary_diagnosis_id) {
            await this.validateDiagnosisLink(data.primary_diagnosis_id, encounterId);
        }

        /** Lấy patient_id và doctor user_id từ encounter */
        const prescription = await PrescriptionRepository.create(
            encounterId,
            userId,
            enc.patient_id!,
            data
        );

        return (await PrescriptionRepository.findById(prescription.prescriptions_id))!;
    }

    //  Lấy đơn thuốc theo encounter
    /**
     * Trả về đơn thuốc header + danh sách dòng thuốc
     */
    static async getByEncounterId(encounterId: string): Promise<{
        prescription: PrescriptionRecord;
        details: PrescriptionDetailRecord[];
    } | null> {
        const enc = await PrescriptionRepository.getEncounterInfo(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', PRESCRIPTION_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const prescription = await PrescriptionRepository.findByEncounterId(encounterId);
        if (!prescription) return null;

        const details = await PrescriptionRepository.findDetailsByPrescriptionId(prescription.prescriptions_id);
        return { prescription, details };
    }

    //  Cập nhật header đơn thuốc 

    /**
     * Cập nhật clinical_diagnosis, doctor_notes, primary_diagnosis_id
     */
    static async update(prescriptionId: string, data: UpdatePrescriptionInput): Promise<PrescriptionRecord> {
        const prescription = await this.getPrescription(prescriptionId);
        this.ensureDraft(prescription);

        /** Validate encounter vẫn editable */
        await this.validateEncounterEditable(prescription.encounter_id);

        /** Validate liên kết chẩn đoán mới (nếu có) */
        if (data.primary_diagnosis_id) {
            await this.validateDiagnosisLink(data.primary_diagnosis_id, prescription.encounter_id);
        }

        return (await PrescriptionRepository.update(prescriptionId, data))!;
    }

    // Xác nhận đơn thuốc DRAFT → PRESCRIBED 
    /**
     * Xác nhận đơn thuốc. Phải có ít nhất 1 dòng thuốc active.
     */
    static async confirm(prescriptionId: string): Promise<PrescriptionRecord> {
        const prescription = await this.getPrescription(prescriptionId);
        this.ensureDraft(prescription);

        /** Validate encounter vẫn editable */
        await this.validateEncounterEditable(prescription.encounter_id);

        /** Đếm dòng thuốc active >= 1 */
        const activeCount = await PrescriptionRepository.countActiveDetails(prescriptionId);
        if (activeCount < PRESCRIPTION_CONFIG.MIN_DETAILS_FOR_CONFIRM) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_DETAILS', PRESCRIPTION_ERRORS.NO_DETAILS_FOR_CONFIRM);
        }

        await PrescriptionRepository.confirm(prescriptionId);
        return (await PrescriptionRepository.findById(prescriptionId))!;
    }

    // Hủy đơn thuốc

    /**
     * Hủy đơn thuốc DRAFT hoặc PRESCRIBED.
     * Nếu PRESCRIBED → bắt buộc lý do.
     */
    static async cancel(prescriptionId: string, cancelledReason?: string): Promise<PrescriptionRecord> {
        const prescription = await this.getPrescription(prescriptionId);

        /** Chỉ cho phép hủy DRAFT hoặc PRESCRIBED */
        if (prescription.status !== PRESCRIPTION_STATUS.DRAFT && prescription.status !== PRESCRIPTION_STATUS.PRESCRIBED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL', PRESCRIPTION_ERRORS.CANNOT_CANCEL);
        }

        /** Nếu PRESCRIBED → bắt buộc lý do */
        if (prescription.status === PRESCRIPTION_STATUS.PRESCRIBED && !cancelledReason?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', PRESCRIPTION_ERRORS.MISSING_CANCEL_REASON);
        }

        await PrescriptionRepository.cancel(prescriptionId, cancelledReason || null);
        return (await PrescriptionRepository.findById(prescriptionId))!;
    }

    // Lịch sử đơn thuốc theo bệnh nhân

    static async getByPatientId(
        patientId: string,
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: PrescriptionRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const exists = await PrescriptionRepository.patientExists(patientId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', PRESCRIPTION_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, PRESCRIPTION_CONFIG.MAX_LIMIT);
        const result = await PrescriptionRepository.findByPatientId(patientId, page, safeLimit, status, fromDate, toDate);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    //  Thêm dòng thuốc

    /**
     * Thêm dòng thuốc vào đơn. Validate: đơn DRAFT, encounter editable, drug exists.
     */
    static async addDetail(prescriptionId: string, data: CreateDetailInput): Promise<PrescriptionDetailRecord> {
        const prescription = await this.getPrescription(prescriptionId);
        this.ensureDraft(prescription);
        await this.validateEncounterEditable(prescription.encounter_id);

        /** Validate input */
        if (!data.drug_id?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DRUG_ID', PRESCRIPTION_ERRORS.MISSING_DRUG_ID);
        }
        if (!data.quantity || data.quantity <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', PRESCRIPTION_ERRORS.INVALID_QUANTITY);
        }
        if (!data.dosage?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOSAGE', PRESCRIPTION_ERRORS.MISSING_DOSAGE);
        }
        if (!data.frequency?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FREQUENCY', PRESCRIPTION_ERRORS.MISSING_FREQUENCY);
        }
        if (data.duration_days !== undefined && data.duration_days <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DURATION', PRESCRIPTION_ERRORS.INVALID_DURATION);
        }
        if (data.route_of_administration && !(VALID_ROUTES_OF_ADMINISTRATION as readonly string[]).includes(data.route_of_administration)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ROUTE', PRESCRIPTION_ERRORS.INVALID_ROUTE);
        }

        /** Validate thuốc tồn tại */
        const drugExists = await PrescriptionRepository.drugExists(data.drug_id);
        if (!drugExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', PRESCRIPTION_ERRORS.DRUG_NOT_FOUND);
        }

        const detail = await PrescriptionRepository.createDetail(prescriptionId, data);
        return (await PrescriptionRepository.findDetailById(detail.prescription_details_id))!;
    }

    //  Sửa dòng thuốc

    /**
     * Cập nhật dòng thuốc. Validate: đơn DRAFT, encounter editable.
     */
    static async updateDetail(detailId: string, data: UpdateDetailInput): Promise<PrescriptionDetailRecord> {
        const detail = await PrescriptionRepository.findDetailById(detailId);
        if (!detail || !detail.is_active) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DETAIL_NOT_FOUND', PRESCRIPTION_ERRORS.DETAIL_NOT_FOUND);
        }

        const prescription = await this.getPrescription(detail.prescription_id);
        this.ensureDraft(prescription);
        await this.validateEncounterEditable(prescription.encounter_id);

        /** Validate partial input */
        if (data.quantity !== undefined && data.quantity <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', PRESCRIPTION_ERRORS.INVALID_QUANTITY);
        }
        if (data.duration_days !== undefined && data.duration_days <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DURATION', PRESCRIPTION_ERRORS.INVALID_DURATION);
        }
        if (data.route_of_administration && !(VALID_ROUTES_OF_ADMINISTRATION as readonly string[]).includes(data.route_of_administration)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ROUTE', PRESCRIPTION_ERRORS.INVALID_ROUTE);
        }

        return (await PrescriptionRepository.updateDetail(detailId, data))!;
    }

    //  Xóa dòng thuốc (soft delete)

    static async deleteDetail(detailId: string): Promise<void> {
        const detail = await PrescriptionRepository.findDetailById(detailId);
        if (!detail || !detail.is_active) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DETAIL_NOT_FOUND', PRESCRIPTION_ERRORS.DETAIL_NOT_FOUND);
        }

        const prescription = await this.getPrescription(detail.prescription_id);
        this.ensureDraft(prescription);
        await this.validateEncounterEditable(prescription.encounter_id);

        await PrescriptionRepository.deleteDetail(detailId);
    }

    //  Danh sách dòng thuốc

    static async getDetails(prescriptionId: string): Promise<PrescriptionDetailRecord[]> {
        const prescription = await this.getPrescription(prescriptionId);
        return PrescriptionRepository.findDetailsByPrescriptionId(prescriptionId);
    }

    // Tìm kiếm thuốc 

    static async searchDrugs(query: string, categoryId?: string): Promise<DrugSearchResult[]> {
        return PrescriptionRepository.searchDrugs(query, categoryId);
    }

    // Tóm tắt đơn thuốc 

    static async getSummary(encounterId: string): Promise<PrescriptionSummary | null> {
        const enc = await PrescriptionRepository.getEncounterInfo(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', PRESCRIPTION_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        return PrescriptionRepository.getSummary(encounterId);
    }

    // Lịch sử đơn thuốc theo bác sĩ
    /**
     * Lấy danh sách đơn thuốc theo bác sĩ, hỗ trợ phân trang + filter.
     * Dùng cho BS xem lại lịch sử kê đơn hoặc Admin tra cứu.
     */
    static async getByDoctorId(
        doctorId: string,
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: PrescriptionRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const exists = await PrescriptionRepository.doctorExists(doctorId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', PRESCRIPTION_ERRORS.DOCTOR_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, PRESCRIPTION_CONFIG.MAX_LIMIT);
        const result = await PrescriptionRepository.findByDoctorId(doctorId, page, safeLimit, status, fromDate, toDate);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    //  SEARCH (Module 5.9) 

    /**
     * Tìm kiếm tổng hợp: text search (mã đơn/tên BN/tên BS) + multi-filter + phân trang
     */
    static async search(
        page: number, limit: number,
        q?: string, status?: string, doctorId?: string, patientId?: string,
        fromDate?: string, toDate?: string
    ) {
        const safeLimit = Math.min(limit, PRESCRIPTION_CONFIG.MAX_LIMIT);
        const result = await PrescriptionRepository.searchPrescriptions(page, safeLimit, q, status, doctorId, patientId, fromDate, toDate);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Tìm đơn thuốc theo mã đơn — trả kèm danh sách dòng thuốc
     */
    static async findByCode(code: string) {
        const prescription = await PrescriptionRepository.findByCode(code);
        if (!prescription) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', PRESCRIPTION_ERRORS.NOT_FOUND);
        }
        const details = await PrescriptionRepository.findDetailsByPrescriptionId(prescription.prescriptions_id);
        return { prescription, details };
    }

    /**
     * Thống kê đơn thuốc theo trạng thái (dùng cho dashboard)
     */
    static async getStats(doctorId?: string, patientId?: string, fromDate?: string, toDate?: string) {
        return PrescriptionRepository.getStats(doctorId, patientId, fromDate, toDate);
    }
}
