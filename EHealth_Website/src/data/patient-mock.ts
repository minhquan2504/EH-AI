/**
 * Patient Portal — Mock Data
 * Dữ liệu giả để hiển thị khi backend chưa sẵn sàng.
 * Khi backend API hoạt động → các page sẽ ưu tiên dữ liệu thật.
 */

import type { Specialty } from "@/services/specialtyService";
import type { Doctor } from "@/services/doctorService";

// ============================================
// SPECIALTIES
// ============================================

export interface SpecialtyEnrich {
    icon: string;
    color: string;
    diseases: string[];
    longDesc: string;
    doctorCount: number;
}

export const SPECIALTY_ENRICH_MAP: Record<string, SpecialtyEnrich> = {
    "Tim mạch": { icon: "cardiology", color: "from-red-500 to-rose-600", diseases: ["Tăng huyết áp", "Suy tim", "Rối loạn nhịp tim", "Bệnh mạch vành"], longDesc: "Khám, chẩn đoán và điều trị toàn diện bệnh lý tim mạch với trang thiết bị hiện đại nhất. Siêu âm tim, điện tâm đồ, Holter huyết áp.", doctorCount: 8 },
    "Thần kinh": { icon: "neurology", color: "from-violet-500 to-purple-600", diseases: ["Đau đầu", "Đột quỵ", "Parkinson", "Mất ngủ"], longDesc: "Điều trị đau đầu, đột quỵ, Parkinson và các rối loạn thần kinh phức tạp. Phòng khám tích hợp đo điện não đồ.", doctorCount: 6 },
    "Da liễu": { icon: "dermatology", color: "from-amber-500 to-orange-600", diseases: ["Mụn trứng cá", "Nám da", "Viêm da cơ địa", "Eczema"], longDesc: "Chăm sóc da, điều trị mụn, nám và các bệnh lý da liễu bằng công nghệ laser tiên tiến.", doctorCount: 5 },
    "Nhi khoa": { icon: "child_care", color: "from-cyan-500 to-teal-600", diseases: ["Sốt siêu vi", "Viêm phổi", "Tiêu chảy", "Sởi"], longDesc: "Chăm sóc sức khoẻ toàn diện cho trẻ em từ sơ sinh đến 16 tuổi. Tiêm chủng, khám tăng trưởng.", doctorCount: 10 },
    "Nhãn khoa": { icon: "visibility", color: "from-blue-500 to-indigo-600", diseases: ["Cận thị", "Glaucoma", "Đục thủy tinh thể", "Viêm kết mạc"], longDesc: "Khám mắt, phẫu thuật laser LASIK, điều trị tật khúc xạ chuyên sâu. Đo thị lực tiên tiến.", doctorCount: 4 },
    "Răng hàm mặt": { icon: "dentistry", color: "from-emerald-500 to-green-600", diseases: ["Sâu răng", "Viêm nha chu", "Răng khôn", "Viêm tủy"], longDesc: "Nha khoa tổng hợp: nhổ răng, trồng Implant, niềng răng, thẩm mỹ cười. Thiết bị Cone Beam CT.", doctorCount: 7 },
    "Chấn thương chỉnh hình": { icon: "orthopedics", color: "from-sky-500 to-blue-600", diseases: ["Thoái hoá khớp", "Đau lưng", "Gãy xương", "Thoát vị đĩa đệm"], longDesc: "Phẫu thuật và điều trị xương khớp, thay khớp nhân tạo, chấn thương thể thao. Phục hồi chức năng.", doctorCount: 6 },
    "Sản phụ khoa": { icon: "pregnant_woman", color: "from-pink-500 to-rose-600", diseases: ["Thai kỳ", "Viêm phụ khoa", "Vô sinh", "U xơ tử cung"], longDesc: "Theo dõi thai kỳ, sinh đẻ an toàn, khám phụ khoa, hỗ trợ sinh sản IVF. Phòng sinh cao cấp.", doctorCount: 9 },
    "Nội tổng quát": { icon: "medical_services", color: "from-teal-500 to-cyan-600", diseases: ["Tiểu đường", "Cao huyết áp", "Rối loạn tiêu hoá", "Viêm dạ dày"], longDesc: "Khám và điều trị tổng quát các bệnh lý nội khoa thường gặp. Gói khám sức khoẻ tổng quát.", doctorCount: 12 },
    "Tai mũi họng": { icon: "hearing", color: "from-indigo-500 to-violet-600", diseases: ["Viêm xoang", "Viêm amidan", "Viêm tai giữa", "Ù tai"], longDesc: "Chẩn đoán và điều trị chuyên sâu các bệnh lý tai, mũi, họng. Nội soi TMH bằng camera HD.", doctorCount: 5 },
    "Tiêu hóa": { icon: "gastroenterology", color: "from-yellow-500 to-amber-600", diseases: ["Trào ngược dạ dày", "Viêm đại tràng", "Sỏi mật", "Polyp đại tràng"], longDesc: "Nội soi tiêu hóa, khám và điều trị các bệnh lý dạ dày, ruột, gan, mật. Nội soi không đau.", doctorCount: 5 },
    "Hô hấp": { icon: "pulmonology", color: "from-sky-400 to-cyan-500", diseases: ["Hen suyễn", "Viêm phổi", "COPD", "Lao phổi"], longDesc: "Điều trị hen suyễn, COPD, nhiễm trùng đường hô hấp. Đo chức năng hô hấp hiện đại.", doctorCount: 4 },
    "Thận — Tiết niệu": { icon: "nephrology", color: "from-orange-500 to-red-500", diseases: ["Sỏi thận", "Nhiễm trùng tiết niệu", "Suy thận", "Viêm bàng quang"], longDesc: "Khám và điều trị sỏi thận, nhiễm trùng tiết niệu, suy thận. Tán sỏi ngoài cơ thể.", doctorCount: 4 },
    "Ung bướu": { icon: "oncology", color: "from-fuchsia-500 to-pink-600", diseases: ["Ung thư phổi", "Ung thư vú", "Ung thư đại tràng", "Ung thư gan"], longDesc: "Chẩn đoán sớm và điều trị ung thư bằng hóa trị, xạ trị, miễn dịch trị liệu. Tầm soát ung thư.", doctorCount: 3 },
    "Tâm thần": { icon: "psychology", color: "from-purple-400 to-violet-500", diseases: ["Trầm cảm", "Rối loạn lo âu", "Mất ngủ mãn tính", "PTSD"], longDesc: "Tư vấn và điều trị trầm cảm, rối loạn lo âu, mất ngủ. Liệu pháp tâm lý cá nhân và nhóm.", doctorCount: 3 },
};

