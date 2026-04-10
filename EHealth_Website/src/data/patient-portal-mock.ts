/**
 * Patient Portal — Extended Mock Data
 * Mock data for: EHR, Billing, Telemedicine, AI Consult
 */

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

// ============================================
// EHR — Health Records
// ============================================

export interface VitalSign {
    id: string;
    date: string;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    bmi: number;
    bloodSugar?: number;
    spo2?: number;
}

export interface HealthTimelineItem {
    id: string;
    date: string;
    type: "examination" | "lab_result" | "prescription" | "surgery" | "vaccination" | "vital_check";
    title: string;
    description: string;
    doctorName?: string;
    department?: string;
    status: "completed" | "pending" | "in_progress";
    icon: string;
    color: string;
}

export interface MedicalHistoryItem {
    id: string;
    type: "chronic" | "allergy" | "surgery" | "family" | "risk_factor";
    name: string;
    details: string;
    diagnosedDate?: string;
    status: "active" | "resolved" | "monitoring";
}

export interface LabResult {
    id: string;
    date: string;
    testName: string;
    category: string;
    results: { name: string; value: string; unit: string; reference: string; status: "normal" | "high" | "low" }[];
    doctorName: string;
    status: "completed" | "pending";
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy: string;
    status: "active" | "completed" | "discontinued";
    notes?: string;
}

export const MOCK_VITAL_SIGNS: VitalSign[] = [
    { id: "vs-001", date: fmt(addDays(today, -1)), bloodPressureSystolic: 125, bloodPressureDiastolic: 82, heartRate: 72, temperature: 36.5, weight: 68, height: 170, bmi: 23.5, bloodSugar: 95, spo2: 98 },
    { id: "vs-002", date: fmt(addDays(today, -7)), bloodPressureSystolic: 128, bloodPressureDiastolic: 85, heartRate: 76, temperature: 36.7, weight: 68.5, height: 170, bmi: 23.7, bloodSugar: 102, spo2: 97 },
    { id: "vs-003", date: fmt(addDays(today, -14)), bloodPressureSystolic: 130, bloodPressureDiastolic: 88, heartRate: 80, temperature: 36.4, weight: 69, height: 170, bmi: 23.9, bloodSugar: 98, spo2: 98 },
    { id: "vs-004", date: fmt(addDays(today, -30)), bloodPressureSystolic: 118, bloodPressureDiastolic: 78, heartRate: 68, temperature: 36.6, weight: 67.5, height: 170, bmi: 23.4, bloodSugar: 90, spo2: 99 },
    { id: "vs-005", date: fmt(addDays(today, -60)), bloodPressureSystolic: 122, bloodPressureDiastolic: 80, heartRate: 74, temperature: 36.5, weight: 67, height: 170, bmi: 23.2, bloodSugar: 88, spo2: 98 },
    { id: "vs-006", date: fmt(addDays(today, -90)), bloodPressureSystolic: 120, bloodPressureDiastolic: 79, heartRate: 70, temperature: 36.6, weight: 66.5, height: 170, bmi: 23.0, bloodSugar: 92, spo2: 99 },
];

