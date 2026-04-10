import type { Metadata } from "next";
import { PatientSidebar } from "@/components/shared/patient-sidebar";
import { PatientHeader } from "@/components/shared/patient-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";

export const metadata: Metadata = {
    title: "Cổng bệnh nhân - EHealth",
    description: "Hệ thống quản lý y tế số dành cho bệnh nhân",
};

export default function PatientPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={["patient"]}>
            <SidebarProvider>
                <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
                    <PatientSidebar />
                    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative">
                        <PatientHeader />
                        <div className="flex-1 overflow-y-auto p-6">{children}</div>
                    </main>
                </div>
            </SidebarProvider>
        </AuthGuard>
    );
}
