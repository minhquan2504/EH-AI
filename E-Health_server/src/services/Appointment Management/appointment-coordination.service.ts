// src/services/Appointment Management/appointment-coordination.service.ts
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentCoordinationRepository } from '../../repository/Appointment Management/appointment-coordination.repository';
import { EncounterRepository } from '../../repository/EMR/encounter.repository';
import { NotificationEngineService } from '../../services/Core/notification-engine.service';
import { DoctorLoadInfo, SlotSuggestion, BalanceOverview } from '../../models/Appointment Management/appointment-coordination.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DEFAULT_MAX_PATIENTS_PER_SLOT } from '../../constants/appointment.constant';
import { APPOINTMENT_TEMPLATE_CODES } from '../../constants/appointment-confirmation.constant';
import {
    PRIORITY_LEVELS, COORDINATION_ACTIONS, REASSIGNABLE_STATUSES,
    SLOT_SCORING, COORDINATION_ERRORS
} from '../../constants/appointment-coordination.constant';
import { v4 as uuidv4 } from 'uuid';


export class AppointmentCoordinationService {

    /**
     * Phân tích tải BS theo ngày
     */
    static async getDoctorLoad(date: string, branchId?: string, specialtyId?: string): Promise<DoctorLoadInfo[]> {
        if (!date) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', COORDINATION_ERRORS.MISSING_DATE);

        const rows = await AppointmentCoordinationRepository.getDoctorLoadByDate(date, branchId, specialtyId);

        // Lấy max_patients_per_slot để tính capacity
        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPerSlot = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;

        return rows.map((row: any) => {
            const totalCapacity = row.total_slots * maxPerSlot;
            const loadPct = totalCapacity > 0 ? Math.round((row.booked_count / totalCapacity) * 100) : 0;

            let status: DoctorLoadInfo['status'] = 'NORMAL';
            if (loadPct === 0) status = 'LIGHT';
            else if (loadPct < 50) status = 'NORMAL';
            else if (loadPct < 80) status = 'HEAVY';
            else status = 'OVERLOADED';

            return {
                doctor_id: row.doctor_id,
                doctor_name: row.doctor_name,
                specialty_name: row.specialty_name,
                shift_name: row.shift_name,
                total_slots: Number(row.total_slots),
                booked_count: Number(row.booked_count),
                available_count: Math.max(0, totalCapacity - Number(row.booked_count)),
                load_percentage: loadPct,
                status,
            };
        });
    }