export const MOCK_HEALTH_TIMELINE: HealthTimelineItem[] = [
    { id: "ht-001", date: fmt(addDays(today, -1)), type: "vital_check", title: "Đo chỉ số sinh hiệu", description: "Huyết áp: 125/82 mmHg, Nhịp tim: 72 bpm, SpO2: 98%", status: "completed", icon: "monitor_heart", color: "text-red-500 bg-red-50" },
    { id: "ht-002", date: fmt(addDays(today, -7)), type: "examination", title: "Khám Tim mạch", description: "Khám định kỳ — Huyết áp ổn định, siêu âm tim bình thường", doctorName: "PGS.TS.BS Nguyễn Thanh Hùng", department: "Tim mạch", status: "completed", icon: "stethoscope", color: "text-blue-500 bg-blue-50" },
    { id: "ht-003", date: fmt(addDays(today, -14)), type: "lab_result", title: "Xét nghiệm máu tổng quát", description: "Công thức máu, chức năng gan thận, lipid máu — Kết quả bình thường", doctorName: "ThS.BS Bùi Quang Vinh", status: "completed", icon: "science", color: "text-purple-500 bg-purple-50" },
    { id: "ht-004", date: fmt(addDays(today, -30)), type: "prescription", title: "Kê đơn thuốc huyết áp", description: "Amlodipine 5mg x 30 ngày — Uống 1 viên/ngày sau ăn sáng", doctorName: "PGS.TS.BS Nguyễn Thanh Hùng", status: "completed", icon: "medication", color: "text-green-500 bg-green-50" },
    { id: "ht-005", date: fmt(addDays(today, -60)), type: "vaccination", title: "Tiêm vắc-xin cúm mùa 2025-2026", description: "Tiêm tại phòng tiêm chủng EHealth — Lô: FL2025-VN", status: "completed", icon: "vaccines", color: "text-amber-500 bg-amber-50" },
    { id: "ht-006", date: fmt(addDays(today, -90)), type: "examination", title: "Khám sức khỏe tổng quát", description: "Gói khám tổng quát Premium — Kết luận: Sức khỏe tốt, theo dõi huyết áp", doctorName: "ThS.BS Bùi Quang Vinh", department: "Nội tổng quát", status: "completed", icon: "health_and_safety", color: "text-teal-500 bg-teal-50" },
    { id: "ht-007", date: fmt(addDays(today, -180)), type: "surgery", title: "Tiểu phẫu nội soi dạ dày", description: "Nội soi kiểm tra + cắt polyp dạ dày — Kết quả: Lành tính", doctorName: "ThS.BS Trần Đức Mạnh", department: "Tiêu hóa", status: "completed", icon: "surgical", color: "text-orange-500 bg-orange-50" },
];

export const MOCK_MEDICAL_HISTORY: MedicalHistoryItem[] = [
    { id: "mh-001", type: "chronic", name: "Tăng huyết áp độ 1", details: "Theo dõi huyết áp hàng ngày, uống thuốc Amlodipine 5mg", diagnosedDate: "2024-06-15", status: "active" },
    { id: "mh-002", type: "allergy", name: "Dị ứng Penicillin", details: "Phản ứng: nổi mề đay, ngứa toàn thân. Tránh sử dụng kháng sinh nhóm Penicillin", status: "active" },
    { id: "mh-003", type: "allergy", name: "Dị ứng hải sản (tôm, cua)", details: "Phản ứng nhẹ: ngứa, mẩn đỏ", status: "active" },
    { id: "mh-004", type: "surgery", name: "Cắt polyp dạ dày", details: "Nội soi cắt polyp tại EHealth, kết quả giải phẫu bệnh: lành tính", diagnosedDate: "2025-10-20", status: "resolved" },
    { id: "mh-005", type: "family", name: "Cha — Tiểu đường type 2", details: "Cha phát hiện tiểu đường năm 55 tuổi, đang điều trị insulin", status: "monitoring" },
    { id: "mh-006", type: "family", name: "Mẹ — Tăng huyết áp", details: "Mẹ tăng huyết áp từ năm 50 tuổi, điều trị ổn định", status: "monitoring" },
    { id: "mh-007", type: "risk_factor", name: "Stress nghề nghiệp cao", details: "Làm việc >10 tiếng/ngày, ngồi nhiều. Cần tập thể dục thường xuyên", status: "active" },
];

