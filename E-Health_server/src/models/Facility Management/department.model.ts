export interface DepartmentDropdown {
    departments_id: string;
    branch_id: string;
    code: string;
    name: string;
}

export interface DepartmentInfo extends DepartmentDropdown {
    description?: string;
    status: string;
    branch_name?: string;
    facility_name?: string;
}

export interface CreateDepartmentInput {
    branch_id: string;
    code: string;
    name: string;
    description?: string;
}

export interface UpdateDepartmentInput {
    name?: string;
    description?: string;
}

export interface DepartmentQuery {
    page?: number;
    limit?: number;
    search?: string;
    branch_id?: string;
    status?: string;
}