    /**
     * Gợi ý khung giờ tối ưu cho bệnh nhân
     */
    static async suggestSlots(date: string, doctorId?: string, specialtyId?: string, priority?: string, branchId?: string): Promise<SlotSuggestion[]> {
        if (!date) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', COORDINATION_ERRORS.MISSING_DATE);

        const configMax = await AppointmentRepository.getMaxPatientsPerSlot();
        const maxPerSlot = configMax ?? DEFAULT_MAX_PATIENTS_PER_SLOT;

        const slots = await AppointmentCoordinationRepository.getSlotsWithLoadInfo(date, doctorId, specialtyId, branchId);

        // Chấm điểm từng slot
        const scored: SlotSuggestion[] = [];
        for (const slot of slots) {
            if (slot.booked_count >= maxPerSlot) continue; // Bỏ qua slot đầy

            let score = 0;
            const reasons: string[] = [];

            // Slot trống hoàn toàn
            if (slot.booked_count === 0) {
                score += SLOT_SCORING.EMPTY_SLOT;
                reasons.push('Slot trống hoàn toàn');
            }
            // Slot ít người (<50%)
            else if (slot.booked_count < maxPerSlot * 0.5) {
                score += SLOT_SCORING.LOW_LOAD;
                reasons.push(`Slot ít người (${slot.booked_count}/${maxPerSlot})`);
            }

            // Ưu tiên URGENT → slot sớm
            if (priority === PRIORITY_LEVELS.URGENT) {
                const hour = parseInt(slot.start_time.split(':')[0]);
                const earlyBonus = Math.max(0, 12 - hour);
                score += earlyBonus;
                if (earlyBonus > 0) reasons.push(`Ưu tiên slot sớm (URGENT +${earlyBonus})`);
            }

            // Emergency → slot đầu tiên available
            if (priority === PRIORITY_LEVELS.EMERGENCY) {
                score += SLOT_SCORING.EMERGENCY_FIRST;
                reasons.push('Ưu tiên khẩn cấp (EMERGENCY)');
            }

            // Tìm BS ít tải nhất cho ca này (gọi repository)
            let recommendedDoctor: SlotSuggestion['recommended_doctor'] = undefined;
            const leastLoaded = await AppointmentCoordinationRepository.getLeastLoadedDoctorForShift(
                date, slot.shift_id, specialtyId
            );
            if (leastLoaded) {
                score += SLOT_SCORING.LEAST_LOADED_DOCTOR;
                reasons.push(`BS ít tải: ${leastLoaded.doctor_name} (${leastLoaded.current_load} BN)`);
                recommendedDoctor = {
                    doctor_id: leastLoaded.doctor_id,
                    doctor_name: leastLoaded.doctor_name,
                    specialty_name: leastLoaded.specialty_name,
                    current_load: Number(leastLoaded.current_load),
                };
            }

            scored.push({
                slot_id: slot.slot_id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                shift_name: slot.shift_name,
                booked_count: Number(slot.booked_count),
                max_capacity: maxPerSlot,
                recommended_doctor: recommendedDoctor,
                score,
                reasons,
            });
        }

        // Sắp xếp theo score giảm dần, trả top 10
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 10);
    }

    /**
     * Dashboard cân bằng tải BS theo ngày
     */
    static async getBalanceOverview(date: string, branchId?: string): Promise<BalanceOverview> {
        if (!date) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', COORDINATION_ERRORS.MISSING_DATE);

        const doctors = await this.getDoctorLoad(date, branchId);

        if (doctors.length === 0) {
            return {
                date,
                total_doctors: 0,
                total_appointments: 0,
                avg_load: 0,
                max_load: 0,
                min_load: 0,
                balance_score: 100,
                overloaded_doctors: [],
                underloaded_doctors: [],
                suggestions: ['Không có bác sĩ nào làm việc trong ngày này'],
            };
        }

        const loads = doctors.map(d => d.load_percentage);
        const totalAppointments = doctors.reduce((sum, d) => sum + d.booked_count, 0);
        const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
        const maxLoad = Math.max(...loads);
        const minLoad = Math.min(...loads);

        // Tính độ lệch chuẩn
        const variance = loads.reduce((sum, l) => sum + Math.pow(l - avgLoad, 2), 0) / loads.length;
        const stdDev = Math.sqrt(variance);

        // Phát hiện BS quá tải / rảnh
        const overloaded = doctors.filter(d => d.load_percentage > avgLoad + stdDev && d.load_percentage >= 70);
        const underloaded = doctors.filter(d => d.load_percentage < avgLoad - stdDev && d.load_percentage < 30);

        const balanceScore = Math.max(0, Math.round(100 - stdDev));

        const suggestions: string[] = [];
        if (overloaded.length > 0) {
            suggestions.push(`Có ${overloaded.length} BS quá tải (>${Math.round(avgLoad + stdDev)}%). Nên chuyển bớt BN sang BS khác.`);
        }
        if (underloaded.length > 0) {
            suggestions.push(`Có ${underloaded.length} BS ít tải (<${Math.round(avgLoad - stdDev)}%). Có thể nhận thêm BN.`);
        }
        if (balanceScore < 50) {
            suggestions.push('Tải BS mất cân bằng nghiêm trọng. Nên sử dụng tính năng Auto-assign để cân bằng lại.');
        }
        if (suggestions.length === 0) {
            suggestions.push('Tải BS tương đối cân bằng.');
        }

        return {
            date,
            total_doctors: doctors.length,
            total_appointments: totalAppointments,
            avg_load: Math.round(avgLoad * 10) / 10,
            max_load: maxLoad,
            min_load: minLoad,
            balance_score: balanceScore,
            overloaded_doctors: overloaded,
            underloaded_doctors: underloaded,
            suggestions,
        };
    }

    /**
     * Đặt mức ưu tiên cho lịch khám
     */
    static async setPriority(appointmentId: string, priority: string, reason?: string, userId?: string): Promise<void> {
        const validPriorities = Object.values(PRIORITY_LEVELS);
        if (!validPriorities.includes(priority as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_PRIORITY', COORDINATION_ERRORS.INVALID_PRIORITY);
        }

        const existing = await AppointmentRepository.findById(appointmentId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', COORDINATION_ERRORS.APPOINTMENT_NOT_FOUND);
        }

        const oldPriority = existing.priority || PRIORITY_LEVELS.NORMAL;
        await AppointmentCoordinationRepository.updateAppointmentPriority(appointmentId, priority);

        await AppointmentCoordinationRepository.createCoordinationLog({
            id: `ACRD_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            action_type: COORDINATION_ACTIONS.SET_PRIORITY,
            old_value: oldPriority,
            new_value: priority,
            reason,
            performed_by: userId,
        });
    }

    /**
     * Điều phối thủ công: chuyển BN sang BS khác
     */
    static async reassignDoctor(appointmentId: string, newDoctorId: string, reason: string, userId?: string): Promise<void> {
        if (!newDoctorId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', COORDINATION_ERRORS.MISSING_DOCTOR_ID);
        }

        const existing = await AppointmentRepository.findById(appointmentId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', COORDINATION_ERRORS.APPOINTMENT_NOT_FOUND);
        }

        if (!(REASSIGNABLE_STATUSES as readonly string[]).includes(existing.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'CANNOT_REASSIGN', COORDINATION_ERRORS.CANNOT_REASSIGN_STATUS);
        }

        if (existing.doctor_id === newDoctorId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SAME_DOCTOR', COORDINATION_ERRORS.SAME_DOCTOR);
        }

        const doctorOk = await AppointmentRepository.doctorExists(newDoctorId);
        if (!doctorOk) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', COORDINATION_ERRORS.DOCTOR_NOT_FOUND);
        }

        // Check BS mới có lịch làm việc ngày đó
        if (existing.slot_id) {
            const shiftId = await AppointmentRepository.getShiftIdBySlot(existing.slot_id);
            if (shiftId) {
                const available = await AppointmentRepository.isDoctorAvailableOnDate(newDoctorId, existing.appointment_date, shiftId);
                if (!available) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DOCTOR_NOT_AVAILABLE', COORDINATION_ERRORS.DOCTOR_NOT_AVAILABLE);
                }
            }

            const conflict = await AppointmentRepository.findDoctorConflict(newDoctorId, existing.appointment_date, existing.slot_id, appointmentId);
            if (conflict) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DOCTOR_CONFLICT', COORDINATION_ERRORS.DOCTOR_CONFLICT);
            }
        }

        const oldDoctorId = existing.doctor_id || 'Chưa gán';
        await AppointmentCoordinationRepository.updateAppointmentDoctor(appointmentId, newDoctorId);

        await AppointmentCoordinationRepository.createCoordinationLog({
            id: `ACRD_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            action_type: COORDINATION_ACTIONS.REASSIGN_DOCTOR,
            old_value: oldDoctorId,
            new_value: newDoctorId,
            reason,
            performed_by: userId,
        });

        /** Fix #6: Sync BS sang encounter nếu appointment đang IN_PROGRESS */
        if (existing.status === 'IN_PROGRESS') {
            try {
                const encounter = await EncounterRepository.findActiveByAppointmentId(appointmentId);
                if (encounter) {
                    await EncounterRepository.updateDoctor(encounter.encounters_id, newDoctorId);
                }
            } catch (err: any) {
                console.error('[REASSIGN_DOCTOR] Lỗi sync encounter:', err.message);
            }
        }

        // Gửi notification (fire-and-forget, gọi repository lấy accountId)
        this.sendNotificationSafe(existing);
    }

    /**
     * Tự động phân bổ BS cho lịch chưa gán
     */
    static async autoAssign(date: string, specialtyId?: string, branchId?: string, userId?: string): Promise<{
        assigned_count: number;
        failed_count: number;
        details: Array<{ appointment_id: string; doctor_assigned?: string; reason: string }>;
    }> {
        if (!date) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', COORDINATION_ERRORS.MISSING_DATE);

        const unassigned = await AppointmentCoordinationRepository.getUnassignedAppointments(date, specialtyId, branchId);
        if (unassigned.length === 0) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NO_UNASSIGNED', COORDINATION_ERRORS.NO_UNASSIGNED_FOUND);
        }

        const details: Array<{ appointment_id: string; doctor_assigned?: string; reason: string }> = [];
        let assignedCount = 0;
        let failedCount = 0;

        // Track tải in-memory khi round-robin
        const extraLoad: Record<string, number> = {};

        for (const apt of unassigned) {
            try {
                if (!apt.shift_id) {
                    details.push({ appointment_id: apt.appointments_id, reason: 'Lịch khám chưa có slot/ca' });
                    failedCount++;
                    continue;
                }

                // Lấy BS khả dụng cho ca này (gọi repository)
                const doctors = await AppointmentCoordinationRepository.getAvailableDoctorsForShift(date, apt.shift_id, specialtyId);
                if (doctors.length === 0) {
                    details.push({ appointment_id: apt.appointments_id, reason: 'Không có BS khả dụng cho ca này' });
                    failedCount++;
                    continue;
                }

                // Chọn BS ít tải nhất (tính cả extraLoad)
                let bestDoctor = doctors[0];
                let minLoad = (Number(bestDoctor.current_load) || 0) + (extraLoad[bestDoctor.doctor_id] || 0);
                for (const doc of doctors) {
                    const effectiveLoad = (Number(doc.current_load) || 0) + (extraLoad[doc.doctor_id] || 0);
                    if (effectiveLoad < minLoad) {
                        minLoad = effectiveLoad;
                        bestDoctor = doc;
                    }
                }

                // Check conflict cụ thể
                if (apt.slot_id) {
                    const conflict = await AppointmentRepository.findDoctorConflict(
                        bestDoctor.doctor_id, date, apt.slot_id, apt.appointments_id
                    );
                    if (conflict) {
                        details.push({ appointment_id: apt.appointments_id, reason: `BS ${bestDoctor.doctor_name} bị trùng lịch` });
                        failedCount++;
                        continue;
                    }
                }

                // Gán
                await AppointmentCoordinationRepository.updateAppointmentDoctor(apt.appointments_id, bestDoctor.doctor_id);
                extraLoad[bestDoctor.doctor_id] = (extraLoad[bestDoctor.doctor_id] || 0) + 1;

                await AppointmentCoordinationRepository.createCoordinationLog({
                    id: `ACRD_${uuidv4().substring(0, 12)}`,
                    appointment_id: apt.appointments_id,
                    action_type: COORDINATION_ACTIONS.AUTO_ASSIGN,
                    old_value: undefined,
                    new_value: bestDoctor.doctor_id,
                    reason: `Auto-assign: BS ít tải nhất (${minLoad} BN)`,
                    performed_by: userId,
                });

                details.push({
                    appointment_id: apt.appointments_id,
                    doctor_assigned: bestDoctor.doctor_name,
                    reason: `Gán thành công → ${bestDoctor.doctor_name} (${minLoad + 1} BN)`,
                });
                assignedCount++;
            } catch (err: any) {
                console.error(`[AUTO_ASSIGN] Lỗi gán appointment ${apt.appointments_id}:`, err.message || err);
                details.push({ appointment_id: apt.appointments_id, reason: `Lỗi: ${err.message || 'Lỗi hệ thống'}` });
                failedCount++;
            }
        }

        return { assigned_count: assignedCount, failed_count: failedCount, details };
    }

    /**
     * Xuất dữ liệu lịch sử cho AI/ML
     */
    static async getAIDataset(fromDate: string, toDate: string, branchId?: string) {
        if (!fromDate || !toDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE_RANGE', COORDINATION_ERRORS.MISSING_DATE_RANGE);
        }
        if (new Date(fromDate) > new Date(toDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', COORDINATION_ERRORS.INVALID_DATE_RANGE);
        }

        const { records, aggregations } = await AppointmentCoordinationRepository.getAIDataset(fromDate, toDate, branchId);
        return {
            period: { from_date: fromDate, to_date: toDate },
            total_records: records.length,
            data: records,
            aggregations,
        };
    }

    // ==================== HELPERS (không query DB trực tiếp) ====================

    /**
     * Gửi notification khi reassign BS (fire-and-forget).
     */
    private static async sendNotificationSafe(appointment: any): Promise<void> {
        try {
            if (!appointment.patient_id) return;
            const accountId = await AppointmentCoordinationRepository.getAccountIdByPatientId(appointment.patient_id);
            if (accountId) {
                await NotificationEngineService.triggerEvent({
                    template_code: APPOINTMENT_TEMPLATE_CODES.RESCHEDULED,
                    target_user_id: accountId,
                    variables: { appointment_code: appointment.appointment_code, doctor_changed: 'true' }
                });
            }
        } catch {
        }
    }
}
