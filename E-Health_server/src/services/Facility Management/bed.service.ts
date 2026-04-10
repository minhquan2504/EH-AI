import { randomUUID } from 'crypto';
import { BedRepository } from '../../repository/Facility Management/bed.repository';
import {
    Bed,
    CreateBedInput,
    UpdateBedInput,
    AssignBedInput,
    PaginatedBeds
} from '../../models/Facility Management/bed.model';
import {
    BED_ERRORS,
    BED_CONFIG,
    VALID_BED_STATUSES,
    VALID_BED_TYPES,
    BED_STATUS,
    BED_STATUS_TRANSITIONS
} from '../../constants/bed.constant';


export class BedService {
    /**
     * Tạo ID chuẩn cho giường bệnh
     */
    private static generateBedId(): string {
        return `BED_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /**
     * Lấy danh sách giường bệnh (có phân trang, lọc)
     */
    static async getBeds(
        facilityId?: string,
        branchId?: string,
        departmentId?: string,
        roomId?: string,
        type?: string,
        status?: string,
        search?: string,
        page: number = BED_CONFIG.DEFAULT_PAGE,
        limit: number = BED_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedBeds> {
        const safeLimit = Math.min(limit, BED_CONFIG.MAX_LIMIT);
        return await BedRepository.getBeds(
            facilityId, branchId, departmentId, roomId, type, status, search, page, safeLimit
        );
    }

    /**
     * Lấy chi tiết giường theo ID
     */
    static async getBedById(id: string): Promise<Bed> {
        const bed = await BedRepository.getBedById(id);
        if (!bed) {
            throw BED_ERRORS.NOT_FOUND;
        }
        return bed;
    }

    /**
     * Tạo mới giường bệnh
     */
    static async createBed(input: CreateBedInput): Promise<Bed> {
        // Kiểm tra cơ sở tồn tại
        const facilityExists = await BedRepository.checkFacilityExists(input.facility_id);
        if (!facilityExists) {
            throw BED_ERRORS.FACILITY_NOT_FOUND;
        }

        // Kiểm tra chi nhánh thuộc cơ sở
        const branchBelongs = await BedRepository.checkBranchBelongsToFacility(input.branch_id, input.facility_id);
        if (!branchBelongs) {
            throw BED_ERRORS.BRANCH_NOT_FOUND;
        }

        // Kiểm tra mã giường trùng trong cùng chi nhánh
        const codeExists = await BedRepository.checkCodeExistsInBranch(input.code, input.branch_id);
        if (codeExists) {
            throw BED_ERRORS.CODE_ALREADY_EXISTS;
        }

        // Kiểm tra khoa hợp lệ (nếu có)
        if (input.department_id) {
            const deptBelongs = await BedRepository.checkDepartmentBelongsToBranch(input.department_id, input.branch_id);
            if (!deptBelongs) {
                throw BED_ERRORS.DEPARTMENT_NOT_FOUND;
            }
        }

        // Kiểm tra phòng hợp lệ (nếu có)
        if (input.room_id) {
            const roomBelongs = await BedRepository.checkRoomBelongsToBranch(input.room_id, input.branch_id);
            if (!roomBelongs) {
                throw BED_ERRORS.ROOM_NOT_FOUND;
            }
        }

        // Validate type
        if (input.type && !VALID_BED_TYPES.includes(input.type as any)) {
            throw BED_ERRORS.INVALID_TYPE;
        }

        // Validate status
        if (input.status && !VALID_BED_STATUSES.includes(input.status as any)) {
            throw BED_ERRORS.INVALID_STATUS;
        }

        const newId = this.generateBedId();
        return await BedRepository.createBed(newId, input);
    }

    /**
     * Cập nhật thông tin giường (tên, mã, loại, mô tả)
     */
    static async updateBed(id: string, input: UpdateBedInput): Promise<Bed> {
        const bed = await this.getBedById(id);

        // Nếu đổi mã, kiểm tra trùng trong cùng chi nhánh
        if (input.code && input.code !== bed.code) {
            const codeExists = await BedRepository.checkCodeExistsInBranch(input.code, bed.branch_id, id);
            if (codeExists) {
                throw BED_ERRORS.CODE_ALREADY_EXISTS;
            }
        }

        // Validate type nếu đổi
        if (input.type && !VALID_BED_TYPES.includes(input.type as any)) {
            throw BED_ERRORS.INVALID_TYPE;
        }

        return await BedRepository.updateBed(id, input);
    }

    /**
     * Cập nhật trạng thái giường theo luồng nghiệp vụ
     */
    static async updateStatus(id: string, newStatus: string): Promise<Bed> {
        const bed = await this.getBedById(id);

        if (!VALID_BED_STATUSES.includes(newStatus as any)) {
            throw BED_ERRORS.INVALID_STATUS;
        }

        // Kiểm tra luồng chuyển trạng thái hợp lệ
        const allowedTransitions = BED_STATUS_TRANSITIONS[bed.status] || [];
        if (!allowedTransitions.includes(newStatus)) {
            throw {
                ...BED_ERRORS.INVALID_STATUS_TRANSITION,
                message: `Không thể chuyển từ "${bed.status}" sang "${newStatus}". Các trạng thái hợp lệ: ${allowedTransitions.join(', ')}.`,
            };
        }

        return await BedRepository.updateStatus(id, newStatus);
    }

    /**
     * Gán giường vào phòng/khoa mới hoặc thu hồi (truyền null)
     */
    static async assignBed(id: string, input: AssignBedInput): Promise<Bed> {
        const bed = await this.getBedById(id);

        let departmentId = input.department_id !== undefined ? input.department_id : bed.department_id;
        let roomId = input.room_id !== undefined ? input.room_id : bed.room_id;

        // Validate khoa thuộc chi nhánh
        if (departmentId) {
            const deptBelongs = await BedRepository.checkDepartmentBelongsToBranch(departmentId, bed.branch_id);
            if (!deptBelongs) {
                throw BED_ERRORS.DEPARTMENT_NOT_FOUND;
            }
        }

        // Validate phòng thuộc chi nhánh
        if (roomId) {
            const roomBelongs = await BedRepository.checkRoomBelongsToBranch(roomId, bed.branch_id);
            if (!roomBelongs) {
                throw BED_ERRORS.ROOM_NOT_FOUND;
            }
        }

        return await BedRepository.assignBed(id, departmentId, roomId);
    }

    /**
     * Xóa mềm giường bệnh
     */
    static async deleteBed(id: string): Promise<void> {
        const bed = await this.getBedById(id);

        if (bed.status === BED_STATUS.OCCUPIED) {
            throw BED_ERRORS.CANNOT_DELETE_OCCUPIED;
        }

        await BedRepository.softDeleteBed(id);
    }
}
