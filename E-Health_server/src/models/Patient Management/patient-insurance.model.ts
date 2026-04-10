export interface PatientInsurance {
    patient_insurances_id: string;
    patient_id: string;
    provider_id: string;
    insurance_number: string;
    start_date: string | Date;
    end_date: string | Date;
    coverage_percent?: number | null;
    is_primary: boolean;
    document_url?: string | null;
    created_at: Date;

    /** Trường JOIN từ bảng insurance_providers */
    provider_name?: string;
    insurance_type?: string;
}

export interface CreatePatientInsuranceInput {
    patient_id: string;
    provider_id: string;
    insurance_number: string;
    start_date: string;
    end_date: string;
    coverage_percent?: number;
    is_primary?: boolean;
    document_url?: string;
}

export interface UpdatePatientInsuranceInput {
    provider_id?: string;
    insurance_number?: string;
    start_date?: string;
    end_date?: string;
    coverage_percent?: number;
    is_primary?: boolean;
    document_url?: string;
}

export interface PaginatedPatientInsurances {
    data: PatientInsurance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
