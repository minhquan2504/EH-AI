import type { Metadata } from "next";
import { ReceptionistSidebar } from "@/components/shared/receptionist-sidebar";
import { ReceptionistHeader } from "@/components/shared/receptionist-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";

export const metadata: Metadata = {
    title: "Cổng thông tin Lễ tân - E-Health",
    description: "Hệ thống quản lý y tế số dành cho lễ tân",
};

export default function ReceptionistPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={["receptionist"]}>
            <SidebarProvider>
                <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
                    <ReceptionistSidebar />
                    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative">
                        <ReceptionistHeader />
                        <div className="flex-1 overflow-y-auto">{children}</div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}
