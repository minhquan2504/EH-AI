import { Skeleton } from "@/components/common/Loading";

export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Page header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton width="250px" height="32px" rounded="lg" />
                <div className="flex gap-3">
                    <Skeleton width="120px" height="40px" rounded="lg" />
                    <Skeleton width="120px" height="40px" rounded="lg" />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton width="100px" height="14px" />
                            <Skeleton width="40px" height="40px" rounded="lg" />
                        </div>
                        <Skeleton width="140px" height="32px" />
                        <Skeleton width="80px" height="14px" />
                    </div>
                ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl p-6 space-y-4">
                    <Skeleton width="200px" height="24px" />
                    <Skeleton width="100%" height="250px" rounded="lg" />
                </div>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl p-6 space-y-4">
                    <Skeleton width="160px" height="24px" />
                    <Skeleton width="100%" height="250px" rounded="lg" />
                </div>
            </div>
        </div>
    );
}
