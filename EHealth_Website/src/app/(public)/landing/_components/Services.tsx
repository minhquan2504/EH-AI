import Link from "next/link";
import { SERVICES } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function ServicesGrid() {
    return (
        <section id="services" className="py-20 px-6 bg-white" aria-label="Dịch vụ y tế">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-14">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Chuyên khoa</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-3">Dịch vụ y tế chất lượng cao</h2>
                    <p className="text-[#687582] max-w-2xl mx-auto">Với đội ngũ hơn 120 bác sĩ chuyên khoa, trang thiết bị nhập khẩu từ Đức, Nhật, chúng tôi cam kết mang đến dịch vụ y tế tốt nhất.</p>
                </ScrollReveal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {SERVICES.map((s, i) => (
                        <ScrollReveal key={s.title} delay={i * 60}>
                            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                                <div className="relative h-44 overflow-hidden">
                                    <SafeImage src={s.img} alt={s.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className={`absolute bottom-3 left-3 w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                                        <span className="material-symbols-outlined text-white text-[20px]">{s.icon}</span>
                                    </div>
                                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-[#3C81C6]">
                                        {s.doctorCount} BS
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="text-base font-bold text-[#121417] mb-1.5">{s.title}</h3>
                                    <p className="text-xs text-[#687582] leading-relaxed mb-3 line-clamp-2">{s.desc}</p>
                                    {/* Feature tags */}
                                    <div className="flex flex-wrap gap-1 mb-3 mt-auto">
                                        {s.features.map(f => (
                                            <span key={f} className="px-2 py-0.5 bg-slate-50 text-[#4a5568] text-[10px] font-medium rounded-md border border-gray-100">{f}</span>
                                        ))}
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        <Link href={`/specialties`}
                                            className="flex-1 flex items-center justify-center gap-1 text-[#3C81C6] text-xs font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                            Tìm hiểu <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                        </Link>
                                        <Link href={`/booking?specialtyName=${encodeURIComponent(s.title)}`}
                                            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white text-xs font-bold py-2 rounded-lg hover:shadow-md transition-all active:scale-95">
                                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                            Đặt lịch
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* View all button */}
                <ScrollReveal className="text-center mt-10">
                    <Link href="/specialties"
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-[#4a5568] rounded-xl text-sm font-bold hover:border-[#3C81C6] hover:text-[#3C81C6] transition-all active:scale-95">
                        Xem tất cả chuyên khoa <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
}
