import { randomUUID } from 'crypto';
import { ServiceRepository } from '../../repository/Facility Management/service.repository';
import {
    MasterService,
    CreateServiceInput,
    UpdateServiceInput,
    PaginatedServices
} from '../../models/Facility Management/service.model';
import {
    SERVICE_ERRORS,
    SERVICE_CONFIG
} from '../../constants/medical-service.constant';
import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class MasterServiceLogic {
    /**
     * Tạo ID chuẩn cho record Master Service
     */
    private static generateServiceId(): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `SRV_${datePart}_${randomUUID().substring(0, 10)}`;
    }

    /**
     * Lấy danh sách dịch vụ chuẩn TẤT CẢ (Quản trị)
     */
    static async getServices(
        search?: string,
        serviceGroup?: string,
        isActive?: boolean,
        page: number = SERVICE_CONFIG.DEFAULT_PAGE,
        limit: number = SERVICE_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedServices> {
        const safeLimit = Math.min(limit, SERVICE_CONFIG.MAX_LIMIT);
        return await ServiceRepository.getServices(search, serviceGroup, isActive, page, safeLimit);
    }

    /**
     * Lấy chi tiết dịch vụ chuẩn theo ID.
     */
    static async getServiceById(id: string): Promise<MasterService> {
        const service = await ServiceRepository.getServiceById(id);
        if (!service) {
            throw SERVICE_ERRORS.NOT_FOUND;
        }
        return service;
    }

    /**
     * Tạo mới dịch vụ chuẩn.
     */
    static async createService(input: CreateServiceInput): Promise<MasterService> {
        // Kiểm tra Code trùng
        const existingCode = await ServiceRepository.getServiceByCode(input.code);
        if (existingCode) {
            throw SERVICE_ERRORS.ALREADY_EXISTS;
        }

        const newId = this.generateServiceId();

        return await ServiceRepository.createService(newId, input);
    }

    /**
     * Cập nhật thông tin dịch vụ chuẩn.
     */
    static async updateService(id: string, input: UpdateServiceInput): Promise<MasterService> {
        await this.getServiceById(id);
        return await ServiceRepository.updateService(id, input);
    }

    /**
     * Khóa/Mở khóa dịch vụ
     */
    static async toggleServiceStatus(id: string, is_active: boolean): Promise<MasterService> {
        await this.getServiceById(id);
        return await ServiceRepository.toggleServiceStatus(id, is_active);
    }

    /**
     * Xóa mềm dịch vụ
     */
    static async deleteService(id: string): Promise<void> {
        await this.getServiceById(id);
        await ServiceRepository.deleteService(id);
    }

    /**
     * Xuất dữ liệu dịch vụ chuẩn ra file Excel
     */
    static async exportServices(): Promise<Buffer> {
        const services = await ServiceRepository.getAllServices();

        const columns: ExcelColumn[] = [
            { header: 'Mã Dịch Vụ (*)', key: 'code', width: 20 },
            { header: 'Tên Dịch Vụ (*)', key: 'name', width: 40 },
            { header: 'Nhóm Dịch Vụ', key: 'service_group', width: 25 },
            { header: 'Loại Dịch Vụ', key: 'service_type', width: 25 },
            { header: 'Mã BHYT', key: 'insurance_code', width: 25 },
            { header: 'Mô Tả', key: 'description', width: 50 },
            { header: 'Kích Hoạt (TRUE/FALSE)', key: 'is_active', width: 25 }
        ];

        return await ExcelUtil.generateExcelBuffer(services, columns, 'Master Services');
    }

    /**
     * Import dữ liệu dịch vụ chuẩn từ file Excel
     */
    static async importServices(buffer: Buffer): Promise<any> {
        const columnMapping = {
            'Mã Dịch Vụ (*)': 'code',
            'Tên Dịch Vụ (*)': 'name',
            'Nhóm Dịch Vụ': 'service_group',
            'Loại Dịch Vụ': 'service_type',
            'Mã BHYT': 'insurance_code',
            'Mô Tả': 'description',
            'Kích Hoạt (TRUE/FALSE)': 'is_active'
        };

        const data = await ExcelUtil.parseExcelBuffer<any>(buffer, columnMapping);

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const row of data) {
            try {
                if (!row.code || !row.name) {
                    throw new Error('Thiếu Mã Dịch Vụ hoặc Tên Dịch Vụ');
                }

                const parseBoolean = (val: any, defaultVal: boolean) => {
                    if (val === undefined || val === null || val === '') return defaultVal;
                    if (typeof val === 'string') return val.toUpperCase() === 'TRUE';
                    return Boolean(val);
                };

                const input: CreateServiceInput = {
                    code: String(row.code),
                    name: String(row.name),
                    service_group: row.service_group ? String(row.service_group) : undefined,
                    service_type: row.service_type ? String(row.service_type) : undefined,
                    insurance_code: row.insurance_code ? String(row.insurance_code) : undefined,
                    description: row.description ? String(row.description) : undefined,
                    is_active: parseBoolean(row.is_active, true)
                };

                const existing = await ServiceRepository.getServiceByCode(input.code);
                const id = existing ? existing.services_id : this.generateServiceId();

                await ServiceRepository.upsertService(id, input);

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
