import { WarehouseRepository } from '../../repository/Medication Management/warehouse.repository';
import { CreateWarehouseInput, UpdateWarehouseInput } from '../../models/Medication Management/warehouse.model';
import { WAREHOUSE_ERRORS } from '../../constants/warehouse.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409 };

class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}


export class WarehouseService {

    /** Danh sách kho */
    static async getAll(branchId?: string, search?: string) {
        return WarehouseRepository.findAll(branchId, search);
    }

    /** Chi tiết kho */
    static async getById(warehouseId: string) {
        const warehouse = await WarehouseRepository.findById(warehouseId);
        if (!warehouse) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'WAREHOUSE_NOT_FOUND', WAREHOUSE_ERRORS.NOT_FOUND);
        }
        return warehouse;
    }

    /** Tạo kho mới */
    static async create(input: CreateWarehouseInput) {
        if (!input.branch_id || !input.code || !input.name) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', WAREHOUSE_ERRORS.MISSING_REQUIRED);
        }

        const branchExists = await WarehouseRepository.branchExists(input.branch_id);
        if (!branchExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'BRANCH_NOT_FOUND', WAREHOUSE_ERRORS.BRANCH_NOT_FOUND);
        }

        const codeExists = await WarehouseRepository.codeExists(input.branch_id, input.code);
        if (codeExists) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'CODE_ALREADY_EXISTS', WAREHOUSE_ERRORS.CODE_ALREADY_EXISTS);
        }

        const id = WarehouseRepository.generateId();
        return WarehouseRepository.create(id, input);
    }

    /** Cập nhật kho */
    static async update(warehouseId: string, input: UpdateWarehouseInput) {
        const existing = await WarehouseRepository.findById(warehouseId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'WAREHOUSE_NOT_FOUND', WAREHOUSE_ERRORS.NOT_FOUND);
        }

        const hasFields = Object.values(input).some(v => v !== undefined);
        if (!hasFields) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_FIELDS', WAREHOUSE_ERRORS.NO_FIELDS_TO_UPDATE);
        }

        return WarehouseRepository.update(warehouseId, input);
    }

    /** Bật/tắt kho */
    static async toggle(warehouseId: string) {
        const existing = await WarehouseRepository.findById(warehouseId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'WAREHOUSE_NOT_FOUND', WAREHOUSE_ERRORS.NOT_FOUND);
        }
        return WarehouseRepository.toggle(warehouseId, !existing.is_active);
    }
}
