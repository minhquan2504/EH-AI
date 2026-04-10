export interface UserSession {
  user_sessions_id: string;
  user_id: string;
  refresh_token_hash: string;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: Date;
  expired_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface CreateSessionInput {
  user_sessions_id?: string;
  userId: string;
  refreshTokenHash: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  expiredAt: Date;
}

export interface ClientInfo {
  deviceId?: string;
  deviceName?: string;
  ip?: string;
  userAgent?: string;
}