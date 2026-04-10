import { DoctorRepository } from '../../repository/Facility Management/doctor.repository';
import { StaffRepository } from '../../repository/Facility Management/staff.repository';
import { UpdateDoctorInfoInput } from '../../models/Facility Management/staff.model';
import { AppError } from '../../utils/app-error.util';
import { pool } from '../../config/postgresdb';

export class DoctorInfoService {
    /**
     * Cập nhật thông tin chuyên môn bác sĩ.
     */
    static async updateDoctorInfo(userId: string, data: UpdateDoctorInfoInput): Promise<void> {
        // Kiểm tra tồn tại
        const staff = await StaffRepository.getStaffById(userId);
        if (!staff) {
            throw new AppError(404, 'STAFF_NOT_FOUND', 'Không tìm thấy thông tin nhân sự.');
        }

        // Bắt buộc nhân sự này phải có Role là DOCTOR
        if (!staff.roles.includes('DOCTOR')) {
            throw new AppError(403, 'NOT_A_DOCTOR', 'Nhân sự này không có vai trò Bác Sĩ (DOCTOR). Vui lòng cấp quyền trước.');
        }

        // Nếu truyền specialty_id thì kiểm tra có tồn tại không
        if (data.specialty_id) {
            const specialtyCheck = await pool.query('SELECT 1 FROM specialties WHERE specialties_id = $1', [data.specialty_id]);
            if (specialtyCheck.rowCount === 0) {
                throw new AppError(400, 'SPECIALTY_NOT_FOUND', 'Chuyên khoa truyền vào không tồn tại.');
            }
        }

        // UPSERT thông tin
        await DoctorRepository.upsertDoctorInfo(userId, data);
    }
}
