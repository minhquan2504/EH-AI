import { SupplierRepository } from '../../repository/Medication Management/supplier.repository';
import { CreateSupplierInput, UpdateSupplierInput } from '../../models/Medication Management/stock-in.model';
import { SUPPLIER_ERRORS } from '../../constants/stock-in.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409 };

class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}


export class SupplierService {

    static async getAll(search?: string, activeOnly?: boolean) {
        return SupplierRepository.findAll(search, activeOnly);
    }

    static async getById(id: string) {
        const supplier = await SupplierRepository.findById(id);
        if (!supplier) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SUPPLIER_NOT_FOUND', SUPPLIER_ERRORS.NOT_FOUND);
        return supplier;
    }

    static async create(input: CreateSupplierInput) {
        if (!input.code || !input.name) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', SUPPLIER_ERRORS.MISSING_REQUIRED);
        }
        const exists = await SupplierRepository.codeExists(input.code);
        if (exists) throw new AppError(HTTP_STATUS.CONFLICT, 'CODE_EXISTS', SUPPLIER_ERRORS.CODE_EXISTS);

        const id = SupplierRepository.generateId();
        return SupplierRepository.create(id, input);
    }

    static async update(id: string, input: UpdateSupplierInput) {
        const existing = await SupplierRepository.findById(id);
        if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SUPPLIER_NOT_FOUND', SUPPLIER_ERRORS.NOT_FOUND);

        const hasFields = Object.values(input).some(v => v !== undefined);
        if (!hasFields) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_FIELDS', SUPPLIER_ERRORS.NO_FIELDS_TO_UPDATE);

        return SupplierRepository.update(id, input);
    }
}
