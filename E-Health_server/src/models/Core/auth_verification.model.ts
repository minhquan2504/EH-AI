export interface AccountVerification {
    account_verifications_id: string;
    userId: string;
    verifyTokenHash: string;
    expiredAt: Date;
    usedAt: Date | null;
    createdAt: Date;
}