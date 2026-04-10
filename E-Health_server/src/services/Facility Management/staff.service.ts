import { StaffRepository } from '../../repository/Facility Management/staff.repository';
import { CreateStaffInput, UpdateStaffInput } from '../../models/Facility Management/staff.model';
import { UserService } from './user.service';
import { UserFacilityService } from './user-facility.service';
import { AppError } from '../../utils/app-error.util';

export class StaffService {
    /**
     * Lấy danh sách nhân sự (có phân trang/lọc)
     */
    static async getStaffs(filter: any) {
        return await StaffRepository.getStaffs(filter);
    }

    /**
     * Lấy chi tiết nhân sự
     */
    static async getStaffById(userId: string) {
        const staff = await StaffRepository.getStaffById(userId);
        if (!staff) {
            throw new AppError(404, 'STAFF_NOT_FOUND', 'Không tìm thấy thông tin nhân sự.');
        }
        return staff;
    }

    /**
     * Tạo hồ sơ nhân sự mới
     */
    static async createStaff(
        data: CreateStaffInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<{ userId: string }> {
        // Tạo user và profile
        const createData: any = { ...data };
        if (data.dob) {
            createData.dob = new Date(data.dob);
        }

        const result = await UserService.createUser(createData, adminId, ipAddress, userAgent);
        const newUserId = result.userId;

        // Nếu có truyền thông tin phân bổ cơ sở, gán liền
        if (data.branch_id) {
            await UserFacilityService.assignUserToFacility(
                newUserId,
                {
                    branchId: data.branch_id,
                    departmentId: data.department_id,
                    roleTitle: data.role_title || 'Nhân viên mới'
                },
                adminId, ipAddress, userAgent
            );
        }

        return { userId: newUserId };
    }

    /**
     * Cập nhật thông tin cơ bản nhân sự
     */
    static async updateStaff(
        userId: string,
        data: UpdateStaffInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        // Kiểm tra tồn tại
        await this.getStaffById(userId);

        // Tách thông tin phân bổ cơ sở ra khỏi dữ liệu cập nhật user
        const { branch_id, department_id, role_title, ...userData } = data;

        // Cập nhật thông tin cơ bản (email, phone, profile...)
        if (Object.keys(userData).length > 0) {
            await UserService.updateUser(userId, { ...userData } as any, adminId, ipAddress, userAgent);
        }

        // Nếu có truyền branch_id, cập nhật phân bổ cơ sở
        if (branch_id) {
            await UserFacilityService.assignUserToFacility(
                userId,
                {
                    branchId: branch_id,
                    departmentId: department_id,
                    roleTitle: role_title || 'Nhân viên'
                },
                adminId, ipAddress, userAgent
            );
        }
    }

    /**
     * Cập nhật ảnh chữ ký
     */
    static async updateSignature(userId: string, signatureUrl: string | null): Promise<void> {
        // Kiểm tra tồn tại
        await this.getStaffById(userId);

        const updated = await StaffRepository.updateSignature(userId, signatureUrl);
        if (!updated) {
            throw new AppError(500, 'UPDATE_FAILED', 'Lỗi khi cập nhật ảnh chữ ký.');
        }
    }
}
