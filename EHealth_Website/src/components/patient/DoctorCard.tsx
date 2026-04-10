import Link from "next/link";
import Image from "next/image";

interface DoctorCardProps {
    id: string;
    fullName: string;
    title?: string;
    department: string;
    specialization?: string;
    experience?: number;
    rating?: number;
    reviewCount?: number;
    fee?: string;
    avatar?: string;
    available?: boolean;
    compact?: boolean;
}

export function DoctorCard({ id, fullName, title, department, specialization, experience, rating = 0, reviewCount = 0, fee, avatar, available = true, compact = false }: DoctorCardProps) {
    return (
        <div className={`group bg-white rounded-2xl border border-gray-100 hover:border-[#3C81C6]/20 hover:shadow-xl hover:shadow-[#3C81C6]/[0.06] transition-all duration-300 overflow-hidden ${compact ? "p-4" : "p-5"}`}>
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`relative flex-shrink-0 ${compact ? "w-16 h-16" : "w-20 h-20"} rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50`}>
                    {avatar ? (
                        <Image src={avatar} alt={fullName} fill className="object-cover" sizes="80px" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: compact ? "28px" : "36px" }}>person</span>
                        </div>
                    )}
                    {available !== undefined && (
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white ${available ? "bg-green-500" : "bg-gray-400"}`} />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className={`font-bold text-gray-900 group-hover:text-[#3C81C6] transition-colors truncate ${compact ? "text-sm" : "text-base"}`}>
                                {fullName}
                            </h3>
                            {title && <p className="text-xs text-[#3C81C6] font-medium mt-0.5">{title}</p>}
                        </div>
                        {rating > 0 && (
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "14px" }}>star</span>
                                <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>medical_services</span>
                            {department}
                        </span>
                        {experience && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>work_history</span>
                                {experience} năm
                            </span>
                        )}
                        {reviewCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>rate_review</span>
                                {reviewCount} đánh giá
                            </span>
                        )}
                    </div>

                    {specialization && !compact && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{specialization}</p>
                    )}
                </div>
            </div>

            {/* Bottom actions */}
            {!compact && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        {fee && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span>
                                {fee}
                            </span>
                        )}
                        {available ? (
                            <span className="text-xs text-green-600 font-medium">Đang khám</span>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium">Tạm nghỉ</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/doctors/${id}`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Chi tiết
                        </Link>
                        <Link href={`/booking?doctorId=${id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
                            Đặt lịch
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
