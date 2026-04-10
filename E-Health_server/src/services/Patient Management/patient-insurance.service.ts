import {
    PatientInsurance,
    CreatePatientInsuranceInput,
    UpdatePatientInsuranceInput,
    PaginatedPatientInsurances
} from '../../models/Patient Management/patient-insurance.model';
import { PatientInsuranceRepository } from '../../repository/Patient Management/patient-insurance.repository';
import { InsuranceProviderRepository } from '../../repository/Patient Management/insurance-provider.repository';
import { PatientRepository } from '../../repository/Patient Management/patient.repository';
import { PatientService } from '../../services/Patient Management/patient.service';
import { PATIENT_INSURANCE_ERRORS } from '../../constants/patient-insurance.constant';
import { INSURANCE_PROVIDER_ERRORS } from '../../constants/insurance-provider.constant';
import { randomUUID } from 'crypto';

export class PatientInsuranceService {
    /**
     * Lấy danh sách thẻ bảo hiểm
     */
    static async getInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        if (patientId) {
            await PatientService.getPatientById(patientId);
        }
        return await PatientInsuranceRepository.getInsurances(patientId, page, limit);
    }

    /**
     * Chi tiết thẻ
     */
    static async getInsuranceById(id: string): Promise<PatientInsurance> {
        const insurance = await PatientInsuranceRepository.getInsuranceById(id);
        if (!insurance) throw PATIENT_INSURANCE_ERRORS.NOT_FOUND;
        return insurance;
    }

    /**
     * Validate khoảng thời gian hiệu lực thẻ
     */
    private static validateDates(startDate: string, endDate: string): void {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            throw PATIENT_INSURANCE_ERRORS.INVALID_DATES;
        }
    }

    /**
     * Thêm thẻ bảo hiểm cho bệnh nhân
     */
    static async createInsurance(input: CreatePatientInsuranceInput): Promise<PatientInsurance> {
        if (!input.patient_id || !input.provider_id || !input.insurance_number || !input.start_date || !input.end_date) {
            throw PATIENT_INSURANCE_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        // Kiểm tra FK tồn tại
        await PatientService.getPatientById(input.patient_id);
        const provider = await InsuranceProviderRepository.getProviderById(input.provider_id);
        if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;

        // Validate ngày
        this.validateDates(input.start_date, input.end_date);

        // Check trùng số thẻ
        input.insurance_number = input.insurance_number.trim().toUpperCase();
        const exists = await PatientInsuranceRepository.checkDuplicateNumber(input.insurance_number);
        if (exists) throw PATIENT_INSURANCE_ERRORS.INSURANCE_NUMBER_EXISTS;

        // thẻ đầu tiên tự động là primary, nếu gửi is_primary=true thì unset thẻ cũ
        const currentPrimary = await PatientInsuranceRepository.getPrimaryInsurance(input.patient_id);
        if (!currentPrimary) {
            input.is_primary = true;
        } else if (input.is_primary === true) {
            await PatientInsuranceRepository.unsetAllPrimary(input.patient_id);
        }

        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const newId = `PI_${datePart}_${randomUUID().substring(0, 6)}`;
        const result = await PatientInsuranceRepository.createInsurance(newId, input);

        // Tự động đánh dấu bệnh nhân có bảo hiểm
        await PatientRepository.updateInsuranceStatus(input.patient_id, true);

        return result;
    }

    /**
     * Cập nhật thẻ
     */
    static async updateInsurance(id: string, input: UpdatePatientInsuranceInput): Promise<PatientInsurance> {
        const insurance = await PatientInsuranceRepository.getInsuranceById(id);
        if (!insurance) throw PATIENT_INSURANCE_ERRORS.NOT_FOUND;

        // Validate ngày nếu có sửa
        if (input.start_date || input.end_date) {
            const checkStart = input.start_date || String(insurance.start_date);
            const checkEnd = input.end_date || String(insurance.end_date);
            this.validateDates(checkStart, checkEnd);
        }

        // Kiểm tra Provider nếu có sửa
        if (input.provider_id) {
            const provider = await InsuranceProviderRepository.getProviderById(input.provider_id);
            if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;
        }

        // Kiểm tra trùng số thẻ nếu có sửa
        if (input.insurance_number) {
            input.insurance_number = input.insurance_number.trim().toUpperCase();
            if (input.insurance_number !== insurance.insurance_number) {
                const exists = await PatientInsuranceRepository.checkDuplicateNumber(input.insurance_number, id);
                if (exists) throw PATIENT_INSURANCE_ERRORS.INSURANCE_NUMBER_EXISTS;
            }
        }

        // nếu set thẻ này thành primary -> unset thẻ cũ
        if (input.is_primary === true && !insurance.is_primary) {
            await PatientInsuranceRepository.unsetAllPrimary(insurance.patient_id);
        }

        return await PatientInsuranceRepository.updateInsurance(id, input);
    }

    /**
     * Xóa thẻ (Hard Delete)
     */
    static async deleteInsurance(id: string): Promise<void> {
        const insurance = await PatientInsuranceRepository.getInsuranceById(id);
        if (!insurance) throw PATIENT_INSURANCE_ERRORS.NOT_FOUND;

        const patientId = insurance.patient_id;
        await PatientInsuranceRepository.deleteInsurance(id);

        // Nếu xoá thẻ primary, đôn thẻ khác lên primary (nếu còn)
        if (insurance.is_primary) {
            const remaining = await PatientInsuranceRepository.getInsurances(patientId, 1, 1);
            if (remaining.data.length > 0) {
                await PatientInsuranceRepository.updateInsurance(remaining.data[0].patient_insurances_id, { is_primary: true });
            }
        }

        // Tự động cập nhật lại cờ has_insurance của bệnh nhân
        const activeCount = await PatientInsuranceRepository.countActiveInsurances(patientId);
        await PatientRepository.updateInsuranceStatus(patientId, activeCount > 0);
    }

    /**
     * Danh sách thẻ bảo hiểm còn hiệu lực
     */
    static async getActiveInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        if (patientId) {
            await PatientService.getPatientById(patientId);
        }
        return await PatientInsuranceRepository.getActiveInsurances(patientId, page, limit);
    }

    /**
     * Danh sách thẻ bảo hiểm đã hết hạn
     */
    static async getExpiredInsurances(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientInsurances> {
        if (patientId) {
            await PatientService.getPatientById(patientId);
        }
        return await PatientInsuranceRepository.getExpiredInsurances(patientId, page, limit);
    }
}
