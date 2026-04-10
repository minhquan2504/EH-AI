import { User } from "./auth_account.model";

export interface UserProfile {
    user_profiles_id: string;
    user_id: string;
    full_name: string;
    dob: Date | null;
    gender: string | null;
    identity_card_number: string | null;
    avatar_url: string | null;
    address: string | null;
}

export interface UserDetail extends Omit<User, 'password_hash'> {
    profile: Omit<UserProfile, 'user_id'>;
}

export interface CreateUserInput {
    email?: string;
    phone?: string;
    password?: string;
    roles: string[];
    full_name: string;
    dob?: Date;
    gender?: string;
    identity_card_number?: string;
    address?: string;
}

export interface UpdateProfileInput {
    full_name?: string;
    dob?: Date | null;
    gender?: string | null;
    identity_card_number?: string | null;
    avatar_url?: string | null;
    address?: string | null;
}

export interface UpdateUserByAdminInput extends UpdateProfileInput {
    email?: string;
    phone?: string;
    roles?: string[];
    status?: User['status'];
}

/**
 * Interface cho việc truy vấn phân trang danh sách Users
 */
export interface UserQueryFilter {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
}

export interface PaginatedUsers {
    items: UserDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface UpdateUserStatusInput {
    status: User['status'];
    reason?: string;
}

export interface AccountStatusHistory {
    log_id: string;
    user_id: string;
    action_type: string;
    old_value: any;
    new_value: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    changed_by_name?: string;
}

export interface ResetPasswordAdminInput {
    newPassword?: string;
}

export interface ChangePasswordInput {
    oldPassword: string;
    newPassword: string;
}

export interface AssignRoleInput {
    role: string;
}
