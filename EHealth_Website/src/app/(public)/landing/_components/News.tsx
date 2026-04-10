import { NEWS_DATA } from "./data";
import { SafeImage } from "./SafeImage";
import { ScrollReveal } from "./ScrollReveal";

export function NewsSection() {
    return (
        <section id="news" className="py-20 px-6 bg-white" aria-label="Tin tức sức khoẻ">
            <div className="max-w-7xl mx-auto">
                <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <p className="text-sm font-bold text-[#3C81C6] uppercase tracking-widest mb-2">Tin tức & Sức khoẻ</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#121417]">Cập nhật kiến thức y khoa</h2>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#3C81C6] text-[#3C81C6] rounded-xl text-sm font-bold hover:bg-[#3C81C6] hover:text-white transition-all active:scale-95">
                        Xem tất cả <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {NEWS_DATA.map((item, i) => (
                        <ScrollReveal key={item.title} delay={i * 100}>
                            <article className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-pointer">
                                <div className="relative h-52 overflow-hidden">
                                    <SafeImage src={item.img} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#3C81C6] text-[11px] font-bold rounded-full shadow-sm">{item.category}</span>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <p className="text-xs text-[#687582] mb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>{item.date}
                                    </p>
                                    <h3 className="text-base font-bold text-[#121417] mb-2 leading-snug group-hover:text-[#3C81C6] transition-colors line-clamp-2">{item.title}</h3>
                                    <p className="text-sm text-[#687582] leading-relaxed line-clamp-3 flex-1">{item.excerpt}</p>
                                    <div className="flex items-center gap-1 text-[#3C81C6] text-sm font-semibold mt-4 group-hover:gap-2 transition-all">
                                        Đọc tiếp <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </div>
                                </div>
                            </article>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}