import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../../repository/Core/audit-log.repository';
import { AppError } from '../../utils/app-error.util';
import { ExcelUtil } from '../../utils/excel.util';

export class AuditLogController {
    /**
     * Lấy danh sách Log có phân trang và bộ lọc chuyên sâu
     */
    static async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                user_id: req.query.user_id as string | undefined,
                module_name: req.query.module_name as string | undefined,
                action_type: req.query.action_type as string | undefined,
                start_date: req.query.start_date as string | undefined,
                end_date: req.query.end_date as string | undefined,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 20
            };

            const data = await AuditLogRepository.getLogs(filters);

            res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu Audit Logs thành công.',
                data: data.logs,
                pagination: {
                    total: data.total,
                    page: filters.page,
                    limit: filters.limit,
                    total_pages: Math.ceil(data.total / filters.limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xem chi tiết 1 dòng Log cũ & mới
     */
    static async getLogById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const log = await AuditLogRepository.getLogById(id);

            if (!log) {
                throw new AppError(404, 'LOG_NOT_FOUND', 'Không tìm thấy dòng Audit Log này.');
            }

            res.status(200).json({
                success: true,
                message: 'Lấy chi tiết Audit Log thành công.',
                data: log
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất Excel toàn bộ Logs theo Filter
     */
    static async exportExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                user_id: req.query.user_id ? String(req.query.user_id) : undefined,
                module_name: req.query.module_name ? String(req.query.module_name) : undefined,
                action_type: req.query.action_type ? String(req.query.action_type) : undefined,
                start_date: req.query.start_date ? String(req.query.start_date) : undefined,
                end_date: req.query.end_date ? String(req.query.end_date) : undefined,
                page: 1,
                limit: 10000
            } as any;

            const data = await AuditLogRepository.getLogs(filters);

            const columns = [
                { header: 'ID Giao dịch', key: 'log_id', width: 40 },
                { header: 'Thời gian', key: 'created_at', width: 25 },
                { header: 'ID Người thao tác', key: 'user_id', width: 30 },
                { header: 'Email Người thao tác', key: 'user_email', width: 30 },
                { header: 'Phân hệ', key: 'module_name', width: 20 },
                { header: 'Hành động', key: 'action_type', width: 15 },
                { header: 'ID Dữ liệu', key: 'target_id', width: 40 },
                { header: 'IP Address', key: 'ip_address', width: 20 }
            ];

            const excelBuffer = await ExcelUtil.generateExcelBuffer(data.logs, columns, 'AuditLogs');

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="AuditLogs_Export_${Date.now()}.xlsx"`);
            res.send(excelBuffer);

        } catch (error) {
            next(error);
        }
    }
}
