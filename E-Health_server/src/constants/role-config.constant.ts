import { AccountRole } from '../models/Core/auth_account.model';

export const ROLE_CONFIG: Record<AccountRole, { prefix: string; sequence: string }> = {
    CUSTOMER: { prefix: 'CUS', sequence: 'seq_account_customer' },
    DOCTOR: { prefix: 'DOC', sequence: 'seq_account_doctor' },
    PATIENT: { prefix: 'PAT', sequence: 'seq_account_patient' },
    NURSE: { prefix: 'NUR', sequence: 'seq_account_nurse' },
    PHARMACIST: { prefix: 'PHA', sequence: 'seq_account_pharmacist' },
    STAFF: { prefix: 'STA', sequence: 'seq_account_staff' },
    ADMIN: { prefix: 'ADM', sequence: 'seq_account_admin' },
    SYSTEM: { prefix: 'SYS', sequence: 'seq_account_system' },
};