export const MOCK_LAB_RESULTS: LabResult[] = [
    {
        id: "lr-001", date: fmt(addDays(today, -14)), testName: "Xét nghiệm máu tổng quát", category: "Huyết học",
        doctorName: "ThS.BS Bùi Quang Vinh", status: "completed",
        results: [
            { name: "WBC (Bạch cầu)", value: "7.2", unit: "K/µL", reference: "4.0–11.0", status: "normal" },
            { name: "RBC (Hồng cầu)", value: "4.8", unit: "M/µL", reference: "4.5–5.5", status: "normal" },
            { name: "Hemoglobin", value: "14.5", unit: "g/dL", reference: "13.5–17.5", status: "normal" },
            { name: "Hematocrit", value: "43", unit: "%", reference: "38–50", status: "normal" },
            { name: "Tiểu cầu", value: "245", unit: "K/µL", reference: "150–400", status: "normal" },
        ],
    },
    {
        id: "lr-002", date: fmt(addDays(today, -14)), testName: "Xét nghiệm lipid máu", category: "Sinh hóa",
        doctorName: "ThS.BS Bùi Quang Vinh", status: "completed",
        results: [
            { name: "Cholesterol tổng", value: "215", unit: "mg/dL", reference: "<200", status: "high" },
            { name: "LDL-C", value: "138", unit: "mg/dL", reference: "<130", status: "high" },
            { name: "HDL-C", value: "52", unit: "mg/dL", reference: ">40", status: "normal" },
            { name: "Triglyceride", value: "165", unit: "mg/dL", reference: "<150", status: "high" },
        ],
    },
    {
        id: "lr-003", date: fmt(addDays(today, -14)), testName: "Chức năng gan thận", category: "Sinh hóa",
        doctorName: "ThS.BS Bùi Quang Vinh", status: "completed",
        results: [
            { name: "AST (SGOT)", value: "28", unit: "U/L", reference: "0–40", status: "normal" },
            { name: "ALT (SGPT)", value: "32", unit: "U/L", reference: "0–41", status: "normal" },
            { name: "Creatinine", value: "0.98", unit: "mg/dL", reference: "0.7–1.3", status: "normal" },
            { name: "Urea", value: "35", unit: "mg/dL", reference: "15–45", status: "normal" },
            { name: "Đường huyết đói", value: "95", unit: "mg/dL", reference: "70–100", status: "normal" },
        ],
    },
];

export const MOCK_MEDICATIONS: Medication[] = [
    { id: "med-001", name: "Amlodipine 5mg", dosage: "5mg", frequency: "1 viên/ngày sau ăn sáng", startDate: fmt(addDays(today, -30)), prescribedBy: "PGS.TS.BS Nguyễn Thanh Hùng", status: "active", notes: "Thuốc huyết áp — uống liên tục" },
    { id: "med-002", name: "Rosuvastatin 10mg", dosage: "10mg", frequency: "1 viên/ngày trước khi ngủ", startDate: fmt(addDays(today, -14)), prescribedBy: "PGS.TS.BS Nguyễn Thanh Hùng", status: "active", notes: "Thuốc hạ mỡ máu" },
    { id: "med-003", name: "Omeprazole 20mg", dosage: "20mg", frequency: "1 viên/ngày trước ăn sáng 30 phút", startDate: fmt(addDays(today, -60)), endDate: fmt(addDays(today, -30)), prescribedBy: "ThS.BS Trần Đức Mạnh", status: "completed", notes: "Thuốc dạ dày — đã hoàn thành liệu trình" },
];

// ============================================
// BILLING — Invoices & Transactions
// ============================================

