import { MedicalOrderRepository } from '../../repository/EMR/medical-order.repository';
import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    ORDER_STATUS,
    ORDER_EDITABLE_ENCOUNTER_STATUSES,
    ORDER_ERRORS,
    ORDER_CONFIG,
    VALID_ORDER_TYPES,
    VALID_PRIORITIES,
} from '../../constants/medical-order.constant';
import {
    MedicalOrderRecord,
    CreateOrderInput,
    UpdateOrderInput,
    OrderResultRecord,
    CreateOrderResultInput,
    UpdateOrderResultInput,
    ServiceSearchResult,
    OrderSummaryItem,
} from '../../models/EMR/medical-order.model';


export class MedicalOrderService {

    //  Helpers 

    /**
     * Kiểm tra encounter tồn tại và ở trạng thái cho phép chỉ định
     */
    private static async validateEncounterEditable(encounterId: string): Promise<void> {
        const enc = await MedicalOrderRepository.getEncounterStatus(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', ORDER_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        if (!(ORDER_EDITABLE_ENCOUNTER_STATUSES as readonly string[]).includes(enc.status!)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ENCOUNTER_NOT_EDITABLE', ORDER_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }
    }

    /**
     * Lấy chỉ định và đảm bảo tồn tại
     */
    private static async getOrder(orderId: string): Promise<MedicalOrderRecord> {
        const order = await MedicalOrderRepository.findById(orderId);
        if (!order) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ORDER_NOT_FOUND', ORDER_ERRORS.NOT_FOUND);
        }
        return order;
    }

    //  API Tạo chỉ định CLS

    /**
     * Tạo chỉ định CLS mới.
     * Transaction: tạo chỉ định + tự động chuyển encounter → WAITING_FOR_RESULTS.
     */
    static async create(encounterId: string, data: CreateOrderInput, userId: string): Promise<MedicalOrderRecord> {
        await this.validateEncounterEditable(encounterId);

        /** Validate input */
        if (!data.service_code?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_CODE', ORDER_ERRORS.MISSING_SERVICE_CODE);
        }
        if (!data.order_type?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ORDER_TYPE', ORDER_ERRORS.MISSING_ORDER_TYPE);
        }
        if (!VALID_ORDER_TYPES.includes(data.order_type as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ORDER_TYPE', ORDER_ERRORS.INVALID_ORDER_TYPE);
        }
        if (data.priority && !VALID_PRIORITIES.includes(data.priority as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_PRIORITY', ORDER_ERRORS.INVALID_PRIORITY);
        }

        /** Validate service_code tồn tại */
        const service = await MedicalOrderRepository.findServiceByCode(data.service_code);
        if (!service) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SERVICE_NOT_FOUND', ORDER_ERRORS.SERVICE_NOT_FOUND);
        }

        /** Transaction: tạo order + auto chuyển encounter status */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const order = await MedicalOrderRepository.create(
                encounterId,
                { ...data, service_name: service.name, service_id: service.services_id },
                userId,
                client
            );

            /** Auto chuyển encounter → WAITING_FOR_RESULTS nếu đang IN_PROGRESS */
            const enc = await MedicalOrderRepository.getEncounterStatus(encounterId);
            if (enc.status === 'IN_PROGRESS') {
                await MedicalOrderRepository.updateEncounterStatus(encounterId, 'WAITING_FOR_RESULTS', client);
            }

            await client.query('COMMIT');
            return (await MedicalOrderRepository.findById(order.medical_orders_id))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // API 2 Danh sách chỉ định theo encounter

    static async getByEncounterId(encounterId: string): Promise<MedicalOrderRecord[]> {
        const enc = await MedicalOrderRepository.getEncounterStatus(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', ORDER_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        return MedicalOrderRepository.findByEncounterId(encounterId);
    }

    // API Chi tiết 1 chỉ định + kết quả

    static async getDetail(orderId: string): Promise<{ order: MedicalOrderRecord; result: OrderResultRecord | null }> {
        const order = await this.getOrder(orderId);
        const result = await MedicalOrderRepository.findResultByOrderId(orderId);
        return { order, result };
    }

    //  API 4 Cập nhật chỉ định (notes, priority, clinical_indicator)

    static async update(orderId: string, data: UpdateOrderInput): Promise<MedicalOrderRecord> {
        const order = await this.getOrder(orderId);

        /** Chỉ cho phép cập nhật khi PENDING */
        if (order.status !== ORDER_STATUS.PENDING) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ENCOUNTER_NOT_EDITABLE', 'Chỉ có thể cập nhật chỉ định ở trạng thái PENDING');
        }

        if (data.priority && !VALID_PRIORITIES.includes(data.priority as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_PRIORITY', ORDER_ERRORS.INVALID_PRIORITY);
        }

        const updated = await MedicalOrderRepository.update(orderId, data);
        return (await MedicalOrderRepository.findById(orderId))!;
    }

    // API  Hủy chỉ định

    static async cancel(orderId: string, cancelledReason: string): Promise<MedicalOrderRecord> {
        if (!cancelledReason?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', ORDER_ERRORS.MISSING_CANCEL_REASON);
        }

        const order = await this.getOrder(orderId);

        if (order.status !== ORDER_STATUS.PENDING) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_CANCEL', ORDER_ERRORS.CANNOT_CANCEL);
        }

        await MedicalOrderRepository.updateStatus(orderId, ORDER_STATUS.CANCELLED, cancelledReason);
        return (await MedicalOrderRepository.findById(orderId))!;
    }

    //API Bắt đầu thực hiện chỉ định

    static async start(orderId: string): Promise<MedicalOrderRecord> {
        const order = await this.getOrder(orderId);

        if (order.status !== ORDER_STATUS.PENDING) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_START', ORDER_ERRORS.CANNOT_START);
        }

        await MedicalOrderRepository.updateStatus(orderId, ORDER_STATUS.IN_PROGRESS);
        return (await MedicalOrderRepository.findById(orderId))!;
    }

    // API Ghi kết quả CLS  
    /**
     * KTV ghi kết quả → auto chuyển order status = COMPLETED.
     * Transaction: tạo result + update order status.
     */
    static async createResult(orderId: string, data: CreateOrderResultInput, userId: string): Promise<OrderResultRecord> {
        const order = await this.getOrder(orderId);

        if (order.status !== ORDER_STATUS.IN_PROGRESS) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_ADD_RESULT', ORDER_ERRORS.CANNOT_ADD_RESULT);
        }

        if (!data.result_summary?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_RESULT_SUMMARY', ORDER_ERRORS.MISSING_RESULT_SUMMARY);
        }

        /** Kiểm tra kết quả đã tồn tại chưa */
        const existingResult = await MedicalOrderRepository.findResultByOrderId(orderId);
        if (existingResult) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'RESULT_ALREADY_EXISTS', ORDER_ERRORS.RESULT_ALREADY_EXISTS);
        }

        /** Transaction: tạo result + chuyển order → COMPLETED */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await MedicalOrderRepository.createResult(orderId, data, userId, client);
            await MedicalOrderRepository.updateStatus(orderId, ORDER_STATUS.COMPLETED, undefined, client);

            await client.query('COMMIT');
            return (await MedicalOrderRepository.findResultByOrderId(orderId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    //API  Cập nhật kết quả CLS

    static async updateResult(orderId: string, data: UpdateOrderResultInput): Promise<OrderResultRecord> {
        const order = await this.getOrder(orderId);

        if (order.status !== ORDER_STATUS.COMPLETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'RESULT_NOT_FOUND', ORDER_ERRORS.RESULT_NOT_FOUND);
        }

        const existingResult = await MedicalOrderRepository.findResultByOrderId(orderId);
        if (!existingResult) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'RESULT_NOT_FOUND', ORDER_ERRORS.RESULT_NOT_FOUND);
        }

        await MedicalOrderRepository.updateResult(orderId, data);
        return (await MedicalOrderRepository.findResultByOrderId(orderId))!;
    }

    //API Lịch sử chỉ định theo bệnh nhân

    static async getByPatientId(
        patientId: string,
        page: number,
        limit: number,
        orderType?: string,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: MedicalOrderRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const exists = await MedicalOrderRepository.patientExists(patientId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', ORDER_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, ORDER_CONFIG.MAX_LIMIT);
        const result = await MedicalOrderRepository.findByPatientId(patientId, page, safeLimit, orderType, status, fromDate, toDate);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    // API  Dashboard chỉ định chờ thực hiện

    static async getPending(
        status: string,
        orderType?: string,
        priority?: string,
        page: number = ORDER_CONFIG.DEFAULT_PAGE,
        limit: number = ORDER_CONFIG.DEFAULT_LIMIT
    ): Promise<{ data: MedicalOrderRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const safeLimit = Math.min(limit, ORDER_CONFIG.MAX_LIMIT);
        const result = await MedicalOrderRepository.findPending(status || 'PENDING', orderType, priority, page, safeLimit);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    // API Tìm kiếm dịch vụ CLS

    static async searchServices(query: string, serviceType?: string): Promise<ServiceSearchResult[]> {
        return MedicalOrderRepository.searchServices(query, serviceType);
    }

    // API Tóm tắt chỉ định + kết quả

    static async getSummary(encounterId: string): Promise<OrderSummaryItem[]> {
        const enc = await MedicalOrderRepository.getEncounterStatus(encounterId);
        if (!enc.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', ORDER_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        return MedicalOrderRepository.getSummary(encounterId);
    }
}
