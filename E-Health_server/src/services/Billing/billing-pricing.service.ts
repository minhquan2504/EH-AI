import { randomUUID } from 'crypto';
import { BillingPricingRepository } from '../../repository/Billing/billing-pricing.repository';
import {
    ServicePricePolicy,
    FacilityServiceSpecialtyPrice,
    ServicePriceHistory,
    CreatePricePolicyInput,
    UpdatePricePolicyInput,
    CreateSpecialtyPriceInput,
    UpdateSpecialtyPriceInput,
    BulkCreatePoliciesInput,
    ResolvedPrice,
    PricingSummary,
    PriceComparison,
    PaginatedResult,
} from '../../models/Billing/billing-pricing.model';
import {
    BILLING_PRICING_ERRORS,
    BILLING_PRICING_CONFIG,
    VALID_PATIENT_TYPES,
    PATIENT_TYPE,
    PRICE_CHANGE_TYPE,
    PRICE_CHANGE_SOURCE,
} from '../../constants/billing-pricing.constant';

export class BillingPricingService {

    /** Tạo ID chuẩn */
    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    // CATALOG (Danh mục dịch vụ — view tổng hợp)

    /**
     * Lấy danh mục dịch vụ chuẩn với thống kê số cơ sở triển khai
     */
    static async getServiceCatalog(
        serviceGroup?: string,
        serviceType?: string,
        search?: string,
        isActive?: boolean,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<any>> {
        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getServiceCatalog(serviceGroup, serviceType, search, isActive, page, safeLimit);
    }

    /**
     * Bảng giá tổng hợp tại 1 cơ sở (kèm chính sách giá đang hiệu lực)
     */
    static async getFacilityPriceCatalog(
        facilityId: string,
        serviceGroup?: string,
        departmentId?: string,
        patientType?: string,
        search?: string,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<any>> {
        const facilityExists = await BillingPricingRepository.checkFacilityExists(facilityId);
        if (!facilityExists) throw BILLING_PRICING_ERRORS.FACILITY_NOT_FOUND;

        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getFacilityPriceCatalog(facilityId, serviceGroup, departmentId, patientType, search, page, safeLimit);
    }

    // PRICE POLICIES (Chính sách giá theo đối tượng)

    /**
     * Xem chính sách giá của 1 dịch vụ cơ sở
     */
    static async getPolicies(
        facilityServiceId: string,
        patientType?: string,
        isActive?: boolean,
        effectiveDate?: string,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ServicePricePolicy>> {
        const exists = await BillingPricingRepository.checkFacilityServiceExists(facilityServiceId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getPoliciesByFacilityService(
            facilityServiceId, patientType, isActive, effectiveDate, page, safeLimit
        );
    }

    /**
     * Tạo mới chính sách giá
     */
    static async createPolicy(input: CreatePricePolicyInput, userId: string): Promise<ServicePricePolicy> {
        /* Validate */
        if (!VALID_PATIENT_TYPES.includes(input.patient_type)) {
            throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
        }
        if (input.price < 0) throw BILLING_PRICING_ERRORS.INVALID_PRICE;

        const fsExists = await BillingPricingRepository.checkFacilityServiceExists(input.facility_service_id);
        if (!fsExists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        if (input.effective_to && input.effective_to < input.effective_from) {
            throw BILLING_PRICING_ERRORS.EFFECTIVE_DATE_INVALID;
        }

        const duplicate = await BillingPricingRepository.checkPolicyDuplicate(
            input.facility_service_id, input.patient_type, input.effective_from
        );
        if (duplicate) throw BILLING_PRICING_ERRORS.POLICY_DUPLICATE;

        const policyId = this.generateId('SPP');
        const policy = await BillingPricingRepository.createPolicy(policyId, input, userId);

        /* Ghi lịch sử */
        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: input.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.CREATE,
            change_source: PRICE_CHANGE_SOURCE.PRICE_POLICY,
            reference_id: policyId,
            patient_type: input.patient_type,
            new_price: input.price,
            new_effective_from: input.effective_from,
            new_effective_to: input.effective_to || null,
            changed_by: userId,
        });

        return policy;
    }

    /**
     * Cập nhật chính sách giá
     */
    static async updatePolicy(policyId: string, input: UpdatePricePolicyInput, userId: string): Promise<ServicePricePolicy> {
        if (!input.reason) throw BILLING_PRICING_ERRORS.REASON_REQUIRED;

        const oldPolicy = await BillingPricingRepository.getPolicyById(policyId);
        if (!oldPolicy) throw BILLING_PRICING_ERRORS.POLICY_NOT_FOUND;

        if (input.patient_type && !VALID_PATIENT_TYPES.includes(input.patient_type)) {
            throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
        }
        if (input.price !== undefined && input.price < 0) throw BILLING_PRICING_ERRORS.INVALID_PRICE;

        /* Kiểm tra effective_to sau effective_from */
        const newFrom = input.effective_from || oldPolicy.effective_from;
        const newTo = input.effective_to !== undefined ? input.effective_to : oldPolicy.effective_to;
        if (newTo && newTo < newFrom) {
            throw BILLING_PRICING_ERRORS.EFFECTIVE_DATE_INVALID;
        }

        /* Kiểm tra trùng nếu đổi patient_type hoặc effective_from */
        if (input.patient_type || input.effective_from) {
            const checkType = input.patient_type || oldPolicy.patient_type;
            const checkFrom = input.effective_from || oldPolicy.effective_from;
            const dup = await BillingPricingRepository.checkPolicyDuplicate(
                oldPolicy.facility_service_id, checkType, checkFrom, policyId
            );
            if (dup) throw BILLING_PRICING_ERRORS.POLICY_DUPLICATE;
        }

        const updated = await BillingPricingRepository.updatePolicy(policyId, input);

        /* Ghi lịch sử */
        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: oldPolicy.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.UPDATE,
            change_source: PRICE_CHANGE_SOURCE.PRICE_POLICY,
            reference_id: policyId,
            patient_type: input.patient_type || oldPolicy.patient_type,
            old_price: parseFloat(oldPolicy.price),
            new_price: input.price ?? parseFloat(oldPolicy.price),
            old_effective_from: oldPolicy.effective_from,
            new_effective_from: input.effective_from || oldPolicy.effective_from,
            old_effective_to: oldPolicy.effective_to,
            new_effective_to: newTo,
            reason: input.reason,
            changed_by: userId,
        });

        return updated;
    }

    /**
     * Xóa mềm chính sách giá
     */
    static async deletePolicy(policyId: string, reason: string, userId: string): Promise<ServicePricePolicy> {
        if (!reason) throw BILLING_PRICING_ERRORS.REASON_REQUIRED;

        const policy = await BillingPricingRepository.getPolicyById(policyId);
        if (!policy) throw BILLING_PRICING_ERRORS.POLICY_NOT_FOUND;

        const deactivated = await BillingPricingRepository.deactivatePolicy(policyId);

        /* Ghi lịch sử */
        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: policy.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.DELETE,
            change_source: PRICE_CHANGE_SOURCE.PRICE_POLICY,
            reference_id: policyId,
            patient_type: policy.patient_type,
            old_price: parseFloat(policy.price),
            old_effective_from: policy.effective_from,
            old_effective_to: policy.effective_to,
            reason,
            changed_by: userId,
        });