export interface Invoice {
    id: string;
    code: string;
    date: string;
    dueDate?: string;
    patientName: string;
    items: { name: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    insuranceCovered: number;
    discount: number;
    total: number;
    status: "pending" | "paid" | "overdue" | "refunded" | "partial";
    paymentMethod?: string;
    paidAt?: string;
    appointmentId?: string;
    doctorName?: string;
    department?: string;
}

export interface Transaction {
    id: string;
    date: string;
    type: "payment" | "refund" | "deposit";
    amount: number;
    method: string;
    invoiceCode: string;
    status: "success" | "pending" | "failed";
    description: string;
}

export interface ServicePrice {
    id: string;
    category: string;
    name: string;
    price: number;
    insuranceRate: number; // percentage covered by insurance
    description: string;
}

export const MOCK_INVOICES: Invoice[] = [
    {
        id: "inv-001", code: "HD-2026-0412", date: fmt(addDays(today, -7)),
        patientName: "Bệnh nhân", doctorName: "PGS.TS.BS Nguyễn Thanh Hùng", department: "Tim mạch",
        items: [
            { name: "Khám chuyên khoa Tim mạch", quantity: 1, unitPrice: 500000, total: 500000 },
            { name: "Siêu âm tim", quantity: 1, unitPrice: 350000, total: 350000 },
            { name: "Điện tâm đồ (ECG)", quantity: 1, unitPrice: 200000, total: 200000 },
        ],
        subtotal: 1050000, insuranceCovered: 420000, discount: 0, total: 630000,
        status: "paid", paymentMethod: "VNPay", paidAt: fmt(addDays(today, -7)),
    },
    {
        id: "inv-002", code: "HD-2026-0398", date: fmt(addDays(today, -14)),
        patientName: "Bệnh nhân", doctorName: "ThS.BS Bùi Quang Vinh", department: "Nội tổng quát",
        items: [
            { name: "Khám tổng quát Premium", quantity: 1, unitPrice: 1500000, total: 1500000 },
            { name: "Xét nghiệm máu tổng quát", quantity: 1, unitPrice: 350000, total: 350000 },
            { name: "Xét nghiệm lipid máu", quantity: 1, unitPrice: 250000, total: 250000 },
            { name: "Chức năng gan thận", quantity: 1, unitPrice: 300000, total: 300000 },
        ],
        subtotal: 2400000, insuranceCovered: 960000, discount: 200000, total: 1240000,
        status: "paid", paymentMethod: "MoMo", paidAt: fmt(addDays(today, -14)),
    },
    {
        id: "inv-003", code: "HD-2026-0425", date: fmt(today),
        patientName: "Bệnh nhân", doctorName: "TS.BS Trần Thị Minh Châu", department: "Thần kinh",
        items: [
            { name: "Khám chuyên khoa Thần kinh", quantity: 1, unitPrice: 450000, total: 450000 },
            { name: "Chụp MRI sọ não", quantity: 1, unitPrice: 2500000, total: 2500000 },
        ],
        subtotal: 2950000, insuranceCovered: 1180000, discount: 0, total: 1770000,
        status: "pending", dueDate: fmt(addDays(today, 7)),
    },
    {
        id: "inv-004", code: "HD-2026-0350", date: fmt(addDays(today, -30)),
        patientName: "Bệnh nhân", doctorName: "ThS.BS Trần Đức Mạnh", department: "Tiêu hóa",
        items: [
            { name: "Nội soi dạ dày", quantity: 1, unitPrice: 800000, total: 800000 },
            { name: "Sinh thiết + Giải phẫu bệnh", quantity: 1, unitPrice: 500000, total: 500000 },
            { name: "Thuốc sau thủ thuật", quantity: 1, unitPrice: 350000, total: 350000 },
        ],
        subtotal: 1650000, insuranceCovered: 660000, discount: 0, total: 990000,
        status: "paid", paymentMethod: "Tiền mặt", paidAt: fmt(addDays(today, -30)),
    },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: "tx-001", date: fmt(addDays(today, -7)), type: "payment", amount: 630000, method: "VNPay", invoiceCode: "HD-2026-0412", status: "success", description: "Thanh toán khám Tim mạch" },
    { id: "tx-002", date: fmt(addDays(today, -14)), type: "payment", amount: 1240000, method: "MoMo", invoiceCode: "HD-2026-0398", status: "success", description: "Thanh toán gói khám tổng quát Premium" },
    { id: "tx-003", date: fmt(addDays(today, -30)), type: "payment", amount: 990000, method: "Tiền mặt", invoiceCode: "HD-2026-0350", status: "success", description: "Thanh toán nội soi dạ dày" },
];

