/**
 * Appointment Service
 * Xử lý các chức năng liên quan đến lịch hẹn khám
 */

import axiosClient from '@/api/axiosClient';
import { APPOINTMENT_ENDPOINTS, APPOINTMENT_STATUS_ENDPOINTS, APPOINTMENT_CONFIRMATION_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    date: string;
    time: string;
    type: string;
    status: string;
    reason?: string;
    notes?: string;
    phone?: string;
    age?: number;
    gender?: string;
    queueStatus?: string;
    checkInTime?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentData {
    patientId?: string;
    patientName?: string;
    phone?: string;
    doctorId?: string;
    doctorName?: string;
    departmentId?: string;
    departmentName?: string;
    date: string;
    time: string;
    type?: string;
    reason?: string;
    note?: string;
    serviceId?: string;
}

export interface AppointmentListResponse {
    success: boolean;
    data: Appointment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Helpers — unwrap response
// ============================================
const unwrapList = (res: any): Appointment[] => {
    const d = res?.data?.data ?? res?.data ?? res;
    return Array.isArray(d) ? d : [];
};

const unwrapOne = (res: any): any => res?.data?.data ?? res?.data ?? res;

// ============================================
// Lấy danh sách lịch hẹn
// ============================================
export const getAppointments = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    doctorId?: string;
    patientId?: string;
}): Promise<AppointmentListResponse> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.LIST, { params });
        const raw = response.data;
        // Normalize pagination wrapper
        if (raw?.data && Array.isArray(raw.data)) {
            return { success: true, data: raw.data, pagination: raw.pagination ?? { page: 1, limit: 20, total: raw.data.length, totalPages: 1 } };
        }
        const items = Array.isArray(raw) ? raw : (raw?.items ?? raw?.appointments ?? []);
        return { success: true, data: items, pagination: { page: 1, limit: items.length, total: items.length, totalPages: 1 } };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách lịch hẹn thất bại');
    }
};

// ============================================
// Lấy chi tiết lịch hẹn
// ============================================
export const getAppointmentById = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.DETAIL(id));
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin lịch hẹn thất bại');
    }
};

// ============================================
// Tạo lịch hẹn mới
// ============================================
export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
    try {
        const payload: Record<string, any> = {
            date: data.date,
            time: data.time,
        };
        if (data.patientId) payload.patient_id = data.patientId;
        if (data.patientName) payload.patient_name = data.patientName;
        if (data.phone) payload.phone = data.phone;
        if (data.doctorId) payload.doctor_id = data.doctorId;
        if (data.doctorName) payload.doctor_name = data.doctorName;
        if (data.departmentId) payload.department_id = data.departmentId;
        if (data.departmentName) payload.department_name = data.departmentName;
        if (data.type) payload.type = data.type;
        if (data.reason) payload.reason = data.reason;
        if (data.note) payload.notes = data.note;
        if (data.serviceId) payload.service_id = data.serviceId;

        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CREATE, payload);
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo lịch hẹn thất bại');
    }
};

// ============================================
// Cập nhật lịch hẹn
// ============================================
export const updateAppointment = async (
    id: string,
    data: Partial<CreateAppointmentData>
): Promise<Appointment> => {
    try {
        const payload: Record<string, any> = {};
        if (data.patientId) payload.patient_id = data.patientId;
        if (data.doctorId) payload.doctor_id = data.doctorId;
        if (data.date) payload.date = data.date;
        if (data.time) payload.time = data.time;
        if (data.type) payload.type = data.type;
        if (data.reason) payload.reason = data.reason;
        const response = await axiosClient.put(APPOINTMENT_ENDPOINTS.UPDATE(id), payload);
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật lịch hẹn thất bại');
    }
};

// ============================================
// Xác nhận lịch hẹn
// ============================================
export const confirmAppointment = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CONFIRM(id), {});
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xác nhận lịch hẹn thất bại');
    }
};

