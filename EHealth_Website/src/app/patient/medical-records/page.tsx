"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import axiosClient from "@/api/axiosClient";
import { MEDICAL_RECORD_ENDPOINTS } from "@/api/endpoints";

interface MedicalRecord {
    id: string;
    date: string;
    doctorName: string;
    department: string;
    diagnosis: string;
    status: string;
}

export default function MedicalRecordsPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            if (user?.id) {
                const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.BY_PATIENT(user.id));
                const data = res.data?.data || res.data || [];
                setRecords(Array.isArray(data) ? data : []);
            }
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Kết quả khám bệnh</h1>
                <p className="text-sm text-gray-500 mt-0.5">Xem lại kết quả khám, đơn thuốc và xét nghiệm</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : records.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                    <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: "64px" }}>folder_open</span>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Chưa có kết quả khám</h3>
                    <p className="text-sm text-gray-400 mb-6">Kết quả sẽ được cập nhật sau mỗi lần khám tại EHealth</p>
                    <Link href="/booking"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>calendar_month</span>
                        Đặt lịch khám
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map(record => (
                        <div key={record.id} className="bg-white rounded-2xl border border-gray-100 hover:border-[#3C81C6]/20 hover:shadow-md transition-all p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "24px" }}>description</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{record.department || "Kết quả khám"}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">BS. {record.doctorName}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>
                                                {record.date}
                                            </span>
                                        </div>
                                        {record.diagnosis && (
                                            <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">Chẩn đoán:</span> {record.diagnosis}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 text-xs font-medium text-[#3C81C6] border border-[#3C81C6]/20 rounded-lg hover:bg-[#3C81C6]/[0.06] transition-colors">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
