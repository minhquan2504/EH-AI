import { VitalSignsRepository } from '../../repository/EHR/vital-signs.repository';
import {
    VitalSignRecord, VitalTrendPoint, AbnormalVitalItem, VitalsSummary,
    HealthMetricItem, VitalTimelineItem,
    VitalFilters, MetricFilters, CreateHealthMetricInput, ReferenceRange,
} from '../../models/EHR/vital-signs.model';
import { VS_ERRORS, VS_CONFIG, ABNORMAL_LEVEL, BMI_CLASSIFICATION } from '../../constants/vital-signs.constant';

export class VitalSignsService {

    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await VitalSignsRepository.patientExists(patientId);
        if (!exists) throw new Error(VS_ERRORS.PATIENT_NOT_FOUND);
    }

    /** API 1: Lịch sử sinh hiệu */
    static async getVitals(patientId: string, filters: VitalFilters): Promise<{ data: VitalSignRecord[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);
        const page = Math.max(filters.page || VS_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || VS_CONFIG.DEFAULT_LIMIT, 1), VS_CONFIG.MAX_LIMIT);
        const result = await VitalSignsRepository.getVitals(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 2: Sinh hiệu mới nhất */
    static async getLatestVitals(patientId: string): Promise<VitalSignRecord | null> {
        await this.validatePatient(patientId);
        return VitalSignsRepository.getLatestVitals(patientId);
    }

    /** API 3: Xu hướng — gom cả 2 nguồn */
    static async getTrends(patientId: string, metricType: string): Promise<{ metric_type: string; data_points: VitalTrendPoint[] }> {
        await this.validatePatient(patientId);
        if (!metricType?.trim()) throw new Error(VS_ERRORS.METRIC_TYPE_REQUIRED);

        const examTrends = await VitalSignsRepository.getVitalTrendsFromExams(patientId, metricType);
        const metricTrends = await VitalSignsRepository.getMetricTrends(patientId, metricType);

        /** Gộp và sort theo thời gian */
        const allPoints = [...examTrends, ...metricTrends].sort(
            (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
        );

        return { metric_type: metricType, data_points: allPoints.slice(0, VS_CONFIG.TREND_MAX_POINTS) };
    }

    /**
     * API 4: Chỉ số bất thường — so sánh vs reference ranges
     */
    static async getAbnormalVitals(patientId: string): Promise<AbnormalVitalItem[]> {
        await this.validatePatient(patientId);

        const [vitals, ranges] = await Promise.all([
            VitalSignsRepository.getAllVitalsForAbnormalCheck(patientId),
            VitalSignsRepository.getReferenceRanges(),
        ]);

        const rangeMap = new Map<string, ReferenceRange>();
        for (const r of ranges) {
            rangeMap.set(r.metric_code, r);
        }

        const vitalFields = [
            'pulse', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'temperature', 'respiratory_rate', 'spo2',
            'weight', 'height', 'bmi', 'blood_glucose',
        ];

        const abnormals: AbnormalVitalItem[] = [];

        for (const v of vitals) {
            for (const field of vitalFields) {
                const value = v[field];
                if (value == null) continue;

                const ref = rangeMap.get(field);
                if (!ref) continue;

                let level: string = ABNORMAL_LEVEL.NORMAL;
                if (value < ref.critical_min || value > ref.critical_max) {
                    level = ABNORMAL_LEVEL.CRITICAL;
                } else if (value < ref.warning_min || value > ref.warning_max) {
                    level = ABNORMAL_LEVEL.WARNING;
                } else if (value < ref.normal_min || value > ref.normal_max) {
                    level = ABNORMAL_LEVEL.WARNING;
                }

                if (level !== ABNORMAL_LEVEL.NORMAL) {
                    abnormals.push({
                        encounter_id: v.encounter_id,
                        encounter_start: v.encounter_start,
                        metric_code: field,
                        metric_name: ref.metric_name,
                        value: Number(value),
                        unit: ref.unit,
                        normal_min: Number(ref.normal_min),
                        normal_max: Number(ref.normal_max),
                        level,
                    });
                }
            }
        }

        return abnormals;
    }

    /**
     * API 5: Tổng hợp sinh hiệu
     */
    static async getSummary(patientId: string): Promise<VitalsSummary> {
        await this.validatePatient(patientId);

        const [recentVitals, totalMeasurements] = await Promise.all([
            VitalSignsRepository.getRecentVitals(patientId, VS_CONFIG.SUMMARY_LAST_N),
            VitalSignsRepository.getTotalMeasurements(patientId),
        ]);

        if (recentVitals.length === 0) {
            return {
                current_bmi: null, bmi_classification: null,
                avg_bp_systolic: null, avg_bp_diastolic: null, avg_pulse: null,
                weight_current: null, weight_previous: null, weight_trend: null,
                total_measurements: 0, latest_measurement_at: null,
            };
        }

        const latest = recentVitals[0];
        const bmi = latest.bmi ? Number(latest.bmi) : null;
        let bmiClass: string | null = null;
        if (bmi !== null) {
            if (bmi < BMI_CLASSIFICATION.UNDERWEIGHT.max) bmiClass = BMI_CLASSIFICATION.UNDERWEIGHT.label;
            else if (bmi <= BMI_CLASSIFICATION.NORMAL.max) bmiClass = BMI_CLASSIFICATION.NORMAL.label;
            else if (bmi <= BMI_CLASSIFICATION.OVERWEIGHT.max) bmiClass = BMI_CLASSIFICATION.OVERWEIGHT.label;
            else bmiClass = BMI_CLASSIFICATION.OBESE.label;
        }

        const bpSysVals = recentVitals.filter(v => v.blood_pressure_systolic != null).map(v => Number(v.blood_pressure_systolic));
        const bpDiaVals = recentVitals.filter(v => v.blood_pressure_diastolic != null).map(v => Number(v.blood_pressure_diastolic));
        const pulseVals = recentVitals.filter(v => v.pulse != null).map(v => Number(v.pulse));

        const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

        const weightCurrent = latest.weight ? Number(latest.weight) : null;
        const weightPrevious = recentVitals.length > 1 && recentVitals[1].weight ? Number(recentVitals[1].weight) : null;
        let weightTrend: string | null = null;
        if (weightCurrent !== null && weightPrevious !== null) {
            if (weightCurrent > weightPrevious) weightTrend = 'INCREASING';
            else if (weightCurrent < weightPrevious) weightTrend = 'DECREASING';
            else weightTrend = 'STABLE';
        }

        return {
            current_bmi: bmi,
            bmi_classification: bmiClass,
            avg_bp_systolic: avg(bpSysVals),
            avg_bp_diastolic: avg(bpDiaVals),
            avg_pulse: avg(pulseVals),
            weight_current: weightCurrent,
            weight_previous: weightPrevious,
            weight_trend: weightTrend,
            total_measurements: totalMeasurements,
            latest_measurement_at: latest.created_at,
        };
    }

    /** API 6: DS health metrics */
    static async getHealthMetrics(patientId: string, filters: MetricFilters): Promise<{ data: HealthMetricItem[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);
        const page = Math.max(filters.page || VS_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || VS_CONFIG.DEFAULT_LIMIT, 1), VS_CONFIG.MAX_LIMIT);
        const result = await VitalSignsRepository.getHealthMetrics(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 7: Thêm chỉ số */
    static async createHealthMetric(patientId: string, data: CreateHealthMetricInput): Promise<HealthMetricItem> {
        await this.validatePatient(patientId);
        if (!data.metric_code?.trim()) throw new Error(VS_ERRORS.METRIC_CODE_REQUIRED);
        if (!data.metric_value) throw new Error(VS_ERRORS.METRIC_VALUE_REQUIRED);
        if (!data.unit?.trim()) throw new Error(VS_ERRORS.UNIT_REQUIRED);
        if (!data.measured_at) throw new Error(VS_ERRORS.MEASURED_AT_REQUIRED);
        return VitalSignsRepository.createHealthMetric(patientId, data);
    }

    /** API 8: Timeline hợp nhất */
    static async getTimeline(patientId: string): Promise<VitalTimelineItem[]> {
        await this.validatePatient(patientId);
        return VitalSignsRepository.getTimeline(patientId);
    }
}