export const MOCK_SPECIALTIES: Specialty[] = Object.entries(SPECIALTY_ENRICH_MAP).map(([name, data], i) => ({
    id: `sp-${String(i + 1).padStart(3, "0")}`,
    code: `K-${String(i + 1).padStart(3, "0")}`,
    name,
    description: data.longDesc,
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
}));

// ============================================
// DOCTORS
// ============================================

export const MOCK_DOCTORS: Doctor[] = [
    { id: "doc-001", code: "BS-001", fullName: "PGS.TS.BS Nguyễn Thanh Hùng", specialization: "Tim mạch can thiệp, Siêu âm tim", departmentId: "sp-001", departmentName: "Tim mạch", phone: "0901234001", email: "hung.nt@ehealth.vn", rating: 4.9, status: "active", experience: 25, qualification: "Phó Giáo sư, Tiến sĩ Y học" },
    { id: "doc-002", code: "BS-002", fullName: "TS.BS Trần Thị Minh Châu", specialization: "Thần kinh tổng quát, Đột quỵ", departmentId: "sp-002", departmentName: "Thần kinh", phone: "0901234002", email: "chau.ttm@ehealth.vn", rating: 4.8, status: "active", experience: 18, qualification: "Tiến sĩ Y học" },
    { id: "doc-003", code: "BS-003", fullName: "ThS.BS Lê Hoàng Nam", specialization: "Da liễu thẩm mỹ, Laser trị liệu", departmentId: "sp-003", departmentName: "Da liễu", phone: "0901234003", email: "nam.lh@ehealth.vn", rating: 4.7, status: "active", experience: 12, qualification: "Thạc sĩ Y học" },
    { id: "doc-004", code: "BS-004", fullName: "PGS.TS.BS Phạm Thị Hồng Vân", specialization: "Nhi tổng hợp, Nhi sơ sinh", departmentId: "sp-004", departmentName: "Nhi khoa", phone: "0901234004", email: "van.pth@ehealth.vn", rating: 4.9, status: "active", experience: 22, qualification: "Phó Giáo sư, Tiến sĩ" },
    { id: "doc-005", code: "BS-005", fullName: "TS.BS Hoàng Minh Đức", specialization: "Nhãn khoa tổng quát, Phẫu thuật LASIK", departmentId: "sp-005", departmentName: "Nhãn khoa", phone: "0901234005", email: "duc.hm@ehealth.vn", rating: 4.6, status: "active", experience: 15, qualification: "Tiến sĩ Y học" },
    { id: "doc-006", code: "BS-006", fullName: "ThS.BS Nguyễn Thị Lan Anh", specialization: "Nha khoa thẩm mỹ, Implant", departmentId: "sp-006", departmentName: "Răng hàm mặt", phone: "0901234006", email: "anh.ntl@ehealth.vn", rating: 4.8, status: "active", experience: 10, qualification: "Thạc sĩ Nha khoa" },
    { id: "doc-007", code: "BS-007", fullName: "TS.BS Vũ Đình Khoa", specialization: "Chấn thương thể thao, Thay khớp", departmentId: "sp-007", departmentName: "Chấn thương chỉnh hình", phone: "0901234007", email: "khoa.vd@ehealth.vn", rating: 4.7, status: "active", experience: 20, qualification: "Tiến sĩ Y học" },
    { id: "doc-008", code: "BS-008", fullName: "PGS.TS.BS Đặng Thị Thu Hà", specialization: "Sản khoa, Hỗ trợ sinh sản IVF", departmentId: "sp-008", departmentName: "Sản phụ khoa", phone: "0901234008", email: "ha.dtt@ehealth.vn", rating: 4.9, status: "active", experience: 23, qualification: "Phó Giáo sư, Tiến sĩ" },
    { id: "doc-009", code: "BS-009", fullName: "ThS.BS Bùi Quang Vinh", specialization: "Nội tiêu hoá, Nội tiết", departmentId: "sp-009", departmentName: "Nội tổng quát", phone: "0901234009", email: "vinh.bq@ehealth.vn", rating: 4.5, status: "active", experience: 8, qualification: "Thạc sĩ Y học" },
    { id: "doc-010", code: "BS-010", fullName: "TS.BS Phan Văn Tâm", specialization: "Tai mũi họng, Nội soi TMH", departmentId: "sp-010", departmentName: "Tai mũi họng", phone: "0901234010", email: "tam.pv@ehealth.vn", rating: 4.6, status: "active", experience: 14, qualification: "Tiến sĩ Y học" },
    { id: "doc-011", code: "BS-011", fullName: "ThS.BS Trần Đức Mạnh", specialization: "Nội soi tiêu hóa, Gan mật", departmentId: "sp-011", departmentName: "Tiêu hóa", phone: "0901234011", email: "manh.td@ehealth.vn", rating: 4.7, status: "active", experience: 11, qualification: "Thạc sĩ Y học" },
    { id: "doc-012", code: "BS-012", fullName: "TS.BS Nguyễn Thị Bích Ngọc", specialization: "Hô hấp, Lao phổi", departmentId: "sp-012", departmentName: "Hô hấp", phone: "0901234012", email: "ngoc.ntb@ehealth.vn", rating: 4.8, status: "active", experience: 16, qualification: "Tiến sĩ Y học" },
    { id: "doc-013", code: "BS-013", fullName: "ThS.BS Lý Minh Tuấn", specialization: "Tiết niệu, Tán sỏi", departmentId: "sp-013", departmentName: "Thận — Tiết niệu", phone: "0901234013", email: "tuan.lm@ehealth.vn", rating: 4.5, status: "active", experience: 9, qualification: "Thạc sĩ Y học" },
    { id: "doc-014", code: "BS-014", fullName: "PGS.TS.BS Trịnh Quốc Bảo", specialization: "Ung thư phổi, Hóa trị", departmentId: "sp-014", departmentName: "Ung bướu", phone: "0901234014", email: "bao.tq@ehealth.vn", rating: 4.9, status: "active", experience: 27, qualification: "Phó Giáo sư, Tiến sĩ" },
    { id: "doc-015", code: "BS-015", fullName: "TS.BS Đỗ Thị Phương Mai", specialization: "Tâm thần, Tâm lý lâm sàng", departmentId: "sp-015", departmentName: "Tâm thần", phone: "0901234015", email: "mai.dtp@ehealth.vn", rating: 4.7, status: "active", experience: 13, qualification: "Tiến sĩ Y học" },
    { id: "doc-016", code: "BS-016", fullName: "BS.CKII Lê Văn Phúc", specialization: "Tim mạch, Điện tâm đồ", departmentId: "sp-001", departmentName: "Tim mạch", phone: "0901234016", email: "phuc.lv@ehealth.vn", rating: 4.6, status: "active", experience: 19, qualification: "Bác sĩ Chuyên khoa II" },
    { id: "doc-017", code: "BS-017", fullName: "ThS.BS Huỳnh Thị Kim Oanh", specialization: "Nhi hô hấp, Nhi dị ứng", departmentId: "sp-004", departmentName: "Nhi khoa", phone: "0901234017", email: "oanh.htk@ehealth.vn", rating: 4.8, status: "active", experience: 7, qualification: "Thạc sĩ Y học" },
    { id: "doc-018", code: "BS-018", fullName: "BS.CKI Ngô Quốc Hưng", specialization: "Da liễu, Bệnh da miễn dịch", departmentId: "sp-003", departmentName: "Da liễu", phone: "0901234018", email: "hung.nq@ehealth.vn", rating: 4.4, status: "active", experience: 6, qualification: "Bác sĩ Chuyên khoa I" },
    { id: "doc-019", code: "BS-019", fullName: "TS.BS Phan Thanh Sơn", specialization: "Phẫu thuật xương khớp, Y học thể thao", departmentId: "sp-007", departmentName: "Chấn thương chỉnh hình", phone: "0901234019", email: "son.pt@ehealth.vn", rating: 4.7, status: "active", experience: 17, qualification: "Tiến sĩ Y học" },
    { id: "doc-020", code: "BS-020", fullName: "ThS.BS Đỗ Thị Thanh Thảo", specialization: "Sản phụ khoa, Siêu âm thai", departmentId: "sp-008", departmentName: "Sản phụ khoa", phone: "0901234020", email: "thao.dtt@ehealth.vn", rating: 4.6, status: "active", experience: 8, qualification: "Thạc sĩ Y học" },
];

