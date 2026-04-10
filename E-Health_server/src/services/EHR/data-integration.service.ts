import { DataIntegrationRepository } from '../../repository/EHR/data-integration.repository';
import {
    DataSourceItem, CreateDataSourceInput, UpdateDataSourceInput,
    ExternalRecordItem, ExternalRecordDetail, CreateExternalRecordInput, UpdateSyncStatusInput,
    DeviceSyncLogItem, CreateDeviceSyncInput,
    IntegrationSummary, ExternalRecordFilters,
} from '../../models/EHR/data-integration.model';
import { DI_ERRORS, DI_CONFIG, SYNC_STATUS } from '../../constants/data-integration.constant';

export class DataIntegrationService {

    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await DataIntegrationRepository.patientExists(patientId);
        if (!exists) throw new Error(DI_ERRORS.PATIENT_NOT_FOUND);
    }

    /** API 1: DS nguồn dữ liệu */
    static async getDataSources(): Promise<DataSourceItem[]> {
        return DataIntegrationRepository.getDataSources();
    }

    /** API 2: Thêm nguồn */
    static async createDataSource(data: CreateDataSourceInput, userId: string): Promise<DataSourceItem> {
        if (!data.source_name?.trim()) throw new Error(DI_ERRORS.SOURCE_NAME_REQUIRED);
        if (!data.source_type?.trim()) throw new Error(DI_ERRORS.SOURCE_TYPE_REQUIRED);
        return DataIntegrationRepository.createDataSource(data, userId);
    }

    /** API 3: Cập nhật nguồn */
    static async updateDataSource(sourceId: string, data: UpdateDataSourceInput): Promise<DataSourceItem> {
        const source = await DataIntegrationRepository.getSourceById(sourceId);
        if (!source) throw new Error(DI_ERRORS.SOURCE_NOT_FOUND);
        const updated = await DataIntegrationRepository.updateDataSource(sourceId, data);
        return updated!;
    }

    /** API 4: DS hồ sơ bên ngoài */
    static async getExternalRecords(patientId: string, filters: ExternalRecordFilters): Promise<{ data: ExternalRecordItem[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);
        const page = Math.max(filters.page || DI_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || DI_CONFIG.DEFAULT_LIMIT, 1), DI_CONFIG.MAX_LIMIT);
        const result = await DataIntegrationRepository.getExternalRecords(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 5: Nhập hồ sơ */
    static async createExternalRecord(patientId: string, data: CreateExternalRecordInput, userId: string): Promise<ExternalRecordDetail> {
        await this.validatePatient(patientId);
        if (!data.provider_name?.trim()) throw new Error(DI_ERRORS.PROVIDER_REQUIRED);
        if (!data.raw_payload) throw new Error(DI_ERRORS.PAYLOAD_REQUIRED);
        return DataIntegrationRepository.createExternalRecord(patientId, data, userId);
    }

    /** API 6: Chi tiết */
    static async getExternalRecordDetail(patientId: string, recordId: string): Promise<ExternalRecordDetail> {
        await this.validatePatient(patientId);
        const record = await DataIntegrationRepository.getExternalRecordDetail(recordId);
        if (!record) throw new Error(DI_ERRORS.RECORD_NOT_FOUND);
        if (record.patient_id !== patientId) throw new Error(DI_ERRORS.RECORD_NOT_BELONG);
        return record;
    }

    /** API 7: Cập nhật sync status */
    static async updateSyncStatus(patientId: string, recordId: string, data: UpdateSyncStatusInput, userId: string): Promise<ExternalRecordDetail> {
        await this.validatePatient(patientId);
        if (!data.sync_status) throw new Error(DI_ERRORS.STATUS_REQUIRED);
        if (![SYNC_STATUS.PROCESSED, SYNC_STATUS.FAILED].includes(data.sync_status as any)) {
            throw new Error(DI_ERRORS.INVALID_STATUS);
        }
        const record = await DataIntegrationRepository.getExternalRecordDetail(recordId);
        if (!record) throw new Error(DI_ERRORS.RECORD_NOT_FOUND);
        if (record.patient_id !== patientId) throw new Error(DI_ERRORS.RECORD_NOT_BELONG);

        const updated = await DataIntegrationRepository.updateSyncStatus(recordId, data.sync_status, userId, data.error_message);
        return updated!;
    }

    /** API 8: Log đồng bộ thiết bị */
    static async createDeviceSyncLog(patientId: string, data: CreateDeviceSyncInput, userId: string): Promise<DeviceSyncLogItem> {
        await this.validatePatient(patientId);
        if (!data.device_name?.trim()) throw new Error(DI_ERRORS.DEVICE_NAME_REQUIRED);
        return DataIntegrationRepository.createDeviceSyncLog(patientId, data, userId);
    }

    /** API 9: Lịch sử sync */
    static async getDeviceSyncLogs(patientId: string): Promise<DeviceSyncLogItem[]> {
        await this.validatePatient(patientId);
        return DataIntegrationRepository.getDeviceSyncLogs(patientId);
    }

    /** API 10: Dashboard */
    static async getIntegrationSummary(patientId: string): Promise<IntegrationSummary> {
        await this.validatePatient(patientId);
        return DataIntegrationRepository.getIntegrationSummary(patientId);
    }
}
