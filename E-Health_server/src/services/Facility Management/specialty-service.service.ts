import { SpecialtyServiceRepository } from '../../repository/Facility Management/specialty-service.repository';
import { ServiceRepository } from '../../repository/Facility Management/service.repository';
import { SpecialtyService } from '../../models/Facility Management/specialty-service.model';
import {
    SPECIALTY_SERVICE_ERRORS,
    SERVICE_ERRORS
} from '../../constants/medical-service.constant';

export class SpecialtyServiceLogic {
    /**
     * Lấy danh sách dịch vụ đã gán cho chuyên khoa
     */
    static async getServicesBySpecialtyId(specialtyId: string): Promise<SpecialtyService[]> {
        const specialtyExists = await SpecialtyServiceRepository.specialtyExists(specialtyId);
        if (!specialtyExists) {
            throw SPECIALTY_SERVICE_ERRORS.SPECIALTY_NOT_FOUND;
        }
        return await SpecialtyServiceRepository.getServicesBySpecialtyId(specialtyId);
    }

    /**
     * Lấy danh sách chuyên khoa đã gán cho 1 dịch vụ
     */
    static async getSpecialtiesByServiceId(serviceId: string): Promise<SpecialtyService[]> {
        const serviceExists = await ServiceRepository.getServiceById(serviceId);
        if (!serviceExists) {
            throw SERVICE_ERRORS.NOT_FOUND;
        }
        return await SpecialtyServiceRepository.getSpecialtiesByServiceId(serviceId);
    }

    /**
     * Gán danh sách dịch vụ vào chuyên khoa (Batch assign)
     * Logic: Xoá hết mapping cũ rồi gán mới (Replace strategy) để đồng bộ trực quan với UI checkbox.
     */
    static async assignServices(specialtyId: string, serviceIds: string[]): Promise<{ assigned: number; skipped: number }> {
        const specialtyExists = await SpecialtyServiceRepository.specialtyExists(specialtyId);
        if (!specialtyExists) {
            throw SPECIALTY_SERVICE_ERRORS.SPECIALTY_NOT_FOUND;
        }

        if (!serviceIds || serviceIds.length === 0) {
            throw SPECIALTY_SERVICE_ERRORS.SERVICE_IDS_REQUIRED;
        }

        /** Xác minh tất cả service_ids hợp lệ trước khi gán */
        for (const serviceId of serviceIds) {
            const serviceExists = await ServiceRepository.getServiceById(serviceId);
            if (!serviceExists) {
                throw { ...SERVICE_ERRORS.NOT_FOUND, detail: `service_id: ${serviceId}` };
            }
        }

        /** Xoá toàn bộ mapping cũ */
        await SpecialtyServiceRepository.removeAllBySpecialty(specialtyId);

        let assigned = 0;
        let skipped = 0;

        for (const serviceId of serviceIds) {
            const result = await SpecialtyServiceRepository.assign(specialtyId, serviceId);
            if (result) {
                assigned++;
            } else {
                skipped++;
            }
        }

        return { assigned, skipped };
    }

    /**
     * Gỡ 1 dịch vụ khỏi chuyên khoa
     */
    static async removeService(specialtyId: string, serviceId: string): Promise<void> {
        const removed = await SpecialtyServiceRepository.remove(specialtyId, serviceId);
        if (!removed) {
            throw SPECIALTY_SERVICE_ERRORS.NOT_FOUND;
        }
    }
}
