import { randomUUID } from 'crypto';
import { MedicalEquipmentRepository } from '../../repository/Facility Management/medical-equipment.repository';
import {
    MedicalEquipment,
    CreateEquipmentInput,
    UpdateEquipmentInput,
    PaginatedEquipments,
    AssignRoomInput
} from '../../models/Facility Management/medical-equipment.model';
import {
    EQUIPMENT_ERRORS,
    EQUIPMENT_CONFIG,
    VALID_EQUIPMENT_STATUSES
} from '../../constants/medical-equipment.constant';

export class MedicalEquipmentService {
    /**
     * Tạo ID chuẩn cho thiết bị
     */
    private static generateEquipmentId(): string {
        return `EQ_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /**
     * Lấy danh sách thiết bị y tế (có phân trang, lọc)
     */
    static async getEquipments(
        facilityId?: string,
        branchId?: string,
        roomId?: string,
        status?: string,
        search?: string,
        page: number = EQUIPMENT_CONFIG.DEFAULT_PAGE,
        limit: number = EQUIPMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedEquipments> {
        const safeLimit = Math.min(limit, EQUIPMENT_CONFIG.MAX_LIMIT);
        return await MedicalEquipmentRepository.getEquipments(
            facilityId, branchId, roomId, status, search, page, safeLimit
        );
    }

    /**
     * Lấy chi tiết thiết bị theo ID
     */
    static async getEquipmentById(id: string): Promise<MedicalEquipment> {
        const equipment = await MedicalEquipmentRepository.getEquipmentById(id);
        if (!equipment) {
            throw EQUIPMENT_ERRORS.NOT_FOUND;
        }
        return equipment;
    }

    /**
     * Tạo mới thiết bị y tế
     * Validate: facility tồn tại, branch thuộc facility, code chưa trùng, room hợp lệ (nếu có)
     */
    static async createEquipment(input: CreateEquipmentInput): Promise<MedicalEquipment> {
        // Kiểm tra cơ sở tồn tại
        const facilityExists = await MedicalEquipmentRepository.checkFacilityExists(input.facility_id);
        if (!facilityExists) {
            throw EQUIPMENT_ERRORS.FACILITY_NOT_FOUND;
        }

        // Kiểm tra chi nhánh thuộc cơ sở
        const branchBelongs = await MedicalEquipmentRepository.checkBranchBelongsToFacility(input.branch_id, input.facility_id);
        if (!branchBelongs) {
            throw EQUIPMENT_ERRORS.BRANCH_NOT_FOUND;
        }

        // Kiểm tra mã tài sản trùng
        const codeExists = await MedicalEquipmentRepository.checkCodeExists(input.code);
        if (codeExists) {
            throw EQUIPMENT_ERRORS.CODE_ALREADY_EXISTS;
        }

        // Kiểm tra phòng hợp lệ (nếu có)
        if (input.current_room_id) {
            const roomBelongs = await MedicalEquipmentRepository.checkRoomBelongsToBranch(input.current_room_id, input.branch_id);
            if (!roomBelongs) {
                throw EQUIPMENT_ERRORS.ROOM_NOT_FOUND;
            }
        }

        // Validate status nếu được truyền vào
        if (input.status && !VALID_EQUIPMENT_STATUSES.includes(input.status as any)) {
            throw EQUIPMENT_ERRORS.INVALID_STATUS;
        }

        const newId = this.generateEquipmentId();
        return await MedicalEquipmentRepository.createEquipment(newId, input);
    }

    /**
     * Cập nhật thông tin thiết bị (tên, serial, hãng SX, ngày...)
     */
    static async updateEquipment(id: string, input: UpdateEquipmentInput): Promise<MedicalEquipment> {
        await this.getEquipmentById(id);
        return await MedicalEquipmentRepository.updateEquipment(id, input);
    }

    /**
     * Cập nhật trạng thái thiết bị
     * Validate giá trị status hợp lệ trước khi cập nhật
     */
    static async updateStatus(id: string, status: string): Promise<MedicalEquipment> {
        await this.getEquipmentById(id);

        if (!VALID_EQUIPMENT_STATUSES.includes(status as any)) {
            throw EQUIPMENT_ERRORS.INVALID_STATUS;
        }

        return await MedicalEquipmentRepository.updateStatus(id, status);
    }

    /**
     * Gán thiết bị vào phòng chức năng hoặc thu hồi về kho (room_id = null)
     * Validate: phòng phải thuộc cùng chi nhánh với thiết bị
     */
    static async assignRoom(id: string, input: AssignRoomInput): Promise<MedicalEquipment> {
        const equipment = await this.getEquipmentById(id);

        if (input.room_id !== null) {
            const roomBelongs = await MedicalEquipmentRepository.checkRoomBelongsToBranch(input.room_id, equipment.branch_id);
            if (!roomBelongs) {
                throw EQUIPMENT_ERRORS.ROOM_NOT_FOUND;
            }
        }

        return await MedicalEquipmentRepository.assignRoom(id, input.room_id);
    }

    /**
     * Xóa mềm thiết bị
     */
    static async deleteEquipment(id: string): Promise<void> {
        await this.getEquipmentById(id);
        await MedicalEquipmentRepository.softDeleteEquipment(id);
    }
}
