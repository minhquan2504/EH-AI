import { ClinicalExamRepository } from '../../repository/EMR/clinical-exam.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    CLINICAL_EXAM_STATUS,
    CLINICAL_EXAM_ERRORS,
    CLINICAL_EXAM_CONFIG,
    VALID_SEVERITY_LEVELS,
    VITAL_SIGN_NORMAL_RANGES,
} from '../../constants/clinical-exam.constant';
import { ENCOUNTER_EDITABLE_STATUSES } from '../../constants/encounter.constant';
import {
    ClinicalExamination,
    CreateClinicalExamInput,
    UpdateClinicalExamInput,
    UpdateVitalsInput,
    ClinicalExamSummary,
} from '../../models/EMR/clinical-exam.model';


export class ClinicalExamService {

    /**
     * Tạo phiếu khám lâm sàng mới cho encounter (1:1)
     */
    static async create(encounterId: string, data: CreateClinicalExamInput, userId: string): Promise<ClinicalExamination> {
        /** Kiểm tra encounter tồn tại và ở trạng thái cho phép */
        await this.validateEncounterEditable(encounterId);

        /** Kiểm tra chưa có phiếu khám cho encounter này */
        const exists = await ClinicalExamRepository.existsByEncounterId(encounterId);
        if (exists) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_EXISTS', CLINICAL_EXAM_ERRORS.ALREADY_EXISTS);
        }

        /** Validate severity_level nếu có */
        if (data.severity_level) {
            this.validateSeverityLevel(data.severity_level);
        }

        /** Tạo phiếu khám — BMI tự động tính trong repository */
        const record = await ClinicalExamRepository.create(encounterId, data, userId);

