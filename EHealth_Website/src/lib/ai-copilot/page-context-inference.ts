/**
 * Infer semantic page key from URL pathname.
 * Used as fallback when pages don't explicitly push context.
 */
export function inferPageFromPathname(pathname: string): string {
    // Doctor
    if (pathname.includes('/examination')) return 'examination';
    if (pathname.includes('/prescriptions/new')) return 'prescriptions.new';
    if (pathname.includes('/prescriptions')) return 'prescriptions';
    if (pathname.includes('/queue')) return 'queue';
    if (pathname.includes('/appointments')) return 'appointments';
    if (pathname.includes('/medical-records')) return 'medical-records';
    if (pathname.includes('/ai-assistant')) return 'ai-assistant';
    if (pathname.includes('/telemedicine')) return 'telemedicine';

    // Pharmacist
    if (pathname.includes('/dispensing')) return 'dispensing';
    if (pathname.includes('/inventory')) return 'inventory';

    // Receptionist
    if (pathname.includes('/reception')) return 'reception';
    if (pathname.includes('/billing')) return 'billing';
    if (pathname.includes('/patients')) return 'patients';

    // Patient
    if (pathname.includes('/health-records')) return 'health-records';
    if (pathname.includes('/medication-reminders')) return 'medication-reminders';
    if (pathname.includes('/ai-consult')) return 'ai-consult';
    if (pathname.includes('/patient-profiles')) return 'patient-profiles';

    // Admin
    if (pathname.includes('/statistics')) return 'statistics';
    if (pathname.includes('/activity-logs')) return 'activity-logs';
    if (pathname.includes('/users')) return 'users';
    if (pathname.includes('/departments')) return 'departments';
    if (pathname.includes('/medicines')) return 'medicines';
    if (pathname.includes('/hospitals')) return 'hospitals';
    if (pathname.includes('/schedules')) return 'schedules';
    if (pathname.includes('/doctors')) return 'doctors';

    // Settings (all portals)
    if (pathname.includes('/settings')) return 'settings';

    // Dashboard (any portal root)
    if (pathname.match(/\/(doctor|pharmacist|receptionist|patient|admin)\/?$/)) return 'dashboard';

    return 'unknown';
}

/** Get a Vietnamese label for a page key */
export function getPageLabel(pageKey: string): string {
    const labels: Record<string, string> = {
        dashboard: 'Trang chủ',
        examination: 'Khám bệnh',
        'prescriptions.new': 'Kê đơn mới',
        prescriptions: 'Đơn thuốc',
        queue: 'Hàng đợi',
        appointments: 'Lịch hẹn',
        'medical-records': 'Hồ sơ bệnh án',
        'ai-assistant': 'AI Assistant',
        telemedicine: 'Telemedicine',
        dispensing: 'Cấp phát thuốc',
        inventory: 'Tồn kho',
        reception: 'Tiếp nhận',
        billing: 'Thanh toán',
        patients: 'Bệnh nhân',
        'health-records': 'Sổ sức khỏe',
        'medication-reminders': 'Nhắc thuốc',
        'ai-consult': 'Tư vấn AI',
        statistics: 'Thống kê',
        'activity-logs': 'Nhật ký',
        settings: 'Cài đặt',
        users: 'Người dùng',
        departments: 'Khoa/Phòng',
        medicines: 'Thuốc',
    };
    return labels[pageKey] || pageKey;
}
