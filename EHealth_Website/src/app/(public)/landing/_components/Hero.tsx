"use client";

import { useState, useEffect, useCallback } from "react";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";
import { IMG, DOCTORS, HERO_SLIDES } from "./data";

export function HeroSection({ scrollTo }: { scrollTo: (id: string) => void }) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), []);

    useEffect(() => {
        if (paused) return;
        const t = setInterval(next, 5000);
        return () => clearInterval(t);
    }, [paused, next]);

    const slide = HERO_SLIDES[current];

    return (
        <section className="relative min-h-[92vh] flex items-center overflow-hidden" aria-label="Hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {/* Background slides */}
            {HERO_SLIDES.map((s, i) => (
                <div key={i} className={`absolute inset-0 z-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}>
                    <SafeImage src={s.img} alt={s.title} fill className="object-cover" />
                </div>
            ))}
            {/* Fallback to heroBg if slide images don't exist yet */}
            <div className="absolute inset-0 z-[1]">
                <SafeImage src={IMG.heroBg} alt="EHealth Hospital" fill className="object-cover" />
            </div>
            {/* Overlays */}
            <div className="absolute inset-0 z-[2] bg-gradient-to-r from-white via-white/97 to-white/30" />
            <div className="absolute inset-0 z-[2] bg-gradient-to-b from-white/30 via-transparent to-white/50" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <ScrollReveal>
                    {/* Trust badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#3C81C6] rounded-full text-xs font-bold mb-6 border border-blue-100 shadow-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Bệnh viện đạt chuẩn JCI quốc tế
                    </div>

                    {/* Dynamic headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-[#121417] leading-[1.08] mb-6 tracking-tight">
                        {slide.title}<br />
                        <span className="bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] bg-clip-text text-transparent">{slide.highlight}</span><br />
                        {slide.subtitle}
                    </h1>
                    <p className="text-lg text-[#4a5568] mb-8 max-w-lg leading-relaxed">{slide.desc}</p>

                    {/* CTA buttons */}
                    <div className="flex flex-wrap items-center gap-4 mb-10">
                        <a href="/booking" className="px-8 py-4 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:from-[#2a6da8] hover:to-[#1e40af] text-white rounded-2xl text-base font-bold transition-all hover:-translate-y-1 shadow-xl shadow-blue-500/30 flex items-center gap-2.5 active:scale-95" aria-label="Đặt lịch khám ngay">
                            <span className="material-symbols-outlined text-[22px]">calendar_month</span>Đặt lịch khám ngay
                        </a>
                        <a href="tel:19001234" className="px-8 py-4 bg-white border-2 border-gray-200 text-[#121417] rounded-2xl text-base font-bold hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2.5 shadow-sm active:scale-95 group">
                            <span className="material-symbols-outlined text-[22px] text-green-500 group-hover:animate-bounce">call</span>Hotline: 1900 1234
                        </a>
                    </div>

                    {/* Slide indicators */}
                    <div className="flex items-center gap-2 mb-8">
                        {HERO_SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-[#3C81C6]" : "w-3 bg-gray-300 hover:bg-gray-400"}`} aria-label={`Slide ${i + 1}`} />
                        ))}
                        <span className="ml-3 text-[10px] text-[#687582]">{String(current + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}</span>
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex -space-x-3">
                            {DOCTORS.slice(0, 4).map((d, i) => (
                                <div key={i} className="relative w-11 h-11 rounded-full border-[3px] border-white shadow-md overflow-hidden" style={{ zIndex: 4 - i }}>
                                    <SafeImage src={d.img} alt={d.name} fill className="object-cover" />
                                </div>
                            ))}
                            <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-md bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold">+{DOCTORS.length > 4 ? 116 : "+"}</div>
                        </div>
                        <div className="border-l-2 border-gray-200 pl-6">
                            <div className="flex items-center gap-1 mb-0.5">
                                {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-amber-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                                <span className="text-sm font-bold text-[#121417] ml-1">4.9/5</span>
                            </div>
                            <p className="text-xs text-[#687582]">Từ 12,500+ đánh giá bệnh nhân</p>
                        </div>
                    </div>

                    {/* Trust row */}
                    <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-100 flex-wrap">
                        {[
                            { icon: "verified", label: "ISO 9001", sub: "Chứng nhận quốc tế" },
                            { icon: "workspace_premium", label: "JCI", sub: "Accreditation" },
                            { icon: "shield", label: "BHYT", sub: "Chấp nhận mọi loại" },
                        ].map(b => (
                            <div key={b.label} className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">{b.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#121417]">{b.label}</p>
                                    <p className="text-[10px] text-[#687582]">{b.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Right side - Doctor image with floating cards */}
                <ScrollReveal delay={200} className="relative hidden lg:block">
                    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                        <SafeImage src={IMG.hero} alt="Bác sĩ EHealth" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#3C81C6]/20 to-transparent" />
                    </div>
                    {/* Floating card - Appointment */}
                    <div className="absolute -top-4 -left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100 animate-[float_3s_ease-in-out_infinite]">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><span className="material-symbols-outlined text-green-600 text-[24px]">check_circle</span></div>
                        <div><p className="text-sm font-bold text-[#121417]">Lịch hẹn đã xác nhận</p><p className="text-xs text-[#687582]">BS. Trần Minh — 09:00</p></div>
                    </div>
                    {/* Floating card - Stats */}
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-[float_3.5s_ease-in-out_infinite_0.5s]">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><span className="material-symbols-outlined text-amber-600 text-[24px]">trending_up</span></div>
                            <div>
                                <p className="text-xs text-[#687582]">Bệnh nhân hôm nay</p>
                                <p className="text-xl font-black text-[#121417]">247 <span className="text-xs text-green-500 font-semibold">+12%</span></p>
                            </div>
                        </div>
                    </div>
                    {/* Floating card - Lab results */}
                    <div className="absolute -bottom-4 -right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100 animate-[float_4s_ease-in-out_infinite_1s]">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><span className="material-symbols-outlined text-blue-600 text-[24px]">lab_profile</span></div>
                        <div><p className="text-sm font-bold text-[#121417]">Kết quả xét nghiệm</p><p className="text-xs text-green-600 font-medium">Tất cả chỉ số bình thường</p></div>
                    </div>
                    {/* Floating card - AI */}
                    <div className="absolute top-1/3 -right-10 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 animate-[float_4s_ease-in-out_infinite_1.5s]">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center"><span className="material-symbols-outlined text-violet-600">smart_toy</span></div>
                            <div><p className="text-xs font-bold text-[#121417]">AI Hỗ trợ chẩn đoán</p><p className="text-[10px] text-green-600">Online 24/7</p></div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
