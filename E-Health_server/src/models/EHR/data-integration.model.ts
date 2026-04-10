// Nguồn dữ liệu
export interface DataSourceItem {
    source_id: string;
    source_name: string;
    source_type: string;
    protocol: string;
    endpoint_url: string | null;
    contact_info: string | null;
    description: string | null;
    is_active: boolean;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateDataSourceInput {
    source_name: string;
    source_type: string;
    protocol?: string;
    endpoint_url?: string;
    api_key_encrypted?: string;
    contact_info?: string;
    description?: string;
}

export interface UpdateDataSourceInput {
    source_name?: string;
    source_type?: string;
    protocol?: string;
    endpoint_url?: string;
    api_key_encrypted?: string;
    contact_info?: string;
    description?: string;
    is_active?: boolean;
}

// Hồ sơ bên ngoài
export interface ExternalRecordItem {
    external_health_records_id: string;
    patient_id: string;
    provider_name: string;
    integration_protocol: string | null;
    data_type: string | null;
    sync_status: string;
    source_id: string | null;
    source_name: string | null;
    synced_at: string;
    processed_at: string | null;
    created_by_name: string | null;
}

export interface ExternalRecordDetail extends ExternalRecordItem {
    raw_payload: Record<string, any>;
    processed_by_name: string | null;
    error_message: string | null;
}

export interface CreateExternalRecordInput {
    provider_name: string;
    integration_protocol?: string;
    data_type?: string;
    raw_payload: Record<string, any>;
    source_id?: string;
}

export interface UpdateSyncStatusInput {
    sync_status: string;
    error_message?: string;
}

// Device sync log
export interface DeviceSyncLogItem {
    sync_log_id: string;
    patient_id: string;
    source_id: string | null;
    device_name: string;
    device_type: string | null;
    sync_time: string;
    records_synced: number;
    status: string;
    error_message: string | null;
    synced_by_name: string | null;
}

export interface CreateDeviceSyncInput {
    source_id?: string;
    device_name: string;
    device_type?: string;
    records_synced?: number;
    status?: string;
    error_message?: string;
}

// Dashboard tổng hợp
export interface IntegrationSummary {
    total_sources: number;
    active_sources: number;
    total_external_records: number;
    records_pending: number;
    records_processed: number;
    records_failed: number;
    by_data_type: { data_type: string; count: number }[];
    by_source_type: { source_type: string; count: number }[];
    total_device_syncs: number;
    last_sync_at: string | null;
}

// Filters
export interface ExternalRecordFilters {
    data_type?: string;
    sync_status?: string;
    source_id?: string;
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}
