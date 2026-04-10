import { pool } from '../../config/postgresdb';
import { StockInRepository } from '../../repository/Medication Management/stock-in.repository';
import { AddStockInItemInput } from '../../models/Medication Management/stock-in.model';
import {
    STOCK_IN_STATUS,
    STOCK_IN_CONFIG,
    STOCK_IN_ERRORS,
} from '../../constants/stock-in.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409 };

class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}


export class StockInService {

    /** Tạo phiếu nhập kho (DRAFT) */
    static async createOrder(supplierId: string, warehouseId: string, createdBy: string, notes?: string) {
        if (!supplierId || !warehouseId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', STOCK_IN_ERRORS.MISSING_REQUIRED);
        }

        const supplierOk = await StockInRepository.supplierActive(supplierId);
        if (!supplierOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SUPPLIER_NOT_FOUND', STOCK_IN_ERRORS.SUPPLIER_NOT_FOUND);

        const warehouseOk = await StockInRepository.warehouseActive(warehouseId);
        if (!warehouseOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'WAREHOUSE_NOT_FOUND', STOCK_IN_ERRORS.WAREHOUSE_NOT_FOUND);

        const orderId = StockInRepository.generateOrderId();
        const orderCode = StockInRepository.generateOrderCode();
        return StockInRepository.createOrder(orderId, orderCode, supplierId, warehouseId, createdBy, notes);
    }

    /** Thêm dòng thuốc vào phiếu DRAFT */
    static async addItem(orderId: string, input: AddStockInItemInput) {
        const order = await StockInRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_IN_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_IN_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', STOCK_IN_ERRORS.NOT_DRAFT);
        }

        if (!input.drug_id || !input.batch_number || !input.expiry_date || !input.quantity || !input.unit_cost) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ITEM_FIELDS', STOCK_IN_ERRORS.MISSING_ITEM_FIELDS);
        }

        const drugOk = await StockInRepository.drugActive(input.drug_id);
        if (!drugOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', STOCK_IN_ERRORS.DRUG_NOT_FOUND);

        if (new Date(input.expiry_date) <= new Date()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EXPIRY_IN_PAST', STOCK_IN_ERRORS.EXPIRY_IN_PAST);
        }
        if (input.quantity <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', STOCK_IN_ERRORS.INVALID_QUANTITY);
        }
        if (input.unit_cost <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_UNIT_COST', STOCK_IN_ERRORS.INVALID_UNIT_COST);
        }

        const detailId = StockInRepository.generateDetailId();
        return StockInRepository.addItem(detailId, orderId, input);
    }

    /** Xác nhận phiếu (DRAFT → CONFIRMED) */
    static async confirm(orderId: string) {
        const order = await StockInRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_IN_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_IN_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_STATUS', STOCK_IN_ERRORS.INVALID_STATUS_FOR_CONFIRM);
        }

        const itemCount = await StockInRepository.countItems(orderId);
        if (itemCount === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_ITEMS', STOCK_IN_ERRORS.NO_ITEMS);
        }

        await StockInRepository.confirmOrder(orderId);
        return StockInRepository.findOrderById(orderId);
    }

    /** Nhận hàng + cộng tồn kho (CONFIRMED → RECEIVED) — transaction */
    static async receive(orderId: string, receivedBy: string) {
        const order = await StockInRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_IN_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_IN_STATUS.CONFIRMED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_CONFIRMED', STOCK_IN_ERRORS.NOT_CONFIRMED);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await StockInRepository.receiveOrder(client, orderId, receivedBy, order.warehouse_id);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return StockInRepository.findOrderById(orderId);
    }

    /** Hủy phiếu */
    static async cancel(orderId: string, reason: string) {
        if (!reason || reason.trim() === '') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', STOCK_IN_ERRORS.MISSING_CANCEL_REASON);
        }

        const order = await StockInRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_IN_ERRORS.ORDER_NOT_FOUND);
        if (order.status === STOCK_IN_STATUS.RECEIVED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL', STOCK_IN_ERRORS.CANNOT_CANCEL_RECEIVED);
        }
        if (order.status === STOCK_IN_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_CANCELLED', 'Phiếu đã bị hủy trước đó');
        }

        await StockInRepository.cancelOrder(orderId, reason);
        return StockInRepository.findOrderById(orderId);
    }

    /** Lịch sử phiếu nhập */
    static async getHistory(
        page: number, limit: number,
        status?: string, supplierId?: string, warehouseId?: string,
        fromDate?: string, toDate?: string
    ) {
        const safeLimit = Math.min(limit, STOCK_IN_CONFIG.MAX_LIMIT);
        const result = await StockInRepository.findHistory(page, safeLimit, status, supplierId, warehouseId, fromDate, toDate);
        return { ...result, page, limit: safeLimit, totalPages: Math.ceil(result.total / safeLimit) };
    }

    /** Chi tiết phiếu nhập + dòng thuốc */
    static async getDetail(orderId: string) {
        const order = await StockInRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_IN_ERRORS.ORDER_NOT_FOUND);
        const details = await StockInRepository.findDetailsByOrderId(orderId);
        return { order, details, total_items: details.length };
    }
}
