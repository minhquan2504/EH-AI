import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    EInvoice,
    EInvoiceItem,
    BillingDocument,
    EInvoiceConfig,
    PaginatedResult,
} from '../../models/Billing/billing-document.model';

export class BillingDocumentRepository {

    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // ═══════════════════════════════════════════════════
    // E-INVOICE CONFIG
    // ═══════════════════════════════════════════════════

    /** Lấy cấu hình HĐĐT theo cơ sở */
    static async getConfig(facilityId: string): Promise<EInvoiceConfig | null> {
        const sql = `
            SELECT eic.*, f.name as facility_name
            FROM e_invoice_config eic
            LEFT JOIN facilities f ON eic.facility_id = f.facilities_id
            WHERE eic.facility_id = $1
        `;
        const result = await pool.query(sql, [facilityId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tạo/cập nhật cấu hình HĐĐT */
    static async upsertConfig(
        configId: string, facilityId: string, input: any, userId: string
    ): Promise<EInvoiceConfig> {
        const sql = `
            INSERT INTO e_invoice_config (
                config_id, facility_id, seller_name, seller_tax_code,
                seller_address, seller_phone, seller_bank_account, seller_bank_name,
                invoice_template, invoice_series, tax_rate_default, currency_default,
                created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            ON CONFLICT (facility_id) DO UPDATE SET
                seller_name = EXCLUDED.seller_name,
                seller_tax_code = EXCLUDED.seller_tax_code,
                seller_address = EXCLUDED.seller_address,
                seller_phone = EXCLUDED.seller_phone,
                seller_bank_account = EXCLUDED.seller_bank_account,
                seller_bank_name = EXCLUDED.seller_bank_name,
                invoice_template = EXCLUDED.invoice_template,
                invoice_series = EXCLUDED.invoice_series,
                tax_rate_default = EXCLUDED.tax_rate_default,
                currency_default = EXCLUDED.currency_default,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await pool.query(sql, [
            configId, facilityId, input.seller_name, input.seller_tax_code,
            input.seller_address || null, input.seller_phone || null,
            input.seller_bank_account || null, input.seller_bank_name || null,
            input.invoice_template || '1C24TAA', input.invoice_series || 'C24TAA',
            input.tax_rate_default ?? 0, input.currency_default || 'VND',
            userId,
        ]);
        return result.rows[0];
    }

    /** Tăng current_number và trả về số mới */
    static async incrementInvoiceNumber(facilityId: string, client?: PoolClient): Promise<number> {
        const sql = `
            UPDATE e_invoice_config SET current_number = current_number + 1, updated_at = CURRENT_TIMESTAMP
            WHERE facility_id = $1 RETURNING current_number
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [facilityId]);
        return result.rows[0].current_number;
    }

    // ═══════════════════════════════════════════════════
    // E-INVOICES
    // ═══════════════════════════════════════════════════

    /** Tạo HĐĐT */
    static async createEInvoice(data: Partial<EInvoice>, client?: PoolClient): Promise<EInvoice> {
        const sql = `
            INSERT INTO e_invoices (
                e_invoice_id, e_invoice_number, invoice_template, invoice_series,
                lookup_code, invoice_id, payment_transaction_id, invoice_type,
                seller_name, seller_tax_code, seller_address, seller_phone,
                seller_bank_account, seller_bank_name,
                buyer_name, buyer_tax_code, buyer_address, buyer_email, buyer_type,
                total_before_tax, tax_rate, tax_amount, total_after_tax, discount_amount,
                payment_method_text, amount_in_words,
                status, notes, currency, facility_id, branch_id, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            data.e_invoice_id, data.e_invoice_number, data.invoice_template, data.invoice_series,
            data.lookup_code || null, data.invoice_id || null, data.payment_transaction_id || null,
            data.invoice_type || 'SALES',
            data.seller_name, data.seller_tax_code, data.seller_address || null, data.seller_phone || null,
            data.seller_bank_account || null, data.seller_bank_name || null,
            data.buyer_name || null, data.buyer_tax_code || null, data.buyer_address || null,
            data.buyer_email || null, data.buyer_type || 'INDIVIDUAL',
            data.total_before_tax || 0, data.tax_rate || 0, data.tax_amount || 0,
            data.total_after_tax || 0, data.discount_amount || 0,
            data.payment_method_text || null, data.amount_in_words || null,
            data.status || 'DRAFT', data.notes || null, data.currency || 'VND',
            data.facility_id || null, data.branch_id || null, data.created_by || null,
        ]);
        return result.rows[0];
    }

    /** Tạo items HĐĐT */
    static async createEInvoiceItems(items: Partial<EInvoiceItem>[], client?: PoolClient): Promise<EInvoiceItem[]> {
        const results: EInvoiceItem[] = [];
        const executor = client || pool;

        for (const item of items) {
            const sql = `
                INSERT INTO e_invoice_items (
                    item_id, e_invoice_id, line_number, item_name, unit,
                    quantity, unit_price, discount_amount,
                    amount_before_tax, tax_rate, tax_amount, amount_after_tax,
                    reference_type, reference_id, notes
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                RETURNING *
            `;
            const r = await executor.query(sql, [
                item.item_id, item.e_invoice_id, item.line_number, item.item_name, item.unit || null,
                item.quantity || 1, item.unit_price || 0, item.discount_amount || 0,
                item.amount_before_tax || 0, item.tax_rate || 0, item.tax_amount || 0,
                item.amount_after_tax || 0,
                item.reference_type || null, item.reference_id || null, item.notes || null,
            ]);
            results.push(r.rows[0]);
        }
        return results;
    }

    /** Cập nhật trạng thái HĐĐT */
    static async updateEInvoiceStatus(
        eInvoiceId: string, status: string, extraFields: Record<string, any> = {}
    ): Promise<EInvoice> {
        const sets = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [eInvoiceId, status];
        let idx = 3;

        for (const [key, value] of Object.entries(extraFields)) {
            sets.push(`${key} = $${idx++}`);
            params.push(value);
        }

        const sql = `UPDATE e_invoices SET ${sets.join(', ')} WHERE e_invoice_id = $1 RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết HĐĐT (kèm items + documents) */
    static async getEInvoiceById(eInvoiceId: string): Promise<EInvoice | null> {
        const sql = `
            SELECT ei.*, i.invoice_code, f.name as facility_name,
                   up1.full_name as created_by_name, up2.full_name as signed_by_name
            FROM e_invoices ei
            LEFT JOIN invoices i ON ei.invoice_id = i.invoices_id
            LEFT JOIN facilities f ON ei.facility_id = f.facilities_id
            LEFT JOIN user_profiles up1 ON ei.created_by = up1.user_id
            LEFT JOIN user_profiles up2 ON ei.signed_by = up2.user_id
            WHERE ei.e_invoice_id = $1
        `;
        const result = await pool.query(sql, [eInvoiceId]);
        if (result.rows.length === 0) return null;

        const einvoice = result.rows[0];

        /* Load items */
        const itemsSql = 'SELECT * FROM e_invoice_items WHERE e_invoice_id = $1 ORDER BY line_number';
        const itemsResult = await pool.query(itemsSql, [eInvoiceId]);
        einvoice.items = itemsResult.rows;

        /* Load documents */
        const docsSql = `
            SELECT bd.*, up.full_name as uploaded_by_name
            FROM billing_documents bd
            LEFT JOIN user_profiles up ON bd.uploaded_by = up.user_id
            WHERE bd.e_invoice_id = $1 AND bd.is_archived = FALSE
            ORDER BY bd.created_at DESC
        `;
        const docsResult = await pool.query(docsSql, [eInvoiceId]);
        einvoice.documents = docsResult.rows;

        return einvoice;
    }

    /** Danh sách HĐĐT + phân trang + filter */
    static async getEInvoices(
        facilityId?: string, status?: string, invoiceType?: string,
        dateFrom?: string, dateTo?: string, search?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<EInvoice>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (facilityId) { conditions.push(`ei.facility_id = $${idx++}`); params.push(facilityId); }
        if (status) { conditions.push(`ei.status = $${idx++}`); params.push(status); }
        if (invoiceType) { conditions.push(`ei.invoice_type = $${idx++}`); params.push(invoiceType); }
        if (dateFrom) { conditions.push(`ei.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`ei.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }
        if (search) {
            conditions.push(`(ei.e_invoice_number ILIKE $${idx} OR ei.lookup_code ILIKE $${idx} OR ei.buyer_name ILIKE $${idx} OR ei.buyer_tax_code ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `SELECT COUNT(*) as total FROM e_invoices ei ${where}`;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT ei.*, i.invoice_code, f.name as facility_name,
                   up.full_name as created_by_name
            FROM e_invoices ei
            LEFT JOIN invoices i ON ei.invoice_id = i.invoices_id
            LEFT JOIN facilities f ON ei.facility_id = f.facilities_id
            LEFT JOIN user_profiles up ON ei.created_by = up.user_id
            ${where}
            ORDER BY ei.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Tra cứu theo mã CQT */
    static async getEInvoiceByLookupCode(code: string): Promise<EInvoice | null> {
        const sql = `SELECT e_invoice_id FROM e_invoices WHERE lookup_code = $1`;
        const result = await pool.query(sql, [code]);
        if (result.rows.length === 0) return null;
        return await this.getEInvoiceById(result.rows[0].e_invoice_id);
    }

    /** Kiểm tra invoice đã có HĐĐT chưa (trừ CANCELLED) */
    static async checkEInvoiceExists(invoiceId: string): Promise<boolean> {
        const sql = `SELECT 1 FROM e_invoices WHERE invoice_id = $1 AND status NOT IN ('CANCELLED','REPLACED')`;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows.length > 0;
    }

    // ═══════════════════════════════════════════════════
    // BILLING DOCUMENTS
    // ═══════════════════════════════════════════════════

    /** Upload chứng từ */
    static async createDocument(
        docId: string, docCode: string, input: any, userId: string
    ): Promise<BillingDocument> {
        const sql = `
            INSERT INTO billing_documents (
                document_id, document_code, document_type, document_name,
                file_url, file_size, mime_type,
                invoice_id, e_invoice_id, payment_transaction_id,
                description, tags, uploaded_by, upload_source
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            docId, docCode, input.document_type, input.document_name,
            input.file_url, input.file_size || null, input.mime_type || null,
            input.invoice_id || null, input.e_invoice_id || null, input.payment_transaction_id || null,
            input.description || null, JSON.stringify(input.tags || []),
            userId, input.upload_source || 'MANUAL',
        ]);
        return result.rows[0];
    }

    /** Danh sách chứng từ + filter */
    static async getDocuments(
        documentType?: string, invoiceId?: string, eInvoiceId?: string,
        dateFrom?: string, dateTo?: string, isArchived: boolean = false,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<BillingDocument>> {
        const conditions: string[] = [`bd.is_archived = $1`];
        const params: any[] = [isArchived];
        let idx = 2;

        if (documentType) { conditions.push(`bd.document_type = $${idx++}`); params.push(documentType); }
        if (invoiceId) { conditions.push(`bd.invoice_id = $${idx++}`); params.push(invoiceId); }
        if (eInvoiceId) { conditions.push(`bd.e_invoice_id = $${idx++}`); params.push(eInvoiceId); }
        if (dateFrom) { conditions.push(`bd.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`bd.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }

        const where = 'WHERE ' + conditions.join(' AND ');

        const countSql = `SELECT COUNT(*) as total FROM billing_documents bd ${where}`;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT bd.*, up.full_name as uploaded_by_name,
                   i.invoice_code, ei.e_invoice_number
            FROM billing_documents bd
            LEFT JOIN user_profiles up ON bd.uploaded_by = up.user_id
            LEFT JOIN invoices i ON bd.invoice_id = i.invoices_id
            LEFT JOIN e_invoices ei ON bd.e_invoice_id = ei.e_invoice_id
            ${where}
            ORDER BY bd.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Chi tiết chứng từ */
    static async getDocumentById(documentId: string): Promise<BillingDocument | null> {
        const sql = `
            SELECT bd.*, up.full_name as uploaded_by_name,
                   i.invoice_code, ei.e_invoice_number
            FROM billing_documents bd
            LEFT JOIN user_profiles up ON bd.uploaded_by = up.user_id
            LEFT JOIN invoices i ON bd.invoice_id = i.invoices_id
            LEFT JOIN e_invoices ei ON bd.e_invoice_id = ei.e_invoice_id
            WHERE bd.document_id = $1
        `;
        const result = await pool.query(sql, [documentId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Xóa chứng từ (soft: set archived) */
    static async archiveDocument(documentId: string): Promise<void> {
        await pool.query(`UPDATE billing_documents SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP WHERE document_id = $1`, [documentId]);
    }

    /** Lưu trữ hàng loạt */
    static async archiveDocumentsBatch(documentIds: string[]): Promise<number> {
        const sql = `
            UPDATE billing_documents SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP
            WHERE document_id = ANY($1) AND is_archived = FALSE
        `;
        const result = await pool.query(sql, [documentIds]);
        return result.rowCount || 0;
    }

    // ═══════════════════════════════════════════════════
    // SEARCH & TIMELINE
    // ═══════════════════════════════════════════════════

    /**
     * Tìm kiếm hóa đơn nâng cao
     * Unified search trên cả invoices (nội bộ) JOIN e_invoices (HĐĐT)
     */
    static async searchInvoices(
        filters: any, page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<any>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (filters.search) {
            conditions.push(`(i.invoice_code ILIKE $${idx} OR ei.e_invoice_number ILIKE $${idx} OR ei.lookup_code ILIKE $${idx} OR p.full_name ILIKE $${idx})`);
            params.push(`%${filters.search}%`);
            idx++;
        }
        if (filters.invoice_code) { conditions.push(`i.invoice_code = $${idx++}`); params.push(filters.invoice_code); }
        if (filters.e_invoice_number) { conditions.push(`ei.e_invoice_number = $${idx++}`); params.push(filters.e_invoice_number); }
        if (filters.lookup_code) { conditions.push(`ei.lookup_code = $${idx++}`); params.push(filters.lookup_code); }
        if (filters.patient_id) { conditions.push(`i.patient_id = $${idx++}`); params.push(filters.patient_id); }
        if (filters.facility_id) { conditions.push(`i.facility_id = $${idx++}`); params.push(filters.facility_id); }
        if (filters.status) { conditions.push(`(i.status = $${idx} OR ei.status = $${idx})`); params.push(filters.status); idx++; }
        if (filters.invoice_type) { conditions.push(`ei.invoice_type = $${idx++}`); params.push(filters.invoice_type); }
        if (filters.date_from) { conditions.push(`i.created_at >= $${idx++}`); params.push(filters.date_from); }
        if (filters.date_to) { conditions.push(`i.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(filters.date_to); }
        if (filters.amount_from !== undefined) { conditions.push(`i.net_amount >= $${idx++}`); params.push(filters.amount_from); }
        if (filters.amount_to !== undefined) { conditions.push(`i.net_amount <= $${idx++}`); params.push(filters.amount_to); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `
            SELECT COUNT(*) as total
            FROM invoices i
            LEFT JOIN e_invoices ei ON i.invoices_id = ei.invoice_id AND ei.status NOT IN ('CANCELLED','REPLACED')
            LEFT JOIN patients p ON i.patient_id = p.id
            ${where}
        `;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT
                i.invoices_id, i.invoice_code, i.patient_id, i.status as invoice_status,
                i.total_amount, i.discount_amount, i.insurance_amount, i.net_amount, i.paid_amount,
                i.created_at as invoice_created_at,
                p.full_name as patient_name, p.patient_code,
                f.name as facility_name,
                ei.e_invoice_id, ei.e_invoice_number, ei.lookup_code,
                ei.invoice_type as e_invoice_type, ei.status as e_invoice_status,
                ei.total_after_tax, ei.issued_at, ei.signed_at
            FROM invoices i
            LEFT JOIN e_invoices ei ON i.invoices_id = ei.invoice_id AND ei.status NOT IN ('CANCELLED','REPLACED')
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN facilities f ON i.facility_id = f.facilities_id
            ${where}
            ORDER BY i.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Dòng thời gian hóa đơn
     * Gộp events từ invoices, payment_transactions, e_invoices, billing_documents
     */
    static async getInvoiceTimeline(invoiceId: string): Promise<any[]> {
        const events: any[] = [];

        /* 1. Invoice created */
        const invSql = `
            SELECT i.created_at, i.status, i.cancelled_at, i.cancelled_reason,
                   up.full_name as created_by_name, up2.full_name as cancelled_by_name
            FROM invoices i
            LEFT JOIN user_profiles up ON i.created_by = up.user_id
            LEFT JOIN user_profiles up2 ON i.cancelled_by = up2.user_id
            WHERE i.invoices_id = $1
        `;
        const invResult = await pool.query(invSql, [invoiceId]);
        if (invResult.rows.length > 0) {
            const inv = invResult.rows[0];
            events.push({ event_type: 'INVOICE_CREATED', event_at: inv.created_at, description: 'Tạo hóa đơn nội bộ', actor_name: inv.created_by_name, details: null });
            if (inv.cancelled_at) {
                events.push({ event_type: 'INVOICE_CANCELLED', event_at: inv.cancelled_at, description: `Hủy hóa đơn: ${inv.cancelled_reason}`, actor_name: inv.cancelled_by_name, details: null });
            }
        }

        /* 2. Payment transactions */
        const txnSql = `
            SELECT pt.paid_at, pt.transaction_type, pt.payment_method, pt.amount, pt.status,
                   up.full_name as cashier_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            WHERE pt.invoice_id = $1 ORDER BY pt.paid_at
        `;
        const txnResult = await pool.query(txnSql, [invoiceId]);
        for (const txn of txnResult.rows) {
            events.push({
                event_type: txn.transaction_type === 'PAYMENT' ? 'PAYMENT' : 'REFUND',
                event_at: txn.paid_at,
                description: `${txn.transaction_type === 'PAYMENT' ? 'Thanh toán' : 'Hoàn tiền'} ${txn.amount} VND qua ${txn.payment_method}`,
                actor_name: txn.cashier_name,
                details: { amount: txn.amount, method: txn.payment_method, status: txn.status },
            });
        }

        /* 3. E-Invoices */
        const eiSql = `
            SELECT ei.created_at, ei.issued_at, ei.signed_at, ei.cancelled_at, ei.status,
                   ei.e_invoice_number, ei.invoice_type, ei.cancel_reason,
                   up1.full_name as created_by_name, up2.full_name as signed_by_name, up3.full_name as cancelled_by_name
            FROM e_invoices ei
            LEFT JOIN user_profiles up1 ON ei.created_by = up1.user_id
            LEFT JOIN user_profiles up2 ON ei.signed_by = up2.user_id
            LEFT JOIN user_profiles up3 ON ei.cancelled_by = up3.user_id
            WHERE ei.invoice_id = $1 ORDER BY ei.created_at
        `;
        const eiResult = await pool.query(eiSql, [invoiceId]);
        for (const ei of eiResult.rows) {
            events.push({ event_type: 'EINVOICE_CREATED', event_at: ei.created_at, description: `Tạo HĐĐT ${ei.e_invoice_number} (${ei.invoice_type})`, actor_name: ei.created_by_name, details: null });
            if (ei.issued_at) events.push({ event_type: 'EINVOICE_ISSUED', event_at: ei.issued_at, description: `Phát hành HĐĐT ${ei.e_invoice_number}`, actor_name: ei.created_by_name, details: null });
            if (ei.signed_at) events.push({ event_type: 'EINVOICE_SIGNED', event_at: ei.signed_at, description: `Ký số HĐĐT ${ei.e_invoice_number}`, actor_name: ei.signed_by_name, details: null });
            if (ei.cancelled_at) events.push({ event_type: 'EINVOICE_CANCELLED', event_at: ei.cancelled_at, description: `Hủy HĐĐT: ${ei.cancel_reason}`, actor_name: ei.cancelled_by_name, details: null });
        }

        /* 4. Documents uploaded */
        const docSql = `
            SELECT bd.created_at, bd.document_type, bd.document_name, up.full_name as uploaded_by_name
            FROM billing_documents bd
            LEFT JOIN user_profiles up ON bd.uploaded_by = up.user_id
            WHERE bd.invoice_id = $1 ORDER BY bd.created_at
        `;
        const docResult = await pool.query(docSql, [invoiceId]);
        for (const doc of docResult.rows) {
            events.push({ event_type: 'DOCUMENT_UPLOADED', event_at: doc.created_at, description: `Upload chứng từ: ${doc.document_name}`, actor_name: doc.uploaded_by_name, details: { type: doc.document_type } });
        }

        /* Sắp xếp theo thời gian */
        events.sort((a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime());
        return events;
    }

    // ═══════════════════════════════════════════════════
    // PRINT HISTORY
    // ═══════════════════════════════════════════════════

    /** Lịch sử chứng từ liên quan HĐĐT (documents gắn e_invoice_id) */
    static async getPrintHistory(eInvoiceId: string): Promise<BillingDocument[]> {
        const sql = `
            SELECT bd.*, up.full_name as uploaded_by_name
            FROM billing_documents bd
            LEFT JOIN user_profiles up ON bd.uploaded_by = up.user_id
            WHERE bd.e_invoice_id = $1 ORDER BY bd.created_at DESC
        `;
        const result = await pool.query(sql, [eInvoiceId]);
        return result.rows;
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    static async getInvoiceWithDetails(invoiceId: string): Promise<any | null> {
        const sql = `
            SELECT i.*, p.full_name as patient_name, p.patient_code, p.address as patient_address,
                   p.email as patient_email,
                   f.name as facility_name, f.address as facility_address,
                   up.full_name as created_by_name
            FROM invoices i
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN facilities f ON i.facility_id = f.facilities_id
            LEFT JOIN user_profiles up ON i.created_by = up.user_id
            WHERE i.invoices_id = $1
        `;
        const result = await pool.query(sql, [invoiceId]);
        if (result.rows.length === 0) return null;

        const itemsSql = 'SELECT * FROM invoice_details WHERE invoice_id = $1 ORDER BY invoice_details_id';
        const items = await pool.query(itemsSql, [invoiceId]);
        result.rows[0].items = items.rows;

        return result.rows[0];
    }

    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM facilities WHERE facilities_id = $1', [facilityId]);
        return r.rows.length > 0;
    }
}
