import { randomUUID } from 'crypto';
import { DrugRepository } from '../../repository/Medication Management/drug.repository';
import { DrugCategoryRepository } from '../../repository/Medication Management/drug-category.repository';
import {
    CreateDrugInput,
    UpdateDrugInput,
    PaginatedDrugs,
    Drug
} from '../../models/Medication Management/drug.model';
import {
    DRUG_ERRORS,
    MEDICATION_CONFIG
} from '../../constants/medication.constant';
import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class DrugService {
    /**
     * Tạo ID chuẩn cho record Drug
     */
    private static generateDrugId(): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `DRG_${datePart}_${randomUUID().substring(0, 12)}`;
    }

    /**
     * Lấy danh sách thuốc TẤT CẢ 
     */
    static async getDrugsAdmin(
        search?: string,
        categoryId?: string,
        isActive?: boolean,
        isPrescriptionOnly?: boolean,
        page: number = MEDICATION_CONFIG.DEFAULT_PAGE,
        limit: number = MEDICATION_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedDrugs> {
        const safeLimit = Math.min(limit, MEDICATION_CONFIG.MAX_LIMIT);
        return await DrugRepository.getDrugsAdmin(search, categoryId, isActive, isPrescriptionOnly, page, safeLimit);
    }

    /**
     * Lấy danh sách thuốc ACTIVE cho Dropdown gợi ý
     */
    static async getActiveDrugs(search?: string): Promise<Drug[]> {
        return await DrugRepository.getActiveDrugs(search);
    }

    /**
     * Lấy chi tiết thuốc theo ID.
     */
    static async getDrugById(id: string): Promise<Drug> {
        const drug = await DrugRepository.getDrugById(id);
        if (!drug) {
            throw DRUG_ERRORS.NOT_FOUND;
        }
        return drug;
    }

    /**
     * Tạo mới thuốc.
     */
    static async createDrug(input: CreateDrugInput): Promise<Drug> {
        // Kiểm tra Category
        const category = await DrugCategoryRepository.getCategoryById(input.category_id);
        if (!category) {
            throw DRUG_ERRORS.CATEGORY_NOT_FOUND;
        }

        // Kiểm tra Drug Code trùng
        const existingCode = await DrugRepository.getDrugByCode(input.drug_code);
        if (existingCode) {
            throw DRUG_ERRORS.ALREADY_EXISTS;
        }

        // Kiểm tra National Drug Code trùng (nếu có)
        if (input.national_drug_code) {
            const existingNationalCode = await DrugRepository.getDrugByNationalCode(input.national_drug_code);
            if (existingNationalCode) {
                throw DRUG_ERRORS.NDC_ALREADY_EXISTS;
            }
        }

        const newId = this.generateDrugId();

        return await DrugRepository.createDrug(newId, input);
    }

    /**
     * Cập nhật thông tin thuốc.
     */
    static async updateDrug(id: string, input: UpdateDrugInput): Promise<Drug> {
        const drug = await this.getDrugById(id);

        // Kiểm tra Category mới có tồn tại ko nếu đổi category
        if (input.category_id && input.category_id !== drug.category_id) {
            const category = await DrugCategoryRepository.getCategoryById(input.category_id);
            if (!category) {
                throw DRUG_ERRORS.CATEGORY_NOT_FOUND;
            }
        }

        // Kiểm tra National Drug Code trùng
        if (input.national_drug_code && input.national_drug_code !== drug.national_drug_code) {
            const existingNationalCode = await DrugRepository.getDrugByNationalCode(input.national_drug_code);
            if (existingNationalCode) {
                throw DRUG_ERRORS.NDC_ALREADY_EXISTS;
            }
        }

        return await DrugRepository.updateDrug(id, input);
    }

    /**
     * Khóa/Mở khóa thuốc
     */
    static async toggleDrugStatus(id: string, is_active: boolean): Promise<Drug> {
        await this.getDrugById(id);

        return await DrugRepository.toggleDrugStatus(id, is_active);
    }

    /**
     * Xuất dữ liệu thuốc ra file Excel
     */
    static async exportDrugs(): Promise<Buffer> {
        const drugs = await DrugRepository.getAllDrugs();

        const categories = await DrugCategoryRepository.getAllCategories();
        const categoryMap = new Map();
        for (const cat of categories) {
            categoryMap.set(cat.drug_categories_id, cat.code);
        }

        const data = drugs.map(d => ({
            ...d,
            category_code: categoryMap.get(d.category_id) || d.category_id
        }));

        const columns: ExcelColumn[] = [
            { header: 'Mã Thuốc (*)', key: 'drug_code', width: 20 },
            { header: 'Mã Quốc Gia', key: 'national_drug_code', width: 20 },
            { header: 'Tên Thuốc (*)', key: 'brand_name', width: 40 },
            { header: 'Hoạt Chất (*)', key: 'active_ingredients', width: 40 },
            { header: 'Mã Nhóm Thuốc (*)', key: 'category_code', width: 25 },
            { header: 'Đường Dùng', key: 'route_of_administration', width: 20 },
            { header: 'Đơn Vị Đóng Gói (*)', key: 'dispensing_unit', width: 20 },
            { header: 'Thuốc Kê Đơn (TRUE/FALSE)', key: 'is_prescription_only', width: 25 },
            { header: 'Kích Hoạt (TRUE/FALSE)', key: 'is_active', width: 25 }
        ];

        return await ExcelUtil.generateExcelBuffer(data, columns, 'Drugs');
    }

    /**
     * Import dữ liệu thuốc từ file Excel
     */
    static async importDrugs(buffer: Buffer): Promise<any> {
        const columnMapping = {
            'Mã Thuốc (*)': 'drug_code',
            'Mã Quốc Gia': 'national_drug_code',
            'Tên Thuốc (*)': 'brand_name',
            'Hoạt Chất (*)': 'active_ingredients',
            'Mã Nhóm Thuốc (*)': 'category_code',
            'Đường Dùng': 'route_of_administration',
            'Đơn Vị Đóng Gói (*)': 'dispensing_unit',
            'Thuốc Kê Đơn (TRUE/FALSE)': 'is_prescription_only',
            'Kích Hoạt (TRUE/FALSE)': 'is_active'
        };

        const data = await ExcelUtil.parseExcelBuffer<any>(buffer, columnMapping);

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: any[] = [];

        const categories = await DrugCategoryRepository.getAllCategories();
        const categoryMap = new Map();
        for (const cat of categories) {
            categoryMap.set(cat.code, cat.drug_categories_id);
        }

        for (const row of data) {
            try {
                if (!row.drug_code || !row.brand_name || !row.active_ingredients || !row.category_code || !row.dispensing_unit) {
                    throw new Error('Thiếu các trường bắt buộc (*)');
                }

                const categoryId = categoryMap.get(String(row.category_code));
                if (!categoryId) {
                    throw new Error(`Không tìm thấy Mã Nhóm Thuốc: ${row.category_code}`);
                }

                const parseBoolean = (val: any, defaultVal: boolean) => {
                    if (val === undefined || val === null || val === '') return defaultVal;
                    if (typeof val === 'string') return val.toUpperCase() === 'TRUE';
                    return Boolean(val);
                };

                const input: CreateDrugInput = {
                    drug_code: String(row.drug_code),
                    national_drug_code: row.national_drug_code ? String(row.national_drug_code) : undefined,
                    brand_name: String(row.brand_name),
                    active_ingredients: String(row.active_ingredients),
                    category_id: categoryId,
                    route_of_administration: row.route_of_administration ? String(row.route_of_administration) : undefined,
                    dispensing_unit: String(row.dispensing_unit),
                    is_prescription_only: parseBoolean(row.is_prescription_only, true),
                    is_active: parseBoolean(row.is_active, true)
                };

                const existing = await DrugRepository.getDrugByCode(input.drug_code);
                const id = existing ? existing.drugs_id : this.generateDrugId();

                if (input.national_drug_code) {
                    const ndcExists = await DrugRepository.getDrugByNationalCode(input.national_drug_code);
                    if (ndcExists && ndcExists.drugs_id !== id) {
                        throw new Error(`Mã Quốc Gia ${input.national_drug_code} đã bị trùng với thuốc khác`);
                    }
                }

                await DrugRepository.upsertDrug(id, input);

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
