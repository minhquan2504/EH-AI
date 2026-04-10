// Sinh hiệu từ clinical_examinations

export interface VitalSignRecord {
    clinical_examinations_id: string;
    encounter_id: string;
    encounter_start: string | null;
    doctor_name: string | null;
    recorder_name: string | null;
    pulse: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    temperature: number | null;
    respiratory_rate: number | null;
    spo2: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    blood_glucose: number | null;
    created_at: string;
}

// Điểm dữ liệu xu hướng
export interface VitalTrendPoint {
    measured_at: string;
    value: number | null;
    source: string;
    encounter_id: string | null;
}

// Chỉ số bất thường
export interface AbnormalVitalItem {
    encounter_id: string;
    encounter_start: string | null;
    metric_code: string;
    metric_name: string;
    value: number;
    unit: string;
    normal_min: number;
    normal_max: number;
    level: string;
}

// Tổng hợp
export interface VitalsSummary {
    current_bmi: number | null;
    bmi_classification: string | null;
    avg_bp_systolic: number | null;
    avg_bp_diastolic: number | null;
    avg_pulse: number | null;
    weight_current: number | null;
    weight_previous: number | null;
    weight_trend: string | null;
    total_measurements: number;
    latest_measurement_at: string | null;
}

// Health metric (patient_health_metrics)
export interface HealthMetricItem {
    patient_health_metrics_id: string;
    metric_code: string;
    metric_name: string;
    metric_value: Record<string, any>;
    unit: string;
    measured_at: string;
    source_type: string;
    device_info: string | null;
    created_at: string;
}

export interface CreateHealthMetricInput {
    metric_code: string;
    metric_name: string;
    metric_value: Record<string, any>;
    unit: string;
    measured_at: string;
    source_type?: string;
    device_info?: string;
}

// Timeline hợp nhất
export interface VitalTimelineItem {
    event_id: string;
    event_type: string;
    event_date: string;
    metric_code: string;
    metric_name: string;
    value: string;
    unit: string;
    source: string;
}

// Reference range
export interface ReferenceRange {
    range_id: string;
    metric_code: string;
    metric_name: string;
    unit: string;
    normal_min: number;
    normal_max: number;
    warning_min: number;
    warning_max: number;
    critical_min: number;
    critical_max: number;
}

// Filters
export interface VitalFilters {
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}

export interface MetricFilters {
    metric_code?: string;
    source_type?: string;
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}
