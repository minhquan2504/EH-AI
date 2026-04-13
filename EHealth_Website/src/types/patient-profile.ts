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

export const RELATIONSHIP_OPTIONS = [
    { value: "self", label: "Bản thân", icon: "person" },
    { value: "parent", label: "Cha/Mẹ", icon: "elderly" },
    { value: "child", label: "Con", icon: "child_care" },
    { value: "sibling", label: "Anh/Chị/Em", icon: "group" },
    { value: "spouse", label: "Vợ/Chồng", icon: "favorite" },
    { value: "other", label: "Khác", icon: "person_add" },
];
