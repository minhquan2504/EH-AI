import { UserLicenseRepository } from '../../repository/Facility Management/user-license.repository';
import { CreateLicenseInput, UpdateLicenseInput } from '../../models/Facility Management/staff.model';
import { AppError } from '../../utils/app-error.util';
import { StaffRepository } from '../../repository/Facility Management/staff.repository';

export class UserLicenseService {
    /**
     * Lấy danh sách bằng cấp / chứng chỉ theo user
     */
    static async getLicensesByUserId(userId: string) {
        // Kiểm tra xem user có tồn tại ko
        const staff = await StaffRepository.getStaffById(userId);
        if (!staff) {
            throw new AppError(404, 'STAFF_NOT_FOUND', 'Không tìm thấy thông tin nhân sự.');
        }

        return await UserLicenseRepository.getLicensesByUserId(userId);
    }

    /**
     * Lấy chi tiết chứng chỉ
     */
    static async getLicenseById(licenseId: string) {
        const license = await UserLicenseRepository.getLicenseById(licenseId);
        if (!license) {
            throw new AppError(404, 'LICENSE_NOT_FOUND', 'Không tìm thấy chứng chỉ này.');
        }
        return license;
    }

    /**
     * Thêm chứng chỉ
     */
    static async createLicense(userId: string, data: CreateLicenseInput): Promise<{ licenseId: string }> {
        // Kiểm tra tồn tại user
        const staff = await StaffRepository.getStaffById(userId);
        if (!staff) {
            throw new AppError(404, 'STAFF_NOT_FOUND', 'Không tìm thấy thông tin nhân sự.');
        }

        // Validate nghiệp vụ
        const isExists = await UserLicenseRepository.checkLicenseNumberExists(data.license_number);
        if (isExists) {
            throw new AppError(400, 'LICENSE_EXISTS', 'Số chứng chỉ/giấy phép này đã tồn tại trong hệ thống.');
        }

        // Insert
        const licenseId = await UserLicenseRepository.createLicense(userId, data);
        return { licenseId };
    }

    /**
     * Cập nhật chứng chỉ
     */
    static async updateLicense(licenseId: string, data: UpdateLicenseInput): Promise<void> {
        // Kiểm tra tồn tại
        const license = await this.getLicenseById(licenseId);

        // Nếu đổi số chứng chỉ -> check trùng
        if (data.license_number && data.license_number !== license.license_number) {
            const isExists = await UserLicenseRepository.checkLicenseNumberExists(data.license_number, licenseId);
            if (isExists) {
                throw new AppError(400, 'LICENSE_EXISTS', 'Số chứng chỉ/giấy phép này đã thuộc về đăng ký khác.');
            }
        }

        // Update
        const updated = await UserLicenseRepository.updateLicense(licenseId, data);
        if (!updated) {
            throw new AppError(500, 'UPDATE_FAILED', 'Cập nhật chứng chỉ thất bại.');
        }
    }

    /**
     * Xóa chứng chỉ
     */
    static async deleteLicense(licenseId: string): Promise<void> {
        await this.getLicenseById(licenseId);
        await UserLicenseRepository.deleteLicense(licenseId);
    }
}
