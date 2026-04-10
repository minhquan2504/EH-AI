"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function LandingFooter() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const year = new Date().getFullYear();

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        setSubscribed(true); setEmail("");
        setTimeout(() => setSubscribed(false), 3000);
    };

    return (
        <footer id="contact" className="bg-[#0c1220] text-white pt-20 pb-8 px-6" aria-label="Footer">
            {/* CTA Banner */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-500/20">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Cần tư vấn sức khoẻ?</h3>
                        <p className="text-blue-100 text-sm">Đội ngũ bác sĩ của chúng tôi sẵn sàng hỗ trợ bạn 24/7</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <a href="tel:19001234" className="flex items-center gap-2 px-6 py-3.5 bg-white text-[#3C81C6] rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors active:scale-95 shadow-lg">
                            <span className="material-symbols-outlined text-[20px]">call</span>Gọi 1900 1234
                        </a>
                        <a href="#booking" className="flex items-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>Đặt lịch online
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
                {/* Brand - 2 cols */}
                <ScrollReveal className="lg:col-span-2">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-[22px]">local_hospital</span>
                        </div>
                        <div>
                            <span className="text-xl font-black">E<span className="text-[#3C81C6]">Health</span></span>
                            <p className="text-[9px] text-gray-500 tracking-[0.2em] uppercase">Hospital & Clinic</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">Hệ thống Y tế Thông minh — Nền tảng quản lý bệnh viện toàn diện, chăm sóc sức khoẻ thế hệ mới với công nghệ AI tiên tiến.</p>

                    {/* Newsletter */}
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Đăng ký nhận tin sức khoẻ</p>
                        <form onSubmit={handleSubscribe} className="flex gap-2">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email của bạn" aria-label="Email đăng ký nhận tin"
                                className="flex-1 px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-[#3C81C6] transition-colors" />
                            <button type="submit" className="px-5 py-3 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors active:scale-95" aria-label="Đăng ký">
                                {subscribed ? "Đã gửi" : "Đăng ký"}
                            </button>
                        </form>
                        {subscribed && <p className="text-xs text-green-400 mt-2">Đăng ký thành công!</p>}
                    </div>

                    {/* Social icons */}
                    <div className="flex gap-3">
                        {[
                            { label: "Facebook", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, color: "#1877F2" },
                            { label: "YouTube", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>, color: "#FF0000" },
                            { label: "Zalo", icon: <span className="text-sm font-bold">Zalo</span>, color: "#0068FF" },
                            { label: "TikTok", icon: <span className="text-sm font-bold">TT</span>, color: "#000" },
                        ].map(s => (
                            <a key={s.label} href="#" aria-label={s.label} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all" style={{ '--hover-bg': s.color } as any}>
                                {s.icon}
                            </a>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Chuyên khoa */}
                <ScrollReveal delay={100}>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-gray-200">Chuyên khoa</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        {["Tim mạch", "Thần kinh", "Da liễu", "Nhi khoa", "Nhãn khoa", "Chấn thương chỉnh hình", "Sản phụ khoa", "Răng hàm mặt"].map(s => (
                            <li key={s}><a href="#services" className="hover:text-white hover:pl-1 transition-all">{s}</a></li>
                        ))}
                    </ul>
                </ScrollReveal>

                {/* Dịch vụ */}
                <ScrollReveal delay={200}>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-gray-200">Dịch vụ</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        {["Đặt lịch khám", "Khám tổng quát", "Xét nghiệm", "Tư vấn từ xa", "Hồ sơ sức khoẻ", "Nhà thuốc online"].map(s => (
                            <li key={s}><a href="#services" className="hover:text-white hover:pl-1 transition-all">{s}</a></li>
                        ))}
                    </ul>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-4 mt-8 text-gray-200">Hỗ trợ</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        {["Về chúng tôi", "Câu hỏi thường gặp", "Chính sách bảo mật", "Tuyển dụng"].map(s => (
                            <li key={s}><a href="#" className="hover:text-white hover:pl-1 transition-all">{s}</a></li>
                        ))}
                    </ul>
                </ScrollReveal>

                {/* Contact */}
                <ScrollReveal delay={300}>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-5 text-gray-200">Liên hệ</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6] mt-0.5">location_on</span>
                            <span>123 Nguyễn Chí Thanh, Quận 5,<br />TP. Hồ Chí Minh</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">call</span>
                            <a href="tel:02812345678" className="hover:text-white transition-colors">(028) 1234 5678</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-yellow-400">emergency</span>
                            <a href="tel:1900xxxx" className="hover:text-white transition-colors font-bold text-yellow-300">Cấp cứu 24/7: 1900 xxxx</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">mail</span>
                            <a href="mailto:info@ehealth.vn" className="hover:text-white transition-colors">info@ehealth.vn</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">schedule</span>
                            <span>T2-T7: 7:00 — 20:00</span>
                        </li>
                    </ul>

                    {/* Payment methods */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Thanh toán</p>
                        <div className="flex flex-wrap gap-2">
                            {["VISA", "Master", "JCB", "Momo", "VNPay", "ZaloPay"].map(m => (
                                <span key={m} className="px-2.5 py-1 bg-white/5 border border-gray-700 rounded-md text-[10px] text-gray-400 font-medium">{m}</span>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Google Maps */}
            <ScrollReveal>
                <div className="max-w-7xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-800/50">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d106.6597!3d10.7626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ1JzQ1LjQiTiAxMDbCsDM5JzM0LjkiRQ!5e0!3m2!1svi!2svn!4v1!"
                        width="100%" height="220" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Vị trí EHealth Hospital" />
                </div>
            </ScrollReveal>

            {/* Copyright */}
            <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500">© {year} EHealth Hospital. All rights reserved.</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <a href="#" className="hover:text-gray-300 transition-colors">Chính sách bảo mật</a>
                    <span>•</span>
                    <a href="#" className="hover:text-gray-300 transition-colors">Điều khoản sử dụng</a>
                    <span>•</span>
                    <span>Giấy phép: xxx/BYT-GPHĐ</span>
                </div>
            </div>
        </footer>
    );
}
