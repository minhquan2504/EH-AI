import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "EHealth Hospital — Bệnh viện Đa khoa hàng đầu | Đặt lịch khám online",
    description: "Hệ thống Y tế Thông minh EHealth — Đặt lịch khám online, theo dõi sức khoẻ 24/7, đội ngũ 120+ bác sĩ chuyên khoa. Hotline: (028) 1234 5678.",
    keywords: "bệnh viện, đặt lịch khám, EHealth, y tế thông minh, bác sĩ chuyên khoa, khám bệnh online",
    openGraph: {
        title: "EHealth Hospital — Bệnh viện Đa khoa hàng đầu",
        description: "Đặt lịch khám online, theo dõi sức khoẻ 24/7 — tất cả trong một nền tảng.",
        type: "website",
        locale: "vi_VN",
        siteName: "EHealth Hospital",
        images: [{ url: "/img/general/hero-bg.png", width: 1200, height: 630, alt: "EHealth Hospital" }],
    },
    robots: { index: true, follow: true },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
