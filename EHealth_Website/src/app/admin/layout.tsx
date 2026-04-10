import type { Metadata } from "next";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { AdminHeader } from "@/components/shared/admin-header";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PortalShell } from "@/components/shared/portal-shell";

export const metadata: Metadata = {
    title: "E-Health Admin",
    description: "Hệ thống quản trị Y tế Số",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={["admin"]}>
            <SidebarProvider>
                <PortalShell
                    leftSidebar={<AdminSidebar />}
                    header={<AdminHeader />}
                    role="admin"
                >
                    <div className="p-8">
                        <div className="max-w-[1440px] mx-auto space-y-8 pb-10">
                            {children}
                        </div>
                    </div>
                </PortalShell>
            </SidebarProvider>
        </AuthGuard>
    );
}
