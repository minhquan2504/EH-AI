import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { SignOffRepository } from '../../repository/EMR/medical-signoff.repository';
import { MedicalRecordRepository } from '../../repository/EMR/medical-record.repository';
import { MedicalRecordService } from '../../services/EMR/medical-record.service';
import {
    SignInput,
    RevokeInput,
    VerifyResult,
    VerifyItem,
    LockStatus,
} from '../../models/EMR/medical-signoff.model';
import {
    SIGN_TYPE,
    SIGN_SCOPE,
    SIGNOFF_ACTION,
    COMPLETABLE_STATUSES,
    SIGNOFF_ERRORS,
} from '../../constants/medical-signoff.constant';
import { MIN_COMPLETENESS_SCORE } from '../../constants/medical-record.constant';


export class SignOffService {

    //  XÁC NHẬN HOÀN TẤT KHÁM 

    /**
     * Chuyển encounter → COMPLETED.
     * Chỉ BS phụ trách hoặc ADMIN.
     */
    static async completeEncounter(encounterId: string, userId: string, roles: string[], clientIp: string | null) {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);

        if (!COMPLETABLE_STATUSES.includes(encounter.status)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_COMPLETABLE', SIGNOFF_ERRORS.NOT_COMPLETABLE);
        }

        /** Chỉ BS phụ trách hoặc ADMIN */
        const isAdmin = roles.includes('ADMIN');
        if (!isAdmin) {
            const doctorResult = await pool.query(
                `SELECT d.user_id FROM doctors d WHERE d.doctors_id = $1`, [encounter.doctor_id]
            );
            const doctorUserId = doctorResult.rows[0]?.user_id;
            if (doctorUserId !== userId) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, 'NOT_DOCTOR_OWNER', SIGNOFF_ERRORS.NOT_DOCTOR_OWNER);
            }
        }

        /** Kiểm tra completeness */
        const completeness = await MedicalRecordService.getCompleteness(encounterId);
        if (completeness.score < MIN_COMPLETENESS_SCORE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'COMPLETENESS_TOO_LOW', SIGNOFF_ERRORS.COMPLETENESS_TOO_LOW);
        }

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            await SignOffRepository.completeEncounter(encounterId, client);

            await SignOffRepository.addAuditLog(
                encounterId, SIGNOFF_ACTION.ENCOUNTER_COMPLETED, userId, null,
                { completeness_score: completeness.score, previous_status: encounter.status },
                clientIp, client
            );

            await MedicalRecordRepository.addTimelineEvent(
                encounter.patient_id, new Date().toISOString(), 'ENCOUNTER_COMPLETED',
                `Hoàn tất khám — ${encounter.encounter_type}`,
                `BS: ${encounter.doctor_name || 'N/A'}, Score: ${completeness.score}%`,
                encounterId, 'encounters', client
            );

            await client.query('COMMIT');

            return {
                encounters_id: encounterId,
                status: 'COMPLETED',
                end_time: new Date().toISOString(),
                completeness_score: completeness.score,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    //  KÝ NHÁP 

    /**
     * Ký nháp: không khóa data, ghi hash hiện tại
     */
    static async draftSign(encounterId: string, input: SignInput, userId: string, clientIp: string | null) {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);

        if (encounter.status !== 'COMPLETED' && !encounter.is_finalized) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_COMPLETED', SIGNOFF_ERRORS.NOT_COMPLETED);
        }

        const scope = input.sign_scope || SIGN_SCOPE.ENCOUNTER;
        this.validateScope(scope);

        /** Hash từ data hiện tại */
        const recordData = await SignOffRepository.getCurrentRecordData(encounterId);
        const hash = SignOffRepository.generateHash(recordData);

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const sig = await SignOffRepository.createSignature(
                encounterId, userId, hash, SIGN_TYPE.DRAFT, scope,
                input.certificate_serial || null, clientIp, input.notes || null, client
            );

            await SignOffRepository.addAuditLog(
                encounterId, SIGNOFF_ACTION.DRAFT_SIGNED, userId, scope,
                { signature_id: sig.emr_signatures_id, hash: hash.substring(0, 16) },
                clientIp, client
            );

            await client.query('COMMIT');
            return sig;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    //  KÝ CHÍNH THỨC 

    /**
     * Ký chính thức: phải đã finalize, khóa data sau khi ký.
     * Hash từ snapshot (bất biến).
     */
    static async officialSign(encounterId: string, input: SignInput, userId: string, clientIp: string | null) {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);

        if (!encounter.is_finalized) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_FINALIZED', SIGNOFF_ERRORS.NOT_FINALIZED);
        }

        const scope = input.sign_scope || SIGN_SCOPE.ENCOUNTER;
        this.validateScope(scope);

        /** Kiểm tra chưa có OFFICIAL sign ở scope này */
        const alreadySigned = await SignOffRepository.hasOfficialSign(encounterId, scope);
        if (alreadySigned) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_SIGNED', SIGNOFF_ERRORS.ALREADY_OFFICIAL_SIGNED);
        }

        /** Hash từ snapshot (bất biến) */
        const snapshotData = await SignOffRepository.getSnapshotData(encounterId);
        if (!snapshotData) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SNAPSHOT_NOT_FOUND', SIGNOFF_ERRORS.SNAPSHOT_NOT_FOUND);
        }
        const hash = SignOffRepository.generateHash(snapshotData);

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            const sig = await SignOffRepository.createSignature(
                encounterId, userId, hash, SIGN_TYPE.OFFICIAL, scope,
                input.certificate_serial || null, clientIp, input.notes || null, client
            );

            await SignOffRepository.addAuditLog(
                encounterId, SIGNOFF_ACTION.OFFICIAL_SIGNED, userId, scope,
                { signature_id: sig.emr_signatures_id, hash: hash.substring(0, 16) },
                clientIp, client
            );

            await MedicalRecordRepository.addTimelineEvent(
                encounter.patient_id, new Date().toISOString(), 'EMR_OFFICIAL_SIGNED',
                `Ký chính thức hồ sơ — ${scope}`,
                `Hash: ${hash.substring(0, 16)}...`,
                encounterId, 'emr_signatures', client
            );

            await client.query('COMMIT');
            return sig;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    //  THU HỒI 

    static async revoke(encounterId: string, input: RevokeInput, userId: string, clientIp: string | null) {
        if (!input.signature_id) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING', SIGNOFF_ERRORS.MISSING_SIGNATURE_ID);
        if (!input.reason) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING', SIGNOFF_ERRORS.MISSING_REASON);

        const sig = await SignOffRepository.getSignatureById(input.signature_id);
        if (!sig || sig.encounter_id !== encounterId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.SIGNATURE_NOT_FOUND);
        }
        if (sig.is_revoked) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_REVOKED', SIGNOFF_ERRORS.ALREADY_REVOKED);
        }

        const client = await pool.connect() as PoolClient;
        try {
            await client.query('BEGIN');

            await SignOffRepository.revokeSignature(input.signature_id, userId, input.reason, client);

            await SignOffRepository.addAuditLog(
                encounterId, SIGNOFF_ACTION.SIGN_REVOKED, userId, sig.sign_scope,
                { signature_id: sig.emr_signatures_id, sign_type: sig.sign_type, reason: input.reason },
                clientIp, client
            );

            const encounter = await SignOffRepository.getEncounter(encounterId);
            if (encounter) {
                await MedicalRecordRepository.addTimelineEvent(
                    encounter.patient_id, new Date().toISOString(), 'SIGN_REVOKED',
                    `Thu hồi chữ ký ${sig.sign_type} — ${sig.sign_scope}`,
                    input.reason.substring(0, 200),
                    sig.emr_signatures_id, 'emr_signatures', client
                );
            }

            await client.query('COMMIT');
            return { revoked: true, signature_id: sig.emr_signatures_id };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    //  XEM CHỮ KÝ 

    static async getSignatures(encounterId: string) {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);
        return SignOffRepository.getSignatures(encounterId);
    }

    //  XÁC MINH 

    /**
     * So sánh hash hiện tại vs hash lúc ký.
     * OFFICIAL ký trên snapshot → so snapshot hash hiện tại.
     */
    static async verify(encounterId: string, userId: string, clientIp: string | null): Promise<VerifyResult> {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);

        const officialSigs = await SignOffRepository.getOfficialSignatures(encounterId);
        const snapshotData = await SignOffRepository.getSnapshotData(encounterId);

        const verifyItems: VerifyItem[] = [];
        let allValid = true;

        for (const sig of officialSigs) {
            const currentHash = snapshotData ? SignOffRepository.generateHash(snapshotData) : 'NO_SNAPSHOT';
            const isMatch = sig.signature_hash === currentHash;
            if (!isMatch) allValid = false;

            verifyItems.push({
                sign_scope: sig.sign_scope,
                sign_type: sig.sign_type,
                original_hash: sig.signature_hash,
                current_hash: currentHash,
                is_match: isMatch,
            });
        }

        /** Ghi audit log */
        await SignOffRepository.addAuditLog(
            encounterId, SIGNOFF_ACTION.INTEGRITY_VERIFIED, userId, null,
            { is_valid: allValid, total_signatures: officialSigs.length },
            clientIp
        );

        return {
            encounter_id: encounterId,
            is_valid: allValid,
            verified_at: new Date().toISOString(),
            signatures: verifyItems,
        };
    }

    //  TRẠNG THÁI KHÓA 

    static async getLockStatus(encounterId: string): Promise<LockStatus> {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);

        const lockedScopes = await SignOffRepository.getLockedScopes(encounterId);
        const officialSigner = await SignOffRepository.getOfficialSigner(encounterId);
        const isOfficiallySigned = Object.values(lockedScopes).some(v => v);

        return {
            encounter_id: encounterId,
            is_finalized: encounter.is_finalized || false,
            is_officially_signed: isOfficiallySigned,
            locked_scopes: lockedScopes,
            signed_by: officialSigner?.signer_name || null,
            signed_at: officialSigner?.signed_at || null,
        };
    }

    //  AUDIT LOG 

    static async getAuditLog(encounterId: string) {
        const encounter = await SignOffRepository.getEncounter(encounterId);
        if (!encounter) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', SIGNOFF_ERRORS.ENCOUNTER_NOT_FOUND);
        return SignOffRepository.getAuditLog(encounterId);
    }

    //  PENDING 

    static async getPendingForDoctor(userId: string, roles: string[]) {
        const isAdmin = roles.includes('ADMIN');
        if (isAdmin) {
            return SignOffRepository.getPendingAll();
        }
        return SignOffRepository.getPendingForDoctor(userId);
    }

    //  HELPER 

    private static validateScope(scope: string) {
        const validScopes = Object.values(SIGN_SCOPE);
        if (!validScopes.includes(scope as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_SCOPE', SIGNOFF_ERRORS.INVALID_SIGN_SCOPE);
        }
    }
}
