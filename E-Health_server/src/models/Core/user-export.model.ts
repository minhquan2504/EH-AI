export interface UserExportFilter {
    search?: string;
    role?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';
    fromDate?: string;
    toDate?: string;
}
