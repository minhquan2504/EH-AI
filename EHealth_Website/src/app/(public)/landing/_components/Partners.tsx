import { PARTNERS, CERTIFICATIONS } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function PartnersSection() {
    // Double the list for infinite scroll effect
    const doubledPartners = [...PARTNERS, ...PARTNERS];

    return (
        <section className="py-16 px-6 bg-gray-50/50 border-y border-gray-100" aria-label="Đối tác & Chứng nhận">
            <div className="max-w-7xl mx-auto">
                {/* Certifications */}
                <ScrollReveal className="text-center mb-10">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Chứng nhận & Giải thưởng</p>
                    <h3 className="text-2xl font-black text-[#121417] mb-8">Được công nhận bởi các tổ chức uy tín</h3>
                    <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
                        {CERTIFICATIONS.map((cert) => (
                            <div key={cert.name} className="flex flex-col items-center gap-3 group cursor-pointer">
                                <div className="relative w-20 h-20 rounded-2xl bg-gray-50 shadow-lg border border-gray-100 overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                                    <SafeImage src={cert.img} alt={cert.name} fill className="object-contain p-3 mix-blend-multiply" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#121417]">{cert.name}</p>
                                    <p className="text-[10px] text-[#687582]">{cert.desc} &middot; {cert.year}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Partners marquee */}
                <div className="mt-12 pt-10 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className="flex-shrink-0 text-center md:text-left">
                            <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-1">Đối tác bảo hiểm</p>
                            <p className="text-xs text-[#687582]">Chấp nhận BHYT & {PARTNERS.length}+ bảo hiểm tư nhân</p>
                        </div>
                    </div>
                    {/* Auto-scrolling marquee */}
                    <div className="overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50/50 to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50/50 to-transparent z-10" />
                        <div className="flex items-center gap-12 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
                            {doubledPartners.map((p, i) => (
                                <div key={`${p.name}-${i}`} className="relative w-28 h-14 flex-shrink-0 transition-all duration-300 cursor-pointer hover:scale-110">
                                    <SafeImage src={p.img} alt={p.name} fill className="object-contain" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
