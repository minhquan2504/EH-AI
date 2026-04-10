import { pool } from '../../config/postgresdb';
import { DispensingRepository } from '../../repository/Medication Management/dispensing.repository';
import { CreateDispenseInput, DispenseOrderFull } from '../../models/Medication Management/dispensing.model';
import {
    DISPENSE_STATUS,
    DISPENSE_CONFIG,
    DISPENSE_ERRORS,
} from '../../constants/dispensing.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409, INTERNAL_SERVER_ERROR: 500 };

/** Lớp lỗi nghiệp vụ */
class AppError extends Error {
    constructor(
        public httpCode: number,
        public code: string,
        message: string
    ) {
        super(message);
    }
}


export class DispensingService {

    /**
     * Cấp phát thuốc từ đơn thuốc (transaction).
     * validate → BEGIN → create order → create details + deduct stock → update Rx status → COMMIT
     */
    static async dispense(
        prescriptionId: string,
        pharmacistId: string,
        input: CreateDispenseInput
    ): Promise<DispenseOrderFull> {
        // 1. Validate đơn thuốc
        const rxInfo = await DispensingRepository.getPrescriptionInfo(prescriptionId);
        if (!rxInfo.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', DISPENSE_ERRORS.PRESCRIPTION_NOT_FOUND);
        }
        if (rxInfo.status !== 'PRESCRIBED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PRESCRIPTION_NOT_PRESCRIBED', DISPENSE_ERRORS.PRESCRIPTION_NOT_PRESCRIBED);
        }

