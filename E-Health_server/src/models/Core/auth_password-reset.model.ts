export interface PasswordReset {
  password_resets_id: string;
  userId: string;
  resetToken: string;
  expiredAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreatePasswordResetInput {
  userId: string;
  resetTokenHash: string;
  expiredAt: Date;
}