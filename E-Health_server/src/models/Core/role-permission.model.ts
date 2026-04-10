export interface RolePermissionDetail {
    permission_id: string;
    code: string;
    module: string;
    description: string;
}

export interface AssignPermissionInput {
    permission_id: string;
}

export interface ReplacePermissionsInput {
    permissions: string[];
}
