import { PROCESS_STEPS } from "./data";
import { ScrollReveal } from "./ScrollReveal";

export function ProcessSteps() {
    return (
        <section className="py-16 px-6 bg-gradient-to-b from-slate-50 to-white" aria-label="Quy trình khám bệnh">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="text-center mb-12">
                    <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Quy trình</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#121417]">4 bước đơn giản</h2>
                </ScrollReveal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PROCESS_STEPS.map((s, i) => (
                        <ScrollReveal key={s.step} delay={i * 100}>
                            <div className="relative text-center group">
                                {i < 3 && <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[#3C81C6]/30 to-transparent" />}
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-white text-[28px]">{s.icon}</span>
                                </div>
                                <span className="text-xs font-black text-[#3C81C6] bg-blue-50 px-3 py-1 rounded-full">Bước {s.step}</span>
                                <h3 className="text-lg font-bold text-[#121417] mt-3 mb-2">{s.title}</h3>
                                <p className="text-sm text-[#687582] leading-relaxed">{s.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
