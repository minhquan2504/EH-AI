import { EncounterRepository } from '../../repository/EMR/encounter.repository';
import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    ENCOUNTER_STATUS,
    ENCOUNTER_TYPE,
    ENCOUNTER_STATUS_TRANSITIONS,
    ENCOUNTER_EDITABLE_STATUSES,
    ENCOUNTER_ERRORS,
    ENCOUNTER_CONFIG,
} from '../../constants/encounter.constant';
import {
    Encounter,
    EncounterType,
    CreateEncounterInput,
    CreateEncounterFromAppointmentInput,
    UpdateEncounterInput,
    EncounterFilter,
} from '../../models/EMR/encounter.model';


export class EncounterService {

    /**
     * Tạo encounter walk-in / cấp cứu (không từ appointment).
     */
    static async createEncounter(data: CreateEncounterInput, userId: string): Promise<Encounter> {
        /** Validate bệnh nhân */
        const patient = await EncounterRepository.findPatientById(data.patient_id);
        if (!patient) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', ENCOUNTER_ERRORS.PATIENT_NOT_FOUND);
        }

        /** Kiểm tra BN có encounter đang active không — tránh tạo trùng */
        const activeEncounter = await EncounterRepository.findActiveByPatientId(data.patient_id);
        if (activeEncounter) {
            throw new AppError(
                HTTP_STATUS.CONFLICT,
                'PATIENT_HAS_ACTIVE_ENCOUNTER',
                ENCOUNTER_ERRORS.PATIENT_HAS_ACTIVE_ENCOUNTER
            );
        }

        /** Validate bác sĩ */
        await this.validateDoctor(data.doctor_id);

        /** Validate phòng khám */
        await this.validateRoom(data.room_id);

        /** Tự động xác định loại khám nếu không truyền */
        const encounterType = data.encounter_type || await this.detectEncounterType(data.patient_id);

        /** Lấy visit_number (lần khám thứ mấy) */
        const visitNumber = await EncounterRepository.getVisitNumber(data.patient_id);

        /** Transaction: tạo encounter + cập nhật phòng */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const encounter = await EncounterRepository.create({
                appointment_id: null,
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                room_id: data.room_id,
                encounter_type: encounterType,
                visit_number: visitNumber,
                notes: data.notes || null,
            }, client);

            await EncounterRepository.updateRoomStatus(data.room_id, 'OCCUPIED', null, client);

            await client.query('COMMIT');
            return await EncounterRepository.findById(encounter.encounters_id) as Encounter;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tạo encounter từ lịch khám.
     * Transaction: ghi 3 bảng (encounters, appointments, medical_rooms).
     */
    static async createFromAppointment(
        appointmentId: string,
        data: CreateEncounterFromAppointmentInput,
        userId: string
    ): Promise<Encounter> {
        /** Kiểm tra appointment tồn tại */
        const apt = await EncounterRepository.findAppointmentById(appointmentId);
        if (!apt) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', ENCOUNTER_ERRORS.APPOINTMENT_NOT_FOUND);
        }