        return await ClinicalExamRepository.findByEncounterId(encounterId) as ClinicalExamination;
    }

    /**
     * Lấy chi tiết phiếu khám theo encounter
     */
    static async getByEncounterId(encounterId: string): Promise<ClinicalExamination> {
        /** Kiểm tra encounter tồn tại */
        const encounter = await ClinicalExamRepository.getEncounterStatus(encounterId);
        if (!encounter.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', CLINICAL_EXAM_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const record = await ClinicalExamRepository.findByEncounterId(encounterId);
        if (!record) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', CLINICAL_EXAM_ERRORS.NOT_FOUND);
        }

        return record;
    }

    /**
     * Cập nhật phiếu khám lâm sàng (chỉ khi DRAFT)
     */
    static async update(encounterId: string, data: UpdateClinicalExamInput): Promise<ClinicalExamination> {
        /** Kiểm tra encounter editable */
        await this.validateEncounterEditable(encounterId);

        /** Kiểm tra phiếu khám tồn tại */
        const record = await ClinicalExamRepository.findByEncounterId(encounterId);
        if (!record) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', CLINICAL_EXAM_ERRORS.NOT_FOUND);
        }

        /** Phiếu FINAL không cho sửa phần khám lâm sàng */
        if (record.status === CLINICAL_EXAM_STATUS.FINAL) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_FINALIZED', CLINICAL_EXAM_ERRORS.ALREADY_FINALIZED);
        }

        /** Validate severity_level nếu có */
        if (data.severity_level) {
            this.validateSeverityLevel(data.severity_level);
        }

        /** Tính lại BMI nếu cập nhật weight hoặc height */
        const updateData: Record<string, any> = { ...data };
        if (data.weight !== undefined || data.height !== undefined) {
            const w = data.weight ?? record.weight;
            const h = data.height ?? record.height;
            if (w && h) {
                updateData.bmi = +(w / ((h / 100) ** 2)).toFixed(2);
            }
        }

        await ClinicalExamRepository.update(encounterId, updateData);
        return await ClinicalExamRepository.findByEncounterId(encounterId) as ClinicalExamination;
    }

    /**
     * Cập nhật riêng sinh hiệu — cho phép cả khi phiếu FINAL
     */
    static async updateVitals(encounterId: string, data: UpdateVitalsInput): Promise<ClinicalExamination> {
        /** Kiểm tra encounter editable */
        await this.validateEncounterEditable(encounterId);

        /** Kiểm tra phiếu khám tồn tại */
        const record = await ClinicalExamRepository.findByEncounterId(encounterId);
        if (!record) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', CLINICAL_EXAM_ERRORS.NOT_FOUND);
        }

        await ClinicalExamRepository.updateVitals(encounterId, data);
        return await ClinicalExamRepository.findByEncounterId(encounterId) as ClinicalExamination;
    }

    /**
     * Chuyển phiếu khám từ DRAFT → FINAL (chỉ BS mới được)
     */
    static async finalize(encounterId: string): Promise<ClinicalExamination> {
        const record = await ClinicalExamRepository.findByEncounterId(encounterId);
        if (!record) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', CLINICAL_EXAM_ERRORS.NOT_FOUND);
        }

        /** Phải đang ở DRAFT */
        if (record.status !== CLINICAL_EXAM_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', CLINICAL_EXAM_ERRORS.NOT_DRAFT);
        }

        /** Bắt buộc có chief_complaint */
        if (!record.chief_complaint || record.chief_complaint.trim() === '') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CHIEF_COMPLAINT', CLINICAL_EXAM_ERRORS.MISSING_CHIEF_COMPLAINT);
        }

        /** Bắt buộc có ít nhất 1 chỉ số sinh hiệu */
        const hasVitals = [
            record.pulse, record.blood_pressure_systolic, record.blood_pressure_diastolic,
            record.temperature, record.respiratory_rate, record.spo2,
            record.weight, record.height, record.blood_glucose,
        ].some(v => v !== null && v !== undefined);

        if (!hasVitals) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_VITALS', CLINICAL_EXAM_ERRORS.MISSING_VITALS);
        }

        await ClinicalExamRepository.updateStatus(encounterId, CLINICAL_EXAM_STATUS.FINAL);
        return await ClinicalExamRepository.findByEncounterId(encounterId) as ClinicalExamination;
    }

    /**
     * Lịch sử khám lâm sàng theo bệnh nhân (phân trang)
     */
    static async getByPatientId(
        patientId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: ClinicalExamination[]; total: number; page: number; limit: number; totalPages: number }> {
        /** Kiểm tra bệnh nhân tồn tại */
        const patientExists = await ClinicalExamRepository.patientExists(patientId);
        if (!patientExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', CLINICAL_EXAM_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit || CLINICAL_EXAM_CONFIG.DEFAULT_LIMIT, CLINICAL_EXAM_CONFIG.MAX_LIMIT);
        const result = await ClinicalExamRepository.findByPatientId(patientId, page, safeLimit, fromDate, toDate);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Tóm tắt khám lâm sàng (dùng cho chẩn đoán)
     */
    static async getSummary(encounterId: string): Promise<ClinicalExamSummary> {
        const record = await ClinicalExamRepository.findByEncounterId(encounterId);
        if (!record) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', CLINICAL_EXAM_ERRORS.NOT_FOUND);
        }

        return {
            chief_complaint: record.chief_complaint,
            severity_level: record.severity_level,
            vitals_summary: this.buildVitalsSummary(record),
            has_abnormal_vitals: this.hasAbnormalVitals(record),
            status: record.status,
        };
    }


    /**
     * Kiểm tra encounter tồn tại và ở trạng thái cho phép ghi nhận khám
     */
    private static async validateEncounterEditable(encounterId: string): Promise<void> {
        const encounter = await ClinicalExamRepository.getEncounterStatus(encounterId);
        if (!encounter.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', CLINICAL_EXAM_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        if (!(ENCOUNTER_EDITABLE_STATUSES as readonly string[]).includes(encounter.status!)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ENCOUNTER_NOT_EDITABLE', CLINICAL_EXAM_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }
    }

    /**
     * Validate giá trị severity_level
     */
    private static validateSeverityLevel(level: string): void {
        if (!VALID_SEVERITY_LEVELS.includes(level as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_SEVERITY', CLINICAL_EXAM_ERRORS.INVALID_SEVERITY);
        }
    }

    /**
     * Tạo chuỗi tóm tắt sinh hiệu dạng text
     */
    private static buildVitalsSummary(record: ClinicalExamination): string {
        const parts: string[] = [];
        if (record.pulse !== null) parts.push(`Mạch ${record.pulse}`);
        if (record.blood_pressure_systolic !== null && record.blood_pressure_diastolic !== null) {
            parts.push(`HA ${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`);
        }
        if (record.temperature !== null) parts.push(`Nhiệt ${record.temperature}°C`);
        if (record.respiratory_rate !== null) parts.push(`Thở ${record.respiratory_rate}`);
        if (record.spo2 !== null) parts.push(`SpO2 ${record.spo2}%`);
        if (record.blood_glucose !== null) parts.push(`ĐH ${record.blood_glucose}`);
        if (record.weight !== null) parts.push(`CN ${record.weight}kg`);
        if (record.height !== null) parts.push(`CC ${record.height}cm`);
        if (record.bmi !== null) parts.push(`BMI ${record.bmi}`);

        return parts.length > 0 ? parts.join(', ') : 'Chưa ghi nhận sinh hiệu';
    }

    /**
     * Kiểm tra có chỉ số sinh hiệu bất thường không
     */
    private static hasAbnormalVitals(record: ClinicalExamination): boolean {
        const ranges = VITAL_SIGN_NORMAL_RANGES;
        const checks: Array<{ value: number | null; min: number; max: number }> = [
            { value: record.pulse, min: ranges.pulse.min, max: ranges.pulse.max },
            { value: record.blood_pressure_systolic, min: ranges.blood_pressure_systolic.min, max: ranges.blood_pressure_systolic.max },
            { value: record.blood_pressure_diastolic, min: ranges.blood_pressure_diastolic.min, max: ranges.blood_pressure_diastolic.max },
            { value: record.temperature, min: ranges.temperature.min, max: ranges.temperature.max },
            { value: record.respiratory_rate, min: ranges.respiratory_rate.min, max: ranges.respiratory_rate.max },
            { value: record.spo2, min: ranges.spo2.min, max: ranges.spo2.max },
            { value: record.blood_glucose, min: ranges.blood_glucose.min, max: ranges.blood_glucose.max },
        ];

        return checks.some(c => c.value !== null && (c.value < c.min || c.value > c.max));
    }
}