        return deactivated;
    }

    /**
     * Tạo hàng loạt chính sách giá (trong 1 transaction)
     */
    static async bulkCreatePolicies(input: BulkCreatePoliciesInput, userId: string): Promise<{ created: number }> {
        if (!input.policies || input.policies.length === 0) {
            throw BILLING_PRICING_ERRORS.BULK_EMPTY;
        }

        const fsExists = await BillingPricingRepository.checkFacilityServiceExists(input.facility_service_id);
        if (!fsExists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        /* Validate tất cả trước khi bắt đầu transaction */
        for (const p of input.policies) {
            if (!VALID_PATIENT_TYPES.includes(p.patient_type)) throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
            if (p.price < 0) throw BILLING_PRICING_ERRORS.INVALID_PRICE;
            if (p.effective_to && p.effective_to < p.effective_from) throw BILLING_PRICING_ERRORS.EFFECTIVE_DATE_INVALID;
        }

        const client = await BillingPricingRepository.getClient();
        try {
            await client.query('BEGIN');

            for (const p of input.policies) {
                /* Kiểm tra trùng trước khi insert */
                const dup = await BillingPricingRepository.checkPolicyDuplicate(
                    input.facility_service_id, p.patient_type, p.effective_from
                );
                if (dup) throw { ...BILLING_PRICING_ERRORS.POLICY_DUPLICATE, detail: `Trùng: ${p.patient_type} - ${p.effective_from}` };

                const policyId = this.generateId('SPP');
                await BillingPricingRepository.createPolicy(policyId, {
                    facility_service_id: input.facility_service_id,
                    patient_type: p.patient_type,
                    price: p.price,
                    description: p.description,
                    effective_from: p.effective_from,
                    effective_to: p.effective_to,
                }, userId, client);

                await BillingPricingRepository.createHistory(this.generateId('SPH'), {
                    facility_service_id: input.facility_service_id,
                    change_type: PRICE_CHANGE_TYPE.CREATE,
                    change_source: PRICE_CHANGE_SOURCE.PRICE_POLICY,
                    reference_id: policyId,
                    patient_type: p.patient_type,
                    new_price: p.price,
                    new_effective_from: p.effective_from,
                    new_effective_to: p.effective_to || null,
                    changed_by: userId,
                }, client);
            }

            await client.query('COMMIT');
            return { created: input.policies.length };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // PRICE RESOLVER (Tra cứu giá cuối cùng)

    /**
     * Tra cứu giá cuối cùng qua chuỗi ưu tiên:
     * 1. Giá chuyên khoa → 2. Chính sách đối tượng → 3. Fallback facility_services
     */
    static async resolvePrice(
        facilityServiceId: string,
        patientType: string,
        specialtyId?: string,
        referenceDate?: string
    ): Promise<ResolvedPrice> {
        if (!VALID_PATIENT_TYPES.includes(patientType)) {
            throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
        }

        const fsExists = await BillingPricingRepository.checkFacilityServiceExists(facilityServiceId);
        if (!fsExists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        if (specialtyId) {
            const spExists = await BillingPricingRepository.checkSpecialtyExists(specialtyId);
            if (!spExists) throw BILLING_PRICING_ERRORS.SPECIALTY_NOT_FOUND;
        }

        const resolved = await BillingPricingRepository.resolvePrice(
            facilityServiceId, patientType, specialtyId, referenceDate
        );

        if (!resolved) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        return {
            resolved_price: resolved.price,
            source: resolved.source as ResolvedPrice['source'],
            policy_id: resolved.source === 'PRICE_POLICY' ? resolved.sourceId : null,
            specialty_price_id: resolved.source === 'SPECIALTY_PRICE' ? resolved.sourceId : null,
            patient_type: patientType,
            specialty_id: specialtyId || null,
            effective_from: null,
            effective_to: null,
        };
    }

    // SPECIALTY PRICES (Giá theo chuyên khoa)

    /**
     * Lấy giá chuyên khoa theo dịch vụ cơ sở
     */
    static async getSpecialtyPrices(
        facilityServiceId: string,
        specialtyId?: string,
        patientType?: string,
        isActive?: boolean
    ): Promise<FacilityServiceSpecialtyPrice[]> {
        const exists = await BillingPricingRepository.checkFacilityServiceExists(facilityServiceId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        return await BillingPricingRepository.getSpecialtyPricesByFacilityService(
            facilityServiceId, specialtyId, patientType, isActive
        );
    }

    /**
     * Tạo giá chuyên khoa
     */
    static async createSpecialtyPrice(input: CreateSpecialtyPriceInput, userId: string): Promise<FacilityServiceSpecialtyPrice> {
        const patientTypeVal = input.patient_type || PATIENT_TYPE.STANDARD;
        if (!VALID_PATIENT_TYPES.includes(patientTypeVal)) throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
        if (input.price < 0) throw BILLING_PRICING_ERRORS.INVALID_PRICE;

        const fsExists = await BillingPricingRepository.checkFacilityServiceExists(input.facility_service_id);
        if (!fsExists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        const spExists = await BillingPricingRepository.checkSpecialtyExists(input.specialty_id);
        if (!spExists) throw BILLING_PRICING_ERRORS.SPECIALTY_NOT_FOUND;

        if (input.effective_to && input.effective_to < input.effective_from) {
            throw BILLING_PRICING_ERRORS.EFFECTIVE_DATE_INVALID;
        }

        const dup = await BillingPricingRepository.checkSpecialtyPriceDuplicate(
            input.facility_service_id, input.specialty_id, patientTypeVal, input.effective_from
        );
        if (dup) throw BILLING_PRICING_ERRORS.SPECIALTY_PRICE_DUPLICATE;

        const id = this.generateId('FSSP');
        const created = await BillingPricingRepository.createSpecialtyPrice(id, { ...input, patient_type: patientTypeVal }, userId);

        /* Ghi lịch sử */
        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: input.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.CREATE,
            change_source: PRICE_CHANGE_SOURCE.SPECIALTY_PRICE,
            reference_id: id,
            patient_type: patientTypeVal,
            specialty_id: input.specialty_id,
            new_price: input.price,
            new_effective_from: input.effective_from,
            new_effective_to: input.effective_to || null,
            changed_by: userId,
        });

        return created;
    }

    /**
     * Cập nhật giá chuyên khoa
     */
    static async updateSpecialtyPrice(id: string, input: UpdateSpecialtyPriceInput, userId: string): Promise<FacilityServiceSpecialtyPrice> {
        if (!input.reason) throw BILLING_PRICING_ERRORS.REASON_REQUIRED;

        const old = await BillingPricingRepository.getSpecialtyPriceById(id);
        if (!old) throw BILLING_PRICING_ERRORS.SPECIALTY_PRICE_NOT_FOUND;

        if (input.patient_type && !VALID_PATIENT_TYPES.includes(input.patient_type)) {
            throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;
        }
        if (input.price !== undefined && input.price < 0) throw BILLING_PRICING_ERRORS.INVALID_PRICE;

        const updated = await BillingPricingRepository.updateSpecialtyPrice(id, input);

        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: old.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.UPDATE,
            change_source: PRICE_CHANGE_SOURCE.SPECIALTY_PRICE,
            reference_id: id,
            patient_type: input.patient_type || old.patient_type,
            specialty_id: old.specialty_id,
            old_price: parseFloat(old.price),
            new_price: input.price ?? parseFloat(old.price),
            reason: input.reason,
            changed_by: userId,
        });

        return updated;
    }

    /**
     * Xóa mềm giá chuyên khoa
     */
    static async deleteSpecialtyPrice(id: string, reason: string, userId: string): Promise<FacilityServiceSpecialtyPrice> {
        if (!reason) throw BILLING_PRICING_ERRORS.REASON_REQUIRED;

        const old = await BillingPricingRepository.getSpecialtyPriceById(id);
        if (!old) throw BILLING_PRICING_ERRORS.SPECIALTY_PRICE_NOT_FOUND;

        const deactivated = await BillingPricingRepository.deactivateSpecialtyPrice(id);

        await BillingPricingRepository.createHistory(this.generateId('SPH'), {
            facility_service_id: old.facility_service_id,
            change_type: PRICE_CHANGE_TYPE.DELETE,
            change_source: PRICE_CHANGE_SOURCE.SPECIALTY_PRICE,
            reference_id: id,
            patient_type: old.patient_type,
            specialty_id: old.specialty_id,
            old_price: parseFloat(old.price),
            reason,
            changed_by: userId,
        });

        return deactivated;
    }

    // HISTORY & STATISTICS

    /** Lịch sử giá 1 dịch vụ cơ sở */
    static async getHistoryByFacilityService(
        facilityServiceId: string,
        changeType?: string,
        changeSource?: string,
        dateFrom?: string,
        dateTo?: string,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ServicePriceHistory>> {
        const exists = await BillingPricingRepository.checkFacilityServiceExists(facilityServiceId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_SERVICE_NOT_FOUND;

        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getHistoryByFacilityService(
            facilityServiceId, changeType, changeSource, dateFrom, dateTo, page, safeLimit
        );
    }

    /** Lịch sử giá toàn cơ sở */
    static async getHistoryByFacility(
        facilityId: string,
        changeType?: string,
        changeSource?: string,
        dateFrom?: string,
        dateTo?: string,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ServicePriceHistory>> {
        const exists = await BillingPricingRepository.checkFacilityExists(facilityId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_NOT_FOUND;

        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getHistoryByFacility(
            facilityId, changeType, changeSource, dateFrom, dateTo, page, safeLimit
        );
    }

    /** So sánh giá liên cơ sở */
    static async comparePrices(serviceId: string, patientType: string = PATIENT_TYPE.STANDARD): Promise<PriceComparison[]> {
        const exists = await BillingPricingRepository.checkServiceExists(serviceId);
        if (!exists) throw BILLING_PRICING_ERRORS.SERVICE_NOT_FOUND;

        if (!VALID_PATIENT_TYPES.includes(patientType)) throw BILLING_PRICING_ERRORS.INVALID_PATIENT_TYPE;

        return await BillingPricingRepository.comparePriceAcrossFacilities(serviceId, patientType);
    }

    /** Thống kê bảng giá cơ sở */
    static async getPricingSummary(facilityId: string): Promise<PricingSummary> {
        const exists = await BillingPricingRepository.checkFacilityExists(facilityId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_NOT_FOUND;

        return await BillingPricingRepository.getPricingSummary(facilityId, BILLING_PRICING_CONFIG.DEFAULT_EXPIRY_WARNING_DAYS);
    }

    /** Chính sách sắp hết hạn */
    static async getExpiringPolicies(
        facilityId: string,
        warningDays: number = BILLING_PRICING_CONFIG.DEFAULT_EXPIRY_WARNING_DAYS,
        page: number = BILLING_PRICING_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_PRICING_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ServicePricePolicy>> {
        const exists = await BillingPricingRepository.checkFacilityExists(facilityId);
        if (!exists) throw BILLING_PRICING_ERRORS.FACILITY_NOT_FOUND;

        const safeLimit = Math.min(limit, BILLING_PRICING_CONFIG.MAX_LIMIT);
        return await BillingPricingRepository.getExpiringPolicies(facilityId, warningDays, page, safeLimit);
    }
}
