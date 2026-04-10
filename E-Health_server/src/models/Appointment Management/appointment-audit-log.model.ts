// src/models/Appointment Management/appointment-audit-log.model.ts

export interface AppointmentAuditLog {
    appointment_audit_logs_id: string;
    appointment_id: string;
    changed_by?: string | null;
    old_status?: string | null;
    new_status?: string | null;
    action_note?: string;
    created_at: string;

    changed_by_name?: string;
}

export interface CreateAuditLogInput {
    appointment_id: string;
    changed_by?: string;
    old_status?: string | null;
    new_status?: string | null;
    action_note?: string;
}
