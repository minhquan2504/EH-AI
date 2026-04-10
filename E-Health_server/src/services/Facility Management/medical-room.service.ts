import { MedicalRoomRepository } from '../../repository/Facility Management/medical-room.repository';
import { BranchRepository } from '../../repository/Facility Management/branch.repository';
import { DepartmentRepository } from '../../repository/Facility Management/department.repository';
import { CreateMedicalRoomInput, MedicalRoomDropdown, MedicalRoomInfo, MedicalRoomQuery, UpdateMedicalRoomInput } from '../../models/Facility Management/medical-room.model';
import { MedicalRoomStatus, MedicalRoomType, ROOM_ERRORS, ROOM_MESSAGES } from '../../constants/medical-room.constant';
import { AppError } from '../../utils/app-error.util';

export class MedicalRoomService {
    /**
     * Lấy Dropdown phòng
     */
    static async getDropdown(branchId?: string, departmentId?: string): Promise<MedicalRoomDropdown[]> {
        return MedicalRoomRepository.getDropdownList(branchId, departmentId);
    }

    /**
     * Lấy danh sách phân trang và tìm kiếm
     */
    static async getList(params: MedicalRoomQuery): Promise<{ items: MedicalRoomInfo[], total: number }> {
        return MedicalRoomRepository.getMedicalRooms(params);
    }

    /**
     * Lấy chi tiết phòng
     */
    static async getDetail(id: string): Promise<MedicalRoomInfo> {
        const room = await MedicalRoomRepository.getById(id);
        if (!room) {
            throw new AppError(
                ROOM_ERRORS.NOT_FOUND.httpCode,
                ROOM_ERRORS.NOT_FOUND.message,
                ROOM_ERRORS.NOT_FOUND.code
            );
        }
        return room;
    }

    /**
     * Thêm mới phòng
     */
    static async createRoom(data: CreateMedicalRoomInput) {
        // 1. Validate: Branch phải tồn tại
        const branchExists = await BranchRepository.findBranchById(data.branch_id);
        if (!branchExists) {
            throw new AppError(
                ROOM_ERRORS.BRANCH_NOT_FOUND.httpCode,
                ROOM_ERRORS.BRANCH_NOT_FOUND.message,
                ROOM_ERRORS.BRANCH_NOT_FOUND.code
            );
        }

        // 2. Validate: Nếu có truyền Department thì Department đó phải tồn tại
        if (data.department_id) {
            const department = await DepartmentRepository.findDepartmentById(data.department_id);
            if (!department) {
                throw new AppError(
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.httpCode,
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.message,
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.code
                );
            }

            // Phòng và Khoa phải có chung 1 Branch_id cha
            if (department.branch_id !== data.branch_id) {
                throw new AppError(
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.httpCode,
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.message,
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.code
                );
            }
        }

        // 3. Validate: Code không được trùng trong cùng Branch
        const codeExists = await MedicalRoomRepository.checkCodeExists(data.branch_id, data.code);
        if (codeExists) {
            throw new AppError(
                ROOM_ERRORS.CODE_EXISTS.httpCode,
                ROOM_ERRORS.CODE_EXISTS.message,
                ROOM_ERRORS.CODE_EXISTS.code
            );
        }

        // 4. Validate Room Type (nếu có truyền)
        if (data.room_type && !Object.values(MedicalRoomType).includes(data.room_type as MedicalRoomType)) {
            data.room_type = MedicalRoomType.CONSULTATION; // Default dự phòng
        }

        // Chạy insert
        const newId = await MedicalRoomRepository.create({
            ...data,
            room_type: data.room_type || MedicalRoomType.CONSULTATION,
            capacity: data.capacity && data.capacity > 0 ? data.capacity : 1
        });

        return {
            message: ROOM_MESSAGES.CREATE_SUCCESS,
            data: { medical_room_id: newId }
        };
    }

    /**
     * Cập nhật khối thông tin phòng
     */
    static async updateRoom(id: string, data: UpdateMedicalRoomInput & { code?: string, branch_id?: string }) {
        // 0. Xác minh phòng tồn tại
        const room = await MedicalRoomRepository.getById(id);
        if (!room) {
            throw new AppError(
                ROOM_ERRORS.NOT_FOUND.httpCode,
                ROOM_ERRORS.NOT_FOUND.message,
                ROOM_ERRORS.NOT_FOUND.code
            );
        }

        // Block cố tình sửa Code hoặc Branch
        if (data.code || data.branch_id) {
            throw new AppError(
                ROOM_ERRORS.CODE_IMMUTABLE.httpCode,
                ROOM_ERRORS.CODE_IMMUTABLE.message,
                ROOM_ERRORS.CODE_IMMUTABLE.code
            );
        }

        // 1. Validate nếu đổi Department
        if (data.department_id !== undefined && data.department_id !== null) {
            const department = await DepartmentRepository.findDepartmentById(data.department_id);
            if (!department) {
                throw new AppError(
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.httpCode,
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.message,
                    ROOM_ERRORS.DEPARTMENT_NOT_FOUND.code
                );
            }
            if (department.branch_id !== room.branch_id) {
                throw new AppError(
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.httpCode,
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.message,
                    ROOM_ERRORS.DEPARTMENT_NOT_IN_BRANCH.code
                );
            }
        }

        // Chạy lệnh cập nhật (Tự bỏ bớt những object có undefined ở repo)
        await MedicalRoomRepository.update(id, data);

        return { message: ROOM_MESSAGES.UPDATE_SUCCESS };
    }

    /**
     * Thay đổi trạng thái
     */
    static async changeStatus(id: string, status: string) {
        if (!Object.values(MedicalRoomStatus).includes(status as MedicalRoomStatus)) {
            throw new AppError(
                ROOM_ERRORS.INVALID_STATUS.httpCode,
                ROOM_ERRORS.INVALID_STATUS.message,
                ROOM_ERRORS.INVALID_STATUS.code
            );
        }

        const room = await MedicalRoomRepository.getById(id);
        if (!room) {
            throw new AppError(
                ROOM_ERRORS.NOT_FOUND.httpCode,
                ROOM_ERRORS.NOT_FOUND.message,
                ROOM_ERRORS.NOT_FOUND.code
            );
        }

        await MedicalRoomRepository.updateStatus(id, status);
        return { message: ROOM_MESSAGES.STATUS_UPDATE_SUCCESS };
    }

    /**
     * Xóa mềm phòng (Soft Delete)
     */
    static async deleteRoom(id: string) {
        const room = await MedicalRoomRepository.getById(id);
        if (!room) {
            throw new AppError(
                ROOM_ERRORS.NOT_FOUND.httpCode,
                ROOM_ERRORS.NOT_FOUND.message,
                ROOM_ERRORS.NOT_FOUND.code
            );
        }

        await MedicalRoomRepository.softDelete(id);

        return { message: ROOM_MESSAGES.DELETE_SUCCESS };
    }
}
