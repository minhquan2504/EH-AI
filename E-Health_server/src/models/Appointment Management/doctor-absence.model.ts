import { AbsenceType } from '../../constants/doctor-absence.constant';

/** Entity bản ghi vắng đột xuất */
export interface DoctorAbsence {
    absence_id: string;
    doctor_id: string;
    absence_date: string;
    shift_id: string | null;
    absence_type: AbsenceType;
    reason: string | null;
    created_by: string | null;
    created_at: string;
    deleted_at: string | null;

    /** JOIN fields */
    doctor_name?: string;
    specialty_name?: string;
    shift_name?: string;
    created_by_name?: string;
}

/** Input tạo mới */
export interface CreateDoctorAbsenceInput {
    doctor_id: string;
    absence_date: string;
    shift_id?: string;
    absence_type: AbsenceType;
    reason?: string;
}
