"use client";

import { useState, useEffect } from "react";
import { getRoles, deleteRole, toggleRoleStatus, getRolePermissions, assignPermissions, createRole } from "@/services/permissionService";


const PERMISSION_GROUPS = [
    { group: "Người dùng", permissions: [{ key: "user.read", label: "Xem" }, { key: "user.write", label: "Sửa" }, { key: "user.delete", label: "Xóa" }] },
    { group: "Bác sĩ", permissions: [{ key: "doctor.read", label: "Xem" }, { key: "doctor.write", label: "Sửa" }, { key: "doctor.delete", label: "Xóa" }] },
    { group: "Bệnh nhân", permissions: [{ key: "patient.read", label: "Xem" }, { key: "patient.write", label: "Sửa" }] },
    { group: "Thuốc", permissions: [{ key: "medicine.read", label: "Xem" }, { key: "medicine.write", label: "Sửa" }, { key: "medicine.delete", label: "Xóa" }] },
    { group: "Đơn thuốc", permissions: [{ key: "prescription.read", label: "Xem" }, { key: "prescription.write", label: "Kê đơn" }] },
    { group: "Khám bệnh", permissions: [{ key: "examination.read", label: "Xem" }, { key: "examination.write", label: "Thực hiện" }] },
    { group: "Lịch hẹn", permissions: [{ key: "appointment.read", label: "Xem" }, { key: "appointment.write", label: "Đặt lịch" }] },
    { group: "Thanh toán", permissions: [{ key: "billing.read", label: "Xem" }, { key: "billing.write", label: "Xử lý" }] },
    { group: "Kho thuốc", permissions: [{ key: "inventory.read", label: "Xem" }, { key: "inventory.write", label: "Nhập/Xuất" }] },
    { group: "Cấp phát", permissions: [{ key: "dispensing.write", label: "Cấp phát" }] },
    { group: "Sinh hiệu", permissions: [{ key: "vital_signs.write", label: "Ghi nhận" }] },
    { group: "Báo cáo", permissions: [{ key: "report.read", label: "Xem" }, { key: "report.export", label: "Xuất" }] },
    { group: "Doanh thu", permissions: [{ key: "revenue.read", label: "Xem" }] },
    { group: "Cài đặt", permissions: [{ key: "settings.write", label: "Thay đổi" }] },
];

interface Role {
    id: string;
    name: string;
    code: string;
    description: string;
    users: number;
    status: string;
    permissions: string[];
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState(false);

