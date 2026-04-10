import { randomUUID } from 'crypto';
import { SpecialtyRepository } from '../../repository/Facility Management/specialty.repository';
import { DoctorRepository } from '../../repository/Facility Management/doctor.repository';
import { Specialty, SpecialtyPayloadDTO } from '../../models/Facility Management/specialty.model';
import { ERROR_MESSAGES } from '../../constants/message.constant';
import { PAGINATION } from '../../constants/pagination.constant';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

class AppError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
    }
}

export class SpecialtyService {
    /**
     * Sinh ID cho bảng specialties
     */
    static generateSpecialtyId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = "SPC";

        return `${prefix}_${yy}${mm}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Lấy danh sách chuyên khoa, hỗ trợ phân trang và tìm kiếm.
     */
    static async getSpecialties(page?: number, limit?: number, searchKeyword?: string) {
        const validPage = page && page > 0 ? page : PAGINATION.DEFAULT_PAGE_INDEX;
        const validLimit = limit && limit > 0 ? limit : PAGINATION.DEFAULT_PAGE_SIZE;

        const [data, total] = await SpecialtyRepository.getSpecialties(validPage, validLimit, searchKeyword);
        const totalPages = Math.ceil(total / validLimit);

        return {
            data,
            meta: {
                total,
                page: validPage,
                limit: validLimit,
                totalPages
            }
        };
    }

    /**
     * Lấy thông tin chi tiết một chuyên khoa.
     */
    static async getSpecialtyById(id: string): Promise<Specialty> {
        const specialty = await SpecialtyRepository.getSpecialtyById(id);

        if (!specialty) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SPECIALTY_NOT_FOUND);
        }

        return specialty;
    }

    /**
     * Thêm mới chuyên khoa.
     */
    static async createSpecialty(payload: SpecialtyPayloadDTO): Promise<Specialty> {
        // Kiểm tra xem code đã tồn tại chưa
        const existingSpecialty = await SpecialtyRepository.getSpecialtyByCode(payload.code);
        if (existingSpecialty) {
            throw new AppError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.SPECIALTY_CODE_EXISTS);
        }

        const newSpecialty: Specialty = {
            specialties_id: SpecialtyService.generateSpecialtyId(),
            code: payload.code,
            name: payload.name,
            description: payload.description || null
        };

        return await SpecialtyRepository.createSpecialty(newSpecialty);
    }

    /**
     * Cập nhật thông tin chuyên khoa.
     */
    static async updateSpecialty(id: string, payload: Partial<SpecialtyPayloadDTO>): Promise<Specialty> {
        const currentSpecialty = await SpecialtyRepository.getSpecialtyById(id);
        if (!currentSpecialty) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SPECIALTY_NOT_FOUND);
        }

        if (payload.code && payload.code !== currentSpecialty.code) {
            const codeTaken = await SpecialtyRepository.getSpecialtyByCode(payload.code);
            if (codeTaken) {
                throw new AppError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.SPECIALTY_CODE_EXISTS);
            }

            const doctorCount = await DoctorRepository.countDoctorsBySpecialtyId(id);
            if (doctorCount > 0) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.SPECIALTY_CODE_BOUND_TO_DOCTOR);
            }
        }

        const updatedSpecialty = await SpecialtyRepository.updateSpecialty(id, payload);
        if (!updatedSpecialty) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SPECIALTY_NOT_FOUND);
        }

        return updatedSpecialty;
    }

    /**
     * Xóa mềm chuyên khoa.
     * Chặn xóa nếu đang có bác sĩ trực thuộc.
     */
    static async deleteSpecialty(id: string): Promise<void> {
        const currentSpecialty = await SpecialtyRepository.getSpecialtyById(id);
        if (!currentSpecialty) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SPECIALTY_NOT_FOUND);
        }

        const doctorCount = await DoctorRepository.countDoctorsBySpecialtyId(id);
        if (doctorCount > 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.SPECIALTY_CANNOT_DELETE_BOUND_TO_DOCTOR);
        }

        // 3. Thực hiện xóa mềm
        await SpecialtyRepository.softDeleteSpecialty(id);
    }
}