import { HealthProfileRepository } from '../../repository/EHR/health-profile.repository';
import {
    PatientHealthProfile,
    HealthSummary,
    LatestVitals,
    ActiveCondition,
    AllergyItem,
    CurrentMedication,
    DiagnosisHistoryItem,
    InsuranceStatusItem,
    PatientTagItem,
    HealthAlert,
    EhrProfileMeta,
    CreateAlertInput,
    UpdateAlertInput,
    UpdateEhrNotesInput,
} from '../../models/EHR/health-profile.model';
import {
    HEALTH_PROFILE_ERRORS,
    HEALTH_PROFILE_CONFIG,
    ALERT_THRESHOLDS,
    AUTO_ALERT_TYPE,
    MANUAL_ALERT_TYPE,
    ALERT_SEVERITY,
    RISK_LEVEL,
} from '../../constants/health-profile.constant';


export class HealthProfileService {

    //  HỒ SƠ SỨC KHỎE TỔNG HỢP 

    /**
     * Tổng hợp toàn bộ dữ liệu sức khỏe bệnh nhân thành một hồ sơ EHR duy nhất.
     * Song song hóa tất cả query để tối ưu hiệu năng.
     */
    static async getFullProfile(patientId: string): Promise<PatientHealthProfile> {
        const patientInfo = await HealthProfileRepository.getPatientInfo(patientId);
        if (!patientInfo) {
            throw new Error(HEALTH_PROFILE_ERRORS.PATIENT_NOT_FOUND);
        }

        /** Song song hóa tất cả các query tổng hợp */
        const [
            healthSummary,
            latestVitals,
            activeConditions,
            allergies,
            currentMedications,
            recentDiagnoses,
            insuranceInfo,
            tags,
            alerts,
            ehrProfile,
        ] = await Promise.all([
            this.buildHealthSummary(patientId),
            HealthProfileRepository.getLatestVitals(patientId),
            HealthProfileRepository.getActiveConditions(patientId),
            HealthProfileRepository.getAllergies(patientId),
            HealthProfileRepository.getCurrentMedications(patientId),
            this.getRecentDiagnoses(patientId),
            HealthProfileRepository.getInsuranceStatus(patientId),
            HealthProfileRepository.getPatientTags(patientId),
            this.generateAllAlerts(patientId),
            HealthProfileRepository.getEhrProfile(patientId),
        ]);

        return {
            patient_info: patientInfo,
            health_summary: healthSummary,
            latest_vitals: latestVitals,
            active_conditions: activeConditions,
            allergies,
            current_medications: currentMedications,
            recent_diagnoses: recentDiagnoses,
            insurance_info: insuranceInfo,
            tags,
            alerts,
            ehr_notes: ehrProfile?.ehr_notes || null,
        };
    }

    // TÓM TẮT SỨC KHỎE NHANH 

    /**
     * Phiên bản rút gọn: chỉ health_summary + latest_vitals + alerts.
     * Dùng cho dashboard, popup tra cứu nhanh.
     */
    static async getHealthSummary(patientId: string): Promise<{
        health_summary: HealthSummary;
        latest_vitals: LatestVitals | null;
        alerts: HealthAlert[];
    }> {
        await this.validatePatient(patientId);

        const [healthSummary, latestVitals, alerts] = await Promise.all([
            this.buildHealthSummary(patientId),
            HealthProfileRepository.getLatestVitals(patientId),
            this.generateAllAlerts(patientId),
        ]);

        return { health_summary: healthSummary, latest_vitals: latestVitals, alerts };
    }

    // SINH HIỆU GẦN NHẤT 

    static async getLatestVitals(patientId: string): Promise<LatestVitals | null> {
        await this.validatePatient(patientId);
        return HealthProfileRepository.getLatestVitals(patientId);
    }

    // BỆNH LÝ ĐANG ACTIVE 

    static async getActiveConditions(patientId: string): Promise<ActiveCondition[]> {
        await this.validatePatient(patientId);
        return HealthProfileRepository.getActiveConditions(patientId);
    }

    // DANH SÁCH DỊ ỨNG 

