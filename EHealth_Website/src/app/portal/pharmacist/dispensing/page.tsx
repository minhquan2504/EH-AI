"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dispensingService } from "@/services/dispensingService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIDispensingAssistant } from "@/components/portal/ai";

const MOCK_DISPENSING = {
    id: "DT003", patient: "Trần Văn Cường", patientId: "BN-24933", age: 58, gender: "Nam", phone: "0903 *** 789",
    doctor: "BS. Ngô Đức", dept: "Tim mạch", diagnosis: "Tăng huyết áp, Đái tháo đường type 2",
    date: "25/02/2025", note: "Uống thuốc đều đặn, tái khám sau 1 tháng",
    medicines: [
        { name: "Amlodipine 5mg", qty: "30 viên", dosage: "Uống 1 viên mỗi sáng", lot: "LOT-2025-001", expiry: "12/2026" },
        { name: "Aspirin 81mg", qty: "30 viên", dosage: "Uống 1 viên sau ăn trưa", lot: "LOT-2025-002", expiry: "09/2026" },
        { name: "Atorvastatin 10mg", qty: "30 viên", dosage: "Uống 1 viên mỗi tối", lot: "LOT-2025-003", expiry: "06/2026" },
        { name: "Losartan 50mg", qty: "30 viên", dosage: "Uống 1 viên mỗi sáng", lot: "LOT-2025-004", expiry: "03/2027" },
        { name: "Metformin 500mg", qty: "60 viên", dosage: "Uống 1 viên x 2 lần/ngày", lot: "LOT-2025-005", expiry: "01/2027" },
    ],
};

export default function DispensingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prescriptionId = searchParams.get("id");
    usePageAIContext({ pageKey: 'dispensing' });
    const [checkedMeds, setCheckedMeds] = useState<Record<number, boolean>>({});
    const [patientConfirmed, setPatientConfirmed] = useState(false);
    const [dispensing, setDispensing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [rx, setRx] = useState(MOCK_DISPENSING);

    useEffect(() => {
        if (!prescriptionId) return;
        // Dùng /api/dispensing/{prescriptionId} — đúng Swagger
        dispensingService.getPrescription(prescriptionId)
            .then(res => {
                const data = res?.data ?? res;
                if (data) setRx(data);
            })
            .catch(() => {/* keep mock */});
    }, [prescriptionId]);

    const allChecked = rx.medicines.every((_, i) => checkedMeds[i]);

    const toggleMed = (idx: number) => {
        setCheckedMeds(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleDispense = async () => {
        if (!allChecked || !patientConfirmed) return;
        setDispensing(true);
        try {
            const id = prescriptionId || rx.id;
            await dispensingService.dispense(id, {
                items: rx.medicines.map((m, i) => ({ ...m, dispensed: checkedMeds[i] })),
            });
            setCompleted(true);
        } catch {
            alert("Cấp phát thuốc thất bại. Vui lòng thử lại.");
        } finally {
            setDispensing(false);
        }
    };

    if (completed) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-lg mx-auto text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white mb-2">Cấp phát thành công!</h1>
                    <p className="text-sm text-[#687582] mb-6">Đơn thuốc {rx.id} đã được cấp phát cho bệnh nhân {rx.patient}.</p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => router.push("/portal/pharmacist/prescriptions")} className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors">
                            Về danh sách đơn
                        </button>
                        <button onClick={() => window.print()} className="px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">print</span>In nhãn thuốc
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8"><div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">local_pharmacy</span>
                        Cấp phát thuốc — {rx.id}
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Kiểm tra và xác nhận cấp phát từng thuốc</p>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>Quay lại
                </button>
            </div>

            {/* Patient Info */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-[#687582]">Bệnh nhân</span><p className="font-bold text-[#121417] dark:text-white">{rx.patient}</p></div>
                    <div><span className="text-[#687582]">Tuổi / Giới</span><p className="font-medium text-[#121417] dark:text-white">{rx.age} tuổi, {rx.gender}</p></div>
                    <div><span className="text-[#687582]">Bác sĩ</span><p className="font-medium text-[#121417] dark:text-white">{rx.doctor}</p></div>
                    <div><span className="text-[#687582]">Chẩn đoán</span><p className="font-medium text-[#121417] dark:text-white">{rx.diagnosis}</p></div>
                </div>
                {rx.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-[#687582]"><strong>Lời dặn BS:</strong> {rx.note}</p>
                    </div>
                )}
            </div>

            {/* AI Drug Interaction Checker */}
            <AIDispensingAssistant />

            {/* Medicine Checklist */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span>
                        Checklist thuốc ({Object.values(checkedMeds).filter(Boolean).length}/{rx.medicines.length})
                    </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rx.medicines.map((med, i) => (
                        <div key={i} onClick={() => toggleMed(i)}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${checkedMeds[i] ? "bg-green-50/50 dark:bg-green-900/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedMeds[i] ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"}`}>
                                {checkedMeds[i] && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${checkedMeds[i] ? "text-green-700 dark:text-green-400 line-through" : "text-[#121417] dark:text-white"}`}>{med.name}</p>
                                <p className="text-xs text-[#687582] mt-0.5">{med.dosage}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-[#121417] dark:text-white">{med.qty}</p>
                                <p className="text-[10px] text-[#687582]">Lô: {med.lot} • HSD: {med.expiry}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Patient Confirmation */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${patientConfirmed ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-dashed border-gray-300 dark:border-gray-600"}`}>
                <input type="checkbox" checked={patientConfirmed} onChange={e => setPatientConfirmed(e.target.checked)} className="w-5 h-5 rounded text-green-600" />
                <div>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">Xác nhận bệnh nhân đã nhận thuốc</p>
                    <p className="text-xs text-[#687582]">Bệnh nhân {rx.patient} đã được hướng dẫn cách dùng thuốc và xác nhận nhận đủ thuốc.</p>
                </div>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#687582] hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">print</span>In nhãn thuốc
                </button>
                <button onClick={handleDispense} disabled={!allChecked || !patientConfirmed || dispensing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-md shadow-green-200 dark:shadow-none">
                    {dispensing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</> : <><span className="material-symbols-outlined text-[18px]">done_all</span>Hoàn thành cấp phát</>}
                </button>
            </div>
        </div></div>
    );
}
