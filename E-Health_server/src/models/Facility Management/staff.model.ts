export interface CreateStaffInput {
    email: string;
    phone_number?: string;
    password?: string;

    // Profile info
    full_name: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    identity_card_number?: string;
    address?: string;

    roles: string[];

    branch_id?: string;
    department_id?: string;
    role_title?: string;
}

export interface UpdateStaffInput {
    email?: string;
    phone_number?: string;
    full_name?: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    identity_card_number?: string;
    address?: string;

    /** Phân bổ cơ sở */
    branch_id?: string;
    department_id?: string;
    role_title?: string;
}

export interface UpdateDoctorInfoInput {
    specialty_id: string;
    title?: string;
    biography?: string;
    consultation_fee?: number;
}

export interface CreateLicenseInput {
    license_type: string;
    license_number: string;
    issue_date: string;
    expiry_date?: string;
    issued_by?: string;
    document_url?: string;
}

export interface UpdateLicenseInput {
    license_type?: string;
    license_number?: string;
    issue_date?: string;
    expiry_date?: string;
    issued_by?: string;
    document_url?: string;
}
