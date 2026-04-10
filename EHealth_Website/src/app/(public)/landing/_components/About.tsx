"use client";

import { useState } from "react";
import { IMG, MILESTONES } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function AboutSection({ scrollTo }: { scrollTo: (id: string) => void }) {
    const [showVideo, setShowVideo] = useState(false);

    return (
        <section id="about" className="py-20 px-6 bg-slate-50" aria-label="Giới thiệu bệnh viện">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
                    <ScrollReveal>
                        <div className="relative">
                            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] relative ring-1 ring-black/5">
                                <SafeImage src={IMG.about} alt="Bệnh viện EHealth" fill className="object-cover" />
                            </div>
                            {/* ISO badge */}
                            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-white text-[28px]">verified</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#121417]">ISO 9001</p>
                                        <p className="text-xs text-[#687582]">Chứng nhận chất lượng</p>
                                    </div>
                                </div>
                            </div>
                            {/* Experience badge */}
                            <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                                <p className="text-3xl font-black text-[#3C81C6]">15<span className="text-base">+</span></p>
                                <p className="text-xs text-[#687582] font-medium">Năm kinh nghiệm</p>
                            </div>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal delay={200}>
                        <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-3">Về chúng tôi</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#121417] mb-6 leading-tight">Bệnh viện Đa khoa<br />hàng đầu Việt Nam</h2>
                        <p className="text-[#4a5568] leading-relaxed mb-4">
                            Với hơn <strong className="text-[#121417]">15 năm kinh nghiệm</strong>, EHealth Hospital tự hào là một trong những bệnh viện đa khoa hàng đầu tại Việt Nam. Chúng tôi không ngừng đầu tư công nghệ hiện đại và phát triển đội ngũ y bác sĩ chuyên môn cao.
                        </p>
                        <p className="text-[#4a5568] leading-relaxed mb-8">
                            Được <strong className="text-[#121417]">JCI quốc tế chứng nhận</strong>, chúng tôi cam kết tiêu chuẩn an toàn và chất lượng điều trị ngang tầm quốc tế.
                        </p>

                        {/* Credential badges */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {[
                                { icon: "verified_user", label: "Bộ Y tế cấp phép", sub: "Giấy phép hành nghề" },
                                { icon: "workspace_premium", label: "JCI Accreditation", sub: "Tiêu chuẩn quốc tế" },
                                { icon: "groups", label: "120+ Bác sĩ", sub: "Chuyên khoa hàng đầu" },
                                { icon: "hotel", label: "300+ Giường bệnh", sub: "Đầy đủ tiện nghi" },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">{item.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#121417]">{item.label}</p>
                                        <p className="text-[10px] text-[#687582]">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => scrollTo("booking")} className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 active:scale-95" aria-label="Đặt lịch khám bệnh">
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>Đặt lịch khám
                        </button>
                    </ScrollReveal>
                </div>

                {/* Video section */}
                <ScrollReveal className="mb-20">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video cursor-pointer group" onClick={() => setShowVideo(true)}>
                        <SafeImage src={IMG.videoThumb} alt="Video giới thiệu EHealth Hospital" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[#3C81C6] text-[40px] ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                            <p className="text-white text-lg font-bold tracking-wide">Xem video giới thiệu bệnh viện</p>
                        </div>
                    </div>
                    {/* Video modal */}
                    {showVideo && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
                            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowVideo(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[32px]">close</span>
                                </button>
                                <video
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                    src="/img/video/Video_Giới_Thiệu_Bệnh_Viện.mp4"
                                >
                                    Trình duyệt của bạn không hỗ trợ phát video.
                                </video>
                            </div>
                        </div>
                    )}
                </ScrollReveal>

                {/* Mission & Vision */}
                <ScrollReveal className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: "visibility", title: "Tầm nhìn", desc: "Trở thành hệ thống y tế thông minh hàng đầu Đông Nam Á, tiên phong ứng dụng AI trong chẩn đoán và điều trị.", color: "from-blue-500 to-indigo-600" },
                            { icon: "flag", title: "Sứ mệnh", desc: "Cung cấp dịch vụ y tế chất lượng cao, tiếp cận dễ dàng, lấy bệnh nhân làm trung tâm với chi phí hợp lý.", color: "from-emerald-500 to-teal-600" },
                            { icon: "diamond", title: "Giá trị cốt lõi", desc: "Tận tâm — Chuyên nghiệp — Đổi mới — Minh bạch. Mỗi bệnh nhân là một người thân trong gia đình.", color: "from-amber-500 to-orange-600" },
                        ].map(item => (
                            <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-white text-[24px]">{item.icon}</span>
                                </div>
                                <h4 className="text-lg font-bold text-[#121417] mb-2">{item.title}</h4>
                                <p className="text-sm text-[#687582] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Milestones timeline */}
                <ScrollReveal>
                    <div className="relative">
                        <h3 className="text-center text-xl font-bold text-[#121417] mb-10">Hành trình phát triển</h3>
                        <div className="hidden md:block absolute top-[68px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#3C81C6]/30 to-transparent" />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {MILESTONES.map((m, i) => (
                                <div key={m.year} className="text-center relative group">
                                    <div className="hidden md:block w-4 h-4 rounded-full bg-[#3C81C6] border-4 border-white shadow-md mx-auto mb-4 group-hover:scale-125 transition-transform" />
                                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                                        <p className="text-xl font-black text-[#3C81C6] mb-1">{m.year}</p>
                                        <p className="text-sm font-bold text-[#121417] mb-1">{m.title}</p>
                                        <p className="text-xs text-[#687582] leading-relaxed">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
