"use client";

import { useState, useEffect } from "react";
import { TopBar } from "./_components/TopBar";
import { LandingNavbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { PartnersSection } from "./_components/Partners";
import { ProcessSteps } from "./_components/ProcessSteps";
import { ServicesGrid } from "./_components/Services";
import { AboutSection } from "./_components/About";
import { CounterStats } from "./_components/CounterStats";
import { DoctorTeam } from "./_components/Doctors";
import { EquipmentSection } from "./_components/Equipment";
import { TestimonialsSection } from "./_components/Testimonials";
import { NewsSection } from "./_components/News";
import { BookingForm } from "./_components/BookingForm";
import { FAQSection } from "./_components/FAQ";
import { LandingFooter } from "./_components/Footer";

export default function LandingPage() {
    const [activeSection, setActiveSection] = useState("");
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
            const sections = ["services", "about", "doctors", "equipment", "testimonials", "news", "faq", "booking", "contact"];
            for (const id of [...sections].reverse()) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 120) { setActiveSection(id); return; }
            }
            setActiveSection("");
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden scroll-smooth">
            <TopBar />
            <LandingNavbar activeSection={activeSection} scrollTo={scrollTo} />
            <HeroSection scrollTo={scrollTo} />
            <PartnersSection />
            <ProcessSteps />
            <ServicesGrid />
            <AboutSection scrollTo={scrollTo} />
            <CounterStats />
            <DoctorTeam scrollTo={scrollTo} />
            <EquipmentSection />
            <TestimonialsSection />
            <NewsSection />
            <BookingForm />
            <FAQSection />
            <LandingFooter />

            {/* Scroll to top */}
            {showScrollTop && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Lên đầu trang"
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#3C81C6] hover:bg-[#2a6da8] text-white shadow-xl flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95">
                    <span className="material-symbols-outlined">keyboard_arrow_up</span>
                </button>
            )}

            {/* Floating hotline */}
            <a href="tel:02812345678" aria-label="Gọi hotline" className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white shadow-xl rounded-full transition-all hover:-translate-y-1 group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-[26px]">call</span>
                </div>
                <span className="pr-5 text-sm font-bold hidden sm:inline-block">1900 1234</span>
            </a>

            {/* Global keyframes */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
