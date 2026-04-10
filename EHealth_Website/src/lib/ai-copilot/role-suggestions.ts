import { aiService } from '@/services/aiService';
import type { PageContext } from '@/contexts/AICopilotContext';

// ============================================
// Types
// ============================================

export interface Suggestion {
    id: string;
    title: string;
    description: string;
    icon: string;
    applyable: boolean;
    applyPayload?: Record<string, unknown>;
    confidence?: number;
}

interface SuggestionSpec {
    title: string;
    icon: string;
    fetchFn: (ctx: PageContext | null) => Promise<Suggestion[]>;
}

// ============================================
// Fetch functions
// ============================================

async function fetchDoctorBriefing(ctx: PageContext | null): Promise<Suggestion[]> {
    try {
        const res = await aiService.getDailyBriefing(ctx?.extra?.doctorId as string || 'current');
        const items = (res?.data as any)?.items || [];
        return items.slice(0, 3).map((item: any, i: number) => ({
            id: `briefing-${i}`,
            title: item.title || 'Thông báo',
            description: item.content || '',
            icon: item.type === 'allergy_warning' ? 'warning' : item.type === 'follow_up_alert' ? 'event_repeat' : 'info',
            applyable: false,
        }));
    } catch {
        return [{ id: 'briefing-fallback', title: 'AI Briefing', description: 'Không thể tải briefing. Thử lại sau.', icon: 'info', applyable: false }];
    }
}

async function fetchExamSuggestions(ctx: PageContext | null): Promise<Suggestion[]> {
    const step = ctx?.currentStep;
    const formData = ctx?.formData as any;

    if (step === 'symptoms' && formData?.symptoms) {
        try {
            const res = await aiService.getDiagnosis({ symptoms: formData.symptoms, vitals: formData.vitals });
            const diagnoses = (res?.data as any)?.diagnoses || [];
            return diagnoses.slice(0, 3).map((d: any, i: number) => ({
                id: `diag-${i}`,
                title: `${d.icdCode || ''} — ${d.icdDescription || d.description || ''}`,
                description: `Confidence: ${d.confidence || 0}%`,
                icon: 'diagnosis',
                applyable: true,
                applyPayload: { diagnosis: d.icdDescription || d.description, icdCode: d.icdCode },
                confidence: d.confidence,
            }));
        } catch { /* fall through */ }
    }

    if (step === 'prescription' && formData?.diagnosis) {
        try {
            const res = await aiService.suggestDrug({ diagnosis: formData.diagnosis });
            const suggestions = (res?.data as any)?.suggestions || [];
            return suggestions.slice(0, 3).map((s: any, i: number) => ({
                id: `drug-${i}`,
                title: s.drugName || s.content || '',
                description: s.standardDosage || '',
                icon: 'medication',
                applyable: true,
                applyPayload: { newDrug: { name: s.drugName, dosage: s.standardDosage } },
            }));
        } catch { /* fall through */ }
    }

    // Default for examination
    return [
        { id: 'exam-hint', title: 'Nhập dữ liệu để AI phân tích', description: 'AI sẽ gợi ý khi có đủ thông tin triệu chứng/sinh hiệu', icon: 'smart_toy', applyable: false },
    ];
}

async function fetchTriageSuggestions(ctx: PageContext | null): Promise<Suggestion[]> {
    return [
        { id: 'triage-hint', title: 'AI Priority Mode đang bật', description: 'Hàng đợi được sắp xếp theo mức độ khẩn cấp AI', icon: 'sort', applyable: false },
    ];
}

async function fetchDrugSuggestions(ctx: PageContext | null): Promise<Suggestion[]> {
    const diagnosis = (ctx?.formData as any)?.diagnosis;
    if (!diagnosis) {
        return [{ id: 'drug-hint', title: 'Nhập chẩn đoán', description: 'AI sẽ gợi ý thuốc khi có chẩn đoán', icon: 'medication', applyable: false }];
    }
    try {
        const res = await aiService.suggestDrug({ diagnosis });
        const suggestions = (res?.data as any)?.suggestions || [];
        return suggestions.slice(0, 3).map((s: any, i: number) => ({
            id: `rx-${i}`,
            title: s.drugName || '',
            description: s.standardDosage || '',
            icon: 'medication',
            applyable: true,
            applyPayload: { newDrug: { name: s.drugName, dosage: s.standardDosage } },
        }));
    } catch {
        return [];
    }
}

async function fetchRecordSummary(ctx: PageContext | null): Promise<Suggestion[]> {
    if (!ctx?.patientId) return [];
    try {
        const res = await aiService.summarizePatient(ctx.patientId);
        const summary = (res?.data as any)?.summary;
        if (!summary) return [];
        return [{
            id: 'record-summary',
            title: 'Tóm tắt hồ sơ',
            description: [
                summary.chronicConditions?.join(', '),
                summary.allergies?.length ? `Dị ứng: ${summary.allergies.join(', ')}` : null,
            ].filter(Boolean).join(' | '),
            icon: 'folder_shared',
            applyable: false,
        }];
    } catch {
        return [];
    }
}

async function fetchInventoryAlerts(): Promise<Suggestion[]> {
    return [
        { id: 'inv-1', title: 'Kiểm tra tồn kho', description: 'AI giám sát thuốc sắp hết hạn và thiếu tồn', icon: 'inventory_2', applyable: false },
    ];
}

