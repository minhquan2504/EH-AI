"use client";

import { useState, useEffect } from "react";
import { TESTIMONIALS } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function TestimonialsSection() {
    const [active, setActive] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setActive(p => (p + 1) % TESTIMONIALS.length), 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="testimonials" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50" aria-label="Đánh giá từ bệnh nhân">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-14">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Phản hồi bệnh nhân</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-3">Bệnh nhân nói gì về chúng tôi?</h2>
                    <p className="text-[#687582] max-w-xl mx-auto">Hơn 12,500 đánh giá tích cực từ bệnh nhân đã tin tưởng sử dụng dịch vụ của EHealth</p>
                </ScrollReveal>
                <ScrollReveal>
                    <div className="max-w-4xl mx-auto">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={t.name} className={`transition-all duration-500 ${i === active ? "block" : "hidden"}`} role="tabpanel" aria-label={`Đánh giá từ ${t.name}`}>
                                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 relative">
                                    {/* Large quote icon */}
                                    <div className="absolute top-6 right-8 text-6xl text-blue-50 font-serif select-none">&ldquo;</div>

                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                        {/* Patient photo */}
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 border-blue-50 relative shadow-lg">
                                                <SafeImage src={t.img} alt={t.name} fill className="object-cover" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-0.5 mb-3">
                                                {[1,2,3,4,5].map(s => <span key={s} className="material-symbols-outlined text-amber-400 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                                            </div>
                                            <p className="text-lg text-[#121417] leading-relaxed mb-6 italic relative z-10">&ldquo;{t.text}&rdquo;</p>
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                <div>
                                                    <p className="text-base font-bold text-[#121417]">{t.name}</p>
                                                    <p className="text-sm text-[#687582]">{t.age} tuổi — Khoa {t.dept}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-green-500 text-[16px]">verified</span>
                                                    <span className="text-xs text-green-600 font-semibold">Bệnh nhân xác thực</span>
                                                </div>
                                                <span className="text-xs text-[#687582] md:ml-auto">{t.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Dots + counter */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <div className="flex gap-2" role="tablist" aria-label="Chọn đánh giá">
                                {TESTIMONIALS.map((_, i) => (
                                    <button key={i} onClick={() => setActive(i)} role="tab" aria-selected={i === active} aria-label={`Đánh giá ${i + 1}`}
                                        className={`h-2 rounded-full transition-all duration-300 ${i === active ? "bg-[#3C81C6] w-10" : "bg-gray-200 w-2 hover:bg-gray-300"}`} />
                                ))}
                            </div>
                            <span className="text-xs text-[#687582] font-medium">{active + 1} / {TESTIMONIALS.length}</span>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
