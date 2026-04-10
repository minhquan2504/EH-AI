import { Skeleton } from "@/components/common/Loading";

export default function ReceptionistLoading() {
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton width="280px" height="28px" rounded="lg" />
                    <Skeleton width="160px" height="14px" />
                </div>
                <Skeleton width="150px" height="40px" rounded="lg" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl p-5 space-y-3">
                        <Skeleton width="100px" height="12px" />
                        <Skeleton width="80px" height="28px" />
                        <Skeleton width="120px" height="12px" />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl p-6 space-y-4">
                <Skeleton width="200px" height="20px" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} width="100%" height="52px" rounded="lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