export const MOCK_SERVICE_PRICES: ServicePrice[] = [
    { id: "sp-001", category: "Khám bệnh", name: "Khám chuyên khoa", price: 400000, insuranceRate: 40, description: "Khám bởi bác sĩ chuyên khoa" },
    { id: "sp-002", category: "Khám bệnh", name: "Khám chuyên gia (PGS/TS)", price: 500000, insuranceRate: 40, description: "Khám bởi PGS, TS hoặc chuyên gia đầu ngành" },
    { id: "sp-003", category: "Khám bệnh", name: "Gói khám tổng quát cơ bản", price: 800000, insuranceRate: 30, description: "Khám tổng quát + xét nghiệm cơ bản" },
    { id: "sp-004", category: "Khám bệnh", name: "Gói khám tổng quát Premium", price: 1500000, insuranceRate: 40, description: "Khám toàn diện + XN máu + siêu âm + đo ECG" },
    { id: "sp-005", category: "Xét nghiệm", name: "Xét nghiệm máu tổng quát", price: 350000, insuranceRate: 50, description: "Công thức máu, đông máu" },
    { id: "sp-006", category: "Xét nghiệm", name: "Xét nghiệm lipid máu", price: 250000, insuranceRate: 50, description: "Cholesterol, triglyceride, LDL, HDL" },
    { id: "sp-007", category: "Xét nghiệm", name: "Chức năng gan thận", price: 300000, insuranceRate: 50, description: "AST, ALT, Creatinine, Urea" },
    { id: "sp-008", category: "Chẩn đoán hình ảnh", name: "Siêu âm tim", price: 350000, insuranceRate: 40, description: "Siêu âm Doppler tim màu" },
    { id: "sp-009", category: "Chẩn đoán hình ảnh", name: "Chụp X-quang", price: 150000, insuranceRate: 50, description: "X-quang kỹ thuật số" },
    { id: "sp-010", category: "Chẩn đoán hình ảnh", name: "Chụp MRI", price: 2500000, insuranceRate: 40, description: "Cộng hưởng từ — 1.5T hoặc 3T" },
    { id: "sp-011", category: "Chẩn đoán hình ảnh", name: "Chụp CT Scanner", price: 1800000, insuranceRate: 40, description: "CT đa lát cắt 128 dãy" },
    { id: "sp-012", category: "Thủ thuật", name: "Nội soi dạ dày", price: 800000, insuranceRate: 40, description: "Nội soi không đau (gây mê nhẹ)" },
    { id: "sp-013", category: "Thủ thuật", name: "Điện tâm đồ (ECG)", price: 200000, insuranceRate: 50, description: "Đo ECG 12 chuyển đạo" },
    { id: "sp-014", category: "Khám từ xa", name: "Tư vấn online cơ bản", price: 200000, insuranceRate: 0, description: "Video call 15–20 phút" },
    { id: "sp-015", category: "Khám từ xa", name: "Tư vấn online chuyên gia", price: 350000, insuranceRate: 0, description: "Video call 30 phút với PGS/TS" },
];

// ============================================
// TELEMEDICINE — Sessions
// ============================================

export interface TeleMockSession {
    id: string;
    doctorName: string;
    doctorId: string;
    department: string;
    date: string;
    time: string;
    duration: number; // minutes
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    reason: string;
    notes?: string;
    rating?: number;
    diagnosis?: string;
    prescription?: string[];
}

