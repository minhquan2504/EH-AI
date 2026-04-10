import { randomUUID } from 'crypto';
import { PatientRepository } from '../../repository/Patient Management/patient.repository';
import {
    Patient,
    CreatePatientInput,
    UpdatePatientInput,
    PaginatedPatients,
    PatientQuickResult,
    PatientSummary
} from '../../models/Patient Management/patient.model';
import {
    PATIENT_ERRORS,
    PATIENT_CONFIG,
    PATIENT_CODE_PREFIX,
    VALID_GENDERS,
    VALID_PATIENT_STATUSES,
    PATIENT_REGEX
} from '../../constants/patient.constant';

export class PatientService {
    /**
     * Sinh mã bệnh nhân duy nhất theo format
     */
    private static generatePatientCode(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;

        return `${PATIENT_CODE_PREFIX}_${datePart}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Chuẩn hóa tên bệnh nhân: loại bỏ khoảng trắng thừa, Title Case
     */
    private static normalizeName(name: string): string {
        return name
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Chuẩn hóa số điện thoại: loại bỏ khoảng trắng, dấu gạch ngang
     */
    private static normalizePhone(phone: string): string {
        return phone.replace(/[\s\-().]/g, '');
    }

    /**
     * Validate các trường dữ liệu bệnh nhân trước khi tạo/cập nhật
     */
    private static validatePatientData(input: CreatePatientInput | UpdatePatientInput, isCreate: boolean = false): void {
        // Kiểm tra trường bắt buộc khi tạo mới
        if (isCreate) {
            const createInput = input as CreatePatientInput;
            if (!createInput.full_name || !createInput.date_of_birth || !createInput.gender) {
                throw PATIENT_ERRORS.MISSING_REQUIRED_FIELDS;
            }
        }

        // Validate giới tính
        if (input.gender && !VALID_GENDERS.includes(input.gender as any)) {
            throw PATIENT_ERRORS.INVALID_GENDER;
        }

        // Validate ngày sinh: không được trong tương lai
        if (input.date_of_birth) {
            const dob = new Date(input.date_of_birth);
            if (isNaN(dob.getTime()) || dob > new Date()) {
                throw PATIENT_ERRORS.INVALID_DATE_OF_BIRTH;
            }
        }

        // Validate SĐT (nếu có)
        if (input.phone_number && !PATIENT_REGEX.PHONE.test(input.phone_number)) {
            throw PATIENT_ERRORS.INVALID_PHONE_NUMBER;
        }

        // Validate email (nếu có)
        if (input.email && !PATIENT_REGEX.EMAIL.test(input.email)) {
            throw PATIENT_ERRORS.INVALID_EMAIL;
        }
    }

    /**
     * Lấy danh sách hồ sơ bệnh nhân (có phân trang, lọc, tìm kiếm)
     */
    static async getPatients(
        search?: string,
        status?: string,
        gender?: string,
        page: number = PATIENT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatients> {
        const safeLimit = Math.min(limit, PATIENT_CONFIG.MAX_LIMIT);
        return await PatientRepository.getPatients(search, status, gender, page, safeLimit);
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân theo ID
     */
    static async getPatientById(id: string): Promise<Patient> {
        const patient = await PatientRepository.getPatientById(id);
        if (!patient) {
            throw PATIENT_ERRORS.NOT_FOUND;
        }
        return patient;
    }

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static async createPatient(input: CreatePatientInput): Promise<Patient> {
        // Validate dữ liệu
        this.validatePatientData(input, true);

        // Chuẩn hóa dữ liệu đầu vào
        input.full_name = this.normalizeName(input.full_name);
        if (input.phone_number) {
            input.phone_number = this.normalizePhone(input.phone_number);
        }
        if (input.email) {
            input.email = input.email.trim().toLowerCase();
        }

        // Kiểm tra CMND/CCCD trùng lặp
        if (input.id_card_number) {
            const exists = await PatientRepository.checkIdCardExists(input.id_card_number);
            if (exists) {
                throw PATIENT_ERRORS.ID_CARD_ALREADY_EXISTS;
            }
        }

        // Sinh ID và mã bệnh nhân
        const newId = randomUUID();
        const patientCode = this.generatePatientCode();

        return await PatientRepository.createPatient(newId, patientCode, input);
    }

    /**
     * Cập nhật thông tin hành chính bệnh nhân
     */
    static async updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
        const patient = await this.getPatientById(id);

        // Validate dữ liệu
        this.validatePatientData(input);

        // Chuẩn hóa
        if (input.full_name) {
            input.full_name = this.normalizeName(input.full_name);
        }
        if (input.phone_number) {
            input.phone_number = this.normalizePhone(input.phone_number);
        }
        if (input.email) {
            input.email = input.email.trim().toLowerCase();
        }

        // Nếu đổi CMND/CCCD, kiểm tra trùng
        if (input.id_card_number && input.id_card_number !== patient.id_card_number) {
            const exists = await PatientRepository.checkIdCardExists(input.id_card_number, id);
            if (exists) {
                throw PATIENT_ERRORS.ID_CARD_ALREADY_EXISTS;
            }
        }

        return await PatientRepository.updatePatient(id, input);
    }

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE)
     */
    static async updateStatus(id: string, status: string): Promise<Patient> {
        await this.getPatientById(id);

        if (!VALID_PATIENT_STATUSES.includes(status as any)) {
            throw PATIENT_ERRORS.INVALID_STATUS;
        }

        return await PatientRepository.updateStatus(id, status);
    }

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
     */
    static async linkAccount(patientId: string, accountId: string): Promise<Patient> {
        const patient = await this.getPatientById(patientId);

        // Nếu đã liên kết với tài khoản khác → báo lỗi
        if (patient.account_id && patient.account_id !== accountId) {
            throw PATIENT_ERRORS.ACCOUNT_ALREADY_LINKED;
        }

        // Kiểm tra tài khoản tồn tại
        const accountExists = await PatientRepository.checkAccountExists(accountId);
        if (!accountExists) {
            throw PATIENT_ERRORS.ACCOUNT_NOT_FOUND;
        }

        return await PatientRepository.linkAccount(patientId, accountId);
    }

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
     */
    static async unlinkAccount(patientId: string): Promise<Patient> {
        await this.getPatientById(patientId);
        return await PatientRepository.unlinkAccount(patientId);
    }

    /**
     * Soft delete hồ sơ bệnh nhân
     */
    static async deletePatient(id: string): Promise<void> {
        await this.getPatientById(id);
        await PatientRepository.softDeletePatient(id);
    }

    /**
     * Cập nhật cờ has_insurance cho bệnh nhân (tính toán lại từ DB)
     */
    static async updateInsuranceStatus(id: string, hasInsurance: boolean): Promise<void> {
        await this.getPatientById(id);
        await PatientRepository.updateInsuranceStatus(id, hasInsurance);
    }

    /**
     * Danh sách bệnh nhân CÓ bảo hiểm
     */
    static async getPatientsWithInsurance(
        page: number = PATIENT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatients> {
        const safeLimit = Math.min(limit, PATIENT_CONFIG.MAX_LIMIT);
        return await PatientRepository.getPatientsWithInsurance(page, safeLimit);
    }

    /**
     * Danh sách bệnh nhân KHÔNG CÓ bảo hiểm
     */
    static async getPatientsWithoutInsurance(
        page: number = PATIENT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatients> {
        const safeLimit = Math.min(limit, PATIENT_CONFIG.MAX_LIMIT);
        return await PatientRepository.getPatientsWithoutInsurance(page, safeLimit);
    }

    /**
     * Lọc bệnh nhân theo danh sách tag (AND/OR logic)
     */
    static async filterByTags(
        tagIds: string[],
        matchAll: boolean,
        page: number = PATIENT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatients> {
        if (!tagIds || tagIds.length === 0) {
            throw { success: false, code: 'FILTER_001', message: 'Phải cung cấp ít nhất 1 tagId để lọc.' };
        }
        const safeLimit = Math.min(limit, PATIENT_CONFIG.MAX_LIMIT);
        return await PatientRepository.filterByTags(tagIds, matchAll, page, safeLimit);
    }

    // MODULE 2.7: TÌM KIẾM & TRA CỨU

    /**
     * Tìm kiếm nâng cao bệnh nhân (keyword + gender + status + khoảng tuổi)
     */
    static async advancedSearch(
        keyword?: string,
        status?: string,
        gender?: string,
        ageMin?: number,
        ageMax?: number,
        page: number = PATIENT_CONFIG.DEFAULT_PAGE,
        limit: number = PATIENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedPatients> {
        const safeLimit = Math.min(limit, PATIENT_CONFIG.MAX_LIMIT);
        return await PatientRepository.advancedSearch(keyword, status, gender, ageMin, ageMax, page, safeLimit);
    }

    /**
     * Tìm kiếm nhanh (autocomplete) — trả về tối đa 10 kết quả
     */
    static async quickSearch(keyword: string): Promise<PatientQuickResult[]> {
        if (!keyword || keyword.trim().length === 0) {
            return [];
        }
        return await PatientRepository.quickSearch(keyword.trim());
    }

    /**
     * Tra cứu tóm tắt hồ sơ bệnh nhân (aggregate tags, insurance, history, allergy)
     */
    static async getPatientSummary(id: string): Promise<PatientSummary> {
        const summary = await PatientRepository.getPatientSummary(id);
        if (!summary) {
            throw PATIENT_ERRORS.NOT_FOUND;
        }
        return summary;
    }
}
