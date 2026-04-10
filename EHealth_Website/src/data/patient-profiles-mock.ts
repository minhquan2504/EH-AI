/**
 * Patient Profiles Mock Data
 * Nhiều hồ sơ bệnh nhân cho 1 tài khoản user
 */

export interface PatientProfile {
    id: string;
    userId: string;
    fullName: string;
    dob: string;
    gender: "male" | "female" | "other";
    phone: string;
    idNumber?: string;
    insuranceNumber?: string;
    address?: string;
    relationship: "self" | "parent" | "child" | "sibling" | "spouse" | "other";
    relationshipLabel: string;
    email?: string;
    bloodType?: string;
    insuranceExpiry?: string;
    allergies?: string[];
    medicalHistory?: string;
    isActive: boolean;
    isPrimary: boolean;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export const MOCK_PATIENT_PROFILES: PatientProfile[] = [
    {
        id: "pp-001",
        userId: "patient-001",
        fullName: "Nguyễn Văn An",
        dob: "1990-05-15",
        gender: "male",
        phone: "0901234567",
        idNumber: "079090012345",
        insuranceNumber: "HS4010012345678",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        relationship: "self",
        relationshipLabel: "Bản thân",
        allergies: ["Penicillin"],
        medicalHistory: "Tăng huyết áp nhẹ, đang điều trị",
        isActive: true,
        isPrimary: true,
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2026-03-01T00:00:00Z",
    },
    {
        id: "pp-002",
        userId: "patient-001",
        fullName: "Nguyễn Thị Hoa",
        dob: "1965-08-20",
        gender: "female",
        phone: "0901234568",
        idNumber: "079065087654",
        insuranceNumber: "HS4010087654321",
        address: "456 Lê Lợi, Quận 3, TP.HCM",
        relationship: "parent",
        relationshipLabel: "Mẹ",
        allergies: [],
        medicalHistory: "Tiểu đường type 2, thoái hoá khớp gối",
        isActive: true,
        isPrimary: false,
        createdAt: "2025-03-10T00:00:00Z",
        updatedAt: "2026-02-15T00:00:00Z",
    },
    {
        id: "pp-003",
        userId: "patient-001",
        fullName: "Nguyễn Văn Bình",
        dob: "1962-12-03",
        gender: "male",
        phone: "0901234569",
        idNumber: "079062034567",
        insuranceNumber: "HS4010034567890",
        address: "456 Lê Lợi, Quận 3, TP.HCM",
        relationship: "parent",
        relationshipLabel: "Cha",
        allergies: ["Sulfa"],
        medicalHistory: "Cao huyết áp, bệnh phổi tắc nghẽn mạn tính (COPD)",
        isActive: true,
        isPrimary: false,
        createdAt: "2025-03-10T00:00:00Z",
        updatedAt: "2026-01-20T00:00:00Z",
    },
    {
        id: "pp-004",
        userId: "patient-001",
        fullName: "Nguyễn Minh Anh",
        dob: "2020-03-25",
        gender: "female",
        phone: "0901234567",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        relationship: "child",
        relationshipLabel: "Con gái",
        allergies: [],
        medicalHistory: "Khoẻ mạnh, tiêm chủng đầy đủ",
        isActive: true,
        isPrimary: false,
        createdAt: "2025-06-01T00:00:00Z",
        updatedAt: "2026-03-15T00:00:00Z",
    },
];

// Helpers
export const getProfilesByUserId = (userId: string): PatientProfile[] => {
    return MOCK_PATIENT_PROFILES.filter(p => p.userId === userId && p.isActive);
};

export const getProfileById = (id: string): PatientProfile | null => {
    return MOCK_PATIENT_PROFILES.find(p => p.id === id) || null;
};

export const RELATIONSHIP_OPTIONS = [
    { value: "self", label: "Bản thân", icon: "person" },
    { value: "parent", label: "Cha/Mẹ", icon: "elderly" },
    { value: "child", label: "Con", icon: "child_care" },
    { value: "sibling", label: "Anh/Chị/Em", icon: "group" },
    { value: "spouse", label: "Vợ/Chồng", icon: "favorite" },
    { value: "other", label: "Khác", icon: "person_add" },
];
