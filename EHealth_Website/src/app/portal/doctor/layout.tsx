import type { Metadata } from "next";
import { DoctorSidebar } from "@/components/shared/doctor-sidebar";
import { DoctorHeader } from "@/components/shared/doctor-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PortalShell } from "@/components/shared/portal-shell";

export const metadata: Metadata = {
    title: "Cổng thông tin Bác sĩ - E-Health",
    description: "Hệ thống quản lý y tế số dành cho bác sĩ",
};

export default function DoctorPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={["doctor"]}>
            <SidebarProvider>
                <PortalShell
                    leftSidebar={<DoctorSidebar />}
                    header={<DoctorHeader />}
                    role="doctor"
                >
                    {children}
                </PortalShell>
            </SidebarProvider>
        </AuthGuard>
    );
}
