/** Chữ ký mở rộng (sau ALTER) */
export interface SignatureRecord {
    emr_signatures_id: string;
    encounter_id: string;
    signed_by: string;
    signature_hash: string;
    certificate_serial: string | null;
    signed_at: string;
    client_ip: string | null;
    sign_type: string;
    sign_scope: string;
    is_revoked: boolean;
    revoked_by: string | null;
    revoked_at: string | null;
    revoked_reason: string | null;
    notes: string | null;
    signer_name?: string;
    revoker_name?: string;
}

/** Input ký nháp / chính thức */
export interface SignInput {
    sign_scope?: string;
    notes?: string;
    certificate_serial?: string;
}

/** Input thu hồi */
export interface RevokeInput {
    signature_id: string;
    reason: string;
}

/** Kết quả xác minh 1 chữ ký */
export interface VerifyItem {
    sign_scope: string;
    sign_type: string;
    original_hash: string;
    current_hash: string;
    is_match: boolean;
}

/** Kết quả xác minh toàn bộ */
export interface VerifyResult {
    encounter_id: string;
    is_valid: boolean;
    verified_at: string;
    signatures: VerifyItem[];
}

/** Trạng thái khóa */
export interface LockStatus {
    encounter_id: string;
    is_finalized: boolean;
    is_officially_signed: boolean;
    locked_scopes: Record<string, boolean>;
    signed_by: string | null;
    signed_at: string | null;
}

/** Audit log entry */
export interface AuditLogEntry {
    emr_sign_audit_log_id: string;
    encounter_id: string;
    action: string;
    performed_by: string;
    performer_name?: string;
    sign_scope: string | null;
    details: any;
    client_ip: string | null;
    performed_at: string;
}

/** Encounter chờ ký */
export interface PendingSignItem {
    encounters_id: string;
    encounter_type: string;
    start_time: string;
    end_time: string | null;
    status: string;
    is_finalized: boolean;
    patient_name: string;
    patient_code: string;
    has_draft_sign: boolean;
    has_official_sign: boolean;
    completeness_status: string;
}
