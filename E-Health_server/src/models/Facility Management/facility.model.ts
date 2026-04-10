export interface AssignUserFacilityInput {
    branchId: string;
    departmentId?: string;
    roleTitle?: string;
}

export interface RemoveUserFacilityInput {
    reason: string;
}


export interface UserFacilityInfo {
    user_branch_dept_id: string;
    branch_id: string;
    branch_code: string;
    branch_name: string;
    facility_id: string;
    facility_code: string;
    facility_name: string;
    department_id: string | null;
    department_code: string | null;
    department_name: string | null;
    role_title: string | null;
    status: string;
}

export interface FacilityDropdown {
    facilities_id: string;
    code: string;
    name: string;
}

// Thông tin chi tiết cơ sở y tế
export interface FacilityInfo {
    facilities_id: string;
    code: string;
    name: string;
    tax_code: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    logo_url: string | null;
    headquarters_address: string | null;
    status: string;
    updated_at: Date;
    deleted_at?: Date | null;
}

// Input để Admin cập nhật thông tin
export interface UpdateFacilityInfoInput {
    name?: string;
    tax_code?: string;
    email?: string;
    phone?: string;
    website?: string;
    headquarters_address?: string;
}

// Query filter cho danh sách cơ sở
export interface FacilityQuery {
    search?: string;
    status?: string;
    page: number;
    limit: number;
}

// Input tạo mới cơ sở y tế
export interface CreateFacilityInput {
    code: string;
    name: string;
    tax_code?: string;
    email?: string;
    phone?: string;
    website?: string;
    headquarters_address?: string;
}