// ============================================
// MOCK REVIEWS (for doctor detail pages)
// ============================================

export const MOCK_REVIEWS = [
    { name: "Chị Nguyễn Thị Mai", rating: 5, date: "15/03/2026", text: "Bác sĩ rất tận tình, giải thích cặn kẽ từng vấn đề sức khoẻ. Tôi rất hài lòng với dịch vụ tại đây." },
    { name: "Anh Trần Đức Hùng", rating: 5, date: "08/03/2026", text: "Đội ngũ y bác sĩ chuyên nghiệp, cơ sở vật chất hiện đại. Quy trình khám nhanh gọn, sẽ quay lại." },
    { name: "Chị Lê Phương Thảo", rating: 4, date: "01/03/2026", text: "Quy trình khám nhanh gọn, không phải chờ đợi lâu. Rất đáng tin cậy." },
    { name: "Anh Võ Minh Quân", rating: 5, date: "22/02/2026", text: "Lần đầu khám tại EHealth, rất ấn tượng với cách phục vụ chu đáo của toàn bộ nhân viên." },
    { name: "Chị Huỳnh Ngọc Lan", rating: 4, date: "15/02/2026", text: "Bác sĩ giỏi, nhưng thời gian chờ hơi lâu vào giờ cao điểm. Nên đặt lịch trước để tránh chờ." },
    { name: "Anh Phạm Hoàng Long", rating: 5, date: "08/02/2026", text: "Mình đã khám ở nhiều bệnh viện nhưng EHealth là nơi tốt nhất. Bác sĩ lắng nghe và tư vấn rất tận tâm." },
];

