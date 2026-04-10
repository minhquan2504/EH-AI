import { Request, Response } from 'express';
import { TeleBookingService } from '../../services/Remote Consultation/tele-booking.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_BOOKING_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.2 — Đặt lịch tư vấn & khám từ xa
 * 12 handler chia 4 nhóm: Tìm BS & Slot, Đặt lịch, Thanh toán, Quản lý
 */
export class TeleBookingController {

    // ═══ NHÓM 1: Tìm BS & Slot ═══

    /** GET /booking/doctors — DS bác sĩ khả dụng */
    static async getAvailableDoctors(req: Request, res: Response): Promise<void> {
        try {
            const { specialty_id, facility_id, date, type_id, shift_id } = req.query;
            const doctors = await TeleBookingService.findAvailableDoctors({
                specialty_id: specialty_id as string,
                facility_id: facility_id as string,
                date: date as string,
                type_id: type_id as string | undefined,
                shift_id: shift_id as string | undefined,
            });
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.DOCTORS_FETCHED, data: doctors });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /booking/slots — DS khung giờ trống */
    static async getAvailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const { date, doctor_id, shift_id } = req.query;
            const slots = await TeleBookingService.findAvailableSlots(
                date as string, doctor_id as string | undefined, shift_id as string | undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SLOTS_FETCHED, data: slots });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /booking/check-doctor — Kiểm tra chi tiết availability BS */
    static async checkDoctorAvailability(req: Request, res: Response): Promise<void> {
        try {
            const { doctor_id, date } = req.query;
            const result = await TeleBookingService.checkDoctorAvailability(doctor_id as string, date as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Kiểm tra availability BS thành công.', data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Đặt lịch ═══

    /** POST /booking — Tạo phiên đặt lịch */
    static async createBooking(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const session = await TeleBookingService.createBooking(req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CREATED, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /booking/:sessionId — Cập nhật phiên */
    static async updateBooking(req: Request, res: Response): Promise<void> {
        try {
            const session = await TeleBookingService.updateBooking(String(req.params.sessionId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_UPDATED, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /booking/:sessionId/confirm — Xác nhận phiên */
    static async confirmBooking(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const session = await TeleBookingService.confirmBooking(String(req.params.sessionId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CONFIRMED, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /booking/:sessionId/cancel — Hủy phiên */
    static async cancelBooking(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const { cancellation_reason } = req.body;
            const session = await TeleBookingService.cancelBooking(String(req.params.sessionId), cancellation_reason || 'Không rõ lý do', userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.SESSION_CANCELLED, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Thanh toán ═══

    /** POST /booking/:sessionId/payment — Khởi tạo thanh toán */
    static async initiatePayment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleBookingService.initiatePayment(String(req.params.sessionId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.PAYMENT_INITIATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /booking/:sessionId/payment-callback — Callback thanh toán */
    static async paymentCallback(req: Request, res: Response): Promise<void> {
        try {
            const session = await TeleBookingService.paymentCallback(String(req.params.sessionId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_BOOKING_SUCCESS.PAYMENT_CONFIRMED, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Tra cứu ═══

    /** GET /booking/:sessionId — Chi tiết phiên */
    static async getBookingDetail(req: Request, res: Response): Promise<void> {
        try {
            const session = await TeleBookingService.getBookingById(String(req.params.sessionId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: session });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /booking — Danh sách phiên (ADMIN/DOCTOR) */
    static async listBookings(req: Request, res: Response): Promise<void> {
        try {
            const filters = {
                patient_id: req.query.patient_id as string | undefined,
                doctor_id: req.query.doctor_id as string | undefined,
                specialty_id: req.query.specialty_id as string | undefined,
                facility_id: req.query.facility_id as string | undefined,
                type_id: req.query.type_id as string | undefined,
                status: req.query.status as string | undefined,
                payment_status: req.query.payment_status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                keyword: req.query.keyword as string | undefined,
                page: parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
                limit: Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT),
            };
            const result = await TeleBookingService.listBookings(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /booking/my-bookings — Lịch sử của BN đang đăng nhập */
    static async getMyBookings(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            // Lấy patient_id từ user_id
            const { pool } = require('../../config/postgresdb');
            const patientResult = await pool.query(`SELECT id::varchar AS patient_id FROM patients WHERE account_id = $1 LIMIT 1`, [userId]);
            const patientId = patientResult.rows[0]?.patient_id;
            if (!patientId) {
                res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Không tìm thấy hồ sơ bệnh nhân.' });
                return;
            }

            const filters = {
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                status: req.query.status as string | undefined,
                page: parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
                limit: Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT),
            };
            const result = await TeleBookingService.getMyBookings(patientId, filters as any);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
