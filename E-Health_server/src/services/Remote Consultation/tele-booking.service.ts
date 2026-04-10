import { TeleBookingRepository } from '../../repository/Remote Consultation/tele-booking.repository';
import { CreateBookingInput, UpdateBookingInput, DoctorSearchInput, BookingFilter } from '../../models/Remote Consultation/tele-booking.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_BOOKING_STATUS, TELE_PAYMENT_STATUS, TELE_PRICE_TYPE,
    TELE_BOOKING_ERRORS, TELE_BOOKING_CODE_PREFIX,
    REMOTE_CONSULTATION_CONFIG, TELE_BOOKING_CHANNEL,
} from '../../constants/remote-consultation.constant';
import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho đặt lịch khám từ xa
 * Xử lý: validate, tìm BS, tạo phiên, xác nhận → tạo Appointment + TeleConsultation, thanh toán, hủy
 */
export class TeleBookingService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: TÌM BS & SLOT KHẢ DỤNG
    // ═══════════════════════════════════════════════════

    /**
     * Tìm danh sách BS khả dụng cho đặt lịch từ xa
     * Validate: specialty, facility, date >= today
     */
    static async findAvailableDoctors(input: DoctorSearchInput): Promise<any[]> {
        if (!input.specialty_id || !input.facility_id || !input.date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.MISSING_REQUIRED.code,
                'Thiếu thông tin bắt buộc: specialty_id, facility_id, date');
        }

        this.validateBookingDate(input.date);

        const specialtyOk = await TeleBookingRepository.specialtyExists(input.specialty_id);
        if (!specialtyOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SPECIALTY_NOT_FOUND', TELE_BOOKING_ERRORS.MISSING_REQUIRED.message);

        const facilityOk = await TeleBookingRepository.facilityExists(input.facility_id);
        if (!facilityOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'FACILITY_NOT_FOUND', TELE_BOOKING_ERRORS.MISSING_REQUIRED.message);

        // Nếu có type_id, kiểm tra config tồn tại
        if (input.type_id) {
            const typeOk = await TeleBookingRepository.typeExists(input.type_id);
            if (!typeOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'TYPE_NOT_FOUND', 'Loại hình khám không tồn tại.');
        }

        return await TeleBookingRepository.findAvailableDoctors(
            input.specialty_id, input.date, input.facility_id, input.shift_id
        );
    }

    /**
     * Lấy danh sách khung giờ trống cho BS + ngày
     */
    static async findAvailableSlots(date: string, doctorId?: string, shiftId?: string): Promise<any[]> {
        if (!date) throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.MISSING_REQUIRED.code, 'Thiếu ngày khám.');
        this.validateBookingDate(date);
        return await TeleBookingRepository.findAvailableSlots(date, doctorId, shiftId);
    }

    /**
     * Kiểm tra chi tiết availability của 1 BS
     */
    static async checkDoctorAvailability(doctorId: string, date: string): Promise<any> {
        if (!doctorId || !date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.MISSING_REQUIRED.code, 'Thiếu doctor_id hoặc date.');
        }
        this.validateBookingDate(date);

        const result = await TeleBookingRepository.checkDoctorAvailability(doctorId, date);
        if (!result) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.DOCTOR_NOT_FOUND.code, TELE_BOOKING_ERRORS.DOCTOR_NOT_FOUND.message);

        return {
            ...result,
            is_available: !result.has_leave && result.absences.length === 0 && result.schedules.length > 0,
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: ĐẶT LỊCH
    // ═══════════════════════════════════════════════════

    /**
     * Tạo phiên đặt lịch (DRAFT hoặc PENDING_PAYMENT)
     */
    static async createBooking(input: CreateBookingInput, userId?: string): Promise<any> {
        // Validate bắt buộc
        if (!input.patient_id || !input.specialty_id || !input.facility_id || !input.type_id || !input.booking_date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.MISSING_REQUIRED.code,
                'Thiếu: patient_id, specialty_id, facility_id, type_id, booking_date');
        }

        this.validateBookingDate(input.booking_date);

        // Validate FK
        const [patientOk, specialtyOk, facilityOk, typeOk] = await Promise.all([
            TeleBookingRepository.patientExists(input.patient_id),
            TeleBookingRepository.specialtyExists(input.specialty_id),
            TeleBookingRepository.facilityExists(input.facility_id),
            TeleBookingRepository.typeExists(input.type_id),
        ]);
        if (!patientOk) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.PATIENT_NOT_FOUND.code, TELE_BOOKING_ERRORS.PATIENT_NOT_FOUND.message);
        if (!specialtyOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'SPECIALTY_NOT_FOUND', 'Chuyên khoa không tồn tại.');
        if (!facilityOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'FACILITY_NOT_FOUND', 'Cơ sở không tồn tại.');
        if (!typeOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'TYPE_NOT_FOUND', 'Loại hình khám không tồn tại.');

        // Lấy config (giá, thời lượng, platform)
        const config = await TeleBookingRepository.getConfig(input.type_id, input.specialty_id, input.facility_id);
        if (!config) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.NO_CONFIG_AVAILABLE.code, TELE_BOOKING_ERRORS.NO_CONFIG_AVAILABLE.message);

        // Validate BS (nếu chọn)
        if (input.doctor_id) {
            await this.validateDoctor(input.doctor_id, input.booking_date, input.shift_id);
        }

        // Kiểm tra trùng phiên (BN + ngày + slot)
        if (input.slot_id) {
            const conflict = await TeleBookingRepository.findPatientBookingConflict(input.patient_id, input.booking_date, input.slot_id);
            if (conflict) throw new AppError(HTTP_STATUS.CONFLICT, TELE_BOOKING_ERRORS.PATIENT_CONFLICT.code, TELE_BOOKING_ERRORS.PATIENT_CONFLICT.message);
        }

        // Xác định giá
        const priceType = input.price_type || TELE_PRICE_TYPE.BASE;
        let priceAmount = parseFloat(config.base_price) || 0;
        if (priceType === TELE_PRICE_TYPE.INSURANCE && config.insurance_price) priceAmount = parseFloat(config.insurance_price);
        if (priceType === TELE_PRICE_TYPE.VIP && config.vip_price) priceAmount = parseFloat(config.vip_price);

        const paymentRequired = priceAmount > 0;
        const duration = config.default_duration_minutes || 30;
        const platform = input.platform || config.allowed_platforms?.[0] || 'AGORA';

        const sessionId = TeleBookingRepository.generateId();
        const sessionCode = TeleBookingRepository.generateCode();

        // Nếu cần thanh toán → PENDING_PAYMENT + set expires_at
        const status = paymentRequired ? TELE_BOOKING_STATUS.PENDING_PAYMENT : TELE_BOOKING_STATUS.DRAFT;
        const paymentStatus = TELE_PAYMENT_STATUS.UNPAID;

        let expiresAt: Date | undefined;
        if (paymentRequired) {
            expiresAt = new Date(Date.now() + REMOTE_CONSULTATION_CONFIG.PAYMENT_EXPIRY_MINUTES * 60 * 1000);
        }

        const session = await TeleBookingRepository.create({
            session_id: sessionId,
            session_code: sessionCode,
            patient_id: input.patient_id,
            specialty_id: input.specialty_id,
            facility_id: input.facility_id,
            type_id: input.type_id,
            config_id: config.config_id,
            doctor_id: input.doctor_id,
            booking_date: input.booking_date,
            slot_id: input.slot_id,
            shift_id: input.shift_id,
            booking_start_time: input.booking_start_time,
            booking_end_time: input.booking_end_time,
            duration_minutes: duration,
            platform,
            price_amount: priceAmount,
            price_type: priceType,
            payment_required: paymentRequired,
            reason_for_visit: input.reason_for_visit,
            symptoms_notes: input.symptoms_notes,
            patient_notes: input.patient_notes,
            status,
            payment_status: paymentStatus,
            expires_at: expiresAt,
            created_by: userId,
        });

        return await TeleBookingRepository.findById(session.session_id);
    }

    /**
     * Cập nhật phiên (chỉ DRAFT / PENDING_PAYMENT)
     */
    static async updateBooking(sessionId: string, input: UpdateBookingInput): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);

        const updatableStatuses = [TELE_BOOKING_STATUS.DRAFT, TELE_BOOKING_STATUS.PENDING_PAYMENT];
        if (!updatableStatuses.includes(session.status as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.SESSION_CANNOT_UPDATE.code, TELE_BOOKING_ERRORS.SESSION_CANNOT_UPDATE.message);
        }

        // Validate BS mới
        if (input.doctor_id && input.doctor_id !== session.doctor_id) {
            const bookingDate = input.booking_date || session.booking_date;
            await this.validateDoctor(input.doctor_id, bookingDate, input.shift_id || session.shift_id || undefined);
        }

        // Validate ngày mới
        if (input.booking_date && input.booking_date !== session.booking_date) {
            this.validateBookingDate(input.booking_date);
        }

        // Nếu đổi giá type → tính lại giá
        const updateData: Record<string, any> = { ...input };
        if (input.price_type && input.price_type !== session.price_type && session.config_id) {
            const config = await TeleBookingRepository.getConfig(session.type_id, session.specialty_id, session.facility_id);
            if (config) {
                let newPrice = parseFloat(config.base_price) || 0;
                if (input.price_type === TELE_PRICE_TYPE.INSURANCE && config.insurance_price) newPrice = parseFloat(config.insurance_price);
                if (input.price_type === TELE_PRICE_TYPE.VIP && config.vip_price) newPrice = parseFloat(config.vip_price);
                updateData.price_amount = newPrice;
            }
        }

        await TeleBookingRepository.update(sessionId, updateData);
        return await TeleBookingRepository.findById(sessionId);
    }

    /**
     * Xác nhận phiên → tạo Appointment + TeleConsultation trong transaction
     */
    static async confirmBooking(sessionId: string, userId: string): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);

        if (session.status === TELE_BOOKING_STATUS.CONFIRMED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.SESSION_ALREADY_CONFIRMED.code, TELE_BOOKING_ERRORS.SESSION_ALREADY_CONFIRMED.message);
        }
        if (session.status === TELE_BOOKING_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.SESSION_ALREADY_CANCELLED.code, TELE_BOOKING_ERRORS.SESSION_ALREADY_CANCELLED.message);
        }
        if (session.status === TELE_BOOKING_STATUS.EXPIRED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.SESSION_EXPIRED.code, TELE_BOOKING_ERRORS.SESSION_EXPIRED.message);
        }

        // Nếu yêu cầu thanh toán → kiểm tra đã thanh toán chưa
        if (session.payment_required && session.payment_status !== TELE_PAYMENT_STATUS.PAID) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.PAYMENT_REQUIRED.code, TELE_BOOKING_ERRORS.PAYMENT_REQUIRED.message);
        }

        // Transaction: tạo Appointment + TeleConsultation + cập nhật session
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Tạo Appointment
            const appointmentId = `APT_${uuidv4().substring(0, 12)}`;
            const appointmentCode = `APP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${uuidv4().substring(0, 4).toUpperCase()}`;

            await client.query(`
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, branch_id,
                    doctor_id, slot_id, appointment_date, booking_channel,
                    reason_for_visit, symptoms_notes, status,
                    is_teleconsultation, tele_booking_session_id
                ) VALUES ($1, $2, $3, (
                    SELECT b.branches_id FROM branches b WHERE b.facility_id = $4 AND b.status = 'ACTIVE' LIMIT 1
                ), $5, $6, $7, $8, $9, $10, 'CONFIRMED', TRUE, $11)
            `, [
                appointmentId, appointmentCode, session.patient_id,
                session.facility_id, session.doctor_id || null,
                session.slot_id || null, session.booking_date,
                TELE_BOOKING_CHANNEL, session.reason_for_visit || null,
                session.symptoms_notes || null, sessionId,
            ]);

            // 2. Tạo TeleConsultation (SCHEDULED)
            const teleConsultId = `TC_${uuidv4().substring(0, 12)}`;
            // Tạo encounter trước để liên kết
            const encounterId = `ENC_${uuidv4().substring(0, 12)}`;
            await client.query(`
                INSERT INTO encounters (
                    encounters_id, appointment_id, patient_id, encounter_type, status
                ) VALUES ($1, $2, $3, 'TELEMED', 'PLANNED')
            `, [encounterId, appointmentId, session.patient_id]);

            await client.query(`
                INSERT INTO tele_consultations (
                    tele_consultations_id, encounter_id, platform, call_status,
                    booking_session_id, appointment_id
                ) VALUES ($1, $2, $3, 'SCHEDULED', $4, $5)
            `, [teleConsultId, encounterId, session.platform, sessionId, appointmentId]);

            // 3. Cập nhật session status
            await client.query(`
                UPDATE tele_booking_sessions
                SET status = $1, confirmed_at = CURRENT_TIMESTAMP, confirmed_by = $2,
                    appointment_id = $3, tele_consultation_id = $4, updated_at = CURRENT_TIMESTAMP
                WHERE session_id = $5
            `, [TELE_BOOKING_STATUS.CONFIRMED, userId, appointmentId, teleConsultId, sessionId]);

            // 4. Ghi audit log cho appointment
            await client.query(`
                INSERT INTO appointment_audit_logs (audit_log_id, appointment_id, changed_by, old_status, new_status, action_note)
                VALUES ($1, $2, $3, NULL, 'CONFIRMED', $4)
            `, [
                `AAL_${uuidv4().substring(0, 12)}`,
                appointmentId,
                userId,
                `Tạo lịch khám từ xa từ phiên ${session.session_code} (${session.type_name || session.type_code || session.type_id})`,
            ]);

            await client.query('COMMIT');

            return await TeleBookingRepository.findById(sessionId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Hủy phiên đặt lịch
     */
    static async cancelBooking(sessionId: string, cancellationReason: string, userId: string): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);

        if (session.status === TELE_BOOKING_STATUS.CANCELLED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.SESSION_ALREADY_CANCELLED.code, TELE_BOOKING_ERRORS.SESSION_ALREADY_CANCELLED.message);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Cập nhật session
            await client.query(`
                UPDATE tele_booking_sessions
                SET status = $1, cancellation_reason = $2, cancelled_by = $3,
                    cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE session_id = $4
            `, [TELE_BOOKING_STATUS.CANCELLED, cancellationReason, userId, sessionId]);

            // Nếu đã tạo Appointment → hủy luôn
            if (session.appointment_id) {
                await client.query(`
                    UPDATE appointments
                    SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP,
                        cancellation_reason = $1, cancelled_by = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE appointments_id = $3
                `, [cancellationReason, userId, session.appointment_id]);

                // Ghi audit log
                await client.query(`
                    INSERT INTO appointment_audit_logs (audit_log_id, appointment_id, changed_by, old_status, new_status, action_note)
                    VALUES ($1, $2, $3, 'CONFIRMED', 'CANCELLED', $4)
                `, [
                    `AAL_${uuidv4().substring(0, 12)}`,
                    session.appointment_id,
                    userId,
                    `Hủy lịch khám từ xa: ${cancellationReason}`,
                ]);
            }

            // Nếu đã tạo TeleConsultation → cập nhật status
            if (session.tele_consultation_id) {
                await client.query(`
                    UPDATE tele_consultations SET call_status = 'MISSED'
                    WHERE tele_consultations_id = $1
                `, [session.tele_consultation_id]);
            }

            // Nếu đã thanh toán → đánh dấu cần refund
            if (session.payment_status === TELE_PAYMENT_STATUS.PAID) {
                await client.query(`
                    UPDATE tele_booking_sessions SET payment_status = $1
                    WHERE session_id = $2
                `, [TELE_PAYMENT_STATUS.REFUNDED, sessionId]);
            }

            await client.query('COMMIT');

            return await TeleBookingRepository.findById(sessionId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: THANH TOÁN
    // ═══════════════════════════════════════════════════

    /**
     * Khởi tạo thanh toán (tạo invoice PENDING)
     */
    static async initiatePayment(sessionId: string, userId: string): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);

        if (!session.payment_required) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_PAYMENT_NEEDED', 'Phiên này không yêu cầu thanh toán.');
        }
        if (session.payment_status === TELE_PAYMENT_STATUS.PAID) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.PAYMENT_ALREADY_DONE.code, TELE_BOOKING_ERRORS.PAYMENT_ALREADY_DONE.message);
        }

        // Tạo invoice
        const invoiceId = `INV_${uuidv4().substring(0, 12)}`;
        const invoiceCode = `INV-TELE-${Date.now()}`;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                INSERT INTO invoices (
                    invoices_id, invoice_code, patient_id, encounter_id, facility_id,
                    total_amount, payable_amount, status, invoice_type, created_by
                ) VALUES ($1, $2, $3, NULL, $4, $5, $5, 'PENDING', 'TELECONSULTATION', $6)
            `, [invoiceId, invoiceCode, session.patient_id, session.facility_id, session.price_amount, userId]);

            // Tạo invoice_item
            await client.query(`
                INSERT INTO invoice_items (
                    invoice_item_id, invoice_id, item_type, item_description,
                    quantity, unit_price, total_price
                ) VALUES ($1, $2, 'TELECONSULTATION', $3, 1, $4, $4)
            `, [
                `INVITM_${uuidv4().substring(0, 12)}`,
                invoiceId,
                `Khám từ xa ${session.type_name || session.type_code} - ${session.specialty_name}`,
                session.price_amount,
            ]);

            // Cập nhật session
            await client.query(`
                UPDATE tele_booking_sessions
                SET invoice_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
                WHERE session_id = $3
            `, [invoiceId, TELE_BOOKING_STATUS.PENDING_PAYMENT, sessionId]);

            await client.query('COMMIT');

            return {
                session_id: sessionId,
                invoice_id: invoiceId,
                invoice_code: invoiceCode,
                amount: session.price_amount,
                status: TELE_BOOKING_STATUS.PENDING_PAYMENT,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Callback thanh toán thành công → auto-confirm nếu payment_required
     */
    static async paymentCallback(sessionId: string): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);

        if (session.payment_status === TELE_PAYMENT_STATUS.PAID) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.PAYMENT_ALREADY_DONE.code, TELE_BOOKING_ERRORS.PAYMENT_ALREADY_DONE.message);
        }

        // Cập nhật payment_status
        await TeleBookingRepository.update(sessionId, {
            payment_status: TELE_PAYMENT_STATUS.PAID,
            status: TELE_BOOKING_STATUS.PAYMENT_COMPLETED,
        });

        // Cập nhật invoice
        if (session.invoice_id) {
            await pool.query(`UPDATE invoices SET status = 'PAID', paid_at = CURRENT_TIMESTAMP WHERE invoices_id = $1`, [session.invoice_id]);
        }

        return await TeleBookingRepository.findById(sessionId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: TRA CỨU
    // ═══════════════════════════════════════════════════

    /**
     * Chi tiết phiên
     */
    static async getBookingById(sessionId: string): Promise<any> {
        const session = await TeleBookingRepository.findById(sessionId);
        if (!session) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.code, TELE_BOOKING_ERRORS.SESSION_NOT_FOUND.message);
        return session;
    }

    /**
     * Danh sách phiên (ADMIN/DOCTOR)
     */
    static async listBookings(filters: BookingFilter): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const result = await TeleBookingRepository.findAll(filters);
        return { ...result, page: filters.page, limit: filters.limit };
    }

    /**
     * Lịch sử booking của BN
     */
    static async getMyBookings(patientId: string, filters: BookingFilter): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const result = await TeleBookingRepository.findAll({ ...filters, patient_id: patientId });
        return { ...result, page: filters.page, limit: filters.limit };
    }

    // ═══════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════

    /** Validate ngày khám >= ngày hiện tại */
    private static validateBookingDate(date: string): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        if (target < today) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.INVALID_BOOKING_DATE.code, TELE_BOOKING_ERRORS.INVALID_BOOKING_DATE.message);
        }
    }

    /** Validate BS: tồn tại, có lịch, không nghỉ phép */
    private static async validateDoctor(doctorId: string, date: string, shiftId?: string): Promise<void> {
        const docOk = await TeleBookingRepository.doctorExists(doctorId);
        if (!docOk) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_BOOKING_ERRORS.DOCTOR_NOT_FOUND.code, TELE_BOOKING_ERRORS.DOCTOR_NOT_FOUND.message);

        const onLeave = await TeleBookingRepository.isDoctorOnLeave(doctorId, date);
        if (onLeave) throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.DOCTOR_ON_LEAVE.code, TELE_BOOKING_ERRORS.DOCTOR_ON_LEAVE.message);

        const scheduled = await TeleBookingRepository.isDoctorScheduled(doctorId, date, shiftId);
        if (!scheduled) throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_BOOKING_ERRORS.DOCTOR_NOT_AVAILABLE.code, TELE_BOOKING_ERRORS.DOCTOR_NOT_AVAILABLE.message);
    }
}
