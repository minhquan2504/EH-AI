export function TopBar() {
    return (
        <div className="bg-gradient-to-r from-[#0c2d5e] to-[#1a4a8a] text-white text-xs hidden md:block">
            <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <a href="tel:02812345678" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        <span>(028) 1234 5678</span>
                    </a>
                    <span className="w-px h-4 bg-white/20" />
                    <a href="tel:1900xxxx" className="flex items-center gap-1.5 text-yellow-300 font-bold hover:text-yellow-200 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">emergency</span>
                        <span>Cấp cứu 24/7: 1900 xxxx</span>
                    </a>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="flex items-center gap-1.5 text-white/70">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        T2-T7: 7:00 — 20:00
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="mailto:info@ehealth.vn" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        info@ehealth.vn
                    </a>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="flex items-center gap-1.5 text-white/70">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        123 Nguyễn Chí Thanh, Q.5, TP.HCM
                    </span>
                </div>
            </div>
        </div>
    );
}