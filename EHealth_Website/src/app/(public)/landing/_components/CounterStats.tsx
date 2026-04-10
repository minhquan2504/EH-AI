"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTER_STATS } from "./data";
import { ScrollReveal } from "./ScrollReveal";

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !started.current) {
                started.current = true;
                const steps = 60; const inc = target / steps; let cur = 0;
                const timer = setInterval(() => { cur += inc; if (cur >= target) { setCount(target); clearInterval(timer); } else setCount(Math.floor(cur)); }, 2000 / steps);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);
    return <div ref={ref} className="text-4xl md:text-5xl font-black text-white leading-none">{count.toLocaleString("vi-VN")}{suffix}</div>;
}

export function CounterStats() {
    return (
        <section className="py-16 px-6 bg-gradient-to-r from-[#121417] to-[#1e293b] relative overflow-hidden" aria-label="Thống kê">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(60,129,198,0.15),transparent_60%)]" />
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {COUNTER_STATS.map((s, i) => (
                    <ScrollReveal key={s.label} delay={i * 100} className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
                            <span className="material-symbols-outlined text-[#60a5fa] text-[28px]">{s.icon}</span>
                        </div>
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                        <p className="text-sm text-gray-300 mt-2 font-bold">{s.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.detail}</p>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    );
}
