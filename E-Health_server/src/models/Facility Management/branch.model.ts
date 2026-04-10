export interface BranchInfo {
    branches_id: string;
    facility_id: string;
    code: string;
    name: string;
    address: string;
    phone: string | null;
    status: string;
    established_date: Date | null;
    facility_name?: string;
    deleted_at?: Date | null;
}

export interface BranchDropdown {
    branches_id: string;
    facility_id: string;
    code: string;
    name: string;
}

// Input tạo mới chi nhánh
export interface CreateBranchInput {
    facility_id: string;
    code: string;
    name: string;
    address: string;
    phone?: string;
    established_date?: string;
}

// Input cập nhật thông tin chi nhánh
export interface UpdateBranchInput {
    facility_id?: string;
    name?: string;
    address?: string;
    phone?: string;
    established_date?: string;
}

// Query filter cho danh sách chi nhánh
export interface BranchQuery {
    search?: string;
    facility_id?: string;
    status?: string;
    page: number;
    limit: number;
}
