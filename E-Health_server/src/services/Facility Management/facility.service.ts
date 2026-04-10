import { FacilityRepository } from '../../repository/Facility Management/facility.repository';
import { FacilityInfo, UpdateFacilityInfoInput, CreateFacilityInput, FacilityQuery } from '../../models/Facility Management/facility.model';
import { FACILITY_ERRORS, FacilityStatus } from '../../constants/facility.constant';
import { SYSTEM_ERRORS, LOGO_CONFIG, CLOUDINARY_CONFIG, UPLOAD_MESSAGES } from '../../constants/system.constant';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class FacilityService {
    /**
     * Lấy danh sách cơ sở y tế
     */
    static async getFacilitiesForDropdown() {
        return await FacilityRepository.getFacilitiesForDropdown();
    }

    /**
     * Lấy thông tin chi tiết cơ sở y tế.
     */
    static async getFacilityInfo(): Promise<FacilityInfo> {
        const facility = await FacilityRepository.getFacilityInfo();
        if (!facility) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
        return facility;
    }

    /**
     * Cập nhật thông tin tổng quan cơ sở y tế.
     */
    static async updateFacilityInfo(input: UpdateFacilityInfoInput): Promise<FacilityInfo> {
        // Lấy facility hiện tại để lấy ID 
        const existing = await FacilityRepository.getFacilityInfo();
        if (!existing) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        // Loại bỏ các field undefined để tránh update ô thừa
        const sanitizedInput: UpdateFacilityInfoInput = Object.fromEntries(
            Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
        );

        return await FacilityRepository.updateFacilityInfo(existing.facilities_id, sanitizedInput);
    }

    /**
     * Upload logo lên Cloudinary và cập nhật URL vào DB.
     */
    static async uploadLogo(file: Express.Multer.File): Promise<{ logo_url: string }> {
        // Validate MIME type
        if (!LOGO_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw SYSTEM_ERRORS.INVALID_IMAGE_FORMAT;
        }

        // Validate file size
        if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
            throw SYSTEM_ERRORS.IMAGE_TOO_LARGE;
        }

        // Lấy facility để lấy ID
        const existing = await FacilityRepository.getFacilityInfo();
        if (!existing) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;

        // Upload lên Cloudinary bằng stream từ buffer
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: LOGO_CONFIG.CLOUDINARY_FOLDER,
                    public_id: `facility_logo_${existing.facilities_id}`,
                    overwrite: true,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error || !result) reject(SYSTEM_ERRORS.UPLOAD_FAILED);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        // Lưu URL vào DB
        await FacilityRepository.updateFacilityLogo(existing.facilities_id, uploadResult.secure_url);

        return { logo_url: uploadResult.secure_url };
    }



    /*
    // Lấy danh sách cơ sở y tế
    */
    static async getFacilities(query: FacilityQuery) {
        const { search, status, page, limit } = query;
        const offset = (page - 1) * limit;
        return await FacilityRepository.findAllFacilities(search, status, offset, limit);
    }




    /*
    // Lấy chi tiết cơ sở y tế
    */
    static async getFacilityById(id: string) {
        const facility = await FacilityRepository.findFacilityById(id);
        if (!facility) throw FACILITY_ERRORS.FACILITY_NOT_FOUND;
        return facility;
    }




    /*
    // Tạo mới cơ sở y tế
    */
    static async createFacility(data: CreateFacilityInput, file?: Express.Multer.File) {

        const existingCode = await FacilityRepository.findFacilityByCode(data.code);
        if (existingCode) throw FACILITY_ERRORS.FACILITY_CODE_EXISTS;

        const facilityId = `FCL_${Date.now()}_${randomUUID().substring(0, 8)}`;
        let logoUrl: string | undefined = undefined;

        // Xử lý upload logo
        if (file) {
            if (!LOGO_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw SYSTEM_ERRORS.INVALID_IMAGE_FORMAT;
            }
            if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
                throw SYSTEM_ERRORS.IMAGE_TOO_LARGE;
            }

            const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: LOGO_CONFIG.CLOUDINARY_FOLDER,
                        public_id: `facility_logo_${facilityId}`,
                        overwrite: true,
                        resource_type: 'image',
                    },
                    (error, result) => {
                        if (error || !result) reject(SYSTEM_ERRORS.UPLOAD_FAILED);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
            logoUrl = uploadResult.secure_url;
        }

        const newFacility = {
            id: facilityId,
            ...data,
            status: FacilityStatus.ACTIVE,
            logo_url: logoUrl
        };

        await FacilityRepository.createFacility(newFacility);
        return { facility_id: facilityId };
    }



    /*
    // Cập nhật cơ sở y tế
    */
    static async updateFacility(id: string, data: UpdateFacilityInfoInput, file?: Express.Multer.File) {
        const facility = await FacilityRepository.findFacilityById(id);
        if (!facility) throw FACILITY_ERRORS.FACILITY_NOT_FOUND;

        const allowedFields = ['name', 'tax_code', 'email', 'phone', 'website', 'headquarters_address'];
        let sanitizedInput: UpdateFacilityInfoInput = {};
        if (data && Object.keys(data).length > 0) {
            sanitizedInput = Object.fromEntries(
                Object.entries(data).filter(([key, value]) => allowedFields.includes(key) && value !== undefined && value !== null && value !== '')
            );
        }

        // Xử lý upload logo
        if (file) {
            if (!LOGO_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw SYSTEM_ERRORS.INVALID_IMAGE_FORMAT;
            }
            if (file.size > CLOUDINARY_CONFIG.MAX_FILE_SIZE) {
                throw SYSTEM_ERRORS.IMAGE_TOO_LARGE;
            }

            const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: LOGO_CONFIG.CLOUDINARY_FOLDER,
                        public_id: `facility_logo_${id}`,
                        overwrite: true,
                        resource_type: 'image',
                    },
                    (error, result) => {
                        if (error || !result) reject(SYSTEM_ERRORS.UPLOAD_FAILED);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });

            let updated = facility;
            if (Object.keys(sanitizedInput).length > 0) {
                updated = await FacilityRepository.updateFacilityInfo(id, sanitizedInput);
            }
            await FacilityRepository.updateFacilityLogo(id, uploadResult.secure_url);

            return { ...updated, logo_url: uploadResult.secure_url };
        } else {
            if (Object.keys(sanitizedInput).length > 0) {
                return await FacilityRepository.updateFacilityInfo(id, sanitizedInput);
            }
            return facility;
        }
    }



    /*
    // Cập nhật trạng thái cơ sở y tế
    */
    static async changeFacilityStatus(id: string, status: string) {
        const facility = await FacilityRepository.findFacilityById(id);
        if (!facility) throw FACILITY_ERRORS.FACILITY_NOT_FOUND;

        await FacilityRepository.updateFacilityStatus(id, status);
    }

    /*
    // Xóa cơ sở y tế
    */
    static async deleteFacility(id: string) {
        const facility = await FacilityRepository.findFacilityById(id);
        if (!facility) throw FACILITY_ERRORS.FACILITY_NOT_FOUND;

        await FacilityRepository.deleteFacility(id);
    }
}
