export interface UserImportRow {
    email: string;
    phone: string;
    full_name: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    roles?: string[];
    address?: string;
    identity_card_number?: string;
    password?: string;
}

export interface ImportError {
    row: number;
    email: string | null;
    phone: string | null;
    name: string | null;
    errors: string[];
}

export interface ImportValidationResult {
    total_rows: number;
    valid_count: number;
    invalid_count: number;
    valid_rows: UserImportRow[];
    errors: ImportError[];
}
