import { Request, Response } from 'express';
import { DataIntegrationService } from '../../services/EHR/data-integration.service';
import { DI_SUCCESS } from '../../constants/data-integration.constant';

export class DataIntegrationController {

    /** API 1: DS nguồn dữ liệu */
    static async getDataSources(req: Request, res: Response): Promise<void> {
        try {
            const data = await DataIntegrationService.getDataSources();
            res.status(200).json({ success: true, message: DI_SUCCESS.SOURCES_FETCHED, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** API 2: Thêm nguồn */
    static async createDataSource(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createDataSource(req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.SOURCE_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 3: Cập nhật nguồn */
    static async updateDataSource(req: Request, res: Response): Promise<void> {
        try {
            const sourceId = req.params.sourceId as string;
            const data = await DataIntegrationService.updateDataSource(sourceId, req.body);
            res.status(200).json({ success: true, message: DI_SUCCESS.SOURCE_UPDATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 4: DS hồ sơ bên ngoài */
    static async getExternalRecords(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                data_type: req.query.data_type as string | undefined,
                sync_status: req.query.sync_status as string | undefined,
                source_id: req.query.source_id as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await DataIntegrationService.getExternalRecords(patientId, filters);
            res.status(200).json({ success: true, message: DI_SUCCESS.RECORDS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 5: Nhập hồ sơ */
    static async createExternalRecord(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createExternalRecord(patientId, req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.RECORD_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 6: Chi tiết */
    static async getExternalRecordDetail(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const recordId = req.params.recordId as string;
            const data = await DataIntegrationService.getExternalRecordDetail(patientId, recordId);
            res.status(200).json({ success: true, message: DI_SUCCESS.RECORD_DETAIL_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 7: Cập nhật sync status */
    static async updateSyncStatus(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const recordId = req.params.recordId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.updateSyncStatus(patientId, recordId, req.body, userId);
            res.status(200).json({ success: true, message: DI_SUCCESS.STATUS_UPDATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403
                : error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 8: Log đồng bộ thiết bị */
    static async createDeviceSyncLog(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createDeviceSyncLog(patientId, req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.DEVICE_SYNC_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 9: Lịch sử sync */
    static async getDeviceSyncLogs(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await DataIntegrationService.getDeviceSyncLogs(patientId);
            res.status(200).json({ success: true, message: DI_SUCCESS.DEVICE_SYNC_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 10: Dashboard */
    static async getIntegrationSummary(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await DataIntegrationService.getIntegrationSummary(patientId);
            res.status(200).json({ success: true, message: DI_SUCCESS.SUMMARY_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
