/**
 * Validation Utilities
 * Hàm validate chuẩn cho các field y tế Việt Nam
 */

export interface ValidationResult {
    valid: boolean;
    message: string;
}

const OK: ValidationResult = { valid: true, message: "" };

// ============================================
// Họ tên: 2-100 ký tự, không chứa số
// ============================================
export function validateName(name: string, label = "Họ tên"): ValidationResult {
    const trimmed = name.trim();
    if (!trimmed) return { valid: false, message: `${label} không được để trống` };
    if (trimmed.length < 2) return { valid: false, message: `${label} phải có ít nhất 2 ký tự` };
    if (trimmed.length > 100) return { valid: false, message: `${label} không được quá 100 ký tự` };
    if (/\d/.test(trimmed)) return { valid: false, message: `${label} không được chứa số` };
    return OK;
}

// ============================================
// SĐT Việt Nam: bắt đầu bằng 0, 10 chữ số
// Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x
// ============================================
export function validatePhone(phone: string): ValidationResult {
    const cleaned = phone.replace(/[\s\-\.]/g, "");
    if (!cleaned) return { valid: false, message: "Số điện thoại không được để trống" };
    if (!/^\d+$/.test(cleaned)) return { valid: false, message: "Số điện thoại chỉ được chứa chữ số" };
    if (cleaned.length !== 10) return { valid: false, message: "Số điện thoại phải có đúng 10 chữ số" };
    if (!/^0(3|5|7|8|9)\d{8}$/.test(cleaned)) return { valid: false, message: "Đầu số không hợp lệ (phải là 03x, 05x, 07x, 08x, 09x)" };
    return OK;
}

// ============================================
// Ngày sinh: không ở tương lai, tuổi 0-150
// ============================================
export function validateDob(dob: string): ValidationResult {
    if (!dob) return OK; // Optional field
    const date = new Date(dob + "T00:00:00");
    if (isNaN(date.getTime())) return { valid: false, message: "Ngày sinh không hợp lệ" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return { valid: false, message: "Ngày sinh không thể ở tương lai" };
    const age = today.getFullYear() - date.getFullYear();
    if (age > 150) return { valid: false, message: "Ngày sinh không hợp lệ (quá 150 tuổi)" };
    return OK;
}

// ============================================
// CCCD/CMND: 9 hoặc 12 chữ số
// ============================================
export function validateIdNumber(id: string): ValidationResult {
    if (!id) return OK; // Optional
    const cleaned = id.replace(/\s/g, "");
    if (!/^\d+$/.test(cleaned)) return { valid: false, message: "CCCD/CMND chỉ được chứa chữ số" };
    if (cleaned.length !== 9 && cleaned.length !== 12) return { valid: false, message: "CCCD phải có 12 số hoặc CMND phải có 9 số" };
    return OK;
}

// ============================================
// Số BHYT: 15 ký tự (2 chữ cái + 13 số)
// Format: XX-XXX-XXXX-XXXXX (chữ + số)
// ============================================
export function validateBHYT(bhyt: string): ValidationResult {
    if (!bhyt) return OK; // Optional
    const cleaned = bhyt.replace(/[\s\-]/g, "").toUpperCase();
    if (cleaned.length !== 15) return { valid: false, message: "Số BHYT phải có đúng 15 ký tự" };
    if (!/^[A-Z]{2}\d{13}$/.test(cleaned)) return { valid: false, message: "Số BHYT phải bắt đầu bằng 2 chữ cái + 13 chữ số" };
    return OK;
}

// ============================================
// Email
// ============================================
export function validateEmail(email: string): ValidationResult {
    if (!email) return { valid: false, message: "Email không được để trống" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, message: "Email không đúng định dạng" };
    return OK;
}

// ============================================
// Khoảng ngày: endDate >= startDate
// ============================================
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
    if (!startDate || !endDate) return OK;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    if (end < start) return { valid: false, message: "Ngày kết thúc phải sau ngày bắt đầu" };
    return OK;
}

// ============================================
// Ngày hẹn khám: không được ở quá khứ
// ============================================
export function validateAppointmentDate(date: string): ValidationResult {
    if (!date) return { valid: false, message: "Vui lòng chọn ngày khám" };
    const selected = new Date(date + "T00:00:00");
    if (isNaN(selected.getTime())) return { valid: false, message: "Ngày không hợp lệ" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return { valid: false, message: "Ngày khám không được ở quá khứ" };
    return OK;
}

// ============================================
// Sinh hiệu (Vital Signs) — range y tế hợp lệ
// ============================================
export function validateBloodPressure(bp: string): ValidationResult {
    if (!bp) return OK;
    const match = bp.match(/^(\d{2,3})\/(\d{2,3})$/);
    if (!match) return { valid: false, message: "Huyết áp phải có dạng tâm thu/tâm trương (VD: 120/80)" };
    const systolic = parseInt(match[1]);
    const diastolic = parseInt(match[2]);
    if (systolic < 60 || systolic > 250) return { valid: false, message: "Huyết áp tâm thu phải từ 60-250 mmHg" };
    if (diastolic < 30 || diastolic > 150) return { valid: false, message: "Huyết áp tâm trương phải từ 30-150 mmHg" };
    if (diastolic >= systolic) return { valid: false, message: "Huyết áp tâm trương phải nhỏ hơn tâm thu" };
    return OK;
}

export function validateVitalSign(value: string, type: string): ValidationResult {
    if (!value) return OK;
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: "Giá trị phải là số" };
    const ranges: Record<string, { min: number; max: number; unit: string }> = {
        heartRate: { min: 30, max: 250, unit: "bpm" },
        temperature: { min: 34.0, max: 42.0, unit: "°C" },
        spO2: { min: 50, max: 100, unit: "%" },
        respiratoryRate: { min: 5, max: 60, unit: "lần/phút" },
        weight: { min: 0.5, max: 300, unit: "kg" },
        height: { min: 20, max: 250, unit: "cm" },
    };
    const range = ranges[type];
    if (!range) return OK;
    if (num < range.min || num > range.max) {
        return { valid: false, message: `Giá trị phải từ ${range.min}-${range.max} ${range.unit}` };
    }
    return OK;
}

// ============================================
// Required text field
// ============================================
export function validateRequired(value: string, label: string): ValidationResult {
    if (!value?.trim()) return { valid: false, message: `${label} không được để trống` };
    return OK;
}
