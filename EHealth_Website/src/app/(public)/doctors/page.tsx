"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { DoctorCard } from "@/components/patient/DoctorCard";
import { doctorService, type Doctor } from "@/services/doctorService";
import { getSpecialties, type Specialty } from "@/services/specialtyService";
import { MOCK_SPECIALTIES, filterMockDoctors } from "@/data/patient-mock";

const PRICE_RANGES = [
    { label: "Tất cả", min: 0, max: 999999 },
    { label: "< 300.000đ", min: 0, max: 300000 },
    { label: "300K — 500K", min: 300000, max: 500000 },
    { label: "> 500.000đ", min: 500000, max: 999999 },
];

function DoctorsPageInner() {
    const searchParams = useSearchParams();
    const rawSpecialty = searchParams.get("specialtyId");
    const initialSpecialty = rawSpecialty && rawSpecialty !== "undefined" && rawSpecialty !== "null" ? rawSpecialty : "";

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
    const [selectedGender, setSelectedGender] = useState("");
    const [selectedPrice, setSelectedPrice] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [usingMock, setUsingMock] = useState(false);

    useEffect(() => {
        loadSpecialties();
    }, []);

    useEffect(() => {
        if (usingMock) {
            loadMockDoctors();
        } else {
            loadDoctors();
        }
    }, [page, selectedSpecialty, search, usingMock]);

    const loadSpecialties = async () => {
        try {
            const res = await getSpecialties({ limit: 50 });
            if (res.data && res.data.length > 0) {
                setSpecialties(res.data);
            } else {
                setSpecialties(MOCK_SPECIALTIES);
                setUsingMock(true);
            }
        } catch {
            setSpecialties(MOCK_SPECIALTIES);
            setUsingMock(true);
        }
    };

    const loadDoctors = async () => {
        try {
            setLoading(true);
            const res = await doctorService.getList({
                page,
                limit: 12,
                search: search || undefined,
                departmentId: selectedSpecialty || undefined,
            });
            if (res.data && res.data.length > 0) {
                setDoctors(res.data);
                if (res.pagination) setTotalPages(res.pagination.totalPages);
            } else {
                // API returned empty — switch to mock
                setUsingMock(true);
            }
        } catch {
            // API failed — switch to mock
            setUsingMock(true);
        } finally {
            setLoading(false);
        }
    };

    const loadMockDoctors = () => {
        setLoading(true);
        const result = filterMockDoctors({
            search: search || undefined,
            departmentId: selectedSpecialty || undefined,
            page,
            limit: 12,
        });
        setDoctors(result.data);
        setTotalPages(result.pagination.totalPages);
        setLoading(false);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedSpecialty("");
        setSelectedGender("");
        setSelectedPrice(0);
        setPage(1);
    };

    const hasFilters = search || selectedSpecialty || selectedGender || selectedPrice > 0;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] py-14 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3C81C6]/15 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        Đội ngũ <span className="bg-gradient-to-r from-[#60a5fa] to-[#06b6d4] bg-clip-text text-transparent">Bác sĩ</span>
                    </h1>
                    <p className="text-[#94a3b8] text-base md:text-lg max-w-2xl mx-auto mb-8">
                        Tìm bác sĩ phù hợp từ đội ngũ 120+ chuyên gia giàu kinh nghiệm
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 text-sm" />
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex gap-8">
                    {/* Sidebar Filters — Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>tune</span>
                                        Bộ lọc
                                    </h3>
                                    {hasFilters && (
                                        <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">Xoá lọc</button>
                                    )}
                                </div>

                                {/* Specialty filter */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Chuyên khoa</label>
                                    <select value={selectedSpecialty} onChange={e => { setSelectedSpecialty(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6]/30">
                                        <option value="">Tất cả chuyên khoa</option>
                                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {/* Gender filter */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Giới tính</label>
                                    <div className="flex gap-2">
                                        {[{ v: "", l: "Tất cả" }, { v: "male", l: "Nam" }, { v: "female", l: "Nữ" }].map(g => (
                                            <button key={g.v} onClick={() => setSelectedGender(g.v)}
                                                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all
                                                ${selectedGender === g.v ? "bg-[#3C81C6] text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                                                {g.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price filter */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Mức giá</label>
                                    <div className="space-y-1.5">
                                        {PRICE_RANGES.map((p, i) => (
                                            <button key={i} onClick={() => setSelectedPrice(i)}
                                                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all
                                                ${selectedPrice === i ? "bg-[#3C81C6]/10 text-[#3C81C6] border border-[#3C81C6]/20" : "text-gray-600 hover:bg-gray-50"}`}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Consultation type */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Hình thức</label>
                                    <div className="flex gap-2">
                                        {[{ l: "Tất cả", i: "select_all" }, { l: "Trực tiếp", i: "person" }, { l: "Online", i: "videocam" }].map((t, i) => (
                                            <button key={i} className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: "16px" }}>{t.i}</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{t.l}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile filter toggle */}
                    <div className="lg:hidden fixed bottom-6 right-6 z-40">
                        <button onClick={() => setShowFilters(!showFilters)}
                            className="w-14 h-14 rounded-full bg-[#3C81C6] text-white shadow-xl shadow-[#3C81C6]/30 flex items-center justify-center active:scale-95 transition-transform">
                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>tune</span>
                        </button>
                    </div>

                    {/* Doctor Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Results count */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-500">
                                {loading ? "Đang tải..." : `Tìm thấy ${doctors.length} bác sĩ`}
                            </p>
                            <select className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30">
                                <option>Sắp xếp: Đánh giá cao</option>
                                <option>Kinh nghiệm nhiều</option>
                                <option>Giá thấp → cao</option>
                                <option>Giá cao → thấp</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl bg-gray-200" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                                            <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                                            <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <span className="material-symbols-outlined text-gray-300 mb-3" style={{ fontSize: "64px" }}>person_search</span>
                                <p className="text-gray-500 text-lg font-medium">Không tìm thấy bác sĩ</p>
                                <p className="text-gray-400 text-sm mt-1 mb-4">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                                <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/10 rounded-xl hover:bg-[#3C81C6]/20 transition-colors">
                                    Xoá bộ lọc
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {doctors.map(doc => (
                                        <DoctorCard
                                            key={doc.id}
                                            id={doc.id}
                                            fullName={doc.fullName}
                                            department={doc.departmentName}
                                            specialization={doc.specialization}
                                            experience={doc.experience}
                                            rating={doc.rating}
                                            avatar={doc.avatar}
                                            available={doc.status === "active"}
                                            fee={doc.qualification}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                            const p = i + 1;
                                            return (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                                                    ${page === p ? "bg-[#3C81C6] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
                                                    {p}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            <PatientFooter />
        </div>
    );
}

export default function DoctorsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" /></div>}>
            <DoctorsPageInner />
        </Suspense>
    );
}