    const loadRoles = () => {
        setIsLoading(true);
        getRoles()
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setRoles(data.map((r) => ({
                        id: r.id ?? r.name,
                        name: r.displayName ?? r.name ?? "",
                        code: r.name ?? "",
                        description: r.description ?? "",
                        users: r.userCount ?? 0,
                        status: r.isActive !== false ? "active" : "inactive",
                        permissions: Array.isArray(r.permissions) ? r.permissions : [],
                    })));
                }
            })
            .catch(() => { /* API không khả dụng, hiển thị trống */ })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRole, setNewRole] = useState({ name: "", code: "", description: "" });
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [creatingRole, setCreatingRole] = useState(false);

    const selected = roles.find((r) => r.id === selectedRoleId);
    const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()));

    const handleSelectRole = async (roleId: string) => {
        const role = roles.find((r) => r.id === roleId);
        if (!role) return;
        setSelectedRoleId(roleId);
        setHasChanges(false);
        setSaveSuccess(false);
        // Thử tải permissions từ API
        setLoadingPermissions(true);
        try {
            const res = await getRolePermissions(roleId);
            const perms: string[] = Array.isArray(res?.data) ? res.data.map((p: any) => p.code ?? p.id ?? p) : (Array.isArray(role.permissions) ? role.permissions : []);
            setEditedPermissions(perms);
        } catch {
            setEditedPermissions([...role.permissions]);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleTogglePermission = (permKey: string) => {
        setEditedPermissions((prev) => {
            const updated = prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey];
            return updated;
        });
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSavingPermissions(true);
        try {
            await assignPermissions(selectedRoleId, editedPermissions);
            setRoles((prev) => prev.map((r) => r.id === selectedRoleId ? { ...r, permissions: editedPermissions } : r));
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err: any) {
            alert(err?.message || "Lưu quyền thất bại. Vui lòng thử lại.");
        } finally {
            setSavingPermissions(false);
        }
    };

    const handleCopy = () => {
        if (!selected) return;
        const newRoleCopy: Role = {
            ...selected,
            id: "ROLE_" + Date.now(),
            name: selected.name + " (Bản sao)",
            code: selected.code + "_COPY",
            users: 0,
            permissions: [...editedPermissions],
        };
        setRoles((prev) => [...prev, newRoleCopy]);
        setSelectedRoleId(newRoleCopy.id);
        setEditedPermissions([...newRoleCopy.permissions]);
        setHasChanges(false);
    };

    const handleAddRole = async () => {
        if (!newRole.name.trim() || !newRole.code.trim()) return;
        setCreatingRole(true);
        try {
            const res = await createRole({
                name: newRole.code.toUpperCase(),
                displayName: newRole.name,
                code: newRole.code.toUpperCase(),
                description: newRole.description,
            });
            const newId = (res as any)?.data?.id ?? (res as any)?.id ?? "ROLE_" + Date.now();
            const role: Role = {
                id: newId,
                name: newRole.name,
                code: newRole.code.toUpperCase(),
                description: newRole.description,
                users: 0,
                status: "active",
                permissions: [],
            };
            setRoles((prev) => [...prev, role]);
            setSelectedRoleId(role.id);
            setEditedPermissions([]);
            setShowAddModal(false);
            setNewRole({ name: "", code: "", description: "" });
            setHasChanges(false);
        } catch (err: any) {
            alert(err?.message || "Tạo vai trò thất bại. Vui lòng thử lại.");
        } finally {
            setCreatingRole(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div>
                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>Trang chủ</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span>Người dùng & Phân quyền</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Phân quyền & Vai trò</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Phân quyền & Vai trò</h1>
                        <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">Quản lý vai trò và quyền hạn của từng nhóm người dùng</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/admin/users/roles/new'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Thêm vai trò
                    </button>
                </div>
            </div>

            {/* Main layout — 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái — Danh sách vai trò */}
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e]">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#687582]">search</span>
                            <input type="text" placeholder="Tìm kiếm vai trò..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] text-sm placeholder-[#687582] focus:border-[#3C81C6] focus:ring-1 focus:ring-[#3C81C6]/20 outline-none transition-colors text-[#121417] dark:text-white" />
                        </div>
                    </div>
                    <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8 gap-2 text-[#687582]">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Đang tải...</span>
                            </div>
                        )}
                        {!isLoading && filteredRoles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-[#687582]">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">search_off</span>
                                <p className="text-sm">Không tìm thấy vai trò</p>
                            </div>
                        )}
                        {filteredRoles.map((role) => (
                            <button key={role.id} onClick={() => handleSelectRole(role.id)}
                                className={`w-full px-5 py-4 text-left hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors ${selectedRoleId === role.id ? "bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10 border-l-3 border-[#3C81C6]" : ""}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-[#121417] dark:text-white">{role.name}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                        {role.status === "active" ? "Hoạt Động" : "Ngưng"}
                                    </span>
                                </div>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mb-1.5">{role.description}</p>
                                <div className="flex items-center gap-3 text-[11px] text-[#687582] dark:text-gray-500">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">badge</span> {role.code}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">group</span> {role.users} người</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">key</span> {role.permissions.length} quyền</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cột phải — Ma trận quyền */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    {selected ? (
                        <>
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Quyền hạn: {selected.name}</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">{editedPermissions.length} quyền đang bật</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCopy} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
                                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">content_copy</span>Sao chép
                                    </button>
                                    <button onClick={handleSave} disabled={!hasChanges || savingPermissions}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${saveSuccess ? "bg-green-500 text-white" :
                                            hasChanges && !savingPermissions ? "bg-[#3C81C6] text-white hover:bg-[#2a6da8]" :
                                                "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                            }`}>
                                        {savingPermissions ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[14px]">{saveSuccess ? "check" : "save"}</span>}
                                        {savingPermissions ? "Đang lưu..." : saveSuccess ? "Đã lưu!" : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </div>
                            {loadingPermissions && (
                                <div className="flex items-center justify-center py-8 gap-2 text-[#687582]">
                                    <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Đang tải quyền hạn...</span>
                                </div>
                            )}
                            <div className="overflow-auto max-h-[600px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-[#f6f7f8] dark:bg-[#13191f] z-10">
                                        <tr>
                                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Nhóm chức năng</th>
                                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider">Quyền</th>
                                            <th className="text-center text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider w-20">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                        {PERMISSION_GROUPS.map((g) =>
                                            g.permissions.map((p, pi) => (
                                                <tr key={p.key} className="hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                                    {pi === 0 && (
                                                        <td rowSpan={g.permissions.length} className="px-5 py-3 text-sm font-semibold text-[#121417] dark:text-white border-r border-[#f0f1f3] dark:border-[#2d353e] align-top">
                                                            {g.group}
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-3 text-sm text-[#687582] dark:text-gray-400">{p.label}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer"
                                                                checked={editedPermissions.includes(p.key)}
                                                                onChange={() => handleTogglePermission(p.key)} />
                                                            <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-[#3C81C6] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-[#687582] dark:text-gray-500">
                            <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">admin_panel_settings</span>
                            <p className="text-sm">Chọn một vai trò ở bên trái để xem và chỉnh sửa quyền hạn</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">add_circle</span>
                                Thêm vai trò mới
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên vai trò *</label>
                                <input type="text" value={newRole.name} onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Kỹ thuật viên"
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã vai trò *</label>
                                <input type="text" value={newRole.code} onChange={(e) => setNewRole((p) => ({ ...p, code: e.target.value }))} placeholder="VD: TECHNICIAN"
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white uppercase" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                <textarea value={newRole.description} onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Mô tả vai trò..."
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Hủy</button>
                            <button onClick={handleAddRole} disabled={!newRole.name.trim() || !newRole.code.trim() || creatingRole}
                                className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center gap-2">
                                {creatingRole ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">add</span>}
                                {creatingRole ? "Đang tạo..." : "Tạo vai trò"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
