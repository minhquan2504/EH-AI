import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    DataSourceItem, CreateDataSourceInput, UpdateDataSourceInput,
    ExternalRecordItem, ExternalRecordDetail, CreateExternalRecordInput,
    DeviceSyncLogItem, CreateDeviceSyncInput,
    IntegrationSummary, ExternalRecordFilters,
} from '../../models/EHR/data-integration.model';

function generateId(prefix: string): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${prefix}_${yy}${mm}${dd}_${uuidv4().slice(0, 8)}`;
}

export class DataIntegrationRepository {

    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return r.rows[0].exists;
    }

    /** API 1: DS nguồn dữ liệu */
    static async getDataSources(): Promise<DataSourceItem[]> {
        const r = await pool.query(
            `SELECT ds.source_id, ds.source_name, ds.source_type, ds.protocol,
                    ds.endpoint_url, ds.contact_info, ds.description, ds.is_active,
                    ds.created_at, ds.updated_at,
                    up.full_name AS created_by_name
             FROM ehr_data_sources ds
             LEFT JOIN user_profiles up ON up.user_id = ds.created_by
             ORDER BY ds.created_at DESC`
        );
        return r.rows;
    }

    /** API 2: Thêm nguồn */
    static async createDataSource(data: CreateDataSourceInput, createdBy: string): Promise<DataSourceItem> {
        const id = generateId('SRC');
        const r = await pool.query(
            `INSERT INTO ehr_data_sources (source_id, source_name, source_type, protocol, endpoint_url, api_key_encrypted, contact_info, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, data.source_name, data.source_type, data.protocol || 'MANUAL', data.endpoint_url || null, data.api_key_encrypted || null, data.contact_info || null, data.description || null, createdBy]
        );
        return r.rows[0];
    }

    /** API 3: Cập nhật nguồn */
    static async updateDataSource(sourceId: string, data: UpdateDataSourceInput): Promise<DataSourceItem | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let idx = 1;

        const fields = ['source_name', 'source_type', 'protocol', 'endpoint_url', 'api_key_encrypted', 'contact_info', 'description', 'is_active'];
        for (const field of fields) {
            if ((data as any)[field] !== undefined) {
                setClauses.push(`${field} = $${idx++}`);
                values.push((data as any)[field]);
            }
        }
        if (values.length === 0) return this.getSourceById(sourceId);

        values.push(sourceId);
        const r = await pool.query(
            `UPDATE ehr_data_sources SET ${setClauses.join(', ')} WHERE source_id = $${idx} RETURNING *`,
            values
        );
        return r.rows[0] || null;
    }

    static async getSourceById(sourceId: string): Promise<DataSourceItem | null> {
        const r = await pool.query(`SELECT * FROM ehr_data_sources WHERE source_id = $1`, [sourceId]);
        return r.rows[0] || null;
    }

    /** API 4: DS hồ sơ bên ngoài */
    static async getExternalRecords(patientId: string, filters: ExternalRecordFilters): Promise<{ data: ExternalRecordItem[]; total: number }> {
        const conditions = ['ehr.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.data_type) { conditions.push(`ehr.data_type = $${idx++}`); params.push(filters.data_type); }
        if (filters.sync_status) { conditions.push(`ehr.sync_status = $${idx++}`); params.push(filters.sync_status); }
        if (filters.source_id) { conditions.push(`ehr.source_id = $${idx++}`); params.push(filters.source_id); }
        if (filters.from_date) { conditions.push(`ehr.synced_at >= $${idx++}`); params.push(filters.from_date); }
        if (filters.to_date) { conditions.push(`ehr.synced_at <= ($${idx++}::date + INTERVAL '1 day')`); params.push(filters.to_date); }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM external_health_records ehr WHERE ${where}`, params);
        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT ehr.external_health_records_id, ehr.patient_id, ehr.provider_name,
                    ehr.integration_protocol, ehr.data_type, ehr.sync_status,
                    ehr.source_id, ds.source_name,
                    ehr.synced_at, ehr.processed_at,
                    up.full_name AS created_by_name
             FROM external_health_records ehr
             LEFT JOIN ehr_data_sources ds ON ds.source_id = ehr.source_id
             LEFT JOIN user_profiles up ON up.user_id = ehr.created_by
             WHERE ${where}
             ORDER BY ehr.synced_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );
        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /** API 5: Nhập hồ sơ */
    static async createExternalRecord(patientId: string, data: CreateExternalRecordInput, createdBy: string): Promise<ExternalRecordDetail> {
        const id = generateId('EHR');
        const r = await pool.query(
            `INSERT INTO external_health_records (external_health_records_id, patient_id, provider_name, integration_protocol, data_type, raw_payload, source_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [id, patientId, data.provider_name, data.integration_protocol || null, data.data_type || null, JSON.stringify(data.raw_payload), data.source_id || null, createdBy]
        );
        return r.rows[0];
    }

    /** API 6: Chi tiết */
    static async getExternalRecordDetail(recordId: string): Promise<ExternalRecordDetail | null> {
        const r = await pool.query(
            `SELECT ehr.*, ds.source_name,
                    up_c.full_name AS created_by_name,
                    up_p.full_name AS processed_by_name
             FROM external_health_records ehr
             LEFT JOIN ehr_data_sources ds ON ds.source_id = ehr.source_id
             LEFT JOIN user_profiles up_c ON up_c.user_id = ehr.created_by
             LEFT JOIN user_profiles up_p ON up_p.user_id = ehr.processed_by
             WHERE ehr.external_health_records_id = $1`,
            [recordId]
        );
        return r.rows[0] || null;
    }

    /** API 7: Cập nhật sync status */
    static async updateSyncStatus(recordId: string, status: string, processedBy: string, errorMessage?: string): Promise<ExternalRecordDetail | null> {
        const r = await pool.query(
            `UPDATE external_health_records
             SET sync_status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2, error_message = $3
             WHERE external_health_records_id = $4
             RETURNING *`,
            [status, processedBy, errorMessage || null, recordId]
        );
        return r.rows[0] || null;
    }

    /** API 8: Log đồng bộ thiết bị */
    static async createDeviceSyncLog(patientId: string, data: CreateDeviceSyncInput, syncedBy: string): Promise<DeviceSyncLogItem> {
        const id = generateId('DSYNC');
        const r = await pool.query(
            `INSERT INTO ehr_device_sync_log (sync_log_id, patient_id, source_id, device_name, device_type, records_synced, status, error_message, synced_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, patientId, data.source_id || null, data.device_name, data.device_type || null, data.records_synced || 0, data.status || 'SUCCESS', data.error_message || null, syncedBy]
        );
        return r.rows[0];
    }

    /** API 9: Lịch sử đồng bộ */
    static async getDeviceSyncLogs(patientId: string): Promise<DeviceSyncLogItem[]> {
        const r = await pool.query(
            `SELECT dsl.*, up.full_name AS synced_by_name
             FROM ehr_device_sync_log dsl
             LEFT JOIN user_profiles up ON up.user_id = dsl.synced_by
             WHERE dsl.patient_id = $1
             ORDER BY dsl.sync_time DESC`,
            [patientId]
        );
        return r.rows;
    }

    /** API 10: Dashboard tổng hợp */
    static async getIntegrationSummary(patientId: string): Promise<IntegrationSummary> {
        const srcResult = await pool.query(
            `SELECT COUNT(*)::int AS total_sources,
                    COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active_sources
             FROM ehr_data_sources`
        );

        const recResult = await pool.query(
            `SELECT COUNT(*)::int AS total_external_records,
                    COUNT(*) FILTER (WHERE sync_status = 'PENDING')::int AS records_pending,
                    COUNT(*) FILTER (WHERE sync_status = 'PROCESSED')::int AS records_processed,
                    COUNT(*) FILTER (WHERE sync_status = 'FAILED')::int AS records_failed
             FROM external_health_records WHERE patient_id = $1`,
            [patientId]
        );

        const byTypeResult = await pool.query(
            `SELECT data_type, COUNT(*)::int AS count
             FROM external_health_records WHERE patient_id = $1 AND data_type IS NOT NULL
             GROUP BY data_type ORDER BY count DESC`,
            [patientId]
        );

        const bySrcTypeResult = await pool.query(
            `SELECT ds.source_type, COUNT(*)::int AS count
             FROM external_health_records ehr
             JOIN ehr_data_sources ds ON ds.source_id = ehr.source_id
             WHERE ehr.patient_id = $1
             GROUP BY ds.source_type ORDER BY count DESC`,
            [patientId]
        );

        const syncResult = await pool.query(
            `SELECT COUNT(*)::int AS total_device_syncs,
                    MAX(sync_time) AS last_sync_at
             FROM ehr_device_sync_log WHERE patient_id = $1`,
            [patientId]
        );

        const src = srcResult.rows[0];
        const rec = recResult.rows[0];
        const syn = syncResult.rows[0];

        return {
            total_sources: src.total_sources,
            active_sources: src.active_sources,
            total_external_records: rec.total_external_records,
            records_pending: rec.records_pending,
            records_processed: rec.records_processed,
            records_failed: rec.records_failed,
            by_data_type: byTypeResult.rows,
            by_source_type: bySrcTypeResult.rows,
            total_device_syncs: syn.total_device_syncs,
            last_sync_at: syn.last_sync_at,
        };
    }
}
