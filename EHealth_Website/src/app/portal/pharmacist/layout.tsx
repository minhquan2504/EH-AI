import type { Metadata } from "next";
import { PharmacistSidebar } from "@/components/shared/pharmacist-sidebar";
import { PharmacistHeader } from "@/components/shared/pharmacist-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PortalShell } from "@/components/shared/portal-shell";

export const metadata: Metadata = {
    title: "Cổng thông tin Dược sĩ - E-Health",
    description: "Hệ thống quản lý y tế số dành cho dược sĩ",
};

export default function PharmacistPortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard allowedRoles={["pharmacist"]}>
            <SidebarProvider>
                <PortalShell
                    leftSidebar={<PharmacistSidebar />}
                    header={<PharmacistHeader />}
                    role="pharmacist"
                >
                    {children}
                </PortalShell>
            </SidebarProvider>
        </AuthGuard>
    );
}