export const MOCK_TELE_SESSIONS: TeleMockSession[] = [
    { id: "tele-001", doctorName: "ThS.BS Lê Hoàng Nam", doctorId: "doc-003", department: "Da liễu", date: fmt(addDays(today, 5)), time: "14:00", duration: 20, status: "scheduled", reason: "Tái khám mụn, kiểm tra tiến triển điều trị" },
    { id: "tele-002", doctorName: "TS.BS Đỗ Thị Phương Mai", doctorId: "doc-015", department: "Tâm thần", date: fmt(addDays(today, 10)), time: "10:00", duration: 30, status: "scheduled", reason: "Tư vấn stress công việc, mất ngủ" },
    { id: "tele-003", doctorName: "ThS.BS Bùi Quang Vinh", doctorId: "doc-009", department: "Nội tổng quát", date: fmt(addDays(today, -3)), time: "09:00", duration: 15, status: "completed", reason: "Hỏi về kết quả xét nghiệm máu", rating: 5, diagnosis: "Cholesterol cao nhẹ, cần điều chỉnh chế độ ăn", prescription: ["Rosuvastatin 10mg — 1 viên/tối x 30 ngày"] },
    { id: "tele-004", doctorName: "PGS.TS.BS Nguyễn Thanh Hùng", doctorId: "doc-001", department: "Tim mạch", date: fmt(addDays(today, -14)), time: "08:30", duration: 20, status: "completed", reason: "Tái khám huyết áp, đánh giá thuốc", rating: 5, diagnosis: "Huyết áp kiểm soát tốt với Amlodipine 5mg", prescription: ["Tiếp tục Amlodipine 5mg — 1 viên/sáng"] },
    { id: "tele-005", doctorName: "ThS.BS Huỳnh Thị Kim Oanh", doctorId: "doc-017", department: "Nhi khoa", date: fmt(addDays(today, -7)), time: "16:00", duration: 15, status: "cancelled", reason: "Bé ho nhiều về đêm" },
];

export interface TeleChatMessage {
    id: string;
    sessionId: string;
    sender: "patient" | "doctor";
    message: string;
    timestamp: string;
    type: "text" | "image" | "file";
}

export const MOCK_TELE_CHAT: TeleChatMessage[] = [
    { id: "msg-001", sessionId: "tele-003", sender: "patient", message: "Chào bác sĩ, em nhận được kết quả XN, bác sĩ xem giúp em ạ", timestamp: "09:01", type: "text" },
    { id: "msg-002", sessionId: "tele-003", sender: "doctor", message: "Chào bạn, tôi đã xem kết quả. Cholesterol tổng hơi cao (215mg/dL), LDL-C cũng cao nhẹ. Không đáng lo ngại lắm nhưng cần điều chỉnh.", timestamp: "09:03", type: "text" },
    { id: "msg-003", sessionId: "tele-003", sender: "patient", message: "Dạ vậy em cần làm gì ạ?", timestamp: "09:04", type: "text" },
    { id: "msg-004", sessionId: "tele-003", sender: "doctor", message: "Tôi sẽ kê đơn Rosuvastatin 10mg, uống 1 viên/tối trước khi ngủ. Ngoài ra cần hạn chế đồ chiên rán, ăn nhiều rau xanh, tập thể dục 30 phút/ngày.", timestamp: "09:06", type: "text" },
    { id: "msg-005", sessionId: "tele-003", sender: "patient", message: "Dạ em cảm ơn bác sĩ ạ!", timestamp: "09:07", type: "text" },
    { id: "msg-006", sessionId: "tele-003", sender: "doctor", message: "Bạn nhớ tái khám sau 1 tháng để kiểm tra lại lipid máu nhé. Chúc bạn sức khỏe!", timestamp: "09:08", type: "text" },
];

// ============================================
// AI — Consult Chat
// ============================================

export interface AiChatMessage {
    id: string;
    role: "user" | "ai";
    message: string;
    timestamp: string;
    suggestions?: string[];
    specialtyRecommendation?: { name: string; icon: string; reason: string };
}

export interface AiChatSession {
    id: string;
    date: string;
    title: string;
    messages: AiChatMessage[];
    resolved: boolean;
}

