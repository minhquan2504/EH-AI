export interface ApiPermissionDetail {
    api_id: string;
    method: string;
    endpoint: string;
    description: string | null;
    module: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

export interface CreateApiPermissionInput {
    method: string;
    endpoint: string;
    description?: string;
    module?: string;
}

export interface UpdateApiPermissionInput {
    method?: string;
    endpoint?: string;
    description?: string | null;
    module?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface ApiPermissionQueryFilter {
    search?: string;
    module?: string;
    method?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}
