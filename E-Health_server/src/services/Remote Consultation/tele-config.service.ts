import { TeleConfigRepository } from '../../repository/Remote Consultation/tele-config.repository';
import {
    UpdateConfigInput, BatchUpdateInput, CreatePricingInput, PricingFilter,
} from '../../models/Remote Consultation/tele-config.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_CFG_ERRORS } from '../../constants/remote-consultation.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho cấu hình & quản trị hệ thống teleconsultation
 */
export class TeleConfigService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: CẤU HÌNH HỆ THỐNG
    // ═══════════════════════════════════════════════════

    /** DS configs */
    static async getAllConfigs(category?: string): Promise<any[]> {
        return await TeleConfigRepository.getAllConfigs(category);
    }

    /** Lấy 1 config */
    static async getConfig(configKey: string): Promise<any> {
        const config = await TeleConfigRepository.getConfig(configKey);
        if (!config) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_CFG_ERRORS.CONFIG_NOT_FOUND.code, TELE_CFG_ERRORS.CONFIG_NOT_FOUND.message);
        }
        return config;
    }

    /** Cập nhật 1 config */
    static async updateConfig(configKey: string, userId: string, input: UpdateConfigInput): Promise<void> {
        const config = await TeleConfigRepository.getConfig(configKey);
        if (!config) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_CFG_ERRORS.CONFIG_NOT_FOUND.code, TELE_CFG_ERRORS.CONFIG_NOT_FOUND.message);
        }
        if (!config.is_editable) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, TELE_CFG_ERRORS.CONFIG_NOT_EDITABLE.code, TELE_CFG_ERRORS.CONFIG_NOT_EDITABLE.message);
        }

        // Ghi audit log
        await TeleConfigRepository.writeAuditLog(configKey, config.config_value, input.config_value, userId);
        await TeleConfigRepository.updateConfig(configKey, input.config_value, userId);
    }

    /** Batch update */
    static async batchUpdate(userId: string, input: BatchUpdateInput): Promise<{ updated: number; skipped: string[] }> {
        let updated = 0;
        const skipped: string[] = [];

        for (const item of input.configs) {
            const config = await TeleConfigRepository.getConfig(item.config_key);
            if (!config) { skipped.push(`${item.config_key} (not found)`); continue; }
            if (!config.is_editable) { skipped.push(`${item.config_key} (not editable)`); continue; }

            await TeleConfigRepository.writeAuditLog(item.config_key, config.config_value, item.config_value, userId);
            await TeleConfigRepository.updateConfig(item.config_key, item.config_value, userId);
            updated++;
        }

        return { updated, skipped };
    }

    /** Reset configs về giá trị mặc định (re-run seed) */
    static async resetDefaults(userId: string): Promise<void> {
        // Lấy tất cả configs hiện tại để ghi audit
        const allConfigs = await TeleConfigRepository.getAllConfigs();
        for (const c of allConfigs) {
            if (c.is_editable) {
                await TeleConfigRepository.writeAuditLog(c.config_key, c.config_value, '[RESET TO DEFAULT]', userId);
            }
        }
        // Thực tế reset = user chạy lại seed SQL. Ở đây chỉ ghi audit.
    }

    /** Audit log */
    static async getAuditLog(page: number, limit: number, configKey?: string): Promise<any> {
        return await TeleConfigRepository.getAuditLog(page, limit, configKey);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: CHI PHÍ DỊCH VỤ
    // ═══════════════════════════════════════════════════

    /** Tạo pricing */
    static async createPricing(userId: string, input: CreatePricingInput): Promise<any> {
        const pricingId = `TP_${uuidv4().substring(0, 12)}`;
        try {
            return await TeleConfigRepository.createPricing({
                pricing_id: pricingId,
                type_id: input.type_id,
                specialty_id: input.specialty_id || null,
                facility_id: input.facility_id || null,
                base_price: input.base_price,
                currency: input.currency || 'VND',
                discount_percent: input.discount_percent || 0,
                effective_from: input.effective_from,
                effective_to: input.effective_to || null,
                created_by: userId,
            });
        } catch (err: any) {
            if (err.code === '23505') {
                throw new AppError(HTTP_STATUS.CONFLICT, TELE_CFG_ERRORS.PRICING_DUPLICATE.code, TELE_CFG_ERRORS.PRICING_DUPLICATE.message);
            }
            throw err;
        }
    }

    /** Cập nhật pricing */
    static async updatePricing(pricingId: string, userId: string, input: Record<string, any>): Promise<void> {
        const pricing = await TeleConfigRepository.findPricingById(pricingId);
        if (!pricing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_CFG_ERRORS.PRICING_NOT_FOUND.code, TELE_CFG_ERRORS.PRICING_NOT_FOUND.message);
        }

        const updateData: Record<string, any> = { updated_by: userId };
        if (input.base_price !== undefined) updateData.base_price = input.base_price;
        if (input.discount_percent !== undefined) updateData.discount_percent = input.discount_percent;
        if (input.effective_from !== undefined) updateData.effective_from = input.effective_from;
        if (input.effective_to !== undefined) updateData.effective_to = input.effective_to;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        await TeleConfigRepository.updatePricing(pricingId, updateData);
    }

    /** Xóa pricing */
    static async deletePricing(pricingId: string): Promise<void> {
        const pricing = await TeleConfigRepository.findPricingById(pricingId);
        if (!pricing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_CFG_ERRORS.PRICING_NOT_FOUND.code, TELE_CFG_ERRORS.PRICING_NOT_FOUND.message);
        }
        await TeleConfigRepository.deletePricing(pricingId);
    }

    /** DS pricing */
    static async listPricing(filters: PricingFilter): Promise<any> {
        return await TeleConfigRepository.findAllPricing(filters);
    }

    /** Tra cứu giá hiện hành */
    static async lookupPrice(typeId: string, specialtyId?: string, facilityId?: string): Promise<any> {
        const pricing = await TeleConfigRepository.lookupPrice(typeId, specialtyId, facilityId);
        if (!pricing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_CFG_ERRORS.PRICING_NOT_FOUND.code, TELE_CFG_ERRORS.PRICING_NOT_FOUND.message);
        }
        const finalPrice = pricing.base_price * (1 - pricing.discount_percent / 100);
        return { ...pricing, final_price: Math.round(finalPrice) };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: SLA
    // ═══════════════════════════════════════════════════

    /** SLA dashboard */
    static async getSlaDashboard(): Promise<any> {
        const metrics = await TeleConfigRepository.getSlaDashboard();
        const slaConfigs = await TeleConfigRepository.getAllConfigs('SLA');

        return { metrics, sla_targets: slaConfigs };
    }

    /** DS vi phạm SLA */
    static async getSlaBreaches(page: number, limit: number): Promise<any> {
        return await TeleConfigRepository.getSlaBreaches(page, limit);
    }
}
