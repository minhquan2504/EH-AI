/**
 * Medical Services Mock Data
 * Danh mục dịch vụ y tế — liên kết với chuyên khoa
 */

export interface MedicalServiceItem {
    id: string;
    name: string;
    description: string;
    price: number;
    priceRange?: string;
    category: "examination" | "diagnostic" | "procedure" | "package" | "consultation";
    categoryLabel: string;
    specialtyIds: string[];  // chuyên khoa phù hợp
    icon: string;
    isPopular?: boolean;
    duration?: string; // "30 phút"
}

export const MOCK_MEDICAL_SERVICES: MedicalServiceItem[] = [
    // Khám
    { id: "svc-001", name: "Khám tổng quát", description: "Khám lâm sàng tổng hợp, tầm soát sức khoẻ cơ bản", price: 300000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-009"], icon: "stethoscope", isPopular: true, duration: "30 phút" },
    { id: "svc-002", name: "Khám chuyên khoa Tim mạch", description: "Khám, tư vấn bệnh lý tim mạch chuyên sâu", price: 500000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-001"], icon: "cardiology", duration: "45 phút" },
    { id: "svc-003", name: "Khám chuyên khoa Thần kinh", description: "Khám đau đầu, chóng mặt, rối loạn thần kinh", price: 450000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-002"], icon: "neurology", duration: "40 phút" },
    { id: "svc-004", name: "Khám Da liễu", description: "Khám, tư vấn điều trị mụn, nám, bệnh da liễu", price: 400000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-003"], icon: "dermatology", duration: "30 phút" },
    { id: "svc-005", name: "Khám Nhi", description: "Khám sức khoẻ trẻ em từ sơ sinh đến 16 tuổi", price: 350000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-004"], icon: "child_care", isPopular: true, duration: "30 phút" },
    { id: "svc-006", name: "Khám Mắt", description: "Đo thị lực, khám mắt tổng quát, tật khúc xạ", price: 300000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-005"], icon: "visibility", duration: "30 phút" },
    { id: "svc-007", name: "Khám Răng hàm mặt", description: "Khám răng miệng, tư vấn nha khoa thẩm mỹ", price: 200000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-006"], icon: "dentistry", duration: "30 phút" },
    { id: "svc-008", name: "Khám Sản phụ khoa", description: "Khám phụ khoa, theo dõi thai kỳ", price: 400000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-008"], icon: "pregnant_woman", isPopular: true, duration: "40 phút" },
    { id: "svc-009", name: "Khám Tai mũi họng", description: "Nội soi TMH, khám viêm xoang, viêm họng", price: 350000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-010"], icon: "hearing", duration: "30 phút" },
    { id: "svc-010", name: "Khám Xương khớp", description: "Khám đau lưng, thoái hoá khớp, chấn thương", price: 400000, category: "examination", categoryLabel: "Khám", specialtyIds: ["sp-007"], icon: "orthopedics", duration: "40 phút" },

    // Chẩn đoán
    { id: "svc-011", name: "Siêu âm tim", description: "Siêu âm Doppler tim màu, đánh giá chức năng tim", price: 600000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-001"], icon: "ecg", duration: "30 phút" },
    { id: "svc-012", name: "Điện tâm đồ (ECG)", description: "Ghi điện tâm đồ 12 đạo trình", price: 150000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-001"], icon: "ecg_heart", duration: "15 phút" },
    { id: "svc-013", name: "Chụp MRI", description: "Chụp cộng hưởng từ 3.0 Tesla độ phân giải cao", price: 3500000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-002", "sp-007"], icon: "mri", isPopular: true, duration: "45 phút" },
    { id: "svc-014", name: "Chụp CT Scanner", description: "Chụp cắt lớp vi tính đa lát cắt", price: 2500000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-002", "sp-007", "sp-001"], icon: "radiology", duration: "30 phút" },
    { id: "svc-015", name: "Xét nghiệm máu tổng quát", description: "Công thức máu, sinh hoá, mỡ máu, đường huyết", price: 800000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-009", "sp-001", "sp-011"], icon: "bloodtype", isPopular: true, duration: "15 phút" },
    { id: "svc-016", name: "Nội soi dạ dày", description: "Nội soi đường tiêu hoá trên không đau", price: 1500000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-011"], icon: "gastroenterology", duration: "30 phút" },
    { id: "svc-017", name: "Siêu âm thai", description: "Siêu âm 4D theo dõi thai nhi", price: 500000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-008"], icon: "pregnant_woman", duration: "30 phút" },
    { id: "svc-018", name: "Đo chức năng hô hấp", description: "Spirometry đo dung tích phổi, luồng khí", price: 300000, category: "diagnostic", categoryLabel: "Chẩn đoán", specialtyIds: ["sp-012"], icon: "pulmonology", duration: "20 phút" },

    // Thủ thuật
    { id: "svc-019", name: "Laser trị nám", description: "Điều trị nám, tàn nhang bằng laser Q-Switch", price: 2000000, category: "procedure", categoryLabel: "Thủ thuật", specialtyIds: ["sp-003"], icon: "dermatology", duration: "45 phút" },
    { id: "svc-020", name: "Tiêm vaccine", description: "Tiêm chủng các loại vaccine cho trẻ em và người lớn", price: 350000, priceRange: "350.000 — 1.500.000đ", category: "procedure", categoryLabel: "Thủ thuật", specialtyIds: ["sp-004", "sp-009"], icon: "vaccines", isPopular: true, duration: "15 phút" },
    { id: "svc-021", name: "Nhổ răng khôn", description: "Phẫu thuật nhổ răng khôn mọc lệch", price: 1500000, category: "procedure", categoryLabel: "Thủ thuật", specialtyIds: ["sp-006"], icon: "dentistry", duration: "60 phút" },
    { id: "svc-022", name: "Tán sỏi ngoài cơ thể", description: "Tán sỏi thận, sỏi niệu quản bằng sóng xung kích", price: 5000000, category: "procedure", categoryLabel: "Thủ thuật", specialtyIds: ["sp-013"], icon: "nephrology", duration: "60 phút" },

    // Gói khám
    { id: "svc-023", name: "Gói khám sức khoẻ tổng quát", description: "Gói khám toàn diện: lâm sàng + xét nghiệm + siêu âm + X-quang", price: 3500000, priceRange: "3.500.000 — 8.000.000đ", category: "package", categoryLabel: "Gói khám", specialtyIds: ["sp-009"], icon: "health_and_safety", isPopular: true, duration: "3 giờ" },
    { id: "svc-024", name: "Gói tầm soát ung thư", description: "Xét nghiệm marker ung thư, siêu âm, chụp X-quang", price: 5000000, priceRange: "5.000.000 — 12.000.000đ", category: "package", categoryLabel: "Gói khám", specialtyIds: ["sp-014", "sp-009"], icon: "oncology", duration: "4 giờ" },
    { id: "svc-025", name: "Gói khám tiền hôn nhân", description: "Xét nghiệm, khám tổng quát trước khi kết hôn", price: 2500000, category: "package", categoryLabel: "Gói khám", specialtyIds: ["sp-008", "sp-009"], icon: "favorite", duration: "2 giờ" },

    // Tư vấn
    { id: "svc-026", name: "Tư vấn tâm lý", description: "Tư vấn trầm cảm, rối loạn lo âu, stress", price: 500000, category: "consultation", categoryLabel: "Tư vấn", specialtyIds: ["sp-015"], icon: "psychology", duration: "60 phút" },
    { id: "svc-027", name: "Tư vấn dinh dưỡng", description: "Tư vấn chế độ ăn, dinh dưỡng cho bệnh nhân", price: 300000, category: "consultation", categoryLabel: "Tư vấn", specialtyIds: ["sp-004", "sp-009"], icon: "restaurant", duration: "30 phút" },
    { id: "svc-028", name: "Tư vấn online (Video call)", description: "Khám tư vấn trực tuyến qua video call với bác sĩ", price: 250000, category: "consultation", categoryLabel: "Tư vấn", specialtyIds: ["sp-001", "sp-002", "sp-003", "sp-004", "sp-009"], icon: "videocam", isPopular: true, duration: "30 phút" },
];

export const SERVICE_CATEGORIES = [
    { key: "all", label: "Tất cả", icon: "apps" },
    { key: "examination", label: "Khám", icon: "stethoscope" },
    { key: "diagnostic", label: "Chẩn đoán", icon: "biotech" },
    { key: "procedure", label: "Thủ thuật", icon: "healing" },
    { key: "package", label: "Gói khám", icon: "health_and_safety" },
    { key: "consultation", label: "Tư vấn", icon: "support_agent" },
];

// Helpers
export const getServicesBySpecialtyId = (specialtyId: string): MedicalServiceItem[] => {
    return MOCK_MEDICAL_SERVICES.filter(s => s.specialtyIds.includes(specialtyId));
};

export const getSpecialtyIdsByServiceId = (serviceId: string): string[] => {
    const svc = MOCK_MEDICAL_SERVICES.find(s => s.id === serviceId);
    return svc?.specialtyIds || [];
};

export const getServiceById = (id: string): MedicalServiceItem | null => {
    return MOCK_MEDICAL_SERVICES.find(s => s.id === id) || null;
};

export const filterServices = (params?: {
    search?: string;
    category?: string;
    specialtyId?: string;
}): MedicalServiceItem[] => {
    let filtered = [...MOCK_MEDICAL_SERVICES];
    if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
    }
    if (params?.category && params.category !== "all") {
        filtered = filtered.filter(s => s.category === params.category);
    }
    if (params?.specialtyId) {
        filtered = filtered.filter(s => s.specialtyIds.includes(params.specialtyId!));
    }
    return filtered;
};
