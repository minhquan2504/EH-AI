import type { Metadata } from "next";
import { ReceptionistSidebar } from "@/components/shared/receptionist-sidebar";
import { ReceptionistHeader } from "@/components/shared/receptionist-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PortalShell } from "@/components/shared/portal-shell";

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
                <PortalShell
                    leftSidebar={<ReceptionistSidebar />}
                    header={<ReceptionistHeader />}
                    role="receptionist"
                >
                    {children}
                </PortalShell>
            </SidebarProvider>
        </AuthGuard>
    );
}
