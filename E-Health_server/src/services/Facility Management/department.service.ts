import { DepartmentRepository } from '../../repository/Facility Management/department.repository';
import { BranchRepository } from '../../repository/Facility Management/branch.repository';
import { DepartmentStatus, DEPARTMENT_ERRORS } from '../../constants/department.constant';
import { CreateDepartmentInput, UpdateDepartmentInput, DepartmentQuery } from '../../models/Facility Management/department.model';
import { v4 as uuidv4 } from 'uuid';

export class DepartmentService {

    /*
    / Lấy danh sách khoa/phòng ban
    */
    static async getDepartments(query: DepartmentQuery) {
        return await DepartmentRepository.findAllDepartments(query);
    }


    /*
    / Lấy danh sách khoa/phòng ban cho dropdown
    */
    static async getDepartmentsForDropdown(branch_id: string) {
        if (!branch_id) {
            throw { ...DEPARTMENT_ERRORS.BRANCH_NOT_FOUND, message: 'Vui lòng cung cấp branch_id để lấy danh sách khoa/phòng ban hợp lệ.' };
        }
        return await DepartmentRepository.getDepartmentsForDropdown(branch_id);
    }


    /*
    / Tìm kiếm khoa/phòng ban theo ID
    */
    static async getDepartmentById(id: string) {
        const department = await DepartmentRepository.findDepartmentById(id);
        if (!department) throw DEPARTMENT_ERRORS.NOT_FOUND;
        return department;
    }



    /*
    / Tạo khoa/phòng ban
    */
    static async createDepartment(data: CreateDepartmentInput) {
        const branch = await BranchRepository.findBranchById(data.branch_id);
        if (!branch) throw DEPARTMENT_ERRORS.BRANCH_NOT_FOUND;

        const isExists = await DepartmentRepository.checkDepartmentCodeExistsInBranch(data.code, data.branch_id);
        if (isExists) throw DEPARTMENT_ERRORS.CODE_EXISTS;

        const newId = `DEPT_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
        await DepartmentRepository.createDepartment({ ...data, departments_id: newId });

        return { department_id: newId };
    }



    /*
    / Cập nhật thông tin khoa/phòng ban
    */
    static async updateDepartment(id: string, updates: UpdateDepartmentInput) {

        const existing = await DepartmentRepository.findDepartmentById(id);
        if (!existing) throw DEPARTMENT_ERRORS.NOT_FOUND;

        return await DepartmentRepository.updateDepartmentInfo(id, updates);
    }



    /*
    / Cập nhật trạng thái khoa/phòng ban
    */
    static async changeDepartmentStatus(id: string, status: string) {
        const existing = await DepartmentRepository.findDepartmentById(id);
        if (!existing) throw DEPARTMENT_ERRORS.NOT_FOUND;

        if (!Object.values(DepartmentStatus).includes(status as DepartmentStatus)) {
            throw DEPARTMENT_ERRORS.INVALID_STATUS;
        }

        await DepartmentRepository.updateDepartmentStatus(id, status);
    }



    /*
    / Xóa khoa/phòng ban
    */
    static async deleteDepartment(id: string) {
        const existing = await DepartmentRepository.findDepartmentById(id);
        if (!existing) throw DEPARTMENT_ERRORS.NOT_FOUND;

        await DepartmentRepository.deleteDepartment(id);
    }
}
