export enum AuditActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    EXPORT = 'EXPORT',
    OTHER = 'OTHER'
}

export interface AuditLog {
    log_id: string;
    user_id?: string;
    action_type: AuditActionType;
    module_name: string;
    target_id?: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
}

export interface AuditLogQueryFilters {
    user_id?: string;
    module_name?: string;
    action_type?: string;
    target_id?: string;
    start_date?: string;
    end_date?: string;
    page: number;
    limit: number;
}
