const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    PENDING: { label: "Chờ xác nhận", bg: "bg-amber-50", text: "text-amber-700", icon: "hourglass_top" },
    CONFIRMED: { label: "Đã xác nhận", bg: "bg-blue-50", text: "text-blue-700", icon: "check_circle" },
    WAITING: { label: "Đang chờ khám", bg: "bg-cyan-50", text: "text-cyan-700", icon: "groups" },
    EXAMINING: { label: "Đang khám", bg: "bg-purple-50", text: "text-purple-700", icon: "stethoscope" },
    COMPLETED: { label: "Đã khám", bg: "bg-green-50", text: "text-green-700", icon: "task_alt" },
    CANCELLED: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-600", icon: "cancel" },
    PAID: { label: "Đã thanh toán", bg: "bg-emerald-50", text: "text-emerald-700", icon: "paid" },
};

interface AppointmentStatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

export function AppointmentStatusBadge({ status, size = "sm" }: AppointmentStatusBadgeProps) {
    const config = STATUS_CONFIG[status.toUpperCase()] || STATUS_CONFIG.PENDING;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg font-medium
            ${config.bg} ${config.text}
            ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}>
            <span className="material-symbols-outlined" style={{ fontSize: size === "sm" ? "14px" : "16px" }}>{config.icon}</span>
            {config.label}
        </span>
    );
}
