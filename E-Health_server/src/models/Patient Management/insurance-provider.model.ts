export interface InsuranceProvider {
    insurance_providers_id: string;
    provider_code: string;
    provider_name: string;
    insurance_type: string;
    contact_phone?: string | null;
    contact_email?: string | null;
    address?: string | null;
    support_notes?: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateInsuranceProviderInput {
    provider_code: string;
    provider_name: string;
    insurance_type: string;
    contact_phone?: string;
    contact_email?: string;
    address?: string;
    support_notes?: string;
}

export interface UpdateInsuranceProviderInput {
    provider_code?: string;
    provider_name?: string;
    insurance_type?: string;
    contact_phone?: string;
    contact_email?: string;
    address?: string;
    support_notes?: string;
    is_active?: boolean;
}

export interface PaginatedInsuranceProviders {
    data: InsuranceProvider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
