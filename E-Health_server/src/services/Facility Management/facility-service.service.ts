import { randomUUID } from 'crypto';
import { FacilityServiceRepository } from '../../repository/Facility Management/facility-service.repository';
import { ServiceRepository } from '../../repository/Facility Management/service.repository';
import {
    FacilityService,
    CreateFacilityServiceInput,
    UpdateFacilityServiceInput,
    PaginatedFacilityServices
} from '../../models/Facility Management/facility-service.model';
import {
    FACILITY_SERVICE_ERRORS,
    SERVICE_ERRORS,
    SERVICE_CONFIG
} from '../../constants/medical-service.constant';

import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class FacilityServiceLogic {
    /**
     * Tạo ID chuẩn cho record Facility Service
     */
    private static generateFacilityServiceId(): string {
        return `FSRV_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /**
     * Lấy danh sách dịch vụ tại cơ sở
     */
    static async getFacilityServices(
        facilityId: string,
        departmentId?: string,
        search?: string,
        isActive?: boolean,
        page: number = SERVICE_CONFIG.DEFAULT_PAGE,
        limit: number = SERVICE_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedFacilityServices> {
        const safeLimit = Math.min(limit, SERVICE_CONFIG.MAX_LIMIT);
        return await FacilityServiceRepository.getFacilityServices(facilityId, departmentId, search, isActive, page, safeLimit);
    }

    /**
     * Lấy danh sách dịch vụ đang ACTIVE tại cơ sở (Dùng cho dropdown Bác sĩ)
     */
    static async getActiveFacilityServices(
        facilityId: string,
        departmentId?: string,
        search?: string
    ): Promise<FacilityService[]> {
        return await FacilityServiceRepository.getActiveFacilityServices(facilityId, departmentId, search);
    }

    /**
     * Lấy chi tiết cấu hình dịch vụ tại cơ sở
     */
    static async getFacilityServiceById(id: string): Promise<FacilityService> {
        const fsrv = await FacilityServiceRepository.getFacilityServiceById(id);
        if (!fsrv) {
            throw FACILITY_SERVICE_ERRORS.NOT_FOUND;
        }
        return fsrv;
    }

    /**
     * Tạo mới cấu hình dịch vụ cho cơ sở
     */
    static async createFacilityService(input: CreateFacilityServiceInput): Promise<FacilityService> {
        // Kiểm tra Facility
        const facilityExists = await FacilityServiceRepository.checkFacilityExists(input.facility_id);
        if (!facilityExists) {
            throw FACILITY_SERVICE_ERRORS.FACILITY_NOT_FOUND;
        }

        // Kiểm tra Master Service
        const service = await ServiceRepository.getServiceById(input.service_id);
        if (!service) {
            throw SERVICE_ERRORS.NOT_FOUND;
        }

        // Kiểm tra Department
        if (input.department_id) {
            const deptBelongs = await FacilityServiceRepository.checkDepartmentBelongsToFacility(input.department_id, input.facility_id);
            if (!deptBelongs) {
                throw FACILITY_SERVICE_ERRORS.DEPARTMENT_NOT_FOUND;
            }
        }

        // Kiểm tra trùng lặp
        const existing = await FacilityServiceRepository.checkFacilityServiceExists(input.facility_id, input.service_id);
        if (existing) {
            throw FACILITY_SERVICE_ERRORS.ALREADY_EXISTS;
        }

        const newId = this.generateFacilityServiceId();

        return await FacilityServiceRepository.createFacilityService(newId, input);
    }

    /**
     * Cập nhật thông tin dịch vụ cơ sở
     */
    static async updateFacilityService(id: string, input: UpdateFacilityServiceInput): Promise<FacilityService> {
        const fsrv = await this.getFacilityServiceById(id);

        if (input.department_id && input.department_id !== fsrv.department_id) {
            const deptBelongs = await FacilityServiceRepository.checkDepartmentBelongsToFacility(input.department_id, fsrv.facility_id);
            if (!deptBelongs) {
                throw FACILITY_SERVICE_ERRORS.DEPARTMENT_NOT_FOUND;
            }
        }

        return await FacilityServiceRepository.updateFacilityService(id, input);
    }

    /**
     * Khóa/Mở khóa dịch vụ tại cơ sở
     */
    static async toggleFacilityServiceStatus(id: string, is_active: boolean): Promise<FacilityService> {
        await this.getFacilityServiceById(id);
        return await FacilityServiceRepository.toggleFacilityServiceStatus(id, is_active);
    }

    /**
     * Xuất dữ liệu dịch vụ cơ sở ra file Excel
     */
    static async exportFacilityServices(facilityId: string): Promise<Buffer> {
        const services = await FacilityServiceRepository.getAllFacilityServices(facilityId);

        const columns: ExcelColumn[] = [
            { header: 'Mã Dịch Vụ Chuẩn (*)', key: 'service_code', width: 25 },
            { header: 'Tên Dịch Vụ Chuẩn (*)', key: 'service_name', width: 50 },
            { header: 'Giá Cơ Bản (VNĐ) (*)', key: 'base_price', width: 25 },
            { header: 'Giá BHYT (VNĐ)', key: 'insurance_price', width: 25 },
            { header: 'Giá VIP (VNĐ)', key: 'vip_price', width: 25 },
            { header: 'Thời Gian Ước Tính (Phút)', key: 'estimated_duration_minutes', width: 30 },
            { header: 'Kích Hoạt (TRUE/FALSE)', key: 'is_active', width: 25 }
        ];

        return await ExcelUtil.generateExcelBuffer(services, columns, 'Facility Services');
    }

    /**
     * Import dữ liệu dịch vụ cơ sở từ file Excel
     */
    static async importFacilityServices(facilityId: string, buffer: Buffer): Promise<any> {
        const facilityExists = await FacilityServiceRepository.checkFacilityExists(facilityId);
        if (!facilityExists) {
            throw FACILITY_SERVICE_ERRORS.FACILITY_NOT_FOUND;
        }

        const columnMapping = {
            'Mã Dịch Vụ Chuẩn (*)': 'service_code',
            'Tên Dịch Vụ Chuẩn (*)': 'service_name',
            'Giá Cơ Bản (VNĐ) (*)': 'base_price',
            'Giá BHYT (VNĐ)': 'insurance_price',
            'Giá VIP (VNĐ)': 'vip_price',
            'Thời Gian Ước Tính (Phút)': 'estimated_duration_minutes',
            'Kích Hoạt (TRUE/FALSE)': 'is_active'
        };

        const data = await ExcelUtil.parseExcelBuffer<any>(buffer, columnMapping);

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: any[] = [];

        const masterServices = await ServiceRepository.getAllServices();
        const serviceMap = new Map();
        for (const s of masterServices) {
            serviceMap.set(s.code, s.services_id);
        }

        for (const row of data) {
            try {
                if (!row.service_code || row.base_price === undefined || row.base_price === null) {
                    throw new Error('Thiếu Mã Dịch Vụ Chuẩn hoặc Giá Cơ Bản');
                }

                const serviceId = serviceMap.get(String(row.service_code));
                if (!serviceId) {
                    throw new Error(`Không tìm thấy Mã Dịch Vụ Chuẩn: ${row.service_code}`);
                }

                const parseBoolean = (val: any, defaultVal: boolean) => {
                    if (val === undefined || val === null || val === '') return defaultVal;
                    if (typeof val === 'string') return val.toUpperCase() === 'TRUE';
                    return Boolean(val);
                };

                const parseNumber = (val: any, defaultVal: number | null = null) => {
                    if (val === undefined || val === null || val === '') return defaultVal;
                    const num = Number(val);
                    return isNaN(num) ? defaultVal : num;
                };

                const input: CreateFacilityServiceInput = {
                    facility_id: facilityId,
                    service_id: serviceId,
                    department_id: undefined,
                    base_price: parseNumber(row.base_price, 0) as number,
                    insurance_price: parseNumber(row.insurance_price, undefined) as number | undefined,
                    vip_price: parseNumber(row.vip_price, 0) as number | undefined,
                    estimated_duration_minutes: parseNumber(row.estimated_duration_minutes, 15) as number | undefined,
                    is_active: parseBoolean(row.is_active, true)
                };

                const existing = await FacilityServiceRepository.checkFacilityServiceExists(facilityId, serviceId);
                const id = this.generateFacilityServiceId();

                await FacilityServiceRepository.upsertFacilityService(id, input);

                if (existing) {
                    updated++;
                } else {
                    inserted++;
                }
            } catch (error: any) {
                failed++;
                errors.push({
                    row: row._row,
                    error: error.message || 'Lỗi không xác định'
                });
            }
        }

        return {
            total_rows_processed: data.length,
            inserted,
            updated,
            failed,
            errors
        };
    }
}
