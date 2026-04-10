import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const FOOTER_LINKS = {
    services: [
        { label: "Tim mạch", href: `${ROUTES.PUBLIC.SPECIALTIES}#cardiology` },
        { label: "Thần kinh", href: `${ROUTES.PUBLIC.SPECIALTIES}#neurology` },
        { label: "Da liễu", href: `${ROUTES.PUBLIC.SPECIALTIES}#dermatology` },
        { label: "Nhi khoa", href: `${ROUTES.PUBLIC.SPECIALTIES}#pediatrics` },
        { label: "Nhãn khoa", href: `${ROUTES.PUBLIC.SPECIALTIES}#ophthalmology` },
    ],
    quickLinks: [
        { label: "Đặt lịch khám", href: ROUTES.PUBLIC.BOOKING },
        { label: "Tìm bác sĩ", href: ROUTES.PUBLIC.DOCTORS },
        { label: "Chuyên khoa", href: ROUTES.PUBLIC.SPECIALTIES },
        { label: "Liên hệ", href: `${ROUTES.PUBLIC.LANDING}#contact` },
    ],
};

export function PatientFooter() {
    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#2563eb] flex items-center justify-center">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "24px" }}>local_hospital</span>
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white tracking-tight">EHealth</span>
                                <span className="block text-[10px] text-[#60a5fa] font-medium -mt-0.5 tracking-wide">HOSPITAL</span>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-5">Hệ thống Y tế Thông minh — Đặt lịch khám online, theo dõi sức khoẻ 24/7 với đội ngũ 120+ bác sĩ chuyên khoa.</p>
                        <div className="flex items-center gap-3">
                            {["Facebook", "YouTube", "Zalo"].map(s => (
                                <button key={s} className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-[#3C81C6]/20 flex items-center justify-center transition-colors group">
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#60a5fa] transition-colors">{s[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chuyên khoa */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>medical_services</span>
                            Chuyên khoa
                        </h4>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.services.map(l => (
                                <li key={l.label}><Link href={l.href} className="text-sm hover:text-[#60a5fa] transition-colors">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>link</span>
                            Truy cập nhanh
                        </h4>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.quickLinks.map(l => (
                                <li key={l.label}><Link href={l.href} className="text-sm hover:text-[#60a5fa] transition-colors">{l.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>location_on</span>
                            Liên hệ
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-[#60a5fa] mt-0.5" style={{ fontSize: "16px" }}>location_on</span>
                                <span>123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "16px" }}>call</span>
                                <a href="tel:02812345678" className="hover:text-[#60a5fa] transition-colors font-medium">(028) 1234 5678</a>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "16px" }}>mail</span>
                                <a href="mailto:info@ehealth.vn" className="hover:text-[#60a5fa] transition-colors">info@ehealth.vn</a>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-[#60a5fa] mt-0.5" style={{ fontSize: "16px" }}>schedule</span>
                                <div>
                                    <p>T2 — T7: 7:00 — 20:00</p>
                                    <p>CN: Cấp cứu 24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">© 2025 EHealth Hospital. All rights reserved — PTH Group</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <a href="#" className="hover:text-[#60a5fa] transition-colors">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-[#60a5fa] transition-colors">Điều khoản sử dụng</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
