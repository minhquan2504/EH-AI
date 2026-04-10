import { pool } from '../../config/postgresdb';
import { StockOutRepository } from '../../repository/Medication Management/stock-out.repository';
import { AddStockOutItemInput } from '../../models/Medication Management/stock-out.model';
import {
    STOCK_OUT_REASON_TYPE,
    STOCK_OUT_STATUS,
    STOCK_OUT_CONFIG,
    STOCK_OUT_ERRORS,
} from '../../constants/stock-out.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404 };

class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}

const VALID_REASON_TYPES = Object.values(STOCK_OUT_REASON_TYPE);


export class StockOutService {

    /** Tạo phiếu xuất kho (DRAFT) */
    static async createOrder(
        warehouseId: string, reasonType: string, createdBy: string,
        supplierId?: string, destWarehouseId?: string, notes?: string
    ) {
        if (!warehouseId || !reasonType) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', STOCK_OUT_ERRORS.MISSING_REQUIRED);
        }
        if (!VALID_REASON_TYPES.includes(reasonType as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_REASON_TYPE', STOCK_OUT_ERRORS.INVALID_REASON_TYPE);
        }

        const warehouseOk = await StockOutRepository.warehouseActive(warehouseId);
        if (!warehouseOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'WAREHOUSE_NOT_FOUND', STOCK_OUT_ERRORS.WAREHOUSE_NOT_FOUND);

        if (reasonType === STOCK_OUT_REASON_TYPE.RETURN_SUPPLIER) {
            if (!supplierId) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SUPPLIER', STOCK_OUT_ERRORS.MISSING_SUPPLIER);
            const supplierOk = await StockOutRepository.supplierActive(supplierId);
            if (!supplierOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SUPPLIER_NOT_FOUND', STOCK_OUT_ERRORS.SUPPLIER_NOT_FOUND);
        }

        if (reasonType === STOCK_OUT_REASON_TYPE.TRANSFER) {
            if (!destWarehouseId) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DEST', STOCK_OUT_ERRORS.MISSING_DEST_WAREHOUSE);
            if (destWarehouseId === warehouseId) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SAME_WAREHOUSE', STOCK_OUT_ERRORS.SAME_WAREHOUSE);
            const destOk = await StockOutRepository.warehouseActive(destWarehouseId);
            if (!destOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DEST_NOT_FOUND', STOCK_OUT_ERRORS.DEST_WAREHOUSE_NOT_FOUND);
        }

        const orderId = StockOutRepository.generateOrderId();
        const orderCode = StockOutRepository.generateOrderCode();
        return StockOutRepository.createOrder(orderId, orderCode, warehouseId, reasonType, createdBy, supplierId, destWarehouseId, notes);
    }

    /** Thêm dòng thuốc — chỉ khi DRAFT */
    static async addItem(orderId: string, input: AddStockOutItemInput) {
        const order = await StockOutRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_OUT_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_OUT_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', STOCK_OUT_ERRORS.NOT_DRAFT);
        }

        if (!input.inventory_id || !input.quantity) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ITEM_FIELDS', STOCK_OUT_ERRORS.MISSING_ITEM_FIELDS);
        }
        if (input.quantity <= 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_QUANTITY', STOCK_OUT_ERRORS.INVALID_QUANTITY);
        }

        const batch = await StockOutRepository.getInventoryBatch(input.inventory_id);
        if (!batch.exists) throw new AppError(HTTP_STATUS.NOT_FOUND, 'INVENTORY_NOT_FOUND', STOCK_OUT_ERRORS.INVENTORY_NOT_FOUND);

        // Lô phải thuộc kho xuất
        if (batch.warehouse_id !== order.warehouse_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'WRONG_WAREHOUSE', STOCK_OUT_ERRORS.INVENTORY_WRONG_WAREHOUSE);
        }

