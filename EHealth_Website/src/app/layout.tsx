import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { FloatingChatBox } from "@/components/shared/FloatingChatBox";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
    title: "EHealth — Hệ thống Y tế Số",
    description: "Nền tảng quản lý y tế toàn diện — đặt lịch khám, hồ sơ sức khỏe điện tử, tư vấn từ xa và thanh toán trực tuyến",
    keywords: ["y tế", "đặt lịch khám", "bệnh viện", "telemedicine", "EHR", "EHealth"],
    openGraph: {
        title: "EHealth — Hệ thống Y tế Số",
        description: "Nền tảng quản lý y tế toàn diện",
        locale: "vi_VN",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
                />
            </head>
            <body className="antialiased">
                <ToastProvider>
                    <AuthProvider>
                        {children}
                        <FloatingChatBox />
                    </AuthProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
