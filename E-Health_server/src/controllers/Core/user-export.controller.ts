import { Request, Response, NextFunction } from "express";
import { UserExportService } from "../../services/Facility Management/user-export.service";
import { UserExportFilter } from "../../models/Core/user-export.model";

export class UserExportController {
    /**
     * Xuất danh sách người dùng thành File Excel
     */
    static async exportUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payload = (req.body && Object.keys(req.body).length > 0) ? req.body : req.query;

            const filter: UserExportFilter = {
                search: payload.search as string,
                role: payload.role as string,
                status: payload.status as 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING',
                fromDate: payload.fromDate as string,
                toDate: payload.toDate as string
            };

            const buffer = await UserExportService.generateUsersExcel(filter);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `Export_Users_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}
