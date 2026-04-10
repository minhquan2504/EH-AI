import Link from "next/link";

interface SpecialtyCardProps {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    doctorCount?: number;
    commonDiseases?: string[];
}

const DEFAULT_COLORS = [
    "from-red-500 to-rose-600",
    "from-violet-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-green-600",
    "from-pink-500 to-rose-600",
    "from-sky-500 to-blue-600",
];

const DEFAULT_ICONS = ["cardiology", "neurology", "dermatology", "child_care", "visibility", "dentistry", "orthopedics", "pregnant_woman"];

export function SpecialtyCard({ id, name, description, icon, color, doctorCount, commonDiseases }: SpecialtyCardProps) {
    const idx = Math.abs(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % DEFAULT_COLORS.length;
    const bgColor = color || DEFAULT_COLORS[idx];
    const displayIcon = icon || DEFAULT_ICONS[idx] || "medical_services";

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl hover:shadow-black/[0.06] p-6 transition-all duration-300 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${bgColor} opacity-[0.08] rounded-full blur-xl group-hover:opacity-[0.15] transition-opacity`} />

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColor} flex items-center justify-center mb-4 shadow-lg shadow-black/[0.08] group-hover:scale-105 transition-transform`}>
                <span className="material-symbols-outlined text-white" style={{ fontSize: "28px" }}>{displayIcon}</span>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-[#3C81C6] transition-colors">{name}</h3>
            {description && <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{description}</p>}

            {/* Doctor count */}
            {doctorCount !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>group</span>
                    <span>{doctorCount} bác sĩ chuyên khoa</span>
                </div>
            )}

            {/* Common diseases */}
            {commonDiseases && commonDiseases.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {commonDiseases.slice(0, 3).map(d => (
                        <span key={d} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[11px] rounded-md font-medium">{d}</span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                <Link href={id ? `/doctors?specialtyId=${id}` : "/doctors"}
                    className="flex-1 text-center py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Xem bác sĩ
                </Link>
                <Link href={id ? `/booking?specialtyId=${id}` : "/booking"}
                    className="flex-1 text-center py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
                    Đặt lịch
                </Link>
            </div>
        </div>
    );
}
