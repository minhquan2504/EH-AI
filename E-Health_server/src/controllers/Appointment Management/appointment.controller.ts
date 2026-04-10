// src/controllers/Appointment Management/appointment.controller.ts
import { Request, Response } from 'express';
import { AppointmentService } from '../../services/Appointment Management/appointment.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    APPOINTMENT_ERRORS, APPOINTMENT_SUCCESS
} from '../../constants/appointment.constant';

/**
 * Controller tiếp nhận HTTP Request cho module Lịch khám.
 * Chỉ parse request → gọi Service → trả response. Không chứa business logic.
 */
export class AppointmentController {

    /**
     * POST /api/appointments — Đặt lịch khám mới
     */
    static async create(req: Request, res: Response) {
        try {
            const { patient_id, branch_id, shift_id, appointment_date, booking_channel } = req.body;
            if (!patient_id || !branch_id || !shift_id || !appointment_date || !booking_channel) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS',
                    'Thiếu thông tin bắt buộc: patient_id, branch_id, shift_id, appointment_date, booking_channel');
            }
            const userId = (req as any).auth?.user_id;
            const appointment = await AppointmentService.createAppointment(req.body, userId);
            const { warning, ...appointmentData } = appointment;
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: warning
                    ? `${APPOINTMENT_SUCCESS.CREATED}. Lưu ý: ${warning}`
                    : APPOINTMENT_SUCCESS.CREATED,
                warning: warning || undefined,
                data: appointmentData
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {

                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lịch khám' });
            }
        }
    }

    /**
     * GET /api/appointments — Danh sách lịch khám
     */
    static async getAll(req: Request, res: Response) {
        try {
            const filters = {
                status: req.query.status?.toString(),
                patient_id: req.query.patient_id?.toString(),
                doctor_id: req.query.doctor_id?.toString(),
                room_id: req.query.room_id?.toString(),
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
                booking_channel: req.query.booking_channel?.toString(),
                date: req.query.date?.toString(),
                keyword: req.query.keyword?.toString(),
                facility_service_id: req.query.facility_service_id?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentService.getAppointments(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.LIST_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 20))
                }
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách lịch khám' });
        }
    }

    /**
     * GET /api/appointments/:id — Chi tiết lịch khám
     */
    static async getById(req: Request, res: Response) {
        try {
            const result = await AppointmentService.getAppointmentById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.DETAIL_FETCHED,
                data: result.appointment,
                audit_logs: result.auditLogs
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
     * PUT /api/appointments/:id — Cập nhật lịch khám
     */
    static async update(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.updateAppointment(req.params.id as string, req.body, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.UPDATED,
                data: updated
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật lịch khám' });
            }
        }
    }

    /**
     * DELETE /api/appointments/:id — Huỷ lịch khám (soft cancel)
     */
    static async cancel(req: Request, res: Response) {
        try {
            const { cancellation_reason } = req.body;
            if (!cancellation_reason) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCELLATION_REASON', APPOINTMENT_ERRORS.MISSING_CANCELLATION_REASON);
            }
            const userId = (req as any).auth?.user_id;
            const userRoles = (req as any).auth?.roles || [];
            const cancelled = await AppointmentService.cancelAppointment(req.params.id as string, cancellation_reason, userId, userRoles);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CANCELLED,
                data: cancelled
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi huỷ lịch khám' });
            }
        }
    }

    /**
     * PATCH /api/appointments/:id/assign-doctor — Gán bác sĩ
     */
    static async assignDoctor(req: Request, res: Response) {
        try {
            const { doctor_id } = req.body;
            if (!doctor_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', APPOINTMENT_ERRORS.MISSING_DOCTOR_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignDoctor(req.params.id as string, doctor_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.DOCTOR_ASSIGNED,
                data: updated
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
     * GET /api/appointments/doctor/:doctorId — Lịch của bác sĩ
     */
    static async getByDoctor(req: Request, res: Response) {
        try {
            const filters = {
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
            };
            const appointments = await AppointmentService.getAppointmentsByDoctor(req.params.doctorId as string, filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.LIST_FETCHED,
                data: appointments
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
        }
    }

    /**
     * PATCH /api/appointments/:id/assign-room — Gán phòng khám
     */
    static async assignRoom(req: Request, res: Response) {
        try {
            const { room_id } = req.body;
            if (!room_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ROOM_ID', APPOINTMENT_ERRORS.MISSING_ROOM_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignRoom(req.params.id as string, room_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.ROOM_ASSIGNED,
                data: updated
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
     * PATCH /api/appointments/:id/assign-service — Gán dịch vụ
     */
    static async assignService(req: Request, res: Response) {
        try {
            const { facility_service_id } = req.body;
            if (!facility_service_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SERVICE_ID', APPOINTMENT_ERRORS.MISSING_SERVICE_ID);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.assignService(req.params.id as string, facility_service_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.SERVICE_ASSIGNED,
                data: updated
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
     * GET /api/appointments/available-slots — Slot trống theo ngày
     */
    static async getAvailableSlots(req: Request, res: Response) {
        try {
            const date = req.query.date?.toString();
            if (!date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', 'Thiếu tham số date');
            }
            const doctorId = req.query.doctor_id?.toString();
            const facilityId = req.query.facility_id?.toString();
            const slots = await AppointmentService.getAvailableSlots(date, doctorId, facilityId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.SLOTS_FETCHED,
                data: slots
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy slot trống' });
            }
        }
    }

    /**
     * PATCH /api/appointments/:id/reschedule — Đổi lịch khám
     */
    static async reschedule(req: Request, res: Response) {
        try {
            const { new_date, new_slot_id, reschedule_reason } = req.body;
            if (!new_date || !new_slot_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_RESCHEDULE_DATA', APPOINTMENT_ERRORS.MISSING_RESCHEDULE_DATA);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.rescheduleAppointment(req.params.id as string, new_date, new_slot_id, userId, reschedule_reason);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.RESCHEDULED,
                data: updated
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi đổi lịch' });
            }
        }
    }

    /**
     * POST /api/appointments/check-conflict — Kiểm tra trùng lịch
     */
    static async checkConflict(req: Request, res: Response) {
        try {
            const { date, slot_id, doctor_id, patient_id, room_id, exclude_appointment_id } = req.body;
            if (!date || !slot_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CONFLICT_DATA', APPOINTMENT_ERRORS.MISSING_CONFLICT_DATA);
            }
            const result = await AppointmentService.checkConflict({
                date, slot_id, doctor_id, patient_id, room_id, exclude_appointment_id
            });
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CONFLICT_CHECKED,
                data: result
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra trùng lịch' });
            }
        }
    }

    /**
     * PATCH /api/appointments/:id/visit-reason — Cập nhật mục đích khám
     */
    static async updateVisitReason(req: Request, res: Response) {
        try {
            const { reason_for_visit, symptoms_notes } = req.body;
            if (reason_for_visit === undefined && symptoms_notes === undefined) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_VISIT_REASON', APPOINTMENT_ERRORS.MISSING_VISIT_REASON);
            }
            const userId = (req as any).auth?.user_id;
            const updated = await AppointmentService.updateVisitReason(req.params.id as string, reason_for_visit, symptoms_notes, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.VISIT_REASON_UPDATED,
                data: updated
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
     * GET /api/appointments/:id/visit-reason — Lấy thông tin mục đích khám
     */
    static async getVisitReason(req: Request, res: Response) {
        try {
            const result = await AppointmentService.getVisitReason(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.VISIT_REASON_FETCHED,
                data: result
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
     * GET /api/patients/:patientId/appointments — Lịch khám của bệnh nhân
     */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                patient_id: patientId,
                status: req.query.status?.toString(),
                fromDate: req.query.fromDate?.toString(),
                toDate: req.query.toDate?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentService.getAppointments(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: APPOINTMENT_SUCCESS.PATIENT_APPOINTMENTS_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (filters.limit || 20))
                }
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
     * POST /api/patients/:patientId/appointments — Tạo lịch từ hồ sơ BN
     */
    static async createByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const data = { ...req.body, patient_id: patientId };
            if (!data.booking_channel) data.booking_channel = 'DIRECT_CLINIC';
            const userId = (req as any).auth?.user_id;
            const appointment = await AppointmentService.createAppointment(data, userId);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: APPOINTMENT_SUCCESS.CREATED,
                data: appointment
            });
        } catch (error: any) {
            console.error('[AppointmentController.createByPatient] Error:', error);
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lịch khám' });
            }
        }
    }

    /**
     * POST /api/appointments/book-by-staff — Lễ tân đặt lịch hộ
     */
    static async bookByStaff(req: Request, res: Response) {
        try {
            const { patient_id, appointment_date, booking_channel } = req.body;
            if (!patient_id || !appointment_date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED_FIELDS', APPOINTMENT_ERRORS.MISSING_REQUIRED_FIELDS);
            }
            const staffUserId = (req as any).auth?.user_id;
            const staffNotes = req.body.staff_notes;
            const appointment = await AppointmentService.bookByStaff(req.body, staffUserId, staffNotes);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: APPOINTMENT_SUCCESS.BOOKED_BY_STAFF,
                data: appointment
            });
        } catch (error: any) {
            console.error('[AppointmentController.bookByStaff] Error:', error);
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi đặt lịch hộ' });
            }
        }
    }
}
