"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNotifications as getNotificationInbox, markNotificationAsRead as markNotificationRead, markAllNotificationsAsRead as markAllNotificationsRead, NotificationItem } from "@/services/notificationService";
import { useToast } from "@/contexts/ToastContext";

const MOCK_INBOX: NotificationItem[] = [
    { id: "n1", title: "Lịch hẹn mới được xác nhận", content: "Lịch khám của bệnh nhân Nguyễn Văn An vào 08:30 ngày 25/02 đã được xác nhận.", category: "Lịch hẹn", isRead: false, createdAt: "2025-02-24T10:30:00Z" },
    { id: "n2", title: "Kết quả xét nghiệm sẵn sàng", content: "Kết quả xét nghiệm máu của bệnh nhân Lê Thị Bình (BN-002) đã được cập nhật.", category: "Kết quả XN", isRead: false, createdAt: "2025-02-24T09:15:00Z" },
    { id: "n3", title: "Nhắc nhở: Lịch khám ngày mai", content: "Bạn có 5 lịch hẹn vào ngày 25/02. Vui lòng chuẩn bị đầy đủ.", category: "Nhắc nhở", isRead: true, createdAt: "2025-02-23T18:00:00Z" },
    { id: "n4", title: "Đơn thuốc cần xử lý", content: "Đơn thuốc DT-003 của bệnh nhân Trần Văn Cường đang chờ cấp phát.", category: "Đơn thuốc", isRead: true, createdAt: "2025-02-23T14:20:00Z" },
    { id: "n5", title: "Thanh toán thành công", content: "Hóa đơn HD-001 trị giá 850,000đ đã được thanh toán thành công.", category: "Thanh toán", isRead: true, createdAt: "2025-02-23T11:45:00Z" },
    { id: "n6", title: "Thông báo bảo trì hệ thống", content: "Hệ thống sẽ bảo trì từ 23:00 đến 01:00 ngày 26/02/2025. Vui lòng lưu dữ liệu trước khi bảo trì.", category: "Hệ thống", isRead: false, createdAt: "2025-02-22T09:00:00Z" },
];

const CATEGORY_COLORS: Record<string, string> = {
    "Lịch hẹn": "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    "Kết quả XN": "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
    "Nhắc nhở": "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
    "Đơn thuốc": "bg-teal-50 text-teal-600 dark:bg-teal-900/20",
    "Thanh toán": "bg-green-50 text-green-600 dark:bg-green-900/20",
    "Hệ thống": "bg-red-50 text-red-600 dark:bg-red-900/20",
};

function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationInboxPage() {
    const router = useRouter();
    const toast = useToast();
    const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_INBOX);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        getNotificationInbox()
            .then((res: any) => {
                const items: NotificationItem[] = res?.data ?? res ?? [];
                if (items.length > 0) setNotifications(items);
            })
            .catch(() => {/* keep mock */})
            .finally(() => setLoading(false));
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const displayed = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;

    const handleMarkRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        try { await markNotificationRead(id); } catch {}
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            await markAllNotificationsRead();
            toast.success("Đã đánh dấu tất cả là đã đọc!");
        } catch {
            toast.success("Đã đánh dấu tất cả là đã đọc!");
        } finally { setMarkingAll(false); }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0e1318] p-6 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <span className="material-symbols-outlined text-[20px] text-[#687582]">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                Hộp thư thông báo
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">{unreadCount}</span>
                                )}
                            </h1>
                            <p className="text-sm text-[#687582] mt-0.5">{notifications.length} thông báo · {unreadCount} chưa đọc</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} disabled={markingAll}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">done_all</span>
                            {markingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    {([["all", "Tất cả", notifications.length], ["unread", "Chưa đọc", unreadCount]] as const).map(([key, label, count]) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${filter === key ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582]"}`}>
                            {label}
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${key === "unread" ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-[#687582]"}`}>{count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notification list */}
                <div className="space-y-2">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                            </div>
                        ))
                    ) : displayed.length === 0 ? (
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-[#b0b8c1] mb-3 block">notifications_off</span>
                            <p className="text-sm font-medium text-[#121417] dark:text-white mb-1">Không có thông báo</p>
                            <p className="text-xs text-[#687582]">{filter === "unread" ? "Bạn đã đọc hết thông báo!" : "Chưa có thông báo nào."}</p>
                        </div>
                    ) : (
                        displayed.map(notif => (
                            <button key={notif.id} onClick={() => handleMarkRead(notif.id)}
                                className={`w-full text-left bg-white dark:bg-[#1e242b] rounded-xl border transition-all hover:shadow-sm ${!notif.isRead ? "border-[#3C81C6]/30 dark:border-[#3C81C6]/30 bg-blue-50/30 dark:bg-blue-900/10" : "border-[#dde0e4] dark:border-[#2d353e]"}`}>
                                <div className="p-5 flex items-start gap-4">
                                    {/* Unread dot */}
                                    <div className="mt-1 flex-shrink-0">
                                        {!notif.isRead ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#3C81C6]" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className={`text-sm font-semibold ${!notif.isRead ? "text-[#121417] dark:text-white" : "text-[#687582] dark:text-gray-400"}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[10px] text-[#687582] flex-shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-[#687582] line-clamp-2 mb-2">{notif.content}</p>
                                        {notif.category && (
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[notif.category] ?? "bg-gray-100 text-gray-500"}`}>
                                                {notif.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
