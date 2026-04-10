"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { prescriptionService } from "@/services/prescriptionService";

const MOCK_PATIENTS = [
    { id: "BN001", name: "Nguyễn Văn An" }, { id: "BN002", name: "Trần Thị Bình" },
    { id: "BN003", name: "Lê Hoàng Cường" }, { id: "BN004", name: "Phạm Thị Dung" },
];

export default function NewPrescriptionPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        patientId: "", diagnosis: "", icdCode: "", notes: "",
    });
    const [medicines, setMedicines] = useState([
        { name: "", dosage: "", frequency: "", duration: "", quantity: "", note: "" },
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleMedicineChange = (index: number, field: string, value: string) => {
        setMedicines((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
        if (errors[`med_${index}_${field}`]) setErrors((prev) => ({ ...prev, [`med_${index}_${field}`]: "" }));
    };

    const addMedicine = () => {
        setMedicines((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "", quantity: "", note: "" }]);
    };

    const removeMedicine = (index: number) => {
        if (medicines.length > 1) setMedicines((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!formData.patientId) errs.patientId = "Vui lòng chọn bệnh nhân";
        if (!formData.diagnosis.trim()) errs.diagnosis = "Vui lòng nhập chẩn đoán";
        const validMeds = medicines.filter((m) => m.name.trim());
        if (validMeds.length === 0) {
            errs.med_0_name = "Cần ít nhất một thuốc";
        } else {
            validMeds.forEach((m, i) => {
                if (!m.dosage.trim()) errs[`med_${i}_dosage`] = "Cần nhập liều lượng";
                if (!m.frequency.trim()) errs[`med_${i}_frequency`] = "Cần nhập tần suất";
                if (!m.duration.trim()) errs[`med_${i}_duration`] = "Cần nhập số ngày";
                if (m.quantity && isNaN(Number(m.quantity))) errs[`med_${i}_quantity`] = "Số lượng phải là số";
                if (m.quantity && Number(m.quantity) <= 0) errs[`med_${i}_quantity`] = "Số lượng phải > 0";
            });
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await prescriptionService.create({
                patientId: formData.patientId,
                diagnosis: formData.diagnosis,
                icdCode: formData.icdCode || undefined,
                notes: formData.notes || undefined,
                medications: medicines.filter((m) => m.name).map((m) => ({
                    name: m.name, dosage: m.dosage, frequency: m.frequency,
                    duration: m.duration, quantity: m.quantity, note: m.note || undefined,
                })),
            });
            router.push("/portal/doctor/prescriptions");
        } catch {
            alert("Tạo đơn thuốc thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/doctor/prescriptions" className="hover:text-[#3C81C6]">Kê đơn</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo đơn thuốc mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span> Tạo đơn thuốc mới
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Thông tin bệnh nhân & chẩn đoán */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bệnh nhân *</label>
                            <select name="patientId" value={formData.patientId} onChange={handleChange} className={`w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.patientId ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`}>
                                <option value="">-- Chọn bệnh nhân --</option>
                                {MOCK_PATIENTS.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                            </select>
                            {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã ICD-10</label>
                            <input type="text" name="icdCode" value={formData.icdCode} onChange={handleChange} placeholder="VD: J06.9" className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chẩn đoán *</label>
                            <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={2} placeholder="Nhập chẩn đoán bệnh..." className={`w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.diagnosis ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none`} />
                            {errors.diagnosis && <p className="text-xs text-red-500 mt-1">{errors.diagnosis}</p>}
                        </div>
                    </div>

                    {/* Danh sách thuốc */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">pills</span> Danh sách thuốc
                            </h3>
                            <button type="button" onClick={addMedicine} className="flex items-center gap-1 px-3 py-1.5 bg-[#3C81C6]/10 text-[#3C81C6] rounded-lg text-xs font-bold hover:bg-[#3C81C6]/20 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">add</span> Thêm thuốc
                            </button>
                        </div>
                        <div className="space-y-3">
                            {medicines.map((med, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-[#3C81C6]">Thuốc #{idx + 1}</span>
                                        {medicines.length > 1 && (
                                            <button type="button" onClick={() => removeMedicine(idx)} className="text-red-500 hover:text-red-700">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <input type="text" placeholder="Tên thuốc *" value={med.name} onChange={(e) => handleMedicineChange(idx, "name", e.target.value)} className={`w-full py-2 px-3 text-sm bg-white dark:bg-gray-900 border ${errors[`med_${idx}_name`] ? "border-red-400" : "border-gray-200 dark:border-gray-600"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`} />
                                            {errors[`med_${idx}_name`] && <p className="text-xs text-red-500 mt-0.5">{errors[`med_${idx}_name`]}</p>}
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Liều lượng (VD: 500mg) *" value={med.dosage} onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)} className={`w-full py-2 px-3 text-sm bg-white dark:bg-gray-900 border ${errors[`med_${idx}_dosage`] ? "border-red-400" : "border-gray-200 dark:border-gray-600"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`} />
                                            {errors[`med_${idx}_dosage`] && <p className="text-xs text-red-500 mt-0.5">{errors[`med_${idx}_dosage`]}</p>}
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Tần suất (VD: 2 lần/ngày) *" value={med.frequency} onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)} className={`w-full py-2 px-3 text-sm bg-white dark:bg-gray-900 border ${errors[`med_${idx}_frequency`] ? "border-red-400" : "border-gray-200 dark:border-gray-600"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`} />
                                            {errors[`med_${idx}_frequency`] && <p className="text-xs text-red-500 mt-0.5">{errors[`med_${idx}_frequency`]}</p>}
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Số ngày dùng *" value={med.duration} onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)} className={`w-full py-2 px-3 text-sm bg-white dark:bg-gray-900 border ${errors[`med_${idx}_duration`] ? "border-red-400" : "border-gray-200 dark:border-gray-600"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`} />
                                            {errors[`med_${idx}_duration`] && <p className="text-xs text-red-500 mt-0.5">{errors[`med_${idx}_duration`]}</p>}
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Số lượng" value={med.quantity} onChange={(e) => handleMedicineChange(idx, "quantity", e.target.value)} className={`w-full py-2 px-3 text-sm bg-white dark:bg-gray-900 border ${errors[`med_${idx}_quantity`] ? "border-red-400" : "border-gray-200 dark:border-gray-600"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white`} />
                                            {errors[`med_${idx}_quantity`] && <p className="text-xs text-red-500 mt-0.5">{errors[`med_${idx}_quantity`]}</p>}
                                        </div>
                                        <input type="text" placeholder="Ghi chú (uống sau ăn...)" value={med.note} onChange={(e) => handleMedicineChange(idx, "note", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lời dặn bác sĩ</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Lưu ý cho bệnh nhân..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tạo đơn thuốc</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