// ============================================
// Hủy lịch hẹn
// ============================================
export const cancelAppointment = async (id: string, reason?: string): Promise<void> => {
    try {
        await axiosClient.post(APPOINTMENT_ENDPOINTS.CANCEL(id), { reason });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Hủy lịch hẹn thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bác sĩ
// ============================================
export const getAppointmentsByDoctor = async (
    doctorId: string,
    params?: { date?: string; status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_DOCTOR(doctorId), { params });
        return unwrapList(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bác sĩ thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bệnh nhân
// ============================================
export const getAppointmentsByPatient = async (
    patientId: string,
    params?: { status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_PATIENT(patientId), { params });
        return unwrapList(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bệnh nhân thất bại');
    }
};

// ============================================
// Doctor Availability (slot trống BS)
// /api/doctor-availability
// ============================================
export const doctorAvailabilityService = {
    /** GET /api/doctor-availability?doctorId=X&date=Y */
    getSlots: (params: { doctorId: string; date: string }) =>
        axiosClient.get('/api/doctor-availability', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    /** GET /api/doctor-availability/available — Tất cả slot trống */
    getAvailable: (params?: { date?: string; departmentId?: string }) =>
        axiosClient.get('/api/doctor-availability/available', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    /** POST /api/doctor-availability — Tạo slot */
    create: (data: { doctorId: string; date: string; startTime: string; endTime: string; maxPatients?: number }) =>
        axiosClient.post('/api/doctor-availability', data).then(r => r?.data?.data ?? r?.data ?? r),

    /** PUT /api/doctor-availability/:id */
    update: (id: string, data: object) =>
        axiosClient.put(`/api/doctor-availability/${id}`, data).then(r => r?.data?.data ?? r?.data ?? r),

    /** DELETE /api/doctor-availability/:id */
    delete: (id: string) =>
        axiosClient.delete(`/api/doctor-availability/${id}`).then(r => r?.data ?? r),
};

// ============================================
// Appointment Slots
// /api/appointment-slots
// ============================================
export const appointmentSlotsService = {
    getAll: (params?: { doctorId?: string; date?: string; status?: string }) =>
        axiosClient.get('/api/appointment-slots', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/appointment-slots/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    create: (data: object) =>
        axiosClient.post('/api/appointment-slots', data).then(r => r?.data?.data ?? r?.data ?? r),

    update: (id: string, data: object) =>
        axiosClient.put(`/api/appointment-slots/${id}`, data).then(r => r?.data?.data ?? r?.data ?? r),

    delete: (id: string) =>
        axiosClient.delete(`/api/appointment-slots/${id}`).then(r => r?.data ?? r),
};

// ============================================
// Appointment Changes (dời lịch)
// /api/appointment-changes
// ============================================
export const appointmentChangesService = {
    getAll: (params?: { appointmentId?: string; status?: string }) =>
        axiosClient.get('/api/appointment-changes', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/appointment-changes/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    request: (data: { appointmentId: string; newDate: string; newTime: string; reason?: string }) =>
        axiosClient.post('/api/appointment-changes', data).then(r => r?.data?.data ?? r?.data ?? r),

    approve: (id: string) =>
        axiosClient.post(`/api/appointment-changes/${id}/approve`, {}).then(r => r?.data?.data ?? r?.data ?? r),

    reject: (id: string, reason?: string) =>
        axiosClient.post(`/api/appointment-changes/${id}/reject`, { reason }).then(r => r?.data?.data ?? r?.data ?? r),
};

// ============================================
// Appointment Confirmations
// /api/appointment-confirmations
// ============================================
export const appointmentConfirmationService = {
    confirm: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.CONFIRM(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    checkIn: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.CHECK_IN(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    sendReminder: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.SEND_REMINDER(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    batchConfirm: (ids: string[]) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_CONFIRM, { ids }).then(r => r?.data?.data ?? r?.data ?? r),

    batchReminder: (ids: string[]) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_REMINDER, { ids }).then(r => r?.data?.data ?? r?.data ?? r),

    getReminderSettings: () =>
        axiosClient.get(APPOINTMENT_CONFIRMATION_ENDPOINTS.REMINDER_SETTINGS).then(r => r?.data?.data ?? r?.data ?? r),

    updateReminderSettings: (data: object) =>
        axiosClient.put(APPOINTMENT_CONFIRMATION_ENDPOINTS.REMINDER_SETTINGS, data).then(r => r?.data?.data ?? r?.data ?? r),
};

// ============================================
// Doctor Absences
// /api/doctor-absences
// ============================================
export const doctorAbsencesService = {
    getAll: (params?: { doctorId?: string; fromDate?: string; toDate?: string }) =>
        axiosClient.get('/api/doctor-absences', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/doctor-absences/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    create: (data: { doctorId: string; fromDate: string; toDate: string; reason?: string }) =>
        axiosClient.post('/api/doctor-absences', data).then(r => r?.data?.data ?? r?.data ?? r),

    delete: (id: string) =>
        axiosClient.delete(`/api/doctor-absences/${id}`).then(r => r?.data ?? r),
};
