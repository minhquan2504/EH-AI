import { randomUUID } from 'crypto';
import { MaintenanceLogRepository } from '../../repository/Facility Management/maintenance-log.repository';
import { MedicalEquipmentRepository } from '../../repository/Facility Management/medical-equipment.repository';
import {
    EquipmentMaintenanceLog,
    CreateMaintenanceLogInput,
    UpdateMaintenanceLogInput,
    PaginatedMaintenanceLogs
} from '../../models/Facility Management/medical-equipment.model';
import {
    EQUIPMENT_ERRORS,
    MAINTENANCE_LOG_ERRORS,
    EQUIPMENT_CONFIG,
    VALID_MAINTENANCE_TYPES,
    MAINTENANCE_TYPE,
    EQUIPMENT_STATUS
} from '../../constants/medical-equipment.constant';

export class MaintenanceLogService {
    /**
     * Tạo ID chuẩn cho log bảo trì
     */
    private static generateLogId(): string {
        return `EML_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /**
     * Lấy lịch sử bảo trì của thiết bị (phân trang)
     */
    static async getLogsByEquipmentId(
        equipmentId: string,
        page: number = EQUIPMENT_CONFIG.DEFAULT_PAGE,
        limit: number = EQUIPMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedMaintenanceLogs> {
        // Kiểm tra thiết bị tồn tại
        const equipment = await MedicalEquipmentRepository.getEquipmentById(equipmentId);
        if (!equipment) {
            throw EQUIPMENT_ERRORS.NOT_FOUND;
        }

        const safeLimit = Math.min(limit, EQUIPMENT_CONFIG.MAX_LIMIT);
        return await MaintenanceLogRepository.getLogsByEquipmentId(equipmentId, page, safeLimit);
    }

    /**
     * Tạo mới log bảo trì cho thiết bị
     * Nếu loại là REPAIR và thiết bị đang BROKEN → tự động chuyển status thành ACTIVE
     */
    static async createLog(equipmentId: string, input: CreateMaintenanceLogInput): Promise<EquipmentMaintenanceLog> {
        // Kiểm tra thiết bị tồn tại
        const equipment = await MedicalEquipmentRepository.getEquipmentById(equipmentId);
        if (!equipment) {
            throw EQUIPMENT_ERRORS.NOT_FOUND;
        }

        // Validate loại bảo trì
        if (!VALID_MAINTENANCE_TYPES.includes(input.maintenance_type as any)) {
            throw MAINTENANCE_LOG_ERRORS.INVALID_TYPE;
        }

        const logId = this.generateLogId();
        const log = await MaintenanceLogRepository.createLog(logId, equipmentId, input);

        // Tự động chuyển trạng thái thiết bị khi sửa chữa xong (BROKEN → ACTIVE)
        if (
            input.maintenance_type === MAINTENANCE_TYPE.REPAIR &&
            equipment.status === EQUIPMENT_STATUS.BROKEN
        ) {
            await MedicalEquipmentRepository.updateStatus(equipmentId, EQUIPMENT_STATUS.ACTIVE);
        }

        return log;
    }

    /**
     * Cập nhật log bảo trì
     */
    static async updateLog(logId: string, input: UpdateMaintenanceLogInput): Promise<EquipmentMaintenanceLog> {
        const log = await MaintenanceLogRepository.getLogById(logId);
        if (!log) {
            throw MAINTENANCE_LOG_ERRORS.NOT_FOUND;
        }

        // Validate loại bảo trì nếu được cập nhật
        if (input.maintenance_type && !VALID_MAINTENANCE_TYPES.includes(input.maintenance_type as any)) {
            throw MAINTENANCE_LOG_ERRORS.INVALID_TYPE;
        }

        return await MaintenanceLogRepository.updateLog(logId, input);
    }

    /**
     * Xóa log bảo trì
     */
    static async deleteLog(logId: string): Promise<void> {
        const log = await MaintenanceLogRepository.getLogById(logId);
        if (!log) {
            throw MAINTENANCE_LOG_ERRORS.NOT_FOUND;
        }
        await MaintenanceLogRepository.deleteLog(logId);
    }
}