        // 2. Kiểm tra chưa cấp phát
        const alreadyDispensed = await DispensingRepository.hasDispenseOrder(prescriptionId);
        if (alreadyDispensed) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_DISPENSED', DISPENSE_ERRORS.ALREADY_DISPENSED);
        }

        // 3. Validate items
        if (!input.items || input.items.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ITEMS', DISPENSE_ERRORS.MISSING_ITEMS);
        }

        // 4. Pre-validate từng dòng (trước khi bắt đầu transaction)
        for (const item of input.items) {
            if (!item.prescription_detail_id || !item.inventory_id || !item.dispensed_quantity || item.dispensed_quantity <= 0) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ITEM', DISPENSE_ERRORS.INVALID_ITEM);
            }

            // Check dòng thuốc thuộc đơn
            const detail = await DispensingRepository.getPrescriptionDetail(item.prescription_detail_id, prescriptionId);
            if (!detail.exists) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'DETAIL_NOT_FOUND', DISPENSE_ERRORS.DETAIL_NOT_FOUND);
            }

            // Check lô tồn kho
            const batch = await DispensingRepository.getInventoryBatch(item.inventory_id);
            if (!batch.exists) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'INVENTORY_NOT_FOUND', DISPENSE_ERRORS.INVENTORY_NOT_FOUND);
            }

            // Check drug match
            if (batch.drug_id !== detail.drug_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DRUG_MISMATCH', DISPENSE_ERRORS.DRUG_MISMATCH);
            }

            // Check hết hạn
            if (new Date(batch.expiry_date!) <= new Date()) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'BATCH_EXPIRED', DISPENSE_ERRORS.BATCH_EXPIRED);
            }

            // Check tồn kho đủ
            if (batch.stock_quantity! < item.dispensed_quantity) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', DISPENSE_ERRORS.INSUFFICIENT_STOCK);
            }

            // Check facility match: lô kho phải cùng branch với lượt khám
            const rxBranch = await DispensingRepository.getBranchFromPrescription(prescriptionId);
            const invBranch = await DispensingRepository.getBranchFromInventory(item.inventory_id);
            if (rxBranch && invBranch && rxBranch !== invBranch) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'FACILITY_MISMATCH', DISPENSE_ERRORS.FACILITY_MISMATCH);
            }
        }

        // 5. Transaction: tạo phiếu + trừ kho + đổi status đơn thuốc
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const orderId = DispensingRepository.generateOrderId();
            const code = DispensingRepository.generateDispenseCode();

            const order = await DispensingRepository.createOrder(
                client, orderId, code, prescriptionId, pharmacistId, input.notes
            );

            const details = [];
            let totalCost = 0;

            for (const item of input.items) {
                const detailId = DispensingRepository.generateDetailId();
                const detail = await DispensingRepository.createDetail(client, detailId, orderId, item);
                details.push(detail);

                // Trừ tồn kho
                const deducted = await DispensingRepository.deductStock(client, item.inventory_id, item.dispensed_quantity);
                if (!deducted) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', DISPENSE_ERRORS.INSUFFICIENT_STOCK);
                }

                // Tính tổng chi phí (lấy unit_price từ inventory)
                const batchInfo = await DispensingRepository.getInventoryBatch(item.inventory_id);
                // totalCost sẽ được tính khi đọc lại
            }

            // Cập nhật trạng thái đơn thuốc → DISPENSED
            await DispensingRepository.updatePrescriptionStatus(client, prescriptionId, 'DISPENSED');

            await client.query('COMMIT');

            // Đọc lại phiếu đầy đủ (sau commit)
            const full = await DispensingRepository.findByPrescriptionId(prescriptionId);
            const costSum = full.details.reduce((s, d) => s + (d.dispensed_quantity * (d.unit_price || 0)), 0);

            return {
                order: full.order!,
                details: full.details,
                total_items: full.details.length,
                total_cost: costSum,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Xem phiếu cấp phát theo đơn thuốc
     */
    static async getByPrescriptionId(prescriptionId: string): Promise<DispenseOrderFull | null> {
        const rxInfo = await DispensingRepository.getPrescriptionInfo(prescriptionId);
        if (!rxInfo.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', DISPENSE_ERRORS.PRESCRIPTION_NOT_FOUND);
        }

        const result = await DispensingRepository.findByPrescriptionId(prescriptionId);
        if (!result.order) return null;

        const totalCost = result.details.reduce((s, d) => s + (d.dispensed_quantity * (d.unit_price || 0)), 0);
        return {
            order: result.order,
            details: result.details,
            total_items: result.details.length,
            total_cost: totalCost,
        };
    }

    /**
     * Lịch sử cấp phát (phân trang + filter)
     */
    static async getHistory(
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ) {
        const safeLimit = Math.min(limit, DISPENSE_CONFIG.MAX_LIMIT);
        const result = await DispensingRepository.findHistory(page, safeLimit, status, fromDate, toDate);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Xem tồn kho theo thuốc (FEFO)
     */
    static async getInventory(drugId: string) {
        const exists = await DispensingRepository.drugExists(drugId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', DISPENSE_ERRORS.DRUG_NOT_FOUND);
        }
        return DispensingRepository.getInventoryByDrugId(drugId);
    }

    /**
     * Kiểm tra tồn kho đủ cho số lượng yêu cầu
     */
    static async checkStock(drugId: string, quantity: number) {
        const exists = await DispensingRepository.drugExists(drugId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', DISPENSE_ERRORS.DRUG_NOT_FOUND);
        }
        return DispensingRepository.checkStock(drugId, quantity);
    }

    /**
     * Lịch sử cấp phát theo dược sĩ
     */
    static async getByPharmacist(
        pharmacistId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string
    ) {
        const exists = await DispensingRepository.pharmacistExists(pharmacistId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PHARMACIST_NOT_FOUND', DISPENSE_ERRORS.PHARMACIST_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, DISPENSE_CONFIG.MAX_LIMIT);
        const result = await DispensingRepository.findByPharmacistId(pharmacistId, page, safeLimit, fromDate, toDate);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Hủy phiếu cấp phát + hoàn tồn kho (transaction)
     */
    static async cancel(dispenseOrderId: string, reason: string): Promise<void> {
        if (!reason || reason.trim() === '') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', DISPENSE_ERRORS.MISSING_CANCEL_REASON);
        }

        const order = await DispensingRepository.getOrderById(dispenseOrderId);
        if (!order) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DISPENSE_ORDER_NOT_FOUND', DISPENSE_ERRORS.DISPENSE_ORDER_NOT_FOUND);
        }
        if (order.status === DISPENSE_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DISPENSE_ALREADY_CANCELLED', DISPENSE_ERRORS.DISPENSE_ALREADY_CANCELLED);
        }

        const details = await DispensingRepository.getDetailsByOrderId(dispenseOrderId);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Hoàn kho từng dòng
            for (const detail of details) {
                await DispensingRepository.restoreStock(client, detail.inventory_id, detail.dispensed_quantity);
            }

            // Hủy phiếu
            await DispensingRepository.cancelOrder(client, dispenseOrderId, reason);

            // Đổi status đơn thuốc về PRESCRIBED
            await DispensingRepository.updatePrescriptionStatus(client, order.prescription_id, 'PRESCRIBED');

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