    /**
     * Lấy toàn bộ dị ứng, nhóm theo allergen_type (DRUG, FOOD, ENVIRONMENT)
     */
    static async getAllergies(patientId: string): Promise<{
        total: number;
        by_type: Record<string, AllergyItem[]>;
        items: AllergyItem[];
    }> {
        await this.validatePatient(patientId);
        const items = await HealthProfileRepository.getAllergies(patientId);

        const byType: Record<string, AllergyItem[]> = {};
        for (const item of items) {
            const type = item.allergen_type || 'OTHER';
            if (!byType[type]) byType[type] = [];
            byType[type].push(item);
        }

        return { total: items.length, by_type: byType, items };
    }

    // THUỐC ĐANG DÙNG 

    static async getCurrentMedications(patientId: string): Promise<CurrentMedication[]> {
        await this.validatePatient(patientId);
        return HealthProfileRepository.getCurrentMedications(patientId);
    }

    // LỊCH SỬ CHẨN ĐOÁN 

    static async getDiagnosisHistory(
        patientId: string,
        page: number = HEALTH_PROFILE_CONFIG.DEFAULT_PAGE,
        limit: number = HEALTH_PROFILE_CONFIG.DEFAULT_LIMIT,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DiagnosisHistoryItem[]; total: number; page: number; limit: number; totalPages: number }> {
        await this.validatePatient(patientId);

        const clampedLimit = Math.min(limit, HEALTH_PROFILE_CONFIG.MAX_LIMIT);
        const result = await HealthProfileRepository.getDiagnosisHistory(
            patientId, page, clampedLimit, fromDate, toDate
        );

        return {
            ...result,
            page,
            limit: clampedLimit,
            totalPages: Math.ceil(result.total / clampedLimit),
        };
    }

    // TÌNH TRẠNG BẢO HIỂM 

    static async getInsuranceStatus(patientId: string): Promise<InsuranceStatusItem[]> {
        await this.validatePatient(patientId);
        return HealthProfileRepository.getInsuranceStatus(patientId);
    }

    // CẢNH BÁO Y TẾ (GET) 

    /**
     * Lấy tất cả cảnh báo: tự động (runtime) + thủ công (DB).
     */
    static async getAlerts(patientId: string): Promise<HealthAlert[]> {
        await this.validatePatient(patientId);
        return this.generateAllAlerts(patientId);
    }

    // TẠO CẢNH BÁO THỦ CÔNG 

    static async createManualAlert(
        patientId: string,
        userId: string,
        data: CreateAlertInput
    ): Promise<HealthAlert> {
        await this.validatePatient(patientId);

        if (!data.title) {
            throw new Error(HEALTH_PROFILE_ERRORS.MISSING_ALERT_TITLE);
        }
        if (!data.alert_type) {
            throw new Error(HEALTH_PROFILE_ERRORS.MISSING_ALERT_TYPE);
        }

        const validTypes = Object.values(MANUAL_ALERT_TYPE);
        if (!validTypes.includes(data.alert_type as any)) {
            throw new Error(HEALTH_PROFILE_ERRORS.INVALID_ALERT_TYPE);
        }

        if (data.severity) {
            const validSeverities = Object.values(ALERT_SEVERITY);
            if (!validSeverities.includes(data.severity as any)) {
                throw new Error(HEALTH_PROFILE_ERRORS.INVALID_SEVERITY);
            }
        }

        return HealthProfileRepository.createAlert(patientId, userId, data);
    }

    // CẬP NHẬT CẢNH BÁO 

    static async updateManualAlert(
        patientId: string,
        alertId: string,
        data: UpdateAlertInput
    ): Promise<HealthAlert> {
        await this.validatePatient(patientId);

        const alert = await HealthProfileRepository.findAlertById(alertId);
        if (!alert) {
            throw new Error(HEALTH_PROFILE_ERRORS.ALERT_NOT_FOUND);
        }
        if (alert.patient_id !== patientId) {
            throw new Error(HEALTH_PROFILE_ERRORS.ALERT_NOT_BELONG);
        }

        if (data.severity) {
            const validSeverities = Object.values(ALERT_SEVERITY);
            if (!validSeverities.includes(data.severity as any)) {
                throw new Error(HEALTH_PROFILE_ERRORS.INVALID_SEVERITY);
            }
        }

        return HealthProfileRepository.updateAlert(alertId, data);
    }

    // XÓA CẢNH BÁO 

    static async deleteManualAlert(patientId: string, alertId: string): Promise<void> {
        await this.validatePatient(patientId);

        const alert = await HealthProfileRepository.findAlertById(alertId);
        if (!alert) {
            throw new Error(HEALTH_PROFILE_ERRORS.ALERT_NOT_FOUND);
        }
        if (alert.patient_id !== patientId) {
            throw new Error(HEALTH_PROFILE_ERRORS.ALERT_NOT_BELONG);
        }

        await HealthProfileRepository.deleteAlert(alertId);
    }

