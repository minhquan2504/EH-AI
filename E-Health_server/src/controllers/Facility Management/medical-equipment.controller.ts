import { Request, Response, NextFunction } from 'express';
import { MedicalEquipmentService } from '../../services/Facility Management/medical-equipment.service';
import { MaintenanceLogService } from '../../services/Facility Management/maintenance-log.service';
import {
    CreateEquipmentInput,
    UpdateEquipmentInput,
    AssignRoomInput,
    CreateMaintenanceLogInput,
    UpdateMaintenanceLogInput
} from '../../models/Facility Management/medical-equipment.model';
import { EQUIPMENT_CONFIG } from '../../constants/medical-equipment.constant';

export class MedicalEquipmentController {
    /**
     * Lấy danh sách thiết bị y tế
     */
    static async getEquipments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                facility_id, branch_id, room_id, status, search,
                page, limit
            } = req.query as Record<string, string>;

            const data = await MedicalEquipmentService.getEquipments(
                facility_id,
                branch_id,
                room_id,
                status,
                search,
                page ? parseInt(page) : EQUIPMENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : EQUIPMENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết thiết bị
     */
    static async getEquipmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await MedicalEquipmentService.getEquipmentById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới thiết bị
     */
    static async createEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateEquipmentInput = req.body;
            const data = await MedicalEquipmentService.createEquipment(input);
            res.status(201).json({
                success: true,
                message: 'Tạo thiết bị y tế thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin thiết bị
     */
    static async updateEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateEquipmentInput = req.body;
            const data = await MedicalEquipmentService.updateEquipment(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thiết bị thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái thiết bị
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };
            const data = await MedicalEquipmentService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái thiết bị thành: ${status}.`,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán / thu hồi phòng cho thiết bị
     */
    static async assignRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: AssignRoomInput = req.body;
            const data = await MedicalEquipmentService.assignRoom(id, input);
            res.status(200).json({
                success: true,
                message: input.room_id
                    ? 'Đã gán thiết bị vào phòng thành công.'
                    : 'Đã thu hồi thiết bị về kho thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm thiết bị
     */
    static async deleteEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await MedicalEquipmentService.deleteEquipment(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa thiết bị thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== MAINTENANCE LOGS ====================

    /**
     * Lấy lịch sử bảo trì của thiết bị
     */
    static async getMaintenanceLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { page, limit } = req.query as Record<string, string>;

            const data = await MaintenanceLogService.getLogsByEquipmentId(
                id,
                page ? parseInt(page) : EQUIPMENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : EQUIPMENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới log bảo trì
     */
    static async createMaintenanceLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: CreateMaintenanceLogInput = req.body;
            const data = await MaintenanceLogService.createLog(id, input);
            res.status(201).json({
                success: true,
                message: 'Tạo bản ghi bảo trì thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật log bảo trì
     */
    static async updateMaintenanceLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params as { logId: string };
            const input: UpdateMaintenanceLogInput = req.body;
            const data = await MaintenanceLogService.updateLog(logId, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật bản ghi bảo trì thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa log bảo trì
     */
    static async deleteMaintenanceLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params as { logId: string };
            await MaintenanceLogService.deleteLog(logId);
            res.status(200).json({
                success: true,
                message: 'Đã xóa bản ghi bảo trì thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
