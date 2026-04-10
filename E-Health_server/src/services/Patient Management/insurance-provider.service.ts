import {
    InsuranceProvider,
    CreateInsuranceProviderInput,
    UpdateInsuranceProviderInput,
    PaginatedInsuranceProviders
} from '../../models/Patient Management/insurance-provider.model';
import { InsuranceProviderRepository } from '../../repository/Patient Management/insurance-provider.repository';
import { INSURANCE_PROVIDER_ERRORS, VALID_INSURANCE_TYPES } from '../../constants/insurance-provider.constant';
import { randomUUID } from 'crypto';

export class InsuranceProviderService {
    /**
     * Lấy danh sách đơn vị bảo hiểm (phân trang, tìm kiếm, lọc)
     */
    static async getProviders(
        search?: string,
        insuranceType?: string,
        isActive?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedInsuranceProviders> {
        return await InsuranceProviderRepository.getProviders(search, insuranceType, isActive, page, limit);
    }

    /**
     * Lấy chi tiết bằng ID
     */
    static async getProviderById(id: string): Promise<InsuranceProvider> {
        const provider = await InsuranceProviderRepository.getProviderById(id);
        if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;
        return provider;
    }

    /**
     * Tạo mới đơn vị bảo hiểm
     */
    static async createProvider(input: CreateInsuranceProviderInput): Promise<InsuranceProvider> {
        if (!input.provider_code || !input.provider_name || !input.insurance_type) {
            throw INSURANCE_PROVIDER_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        if (!VALID_INSURANCE_TYPES.includes(input.insurance_type)) {
            throw INSURANCE_PROVIDER_ERRORS.INVALID_INSURANCE_TYPE;
        }

        input.provider_code = input.provider_code.trim().toUpperCase();
        const codeExists = await InsuranceProviderRepository.checkCodeExists(input.provider_code);
        if (codeExists) throw INSURANCE_PROVIDER_ERRORS.PROVIDER_CODE_EXISTS;

        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const newId = `PRV_${datePart}_${randomUUID().substring(0, 6)}`;
        return await InsuranceProviderRepository.createProvider(newId, input);
    }

    /**
     * Cập nhật thông tin đơn vị bảo hiểm
     */
    static async updateProvider(id: string, input: UpdateInsuranceProviderInput): Promise<InsuranceProvider> {
        const provider = await InsuranceProviderRepository.getProviderById(id);
        if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;

        if (input.insurance_type && !VALID_INSURANCE_TYPES.includes(input.insurance_type)) {
            throw INSURANCE_PROVIDER_ERRORS.INVALID_INSURANCE_TYPE;
        }

        if (input.provider_code) {
            input.provider_code = input.provider_code.trim().toUpperCase();
            if (input.provider_code !== provider.provider_code) {
                const codeExists = await InsuranceProviderRepository.checkCodeExists(input.provider_code, id);
                if (codeExists) throw INSURANCE_PROVIDER_ERRORS.PROVIDER_CODE_EXISTS;
            }
        }

        return await InsuranceProviderRepository.updateProvider(id, input);
    }

    /**
     * Vô hiệu hóa đơn vị bảo hiểm (Soft Disable)
     */
    static async disableProvider(id: string): Promise<InsuranceProvider> {
        const provider = await InsuranceProviderRepository.getProviderById(id);
        if (!provider) throw INSURANCE_PROVIDER_ERRORS.NOT_FOUND;

        return await InsuranceProviderRepository.updateProvider(id, { is_active: false });
    }
}
