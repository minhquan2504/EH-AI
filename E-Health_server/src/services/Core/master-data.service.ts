import { randomUUID } from 'crypto';
import { MasterDataRepository } from '../../repository/Core/master-data.repository';
import { CreateCategoryInput, UpdateCategoryInput, PaginatedCategories, MasterDataCategory } from '../../models/Core/master-data.model';
import { MASTER_DATA_CATEGORY_ERRORS, MASTER_DATA_CONFIG } from '../../constants/masterData.constant';
import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class MasterDataService {
    /**
     * Tạo ID chuẩn cho record Master Data Category
     */
    private static generateCategoryId(code: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        const shortCode = code.substring(0, 10).toUpperCase();

        return `MDC_${datePart}_${shortCode}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách nhóm danh mục có phân trang.
     */
    static async getCategories(
        search?: string,
        page: number = MASTER_DATA_CONFIG.DEFAULT_PAGE,
        limit: number = MASTER_DATA_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedCategories> {
        const safeLimit = Math.min(limit, MASTER_DATA_CONFIG.MAX_LIMIT);
        return await MasterDataRepository.getCategories(search, page, safeLimit);
    }

    /**
     * Lấy chi tiết nhóm danh mục theo ID.
     */
    static async getCategoryById(id: string): Promise<MasterDataCategory> {
        const category = await MasterDataRepository.getCategoryById(id);
        if (!category) {
            throw MASTER_DATA_CATEGORY_ERRORS.NOT_FOUND;
        }
        return category;
    }

    /**
     * Tạo mới nhóm danh mục.
     */
    static async createCategory(input: CreateCategoryInput): Promise<MasterDataCategory> {
        const existing = await MasterDataRepository.getCategoryByCode(input.code);
        if (existing) {
            throw MASTER_DATA_CATEGORY_ERRORS.ALREADY_EXISTS;
        }

        const newId = this.generateCategoryId(input.code);

        return await MasterDataRepository.createCategory(newId, input);
    }

    /**
     * Cập nhật nhóm danh mục theo ID.
     */
    static async updateCategory(id: string, input: UpdateCategoryInput): Promise<MasterDataCategory> {
        await this.getCategoryById(id);

        return await MasterDataRepository.updateCategory(id, input);
    }

    /**
     * Xóa mềm nhóm danh mục theo ID.
     */
    static async deleteCategory(id: string): Promise<void> {
        const category = await this.getCategoryById(id);

        const activeItemsCount = await MasterDataRepository.countActiveItemsInCategory(category.code);

        if (activeItemsCount > 0) {
            throw MASTER_DATA_CATEGORY_ERRORS.HAS_CHILDREN;
        }

        await MasterDataRepository.deleteCategory(id);
    }

    /**
     * Xuất dữ liệu danh mục ra file Excel
     */
    static async exportCategories(): Promise<Buffer> {
        const categories = await MasterDataRepository.getAllCategories();

        const columns: ExcelColumn[] = [
            { header: 'Mã Dữ Liệu (*)', key: 'code', width: 25 },
            { header: 'Tên Danh Mục (*)', key: 'name', width: 40 },
            { header: 'Mô Tả', key: 'description', width: 50 }
        ];

        return await ExcelUtil.generateExcelBuffer(categories, columns, 'Master Data Categories');
    }

    /**
     * Import dữ liệu danh mục từ file Excel
     */
    static async importCategories(buffer: Buffer): Promise<any> {
        const columnMapping = {
            'Mã Dữ Liệu (*)': 'code',
            'Tên Danh Mục (*)': 'name',
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
                    throw new Error('Thiếu Mã Dữ Liệu hoặc Tên Danh Mục');
                }

                // Kiểm tra xem đã tồn tại chưa để tính log update/insert
                const existing = await MasterDataRepository.getCategoryByCode(row.code);
                const id = existing ? existing.master_data_categories_id : this.generateCategoryId(row.code);

                await MasterDataRepository.upsertCategory(id, row.code, row.name, row.description || null);

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