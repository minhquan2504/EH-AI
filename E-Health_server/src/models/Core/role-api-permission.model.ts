import { ApiPermissionDetail } from './api-permission.model';

export interface RoleApiPermissionDetail {
    role_id: string;
    role_name: string;
    role_code: string;
    api_id: string;
    method: string;
    endpoint: string;
    description: string | null;
    module: string | null;
    status: string;
}

export interface AssignApiPermissionInput {
    api_id: string;
}
