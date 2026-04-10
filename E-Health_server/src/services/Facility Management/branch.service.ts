import { BranchRepository } from '../../repository/Facility Management/branch.repository';
import { FacilityRepository } from '../../repository/Facility Management/facility.repository';
import { CreateBranchInput, UpdateBranchInput, BranchQuery } from '../../models/Facility Management/branch.model';
import { BRANCH_ERRORS, BranchStatus } from '../../constants/branch.constant';
import { FACILITY_ERRORS } from '../../constants/facility.constant';
import { randomUUID } from 'crypto';

export class BranchService {
    /**
     * Lấy danh sách chi nhánh (Phân trang)
     */
    static async getBranches(query: BranchQuery) {
        const { search, facility_id, status, page, limit } = query;
        const offset = (page - 1) * limit;
        return await BranchRepository.findAllBranches(search, facility_id, status, offset, limit);
    }

    /**
     * Lấy danh sách chi nhánh cho dropdown
     */
    static async getBranchesForDropdown() {
        return await BranchRepository.getBranchesForDropdown();
    }

    /**
     * Lấy chi tiết 1 chi nhánh
     */
    static async getBranchById(id: string) {
        const branch = await BranchRepository.findBranchById(id);
        if (!branch) throw BRANCH_ERRORS.BRANCH_NOT_FOUND;
        return branch;
    }

    /**
     * Tạo mới chi nhánh
     */
    static async createBranch(data: CreateBranchInput) {

        const facility = await FacilityRepository.findFacilityById(data.facility_id);
        if (!facility) throw FACILITY_ERRORS.FACILITY_NOT_FOUND;


        const existingCode = await BranchRepository.findBranchByCode(data.code);
        if (existingCode) throw BRANCH_ERRORS.BRANCH_CODE_EXISTS;

        const branchId = `BRN_${Date.now()}_${randomUUID().substring(0, 8)}`;

        const newBranch = {
            id: branchId,
            ...data,
            status: BranchStatus.ACTIVE
        };

        await BranchRepository.createBranch(newBranch);
        return { branches_id: branchId };
    }

    /**
     * Cập nhật thông tin chi nhánh
     */
    static async updateBranch(id: string, data: UpdateBranchInput) {
        const branch = await BranchRepository.findBranchById(id);
        if (!branch) throw BRANCH_ERRORS.BRANCH_NOT_FOUND;

        if (data.facility_id && data.facility_id !== branch.facility_id) {
            const facility = await FacilityRepository.findFacilityById(data.facility_id);
            if (!facility) throw BRANCH_ERRORS.INVALID_FACILITY_ID;
        }

        const allowedFields = ['facility_id', 'name', 'address', 'phone', 'established_date'];
        let sanitizedInput: Record<string, any> = {};
        if (data && Object.keys(data).length > 0) {
            sanitizedInput = Object.fromEntries(
                Object.entries(data).filter(([key, value]) => allowedFields.includes(key) && value !== undefined && value !== null && value !== '')
            );
        }

        if (Object.keys(sanitizedInput).length > 0) {
            return await BranchRepository.updateBranchInfo(id, sanitizedInput);
        }
        return branch;
    }

    /**
     * Bật tắt trạng thái chi nhánh
     */
    static async changeBranchStatus(id: string, status: string) {
        const branch = await BranchRepository.findBranchById(id);
        if (!branch) throw BRANCH_ERRORS.BRANCH_NOT_FOUND;

        await BranchRepository.updateBranchStatus(id, status);
    }

    /**
     * Xóa mềm chi nhánh
     */
    static async deleteBranch(id: string) {
        const branch = await BranchRepository.findBranchById(id);
        if (!branch) throw BRANCH_ERRORS.BRANCH_NOT_FOUND;

        await BranchRepository.deleteBranch(id);
    }
}
