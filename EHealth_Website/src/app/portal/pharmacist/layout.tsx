import type { Metadata } from "next";
import { PharmacistSidebar } from "@/components/shared/pharmacist-sidebar";
import { PharmacistHeader } from "@/components/shared/pharmacist-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";

export const metadata: Metadata = {
    title: "Cổng thông tin Dược sĩ - E-Health",
    description: "Hệ thống quản lý y tế số dành cho dược sĩ",
};

export default function PharmacistPortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard allowedRoles={["pharmacist"]}>
            <SidebarProvider>
                <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
                    <PharmacistSidebar />
                    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative">
                        <PharmacistHeader />
                        <div className="flex-1 overflow-y-auto">{children}</div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}
