export interface RoleDetail {
    roles_id: string;
    code: string;
    name: string;
    description: string;
    is_system: boolean;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateRoleInput {
    code: string;
    name: string;
    description?: string;
}

export interface UpdateRoleInput {
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface RoleQueryFilter {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    is_system?: boolean;
}
