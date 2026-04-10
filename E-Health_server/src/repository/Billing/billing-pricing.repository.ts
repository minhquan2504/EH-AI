import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    ServicePricePolicy,
    FacilityServiceSpecialtyPrice,
    ServicePriceHistory,
    CreatePricePolicyInput,
    UpdatePricePolicyInput,
    CreateSpecialtyPriceInput,
    UpdateSpecialtyPriceInput,
    PaginatedResult,
    PricingSummary,
    PriceComparison,
} from '../../models/Billing/billing-pricing.model';

export class BillingPricingRepository {

    // PRICE POLICIES (Chính sách giá theo đối tượng)
    // 

    /**
     * Lấy danh sách chính sách giá của 1 dịch vụ cơ sở
     */
    static async getPoliciesByFacilityService(
        facilityServiceId: string,
        patientType?: string,
        isActive?: boolean,
        effectiveDate?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<ServicePricePolicy>> {
        const conditions: string[] = ['spp.facility_service_id = $1'];
        const params: any[] = [facilityServiceId];
        let paramIdx = 2;

        if (patientType) {
            conditions.push(`spp.patient_type = $${paramIdx}`);
            params.push(patientType);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`spp.is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        if (effectiveDate) {
            conditions.push(`spp.effective_from <= $${paramIdx}`);
            conditions.push(`(spp.effective_to IS NULL OR spp.effective_to >= $${paramIdx})`);
            params.push(effectiveDate);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM service_price_policies spp ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                spp.*,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                up.full_name AS created_by_name
            FROM service_price_policies spp
            JOIN facility_services fs ON spp.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN user_profiles up ON spp.created_by = up.user_id
            ${whereClause}
            ORDER BY spp.patient_type ASC, spp.effective_from DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết 1 chính sách giá
     */
    static async getPolicyById(policyId: string): Promise<ServicePricePolicy | null> {
        const query = `
            SELECT
                spp.*,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                up.full_name AS created_by_name
            FROM service_price_policies spp
            JOIN facility_services fs ON spp.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN user_profiles up ON spp.created_by = up.user_id
            WHERE spp.policy_id = $1
        `;
        const result = await pool.query(query, [policyId]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra trùng chính sách giá
     */
    static async checkPolicyDuplicate(
        facilityServiceId: string,
        patientType: string,
        effectiveFrom: string,
        excludePolicyId?: string
    ): Promise<boolean> {
        let query = `
            SELECT 1 FROM service_price_policies
            WHERE facility_service_id = $1 AND patient_type = $2 AND effective_from = $3
        `;
        const params: any[] = [facilityServiceId, patientType, effectiveFrom];

        if (excludePolicyId) {
            query += ` AND policy_id != $4`;
            params.push(excludePolicyId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo mới chính sách giá
     */
    static async createPolicy(
        policyId: string,
        input: CreatePricePolicyInput,
        createdBy: string,
        client?: PoolClient
    ): Promise<ServicePricePolicy> {
        const queryRunner = client || pool;
        const query = `
            INSERT INTO service_price_policies (
                policy_id, facility_service_id, patient_type, price, currency,
                description, effective_from, effective_to, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
            RETURNING *
        `;
        await queryRunner.query(query, [
            policyId,
            input.facility_service_id,
            input.patient_type,
            input.price,
            input.currency || 'VND',
            input.description || null,
            input.effective_from,
            input.effective_to || null,
            createdBy,
        ]);

        if (client) {
            return { policy_id: policyId } as ServicePricePolicy;
        }
        return (await this.getPolicyById(policyId)) as ServicePricePolicy;
    }

    /**
     * Cập nhật chính sách giá
     */
    static async updatePolicy(policyId: string, input: UpdatePricePolicyInput): Promise<ServicePricePolicy> {
        const updates: string[] = [];
        const params: any[] = [policyId];
        let paramIdx = 2;

        const fields: (keyof Omit<UpdatePricePolicyInput, 'reason'>)[] = [
            'patient_type', 'price', 'description', 'effective_from', 'effective_to', 'is_active'
        ];

        fields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length <= 1) {
            return (await this.getPolicyById(policyId)) as ServicePricePolicy;
        }

        const query = `
            UPDATE service_price_policies
            SET ${updates.join(', ')}
            WHERE policy_id = $1
        `;
        await pool.query(query, params);
        return (await this.getPolicyById(policyId)) as ServicePricePolicy;
    }

    /**
     * Soft delete chính sách giá
     */
    static async deactivatePolicy(policyId: string): Promise<ServicePricePolicy> {
        const query = `
            UPDATE service_price_policies
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE policy_id = $1
        `;
        await pool.query(query, [policyId]);
        return (await this.getPolicyById(policyId)) as ServicePricePolicy;
    }

    // SPECIALTY PRICES (Giá theo chuyên khoa)

    /**
     * Lấy danh sách giá chuyên khoa theo dịch vụ cơ sở
     */
    static async getSpecialtyPricesByFacilityService(
        facilityServiceId: string,
        specialtyId?: string,
        patientType?: string,
        isActive?: boolean
    ): Promise<FacilityServiceSpecialtyPrice[]> {
        const conditions: string[] = ['fssp.facility_service_id = $1'];
        const params: any[] = [facilityServiceId];
        let paramIdx = 2;

        if (specialtyId) {
            conditions.push(`fssp.specialty_id = $${paramIdx}`);
            params.push(specialtyId);
            paramIdx++;
        }

        if (patientType) {
            conditions.push(`fssp.patient_type = $${paramIdx}`);
            params.push(patientType);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`fssp.is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const query = `
            SELECT
                fssp.*,
                s.code AS service_code,
                s.name AS service_name,
                sp.code AS specialty_code,
                sp.name AS specialty_name,
                up.full_name AS created_by_name
            FROM facility_service_specialty_prices fssp
            JOIN facility_services fs ON fssp.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            JOIN specialties sp ON fssp.specialty_id = sp.specialties_id
            LEFT JOIN user_profiles up ON fssp.created_by = up.user_id
            ${whereClause}
            ORDER BY sp.name ASC, fssp.patient_type ASC
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy chi tiết 1 giá chuyên khoa
     */
    static async getSpecialtyPriceById(specialtyPriceId: string): Promise<FacilityServiceSpecialtyPrice | null> {
        const query = `
            SELECT
                fssp.*,
                s.code AS service_code,
                s.name AS service_name,
                sp.code AS specialty_code,
                sp.name AS specialty_name,
                up.full_name AS created_by_name
            FROM facility_service_specialty_prices fssp
            JOIN facility_services fs ON fssp.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            JOIN specialties sp ON fssp.specialty_id = sp.specialties_id
            LEFT JOIN user_profiles up ON fssp.created_by = up.user_id
            WHERE fssp.specialty_price_id = $1
        `;
        const result = await pool.query(query, [specialtyPriceId]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra trùng giá chuyên khoa
     */
    static async checkSpecialtyPriceDuplicate(
        facilityServiceId: string,
        specialtyId: string,
        patientType: string,
        effectiveFrom: string,
        excludeId?: string
    ): Promise<boolean> {
        let query = `
            SELECT 1 FROM facility_service_specialty_prices
            WHERE facility_service_id = $1 AND specialty_id = $2
              AND patient_type = $3 AND effective_from = $4
        `;
        const params: any[] = [facilityServiceId, specialtyId, patientType, effectiveFrom];

        if (excludeId) {
            query += ` AND specialty_price_id != $5`;
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo giá chuyên khoa
     */
    static async createSpecialtyPrice(
        id: string,
        input: CreateSpecialtyPriceInput,
        createdBy: string
    ): Promise<FacilityServiceSpecialtyPrice> {
        const query = `
            INSERT INTO facility_service_specialty_prices (
                specialty_price_id, facility_service_id, specialty_id, patient_type,
                price, effective_from, effective_to, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
        `;
        await pool.query(query, [
            id,
            input.facility_service_id,
            input.specialty_id,
            input.patient_type || 'STANDARD',
            input.price,
            input.effective_from,
            input.effective_to || null,
            createdBy,
        ]);
        return (await this.getSpecialtyPriceById(id)) as FacilityServiceSpecialtyPrice;
    }

    /**
     * Cập nhật giá chuyên khoa
     */
    static async updateSpecialtyPrice(
        id: string,
        input: UpdateSpecialtyPriceInput
    ): Promise<FacilityServiceSpecialtyPrice> {
        const updates: string[] = [];
        const params: any[] = [id];
        let paramIdx = 2;

        const fields: (keyof Omit<UpdateSpecialtyPriceInput, 'reason'>)[] = [
            'patient_type', 'price', 'effective_from', 'effective_to', 'is_active'
        ];

        fields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        });

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length <= 1) {
            return (await this.getSpecialtyPriceById(id)) as FacilityServiceSpecialtyPrice;
        }

        const query = `
            UPDATE facility_service_specialty_prices
            SET ${updates.join(', ')}
            WHERE specialty_price_id = $1
        `;
        await pool.query(query, params);
        return (await this.getSpecialtyPriceById(id)) as FacilityServiceSpecialtyPrice;
    }

    /**
     * Soft delete giá chuyên khoa
     */
    static async deactivateSpecialtyPrice(id: string): Promise<FacilityServiceSpecialtyPrice> {
        const query = `
            UPDATE facility_service_specialty_prices
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE specialty_price_id = $1
        `;
        await pool.query(query, [id]);
        return (await this.getSpecialtyPriceById(id)) as FacilityServiceSpecialtyPrice;
    }

    // PRICE HISTORY (Lịch sử thay đổi giá)

    /**
     * Ghi lịch sử thay đổi giá
     */
    static async createHistory(
        historyId: string,
        data: {
            facility_service_id: string;
            change_type: string;
            change_source: string;
            reference_id: string;
            patient_type?: string;
            specialty_id?: string;
            old_price?: number;
            new_price?: number;
            old_effective_from?: string;
            new_effective_from?: string;
            old_effective_to?: string | null;
            new_effective_to?: string | null;
            reason?: string;
            changed_by: string;
        },
        client?: PoolClient
    ): Promise<void> {
        const queryRunner = client || pool;
        const query = `
            INSERT INTO service_price_history (
                history_id, facility_service_id, change_type, change_source,
                reference_id, patient_type, specialty_id,
                old_price, new_price,
                old_effective_from, new_effective_from,
                old_effective_to, new_effective_to,
                reason, changed_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        await queryRunner.query(query, [
            historyId,
            data.facility_service_id,
            data.change_type,
            data.change_source,
            data.reference_id,
            data.patient_type || null,
            data.specialty_id || null,
            data.old_price ?? null,
            data.new_price ?? null,
            data.old_effective_from || null,
            data.new_effective_from || null,
            data.old_effective_to ?? null,
            data.new_effective_to ?? null,
            data.reason || null,
            data.changed_by,
        ]);
    }

    /**
     * Lấy lịch sử giá theo dịch vụ cơ sở
     */
    static async getHistoryByFacilityService(
        facilityServiceId: string,
        changeType?: string,
        changeSource?: string,
        dateFrom?: string,
        dateTo?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<ServicePriceHistory>> {
        const conditions: string[] = ['sph.facility_service_id = $1'];
        const params: any[] = [facilityServiceId];
        let paramIdx = 2;

        if (changeType) {
            conditions.push(`sph.change_type = $${paramIdx}`);
            params.push(changeType);
            paramIdx++;
        }

        if (changeSource) {
            conditions.push(`sph.change_source = $${paramIdx}`);
            params.push(changeSource);
            paramIdx++;
        }

        if (dateFrom) {
            conditions.push(`sph.changed_at >= $${paramIdx}`);
            params.push(dateFrom);
            paramIdx++;
        }

        if (dateTo) {
            conditions.push(`sph.changed_at <= $${paramIdx}`);
            params.push(dateTo);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM service_price_history sph ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                sph.*,
                s.code AS service_code,
                s.name AS service_name,
                up.full_name AS changed_by_name,
                sp.name AS specialty_name
            FROM service_price_history sph
            JOIN facility_services fs ON sph.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN user_profiles up ON sph.changed_by = up.user_id
            LEFT JOIN specialties sp ON sph.specialty_id = sp.specialties_id
            ${whereClause}
            ORDER BY sph.changed_at DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy lịch sử giá theo toàn cơ sở
     */
    static async getHistoryByFacility(
        facilityId: string,
        changeType?: string,
        changeSource?: string,
        dateFrom?: string,
        dateTo?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<ServicePriceHistory>> {
        const conditions: string[] = ['fs.facility_id = $1'];
        const params: any[] = [facilityId];
        let paramIdx = 2;

        if (changeType) {
            conditions.push(`sph.change_type = $${paramIdx}`);
            params.push(changeType);
            paramIdx++;
        }

        if (changeSource) {
            conditions.push(`sph.change_source = $${paramIdx}`);
            params.push(changeSource);
            paramIdx++;
        }

        if (dateFrom) {
            conditions.push(`sph.changed_at >= $${paramIdx}`);
            params.push(dateFrom);
            paramIdx++;
        }

        if (dateTo) {
            conditions.push(`sph.changed_at <= $${paramIdx}`);
            params.push(dateTo);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*) 
            FROM service_price_history sph 
            JOIN facility_services fs ON sph.facility_service_id = fs.facility_services_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                sph.*,
                s.code AS service_code,
                s.name AS service_name,
                up.full_name AS changed_by_name,
                sp.name AS specialty_name
            FROM service_price_history sph
            JOIN facility_services fs ON sph.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN user_profiles up ON sph.changed_by = up.user_id
            LEFT JOIN specialties sp ON sph.specialty_id = sp.specialties_id
            ${whereClause}
            ORDER BY sph.changed_at DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // CATALOG & RESOLVE (Danh mục & Tra cứu giá)

    /**
     * Danh mục dịch vụ chuẩn (view tổng hợp cho module Billing)
     */
    static async getServiceCatalog(
        serviceGroup?: string,
        serviceType?: string,
        search?: string,
        isActive?: boolean,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<any>> {
        const conditions: string[] = ['s.deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (serviceGroup) {
            conditions.push(`s.service_group = $${paramIdx}`);
            params.push(serviceGroup);
            paramIdx++;
        }

        if (serviceType) {
            conditions.push(`s.service_type = $${paramIdx}`);
            params.push(serviceType);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        if (isActive !== undefined) {
            conditions.push(`s.is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM services s ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                s.services_id,
                s.code,
                s.name,
                s.service_group,
                s.service_type,
                s.insurance_code,
                s.description,
                s.is_active,
                sc.name AS category_name,
                (SELECT COUNT(*) FROM facility_services fs WHERE fs.service_id = s.services_id) AS facility_count
            FROM services s
            LEFT JOIN service_categories sc ON sc.service_categories_id = s.services_id
            ${whereClause}
            ORDER BY s.service_group ASC, s.name ASC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Bảng giá tổng hợp tại 1 cơ sở
     */
    static async getFacilityPriceCatalog(
        facilityId: string,
        serviceGroup?: string,
        departmentId?: string,
        patientType?: string,
        search?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<any>> {
        const conditions: string[] = ['fs.facility_id = $1', 's.deleted_at IS NULL'];
        const params: any[] = [facilityId];
        let paramIdx = 2;

        if (serviceGroup) {
            conditions.push(`s.service_group = $${paramIdx}`);
            params.push(serviceGroup);
            paramIdx++;
        }

        if (departmentId) {
            conditions.push(`fs.department_id = $${paramIdx}`);
            params.push(departmentId);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(*)
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        /* Sub-query: lấy tất cả policy đang hiệu lực của mỗi facility_service */
        const policyFilter = patientType
            ? `AND spp.patient_type = $${paramIdx}`
            : '';
        if (patientType) {
            params.push(patientType);
            paramIdx++;
        }

        const dataQuery = `
            SELECT
                fs.facility_services_id,
                fs.facility_id,
                fs.service_id,
                fs.department_id,
                fs.base_price,
                fs.insurance_price,
                fs.vip_price,
                fs.estimated_duration_minutes,
                fs.is_active,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                s.service_type,
                d.name AS department_name,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'policy_id', spp.policy_id,
                        'patient_type', spp.patient_type,
                        'price', spp.price,
                        'effective_from', spp.effective_from,
                        'effective_to', spp.effective_to,
                        'description', spp.description
                    ) ORDER BY spp.patient_type)
                    FROM service_price_policies spp
                    WHERE spp.facility_service_id = fs.facility_services_id
                      AND spp.is_active = TRUE
                      AND spp.effective_from <= CURRENT_DATE
                      AND (spp.effective_to IS NULL OR spp.effective_to >= CURRENT_DATE)
                      ${policyFilter}
                    ), '[]'::json
                ) AS price_policies
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN departments d ON fs.department_id = d.departments_id
            ${whereClause}
            ORDER BY s.service_group ASC, s.name ASC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Tra cứu giá cuối cùng qua chuỗi ưu tiên (Priority Chain)
     * 1. Giá chuyên khoa (nếu có specialtyId)
     * 2. Chính sách giá theo đối tượng
     * 3. Fallback giá cứng trong facility_services
     */
    static async resolvePrice(
        facilityServiceId: string,
        patientType: string,
        specialtyId?: string,
        referenceDate?: string
    ): Promise<{ price: string; source: string; sourceId: string | null } | null> {
        const refDate = referenceDate || new Date().toISOString().split('T')[0];

        /* Bước 1: Tra giá chuyên khoa */
        if (specialtyId) {
            const spQuery = `
                SELECT specialty_price_id, price
                FROM facility_service_specialty_prices
                WHERE facility_service_id = $1 AND specialty_id = $2 AND patient_type = $3
                  AND is_active = TRUE
                  AND effective_from <= $4
                  AND (effective_to IS NULL OR effective_to >= $4)
                ORDER BY effective_from DESC
                LIMIT 1
            `;
            const spResult = await pool.query(spQuery, [facilityServiceId, specialtyId, patientType, refDate]);
            if (spResult.rows.length > 0) {
                return {
                    price: spResult.rows[0].price,
                    source: 'SPECIALTY_PRICE',
                    sourceId: spResult.rows[0].specialty_price_id,
                };
            }
        }

        /* Bước 2: Tra chính sách giá theo đối tượng */
        const policyQuery = `
            SELECT policy_id, price
            FROM service_price_policies
            WHERE facility_service_id = $1 AND patient_type = $2
              AND is_active = TRUE
              AND effective_from <= $3
              AND (effective_to IS NULL OR effective_to >= $3)
            ORDER BY effective_from DESC
            LIMIT 1
        `;
        const policyResult = await pool.query(policyQuery, [facilityServiceId, patientType, refDate]);
        if (policyResult.rows.length > 0) {
            return {
                price: policyResult.rows[0].price,
                source: 'PRICE_POLICY',
                sourceId: policyResult.rows[0].policy_id,
            };
        }

        /* Bước 3: Fallback giá cứng facility_services */
        const fsQuery = `
            SELECT base_price, insurance_price, vip_price
            FROM facility_services
            WHERE facility_services_id = $1
        `;
        const fsResult = await pool.query(fsQuery, [facilityServiceId]);
        if (fsResult.rows.length > 0) {
            const row = fsResult.rows[0];
            let fallbackPrice = row.base_price;
            if (patientType === 'INSURANCE' && row.insurance_price) {
                fallbackPrice = row.insurance_price;
            } else if (patientType === 'VIP' && row.vip_price) {
                fallbackPrice = row.vip_price;
            }
            return {
                price: fallbackPrice,
                source: 'FACILITY_SERVICE',
                sourceId: null,
            };
        }

        return null;
    }

    // STATISTICS & COMPARISON (Thống kê & So sánh)

    /**
     * Thống kê bảng giá cơ sở
     */
    static async getPricingSummary(facilityId: string, warningDays: number = 30): Promise<PricingSummary> {
        const summaryQuery = `
            SELECT
                COUNT(DISTINCT fs.facility_services_id) AS total_services,
                COUNT(DISTINCT spp.policy_id) AS total_policies,
                COALESCE(MIN(fs.base_price), 0) AS min_price,
                COALESCE(MAX(fs.base_price), 0) AS max_price,
                COALESCE(ROUND(AVG(fs.base_price), 0), 0) AS avg_price,
                COUNT(DISTINCT CASE WHEN fs.insurance_price IS NOT NULL AND fs.insurance_price > 0 THEN fs.facility_services_id END) AS services_with_insurance,
                COUNT(DISTINCT CASE WHEN spp.policy_id IS NULL THEN fs.facility_services_id END) AS services_without_policy,
                COUNT(DISTINCT CASE 
                    WHEN spp.effective_to IS NOT NULL 
                     AND spp.effective_to BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($2 || ' days')::INTERVAL)
                     AND spp.is_active = TRUE
                    THEN spp.policy_id 
                END) AS expiring_policies_count
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id AND s.deleted_at IS NULL
            LEFT JOIN service_price_policies spp ON spp.facility_service_id = fs.facility_services_id
            WHERE fs.facility_id = $1
        `;
        const result = await pool.query(summaryQuery, [facilityId, warningDays]);
        return result.rows[0];
    }

    /**
     * Chính sách giá sắp hết hạn
     */
    static async getExpiringPolicies(
        facilityId: string,
        warningDays: number = 30,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<ServicePricePolicy>> {
        const offset = (page - 1) * limit;

        const conditions = `
            WHERE fs.facility_id = $1
              AND spp.is_active = TRUE
              AND spp.effective_to IS NOT NULL
              AND spp.effective_to BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($2 || ' days')::INTERVAL)
        `;

        const countQuery = `
            SELECT COUNT(*)
            FROM service_price_policies spp
            JOIN facility_services fs ON spp.facility_service_id = fs.facility_services_id
            ${conditions}
        `;
        const countResult = await pool.query(countQuery, [facilityId, warningDays]);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                spp.*,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                up.full_name AS created_by_name
            FROM service_price_policies spp
            JOIN facility_services fs ON spp.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN user_profiles up ON spp.created_by = up.user_id
            ${conditions}
            ORDER BY spp.effective_to ASC
            LIMIT $3 OFFSET $4
        `;
        const dataResult = await pool.query(dataQuery, [facilityId, warningDays, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * So sánh giá liên cơ sở cho 1 dịch vụ chuẩn
     */
    static async comparePriceAcrossFacilities(
        serviceId: string,
        patientType: string = 'STANDARD'
    ): Promise<PriceComparison[]> {
        const query = `
            SELECT
                f.facilities_id AS facility_id,
                f.name AS facility_name,
                COALESCE(
                    (SELECT spp.price
                     FROM service_price_policies spp
                     WHERE spp.facility_service_id = fs.facility_services_id
                       AND spp.patient_type = $2
                       AND spp.is_active = TRUE
                       AND spp.effective_from <= CURRENT_DATE
                       AND (spp.effective_to IS NULL OR spp.effective_to >= CURRENT_DATE)
                     ORDER BY spp.effective_from DESC
                     LIMIT 1),
                    CASE
                        WHEN $2 = 'INSURANCE' THEN fs.insurance_price
                        WHEN $2 = 'VIP' THEN fs.vip_price
                        ELSE fs.base_price
                    END
                ) AS price,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM service_price_policies spp
                        WHERE spp.facility_service_id = fs.facility_services_id
                          AND spp.patient_type = $2
                          AND spp.is_active = TRUE
                          AND spp.effective_from <= CURRENT_DATE
                          AND (spp.effective_to IS NULL OR spp.effective_to >= CURRENT_DATE)
                    ) THEN 'PRICE_POLICY'
                    ELSE 'FACILITY_SERVICE'
                END AS price_source,
                $2 AS patient_type
            FROM facility_services fs
            JOIN facilities f ON fs.facility_id = f.facilities_id AND f.deleted_at IS NULL
            JOIN services s ON fs.service_id = s.services_id AND s.deleted_at IS NULL
            WHERE fs.service_id = $1 AND fs.is_active = TRUE
            ORDER BY price ASC NULLS LAST
        `;
        const result = await pool.query(query, [serviceId, patientType]);
        return result.rows;
    }

    // HELPER CHECKS (Kiểm tra tồn tại)

    /** Kiểm tra facility_service có tồn tại */
    static async checkFacilityServiceExists(id: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM facility_services WHERE facility_services_id = $1`, [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra specialty có tồn tại */
    static async checkSpecialtyExists(id: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM specialties WHERE specialties_id = $1 AND deleted_at IS NULL`, [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra facility có tồn tại */
    static async checkFacilityExists(id: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM facilities WHERE facilities_id = $1 AND deleted_at IS NULL`, [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra service chuẩn có tồn tại */
    static async checkServiceExists(id: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM services WHERE services_id = $1 AND deleted_at IS NULL`, [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Lấy pool client cho transaction */
    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }
}
