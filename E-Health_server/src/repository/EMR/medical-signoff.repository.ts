import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
    SignatureRecord,
    AuditLogEntry,
    PendingSignItem,
} from '../../models/EMR/medical-signoff.model';

type QueryExecutor = Pool | PoolClient;

function generateSigId(): string {
    return `SIG_${uuidv4().substring(0, 12)}`;
}

function generateAuditId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `SAL_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class SignOffRepository {

    //  ENCOUNTER HELPERS 

    /** Lấy encounter info cơ bản */
    static async getEncounter(encounterId: string): Promise<any | null> {
        const result = await pool.query(
            `SELECT e.*, up.full_name AS doctor_name
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             WHERE e.encounters_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /** Cập nhật encounter status + end_time */
    static async completeEncounter(encounterId: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE encounters SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE encounters_id = $1`,
            [encounterId]
        );
    }

    //  SIGNATURES 

    /** Tạo chữ ký (DRAFT hoặc OFFICIAL) */
    static async createSignature(
        encounterId: string,
        userId: string,
        signatureHash: string,
        signType: string,
        signScope: string,
        certificateSerial: string | null,
        clientIp: string | null,
        notes: string | null,
        client: QueryExecutor = pool
    ): Promise<SignatureRecord> {
        const id = generateSigId();
        const result = await client.query(
            `INSERT INTO emr_signatures
             (emr_signatures_id, encounter_id, signed_by, signature_hash, sign_type, sign_scope,
              certificate_serial, signed_at, client_ip, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP, $8,$9)
             RETURNING *`,
            [id, encounterId, userId, signatureHash, signType, signScope, certificateSerial, clientIp, notes]
        );
        return result.rows[0];
    }

    /** Lấy tất cả chữ ký của encounter (kèm tên) */
    static async getSignatures(encounterId: string): Promise<SignatureRecord[]> {
        const result = await pool.query(
            `SELECT s.*,
                    up_signer.full_name AS signer_name,
                    up_revoker.full_name AS revoker_name
             FROM emr_signatures s
             LEFT JOIN user_profiles up_signer ON up_signer.user_id = s.signed_by
             LEFT JOIN user_profiles up_revoker ON up_revoker.user_id = s.revoked_by
             WHERE s.encounter_id = $1
             ORDER BY s.signed_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    /** Lấy chữ ký theo ID */
    static async getSignatureById(sigId: string): Promise<SignatureRecord | null> {
        const result = await pool.query(
            `SELECT * FROM emr_signatures WHERE emr_signatures_id = $1`,
            [sigId]
        );
        return result.rows[0] || null;
    }

    /** Kiểm tra đã có OFFICIAL sign chưa revoke ở scope */
    static async hasOfficialSign(encounterId: string, scope: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM emr_signatures
                WHERE encounter_id = $1 AND sign_scope = $2
                  AND sign_type = 'OFFICIAL' AND is_revoked = FALSE
             ) AS exists`,
            [encounterId, scope]
        );
        return result.rows[0].exists;
    }

    /**
     * Kiểm tra encounter có bị khóa chỉnh sửa không.
     * Khóa khi có ÍT NHẤT 1 OFFICIAL sign (not revoked) ở scope ENCOUNTER.
     */
    static async isOfficiallyLocked(encounterId: string): Promise<boolean> {
        return this.hasOfficialSign(encounterId, 'ENCOUNTER');
    }

    /** Thu hồi chữ ký */
    static async revokeSignature(
        sigId: string,
        revokedBy: string,
        reason: string,
        client: QueryExecutor = pool
    ): Promise<void> {
        await client.query(
            `UPDATE emr_signatures SET is_revoked = TRUE, revoked_by = $2, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $3
             WHERE emr_signatures_id = $1`,
            [sigId, revokedBy, reason]
        );
    }

    /** Lấy tất cả OFFICIAL sign (not revoked) của encounter để verify */
    static async getOfficialSignatures(encounterId: string): Promise<SignatureRecord[]> {
        const result = await pool.query(
            `SELECT * FROM emr_signatures
             WHERE encounter_id = $1 AND sign_type = 'OFFICIAL' AND is_revoked = FALSE
             ORDER BY signed_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    /** Lấy locked scopes (các scope có OFFICIAL sign) */
    static async getLockedScopes(encounterId: string): Promise<Record<string, boolean>> {
        const allScopes = ['ENCOUNTER', 'CLINICAL_EXAM', 'DIAGNOSIS', 'PRESCRIPTION', 'MEDICAL_ORDER'];
        const result = await pool.query(
            `SELECT DISTINCT sign_scope FROM emr_signatures
             WHERE encounter_id = $1 AND sign_type = 'OFFICIAL' AND is_revoked = FALSE`,
            [encounterId]
        );
        const lockedSet = new Set(result.rows.map((r: any) => r.sign_scope));
        const map: Record<string, boolean> = {};

        /** Nếu ENCOUNTER bị lock → tất cả scope con cũng lock */
        const encounterLocked = lockedSet.has('ENCOUNTER');
        for (const scope of allScopes) {
            map[scope] = encounterLocked || lockedSet.has(scope);
        }
        return map;
    }

    /** Lấy info OFFICIAL signer đầu tiên (scope ENCOUNTER) */
    static async getOfficialSigner(encounterId: string): Promise<{ signer_name: string; signed_at: string } | null> {
        const result = await pool.query(
            `SELECT up.full_name AS signer_name, s.signed_at
             FROM emr_signatures s
             LEFT JOIN user_profiles up ON up.user_id = s.signed_by
             WHERE s.encounter_id = $1 AND s.sign_type = 'OFFICIAL' AND s.is_revoked = FALSE AND s.sign_scope = 'ENCOUNTER'
             ORDER BY s.signed_at ASC LIMIT 1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    //  AUDIT LOG 

    /** Ghi audit log */
    static async addAuditLog(
        encounterId: string,
        action: string,
        performedBy: string,
        signScope: string | null,
        details: any,
        clientIp: string | null,
        client: QueryExecutor = pool
    ): Promise<void> {
        const id = generateAuditId();
        await client.query(
            `INSERT INTO emr_sign_audit_log
             (emr_sign_audit_log_id, encounter_id, action, performed_by, sign_scope, details, client_ip)
             VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
            [id, encounterId, action, performedBy, signScope, JSON.stringify(details), clientIp]
        );
    }

    /** Lấy audit log */
    static async getAuditLog(encounterId: string): Promise<AuditLogEntry[]> {
        const result = await pool.query(
            `SELECT sal.*, up.full_name AS performer_name
             FROM emr_sign_audit_log sal
             LEFT JOIN user_profiles up ON up.user_id = sal.performed_by
             WHERE sal.encounter_id = $1
             ORDER BY sal.performed_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    //  PENDING 

    /** DS encounter chờ ký (COMPLETED hoặc finalized, chưa có OFFICIAL sign) — lọc theo BS */
    static async getPendingForDoctor(doctorUserId: string): Promise<PendingSignItem[]> {
        const result = await pool.query(
            `SELECT e.encounters_id, e.encounter_type, e.start_time, e.end_time, e.status,
                    COALESCE(e.is_finalized, FALSE) AS is_finalized,
                    up_pat.full_name AS patient_name, pat.patient_code,
                    up_doc.full_name AS doctor_name,
                    EXISTS(SELECT 1 FROM emr_signatures s
                           WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'DRAFT' AND s.is_revoked = FALSE) AS has_draft_sign,
                    EXISTS(SELECT 1 FROM emr_signatures s
                           WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'OFFICIAL' AND s.is_revoked = FALSE AND s.sign_scope = 'ENCOUNTER') AS has_official_sign,
                    CASE WHEN e.status = 'COMPLETED' AND COALESCE(e.is_finalized, FALSE) = TRUE THEN 'READY_TO_SIGN'
                         WHEN e.status = 'COMPLETED' THEN 'NEEDS_FINALIZE'
                         ELSE 'NOT_COMPLETED' END AS completeness_status
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN patients pat ON pat.id::text = e.patient_id
             LEFT JOIN user_profiles up_pat ON up_pat.user_id = pat.user_id
             WHERE d.user_id = $1
               AND e.status IN ('COMPLETED', 'IN_PROGRESS', 'WAITING_FOR_RESULTS')
               AND NOT EXISTS(
                   SELECT 1 FROM emr_signatures s
                   WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'OFFICIAL'
                     AND s.is_revoked = FALSE AND s.sign_scope = 'ENCOUNTER'
               )
             ORDER BY e.start_time DESC`,
            [doctorUserId]
        );
        return result.rows;
    }

    /** DS encounter chờ ký — ADMIN xem tất cả (không lọc theo BS) */
    static async getPendingAll(): Promise<PendingSignItem[]> {
        const result = await pool.query(
            `SELECT e.encounters_id, e.encounter_type, e.start_time, e.end_time, e.status,
                    COALESCE(e.is_finalized, FALSE) AS is_finalized,
                    up_pat.full_name AS patient_name, pat.patient_code,
                    up_doc.full_name AS doctor_name,
                    EXISTS(SELECT 1 FROM emr_signatures s
                           WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'DRAFT' AND s.is_revoked = FALSE) AS has_draft_sign,
                    EXISTS(SELECT 1 FROM emr_signatures s
                           WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'OFFICIAL' AND s.is_revoked = FALSE AND s.sign_scope = 'ENCOUNTER') AS has_official_sign,
                    CASE WHEN e.status = 'COMPLETED' AND COALESCE(e.is_finalized, FALSE) = TRUE THEN 'READY_TO_SIGN'
                         WHEN e.status = 'COMPLETED' THEN 'NEEDS_FINALIZE'
                         ELSE 'NOT_COMPLETED' END AS completeness_status
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN patients pat ON pat.id::text = e.patient_id
             LEFT JOIN user_profiles up_pat ON up_pat.user_id = pat.user_id
             WHERE e.status IN ('COMPLETED', 'IN_PROGRESS', 'WAITING_FOR_RESULTS')
               AND NOT EXISTS(
                   SELECT 1 FROM emr_signatures s
                   WHERE s.encounter_id = e.encounters_id AND s.sign_type = 'OFFICIAL'
                     AND s.is_revoked = FALSE AND s.sign_scope = 'ENCOUNTER'
               )
             ORDER BY e.start_time DESC`
        );
        return result.rows;
    }

    //  HASH HELPERS 

    /** Tạo SHA-256 hash từ data */
    static generateHash(data: any): string {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    /** Lấy snapshot data cho hash */
    static async getSnapshotData(encounterId: string): Promise<any | null> {
        const result = await pool.query(
            `SELECT snapshot_data FROM emr_record_snapshots WHERE encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0]?.snapshot_data || null;
    }

    /**
     * Tổng hợp data hiện tại để tạo hash (cho DRAFT sign khi chưa có snapshot)
     */
    static async getCurrentRecordData(encounterId: string): Promise<any> {
        const [encounter, clinicalExam, diagnoses, orders, prescription] = await Promise.all([
            pool.query(`SELECT * FROM encounters WHERE encounters_id = $1`, [encounterId]),
            pool.query(`SELECT * FROM clinical_examinations WHERE encounter_id = $1`, [encounterId]),
            pool.query(`SELECT * FROM encounter_diagnoses WHERE encounter_id = $1 ORDER BY created_at`, [encounterId]),
            pool.query(`SELECT * FROM medical_orders WHERE encounter_id = $1 ORDER BY ordered_at`, [encounterId]),
            pool.query(`SELECT * FROM prescriptions WHERE encounter_id = $1`, [encounterId]),
        ]);

        return {
            encounter: encounter.rows[0] || null,
            clinical_examination: clinicalExam.rows[0] || null,
            diagnoses: diagnoses.rows,
            medical_orders: orders.rows,
            prescription: prescription.rows[0] || null,
        };
    }
}
