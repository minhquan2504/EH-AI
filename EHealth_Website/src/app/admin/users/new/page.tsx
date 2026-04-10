"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { createUser } from "@/services/userService";
import { validateName, validatePhone, validateEmail, validateDob, validateIdNumber, validateBHYT } from "@/utils/validation";

const HOSPITALS = [
    { id: "1", name: "E-Health Quận 1" },
    { id: "2", name: "E-Health Quận 7" },
    { id: "3", name: "E-Health Thủ Đức" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NewUserPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: ROLES.STAFF,
        password: "",
        confirmPassword: "",
        gender: "male",
        dateOfBirth: "",
        department: "",
        address: "",
        hospitalId: "",
        // Customer-specific fields
        insuranceNumber: "",
        bloodType: "",
        allergies: "",
        emergencyContact: "",
        emergencyPhone: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const currentRole = formData.role as string;
    const isCustomer = currentRole === ROLES.PATIENT;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const nameRes = validateName(formData.fullName);
        if (!nameRes.valid) newErrors.fullName = nameRes.message;
        const emailRes = validateEmail(formData.email);
        if (!emailRes.valid) newErrors.email = emailRes.message;
        const phoneRes = validatePhone(formData.phone);
        if (!phoneRes.valid) newErrors.phone = phoneRes.message;
        if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
        else if (formData.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        if (formData.dateOfBirth) {
            const dobRes = validateDob(formData.dateOfBirth);
            if (!dobRes.valid) newErrors.dateOfBirth = dobRes.message;
        }
        if (isCustomer) {
            if (formData.insuranceNumber) {
                const bhytRes = validateBHYT(formData.insuranceNumber);
                if (!bhytRes.valid) newErrors.insuranceNumber = bhytRes.message;
            }
            if (formData.emergencyPhone) {
                const epRes = validatePhone(formData.emergencyPhone);
                if (!epRes.valid) newErrors.emergencyPhone = epRes.message;
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await createUser({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phone,
                role: formData.role,
                password: formData.password,
                gender: formData.gender || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                address: formData.address || undefined,
                ...(isCustomer ? {
                    insuranceNumber: formData.insuranceNumber || undefined,
                    bloodType: formData.bloodType || undefined,
                    allergies: formData.allergies || undefined,
                    emergencyContact: formData.emergencyContact || undefined,
                    emergencyPhone: formData.emergencyPhone || undefined,
                } : {
                    department: formData.department || undefined,
                    hospitalId: formData.hospitalId || undefined,
                }),
            });
            router.push("/admin/users");
        } catch {
            alert("Tạo tài khoản thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">Người dùng</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm người dùng mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">person_add</span>
                        Thêm người dùng mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Điền đầy đủ thông tin để tạo tài khoản mới</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vai trò — đặt đầu tiên để toggle fields */}
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">manage_accounts</span>
                                Loại tài khoản
                            </h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Vai trò *</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {Object.entries(ROLES).map(([key, value]) => (
                                    <option key={key} value={value}>{ROLE_LABELS[value as Role]}</option>
                                ))}
                            </select>
                        </div>

                        {isCustomer && (
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">Tài khoản khách hàng/bệnh nhân — các trường y tế sẽ hiện thêm bên dưới.</p>
                                </div>
                            </div>
                        )}

                        {/* Thông tin cá nhân */}
                        <div className="md:col-span-2 pt-2">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span>
                                Thông tin cá nhân
                            </h3>
                        </div>

                        <FormField label="Họ và tên *" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="Nhập họ và tên" icon="person" />
                        <FormField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="example@ehealth.vn" icon="email" />
                        <FormField label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="0901 234 567" icon="phone" />

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>

                        <FormField label="Ngày sinh" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} icon="cake" />
                        <FormField label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} placeholder="Nhập địa chỉ" icon="location_on" />

                        {/* Nhân sự — chỉ hiện khi KHÔNG phải customer */}
                        {!isCustomer && (
                            <>
                                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">domain</span>
                                        Phân công
                                    </h3>
                                </div>
                                <FormField label="Khoa / Phòng ban" name="department" value={formData.department} onChange={handleChange} placeholder="VD: Khoa Nội Tổng Quát" icon="domain" />
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chi nhánh / Cơ sở y tế</label>
                                    <select name="hospitalId" value={formData.hospitalId} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        <option value="">-- Chọn cơ sở --</option>
                                        {HOSPITALS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Customer-specific fields */}
                        {isCustomer && (
                            <>
                                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">medical_information</span>
                                        Thông tin y tế
                                    </h3>
                                </div>
                                <FormField label="Số BHYT" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} placeholder="VD: HS4010..." icon="health_and_safety" />
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nhóm máu</label>
                                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        <option value="">-- Chọn nhóm máu --</option>
                                        {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Dị ứng thuốc</label>
                                    <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Liệt kê các loại thuốc hoặc chất gây dị ứng..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">emergency</span>
                                        Liên hệ khẩn cấp
                                    </h3>
                                </div>
                                <FormField label="Người liên hệ" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Họ tên người thân" icon="person" />
                                <FormField label="SĐT liên hệ" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="0901 234 567" icon="phone" />
                            </>
                        )}

                        {/* Tài khoản */}
                        <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">lock</span>
                                Bảo mật
                            </h3>
                        </div>
                        <FormField label="Mật khẩu *" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Tối thiểu 6 ký tự" icon="lock" />
                        <FormField label="Xác nhận mật khẩu *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu" icon="lock" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">save</span> Tạo tài khoản</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function FormField({ label, name, type = "text", value, onChange, error, placeholder, icon }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string; placeholder?: string; icon?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </span>
                )}
                <input
                    type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 transition-colors`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
