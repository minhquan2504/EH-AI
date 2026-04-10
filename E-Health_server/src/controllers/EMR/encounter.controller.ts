// src/controllers/EMR/encounter.controller.ts
import { Request, Response } from 'express';
import { EncounterService } from '../../services/EMR/encounter.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    ENCOUNTER_ERRORS,
    ENCOUNTER_SUCCESS,
    ENCOUNTER_CONFIG,
} from '../../constants/encounter.constant';


export class EncounterController {

    /**
     * POST /api/encounters — Tạo encounter walk-in / cấp cứu
     */
    static async create(req: Request, res: Response) {
        try {
            const { patient_id, doctor_id, room_id } = req.body;
            if (!patient_id || !doctor_id || !room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS', ENCOUNTER_ERRORS.MISSING_REQUIRED_FIELDS);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.createEncounter(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ENCOUNTER_SUCCESS.CREATED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[EncounterController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lượt khám' });
            }
        }
    }

    /**
     * POST /api/encounters/from-appointment/:appointmentId — Tạo encounter từ lịch khám
     */
    static async createFromAppointment(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId as string;
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.createFromAppointment(appointmentId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: ENCOUNTER_SUCCESS.CREATED_FROM_APPOINTMENT,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[EncounterController.createFromAppointment] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lượt khám từ lịch khám' });
            }
        }
    }

    /**
     * GET /api/encounters — Danh sách encounter
     */
    static async getAll(req: Request, res: Response) {
        try {
            const filter = {
                patient_id: req.query.patient_id?.toString(),
                doctor_id: req.query.doctor_id?.toString(),
                room_id: req.query.room_id?.toString(),
                encounter_type: req.query.encounter_type?.toString(),
                status: req.query.status?.toString(),
                from_date: req.query.from_date?.toString(),
                to_date: req.query.to_date?.toString(),
                keyword: req.query.keyword?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : ENCOUNTER_CONFIG.DEFAULT_PAGE,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : ENCOUNTER_CONFIG.DEFAULT_LIMIT,
            };
            const result = await EncounterService.getEncounters(filter);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.LIST_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
        } catch (error: any) {
            console.error('[EncounterController.getAll] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách lượt khám' });
        }
    }

    /**
     * GET /api/encounters/:id — Chi tiết encounter
     */
    static async getById(req: Request, res: Response) {
        try {
            const encounter = await EncounterService.getEncounterById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.DETAIL_FETCHED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * PATCH /api/encounters/:id — Cập nhật encounter
     */
    static async update(req: Request, res: Response) {
        try {
            const encounter = await EncounterService.updateEncounter(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.UPDATED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật lượt khám' });
            }
        }
    }

    /**
     * PATCH /api/encounters/:id/assign-doctor — Đổi bác sĩ phụ trách
     */
    static async assignDoctor(req: Request, res: Response) {
        try {
            const { doctor_id } = req.body;
            if (!doctor_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', ENCOUNTER_ERRORS.MISSING_DOCTOR_ID);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.assignDoctor(req.params.id as string, doctor_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.DOCTOR_ASSIGNED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi đổi bác sĩ' });
            }
        }
    }

    /**
     * PATCH /api/encounters/:id/assign-room — Đổi phòng khám
     */
    static async assignRoom(req: Request, res: Response) {
        try {
            const { room_id } = req.body;
            if (!room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ROOM_ID', ENCOUNTER_ERRORS.MISSING_ROOM_ID);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.assignRoom(req.params.id as string, room_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.ROOM_ASSIGNED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi đổi phòng' });
            }
        }
    }

    /**
     * PATCH /api/encounters/:id/status — Chuyển trạng thái encounter
     */
    static async changeStatus(req: Request, res: Response) {
        try {
            const { new_status } = req.body;
            if (!new_status) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_STATUS', ENCOUNTER_ERRORS.MISSING_STATUS);
            }
            const userId = (req as any).auth?.user_id;
            const encounter = await EncounterService.changeStatus(req.params.id as string, new_status, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.STATUS_CHANGED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi chuyển trạng thái' });
            }
        }
    }

    /**
     * GET /api/encounters/by-patient/:patientId — DS encounter của 1 bệnh nhân
     */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : ENCOUNTER_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : ENCOUNTER_CONFIG.DEFAULT_LIMIT;
            const result = await EncounterService.getByPatientId(patientId, page, limit);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.PATIENT_ENCOUNTERS_FETCHED,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * GET /api/encounters/by-appointment/:appointmentId — Lấy encounter từ appointment
     */
    static async getByAppointment(req: Request, res: Response) {
        try {
            const encounter = await EncounterService.getByAppointmentId(req.params.appointmentId as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.APPOINTMENT_ENCOUNTER_FETCHED,
                data: encounter,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /**
     * GET /api/encounters/active — DS encounter đang diễn ra
     */
    static async getActive(req: Request, res: Response) {
        try {
            const branchId = req.query.branch_id?.toString();
            const encounters = await EncounterService.getActiveEncounters(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ENCOUNTER_SUCCESS.ACTIVE_FETCHED,
                data: encounters,
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách đang khám' });
        }
    }
}
