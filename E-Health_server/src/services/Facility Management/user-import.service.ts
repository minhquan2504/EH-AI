import { UserImportRow, ImportValidationResult, ImportError } from '../../models/Core/user-import.model';
import { UserRepository } from '../../repository/Core/user.repository';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export class UserImportService {
    /**
     * Parse nội dung file đính kèm thành JSON Object arrays 
     */
    static parseFileContent(buffer: Buffer, mimeType: string, originalName: string): any[] {
        const isExcel = mimeType.includes('excel') || mimeType.includes('spreadsheetml') || originalName.endsWith('.xlsx') || originalName.endsWith('.xls');
        const isCsv = mimeType.includes('csv') || originalName.endsWith('.csv');

        if (isExcel) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetNames = workbook.SheetNames;
            if (sheetNames.length === 0) throw new Error("File Excel không có trang tính bên trong.");
            return xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
        }

        if (isCsv) {
            const records = parse(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
            return records;
        }

        throw new Error("Định dạng file không được hỗ trợ. Vui lòng upload file CSV hoặc Excel.");
    }

    /**
     * Validate Import Dữ liệu
     */
    static async validateImport(buffer: Buffer, mimeType: string, originalName: string): Promise<ImportValidationResult> {
        const rawData = this.parseFileContent(buffer, mimeType, originalName);

        const result: ImportValidationResult = {
            total_rows: rawData.length,
            valid_count: 0,
            invalid_count: 0,
            valid_rows: [],
            errors: []
        };

        if (rawData.length === 0) {
            throw new Error("File không có dữ liệu nào.");
        }

        const existingRecords = await UserRepository.getAllEmailsAndPhones();
        const existingEmails = new Set(existingRecords.filter(r => r.email).map(r => r.email?.toLowerCase()));
        const existingPhones = new Set(existingRecords.filter(r => r.phone).map(r => r.phone));

        const fileEmails = new Set<string>();
        const filePhones = new Set<string>();

        let rowIndex = 1;
        for (const row of rawData) {
            rowIndex++;
            const email = (row['email'] || row['Email'])?.toString().trim() || null;
            const phone = (row['phone'] || row['Phone'] || row['SĐT'])?.toString().trim() || null;
            const full_name = (row['full_name'] || row['Full Name'] || row['Họ Tên'])?.toString().trim() || null;

            const dob = (row['dob'] || row['Date of Birth'])?.toString().trim() || null;
            let gender = (row['gender'] || row['Gender'] || row['Giới tính'])?.toString().trim().toUpperCase() || null;
            const address = (row['address'] || row['Address'] || row['Địa chỉ'])?.toString().trim() || null;
            const identity = (row['identity_card_number'] || row['CCCD/CMND'])?.toString().trim() || null;

            let rawRoles = row['roles'] || row['Roles'] || row['Vai trò'];
            const roles: string[] = [];
            if (rawRoles) {
                if (typeof rawRoles === 'string') {
                    roles.push(...rawRoles.split(',').map(r => r.trim().toUpperCase()));
                } else if (Array.isArray(rawRoles)) {
                    roles.push(...rawRoles.map(r => String(r).trim().toUpperCase()));
                }
            }

            const rowErrors: string[] = [];

            // Require email or phone
            if (!email && !phone) {
                rowErrors.push("Bắt buộc phải có Email hoặc Số điện thoại.");
            }
            if (!full_name) {
                rowErrors.push("Họ tên không được để trống.");
            }

            // Validations email
            if (email) {
                const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                if (!emailRegex.test(email)) rowErrors.push("Email sai định dạng.");
                else if (existingEmails.has(email.toLowerCase())) rowErrors.push("Email đã tồn tại trên hệ thống.");
                else if (fileEmails.has(email.toLowerCase())) rowErrors.push("Email bị trùng lặp bên trong file.");
                fileEmails.add(email.toLowerCase());
            }

            // Validations phone
            if (phone) {
                const phoneRegex = /^0\d{9}$/;
                if (!phoneRegex.test(phone)) rowErrors.push("SĐT sai định dạng (Yêu cầu 10 số bắt đầu bằng 0).");
                else if (existingPhones.has(phone)) rowErrors.push("SĐT đã tồn tại trên hệ thống.");
                else if (filePhones.has(phone)) rowErrors.push("SĐT bị trùng lặp bên trong file.");
                filePhones.add(phone);
            }

            // Gender normalizer
            if (gender) {
                if (gender === 'NAM') gender = 'MALE';
                else if (gender === 'NỮ') gender = 'FEMALE';
                else if (gender === 'KHÁC') gender = 'OTHER';

                if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
                    rowErrors.push("Giới tính phải là MALE, FEMALE hoặc OTHER (hoặc NAM, NỮ, KHÁC).");
                }
            }

            if (rowErrors.length > 0) {
                result.errors.push({
                    row: rowIndex,
                    email,
                    phone,
                    name: full_name,
                    errors: rowErrors
                });
                result.invalid_count++;
            } else {
                result.valid_rows.push({
                    email,
                    phone,
                    full_name,
                    dob,
                    gender: gender as any,
                    address,
                    identity_card_number: identity,
                    roles: roles.length > 0 ? roles : undefined
                });
                result.valid_count++;
            }
        }

        return result;
    }

    /**
     * Thực thi insert dữ liệu vào database
     */
    static async executeImport(
        buffer: Buffer,
        mimeType: string,
        originalName: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<ImportValidationResult> {
        // validation
        const validationResult = await this.validateImport(buffer, mimeType, originalName);

        if (validationResult.valid_count === 0) {
            throw new Error("Không có dữ liệu hợp lệ nào để import.");
        }

        const generateRandomPassword = () => {
            return randomUUID().substring(0, 8);
        };

        // insert format
        const usersToInsert = await Promise.all(validationResult.valid_rows.map(async row => {
            const userId = `USR_${Date.now()}_${randomUUID().substring(0, 8)}`;
            const rawPassword = generateRandomPassword();
            const passwordHash = await bcrypt.hash(rawPassword, 10);

            row.password = rawPassword;

            return {
                users_id: userId,
                email: row.email || null,
                phone: row.phone || null,
                password_hash: passwordHash,
                full_name: row.full_name,
                dob: row.dob || null,
                gender: row.gender || null,
                identity_card_number: row.identity_card_number || null,
                address: row.address || null,
                roles: row.roles || []
            };
        }));

        const insertedCount = await UserRepository.batchInsertUsers(usersToInsert, adminId, ipAddress, userAgent);

        return validationResult;
    }
}