    // CẬP NHẬT GHI CHÚ EHR 

    static async updateEhrNotes(
        patientId: string,
        userId: string,
        data: UpdateEhrNotesInput
    ): Promise<EhrProfileMeta> {
        await this.validatePatient(patientId);

        if (data.risk_level) {
            const validRiskLevels = Object.values(RISK_LEVEL);
            if (!validRiskLevels.includes(data.risk_level as any)) {
                throw new Error(HEALTH_PROFILE_ERRORS.INVALID_RISK_LEVEL);
            }
        }

        return HealthProfileRepository.upsertEhrProfile(patientId, userId, data);
    }

    //  PRIVATE HELPERS 

    /** Validate bệnh nhân tồn tại */
    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await HealthProfileRepository.patientExists(patientId);
        if (!exists) {
            throw new Error(HEALTH_PROFILE_ERRORS.PATIENT_NOT_FOUND);
        }
    }

    /** Lấy chẩn đoán gần nhất (dùng trong profile) */
    private static async getRecentDiagnoses(patientId: string): Promise<DiagnosisHistoryItem[]> {
        const result = await HealthProfileRepository.getDiagnosisHistory(
            patientId, 1, HEALTH_PROFILE_CONFIG.RECENT_DIAGNOSES_LIMIT
        );
        return result.data;
    }

    /**
     * Tổng hợp health summary từ nhiều nguồn (song song)
     */
    private static async buildHealthSummary(patientId: string): Promise<HealthSummary> {
        const [
            totalEncounters,
            lastEncounter,
            activeConditionsCount,
            allergyCount,
            activeMedicationsCount,
            hasActiveInsurance,
            activeTreatmentPlansCount,
            ehrProfile,
        ] = await Promise.all([
            HealthProfileRepository.getTotalEncounters(patientId),
            HealthProfileRepository.getLastEncounter(patientId),
            HealthProfileRepository.countActiveConditions(patientId),
            HealthProfileRepository.countAllergies(patientId),
            HealthProfileRepository.countActiveMedications(patientId),
            HealthProfileRepository.hasActiveInsurance(patientId),
            HealthProfileRepository.countActiveTreatmentPlans(patientId),
            HealthProfileRepository.getEhrProfile(patientId),
        ]);

        return {
            total_encounters: totalEncounters,
            last_encounter_date: lastEncounter.date,
            last_encounter_doctor: lastEncounter.doctor_name,
            last_primary_diagnosis: lastEncounter.diagnosis_name,
            last_primary_icd10: lastEncounter.icd10_code,
            active_conditions_count: activeConditionsCount,
            allergy_count: allergyCount,
            active_medications_count: activeMedicationsCount,
            has_active_insurance: hasActiveInsurance,
            active_treatment_plans_count: activeTreatmentPlansCount,
            risk_level: ehrProfile?.risk_level || RISK_LEVEL.LOW,
        };
    }

    /**
     * Sinh cảnh báo tự động từ dữ liệu hiện có + merge cảnh báo thủ công.
     * Cảnh báo tự động KHÔNG lưu DB, tính runtime mỗi lần gọi.
     */
    private static async generateAllAlerts(patientId: string): Promise<HealthAlert[]> {
        const [
            severeAllergies,
            chronicConditions,
            expiringInsurances,
            expiredInsurances,
            lastEncounterDate,
            activeTreatmentPlans,
            manualAlerts,
        ] = await Promise.all([
            HealthProfileRepository.getSevereAllergies(patientId),
            HealthProfileRepository.getChronicConditions(patientId, ALERT_THRESHOLDS.CHRONIC_CONDITION_MONTHS),
            HealthProfileRepository.getExpiringInsurances(patientId, ALERT_THRESHOLDS.INSURANCE_EXPIRY_WARNING_DAYS),
            HealthProfileRepository.getExpiredInsurances(patientId),
            HealthProfileRepository.getLastEncounterDate(patientId),
            HealthProfileRepository.getActiveTreatmentPlans(patientId),
            HealthProfileRepository.getManualAlerts(patientId),
        ]);

        const autoAlerts: HealthAlert[] = [];
        const now = new Date().toISOString();

        /** Dị ứng nghiêm trọng */
        for (const allergy of severeAllergies) {
            autoAlerts.push({
                alert_id: `AUTO_ALLERGY_${allergy.patient_allergies_id}`,
                alert_type: AUTO_ALERT_TYPE.CRITICAL_ALLERGY,
                severity: ALERT_SEVERITY.CRITICAL,
                title: `Dị ứng nghiêm trọng: ${allergy.allergen_name}`,
                description: allergy.reaction || null,
                source: 'AUTO',
                created_by_name: null,
                is_active: true,
                created_at: now,
            });
        }

        /** Bệnh mãn tính */
        for (const condition of chronicConditions) {
            autoAlerts.push({
                alert_id: `AUTO_CHRONIC_${condition.patient_medical_histories_id}`,
                alert_type: AUTO_ALERT_TYPE.CHRONIC_CONDITION,
                severity: ALERT_SEVERITY.WARNING,
                title: `Bệnh mãn tính: ${condition.condition_name}`,
                description: condition.condition_code ? `Mã ICD-10: ${condition.condition_code}` : null,
                source: 'AUTO',
                created_by_name: null,
                is_active: true,
                created_at: now,
            });
        }

        /** BH sắp hết hạn */
        for (const ins of expiringInsurances) {
            autoAlerts.push({
                alert_id: `AUTO_INS_EXP_${ins.patient_insurances_id}`,
                alert_type: AUTO_ALERT_TYPE.INSURANCE_EXPIRING,
                severity: ALERT_SEVERITY.WARNING,
                title: `Bảo hiểm sắp hết hạn: ${ins.insurance_number}`,
                description: `Còn ${ins.days_until_expiry} ngày (${ins.end_date})`,
                source: 'AUTO',
                created_by_name: null,
                is_active: true,
                created_at: now,
            });
        }

        /** BH đã hết hạn */
        for (const ins of expiredInsurances) {
            autoAlerts.push({
                alert_id: `AUTO_INS_EXP_${ins.patient_insurances_id}`,
                alert_type: AUTO_ALERT_TYPE.INSURANCE_EXPIRED,
                severity: ALERT_SEVERITY.CRITICAL,
                title: `Bảo hiểm đã hết hạn: ${ins.insurance_number}`,
                description: `Hết hạn từ ${ins.end_date}`,
                source: 'AUTO',
                created_by_name: null,
                is_active: true,
                created_at: now,
            });
        }

        /** Chưa khám > 6 tháng (chỉ cảnh báo nếu có bệnh mãn tính) */
        if (chronicConditions.length > 0 && lastEncounterDate) {
            const lastDate = new Date(lastEncounterDate);
            const monthsAgo = new Date();
            monthsAgo.setMonth(monthsAgo.getMonth() - ALERT_THRESHOLDS.NO_VISIT_WARNING_MONTHS);

            if (lastDate < monthsAgo) {
                autoAlerts.push({
                    alert_id: `AUTO_NO_VISIT_${patientId}`,
                    alert_type: AUTO_ALERT_TYPE.NO_RECENT_VISIT,
                    severity: ALERT_SEVERITY.WARNING,
                    title: `Chưa tái khám quá ${ALERT_THRESHOLDS.NO_VISIT_WARNING_MONTHS} tháng`,
                    description: `Lần khám cuối: ${lastDate.toISOString().substring(0, 10)}. Bệnh nhân có bệnh mãn tính cần theo dõi.`,
                    source: 'AUTO',
                    created_by_name: null,
                    is_active: true,
                    created_at: now,
                });
            }
        }

        /** Kế hoạch điều trị đang ACTIVE */
        for (const plan of activeTreatmentPlans) {
            autoAlerts.push({
                alert_id: `AUTO_TREAT_${plan.plan_code}`,
                alert_type: AUTO_ALERT_TYPE.ACTIVE_TREATMENT,
                severity: ALERT_SEVERITY.INFO,
                title: `Đang điều trị: ${plan.title}`,
                description: `Mã KH: ${plan.plan_code}`,
                source: 'AUTO',
                created_by_name: null,
                is_active: true,
                created_at: now,
            });
        }

        /** Merge: auto trước (sorted by severity), manual sau */
        const sortedAutoAlerts = autoAlerts.sort((a, b) => {
            const severityOrder: Record<string, number> = { CRITICAL: 1, WARNING: 2, INFO: 3 };
            return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
        });

        return [...sortedAutoAlerts, ...manualAlerts];
    }
}
