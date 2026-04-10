import { randomUUID } from 'crypto';
import { BillingPricingPolicyRepository } from '../../repository/Billing/billing-pricing-policy.repository';
import {
    DiscountPolicy,
    Voucher,
    VoucherUsage,
    ServiceBundle,
    CreateDiscountInput,
    UpdateDiscountInput,
    CreateVoucherInput,
    UpdateVoucherInput,
    ValidateVoucherInput,
    RedeemVoucherInput,
    CreateBundleInput,
    UpdateBundleInput,
    DiscountCalculation,
    PaginatedResult,
} from '../../models/Billing/billing-pricing-policy.model';
import {
    DISCOUNT_TYPE,
    POLICY_ERRORS,
    POLICY_CONFIG,
    VALID_APPLY_TO,
} from '../../constants/billing-pricing-policy.constant';

export class BillingPricingPolicyService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    private static generateCode(prefix: string): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${dateStr}-${rand}`;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: CHÍNH SÁCH GIẢM GIÁ
    // ═══════════════════════════════════════════════════

    /** Tạo chính sách giảm giá */
    static async createDiscount(input: CreateDiscountInput, userId: string): Promise<DiscountPolicy> {
        if (!input.name) throw POLICY_ERRORS.NAME_REQUIRED;
        if (!input.discount_type || ![DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED_AMOUNT].includes(input.discount_type as any)) {
            throw POLICY_ERRORS.INVALID_DISCOUNT_TYPE;
        }
        if (!input.discount_value || input.discount_value <= 0) throw POLICY_ERRORS.INVALID_DISCOUNT_VALUE;
        if (input.discount_type === DISCOUNT_TYPE.PERCENTAGE && (input.discount_value < 0.01 || input.discount_value > 100)) {
            throw POLICY_ERRORS.INVALID_PERCENTAGE;
        }
        if (input.apply_to && !VALID_APPLY_TO.includes(input.apply_to as any)) {
            throw POLICY_ERRORS.INVALID_APPLY_TO;
        }
        if (input.effective_to && input.effective_to < input.effective_from) {
            throw POLICY_ERRORS.INVALID_DATE_RANGE;
        }

        const discountId = this.generateId('DSC');
        const discountCode = this.generateCode(POLICY_CONFIG.DISCOUNT_CODE_PREFIX);

        return await BillingPricingPolicyRepository.createDiscount({
            discount_id: discountId,
            discount_code: discountCode,
            name: input.name,
            description: input.description || null,
            discount_type: input.discount_type,
            discount_value: input.discount_value.toFixed(2),
            max_discount_amount: input.max_discount_amount?.toFixed(2) || null,
            min_order_amount: (input.min_order_amount || 0).toFixed(2),
            apply_to: input.apply_to || 'ALL_SERVICES',
            applicable_services: input.applicable_services || null,
            applicable_groups: input.applicable_groups || null,
            target_patient_types: input.target_patient_types || null,
            effective_from: input.effective_from,
            effective_to: input.effective_to || null,
            priority: input.priority || 0,
            facility_id: input.facility_id || null,
            created_by: userId,
        } as any);
    }

    /** Danh sách */
    static async getDiscounts(
        discountType?: string, applyTo?: string, isActive?: string,
        facilityId?: string, page: number = POLICY_CONFIG.DEFAULT_PAGE,
        limit: number = POLICY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<DiscountPolicy>> {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        const safeLimit = Math.min(limit, POLICY_CONFIG.MAX_LIMIT);
        return await BillingPricingPolicyRepository.getDiscounts(discountType, applyTo, active, facilityId, page, safeLimit);
    }

    /** Chi tiết */
    static async getDiscountById(discountId: string): Promise<DiscountPolicy> {
        const disc = await BillingPricingPolicyRepository.getDiscountById(discountId);
        if (!disc) throw POLICY_ERRORS.DISCOUNT_NOT_FOUND;
        return disc;
    }

    /** Cập nhật */
    static async updateDiscount(discountId: string, input: UpdateDiscountInput): Promise<DiscountPolicy> {
        const existing = await BillingPricingPolicyRepository.getDiscountById(discountId);
        if (!existing) throw POLICY_ERRORS.DISCOUNT_NOT_FOUND;

        if (input.discount_value !== undefined && input.discount_value <= 0) throw POLICY_ERRORS.INVALID_DISCOUNT_VALUE;

        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.discount_value !== undefined) updateData.discount_value = input.discount_value;
        if (input.max_discount_amount !== undefined) updateData.max_discount_amount = input.max_discount_amount;
        if (input.min_order_amount !== undefined) updateData.min_order_amount = input.min_order_amount;
        if (input.apply_to !== undefined) updateData.apply_to = input.apply_to;
        if (input.applicable_services !== undefined) updateData.applicable_services = input.applicable_services;
        if (input.applicable_groups !== undefined) updateData.applicable_groups = input.applicable_groups;
        if (input.target_patient_types !== undefined) updateData.target_patient_types = input.target_patient_types;
        if (input.effective_from !== undefined) updateData.effective_from = input.effective_from;
        if (input.effective_to !== undefined) updateData.effective_to = input.effective_to;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        return await BillingPricingPolicyRepository.updateDiscount(discountId, updateData);
    }

    /** Soft delete */
    static async deleteDiscount(discountId: string): Promise<void> {
        const existing = await BillingPricingPolicyRepository.getDiscountById(discountId);
        if (!existing) throw POLICY_ERRORS.DISCOUNT_NOT_FOUND;
        await BillingPricingPolicyRepository.softDeleteDiscount(discountId);
    }

    /**
     * Tính giảm giá cho danh sách dịch vụ
     * Priority cascade: áp từ priority cao nhất xuống, cap final >= 0
     */
    static async calculateDiscount(
        services: { facility_service_id: string; amount: number }[],
        patientType?: string, facilityId?: string
    ): Promise<DiscountCalculation> {
        const originalAmount = services.reduce((sum, s) => sum + s.amount, 0);
        let runningAmount = originalAmount;
        const appliedDiscounts: DiscountCalculation['applied_discounts'] = [];

        /* Lấy discounts active, sort priority DESC */
        const activeDiscounts = await BillingPricingPolicyRepository.getActiveDiscounts(facilityId);

        for (const disc of activeDiscounts) {
            /* Check min_order_amount */
            const minOrder = parseFloat(disc.min_order_amount || '0');
            if (runningAmount < minOrder) continue;

            /* Check target_patient_types */
            if (disc.target_patient_types && patientType) {
                if (!disc.target_patient_types.includes(patientType)) continue;
            }

            /* Check phạm vi áp dụng */
            if (disc.apply_to === 'SPECIFIC_SERVICES' && disc.applicable_services) {
                const applicableIds = disc.applicable_services.map((s: any) => s.facility_service_id);
                const hasMatch = services.some(s => applicableIds.includes(s.facility_service_id));
                if (!hasMatch) continue;
            }

            /* Tính discount */
            let discountAmount: number;
            if (disc.discount_type === DISCOUNT_TYPE.PERCENTAGE) {
                discountAmount = runningAmount * parseFloat(disc.discount_value) / 100;
                const maxCap = disc.max_discount_amount ? parseFloat(disc.max_discount_amount) : Infinity;
                discountAmount = Math.min(discountAmount, maxCap);
            } else {
                discountAmount = parseFloat(disc.discount_value);
            }

            discountAmount = Math.min(discountAmount, runningAmount);
            if (discountAmount <= 0) continue;

            runningAmount -= discountAmount;
            appliedDiscounts.push({
                discount_id: disc.discount_id,
                discount_code: disc.discount_code,
                name: disc.name,
                type: disc.discount_type,
                value: parseFloat(disc.discount_value),
                discount_amount: discountAmount,
            });
        }

        return {
            original_amount: originalAmount,
            total_discount: originalAmount - runningAmount,
            final_amount: Math.max(runningAmount, 0),
            applied_discounts: appliedDiscounts,
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: VOUCHER / COUPON
    // ═══════════════════════════════════════════════════

    /** Tạo voucher */
    static async createVoucher(input: CreateVoucherInput, userId: string): Promise<Voucher> {
        if (!input.name) throw POLICY_ERRORS.NAME_REQUIRED;
        if (!input.voucher_code) throw POLICY_ERRORS.VOUCHER_CODE_REQUIRED;
        if (!input.discount_type || ![DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED_AMOUNT].includes(input.discount_type as any)) {
            throw POLICY_ERRORS.INVALID_DISCOUNT_TYPE;
        }
        if (!input.discount_value || input.discount_value <= 0) throw POLICY_ERRORS.INVALID_DISCOUNT_VALUE;

        /* Check trùng code */
        const existing = await BillingPricingPolicyRepository.getVoucherByCode(input.voucher_code);
        if (existing) throw POLICY_ERRORS.VOUCHER_CODE_EXISTS;

        const voucherId = this.generateId('VCH');

        return await BillingPricingPolicyRepository.createVoucher({
            voucher_id: voucherId,
            voucher_code: input.voucher_code.toUpperCase(),
            name: input.name,
            description: input.description || null,
            discount_type: input.discount_type,
            discount_value: input.discount_value.toFixed(2),
            max_discount_amount: input.max_discount_amount?.toFixed(2) || null,
            min_order_amount: (input.min_order_amount || 0).toFixed(2),
            max_usage: input.max_usage ?? null,
            max_usage_per_patient: input.max_usage_per_patient || 1,
            target_patient_types: input.target_patient_types || null,
            valid_from: input.valid_from,
            valid_to: input.valid_to || null,
            facility_id: input.facility_id || null,
            created_by: userId,
        } as any);
    }

    /** Danh sách */
    static async getVouchers(
        isActive?: string, facilityId?: string,
        page: number = POLICY_CONFIG.DEFAULT_PAGE,
        limit: number = POLICY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<Voucher>> {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        const safeLimit = Math.min(limit, POLICY_CONFIG.MAX_LIMIT);
        return await BillingPricingPolicyRepository.getVouchers(active, facilityId, page, safeLimit);
    }

    /** Chi tiết */
    static async getVoucherById(voucherId: string): Promise<Voucher> {
        const v = await BillingPricingPolicyRepository.getVoucherById(voucherId);
        if (!v) throw POLICY_ERRORS.VOUCHER_NOT_FOUND;
        return v;
    }

    /** Cập nhật */
    static async updateVoucher(voucherId: string, input: UpdateVoucherInput): Promise<Voucher> {
        const existing = await BillingPricingPolicyRepository.getVoucherById(voucherId);
        if (!existing) throw POLICY_ERRORS.VOUCHER_NOT_FOUND;

        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.discount_value !== undefined) updateData.discount_value = input.discount_value;
        if (input.max_discount_amount !== undefined) updateData.max_discount_amount = input.max_discount_amount;
        if (input.min_order_amount !== undefined) updateData.min_order_amount = input.min_order_amount;
        if (input.max_usage !== undefined) updateData.max_usage = input.max_usage;
        if (input.max_usage_per_patient !== undefined) updateData.max_usage_per_patient = input.max_usage_per_patient;
        if (input.target_patient_types !== undefined) updateData.target_patient_types = input.target_patient_types;
        if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
        if (input.valid_to !== undefined) updateData.valid_to = input.valid_to;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        return await BillingPricingPolicyRepository.updateVoucher(voucherId, updateData);
    }

    /** Soft delete */
    static async deleteVoucher(voucherId: string): Promise<void> {
        const existing = await BillingPricingPolicyRepository.getVoucherById(voucherId);
        if (!existing) throw POLICY_ERRORS.VOUCHER_NOT_FOUND;
        await BillingPricingPolicyRepository.softDeleteVoucher(voucherId);
    }

    /**
     * Validate voucher code
     * Check: hạn, lượt dùng, BN limit, min order, đối tượng
     * Trả về discount preview
     */
    static async validateVoucher(input: ValidateVoucherInput): Promise<{ valid: boolean; voucher: Voucher; discount_preview: number }> {
        if (!input.voucher_code) throw POLICY_ERRORS.VOUCHER_CODE_REQUIRED;

        const voucher = await BillingPricingPolicyRepository.getVoucherByCode(input.voucher_code);
        if (!voucher) throw POLICY_ERRORS.VOUCHER_NOT_FOUND;
        if (!voucher.is_active) throw POLICY_ERRORS.VOUCHER_INACTIVE;

        const now = new Date().toISOString().slice(0, 10);
        if (voucher.valid_from > now) throw POLICY_ERRORS.VOUCHER_EXPIRED;
        if (voucher.valid_to && voucher.valid_to < now) throw POLICY_ERRORS.VOUCHER_EXPIRED;

        /* Check total usage */
        if (voucher.max_usage !== null && voucher.current_usage >= voucher.max_usage) {
            throw POLICY_ERRORS.VOUCHER_EXHAUSTED;
        }

        /* Check patient limit */
        if (input.patient_id) {
            const patientUsage = await BillingPricingPolicyRepository.getPatientVoucherUsageCount(voucher.voucher_id, input.patient_id);
            if (patientUsage >= voucher.max_usage_per_patient) {
                throw POLICY_ERRORS.VOUCHER_PATIENT_LIMIT;
            }
        }

        /* Check min order */
        const minOrder = parseFloat(voucher.min_order_amount || '0');
        if (input.order_amount !== undefined && input.order_amount < minOrder) {
            throw POLICY_ERRORS.VOUCHER_MIN_ORDER;
        }

        /* Check patient type */
        if (voucher.target_patient_types && input.patient_type) {
            if (!voucher.target_patient_types.includes(input.patient_type)) {
                throw POLICY_ERRORS.VOUCHER_PATIENT_TYPE;
            }
        }

        /* Tính preview */
        const orderAmount = input.order_amount || 0;
        let discountPreview: number;
        if (voucher.discount_type === DISCOUNT_TYPE.PERCENTAGE) {
            discountPreview = orderAmount * parseFloat(voucher.discount_value) / 100;
            const maxCap = voucher.max_discount_amount ? parseFloat(voucher.max_discount_amount) : Infinity;
            discountPreview = Math.min(discountPreview, maxCap);
        } else {
            discountPreview = parseFloat(voucher.discount_value);
        }
        discountPreview = Math.min(discountPreview, orderAmount);

        return { valid: true, voucher, discount_preview: discountPreview };
    }

    /**
     * Redeem voucher
     * Ghi nhận voucher_usage + tăng current_usage + cập nhật invoice discount_amount
     */
    static async redeemVoucher(input: RedeemVoucherInput, userId: string): Promise<VoucherUsage> {
        /* Validate trước */
        const { voucher, discount_preview } = await this.validateVoucher({
            voucher_code: input.voucher_code,
            patient_id: input.patient_id,
            order_amount: input.order_amount,
            patient_type: input.patient_type,
        });

        /* Check invoice */
        const invoice = await BillingPricingPolicyRepository.getInvoiceById(input.invoice_id);
        if (!invoice) throw POLICY_ERRORS.INVOICE_NOT_FOUND;

        const client = await BillingPricingPolicyRepository.getClient();
        try {
            await client.query('BEGIN');

            const usageId = this.generateId('VU');
            const usage = await BillingPricingPolicyRepository.createVoucherUsage({
                usage_id: usageId,
                voucher_id: voucher.voucher_id,
                invoice_id: input.invoice_id,
                patient_id: input.patient_id || null,
                discount_amount: discount_preview.toFixed(2),
                used_by: userId,
            } as any, client);

            /* Tăng usage counter */
            await BillingPricingPolicyRepository.incrementVoucherUsage(voucher.voucher_id, client);

            /* Cập nhật invoice discount_amount */
            const currentDiscount = parseFloat(invoice.discount_amount || '0');
            await BillingPricingPolicyRepository.updateInvoiceDiscount(
                input.invoice_id, currentDiscount + discount_preview, client
            );

            await client.query('COMMIT');
            return usage;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Lịch sử sử dụng */
    static async getVoucherUsage(voucherId: string): Promise<VoucherUsage[]> {
        const voucher = await BillingPricingPolicyRepository.getVoucherById(voucherId);
        if (!voucher) throw POLICY_ERRORS.VOUCHER_NOT_FOUND;
        return await BillingPricingPolicyRepository.getVoucherUsage(voucherId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: GÓI DỊCH VỤ
    // ═══════════════════════════════════════════════════

    /**
     * Tạo gói dịch vụ
     * Auto-calc: original_total_price, discount_percentage
     */
    static async createBundle(input: CreateBundleInput, userId: string): Promise<ServiceBundle> {
        if (!input.name) throw POLICY_ERRORS.NAME_REQUIRED;
        if (!input.items || input.items.length === 0) throw POLICY_ERRORS.BUNDLE_NO_ITEMS;

        /* Lấy giá lẻ cho từng service */
        let originalTotal = 0;
        const itemsData: any[] = [];
        for (const item of input.items) {
            const fs = await BillingPricingPolicyRepository.getFacilityServicePrice(item.facility_service_id);
            if (!fs) throw POLICY_ERRORS.FACILITY_SERVICE_NOT_FOUND;

            const unitPrice = parseFloat(fs.base_price);
            const qty = item.quantity || 1;
            originalTotal += unitPrice * qty;

            itemsData.push({
                item_id: this.generateId('BI'),
                facility_service_id: item.facility_service_id,
                quantity: qty,
                unit_price: unitPrice,
                item_price: item.item_price,
            });
        }

        const bundlePrice = input.bundle_price;
        const discountPercentage = originalTotal > 0
            ? ((originalTotal - bundlePrice) / originalTotal * 100)
            : 0;

        const client = await BillingPricingPolicyRepository.getClient();
        try {
            await client.query('BEGIN');

            const bundleId = this.generateId('BDL');
            const bundle = await BillingPricingPolicyRepository.createBundle({
                bundle_id: bundleId,
                bundle_code: input.bundle_code.toUpperCase(),
                name: input.name,
                description: input.description || null,
                bundle_price: bundlePrice.toFixed(2),
                original_total_price: originalTotal.toFixed(2),
                discount_percentage: discountPercentage.toFixed(2),
                valid_from: input.valid_from,
                valid_to: input.valid_to || null,
                target_patient_types: input.target_patient_types || null,
                max_purchases: input.max_purchases ?? null,
                facility_id: input.facility_id || null,
                created_by: userId,
            } as any, client);

            /* Thêm items */
            const bundleItems = itemsData.map(i => ({ ...i, bundle_id: bundleId }));
            await BillingPricingPolicyRepository.createBundleItems(bundleItems, client);

            await client.query('COMMIT');
            return (await BillingPricingPolicyRepository.getBundleById(bundleId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Danh sách */
    static async getBundles(
        isActive?: string, facilityId?: string,
        page: number = POLICY_CONFIG.DEFAULT_PAGE,
        limit: number = POLICY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<ServiceBundle>> {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        const safeLimit = Math.min(limit, POLICY_CONFIG.MAX_LIMIT);
        return await BillingPricingPolicyRepository.getBundles(active, facilityId, page, safeLimit);
    }

    /** Chi tiết + items */
    static async getBundleById(bundleId: string): Promise<ServiceBundle> {
        const bundle = await BillingPricingPolicyRepository.getBundleById(bundleId);
        if (!bundle) throw POLICY_ERRORS.BUNDLE_NOT_FOUND;
        return bundle;
    }

    /** Cập nhật */
    static async updateBundle(bundleId: string, input: UpdateBundleInput): Promise<ServiceBundle> {
        const existing = await BillingPricingPolicyRepository.getBundleById(bundleId);
        if (!existing) throw POLICY_ERRORS.BUNDLE_NOT_FOUND;

        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.bundle_price !== undefined) {
            updateData.bundle_price = input.bundle_price;
            const origTotal = parseFloat(existing.original_total_price);
            if (origTotal > 0) {
                updateData.discount_percentage = ((origTotal - input.bundle_price) / origTotal * 100).toFixed(2);
            }
        }
        if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
        if (input.valid_to !== undefined) updateData.valid_to = input.valid_to;
        if (input.target_patient_types !== undefined) updateData.target_patient_types = input.target_patient_types;
        if (input.max_purchases !== undefined) updateData.max_purchases = input.max_purchases;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        return await BillingPricingPolicyRepository.updateBundle(bundleId, updateData);
    }

    /** Soft delete */
    static async deleteBundle(bundleId: string): Promise<void> {
        const existing = await BillingPricingPolicyRepository.getBundleById(bundleId);
        if (!existing) throw POLICY_ERRORS.BUNDLE_NOT_FOUND;
        await BillingPricingPolicyRepository.softDeleteBundle(bundleId);
    }

    /**
     * Tính giá gói vs giá lẻ
     */
    static async calculateBundle(bundleId: string): Promise<any> {
        const bundle = await BillingPricingPolicyRepository.getBundleById(bundleId);
        if (!bundle) throw POLICY_ERRORS.BUNDLE_NOT_FOUND;

        const bundlePrice = parseFloat(bundle.bundle_price);
        const originalPrice = parseFloat(bundle.original_total_price);
        const saving = originalPrice - bundlePrice;

        return {
            bundle_id: bundle.bundle_id,
            bundle_code: bundle.bundle_code,
            name: bundle.name,
            bundle_price: bundlePrice,
            original_total_price: originalPrice,
            saving_amount: saving,
            saving_percentage: parseFloat(bundle.discount_percentage),
            items: bundle.items?.map(item => ({
                service_name: item.service_name,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price),
                item_price: parseFloat(item.item_price),
                saving: (parseFloat(item.unit_price) - parseFloat(item.item_price)) * item.quantity,
            })),
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: TỔNG QUAN
    // ═══════════════════════════════════════════════════

    /** Ưu đãi đang chạy */
    static async getActivePromotions(facilityId?: string): Promise<any> {
        return await BillingPricingPolicyRepository.getActivePromotions(facilityId);
    }

    /** Lịch sử thay đổi chính sách (delegate sang service_price_history module 9.1) */
    static async getPolicyHistory(
        facilityServiceId?: string, changeSource?: string,
        page: number = POLICY_CONFIG.DEFAULT_PAGE,
        limit: number = POLICY_CONFIG.DEFAULT_LIMIT
    ): Promise<any> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (facilityServiceId) { conditions.push(`sph.facility_service_id = $${idx++}`); params.push(facilityServiceId); }
        if (changeSource) { conditions.push(`sph.change_source = $${idx++}`); params.push(changeSource); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const { pool } = require('../../config/postgresdb');
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM service_price_history sph ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT sph.*, up.full_name as changed_by_name
            FROM service_price_history sph
            LEFT JOIN user_profiles up ON sph.changed_by = up.user_id
            ${where}
            ORDER BY sph.changed_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return {
            data: dataResult.rows, total, page, limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
