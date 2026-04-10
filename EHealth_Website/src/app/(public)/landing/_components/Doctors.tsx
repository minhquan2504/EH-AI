"use client";

import { useState } from "react";
import Link from "next/link";
import { DOCTORS, SERVICES } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

const DEPT_TABS = ["Tất cả", ...SERVICES.map(s => s.title)];

export function DoctorTeam({ scrollTo }: { scrollTo: (id: string) => void }) {
    const [activeTab, setActiveTab] = useState("Tất cả");

    const filtered = activeTab === "Tất cả" ? DOCTORS : DOCTORS.filter(d => d.dept === activeTab);

    return (
        <section id="doctors" className="py-20 px-6 bg-slate-50" aria-label="Đội ngũ bác sĩ">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-10">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Đội ngũ chuyên gia</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-3">Bác sĩ chuyên khoa hàng đầu</h2>
                    <p className="text-[#687582] max-w-2xl mx-auto">Đội ngũ giáo sư, tiến sĩ, bác sĩ chuyên khoa II với nhiều năm kinh nghiệm trong và ngoài nước.</p>
                </ScrollReveal>

                {/* Department filter tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                    {DEPT_TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab
                                ? "bg-[#3C81C6] text-white shadow-md shadow-blue-200"
                                : "bg-white text-[#687582] border border-gray-200 hover:border-[#3C81C6] hover:text-[#3C81C6]"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map((d, i) => (
                        <ScrollReveal key={d.name} delay={i * 80}>
                            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                <div className="relative h-72 overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
                                    <SafeImage src={d.img} alt={d.name} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                                    {/* Availability badge */}
                                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${d.available
                                        ? "bg-green-100/90 text-green-700"
                                        : "bg-gray-100/90 text-gray-500"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${d.available ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                        {d.available ? "Đang nhận lịch" : "Hết lịch"}
                                    </div>
                                    {/* Department badge */}
                                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-[#3C81C6]">
                                        {d.dept}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-base font-bold text-[#121417]">{d.name}</h3>
                                    <p className="text-sm text-[#3C81C6] font-semibold mt-0.5">{d.title}</p>
                                    <p className="text-xs text-[#687582] mt-1 mb-2">{d.exp}</p>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-0.5">
                                            {[1,2,3,4,5].map(s => (
                                                <span key={s} className="material-symbols-outlined text-amber-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-[#121417]">{d.rating}</span>
                                        <span className="text-[10px] text-[#687582]">({d.reviews})</span>
                                    </div>

                                    {/* Specialties */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {d.specialties.map(s => <span key={s} className="px-2 py-0.5 bg-blue-50 text-[#3C81C6] text-[10px] font-semibold rounded-full">{s}</span>)}
                                    </div>

                                    {/* Fee + CTA */}
                                    <div className="mt-auto pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs text-[#687582]">Phí khám</span>
                                            <span className="text-sm font-bold text-[#121417]">{d.fee}</span>
                                        </div>
                                        <Link href={d.available ? `/booking?doctorName=${encodeURIComponent(d.name)}` : "#"}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${d.available
                                                ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white hover:shadow-lg hover:shadow-blue-200"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"}`}
                                            aria-label={`Đặt lịch khám với ${d.name}`}>
                                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                            {d.available ? "Đặt lịch ngay" : "Hết lịch"}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-[#687582]">
                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                        <p className="text-sm">Chưa có bác sĩ cho chuyên khoa này</p>
                    </div>
                )}

                <ScrollReveal className="text-center mt-10">
                    <Link href="/doctors" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-[#4a5568] rounded-xl text-sm font-bold hover:border-[#3C81C6] hover:text-[#3C81C6] transition-all active:scale-95">
                        Xem tất cả bác sĩ <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
}
