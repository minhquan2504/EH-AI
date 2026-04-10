// src/services/Facility Management/license.service.ts
import { LicenseRepository } from '../../repository/Facility Management/license.repository';
import { CreateLicenseInput, UpdateLicenseInput, UserLicense } from '../../models/Facility Management/license.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { CLOUDINARY_CONFIG, LICENSE_CONFIG, LICENSE_UPLOAD_ERRORS } from '../../constants/system.constant';
import { v2 as cloudinary } from 'cloudinary';

// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class LicenseService {

    /**
     * Tạo giấy phép mới
     */
    static async createLicense(data: CreateLicenseInput): Promise<UserLicense> {
        // Validate ngày cấp không lớn hơn ngày hết hạn
        if (data.expiry_date && new Date(data.issue_date) > new Date(data.expiry_date)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', 'Ngày cấp (issue_date) không được lớn hơn ngày hết hạn (expiry_date).');
        }

        // Validate license_number không trùng
        const existing = await LicenseRepository.findByLicenseNumber(data.license_number);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'DUPLICATE_LICENSE_NUMBER', `Số giấy phép "${data.license_number}" đã tồn tại trong hệ thống.`);
        }

        return await LicenseRepository.create(data);
    }

    /**
     * Lấy danh sách giấy phép (có filter)
     */
    static async getLicenses(filters: { user_id?: string; license_type?: string; expiring_in_days?: number }): Promise<UserLicense[]> {
        return await LicenseRepository.findAll(filters);
    }

    /**
     * Xem chi tiết 1 giấy phép
     */
    static async getLicenseById(id: string): Promise<UserLicense> {
        const license = await LicenseRepository.findById(id);
        if (!license) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'LICENSE_NOT_FOUND', 'Giấy phép không tồn tại hoặc đã bị xóa.');
        }
        return license;
    }

    /**
     * Cập nhật giấy phép
     */
    static async updateLicense(id: string, data: UpdateLicenseInput): Promise<UserLicense> {
        const existingLicense = await this.getLicenseById(id);

        // Nếu cập nhật ngày cấp hoặc ngày hết hạn, validate lại
        const issueDate = data.issue_date || existingLicense.issue_date;
        const expiryDate = data.expiry_date !== undefined ? data.expiry_date : existingLicense.expiry_date;

        if (expiryDate && new Date(issueDate) > new Date(expiryDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', 'Ngày cấp (issue_date) không được lớn hơn ngày hết hạn (expiry_date).');
        }

        // Nếu đổi license_number, check trùng (exclude chính nó)
        if (data.license_number) {
            const duplicate = await LicenseRepository.findByLicenseNumber(data.license_number, id);
            if (duplicate) {
                throw new AppError(HTTP_STATUS.CONFLICT, 'DUPLICATE_LICENSE_NUMBER', `Số giấy phép "${data.license_number}" đã tồn tại trong hệ thống.`);
            }
        }

        const updated = await LicenseRepository.update(id, data);
        if (!updated) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED', 'Lỗi hệ thống khi cập nhật giấy phép.');
        return updated;
    }

    /**
     * Xóa / disable giấy phép (Soft Delete)
     */
    static async deleteLicense(id: string): Promise<void> {
        await this.getLicenseById(id);

        const deleted = await LicenseRepository.softDelete(id);
        if (!deleted) throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DELETE_FAILED', 'Lỗi hệ thống khi xóa giấy phép.');
    }

    /**
     * Upload file giấy phép lên Cloudinary.
     */
    static async uploadLicenseFile(id: string, file: Express.Multer.File): Promise<{ document_url: string }> {
        // Đảm bảo giấy phép tồn tại
        await this.getLicenseById(id);

        // Validate
        if (!LICENSE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new AppError(
                LICENSE_UPLOAD_ERRORS.INVALID_FORMAT.httpCode,
                LICENSE_UPLOAD_ERRORS.INVALID_FORMAT.code,
                LICENSE_UPLOAD_ERRORS.INVALID_FORMAT.message
            );
        }

        // Validate file size
        if (file.size > LICENSE_CONFIG.MAX_FILE_SIZE) {
            throw new AppError(
                LICENSE_UPLOAD_ERRORS.FILE_TOO_LARGE.httpCode,
                LICENSE_UPLOAD_ERRORS.FILE_TOO_LARGE.code,
                LICENSE_UPLOAD_ERRORS.FILE_TOO_LARGE.message
            );
        }

        // Xác định resource_type: PDF dùng 'raw', ảnh dùng 'image'
        const isPdf = file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'image';

        // Upload lên Cloudinary bằng stream từ buffer
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: LICENSE_CONFIG.CLOUDINARY_FOLDER,
                    public_id: `license_${id}`,
                    overwrite: true,
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error || !result) reject(new AppError(
                        LICENSE_UPLOAD_ERRORS.UPLOAD_FAILED.httpCode,
                        LICENSE_UPLOAD_ERRORS.UPLOAD_FAILED.code,
                        LICENSE_UPLOAD_ERRORS.UPLOAD_FAILED.message
                    ));
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        await LicenseRepository.updateDocumentUrl(id, uploadResult.secure_url);

        return { document_url: uploadResult.secure_url };
    }

    /**
     * Lấy URL file đính kèm của giấy phép.
     */
    static async getLicenseFile(id: string): Promise<{ document_url: string }> {
        const license = await this.getLicenseById(id);

        if (!license.document_url) {
            throw new AppError(
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.httpCode,
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.code,
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.message
            );
        }

        return { document_url: license.document_url };
    }

    /**
     * Xóa file đính kèm: gọi Cloudinary destroy rồi set document_url = null trong DB.
     */
    static async deleteLicenseFile(id: string): Promise<void> {
        const license = await this.getLicenseById(id);

        if (!license.document_url) {
            throw new AppError(
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.httpCode,
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.code,
                LICENSE_UPLOAD_ERRORS.NO_FILE_ATTACHED.message
            );
        }

        // Gọi Cloudinary API để xóa file gốc (tiết kiệm dung lượng)
        try {
            await cloudinary.uploader.destroy(`${LICENSE_CONFIG.CLOUDINARY_FOLDER}/license_${id}`, { resource_type: 'image' });
            await cloudinary.uploader.destroy(`${LICENSE_CONFIG.CLOUDINARY_FOLDER}/license_${id}`, { resource_type: 'raw' });
        } catch {
        }

        await LicenseRepository.updateDocumentUrl(id, null);
    }

    /**
     * Dashboard: Lấy danh sách giấy phép SẮP hết hạn (trong vòng N ngày tới).
     */
    static async getExpiringLicenses(days: number = 30): Promise<UserLicense[]> {
        return await LicenseRepository.findExpiringLicenses(days);
    }

    /**
     * Dashboard: Lấy danh sách giấy phép ĐÃ quá hạn.
     */
    static async getExpiredLicenses(): Promise<UserLicense[]> {
        return await LicenseRepository.findExpiredLicenses();
    }
}
