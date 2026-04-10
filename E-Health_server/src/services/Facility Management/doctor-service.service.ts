import { DoctorServiceRepository } from '../../repository/Facility Management/doctor-service.repository';
import { DoctorService } from '../../models/Facility Management/doctor-service.model';
import {
    DOCTOR_SERVICE_ERRORS,
    FACILITY_SERVICE_ERRORS
} from '../../constants/medical-service.constant';

export class DoctorServiceLogic {
    /**
     * Lấy danh sách dịch vụ được gán cho bác sĩ
     */
    static async getServicesByDoctorId(doctorId: string): Promise<DoctorService[]> {
        const doctorExists = await DoctorServiceRepository.doctorExists(doctorId);
        if (!doctorExists) {
            throw DOCTOR_SERVICE_ERRORS.DOCTOR_NOT_FOUND;
        }
        return await DoctorServiceRepository.getServicesByDoctorId(doctorId);
    }

    /**
     * Lấy danh sách bác sĩ thực hiện 1 dịch vụ cơ sở
     */
    static async getDoctorsByFacilityServiceId(facilityServiceId: string): Promise<DoctorService[]> {
        const fsExists = await DoctorServiceRepository.facilityServiceExists(facilityServiceId);
        if (!fsExists) {
            throw FACILITY_SERVICE_ERRORS.NOT_FOUND;
        }
        return await DoctorServiceRepository.getDoctorsByFacilityServiceId(facilityServiceId);
    }

    /**
     * Gán danh sách dịch vụ cơ sở cho bác sĩ (Batch assign)
     * Logic: Xoá hết mapping cũ rồi gán mới (Replace strategy).
     */
    static async assignServices(
        doctorId: string,
        facilityServiceIds: string[],
        isPrimary: boolean,
        assignedBy: string
    ): Promise<{ assigned: number; skipped: number }> {
        const doctorExists = await DoctorServiceRepository.doctorExists(doctorId);
        if (!doctorExists) {
            throw DOCTOR_SERVICE_ERRORS.DOCTOR_NOT_FOUND;
        }

        if (!facilityServiceIds || facilityServiceIds.length === 0) {
            throw DOCTOR_SERVICE_ERRORS.FACILITY_SERVICE_IDS_REQUIRED;
        }

        /** Xác minh tất cả facility_service_ids hợp lệ trước khi gán */
        for (const fsId of facilityServiceIds) {
            const fsExists = await DoctorServiceRepository.facilityServiceExists(fsId);
            if (!fsExists) {
                throw { ...FACILITY_SERVICE_ERRORS.NOT_FOUND, detail: `facility_service_id: ${fsId}` };
            }
        }

        /** Xoá toàn bộ mapping cũ */
        await DoctorServiceRepository.removeAllByDoctor(doctorId);

        let assigned = 0;
        let skipped = 0;

        for (const fsId of facilityServiceIds) {
            const result = await DoctorServiceRepository.assign(doctorId, fsId, isPrimary, assignedBy);
            if (result) {
                assigned++;
            } else {
                skipped++;
            }
        }

        return { assigned, skipped };
    }

    /**
     * Gỡ 1 dịch vụ khỏi bác sĩ
     */
    static async removeService(doctorId: string, facilityServiceId: string): Promise<void> {
        const removed = await DoctorServiceRepository.remove(doctorId, facilityServiceId);
        if (!removed) {
            throw DOCTOR_SERVICE_ERRORS.NOT_FOUND;
        }
    }
}