        if (batch.stock_quantity! < input.quantity) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', STOCK_OUT_ERRORS.INSUFFICIENT_STOCK);
        }

        const detailId = StockOutRepository.generateDetailId();
        return StockOutRepository.addItem(detailId, orderId, input.inventory_id, batch.drug_id!, batch.batch_number!, input.quantity, input.reason_note);
    }

    /** Xóa dòng thuốc — chỉ khi DRAFT */
    static async deleteItem(orderId: string, detailId: string) {
        const order = await StockOutRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_OUT_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_OUT_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', STOCK_OUT_ERRORS.NOT_DRAFT);
        }

        const detail = await StockOutRepository.findDetailById(detailId, orderId);
        if (!detail) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DETAIL_NOT_FOUND', STOCK_OUT_ERRORS.DETAIL_NOT_FOUND);

        await StockOutRepository.deleteItem(detailId, orderId);
    }

    /** Xác nhận + trừ kho (DRAFT → CONFIRMED) — transaction */
    static async confirm(orderId: string, confirmedBy: string) {
        const order = await StockOutRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_OUT_ERRORS.ORDER_NOT_FOUND);
        if (order.status !== STOCK_OUT_STATUS.DRAFT) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_DRAFT', STOCK_OUT_ERRORS.NOT_DRAFT);
        }

        const itemCount = await StockOutRepository.countItems(orderId);
        if (itemCount === 0) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_ITEMS', STOCK_OUT_ERRORS.NO_ITEMS);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const destWarehouseId = order.reason_type === STOCK_OUT_REASON_TYPE.TRANSFER ? order.dest_warehouse_id : undefined;
            await StockOutRepository.confirmOrder(client, orderId, confirmedBy, destWarehouseId);
            await client.query('COMMIT');
        } catch (err: any) {
            await client.query('ROLLBACK');
            if (err.message?.startsWith('INSUFFICIENT_STOCK:')) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', STOCK_OUT_ERRORS.INSUFFICIENT_STOCK);
            }
            throw err;
        } finally {
            client.release();
        }

        return StockOutRepository.findOrderById(orderId);
    }

    /** Hủy phiếu (+ hoàn kho nếu CONFIRMED) */
    static async cancel(orderId: string, reason: string) {
        if (!reason || reason.trim() === '') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', STOCK_OUT_ERRORS.MISSING_CANCEL_REASON);
        }

        const order = await StockOutRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_OUT_ERRORS.ORDER_NOT_FOUND);
        if (order.status === STOCK_OUT_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ALREADY_CANCELLED', STOCK_OUT_ERRORS.ALREADY_CANCELLED);
        }

        if (order.status === STOCK_OUT_STATUS.CONFIRMED) {
            // Hoàn kho — transaction
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const destWarehouseId = order.reason_type === STOCK_OUT_REASON_TYPE.TRANSFER ? order.dest_warehouse_id : undefined;
                await StockOutRepository.cancelConfirmedOrder(client, orderId, reason, destWarehouseId);
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } else {
            // DRAFT → chỉ đổi status
            await StockOutRepository.cancelDraftOrder(orderId, reason);
        }

        return StockOutRepository.findOrderById(orderId);
    }

    /** Lịch sử phiếu xuất */
    static async getHistory(
        page: number, limit: number,
        status?: string, reasonType?: string, warehouseId?: string,
        fromDate?: string, toDate?: string
    ) {
        const safeLimit = Math.min(limit, STOCK_OUT_CONFIG.MAX_LIMIT);
        const result = await StockOutRepository.findHistory(page, safeLimit, status, reasonType, warehouseId, fromDate, toDate);
        return { ...result, page, limit: safeLimit, totalPages: Math.ceil(result.total / safeLimit) };
    }

    /** Chi tiết phiếu xuất */
    static async getDetail(orderId: string) {
        const order = await StockOutRepository.findOrderById(orderId);
        if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', STOCK_OUT_ERRORS.ORDER_NOT_FOUND);
        const details = await StockOutRepository.findDetailsByOrderId(orderId);
        return { order, details, total_items: details.length };
    }
}
