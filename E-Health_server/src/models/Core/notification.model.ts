export interface NotificationCategory {
    notification_categories_id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

export interface NotificationTemplate {
    notification_templates_id: string;
    category_id: string;
    code: string;
    name: string;
    title_template: string;
    body_inapp: string;
    body_email: string | null;
    body_push: string | null;
    is_system: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

export interface NotificationRoleConfig {
    notification_role_configs_id: string;
    role_id: string;
    category_id: string;
    allow_inapp: boolean;
    allow_email: boolean;
    allow_push: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface UserNotification {
    user_notifications_id: string;
    user_id: string;
    template_id: string | null;
    title: string;
    content: string;
    data_payload: any;
    is_read: boolean;
    read_at: Date | null;
    created_at: Date;
}

// DTOs cho Category

export interface CreateCategoryInput {
    code: string;
    name: string;
    description?: string;
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string;
    is_active?: boolean;
}

// DTOs cho Template

export interface CreateTemplateInput {
    category_id: string;
    code: string;
    name: string;
    title_template: string;
    body_inapp: string;
    body_email?: string;
    body_push?: string;
}

export interface UpdateTemplateInput {
    category_id?: string;
    name?: string;
    title_template?: string;
    body_inapp?: string;
    body_email?: string;
    body_push?: string;
    is_active?: boolean;
}

// DTOs cho Role Configs

export interface UpdateRoleConfigInput {
    allow_inapp: boolean;
    allow_email: boolean;
    allow_push: boolean;
}

// DTOs cho Sending/Triggering
export interface CustomNotificationInput {
    role_id?: string;
    title: string;
    content: string;
    body_email?: string;
    body_push?: string;
    data_payload?: any;
}

export interface TriggerEventInput {
    template_code: string;
    variables: Record<string, any>;
    target_user_id: string;
}

export interface FcmToken {
    token_id: string;
    user_id: string;
    fcm_token: string;
    device_name?: string;
    last_active: Date;
}

export interface RegisterFcmTokenInput {
    fcm_token: string;
    device_name?: string;
}