// ============================================
// MOCK APPOINTMENTS (compatible with Appointment type)
// ============================================

import type { Appointment } from "@/services/appointmentService";

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export const MOCK_APPOINTMENTS: Appointment[] = [
    { id: "apt-001", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-001", doctorName: "PGS.TS.BS Nguyễn Thanh Hùng", departmentId: "sp-001", departmentName: "Tim mạch", date: fmt(addDays(today, 3)), time: "08:00", type: "first_visit", status: "confirmed", reason: "Đau ngực, khó thở khi gắng sức", notes: "Phòng 301, Tầng 3 — Phí: 500.000đ", createdAt: fmt(addDays(today, -1)), updatedAt: fmt(today) },
    { id: "apt-002", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-002", doctorName: "TS.BS Trần Thị Minh Châu", departmentId: "sp-002", departmentName: "Thần kinh", date: fmt(addDays(today, 7)), time: "09:30", type: "first_visit", status: "pending", reason: "Đau đầu kéo dài, chóng mặt", notes: "Phòng 205, Tầng 2 — Phí: 450.000đ", createdAt: fmt(today), updatedAt: fmt(today) },
    { id: "apt-003", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-003", doctorName: "ThS.BS Lê Hoàng Nam", departmentId: "sp-003", departmentName: "Da liễu", date: fmt(addDays(today, 14)), time: "14:00", type: "consultation", status: "pending", reason: "Mụn lâu ngày không hết", notes: "Online — Zoom — Phí: 250.000đ", createdAt: fmt(today), updatedAt: fmt(today) },
    { id: "apt-004", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-004", doctorName: "PGS.TS.BS Phạm Thị Hồng Vân", departmentId: "sp-004", departmentName: "Nhi khoa", date: fmt(addDays(today, -14)), time: "10:00", type: "first_visit", status: "completed", reason: "Bé sốt cao 3 ngày", notes: "Chẩn đoán: Viêm họng cấp do virus", createdAt: fmt(addDays(today, -16)), updatedAt: fmt(addDays(today, -14)) },
    { id: "apt-005", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-005", doctorName: "TS.BS Hoàng Minh Đức", departmentId: "sp-005", departmentName: "Nhãn khoa", date: fmt(addDays(today, -7)), time: "15:30", type: "first_visit", status: "completed", reason: "Mắt mờ, nhìn xa không rõ", notes: "Cận thị 2 độ mắt phải, 1.75 độ mắt trái", createdAt: fmt(addDays(today, -10)), updatedAt: fmt(addDays(today, -7)) },
    { id: "apt-006", patientId: "patient-001", patientName: "Bệnh nhân", doctorId: "doc-009", doctorName: "ThS.BS Bùi Quang Vinh", departmentId: "sp-009", departmentName: "Nội tổng quát", date: fmt(addDays(today, -3)), time: "08:30", type: "first_visit", status: "cancelled", reason: "Đau bụng âm ỉ", notes: "Phòng 201, Tầng 2 — Phí: 400.000đ", createdAt: fmt(addDays(today, -7)), updatedAt: fmt(addDays(today, -3)) },
];

// ============================================
// HELPERS
// ============================================

export const getMockDoctorById = (id: string): Doctor | null => {
    return MOCK_DOCTORS.find(d => d.id === id) || null;
};

export const filterMockDoctors = (params?: {
    search?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
}): { data: Doctor[]; pagination: { page: number; limit: number; total: number; totalPages: number } } => {
    let filtered = [...MOCK_DOCTORS];
    if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(d =>
            d.fullName.toLowerCase().includes(q) ||
            d.departmentName.toLowerCase().includes(q) ||
            d.specialization?.toLowerCase().includes(q)
        );
    }
    if (params?.departmentId) {
        filtered = filtered.filter(d => d.departmentId === params.departmentId);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, pagination: { page, limit, total, totalPages } };
};

export const filterMockAppointments = (statusFilter?: string): Appointment[] => {
    if (!statusFilter) return MOCK_APPOINTMENTS;
    const statuses = statusFilter.split(",").map(s => s.trim());
    return MOCK_APPOINTMENTS.filter(a => statuses.includes(a.status));
};

export const getMockAppointmentById = (id: string): Appointment | null => {
    return MOCK_APPOINTMENTS.find(a => a.id === id) || null;
};

