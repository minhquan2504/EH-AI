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
    insuranceRate: number;
    description: string;
}
