export interface PermissionDetail {
    permissions_id: string;
    code: string;
    module: string;
    description: string;
}

export interface CreatePermissionInput {
    code: string;
    module: string;
    description?: string;
}

export interface UpdatePermissionInput {
    module?: string;
    description?: string;
}

export interface PermissionQueryFilter {
    search?: string;
    module?: string;
}
