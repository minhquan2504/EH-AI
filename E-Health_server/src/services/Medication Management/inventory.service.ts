import { InventoryRepository } from '../../repository/Medication Management/inventory.repository';
import {
    CreateInventoryInput,
    UpdateInventoryInput,
} from '../../models/Medication Management/inventory.model';
import {
    INVENTORY_CONFIG,
    INVENTORY_ERRORS,
} from '../../constants/inventory.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409 };

/** Lớp lỗi nghiệp vụ */
class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}


export class InventoryService {

    /** Danh sách tồn kho (phân trang + filter) */
    static async getAll(
        page: number, limit: number,
        drugId?: string, search?: string,
        expiryBefore?: string, lowStockOnly?: boolean
    ) {
        const safeLimit = Math.min(limit, INVENTORY_CONFIG.MAX_LIMIT);
        const result = await InventoryRepository.findAll(page, safeLimit, drugId, search, expiryBefore, lowStockOnly);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /** Chi tiết 1 lô */
    static async getById(batchId: string) {
        const item = await InventoryRepository.findById(batchId);
        if (!item) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'BATCH_NOT_FOUND', INVENTORY_ERRORS.BATCH_NOT_FOUND);
        }
        return item;
    }

    /** Cảnh báo sắp hết hạn */
    static async getExpiringAlerts(days: number) {
        const safeDays = days > 0 ? days : INVENTORY_CONFIG.DEFAULT_EXPIRY_DAYS;
        const alerts = await InventoryRepository.findExpiring(safeDays);
        const summary = {
            critical: alerts.filter(a => a.alert_level === 'CRITICAL').length,
            warning: alerts.filter(a => a.alert_level === 'WARNING').length,
            notice: alerts.filter(a => a.alert_level === 'NOTICE').length,
            total: alerts.length,
        };
        return { summary, alerts };
    }

    /** Cảnh báo tồn kho thấp */
    static async getLowStockAlerts() {
        const alerts = await InventoryRepository.findLowStock();
        return { total: alerts.length, alerts };
    }

    /** Nhập kho lô mới */
    static async create(input: CreateInventoryInput) {
        // Validate required fields
        if (!input.drug_id || !input.batch_number || !input.expiry_date || input.stock_quantity === undefined) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', INVENTORY_ERRORS.MISSING_REQUIRED);
        }

        // Validate drug tồn tại
        const drugExists = await InventoryRepository.drugExists(input.drug_id);
        if (!drugExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', INVENTORY_ERRORS.DRUG_NOT_FOUND);
        }

        // Validate lô chưa tồn tại
        const batchExists = await InventoryRepository.batchExists(input.drug_id, input.batch_number);
        if (batchExists) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'BATCH_ALREADY_EXISTS', INVENTORY_ERRORS.BATCH_ALREADY_EXISTS);
        }

        // Validate ngày hết hạn
        if (new Date(input.expiry_date) <= new Date()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EXPIRY_IN_PAST', INVENTORY_ERRORS.EXPIRY_IN_PAST);
        }

        // Validate số lượng
        if (input.stock_quantity < 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', INVENTORY_ERRORS.INVALID_QUANTITY);
        }

        const id = InventoryRepository.generateId();
        return InventoryRepository.create(id, input);
    }

    /** Cập nhật tồn kho */
    static async update(batchId: string, input: UpdateInventoryInput) {
        // Check lô tồn tại
        const existing = await InventoryRepository.findById(batchId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'BATCH_NOT_FOUND', INVENTORY_ERRORS.BATCH_NOT_FOUND);
        }

        // Validate stock >= 0
        if (input.stock_quantity !== undefined && input.stock_quantity < 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', INVENTORY_ERRORS.INVALID_QUANTITY);
        }

        return InventoryRepository.update(batchId, input);
    }
}
