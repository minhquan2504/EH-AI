/**
 * AI Constants — Cấu hình cho hệ thống AI Evidence-based
 */

// Ngưỡng confidence
export const AI_CONFIDENCE = {
    HIGH: 85, // Khớp mạnh với nhiều guidelines
    MEDIUM: 65, // Khớp một phần, cần đánh giá lâm sàng
    LOW: 40, // Khớp yếu, sử dụng thận trọng
} as const;

// Thời gian debounce cho auto-analysis (ms)
export const AI_DEBOUNCE_MS = 1500;

// Thời gian polling cho queue anomaly detection (ms)
export const AI_QUEUE_POLL_INTERVAL = 5 * 60 * 1000; // 5 phút

// Ngưỡng thời gian chờ cảnh báo (phút)
export const AI_WAIT_TIME_THRESHOLD = 45;

// Màu theo confidence tier
export const AI_CONFIDENCE_COLORS = {
    high: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", badge: "bg-red-600" },
    medium: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-500" },
    low: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", badge: "bg-blue-500" },
} as const;

// Màu theo evidence level
export const AI_EVIDENCE_LEVEL_COLORS = {
    A: { bg: "bg-emerald-600", text: "text-white", label: "Level A" },
    B: { bg: "bg-blue-600", text: "text-white", label: "Level B" },
    C: { bg: "bg-amber-500", text: "text-white", label: "Level C" },
    BYT_VN: { bg: "bg-blue-600", text: "text-white", label: "BYT VN" },
    Expert: { bg: "bg-gray-500", text: "text-white", label: "Expert" },
} as const;

// Màu theo drug interaction severity
export const AI_DRUG_SEVERITY_COLORS = {
    safe: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-800", label: "An toàn" },
    caution: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", label: "Thận trọng" },
    serious: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-800", label: "Nghiêm trọng" },
    contraindicated: { bg: "bg-red-100", text: "text-red-900", badge: "bg-red-600 text-white", label: "Chống chỉ định" },
} as const;

// Màu theo lab priority
export const AI_LAB_PRIORITY_COLORS = {
    urgent: { bg: "bg-red-50", border: "border-red-300", icon: "🔴", label: "Khẩn cấp" },
    necessary: { bg: "bg-amber-50", border: "border-amber-300", icon: "🟡", label: "Cần thiết" },
    supplementary: { bg: "bg-green-50", border: "border-green-300", icon: "🟢", label: "Bổ sung" },
} as const;

// Màu theo triage urgency
export const AI_TRIAGE_COLORS = {
    urgent: { bg: "bg-red-600", text: "text-white", label: "Khẩn cấp" },
    routine: { bg: "bg-amber-100", text: "text-amber-800", label: "Thường" },
    elective: { bg: "bg-green-100", text: "text-green-800", label: "Chọn lọc" },
} as const;

// Default AI preferences
export const DEFAULT_AI_PREFERENCES = {
    // Existing
    enableExamSuggestions: true,
    enableAutoSymptomAnalysis: true,
    enableDashboardBriefing: true,
    enableDrugInteractionCheck: true,
    confidenceThreshold: 60,
    enableSessionMemory: true,
    enableAutoNotes: true,
    // New — 100% AI Extreme
    enableAmbientEngine: true,
    enableProactiveAlerts: true,
    enableVoiceInput: true,
    enableSmartSearch: true,
    enableAdaptiveUI: true,
    enableGamification: true,
} as const;

// LocalStorage key cho AI preferences
export const AI_PREFERENCES_KEY = "ehealth_ai_preferences";

// Confidence tier helper
export function getConfidenceTier(confidence: number): "high" | "medium" | "low" {
    if (confidence >= AI_CONFIDENCE.HIGH) return "high";
    if (confidence >= AI_CONFIDENCE.MEDIUM) return "medium";
    return "low";
}
