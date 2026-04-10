import { Request, Response, NextFunction } from 'express';
import { MedicalRoomService } from '../../services/Facility Management/medical-room.service';

export class MedicalRoomController {
    /**
     * Lấy danh sách thả xuống [Dropdown]
     */
    static async getDropdownList(req: Request, res: Response, next: NextFunction) {
        try {
            const { branch_id, department_id } = req.query;
            const data = await MedicalRoomService.getDropdown(
                branch_id?.toString(),
                department_id?.toString()
            );
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách phân trang (kèm filter search, branch, dept, type)
     */
    static async getMedicalRooms(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, search, branch_id, department_id, room_type, status } = req.query;

            const params = {
                page: page ? parseInt(page.toString()) : undefined,
                limit: limit ? parseInt(limit.toString()) : undefined,
                search: search?.toString(),
                branch_id: branch_id?.toString(),
                department_id: department_id?.toString(),
                room_type: room_type?.toString(),
                status: status?.toString()
            };

            const result = await MedicalRoomService.getList(params);

            res.status(200).json({
                success: true,
                data: {
                    items: result.items,
                    pagination: params.page && params.limit ? {
                        page: params.page,
                        limit: params.limit,
                        total_records: result.total,
                        total_pages: Math.ceil(result.total / params.limit)
                    } : null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xem chi tiết
     */
    static async getMedicalRoomById(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await MedicalRoomService.getDetail(req.params.id?.toString());
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới
     */
    static async createMedicalRoom(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await MedicalRoomService.createRoom(req.body);
            res.status(201).json({ success: true, message: result.message, data: result.data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin toàn diện
     */
    static async updateMedicalRoom(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await MedicalRoomService.updateRoom(req.params.id?.toString(), req.body);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái
     */
    static async changeMedicalRoomStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await MedicalRoomService.changeStatus(req.params.id?.toString(), req.body.status);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm
     */
    static async deleteMedicalRoom(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await MedicalRoomService.deleteRoom(req.params.id?.toString());
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    }
}
