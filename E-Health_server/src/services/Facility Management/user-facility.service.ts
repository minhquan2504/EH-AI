import { AssignUserFacilityInput, UserFacilityInfo } from "../../models/Facility Management/facility.model";
import { UserFacilityRepository } from "../../repository/Facility Management/user-facility.repository";
import { UserRepository } from "../../repository/Core/user.repository";
import { AppError } from '../../utils/app-error.util';

export class UserFacilityService {
    /**
     * Lấy danh sách chi nhánh (kèm cơ sở gốc) mà user đang công tác
     */
    static async getUserFacilities(userId: string): Promise<UserFacilityInfo[]> {
        // Kiểm tra user tồn tại
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }

        return await UserFacilityRepository.getUserFacilities(userId);
    }

    /**
     * Gán user vào chi nhánh / phòng ban
     */
    static async assignUserToFacility(
        userId: string,
        data: AssignUserFacilityInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        // Kiểm tra user tồn tại
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }

        // Kiểm tra chi nhánh tồn tại
        const branchExists = await UserFacilityRepository.checkBranchExists(data.branchId);
        if (!branchExists) {
            throw new AppError(400, 'BRANCH_NOT_FOUND', 'Chi nhánh không tồn tại');
        }

        // Kiểm tra department (nếu có truyền) phải thuộc chi nhánh đó
        if (data.departmentId) {
            const deptExists = await UserFacilityRepository.checkDepartmentExists(data.departmentId, data.branchId);
            if (!deptExists) {
                throw new AppError(400, 'DEPARTMENT_NOT_FOUND', 'Khoa/Phòng ban không tồn tại trong Chi nhánh này');
            }
        }

        return await UserFacilityRepository.assignUserToFacility(userId, data, adminId, ipAddress, userAgent);
    }

    /**
     * Xóa user khỏi chi nhánh
     */
    static async removeUserFromFacility(
        userId: string,
        branchId: string,
        reason: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        // Kiểm tra user tồn tại
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }

        const isRemoved = await UserFacilityRepository.removeUserFromFacility(userId, branchId, reason, adminId, ipAddress, userAgent);
        if (!isRemoved) {
            throw new AppError(400, 'BAD_REQUEST', "Người dùng không thuộc Chi nhánh này");
        }

        return true;
    }

    /**
     * Thuyên chuyển nhân sự
     */
    static async transferUserToFacility(
        userId: string,
        oldBranchId: string,
        newData: AssignUserFacilityInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<boolean> {
        // Kiểm tra user tồn tại
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }

        // Kiểm tra chi nhánh mới tồn tại
        const branchExists = await UserFacilityRepository.checkBranchExists(newData.branchId);
        if (!branchExists) {
            throw new AppError(400, 'BRANCH_NOT_FOUND', 'Chi nhánh mới không tồn tại');
        }

        // Kiểm tra department mới (nếu có)
        if (newData.departmentId) {
            const deptExists = await UserFacilityRepository.checkDepartmentExists(newData.departmentId, newData.branchId);
            if (!deptExists) {
                throw new AppError(400, 'DEPARTMENT_NOT_FOUND', 'Khoa/Phòng ban không tồn tại trong Chi nhánh mới này');
            }
        }

        const isTransferred = await UserFacilityRepository.transferUserToFacility(
            userId, oldBranchId, newData, adminId, ipAddress, userAgent
        );

        if (!isTransferred) {
            throw new AppError(400, 'BAD_REQUEST', "Người dùng hiện không thuộc Chi nhánh nguồn");
        }

        return true;
    }
}