        /** Kiểm tra trạng thái appointment phải là CHECKED_IN hoặc IN_PROGRESS */
        if (apt.status !== 'CHECKED_IN' && apt.status !== 'IN_PROGRESS') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'APPOINTMENT_NOT_CHECKED_IN', ENCOUNTER_ERRORS.APPOINTMENT_NOT_CHECKED_IN);
        }

        /** Kiểm tra 1 appointment = 1 encounter (tránh tạo trùng với auto-create từ startExam) */
        const existingCount = await EncounterRepository.countByAppointmentId(appointmentId);
        if (existingCount > 0) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ENCOUNTER_ALREADY_EXISTS', ENCOUNTER_ERRORS.ALREADY_EXISTS_FOR_APPOINTMENT);
        }

        /** Xác định doctor_id: ưu tiên body request > appointment */
        const doctorId = data.doctor_id || apt.doctor_id;
        if (!doctorId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', ENCOUNTER_ERRORS.MISSING_DOCTOR_ID);
        }
        await this.validateDoctor(doctorId);

        /** Xác định room_id: ưu tiên body request > appointment */
        const roomId = data.room_id || apt.room_id;
        if (!roomId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ROOM_ID', ENCOUNTER_ERRORS.MISSING_ROOM_ID);
        }
        await this.validateRoom(roomId);

        /** Tự động xác định loại khám */
        const encounterType = data.encounter_type || await this.detectEncounterType(apt.patient_id);

        /** Lấy visit_number */
        const visitNumber = await EncounterRepository.getVisitNumber(apt.patient_id);

        /** Transaction: tạo encounter + cập nhật appointment + cập nhật phòng */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const encounter = await EncounterRepository.create({
                appointment_id: appointmentId,
                patient_id: apt.patient_id,
                doctor_id: doctorId,
                room_id: roomId,
                encounter_type: encounterType,
                visit_number: visitNumber,
                notes: data.notes || null,
            }, client);

            await EncounterRepository.updateAppointmentToInProgress(appointmentId, client);
            await EncounterRepository.updateRoomStatus(roomId, 'OCCUPIED', appointmentId, client);

            await client.query('COMMIT');
            return await EncounterRepository.findById(encounter.encounters_id) as Encounter;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Danh sách encounter có filter + phân trang
     */
    static async getEncounters(filter: EncounterFilter): Promise<{ data: Encounter[]; total: number; page: number; limit: number; totalPages: number }> {
        const safeLimit = Math.min(filter.limit || ENCOUNTER_CONFIG.DEFAULT_LIMIT, ENCOUNTER_CONFIG.MAX_LIMIT);
        const result = await EncounterRepository.findAll({
            ...filter,
            page: filter.page || ENCOUNTER_CONFIG.DEFAULT_PAGE,
            limit: safeLimit,
        });

        return {
            ...result,
            page: filter.page || ENCOUNTER_CONFIG.DEFAULT_PAGE,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Chi tiết encounter theo ID
     */
    static async getEncounterById(encounterId: string): Promise<Encounter> {
        const encounter = await EncounterRepository.findById(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }
        return encounter;
    }

    /**
     * Cập nhật encounter (notes, encounter_type)
     */
    static async updateEncounter(encounterId: string, data: UpdateEncounterInput): Promise<Encounter> {
        const encounter = await EncounterRepository.findById(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }

        if (!(ENCOUNTER_EDITABLE_STATUSES as readonly string[]).includes(encounter.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_EDITABLE', ENCOUNTER_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }

        await EncounterRepository.update(encounterId, data);
        return await EncounterRepository.findById(encounterId) as Encounter;
    }

    /**
     * Đổi bác sĩ phụ trách giữa chừng.
     * Transaction: ghi encounter + sync appointment.
     */
    static async assignDoctor(encounterId: string, doctorId: string, userId: string): Promise<Encounter> {
        const encounter = await EncounterRepository.findById(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }

        if (!(ENCOUNTER_EDITABLE_STATUSES as readonly string[]).includes(encounter.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_EDITABLE', ENCOUNTER_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }

        await this.validateDoctor(doctorId);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await EncounterRepository.updateDoctor(encounterId, doctorId, client);

            /** Sync BS ngược về appointment nếu có liên kết */
            if (encounter.appointment_id) {
                try {
                    const { AppointmentRepository } = require('../../repository/Appointment Management/appointment.repository');
                    await AppointmentRepository.assignDoctor(encounter.appointment_id, doctorId, {
                        appointment_id: encounter.appointment_id,
                        changed_by: userId,
                        old_status: null,
                        new_status: null,
                        action_note: `Sync BS từ encounter: ${encounterId} → doctor: ${doctorId}`
                    });
                } catch (err: any) {
                    console.error('[ENCOUNTER_ASSIGN_DOCTOR] Lỗi sync appointment:', err.message);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return await EncounterRepository.findById(encounterId) as Encounter;
    }

    /**
     * Đổi phòng khám giữa chừng.
     * Transaction: giải phóng phòng cũ + update encounter + chiếm phòng mới.
     */
    static async assignRoom(encounterId: string, roomId: string, userId: string): Promise<Encounter> {
        const encounter = await EncounterRepository.findById(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }

        if (!(ENCOUNTER_EDITABLE_STATUSES as readonly string[]).includes(encounter.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_EDITABLE', ENCOUNTER_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }

        await this.validateRoom(roomId);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            /** Giải phóng phòng cũ */
            if (encounter.room_id) {
                await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null, client);
            }

            await EncounterRepository.updateRoom(encounterId, roomId, client);
            await EncounterRepository.updateRoomStatus(roomId, 'OCCUPIED', null, client);

            /** Sync phòng ngược về appointment nếu có liên kết */
            if (encounter.appointment_id) {
                try {
                    const { AppointmentRepository } = require('../../repository/Appointment Management/appointment.repository');
                    await AppointmentRepository.assignRoom(encounter.appointment_id, roomId, {
                        appointment_id: encounter.appointment_id,
                        changed_by: userId,
                        old_status: null,
                        new_status: null,
                        action_note: `Sync phòng từ encounter: ${encounterId} → room: ${roomId}`
                    });
                } catch (err: any) {
                    console.error('[ENCOUNTER_ASSIGN_ROOM] Lỗi sync appointment:', err.message);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return await EncounterRepository.findById(encounterId) as Encounter;
    }

    /**
     * Chuyển trạng thái encounter theo state machine.
     * Transaction: update status + giải phóng phòng + update appointment.
     */
    static async changeStatus(encounterId: string, newStatus: string, userId: string): Promise<Encounter> {
        const encounter = await EncounterRepository.findById(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }

        /** Validate state transition */
        const allowedStatuses = ENCOUNTER_STATUS_TRANSITIONS[encounter.status];
        if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                'INVALID_STATUS_TRANSITION',
                ENCOUNTER_ERRORS.INVALID_STATUS_TRANSITION
            );
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await EncounterRepository.updateStatus(encounterId, newStatus, client);

            /** Nếu COMPLETED hoặc CLOSED → giải phóng phòng */
            if (newStatus === ENCOUNTER_STATUS.COMPLETED || newStatus === ENCOUNTER_STATUS.CLOSED) {
                if (encounter.room_id) {
                    await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null, client);
                }

                /** Nếu có appointment liên kết → cập nhật appointment status */
                if (newStatus === ENCOUNTER_STATUS.COMPLETED && encounter.appointment_id) {
                    await EncounterRepository.updateAppointmentToCompleted(encounter.appointment_id, client);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        /** Side-effects không nằm trong transaction (audit log, notification) — OK nếu fail */
        if ((newStatus === ENCOUNTER_STATUS.COMPLETED || newStatus === ENCOUNTER_STATUS.CLOSED)
            && newStatus === ENCOUNTER_STATUS.COMPLETED && encounter.appointment_id) {
            try {
                const { AppointmentAuditLogRepository } = require('../../repository/Appointment Management/appointment-audit-log.repository');
                const { v4: uuidv4 } = require('uuid');
                await AppointmentAuditLogRepository.create({
                    appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
                    appointment_id: encounter.appointment_id,
                    changed_by: userId,
                    old_status: 'IN_PROGRESS',
                    new_status: 'COMPLETED',
                    action_note: `Hoàn tất khám từ encounter: ${encounterId}`,
                });
            } catch (auditErr: any) {
                console.error('[ENCOUNTER_COMPLETE] Lỗi ghi audit log:', auditErr.message);
            }

            try {
                const { NotificationEngineService } = require('../Core/notification-engine.service');
                const apt = await EncounterRepository.findAppointmentById(encounter.appointment_id);
                if (apt?.account_id) {
                    await NotificationEngineService.triggerEvent({
                        template_code: 'APPOINTMENT_COMPLETED',
                        target_user_id: apt.account_id,
                        variables: {
                            patient_name: apt.patient_name || 'Bệnh nhân',
                            appointment_code: apt.appointment_code,
                        },
                    });
                }
            } catch (notifErr: any) {
                console.error('[ENCOUNTER_COMPLETE] Lỗi gửi notification:', notifErr.message);
            }
        }

        return await EncounterRepository.findById(encounterId) as Encounter;
    }

    /**
     * Danh sách encounter của 1 bệnh nhân
     */
    static async getByPatientId(patientId: string, page: number, limit: number): Promise<{ data: Encounter[]; total: number; page: number; limit: number; totalPages: number }> {
        /** Validate bệnh nhân tồn tại */
        const patient = await EncounterRepository.findPatientById(patientId);
        if (!patient) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', ENCOUNTER_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, ENCOUNTER_CONFIG.MAX_LIMIT);
        const result = await EncounterRepository.findByPatientId(patientId, page, safeLimit);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Lấy encounter từ appointment_id
     */
    static async getByAppointmentId(appointmentId: string): Promise<Encounter> {
        const encounter = await EncounterRepository.findByAppointmentId(appointmentId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', ENCOUNTER_ERRORS.NOT_FOUND);
        }
        return encounter;
    }

    /**
     * Danh sách encounter đang diễn ra (dashboard)
     */
    static async getActiveEncounters(branchId?: string): Promise<Encounter[]> {
        return EncounterRepository.findActive(branchId);
    }

    //  Helpers

    /**
     * Tự động xác định loại khám: lần đầu hay tái khám
     */
    private static async detectEncounterType(patientId: string): Promise<EncounterType> {
        const hasExisting = await EncounterRepository.hasExistingEncounters(patientId);
        return hasExisting ? ENCOUNTER_TYPE.FOLLOW_UP as EncounterType : ENCOUNTER_TYPE.FIRST_VISIT as EncounterType;
    }

    /**
     * Validate bác sĩ: tồn tại và đang hoạt động
     */
    private static async validateDoctor(doctorId: string): Promise<void> {
        const doctor = await EncounterRepository.findDoctorById(doctorId);
        if (!doctor) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', ENCOUNTER_ERRORS.DOCTOR_NOT_FOUND);
        }
        if (!doctor.is_active) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DOCTOR_NOT_ACTIVE', ENCOUNTER_ERRORS.DOCTOR_NOT_ACTIVE);
        }
    }

    /**
     * Validate phòng khám: tồn tại và không đang bảo trì
     */
    private static async validateRoom(roomId: string): Promise<void> {
        const room = await EncounterRepository.findRoomById(roomId);
        if (!room) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ROOM_NOT_FOUND', ENCOUNTER_ERRORS.ROOM_NOT_FOUND);
        }
        if (room.room_status === 'MAINTENANCE') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ROOM_MAINTENANCE', ENCOUNTER_ERRORS.ROOM_MAINTENANCE);
        }
    }
}
