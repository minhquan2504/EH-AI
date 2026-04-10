import { randomUUID } from 'crypto';
import { BillingDocumentRepository } from '../../repository/Billing/billing-document.repository';
import {
    EInvoice,
    EInvoiceItem,
    BillingDocument,
    EInvoiceConfig,
    CreateEInvoiceInput,
    CreateVATInvoiceInput,
    CancelEInvoiceInput,
    ReplaceEInvoiceInput,
    AdjustEInvoiceInput,
    UploadDocumentInput,
    InvoiceSearchFilters,
    InvoiceTimelineEvent,
    PaginatedResult,
} from '../../models/Billing/billing-document.model';
import {
    BILLING_DOC_ERRORS,
    BILLING_DOC_CONFIG,
    E_INVOICE_STATUS,
    E_INVOICE_TYPE,
    BUYER_TYPE,
    VALID_TAX_RATES,
    VALID_DOCUMENT_TYPES,
    ADJUSTMENT_TYPE,
    UPLOAD_SOURCE,
} from '../../constants/billing-document.constant';

export class BillingDocumentService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /** Sinh số HĐĐT liên tục 8 chữ số: 00000001, 00000002... */
    private static formatInvoiceNumber(num: number): string {
        return num.toString().padStart(BILLING_DOC_CONFIG.EINVOICE_NUMBER_LENGTH, '0');
    }

    /** Sinh mã tra cứu CQT (giả lập) */
    private static generateLookupCode(): string {
        return randomUUID().substring(0, 12).replace(/-/g, '').toUpperCase();
    }

    /** Sinh document code: DOC-YYYYMMDD-XXXX */
    private static generateDocCode(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${BILLING_DOC_CONFIG.DOC_CODE_PREFIX}-${dateStr}-${rand}`;
    }

    /**
     * Chuyển số tiền sang chữ (Tiếng Việt)
     * Đơn giản hóa — chỉ đúng cho số dưới 1 tỷ
     */
    private static amountToWords(amount: number): string {
        if (amount === 0) return 'Không đồng';
        const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
        const groups = ['', 'nghìn', 'triệu', 'tỷ'];
        const readThreeDigits = (n: number): string => {
            const h = Math.floor(n / 100);
            const t = Math.floor((n % 100) / 10);
            const u = n % 10;
            let s = '';
            if (h > 0) s += units[h] + ' trăm ';
            if (t > 1) s += units[t] + ' mươi ';
            else if (t === 1) s += 'mười ';
            else if (t === 0 && h > 0 && u > 0) s += 'lẻ ';
            if (u === 5 && t >= 1) s += 'lăm ';
            else if (u === 1 && t > 1) s += 'mốt ';
            else if (u > 0) s += units[u] + ' ';
            return s.trim();
        };
        const parts: string[] = [];
        let remaining = Math.floor(amount);
        let groupIdx = 0;
        while (remaining > 0) {
            const chunk = remaining % 1000;
            if (chunk > 0) parts.unshift(`${readThreeDigits(chunk)} ${groups[groupIdx]}`.trim());
            remaining = Math.floor(remaining / 1000);
            groupIdx++;
        }
        return parts.join(' ').replace(/\s+/g, ' ').trim() + ' đồng';
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: HÓA ĐƠN ĐIỆN TỬ
    // ═══════════════════════════════════════════════════

    /**
     * Tạo HĐĐT từ HĐ nội bộ (invoices)
     * Auto-fill seller info từ e_invoice_config, snapshot buyer info, copy items
     */
    static async createEInvoice(
        input: CreateEInvoiceInput, userId: string
    ): Promise<EInvoice> {
        /* 1. Kiểm tra HĐ nội bộ */
        const invoice = await BillingDocumentRepository.getInvoiceWithDetails(input.invoice_id);
        if (!invoice) throw BILLING_DOC_ERRORS.INVOICE_NOT_FOUND;
        if (invoice.status !== 'PAID' && invoice.status !== 'PARTIAL') throw BILLING_DOC_ERRORS.INVOICE_NOT_PAID;

        /* 2. Kiểm tra chưa có HĐĐT */
        const exists = await BillingDocumentRepository.checkEInvoiceExists(input.invoice_id);
        if (exists) throw BILLING_DOC_ERRORS.EINVOICE_ALREADY_EXISTS;

        /* 3. Lấy cấu hình cơ sở */
        const config = await BillingDocumentRepository.getConfig(input.facility_id);
        if (!config) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;
        if (!config.is_active) throw BILLING_DOC_ERRORS.CONFIG_INACTIVE;

        const client = await BillingDocumentRepository.getClient();
        try {
            await client.query('BEGIN');

            /* 4. Sinh số HĐĐT liên tục */
            const nextNum = await BillingDocumentRepository.incrementInvoiceNumber(input.facility_id, client);
            const eInvNumber = this.formatInvoiceNumber(nextNum);

            /* 5. Tính thuế */
            const taxRate = input.tax_rate ?? parseFloat(config.tax_rate_default);
            const totalBeforeTax = parseFloat(invoice.net_amount);
            const discountAmt = parseFloat(invoice.discount_amount) || 0;
            const taxAmount = Math.round(totalBeforeTax * taxRate / 100);
            const totalAfterTax = totalBeforeTax + taxAmount;

            /* 6. Tạo HĐĐT */
            const eInvoiceId = this.generateId('EIV');
            const eInvoice = await BillingDocumentRepository.createEInvoice({
                e_invoice_id: eInvoiceId,
                e_invoice_number: eInvNumber,
                invoice_template: config.invoice_template,
                invoice_series: config.invoice_series,
                lookup_code: this.generateLookupCode(),
                invoice_id: input.invoice_id,
                payment_transaction_id: input.payment_transaction_id || null,
                invoice_type: E_INVOICE_TYPE.SALES,
                seller_name: config.seller_name,
                seller_tax_code: config.seller_tax_code,
                seller_address: config.seller_address,
                seller_phone: config.seller_phone,
                seller_bank_account: config.seller_bank_account,
                seller_bank_name: config.seller_bank_name,
                buyer_name: input.buyer_name || invoice.patient_name,
                buyer_address: input.buyer_address || invoice.patient_address,
                buyer_email: input.buyer_email || invoice.patient_email,
                buyer_type: BUYER_TYPE.INDIVIDUAL,
                total_before_tax: totalBeforeTax.toFixed(2),
                tax_rate: taxRate.toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                total_after_tax: totalAfterTax.toFixed(2),
                discount_amount: discountAmt.toFixed(2),
                payment_method_text: input.payment_method_text || null,
                amount_in_words: this.amountToWords(totalAfterTax),
                status: E_INVOICE_STATUS.DRAFT,
                notes: input.notes || null,
                currency: config.currency_default,
                facility_id: input.facility_id,
                branch_id: input.branch_id || null,
                created_by: userId,
            } as any, client);

            /* 7. Copy items từ invoice_details → e_invoice_items */
            const items = (invoice.items || []).map((item: any, idx: number) => {
                const qty = item.quantity || 1;
                const price = parseFloat(item.unit_price) || 0;
                const disc = parseFloat(item.discount_amount) || 0;
                const beforeTax = qty * price - disc;
                const itemTax = Math.round(beforeTax * taxRate / 100);
                return {
                    item_id: this.generateId('EITI'),
                    e_invoice_id: eInvoiceId,
                    line_number: idx + 1,
                    item_name: item.item_name,
                    unit: 'Lần',
                    quantity: qty,
                    unit_price: price,
                    discount_amount: disc,
                    amount_before_tax: beforeTax,
                    tax_rate: taxRate,
                    tax_amount: itemTax,
                    amount_after_tax: beforeTax + itemTax,
                    reference_type: item.reference_type,
                    reference_id: item.reference_id,
                };
            });

            if (items.length > 0) {
                await BillingDocumentRepository.createEInvoiceItems(items, client);
            }

            await client.query('COMMIT');
            return (await BillingDocumentRepository.getEInvoiceById(eInvoiceId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tạo HĐ VAT — buyer_type = COMPANY, yêu cầu thông tin thuế doanh nghiệp
     */
    static async createVATInvoice(
        input: CreateVATInvoiceInput, userId: string
    ): Promise<EInvoice> {
        if (!input.buyer_tax_code) throw BILLING_DOC_ERRORS.BUYER_TAX_CODE_REQUIRED;
        if (!input.buyer_name) throw BILLING_DOC_ERRORS.BUYER_NAME_REQUIRED;
        if (!input.buyer_address) throw BILLING_DOC_ERRORS.BUYER_ADDRESS_REQUIRED;

        const invoice = await BillingDocumentRepository.getInvoiceWithDetails(input.invoice_id);
        if (!invoice) throw BILLING_DOC_ERRORS.INVOICE_NOT_FOUND;
        if (invoice.status !== 'PAID' && invoice.status !== 'PARTIAL') throw BILLING_DOC_ERRORS.INVOICE_NOT_PAID;

        const exists = await BillingDocumentRepository.checkEInvoiceExists(input.invoice_id);
        if (exists) throw BILLING_DOC_ERRORS.EINVOICE_ALREADY_EXISTS;

        const config = await BillingDocumentRepository.getConfig(input.facility_id);
        if (!config) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;
        if (!config.is_active) throw BILLING_DOC_ERRORS.CONFIG_INACTIVE;

        const taxRate = input.tax_rate ?? parseFloat(config.tax_rate_default);
        if (!VALID_TAX_RATES.includes(taxRate as any)) throw BILLING_DOC_ERRORS.INVALID_TAX_RATE;

        const client = await BillingDocumentRepository.getClient();
        try {
            await client.query('BEGIN');

            const nextNum = await BillingDocumentRepository.incrementInvoiceNumber(input.facility_id, client);
            const eInvNumber = this.formatInvoiceNumber(nextNum);

            const totalBeforeTax = parseFloat(invoice.net_amount);
            const discountAmt = parseFloat(invoice.discount_amount) || 0;
            const taxAmount = Math.round(totalBeforeTax * taxRate / 100);
            const totalAfterTax = totalBeforeTax + taxAmount;

            const eInvoiceId = this.generateId('EIV');
            await BillingDocumentRepository.createEInvoice({
                e_invoice_id: eInvoiceId,
                e_invoice_number: eInvNumber,
                invoice_template: config.invoice_template,
                invoice_series: config.invoice_series,
                lookup_code: this.generateLookupCode(),
                invoice_id: input.invoice_id,
                payment_transaction_id: input.payment_transaction_id || null,
                invoice_type: E_INVOICE_TYPE.VAT,
                seller_name: config.seller_name,
                seller_tax_code: config.seller_tax_code,
                seller_address: config.seller_address,
                seller_phone: config.seller_phone,
                seller_bank_account: config.seller_bank_account,
                seller_bank_name: config.seller_bank_name,
                buyer_name: input.buyer_name,
                buyer_tax_code: input.buyer_tax_code,
                buyer_address: input.buyer_address,
                buyer_email: input.buyer_email || null,
                buyer_type: BUYER_TYPE.COMPANY,
                total_before_tax: totalBeforeTax.toFixed(2),
                tax_rate: taxRate.toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                total_after_tax: totalAfterTax.toFixed(2),
                discount_amount: discountAmt.toFixed(2),
                payment_method_text: input.payment_method_text || null,
                amount_in_words: this.amountToWords(totalAfterTax),
                status: E_INVOICE_STATUS.DRAFT,
                notes: input.notes || null,
                currency: config.currency_default,
                facility_id: input.facility_id,
                branch_id: input.branch_id || null,
                created_by: userId,
            } as any, client);

            /* Copy items */
            const items = (invoice.items || []).map((item: any, idx: number) => {
                const qty = item.quantity || 1;
                const price = parseFloat(item.unit_price) || 0;
                const disc = parseFloat(item.discount_amount) || 0;
                const beforeTax = qty * price - disc;
                const itemTax = Math.round(beforeTax * taxRate / 100);
                return {
                    item_id: this.generateId('EITI'),
                    e_invoice_id: eInvoiceId,
                    line_number: idx + 1,
                    item_name: item.item_name,
                    unit: 'Lần',
                    quantity: qty,
                    unit_price: price,
                    discount_amount: disc,
                    amount_before_tax: beforeTax,
                    tax_rate: taxRate,
                    tax_amount: itemTax,
                    amount_after_tax: beforeTax + itemTax,
                    reference_type: item.reference_type,
                    reference_id: item.reference_id,
                };
            });
            if (items.length > 0) {
                await BillingDocumentRepository.createEInvoiceItems(items, client);
            }

            await client.query('COMMIT');
            return (await BillingDocumentRepository.getEInvoiceById(eInvoiceId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Phát hành HĐĐT: DRAFT → ISSUED */
    static async issueEInvoice(eInvoiceId: string): Promise<EInvoice> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;
        if (ei.status !== E_INVOICE_STATUS.DRAFT) throw BILLING_DOC_ERRORS.EINVOICE_NOT_DRAFT;

        return await BillingDocumentRepository.updateEInvoiceStatus(
            eInvoiceId, E_INVOICE_STATUS.ISSUED, { issued_at: new Date() }
        );
    }

    /** Ký số HĐĐT: ISSUED → SIGNED */
    static async signEInvoice(eInvoiceId: string, userId: string): Promise<EInvoice> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;
        if (ei.status !== E_INVOICE_STATUS.ISSUED) throw BILLING_DOC_ERRORS.EINVOICE_NOT_ISSUED;

        return await BillingDocumentRepository.updateEInvoiceStatus(
            eInvoiceId, E_INVOICE_STATUS.SIGNED, { signed_at: new Date(), signed_by: userId }
        );
    }

    /** Gửi HĐĐT: SIGNED → SENT */
    static async sendEInvoice(eInvoiceId: string): Promise<EInvoice> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;
        if (ei.status !== E_INVOICE_STATUS.SIGNED) throw BILLING_DOC_ERRORS.EINVOICE_NOT_SIGNED;

        return await BillingDocumentRepository.updateEInvoiceStatus(eInvoiceId, E_INVOICE_STATUS.SENT);
    }

    /** Hủy HĐĐT: ISSUED/SIGNED/SENT → CANCELLED */
    static async cancelEInvoice(
        eInvoiceId: string, input: CancelEInvoiceInput, userId: string
    ): Promise<EInvoice> {
        if (!input.cancel_reason) throw BILLING_DOC_ERRORS.CANCEL_REASON_REQUIRED;
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;

        const cancelable = [E_INVOICE_STATUS.ISSUED, E_INVOICE_STATUS.SIGNED, E_INVOICE_STATUS.SENT];
        if (!cancelable.includes(ei.status as any)) throw BILLING_DOC_ERRORS.EINVOICE_CANNOT_CANCEL;

        return await BillingDocumentRepository.updateEInvoiceStatus(
            eInvoiceId, E_INVOICE_STATUS.CANCELLED,
            { cancelled_at: new Date(), cancelled_by: userId, cancel_reason: input.cancel_reason }
        );
    }

    /**
     * Thay thế HĐĐT — Hủy HĐ cũ + tạo HĐ mới thay thế
     * HĐ cũ status = REPLACED, HĐ mới ghi adjustment_for_id = HĐ cũ
     */
    static async replaceEInvoice(
        eInvoiceId: string, input: ReplaceEInvoiceInput, userId: string
    ): Promise<EInvoice> {
        if (!input.cancel_reason) throw BILLING_DOC_ERRORS.CANCEL_REASON_REQUIRED;
        const oldEi = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!oldEi) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;

        const replaceable = [E_INVOICE_STATUS.ISSUED, E_INVOICE_STATUS.SIGNED, E_INVOICE_STATUS.SENT];
        if (!replaceable.includes(oldEi.status as any)) throw BILLING_DOC_ERRORS.EINVOICE_CANNOT_REPLACE;

        if (!oldEi.facility_id) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;
        const config = await BillingDocumentRepository.getConfig(oldEi.facility_id);
        if (!config) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;

        const client = await BillingDocumentRepository.getClient();
        try {
            await client.query('BEGIN');

            /* Đánh dấu HĐ cũ = REPLACED */
            const newEInvoiceId = this.generateId('EIV');
            await BillingDocumentRepository.updateEInvoiceStatus(
                eInvoiceId, E_INVOICE_STATUS.REPLACED,
                { cancelled_at: new Date(), cancelled_by: userId, cancel_reason: input.cancel_reason, replaced_by_id: newEInvoiceId }
            );

            /* Sinh số HĐĐT mới */
            const nextNum = await BillingDocumentRepository.incrementInvoiceNumber(oldEi.facility_id, client);
            const eInvNumber = this.formatInvoiceNumber(nextNum);

            /* Tạo HĐ mới thay thế */
            const taxRate = input.tax_rate ?? parseFloat(oldEi.tax_rate);
            const totalBeforeTax = parseFloat(oldEi.total_before_tax);
            const taxAmount = Math.round(totalBeforeTax * taxRate / 100);
            const totalAfterTax = totalBeforeTax + taxAmount;

            await BillingDocumentRepository.createEInvoice({
                e_invoice_id: newEInvoiceId,
                e_invoice_number: eInvNumber,
                invoice_template: config.invoice_template,
                invoice_series: config.invoice_series,
                lookup_code: this.generateLookupCode(),
                invoice_id: oldEi.invoice_id,
                payment_transaction_id: oldEi.payment_transaction_id,
                invoice_type: oldEi.invoice_type,
                seller_name: config.seller_name,
                seller_tax_code: config.seller_tax_code,
                seller_address: config.seller_address,
                seller_phone: config.seller_phone,
                seller_bank_account: config.seller_bank_account,
                seller_bank_name: config.seller_bank_name,
                buyer_name: input.buyer_name || oldEi.buyer_name,
                buyer_tax_code: input.buyer_tax_code || oldEi.buyer_tax_code,
                buyer_address: input.buyer_address || oldEi.buyer_address,
                buyer_email: input.buyer_email || oldEi.buyer_email,
                buyer_type: oldEi.buyer_type,
                total_before_tax: totalBeforeTax.toFixed(2),
                tax_rate: taxRate.toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                total_after_tax: totalAfterTax.toFixed(2),
                discount_amount: oldEi.discount_amount,
                payment_method_text: input.payment_method_text || oldEi.payment_method_text,
                amount_in_words: this.amountToWords(totalAfterTax),
                adjustment_for_id: eInvoiceId,
                status: E_INVOICE_STATUS.DRAFT,
                notes: input.notes || `Thay thế cho HĐĐT ${oldEi.e_invoice_number}`,
                currency: oldEi.currency,
                facility_id: oldEi.facility_id,
                branch_id: oldEi.branch_id,
                created_by: userId,
            } as any, client);

            /* Copy items (dùng items mới nếu có, ko thì copy từ HĐ cũ) */
            const sourceItems = input.items && input.items.length > 0 ? input.items.map((item, idx) => {
                const qty = item.quantity || 1;
                const price = item.unit_price || 0;
                const disc = item.discount_amount || 0;
                const beforeTax = qty * price - disc;
                const itemTaxRate = item.tax_rate ?? taxRate;
                const itemTax = Math.round(beforeTax * itemTaxRate / 100);
                return {
                    item_id: this.generateId('EITI'),
                    e_invoice_id: newEInvoiceId,
                    line_number: idx + 1,
                    item_name: item.item_name,
                    unit: item.unit || 'Lần',
                    quantity: qty,
                    unit_price: price,
                    discount_amount: disc,
                    amount_before_tax: beforeTax,
                    tax_rate: itemTaxRate,
                    tax_amount: itemTax,
                    amount_after_tax: beforeTax + itemTax,
                    reference_type: item.reference_type || null,
                    reference_id: item.reference_id || null,
                    notes: item.notes || null,
                };
            }) : (oldEi.items || []).map((item: any, idx: number) => ({
                ...item,
                item_id: this.generateId('EITI'),
                e_invoice_id: newEInvoiceId,
                line_number: idx + 1,
            }));

            if (sourceItems.length > 0) {
                await BillingDocumentRepository.createEInvoiceItems(sourceItems, client);
            }

            await client.query('COMMIT');
            return (await BillingDocumentRepository.getEInvoiceById(newEInvoiceId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Điều chỉnh HĐĐT — Tạo HĐ điều chỉnh tăng/giảm
     * Chỉ ghi chênh lệch, không copy full items
     */
    static async adjustEInvoice(
        eInvoiceId: string, input: AdjustEInvoiceInput, userId: string
    ): Promise<EInvoice> {
        if (!input.adjustment_type || !Object.values(ADJUSTMENT_TYPE).includes(input.adjustment_type as any)) {
            throw BILLING_DOC_ERRORS.ADJUSTMENT_TYPE_REQUIRED;
        }
        if (!input.cancel_reason) throw BILLING_DOC_ERRORS.CANCEL_REASON_REQUIRED;

        const oldEi = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!oldEi) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;

        const adjustable = [E_INVOICE_STATUS.SIGNED, E_INVOICE_STATUS.SENT];
        if (!adjustable.includes(oldEi.status as any)) throw BILLING_DOC_ERRORS.EINVOICE_CANNOT_ADJUST;

        if (!oldEi.facility_id) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;
        const config = await BillingDocumentRepository.getConfig(oldEi.facility_id);
        if (!config) throw BILLING_DOC_ERRORS.CONFIG_NOT_FOUND;

        /* Đánh dấu HĐ gốc ADJUSTED */
        await BillingDocumentRepository.updateEInvoiceStatus(
            eInvoiceId, E_INVOICE_STATUS.ADJUSTED,
            { cancelled_at: new Date(), cancelled_by: userId, cancel_reason: input.cancel_reason }
        );

        const client = await BillingDocumentRepository.getClient();
        try {
            await client.query('BEGIN');

            const nextNum = await BillingDocumentRepository.incrementInvoiceNumber(oldEi.facility_id, client);
            const eInvNumber = this.formatInvoiceNumber(nextNum);

            const taxRate = parseFloat(oldEi.tax_rate);
            const adjustAmt = input.adjust_amount;
            const sign = input.adjustment_type === ADJUSTMENT_TYPE.INCREASE ? 1 : -1;
            const taxAmount = Math.round(adjustAmt * taxRate / 100);
            const totalAfterTax = adjustAmt + taxAmount;

            const newId = this.generateId('EIV');
            await BillingDocumentRepository.createEInvoice({
                e_invoice_id: newId,
                e_invoice_number: eInvNumber,
                invoice_template: config.invoice_template,
                invoice_series: config.invoice_series,
                lookup_code: this.generateLookupCode(),
                invoice_id: oldEi.invoice_id,
                invoice_type: oldEi.invoice_type,
                seller_name: config.seller_name,
                seller_tax_code: config.seller_tax_code,
                seller_address: config.seller_address,
                seller_phone: config.seller_phone,
                seller_bank_account: config.seller_bank_account,
                seller_bank_name: config.seller_bank_name,
                buyer_name: oldEi.buyer_name,
                buyer_tax_code: oldEi.buyer_tax_code,
                buyer_address: oldEi.buyer_address,
                buyer_email: oldEi.buyer_email,
                buyer_type: oldEi.buyer_type,
                total_before_tax: (sign * adjustAmt).toFixed(2),
                tax_rate: taxRate.toFixed(2),
                tax_amount: (sign * taxAmount).toFixed(2),
                total_after_tax: (sign * totalAfterTax).toFixed(2),
                discount_amount: '0',
                payment_method_text: oldEi.payment_method_text,
                amount_in_words: this.amountToWords(totalAfterTax),
                adjustment_for_id: eInvoiceId,
                adjustment_type: input.adjustment_type,
                status: E_INVOICE_STATUS.DRAFT,
                notes: input.notes || `Điều chỉnh ${input.adjustment_type === ADJUSTMENT_TYPE.INCREASE ? 'tăng' : 'giảm'} cho HĐĐT ${oldEi.e_invoice_number}`,
                currency: oldEi.currency,
                facility_id: oldEi.facility_id,
                branch_id: oldEi.branch_id,
                created_by: userId,
            } as any, client);

            /* Tạo 1 dòng item điều chỉnh */
            await BillingDocumentRepository.createEInvoiceItems([{
                item_id: this.generateId('EITI'),
                e_invoice_id: newId,
                line_number: 1,
                item_name: `Điều chỉnh ${input.adjustment_type === ADJUSTMENT_TYPE.INCREASE ? 'tăng' : 'giảm'}`,
                unit: 'Lần',
                quantity: 1,
                unit_price: (sign * adjustAmt).toString(),
                discount_amount: '0',
                amount_before_tax: (sign * adjustAmt).toString(),
                tax_rate: taxRate.toString(),
                tax_amount: (sign * taxAmount).toString(),
                amount_after_tax: (sign * totalAfterTax).toString(),
            } as any], client);

            await client.query('COMMIT');
            return (await BillingDocumentRepository.getEInvoiceById(newId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Chi tiết HĐĐT (kèm items + documents) */
    static async getEInvoiceById(eInvoiceId: string): Promise<EInvoice> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;
        return ei;
    }

    /** Danh sách HĐĐT */
    static async getEInvoices(
        facilityId?: string, status?: string, invoiceType?: string,
        dateFrom?: string, dateTo?: string, search?: string,
        page: number = BILLING_DOC_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_DOC_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<EInvoice>> {
        const safeLimit = Math.min(limit, BILLING_DOC_CONFIG.MAX_LIMIT);
        return await BillingDocumentRepository.getEInvoices(facilityId, status, invoiceType, dateFrom, dateTo, search, page, safeLimit);
    }

    /** Tra cứu HĐĐT theo mã CQT */
    static async getEInvoiceByLookupCode(code: string): Promise<EInvoice> {
        const ei = await BillingDocumentRepository.getEInvoiceByLookupCode(code);
        if (!ei) throw BILLING_DOC_ERRORS.LOOKUP_CODE_NOT_FOUND;
        return ei;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: IN HÓA ĐƠN
    // ═══════════════════════════════════════════════════

    /**
     * Chuẩn bị dữ liệu in HĐĐT
     * Client dùng data này để render template in (PDF/HTML)
     */
    static async generatePrintData(eInvoiceId: string): Promise<any> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;

        return {
            invoice_info: {
                e_invoice_number: ei.e_invoice_number,
                invoice_template: ei.invoice_template,
                invoice_series: ei.invoice_series,
                lookup_code: ei.lookup_code,
                invoice_type: ei.invoice_type,
                issued_at: ei.issued_at,
                signed_at: ei.signed_at,
                currency: ei.currency,
            },
            seller: {
                name: ei.seller_name,
                tax_code: ei.seller_tax_code,
                address: ei.seller_address,
                phone: ei.seller_phone,
                bank_account: ei.seller_bank_account,
                bank_name: ei.seller_bank_name,
            },
            buyer: {
                name: ei.buyer_name,
                tax_code: ei.buyer_tax_code,
                address: ei.buyer_address,
                email: ei.buyer_email,
                type: ei.buyer_type,
            },
            items: (ei.items || []).map(item => ({
                line_number: item.line_number,
                item_name: item.item_name,
                unit: item.unit,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: item.discount_amount,
                amount_before_tax: item.amount_before_tax,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                amount_after_tax: item.amount_after_tax,
            })),
            totals: {
                total_before_tax: ei.total_before_tax,
                discount_amount: ei.discount_amount,
                tax_rate: ei.tax_rate,
                tax_amount: ei.tax_amount,
                total_after_tax: ei.total_after_tax,
                amount_in_words: ei.amount_in_words,
            },
            payment: {
                method_text: ei.payment_method_text,
            },
            status: ei.status,
            notes: ei.notes,
        };
    }

    /** Lịch sử in HĐĐT */
    static async getPrintHistory(eInvoiceId: string): Promise<BillingDocument[]> {
        const ei = await BillingDocumentRepository.getEInvoiceById(eInvoiceId);
        if (!ei) throw BILLING_DOC_ERRORS.EINVOICE_NOT_FOUND;
        return await BillingDocumentRepository.getPrintHistory(eInvoiceId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: TRA CỨU
    // ═══════════════════════════════════════════════════

    /** Tìm kiếm hóa đơn nâng cao (unified) */
    static async searchInvoices(
        filters: InvoiceSearchFilters,
        page: number = BILLING_DOC_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_DOC_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<any>> {
        const safeLimit = Math.min(limit, BILLING_DOC_CONFIG.MAX_LIMIT);
        return await BillingDocumentRepository.searchInvoices(filters, page, safeLimit);
    }

    /** Dòng thời gian hóa đơn */
    static async getInvoiceTimeline(invoiceId: string): Promise<InvoiceTimelineEvent[]> {
        return await BillingDocumentRepository.getInvoiceTimeline(invoiceId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: CHỨNG TỪ
    // ═══════════════════════════════════════════════════

    /** Upload chứng từ */
    static async uploadDocument(
        input: UploadDocumentInput, userId: string
    ): Promise<BillingDocument> {
        if (!VALID_DOCUMENT_TYPES.includes(input.document_type as any)) {
            throw BILLING_DOC_ERRORS.INVALID_DOCUMENT_TYPE;
        }
        if (!input.file_url) throw BILLING_DOC_ERRORS.FILE_URL_REQUIRED;

        const docId = this.generateId('DOC');
        const docCode = this.generateDocCode();
        return await BillingDocumentRepository.createDocument(docId, docCode, input, userId);
    }

    /** Danh sách chứng từ */
    static async getDocuments(
        documentType?: string, invoiceId?: string, eInvoiceId?: string,
        dateFrom?: string, dateTo?: string, isArchived: boolean = false,
        page: number = BILLING_DOC_CONFIG.DEFAULT_PAGE,
        limit: number = BILLING_DOC_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<BillingDocument>> {
        const safeLimit = Math.min(limit, BILLING_DOC_CONFIG.MAX_LIMIT);
        return await BillingDocumentRepository.getDocuments(documentType, invoiceId, eInvoiceId, dateFrom, dateTo, isArchived, page, safeLimit);
    }

    /** Chi tiết chứng từ */
    static async getDocumentById(documentId: string): Promise<BillingDocument> {
        const doc = await BillingDocumentRepository.getDocumentById(documentId);
        if (!doc) throw BILLING_DOC_ERRORS.DOCUMENT_NOT_FOUND;
        return doc;
    }

    /** Xóa chứng từ (soft archive) */
    static async deleteDocument(documentId: string): Promise<void> {
        const doc = await BillingDocumentRepository.getDocumentById(documentId);
        if (!doc) throw BILLING_DOC_ERRORS.DOCUMENT_NOT_FOUND;
        if (doc.is_archived) throw BILLING_DOC_ERRORS.DOCUMENT_ARCHIVED;
        await BillingDocumentRepository.archiveDocument(documentId);
    }

    /** Lưu trữ hàng loạt */
    static async archiveDocuments(documentIds: string[]): Promise<number> {
        return await BillingDocumentRepository.archiveDocumentsBatch(documentIds);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 5: CẤU HÌNH HĐĐT
    // ═══════════════════════════════════════════════════

    /** Lấy cấu hình HĐĐT theo cơ sở */
    static async getConfig(facilityId: string): Promise<EInvoiceConfig | null> {
        const exists = await BillingDocumentRepository.checkFacilityExists(facilityId);
        if (!exists) throw BILLING_DOC_ERRORS.FACILITY_NOT_FOUND;
        return await BillingDocumentRepository.getConfig(facilityId);
    }

    /** Tạo/cập nhật cấu hình HĐĐT */
    static async upsertConfig(
        facilityId: string, input: any, userId: string
    ): Promise<EInvoiceConfig> {
        const exists = await BillingDocumentRepository.checkFacilityExists(facilityId);
        if (!exists) throw BILLING_DOC_ERRORS.FACILITY_NOT_FOUND;

        const configId = this.generateId('EIC');
        return await BillingDocumentRepository.upsertConfig(configId, facilityId, input, userId);
    }
}
