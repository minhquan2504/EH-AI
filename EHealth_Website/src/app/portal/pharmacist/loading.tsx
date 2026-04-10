import { Skeleton } from "@/components/common/Loading";

export default function PharmacistLoading() {
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton width="250px" height="28px" rounded="lg" />
                <div className="flex gap-3">
                    <Skeleton width="100px" height="36px" rounded="lg" />
                    <Skeleton width="100px" height="36px" rounded="lg" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl p-5 space-y-3">
                        <Skeleton width="100px" height="12px" />
                        <Skeleton width="80px" height="28px" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl p-6 space-y-4">
                <Skeleton width="160px" height="20px" />
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} width="100%" height="48px" rounded="lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