async function fetchInteractionCheck(ctx: PageContext | null): Promise<Suggestion[]> {
    return [
        { id: 'interact-hint', title: 'Kiểm tra tương tác', description: 'Gõ /interaction [thuốc1] [thuốc2] để kiểm tra', icon: 'compare_arrows', applyable: false },
    ];
}

async function fetchDispensingGuide(): Promise<Suggestion[]> {
    return [
        { id: 'disp-hint', title: 'Hướng dẫn cấp phát', description: 'AI kiểm tra liều lượng và hướng dẫn sử dụng', icon: 'local_pharmacy', applyable: false },
    ];
}

async function fetchSchedulingSuggestions(): Promise<Suggestion[]> {
    return [
        { id: 'sched-hint', title: 'Gợi ý điều phối', description: 'AI phân tích lịch hẹn và gợi ý sắp xếp tối ưu', icon: 'event_available', applyable: false },
    ];
}

async function fetchQuickTriage(): Promise<Suggestion[]> {
    return [
        { id: 'qtriage', title: 'Triage nhanh', description: 'Mô tả triệu chứng để AI đánh giá mức độ khẩn cấp', icon: 'emergency', applyable: false },
    ];
}

async function fetchAppointmentSuggestions(): Promise<Suggestion[]> {
    return [
        { id: 'appt-hint', title: 'Tìm lịch phù hợp', description: 'AI gợi ý khung giờ tốt nhất cho bệnh nhân', icon: 'calendar_month', applyable: false },
    ];
}

async function fetchMedicationReminders(): Promise<Suggestion[]> {
    return [
        { id: 'med-remind', title: 'Nhắc lịch uống thuốc', description: 'AI theo dõi và nhắc nhở lịch dùng thuốc của bạn', icon: 'alarm', applyable: false },
    ];
}

async function fetchFollowUpSuggestions(): Promise<Suggestion[]> {
    return [
        { id: 'followup', title: 'Gợi ý tái khám', description: 'AI nhắc lịch tái khám dựa trên đơn thuốc', icon: 'event_repeat', applyable: false },
    ];
}

async function fetchHealthTrends(): Promise<Suggestion[]> {
    return [
        { id: 'trends', title: 'Xu hướng sức khỏe', description: 'AI phân tích xu hướng từ dữ liệu sức khỏe', icon: 'trending_up', applyable: false },
    ];
}

async function fetchSystemAnomalies(): Promise<Suggestion[]> {
    return [
        { id: 'anomaly', title: 'Giám sát hệ thống', description: 'AI phát hiện bất thường trong hoạt động', icon: 'monitoring', applyable: false },
    ];
}

async function fetchRevenueInsights(): Promise<Suggestion[]> {
    return [
        { id: 'revenue', title: 'Phân tích doanh thu', description: 'AI phân tích xu hướng doanh thu và gợi ý', icon: 'analytics', applyable: false },
    ];
}

// ============================================
// Role-Page Suggestion Map
// ============================================

export const ROLE_PAGE_SUGGESTIONS: Record<string, Record<string, SuggestionSpec>> = {
    doctor: {
        dashboard: { title: 'Briefing hôm nay', icon: 'today', fetchFn: fetchDoctorBriefing },
        queue: { title: 'Phân loại ưu tiên', icon: 'sort', fetchFn: fetchTriageSuggestions },
        examination: { title: 'Gợi ý lâm sàng', icon: 'clinical_notes', fetchFn: fetchExamSuggestions },
        'prescriptions.new': { title: 'Gợi ý thuốc', icon: 'medication', fetchFn: fetchDrugSuggestions },
        prescriptions: { title: 'Gợi ý thuốc', icon: 'medication', fetchFn: fetchDrugSuggestions },
        'medical-records': { title: 'Tóm tắt hồ sơ', icon: 'folder_shared', fetchFn: fetchRecordSummary },
    },
    pharmacist: {
        dashboard: { title: 'Cảnh báo tồn kho', icon: 'inventory_2', fetchFn: fetchInventoryAlerts },
        prescriptions: { title: 'Kiểm tra tương tác', icon: 'compare_arrows', fetchFn: fetchInteractionCheck },
        dispensing: { title: 'Hướng dẫn cấp phát', icon: 'local_pharmacy', fetchFn: fetchDispensingGuide },
    },
    receptionist: {
        dashboard: { title: 'Gợi ý điều phối', icon: 'event_available', fetchFn: fetchSchedulingSuggestions },
        queue: { title: 'Triage nhanh', icon: 'emergency', fetchFn: fetchQuickTriage },
        appointments: { title: 'Tìm lịch phù hợp', icon: 'calendar_month', fetchFn: fetchAppointmentSuggestions },
    },
    patient: {
        dashboard: { title: 'Nhắc thuốc', icon: 'alarm', fetchFn: fetchMedicationReminders },
        appointments: { title: 'Gợi ý tái khám', icon: 'event_repeat', fetchFn: fetchFollowUpSuggestions },
        'health-records': { title: 'Xu hướng sức khỏe', icon: 'trending_up', fetchFn: fetchHealthTrends },
    },
    admin: {
        dashboard: { title: 'Giám sát hệ thống', icon: 'monitoring', fetchFn: fetchSystemAnomalies },
        statistics: { title: 'Phân tích doanh thu', icon: 'analytics', fetchFn: fetchRevenueInsights },
    },
};

/** Get suggestion spec for a given role and page */
export function getSuggestionSpec(role: string, pageKey: string): SuggestionSpec | null {
    return ROLE_PAGE_SUGGESTIONS[role]?.[pageKey] || null;
}
