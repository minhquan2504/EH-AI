"use client";

import { useState } from "react";
import { EQUIPMENT_LIST, IMG } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function EquipmentSection() {
    const [active, setActive] = useState(0);

    return (
        <section id="equipment" className="py-20 px-6 bg-white" aria-label="Trang thiết bị">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-14">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Cơ sở vật chất</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-3">Trang thiết bị hiện đại bậc nhất</h2>
                    <p className="text-[#687582] max-w-2xl mx-auto">Đầu tư hơn 500 tỷ đồng cho hệ thống máy móc nhập khẩu 100% từ Đức, Nhật, Mỹ — đảm bảo kết quả chẩn đoán chính xác tuyệt đối.</p>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left - Equipment list */}
                    <div className="lg:col-span-2 space-y-3">
                        {EQUIPMENT_LIST.map((eq, i) => (
                            <ScrollReveal key={eq.name} delay={i * 80}>
                                <button onClick={() => setActive(i)}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${active === i
                                        ? "border-[#3C81C6] bg-blue-50/50 shadow-lg shadow-blue-500/10"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${active === i ? "bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8]" : "bg-gray-100"}`}>
                                            <span className={`material-symbols-outlined text-[22px] ${active === i ? "text-white" : "text-gray-500"}`}>{eq.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-[#121417] mb-1">{eq.name}</h3>
                                            <p className="text-sm text-[#687582] leading-relaxed">{eq.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            </ScrollReveal>
                        ))}
                    </div>

                    {/* Right - Image */}
                    <ScrollReveal delay={200} className="lg:col-span-3">
                        <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <SafeImage src={EQUIPMENT_LIST[active]?.img || IMG.equipment} alt={EQUIPMENT_LIST[active]?.name || "Trang thiết bị"} fill className="object-cover transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h3 className="text-xl font-bold text-white mb-1">{EQUIPMENT_LIST[active]?.name}</h3>
                                <p className="text-sm text-white/80">{EQUIPMENT_LIST[active]?.desc}</p>
                            </div>
                        </div>
                        {/* Facility thumbnails */}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                            {[IMG.equipment, IMG.labRoom, IMG.lobby].map((img, i) => (
                                <div key={i} className="relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#3C81C6] transition-all shadow-md">
                                    <SafeImage src={img} alt={`Cơ sở ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}