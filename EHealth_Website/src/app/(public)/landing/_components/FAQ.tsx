"use client";

import { useState } from "react";
import { FAQ_DATA } from "./data";
import { ScrollReveal } from "./ScrollReveal";

export function FAQSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section id="faq" className="py-20 px-6 bg-white" aria-label="Câu hỏi thường gặp">
            <div className="max-w-3xl mx-auto">
                <ScrollReveal className="text-center mb-14">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">FAQ</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-3">Câu hỏi thường gặp</h2>
                    <p className="text-[#687582]">Giải đáp nhanh những thắc mắc phổ biến của bệnh nhân</p>
                </ScrollReveal>
                <div className="space-y-3">
                    {FAQ_DATA.map((item, i) => (
                        <ScrollReveal key={i} delay={i * 60}>
                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                                    aria-expanded={openIdx === i} aria-controls={`faq-answer-${i}`}>
                                    <span className="text-base font-semibold text-[#121417]">{item.q}</span>
                                    <span className={`material-symbols-outlined text-[#3C81C6] text-[22px] transition-transform duration-300 flex-shrink-0 ${openIdx === i ? "rotate-180" : ""}`}>expand_more</span>
                                </button>
                                <div id={`faq-answer-${i}`} className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`} role="region">
                                    <div className="px-6 pb-5">
                                        <p className="text-sm text-[#687582] leading-relaxed">{item.a}</p>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
