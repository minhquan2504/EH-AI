export interface UserProfileResponse {
    users_id: string;
    email: string;
    phone_number: string | null;
    status: string;
    last_login_at: Date | null;
    full_name: string;
    dob: Date | null;
    gender: string | null;
    identity_card_number: string | null;
    avatar_url: string | null;
    address: string | null;
    preferences: any;
    roles: string[];
}

export interface UpdateProfileInput {
    full_name?: string;
    dob?: Date;
    gender?: string;
    address?: string;
    avatar_url?: string;
    identity_card_number?: string;
}

export interface ChangePasswordInput {
    old_password: string;
    new_password: string;
}

export interface UpdateSettingsInput {
    preferences: any;
}

export interface SessionResponse {
    user_sessions_id: string;
    device_name: string | null;
    ip_address: string | null;
    last_used_at: Date;
    expired_at: Date;
    revoked_at: Date | null;
    is_current: boolean;
}
