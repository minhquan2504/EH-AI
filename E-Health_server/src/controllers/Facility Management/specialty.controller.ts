import { Request, Response, NextFunction } from 'express';
import { SpecialtyService } from '../../services/Facility Management/specialty.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/message.constant';
import { SpecialtyPayloadDTO } from '../../models/Facility Management/specialty.model';

export class SpecialtyController {
    /**
     * Lấy danh sách chuyên khoa có hỗ trợ phân trang và tìm kiếm.
     */
    static async getSpecialties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
            const searchKeyword = req.query.searchKeyword ? req.query.searchKeyword as string : undefined;

            const result = await SpecialtyService.getSpecialties(page, limit, searchKeyword);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.SPECIALTY_FETCHED,
                data: result.data,
                meta: result.meta
            });
        } catch (error: any) {
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Lấy thông tin chi tiết một chuyên khoa dựa vào ID truyền trên path.
     */
    static async getSpecialtyById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const specialty = await SpecialtyService.getSpecialtyById(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.SPECIALTY_FETCHED,
                data: specialty
            });
        } catch (error: any) {
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Thêm mới một chuyên khoa.
     */
    static async createSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payload: SpecialtyPayloadDTO = {
                code: req.body.code,
                name: req.body.name,
                description: req.body.description
            };

            const newSpecialty = await SpecialtyService.createSpecialty(payload);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: SUCCESS_MESSAGES.SPECIALTY_CREATED,
                data: newSpecialty
            });
        } catch (error: any) {
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Cập nhật thông tin chuyên khoa.
     */
    static async updateSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Khởi tạo object rỗng, client gửi gì thì gán nấy
            const payload: Partial<SpecialtyPayloadDTO> = {};
            if (req.body.code !== undefined) payload.code = req.body.code;
            if (req.body.name !== undefined) payload.name = req.body.name;
            if (req.body.description !== undefined) payload.description = req.body.description;

            // Nếu không có dữ liệu nào hợp lệ để update
            if (Object.keys(payload).length === 0) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Không có dữ liệu hợp lệ để cập nhật."
                });
                return;
            }

            const updatedSpecialty = await SpecialtyService.updateSpecialty(id, payload);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.SPECIALTY_UPDATED,
                data: updatedSpecialty
            });
        } catch (error: any) {
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Xóa mềm một chuyên khoa.
     */
    static async deleteSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            await SpecialtyService.deleteSpecialty(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.SPECIALTY_DELETED
            });
        } catch (error: any) {
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }
}