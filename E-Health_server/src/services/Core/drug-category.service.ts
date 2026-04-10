import { randomUUID } from 'crypto';
import { DrugCategoryRepository } from '../../repository/Core/drug-category.repository';
import {
    CreateDrugCategoryInput,
    UpdateDrugCategoryInput,
    PaginatedDrugCategories,
    DrugCategory
} from '../../models/Core/drug-category.model';
import {
    PHARMACY_CATEGORY_ERRORS,
    PHARMACY_CONFIG
} from '../../constants/pharmacy.constant';
import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class DrugCategoryService {
    /**
     * Tạo ID chuẩn cho record Drug Category
     */
    private static generateCategoryId(code: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;
        const shortCode = code.substring(0, 10).toUpperCase();

        return `DRC_${datePart}_${shortCode}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách nhóm thuốc có phân trang.
     */
    static async getCategories(
        search?: string,
        page: number = PHARMACY_CONFIG.DEFAULT_PAGE,
        limit: number = PHARMACY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedDrugCategories> {
        const safeLimit = Math.min(limit, PHARMACY_CONFIG.MAX_LIMIT);
        return await DrugCategoryRepository.getCategories(search, page, safeLimit);
    }

    /**
     * Lấy chi tiết nhóm thuốc theo ID.
     */
    static async getCategoryById(id: string): Promise<DrugCategory> {
        const category = await DrugCategoryRepository.getCategoryById(id);
        if (!category) {
            throw PHARMACY_CATEGORY_ERRORS.NOT_FOUND;
        }
        return category;
    }

    /**
     * Tạo mới nhóm thuốc.
     */
    static async createCategory(input: CreateDrugCategoryInput): Promise<DrugCategory> {
        const existing = await DrugCategoryRepository.getCategoryByCode(input.code);
        if (existing) {
            throw PHARMACY_CATEGORY_ERRORS.ALREADY_EXISTS;
        }

        const newId = this.generateCategoryId(input.code);

        return await DrugCategoryRepository.createCategory(newId, input);
    }

    /**
     * Cập nhật nhóm thuốc theo ID.
     */
    static async updateCategory(id: string, input: UpdateDrugCategoryInput): Promise<DrugCategory> {
        await this.getCategoryById(id);

        return await DrugCategoryRepository.updateCategory(id, input);
    }

    /**
     * Xóa nhóm thuốc theo ID.
     */
    static async deleteCategory(id: string): Promise<void> {
        await this.getCategoryById(id);

        // Kiểm tra xem có đang chứa thuốc không
        const hasDrugs = await DrugCategoryRepository.hasDrugsInCategory(id);
        if (hasDrugs) {
            throw PHARMACY_CATEGORY_ERRORS.HAS_DRUGS;
        }

        await DrugCategoryRepository.deleteCategory(id);
    }

    /**
     * Xuất dữ liệu nhóm thuốc ra file Excel
     */
    static async exportCategories(): Promise<Buffer> {
        const categories = await DrugCategoryRepository.getAllCategories();

        const columns: ExcelColumn[] = [
            { header: 'Mã Nhóm Thuốc (*)', key: 'code', width: 25 },
            { header: 'Tên Nhóm Thuốc (*)', key: 'name', width: 40 },
            { header: 'Mô Tả', key: 'description', width: 50 }
        ];

        return await ExcelUtil.generateExcelBuffer(categories, columns, 'Drug Categories');
    }

    /**
     * Import dữ liệu nhóm thuốc từ file Excel
     */
    static async importCategories(buffer: Buffer): Promise<any> {
        const columnMapping = {
            'Mã Nhóm Thuốc (*)': 'code',
            'Tên Nhóm Thuốc (*)': 'name',
            'Mô Tả': 'description'
        };

        const data = await ExcelUtil.parseExcelBuffer<any>(buffer, columnMapping);

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const row of data) {
            try {
                if (!row.code || !row.name) {
                    throw new Error('Thiếu Mã Nhóm Thuốc hoặc Tên Nhóm Thuốc');
                }

                const codeStr = String(row.code);
                const nameStr = String(row.name);
                const descStr = row.description ? String(row.description) : null;

                const existing = await DrugCategoryRepository.getCategoryByCode(codeStr);
                const id = existing ? existing.drug_categories_id : this.generateCategoryId(codeStr);

                await DrugCategoryRepository.upsertCategory(id, codeStr, nameStr, descStr);

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
