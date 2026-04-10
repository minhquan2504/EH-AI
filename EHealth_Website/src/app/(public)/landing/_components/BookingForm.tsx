"use client";

import { useState } from "react";
import { SERVICES, IMG } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function BookingForm() {
    const [form, setForm] = useState({ name: "", phone: "", dept: "", date: "", symptoms: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
    const today = new Date().toISOString().split("T")[0];

    const showToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: "" }), 4000);
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
        if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
        else if (!/^(0[0-9]{9,10})$/.test(form.phone.trim())) e.phone = "Số điện thoại không hợp lệ (VD: 0912345678)";
        if (!form.dept) e.dept = "Vui lòng chọn chuyên khoa";
        if (!form.date) e.date = "Vui lòng chọn ngày khám";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        setSubmitting(false);
        setForm({ name: "", phone: "", dept: "", date: "", symptoms: "" });
        setErrors({});
        showToast("✅ Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong 30 phút.");
    };

    const setField = (field: string, value: string) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: "" }));
    };

    return (
        <>
            {/* Toast */}
            {toast.show && (
                <div className="fixed top-20 right-6 z-[100] bg-white rounded-2xl shadow-2xl border border-green-200 p-4 flex items-center gap-3 animate-[slideIn_0.3s_ease-out] max-w-sm" role="alert">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-green-600">check_circle</span></div>
                    <p className="text-sm text-[#121417] font-medium">{toast.msg}</p>
                </div>
            )}

            <section id="booking" className="py-20 px-6 relative overflow-hidden" aria-label="Đặt lịch khám bệnh">
                <div className="absolute inset-0 z-0">
                    <SafeImage src={IMG.ctaBg} alt="CTA background" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#121417]/90 to-[#121417]/70" />
                </div>
                <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <ScrollReveal>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Đặt lịch khám<br />ngay hôm nay</h2>
                        <p className="text-blue-200 mb-8 max-w-md leading-relaxed">Chỉ mất 2 phút để đặt lịch. Chúng tôi sẽ xác nhận lịch hẹn của bạn qua SMS trong vòng 30 phút.</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-white/80">
                            <a href="tel:02812345678" className="flex items-center gap-2 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-[#60a5fa]">call</span>
                                <span className="text-sm font-medium">(028) 1234 5678</span>
                            </a>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px] text-[#60a5fa]">schedule</span>
                                <span className="text-sm font-medium">24/7 Hotline</span>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={200}>
                        <div className="bg-white rounded-3xl p-8 shadow-2xl">
                            <h3 className="text-lg font-bold text-[#121417] mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">event_available</span>Đăng ký khám bệnh
                            </h3>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }} noValidate>
                                <div>
                                    <input type="text" placeholder="Họ và tên *" value={form.name} onChange={e => setField("name", e.target.value)} aria-label="Họ và tên" aria-invalid={!!errors.name}
                                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all ${errors.name ? "border-red-400" : "border-gray-200"}`} />
                                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1" role="alert">{errors.name}</p>}
                                </div>
                                <div>
                                    <input type="tel" placeholder="Số điện thoại *" value={form.phone} onChange={e => setField("phone", e.target.value)} aria-label="Số điện thoại" aria-invalid={!!errors.phone}
                                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all ${errors.phone ? "border-red-400" : "border-gray-200"}`} />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1" role="alert">{errors.phone}</p>}
                                </div>
                                <div>
                                    <select value={form.dept} onChange={e => setField("dept", e.target.value)} aria-label="Chọn chuyên khoa" aria-invalid={!!errors.dept}
                                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all ${form.dept ? "text-[#121417]" : "text-[#687582]"} ${errors.dept ? "border-red-400" : "border-gray-200"}`}>
                                        <option value="">Chọn chuyên khoa *</option>
                                        {SERVICES.map(s => <option key={s.title}>{s.title}</option>)}
                                    </select>
                                    {errors.dept && <p className="text-xs text-red-500 mt-1 ml-1" role="alert">{errors.dept}</p>}
                                </div>
                                <div>
                                    <input type="date" min={today} value={form.date} onChange={e => setField("date", e.target.value)} aria-label="Ngày khám" aria-invalid={!!errors.date}
                                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all ${form.date ? "text-[#121417]" : "text-[#687582]"} ${errors.date ? "border-red-400" : "border-gray-200"}`} />
                                    {errors.date && <p className="text-xs text-red-500 mt-1 ml-1" role="alert">{errors.date}</p>}
                                </div>
                                <textarea placeholder="Mô tả triệu chứng (không bắt buộc)" rows={3} value={form.symptoms} onChange={e => setField("symptoms", e.target.value)} aria-label="Triệu chứng"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none" />
                                <button type="submit" disabled={submitting} aria-label="Gửi yêu cầu đặt lịch"
                                    className="w-full py-4 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:from-[#2a6da8] hover:to-[#1e40af] text-white rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {submitting ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang xử lý...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-[20px]">send</span>Gửi yêu cầu đặt lịch</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </>
    );
}
