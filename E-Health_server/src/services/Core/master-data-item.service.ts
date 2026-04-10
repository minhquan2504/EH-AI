import { randomUUID } from 'crypto';
import { MasterDataItemRepository } from '../../repository/Core/master-data-item.repository';
import { MasterDataRepository } from '../../repository/Core/master-data.repository';
import { MasterDataItem, CreateItemInput, UpdateItemInput, PaginatedItems } from '../../models/Core/master-data-item.model';
import { MASTER_DATA_ITEM_ERRORS, MASTER_DATA_CONFIG } from '../../constants/masterData.constant';
import { ExcelUtil, ExcelColumn } from '../../utils/excel.util';

export class MasterDataItemService {
    /**
     * Tạo ID chuẩn cho record Master Data Item
     */
    private static generateItemId(categoryCode: string, code: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        const shortCatCode = categoryCode.substring(0, 5).toUpperCase();
        const shortItemCode = code.substring(0, 5).toUpperCase();

        return `MDI_${datePart}_${shortCatCode}_${shortItemCode}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Kiểm tra xem category có tồn tại không
     */
    private static async validateCategoryExists(categoryCode: string): Promise<void> {
        const category = await MasterDataRepository.getCategoryByCode(categoryCode);
        if (!category) {
            throw MASTER_DATA_ITEM_ERRORS.CATEGORY_NOT_FOUND;
        }
    }

    /**
     * Lấy danh sách items có phân trang (dành cho Admin)
     */
    static async getItems(
        search?: string,
        categoryCode?: string,
        page: number = MASTER_DATA_CONFIG.DEFAULT_PAGE,
        limit: number = MASTER_DATA_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedItems> {
        const safeLimit = Math.min(limit, MASTER_DATA_CONFIG.MAX_LIMIT);

        // Nếu có truyền categoryCode -> check xem category đó có tồn tại ko
        if (categoryCode) {
            await this.validateCategoryExists(categoryCode);
        }

        return await MasterDataItemRepository.getItems(search, categoryCode, page, safeLimit);
    }

    /**
     * Lấy danh sách items đang active của một nhóm danh mục
     */
    static async getActiveItemsByCategory(categoryCode: string): Promise<MasterDataItem[]> {
        await this.validateCategoryExists(categoryCode);

        return await MasterDataItemRepository.getActiveItemsByCategory(categoryCode);
    }

    /**
     * Lấy chi tiết item theo ID
     */
    static async getItemById(id: string): Promise<MasterDataItem> {
        const item = await MasterDataItemRepository.getItemById(id);
        if (!item) {
            throw MASTER_DATA_ITEM_ERRORS.NOT_FOUND;
        }
        return item;
    }

    /**
     * Tạo mới một item thuộc một category
     */
    static async createItem(categoryCode: string, input: CreateItemInput): Promise<MasterDataItem> {
        await this.validateCategoryExists(categoryCode);

        const existing = await MasterDataItemRepository.getItemByCode(categoryCode, input.code);
        if (existing) {
            throw MASTER_DATA_ITEM_ERRORS.ALREADY_EXISTS;
        }

        const newId = this.generateItemId(categoryCode, input.code);

        return await MasterDataItemRepository.createItem(newId, categoryCode, input);
    }

    /**
     * Cập nhật thông tin item
     */
    static async updateItem(id: string, input: UpdateItemInput): Promise<MasterDataItem> {
        await this.getItemById(id);

        return await MasterDataItemRepository.updateItem(id, input);
    }

    /**
     * Xóa item
     */
    static async deleteItem(id: string): Promise<void> {
        await this.getItemById(id);

        await MasterDataItemRepository.deleteItem(id);
    }

    /**
     * Xuất danh sách chi tiết danh mục ra file Excel
     */
    static async exportItems(categoryCode: string): Promise<Buffer> {
        await this.validateCategoryExists(categoryCode);

        const items = await MasterDataItemRepository.getAllItemsByCategory(categoryCode);

        const columns: ExcelColumn[] = [
            { header: 'Mã Giá Trị (*)', key: 'code', width: 20 },
            { header: 'Giá Trị (*)', key: 'value', width: 40 },
            { header: 'Thứ Tự Sắp Xếp', key: 'sort_order', width: 15 },
            { header: 'Kích Hoạt (TRUE/FALSE)', key: 'is_active', width: 25 }
        ];

        return await ExcelUtil.generateExcelBuffer(items, columns, `Items of ${categoryCode}`);
    }

    /**
     * Import danh sách chi tiết danh mục từ file Excel
     */
    static async importItems(categoryCode: string, buffer: Buffer): Promise<any> {
        await this.validateCategoryExists(categoryCode);

        const columnMapping = {
            'Mã Giá Trị (*)': 'code',
            'Giá Trị (*)': 'value',
            'Thứ Tự Sắp Xếp': 'sort_order',
            'Kích Hoạt (TRUE/FALSE)': 'is_active'
        };

        const data = await ExcelUtil.parseExcelBuffer<any>(buffer, columnMapping);

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const row of data) {
            try {
                if (row.code === undefined || row.code === null || row.value === undefined || row.value === null) {
                    throw new Error('Thiếu Mã Giá Trị hoặc Giá Trị');
                }

                const sortOrder = parseInt(row.sort_order, 10) || 0;
                let isActive = true;
                if (row.is_active !== undefined && row.is_active !== null) {
                    if (typeof row.is_active === 'string') {
                        isActive = row.is_active.toUpperCase() === 'TRUE';
                    } else {
                        isActive = Boolean(row.is_active);
                    }
                }

                const codeStr = String(row.code);
                const valueStr = String(row.value);

                const existing = await MasterDataItemRepository.getItemByCode(categoryCode, codeStr);
                const id = existing ? existing.master_data_items_id : this.generateItemId(categoryCode, codeStr);

                await MasterDataItemRepository.upsertItem(id, categoryCode, codeStr, valueStr, sortOrder, isActive);

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
