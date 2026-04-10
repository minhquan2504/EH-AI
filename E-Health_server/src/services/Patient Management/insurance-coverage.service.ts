import {
    InsuranceCoverage,
    CreateInsuranceCoverageInput,
    UpdateInsuranceCoverageInput,
    PaginatedInsuranceCoverages
} from '../../models/Patient Management/insurance-coverage.model';
import { InsuranceCoverageRepository } from '../../repository/Patient Management/insurance-coverage.repository';
import { InsuranceProviderRepository } from '../../repository/Patient Management/insurance-provider.repository';
import { INSURANCE_COVERAGE_ERRORS } from '../../constants/insurance-coverage.constant';
import { INSURANCE_PROVIDER_ERRORS } from '../../constants/insurance-provider.constant';
import { randomUUID } from 'crypto';

export class InsuranceCoverageService {
    /**
     * Lấy danh sách tỷ lệ chi trả
     */
    static async getCoverages(
        providerId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedInsuranceCoverages> {
        return await InsuranceCoverageRepository.getCoverages(providerId, page, limit);
    }

    /**
     * Chi tiết tỷ lệ chi trả
     */
    static async getCoverageById(id: string): Promise<InsuranceCoverage> {
        const coverage = await InsuranceCoverageRepository.getCoverageById(id);
        if (!coverage) throw INSURANCE_COVERAGE_ERRORS.NOT_FOUND;
        return coverage;
    }

    /**
     * Tạo mới tỷ lệ chi trả
     */
    static async createCoverage(input: CreateInsuranceCoverageInput): Promise<InsuranceCoverage> {
        if (!input.coverage_name || !input.provider_id || input.coverage_percent === undefined) {
            throw INSURANCE_COVERAGE_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        if (input.coverage_percent < 0 || input.coverage_percent > 100) {
            throw INSURANCE_COVERAGE_ERRORS.INVALID_PERCENT;
        }

        // Kiểm tra provider tồn tại
        const provider = await InsuranceProviderRepository.getProviderById(input.provider_id);
        if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;

        // Kiểm tra trùng tên gói cho cùng provider
        const duplicate = await InsuranceCoverageRepository.checkDuplicateName(input.coverage_name, input.provider_id);
        if (duplicate) throw INSURANCE_COVERAGE_ERRORS.DUPLICATE_NAME;

        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const newId = `COV_${datePart}_${randomUUID().substring(0, 6)}`;
        return await InsuranceCoverageRepository.createCoverage(newId, input);
    }

    /**
     * Cập nhật tỷ lệ chi trả
     */
    static async updateCoverage(id: string, input: UpdateInsuranceCoverageInput): Promise<InsuranceCoverage> {
        const coverage = await InsuranceCoverageRepository.getCoverageById(id);
        if (!coverage) throw INSURANCE_COVERAGE_ERRORS.NOT_FOUND;

        if (input.coverage_percent !== undefined && (input.coverage_percent < 0 || input.coverage_percent > 100)) {
            throw INSURANCE_COVERAGE_ERRORS.INVALID_PERCENT;
        }

        // Kiểm tra provider nếu có sửa
        if (input.provider_id) {
            const provider = await InsuranceProviderRepository.getProviderById(input.provider_id);
            if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;
        }

        // Kiểm tra trùng tên nếu đổi tên hoặc đổi provider
        if (input.coverage_name || input.provider_id) {
            const checkName = input.coverage_name || coverage.coverage_name;
            const checkProvider = input.provider_id || coverage.provider_id;
            const duplicate = await InsuranceCoverageRepository.checkDuplicateName(checkName, checkProvider, id);
            if (duplicate) throw INSURANCE_COVERAGE_ERRORS.DUPLICATE_NAME;
        }

        return await InsuranceCoverageRepository.updateCoverage(id, input);
    }

    /**
     * Xóa tỷ lệ chi trả
     */
    static async deleteCoverage(id: string): Promise<void> {
        const coverage = await InsuranceCoverageRepository.getCoverageById(id);
        if (!coverage) throw INSURANCE_COVERAGE_ERRORS.NOT_FOUND;
        await InsuranceCoverageRepository.deleteCoverage(id);
    }
}
