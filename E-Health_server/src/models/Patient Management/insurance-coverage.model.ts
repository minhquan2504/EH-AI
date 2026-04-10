/** Interface cho bảng insurance_coverages */
export interface InsuranceCoverage {
    insurance_coverages_id: string;
    coverage_name: string;
    provider_id: string;
    coverage_percent: number;
    description?: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;

    provider_name?: string;
    insurance_type?: string;
}

export interface CreateInsuranceCoverageInput {
    coverage_name: string;
    provider_id: string;
    coverage_percent: number;
    description?: string;
}

export interface UpdateInsuranceCoverageInput {
    coverage_name?: string;
    provider_id?: string;
    coverage_percent?: number;
    description?: string;
    is_active?: boolean;
}

export interface PaginatedInsuranceCoverages {
    data: InsuranceCoverage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
