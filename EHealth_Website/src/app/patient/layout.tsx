import type { Metadata } from "next";
import { PatientSidebar } from "@/components/shared/patient-sidebar";
import { PatientHeader } from "@/components/shared/patient-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PortalShell } from "@/components/shared/portal-shell";

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
                <PortalShell
                    leftSidebar={<PatientSidebar />}
                    header={<PatientHeader />}
                    role="patient"
                >
                    <div className="p-6">{children}</div>
                </PortalShell>
            </SidebarProvider>
        </AuthGuard>
    );
}
