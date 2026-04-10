import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    DiscountPolicy,
    Voucher,
    VoucherUsage,
    ServiceBundle,
    ServiceBundleItem,
    PaginatedResult,
} from '../../models/Billing/billing-pricing-policy.model';

export class BillingPricingPolicyRepository {

    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // ═══════════════════════════════════════════════════
    // DISCOUNT POLICIES
    // ═══════════════════════════════════════════════════

    /** Tạo */
    static async createDiscount(data: Partial<DiscountPolicy>): Promise<DiscountPolicy> {
        const sql = `
            INSERT INTO discount_policies (
                discount_id, discount_code, name, description,
                discount_type, discount_value, max_discount_amount, min_order_amount,
                apply_to, applicable_services, applicable_groups, target_patient_types,
                effective_from, effective_to, is_active, priority, facility_id, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.discount_id, data.discount_code, data.name, data.description || null,
            data.discount_type, data.discount_value, data.max_discount_amount || null, data.min_order_amount || 0,
            data.apply_to || 'ALL_SERVICES',
            data.applicable_services ? JSON.stringify(data.applicable_services) : null,
            data.applicable_groups ? JSON.stringify(data.applicable_groups) : null,
            data.target_patient_types ? JSON.stringify(data.target_patient_types) : null,
            data.effective_from, data.effective_to || null,
            data.is_active !== false, data.priority || 0,
            data.facility_id || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật */
    static async updateDiscount(discountId: string, data: Record<string, any>): Promise<DiscountPolicy> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [discountId];
        let idx = 2;
        const jsonFields = ['applicable_services', 'applicable_groups', 'target_patient_types'];
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                sets.push(`${key} = $${idx++}`);
                params.push(jsonFields.includes(key) && value !== null ? JSON.stringify(value) : value);
            }
        }
        const sql = `UPDATE discount_policies SET ${sets.join(', ')} WHERE discount_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết */
    static async getDiscountById(discountId: string): Promise<DiscountPolicy | null> {
        const sql = `
            SELECT dp.*, up.full_name as created_by_name, f.name as facility_name
            FROM discount_policies dp
            LEFT JOIN user_profiles up ON dp.created_by = up.user_id
            LEFT JOIN facilities f ON dp.facility_id = f.facilities_id
            WHERE dp.discount_id = $1
        `;
        const result = await pool.query(sql, [discountId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách */
    static async getDiscounts(
        discountType?: string, applyTo?: string, isActive?: boolean,
        facilityId?: string, page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<DiscountPolicy>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (discountType) { conditions.push(`dp.discount_type = $${idx++}`); params.push(discountType); }
        if (applyTo) { conditions.push(`dp.apply_to = $${idx++}`); params.push(applyTo); }
        if (isActive !== undefined) { conditions.push(`dp.is_active = $${idx++}`); params.push(isActive); }
        if (facilityId) { conditions.push(`dp.facility_id = $${idx++}`); params.push(facilityId); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM discount_policies dp ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT dp.*, up.full_name as created_by_name
            FROM discount_policies dp
            LEFT JOIN user_profiles up ON dp.created_by = up.user_id
            ${where}
            ORDER BY dp.priority DESC, dp.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Lấy tất cả discount active + trong thời hạn */
    static async getActiveDiscounts(facilityId?: string): Promise<DiscountPolicy[]> {
        const sql = `
            SELECT * FROM discount_policies
            WHERE is_active = TRUE
              AND effective_from <= CURRENT_DATE
              AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
              ${facilityId ? 'AND (facility_id = $1 OR facility_id IS NULL)' : ''}
            ORDER BY priority DESC
        `;
        const result = await pool.query(sql, facilityId ? [facilityId] : []);
        return result.rows;
    }

    /** Soft delete */
    static async softDeleteDiscount(discountId: string): Promise<void> {
        await pool.query(`UPDATE discount_policies SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE discount_id = $1`, [discountId]);
    }

    // ═══════════════════════════════════════════════════
    // VOUCHERS
    // ═══════════════════════════════════════════════════

    /** Tạo */
    static async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
        const sql = `
            INSERT INTO vouchers (
                voucher_id, voucher_code, name, description,
                discount_type, discount_value, max_discount_amount, min_order_amount,
                max_usage, max_usage_per_patient, target_patient_types,
                valid_from, valid_to, is_active, facility_id, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.voucher_id, data.voucher_code, data.name, data.description || null,
            data.discount_type, data.discount_value, data.max_discount_amount || null, data.min_order_amount || 0,
            data.max_usage || null, data.max_usage_per_patient || 1,
            data.target_patient_types ? JSON.stringify(data.target_patient_types) : null,
            data.valid_from, data.valid_to || null, data.is_active !== false,
            data.facility_id || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật */
    static async updateVoucher(voucherId: string, data: Record<string, any>): Promise<Voucher> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [voucherId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                sets.push(`${key} = $${idx++}`);
                params.push(key === 'target_patient_types' && value !== null ? JSON.stringify(value) : value);
            }
        }
        const sql = `UPDATE vouchers SET ${sets.join(', ')} WHERE voucher_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết */
    static async getVoucherById(voucherId: string): Promise<Voucher | null> {
        const sql = `
            SELECT v.*, up.full_name as created_by_name, f.name as facility_name,
                   CASE WHEN v.max_usage IS NOT NULL THEN v.max_usage - v.current_usage ELSE NULL END as remaining_usage
            FROM vouchers v
            LEFT JOIN user_profiles up ON v.created_by = up.user_id
            LEFT JOIN facilities f ON v.facility_id = f.facilities_id
            WHERE v.voucher_id = $1
        `;
        const result = await pool.query(sql, [voucherId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tìm voucher theo code */
    static async getVoucherByCode(code: string): Promise<Voucher | null> {
        const sql = `
            SELECT v.*, 
                   CASE WHEN v.max_usage IS NOT NULL THEN v.max_usage - v.current_usage ELSE NULL END as remaining_usage
            FROM vouchers v WHERE UPPER(v.voucher_code) = UPPER($1)
        `;
        const result = await pool.query(sql, [code]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Đếm lượt dùng của 1 BN cho 1 voucher */
    static async getPatientVoucherUsageCount(voucherId: string, patientId: string): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM voucher_usage WHERE voucher_id = $1 AND patient_id = $2`;
        const result = await pool.query(sql, [voucherId, patientId]);
        return parseInt(result.rows[0].cnt);
    }

    /** Danh sách voucher */
    static async getVouchers(
        isActive?: boolean, facilityId?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<Voucher>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (isActive !== undefined) { conditions.push(`v.is_active = $${idx++}`); params.push(isActive); }
        if (facilityId) { conditions.push(`v.facility_id = $${idx++}`); params.push(facilityId); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM vouchers v ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT v.*, up.full_name as created_by_name,
                   CASE WHEN v.max_usage IS NOT NULL THEN v.max_usage - v.current_usage ELSE NULL END as remaining_usage
            FROM vouchers v
            LEFT JOIN user_profiles up ON v.created_by = up.user_id
            ${where}
            ORDER BY v.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Ghi nhận sử dụng voucher */
    static async createVoucherUsage(data: Partial<VoucherUsage>, client: PoolClient): Promise<VoucherUsage> {
        const sql = `
            INSERT INTO voucher_usage (usage_id, voucher_id, invoice_id, patient_id, discount_amount, used_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await client.query(sql, [
            data.usage_id, data.voucher_id, data.invoice_id,
            data.patient_id || null, data.discount_amount, data.used_by || null,
        ]);
        return result.rows[0];
    }

    /** Tăng current_usage */
    static async incrementVoucherUsage(voucherId: string, client: PoolClient): Promise<void> {
        await client.query(
            `UPDATE vouchers SET current_usage = current_usage + 1, updated_at = CURRENT_TIMESTAMP WHERE voucher_id = $1`,
            [voucherId]
        );
    }

    /** Lịch sử sử dụng */
    static async getVoucherUsage(voucherId: string): Promise<VoucherUsage[]> {
        const sql = `
            SELECT vu.*, v.voucher_code, i.invoice_code,
                   p.full_name as patient_name, up.full_name as used_by_name
            FROM voucher_usage vu
            LEFT JOIN vouchers v ON vu.voucher_id = v.voucher_id
            LEFT JOIN invoices i ON vu.invoice_id = i.invoices_id
            LEFT JOIN patients p ON vu.patient_id = p.id
            LEFT JOIN user_profiles up ON vu.used_by = up.user_id
            WHERE vu.voucher_id = $1
            ORDER BY vu.used_at DESC
        `;
        const result = await pool.query(sql, [voucherId]);
        return result.rows;
    }

    /** Soft delete voucher */
    static async softDeleteVoucher(voucherId: string): Promise<void> {
        await pool.query(`UPDATE vouchers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE voucher_id = $1`, [voucherId]);
    }

    // ═══════════════════════════════════════════════════
    // SERVICE BUNDLES
    // ═══════════════════════════════════════════════════

    /** Tạo bundle */
    static async createBundle(data: Partial<ServiceBundle>, client: PoolClient): Promise<ServiceBundle> {
        const sql = `
            INSERT INTO service_bundles (
                bundle_id, bundle_code, name, description,
                bundle_price, original_total_price, discount_percentage,
                valid_from, valid_to, target_patient_types,
                max_purchases, is_active, facility_id, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
        `;
        const result = await client.query(sql, [
            data.bundle_id, data.bundle_code, data.name, data.description || null,
            data.bundle_price, data.original_total_price || 0, data.discount_percentage || 0,
            data.valid_from, data.valid_to || null,
            data.target_patient_types ? JSON.stringify(data.target_patient_types) : null,
            data.max_purchases || null, data.is_active !== false,
            data.facility_id || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Tạo bundle items */
    static async createBundleItems(items: Partial<ServiceBundleItem>[], client: PoolClient): Promise<void> {
        for (const item of items) {
            await client.query(
                `INSERT INTO service_bundle_items (item_id, bundle_id, facility_service_id, quantity, unit_price, item_price, notes)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [item.item_id, item.bundle_id, item.facility_service_id, item.quantity || 1, item.unit_price, item.item_price, item.notes || null]
            );
        }
    }

    /** Cập nhật bundle */
    static async updateBundle(bundleId: string, data: Record<string, any>): Promise<ServiceBundle> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [bundleId];
        let idx = 2;
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                sets.push(`${key} = $${idx++}`);
                params.push(key === 'target_patient_types' && value !== null ? JSON.stringify(value) : value);
            }
        }
        const sql = `UPDATE service_bundles SET ${sets.join(', ')} WHERE bundle_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết bundle kèm items */
    static async getBundleById(bundleId: string): Promise<ServiceBundle | null> {
        const bundleSql = `
            SELECT sb.*, up.full_name as created_by_name, f.name as facility_name
            FROM service_bundles sb
            LEFT JOIN user_profiles up ON sb.created_by = up.user_id
            LEFT JOIN facilities f ON sb.facility_id = f.facilities_id
            WHERE sb.bundle_id = $1
        `;
        const bundleResult = await pool.query(bundleSql, [bundleId]);
        if (bundleResult.rows.length === 0) return null;

        const itemsSql = `
            SELECT sbi.*, fs.service_id,
                   s.name as service_name, s.code as service_code
            FROM service_bundle_items sbi
            JOIN facility_services fs ON sbi.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            WHERE sbi.bundle_id = $1
        `;
        const itemsResult = await pool.query(itemsSql, [bundleId]);
        const bundle = bundleResult.rows[0];
        bundle.items = itemsResult.rows;
        return bundle;
    }

    /** Danh sách bundles */
    static async getBundles(
        isActive?: boolean, facilityId?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<ServiceBundle>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (isActive !== undefined) { conditions.push(`sb.is_active = $${idx++}`); params.push(isActive); }
        if (facilityId) { conditions.push(`sb.facility_id = $${idx++}`); params.push(facilityId); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const countResult = await pool.query(`SELECT COUNT(*) as total FROM service_bundles sb ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT sb.*, up.full_name as created_by_name
            FROM service_bundles sb
            LEFT JOIN user_profiles up ON sb.created_by = up.user_id
            ${where}
            ORDER BY sb.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);
        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Lấy unit_price từ facility_services */
    static async getFacilityServicePrice(facilityServiceId: string): Promise<any | null> {
        const sql = `
            SELECT fs.*, s.name as service_name, s.code as service_code
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            WHERE fs.facility_services_id = $1
        `;
        const result = await pool.query(sql, [facilityServiceId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Soft delete bundle */
    static async softDeleteBundle(bundleId: string): Promise<void> {
        await pool.query(`UPDATE service_bundles SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE bundle_id = $1`, [bundleId]);
    }

    // ═══════════════════════════════════════════════════
    // PROMOTIONS OVERVIEW
    // ═══════════════════════════════════════════════════

    /** Active discounts + vouchers + bundles */
    static async getActivePromotions(facilityId?: string): Promise<any> {
        const facFilter = facilityId ? 'AND (facility_id = $1 OR facility_id IS NULL)' : '';
        const params = facilityId ? [facilityId] : [];

        const [discounts, vouchers, bundles] = await Promise.all([
            pool.query(`SELECT * FROM discount_policies WHERE is_active = TRUE AND effective_from <= CURRENT_DATE AND (effective_to IS NULL OR effective_to >= CURRENT_DATE) ${facFilter} ORDER BY priority DESC`, params),
            pool.query(`SELECT *, CASE WHEN max_usage IS NOT NULL THEN max_usage - current_usage ELSE NULL END as remaining_usage FROM vouchers WHERE is_active = TRUE AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE) ${facFilter}`, params),
            pool.query(`SELECT * FROM service_bundles WHERE is_active = TRUE AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE) ${facFilter}`, params),
        ]);
        return {
            discounts: discounts.rows,
            vouchers: vouchers.rows,
            bundles: bundles.rows,
            total_active: discounts.rows.length + vouchers.rows.length + bundles.rows.length,
        };
    }

    /** Lấy invoice */
    static async getInvoiceById(invoiceId: string): Promise<any | null> {
        const sql = `SELECT * FROM invoices WHERE invoices_id = $1`;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Cập nhật discount_amount trên invoice */
    static async updateInvoiceDiscount(invoiceId: string, discountAmount: number, client: PoolClient): Promise<void> {
        await client.query(
            `UPDATE invoices SET 
                discount_amount = $2,
                net_amount = total_amount - $2 - insurance_amount,
                updated_at = CURRENT_TIMESTAMP
             WHERE invoices_id = $1`,
            [invoiceId, discountAmount]
        );
    }
}
