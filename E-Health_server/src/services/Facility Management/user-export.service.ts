import { UserRepository } from '../../repository/Core/user.repository';
import { UserExportFilter } from '../../models/Core/user-export.model';
import * as ExcelJS from 'exceljs';
import { UserDetail } from '../../models/Core/user.model';

export class UserExportService {
    /**
     * Xuất danh sách người dùng ra định dạng Excel
     */
    static async generateUsersExcel(filter: UserExportFilter): Promise<Buffer> {
        const users = await UserRepository.getExportUsers(filter);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'E-Health System';
        workbook.lastModifiedBy = 'E-Health System';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();

        const sheet = workbook.addWorksheet('Danh Sach Nguoi Dung', {
            views: [{ state: 'frozen', ySplit: 1 }]
        });

        // 3. Define columns
        sheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Mã Hệ Thống', key: 'users_id', width: 25 },
            { header: 'Họ Tên', key: 'full_name', width: 25 },
            { header: 'Năm Sinh', key: 'dob', width: 12 },
            { header: 'Giới Tính', key: 'gender', width: 10 },
            { header: 'Số Điện Thoại', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'CCCD/Passport', key: 'identity_card', width: 20 },
            { header: 'Vai Trò', key: 'roles', width: 20 },
            { header: 'Trạng Thái', key: 'status', width: 12 },
            { header: 'Ngày Đăng Ký', key: 'created_at', width: 20 }
        ];

        const headerRow = sheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF007BFF' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Fill Data
        let stt = 1;
        users.forEach((user: UserDetail) => {
            const genderStr = user.profile?.gender === 'MALE' ? 'Nam' :
                (user.profile?.gender === 'FEMALE' ? 'Nữ' :
                    (user.profile?.gender === 'OTHER' ? 'Khác' : 'N/A'));

            const statusStr = user.status === 'ACTIVE' ? 'Hoạt Động' :
                (user.status === 'INACTIVE' ? 'Đã Xóa' :
                    (user.status === 'BANNED' ? 'Khóa' : user.status));

            const dobStr = user.profile?.dob ? new Date(user.profile.dob).toLocaleDateString('vi-VN') : '';
            const createdStr = user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '';

            sheet.addRow({
                stt: stt++,
                users_id: user.users_id,
                full_name: user.profile?.full_name || '',
                dob: dobStr,
                gender: genderStr,
                phone: user.phone || '',
                email: user.email || '',
                identity_card: user.profile?.identity_card_number || '',
                roles: user.roles?.join(', ') || '',
                status: statusStr,
                created_at: createdStr
            });
        });

        sheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            row.eachCell({ includeEmpty: false }, function (cell, colNumber) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // 5. Generate and return Buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any as Buffer;
    }
}
