// src/controllers/Facility Management/staff-schedule.controller.ts
import { Request, Response } from 'express';
import { StaffScheduleService } from '../../services/Facility Management/staff-schedule.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class StaffScheduleController {

    /**
     * Tạo lịch phân công
     */
    static async createSchedule(req: Request, res: Response) {
        try {
            const { user_id, medical_room_id, shift_id, working_date } = req.body;

            if (!user_id || !medical_room_id || !shift_id || !working_date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin phân công lịch bắt buộc');
            }

            const schedule = await StaffScheduleService.createSchedule({
                user_id,
                medical_room_id,
                shift_id,
                working_date,
                start_time: '',
                end_time: ''
            });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Phân công lịch làm việc thành công',
                data: schedule
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lịch làm việc' });
            }
        }
    }

    /**
     * Lấy danh sách lịch phân công
     */
    static async getSchedules(req: Request, res: Response) {
        try {
            const { user_id, shift_id, working_date, medical_room_id, branch_id } = req.query;
            const filters = {
                staff_schedules_id: req.query.staff_schedules_id?.toString(),
                user_id: user_id?.toString(),
                shift_id: shift_id?.toString(),
                working_date: working_date?.toString(),
                medical_room_id: medical_room_id?.toString(),
                branch_id: branch_id?.toString()
            };

            const schedules = await StaffScheduleService.getSchedules(filters);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: schedules
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách lịch' });
        }
    }

    /**
     * Lấy chi tiết lịch
     */
    static async getScheduleById(req: Request, res: Response) {
        try {
            const schedule = await StaffScheduleService.getScheduleById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedule });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Lập lịch Calendar - Format nhóm theo ngày để FE tự map vào ô vuông
     */
    static async getScheduleCalendar(req: Request, res: Response) {
        try {
            const { user_id, medical_room_id } = req.query;
            const filters = {
                user_id: user_id?.toString(),
                medical_room_id: medical_room_id?.toString()
            };

            const schedules = await StaffScheduleService.getSchedules(filters);

            const groupedData: Record<string, any[]> = {};

            schedules.forEach(schedule => {
                const d = new Date(schedule.working_date);
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                if (!groupedData[dateKey]) {
                    groupedData[dateKey] = [];
                }
                groupedData[dateKey].push(schedule);
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Dữ liệu Calendar phân theo nhóm ngày',
                data: groupedData
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Lấy list lịch theo nhân viên 
     */
    static async getSchedulesByStaff(req: Request, res: Response) {
        try {
            const schedules = await StaffScheduleService.getSchedules({ user_id: req.params.staffId as string });
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedules });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Lấy list lịch theo ngày
     */
    static async getSchedulesByDate(req: Request, res: Response) {
        try {
            const schedules = await StaffScheduleService.getSchedules({ working_date: req.params.date as string });
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedules });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Cập nhật thông tin lịch
     */
    static async updateSchedule(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const updated = await StaffScheduleService.updateSchedule(id, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật lịch thành công', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Xóa lịch
     */
    static async deleteSchedule(req: Request, res: Response) {
        try {
            await StaffScheduleService.deleteSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa lịch thành công' });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
    /**
     * Tạm ngưng lịch
     */
    static async suspendSchedule(req: Request, res: Response) {
        try {
            const updated = await StaffScheduleService.suspendSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã tạm ngưng lịch làm việc thành công', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Mở lại lịch
     */
    static async resumeSchedule(req: Request, res: Response) {
        try {
            const updated = await StaffScheduleService.resumeSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã mở lại lịch làm việc thành công', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