export const MOCK_AI_SESSIONS: AiChatSession[] = [
    {
        id: "ai-001", date: fmt(addDays(today, -2)), title: "Đau đầu kéo dài", resolved: true,
        messages: [
            { id: "ac-001", role: "user", message: "Tôi bị đau đầu liên tục 3 ngày nay, đau vùng thái dương bên phải, uống paracetamol không đỡ", timestamp: "14:30" },
            { id: "ac-002", role: "ai", message: "Tôi hiểu bạn đang lo lắng về tình trạng đau đầu kéo dài. Để giúp đánh giá sơ bộ, tôi cần hỏi thêm:\n\n1. Cơn đau có buổi nào nặng hơn không?\n2. Kèm theo buồn nôn, nhìn mờ hay nhạy sáng không?\n3. Gần đây có bị stress, mất ngủ không?\n4. Trước đây có tiền sử đau nửa đầu không?", timestamp: "14:30", suggestions: ["Đau nặng hơn buổi sáng", "Có kèm buồn nôn", "Stress công việc", "Chưa từng bị"] },
            { id: "ac-003", role: "user", message: "Đau nặng hơn buổi sáng, có hơi buồn nôn, gần đây stress nhiều do công việc", timestamp: "14:31" },
            { id: "ac-004", role: "ai", message: "Dựa trên mô tả của bạn, đây có thể là:\n\n🔹 **Đau đầu căng thẳng (Tension headache)** — phổ biến nhất, liên quan stress\n🔹 **Migraine (Đau nửa đầu)** — nếu kèm buồn nôn, nhạy sáng\n\n⚠️ **Khuyến nghị:** Bạn nên khám chuyên khoa Thần kinh để được chẩn đoán chính xác và loại trừ nguyên nhân nghiêm trọng, đặc biệt vì đã đau 3 ngày không đỡ.\n\n📋 Trong khi chờ khám:\n• Nghỉ ngơi, tránh stress\n• Uống đủ nước\n• Không tự ý dùng thuốc giảm đau quá liều", timestamp: "14:32", specialtyRecommendation: { name: "Thần kinh", icon: "neurology", reason: "Đau đầu kéo dài 3 ngày không đáp ứng giảm đau" } },
        ],
    },
    {
        id: "ai-002", date: fmt(addDays(today, -10)), title: "Đau dạ dày sau ăn", resolved: true,
        messages: [
            { id: "ac-010", role: "user", message: "Hay bị đau vùng thượng vị sau khi ăn, ợ chua, nóng rát ngực", timestamp: "10:15" },
            { id: "ac-011", role: "ai", message: "Các triệu chứng bạn mô tả — đau thượng vị sau ăn, ợ chua, nóng rát ngực — là biểu hiện điển hình của **Trào ngược dạ dày thực quản (GERD)** hoặc **Viêm dạ dày**.\n\n⚠️ **Khuyến nghị:** Nên khám chuyên khoa Tiêu hóa. Bác sĩ có thể chỉ định nội soi kiểm tra.\n\nTrong khi chờ:\n• Ăn chậm, nhai kỹ, chia nhỏ bữa\n• Không nằm ngay sau ăn (đợi 2–3 giờ)\n• Tránh cà phê, đồ cay, rượu bia\n• Kê cao gối khi ngủ", timestamp: "10:16", specialtyRecommendation: { name: "Tiêu hóa", icon: "gastroenterology", reason: "Triệu chứng trào ngược / viêm dạ dày" } },
        ],
    },
];

export const AI_QUICK_PROMPTS = [
    { icon: "sentiment_stressed", label: "Đau đầu", prompt: "Tôi bị đau đầu" },
    { icon: "thermostat", label: "Sốt", prompt: "Tôi bị sốt" },
    { icon: "gastroenterology", label: "Đau bụng", prompt: "Tôi bị đau bụng" },
    { icon: "pulmonology", label: "Ho / Khó thở", prompt: "Tôi bị ho và khó thở" },
    { icon: "dermatology", label: "Da liễu", prompt: "Tôi bị nổi mẩn ngứa" },
    { icon: "cardiology", label: "Đau ngực", prompt: "Tôi bị đau ngực" },
    { icon: "psychology", label: "Mệt mỏi / Stress", prompt: "Tôi thường xuyên mệt mỏi và stress" },
    { icon: "visibility", label: "Mắt mờ", prompt: "Mắt tôi nhìn mờ gần đây" },
];
