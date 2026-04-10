"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPatient } from "@/services/patientService";
import { validateName, validatePhone, validateIdNumber, validateBHYT, validateDob, validateEmail } from "@/utils/validation";

export default function NewPatientPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [fd, setFd] = useState({
        name: "", phone: "", cccd: "", dob: "", gender: "Nam",
        email: "", address: "", insurance: "", insuranceExpiry: "",
        emergencyContact: "", emergencyPhone: "",
        bloodType: "", allergies: "", medicalHistory: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFd((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        const nameRes = validateName(fd.name);
        if (!nameRes.valid) errs.name = nameRes.message;
        const phoneRes = validatePhone(fd.phone);
        if (!phoneRes.valid) errs.phone = phoneRes.message;
        if (fd.cccd) {
            const idRes = validateIdNumber(fd.cccd);
            if (!idRes.valid) errs.cccd = idRes.message;
        }
        if (fd.dob) {
            const dobRes = validateDob(fd.dob);
            if (!dobRes.valid) errs.dob = dobRes.message;
        }
        if (fd.email) {
            const emailRes = validateEmail(fd.email);
            if (!emailRes.valid) errs.email = emailRes.message;
        }
        if (fd.insurance) {
            const bhytRes = validateBHYT(fd.insurance);
            if (!bhytRes.valid) errs.insurance = bhytRes.message;
        }
        if (fd.emergencyPhone) {
            const epRes = validatePhone(fd.emergencyPhone);
            if (!epRes.valid) errs.emergencyPhone = epRes.message;
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await createPatient({
                full_name: fd.name,
                date_of_birth: fd.dob || '',
                gender: fd.gender === "Nam" ? "MALE" : "FEMALE",
                identity_type: fd.cccd ? "CCCD" : undefined,
                identity_number: fd.cccd || undefined,
                contact: {
                    phone_number: fd.phone,
                    email: fd.email || undefined,
                    street_address: fd.address || undefined,
                },
            });
            router.push("/portal/receptionist/patients");
        } catch {
            alert("Tiếp nhận bệnh nhân thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/patients" className="hover:text-[#3C81C6]">Bệnh nhân</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tiếp nhận bệnh nhân mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">person_add</span> Tiếp nhận bệnh nhân mới
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span> Thông tin cá nhân</h3>
                        <Inp label="Họ và tên *" name="name" value={fd.name} onChange={handleChange} placeholder="Nguyễn Văn A" error={errors.name} />
                        <Inp label="Số điện thoại *" name="phone" value={fd.phone} onChange={handleChange} placeholder="0901 234 567" error={errors.phone} />
                        <Inp label="CCCD / CMND" name="cccd" value={fd.cccd} onChange={handleChange} placeholder="012345678901" error={errors.cccd} />
                        <Inp label="Ngày sinh" name="dob" type="date" value={fd.dob} onChange={handleChange} error={errors.dob} />
                        <Sel label="Giới tính" name="gender" value={fd.gender} onChange={handleChange} options={["Nam", "Nữ"]} />
                        <Inp label="Email" name="email" value={fd.email} onChange={handleChange} placeholder="email@example.com" error={errors.email} />
                        <div className="col-span-full"><Inp label="Địa chỉ" name="address" value={fd.address} onChange={handleChange} placeholder="Số nhà, đường, phường, quận..." /></div>

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">health_and_safety</span> Bảo hiểm & Y tế</h3>
                        <Inp label="Số BHYT" name="insurance" value={fd.insurance} onChange={handleChange} placeholder="HC4012345678" error={errors.insurance} />
                        <Inp label="Hạn BHYT" name="insuranceExpiry" type="date" value={fd.insuranceExpiry} onChange={handleChange} />
                        <Sel label="Nhóm máu" name="bloodType" value={fd.bloodType} onChange={handleChange} options={["-- Chưa rõ --", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                        <div className="col-span-full"><Inp label="Dị ứng" name="allergies" value={fd.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm... (nếu có)" /></div>
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tiền sử bệnh</label>
                            <textarea name="medicalHistory" value={fd.medicalHistory} onChange={handleChange} rows={2} placeholder="Các bệnh lý đã mắc, thuốc đang dùng..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">emergency</span> Liên hệ khẩn cấp</h3>
                        <Inp label="Người liên hệ" name="emergencyContact" value={fd.emergencyContact} onChange={handleChange} placeholder="Họ tên người thân" />
                        <Inp label="SĐT người thân" name="emergencyPhone" value={fd.emergencyPhone} onChange={handleChange} placeholder="0901 xxx xxx" error={errors.emergencyPhone} />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tiếp nhận</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Inp({ label, name, type = "text", value, onChange, placeholder, error }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; error?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400`} />{error && <p className="text-xs text-red-500 mt-1">{error}</p>}</div>);
}
function Sel({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
}
