import { randomUUID } from 'crypto';
import { TeleConsultationTypeRepository } from '../../repository/Remote Consultation/tele-consultation-type.repository';
import {
    TeleConsultationType,
    TeleTypeSpecialtyConfig,
    CreateTypeInput,
    UpdateTypeInput,
    CreateConfigInput,
    UpdateConfigInput,
    BatchConfigInput,
    PaginatedResult,
} from '../../models/Remote Consultation/tele-consultation-type.model';
import {
    REMOTE_CONSULTATION_ERRORS,
    REMOTE_CONSULTATION_CONFIG,
    CONSULTATION_TYPE_CODE,
} from '../../constants/remote-consultation.constant';

export class TeleConsultationTypeService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /**
     * Xác định capabilities mặc định dựa trên code loại hình.
     * VIDEO → yêu cầu camera + mic, AUDIO → chỉ mic, CHAT → gửi file, HYBRID → tất cả.
     */
    private static resolveCapabilities(code: string, input: CreateTypeInput): Partial<CreateTypeInput> {
        const defaults: Record<string, Partial<CreateTypeInput>> = {
            [CONSULTATION_TYPE_CODE.VIDEO]: {
                requires_video: true, requires_audio: true,
                allows_file_sharing: true, allows_screen_sharing: true,
                default_platform: 'AGORA',
            },
            [CONSULTATION_TYPE_CODE.AUDIO]: {
                requires_video: false, requires_audio: true,
                allows_file_sharing: false, allows_screen_sharing: false,
                default_platform: 'AGORA',
            },
            [CONSULTATION_TYPE_CODE.CHAT]: {
                requires_video: false, requires_audio: false,
                allows_file_sharing: true, allows_screen_sharing: false,
                default_platform: 'INTERNAL_CHAT',
            },
            [CONSULTATION_TYPE_CODE.HYBRID]: {
                requires_video: true, requires_audio: true,
                allows_file_sharing: true, allows_screen_sharing: true,
                default_platform: 'AGORA',
            },
        };
        const d = defaults[code.toUpperCase()] || {};
        return {
            requires_video: input.requires_video ?? d.requires_video ?? false,
            requires_audio: input.requires_audio ?? d.requires_audio ?? false,
            allows_file_sharing: input.allows_file_sharing ?? d.allows_file_sharing ?? false,
            allows_screen_sharing: input.allows_screen_sharing ?? d.allows_screen_sharing ?? false,
            default_platform: input.default_platform ?? d.default_platform ?? 'AGORA',
        };
    }

    /**
     * Validate thời lượng: min <= default <= max
     */
    private static validateDuration(min?: number, def?: number, max?: number): void {
        const minVal = min ?? 10;
        const defVal = def ?? 30;
        const maxVal = max ?? 120;
        if (minVal > defVal || defVal > maxVal || minVal < 0) {
            throw REMOTE_CONSULTATION_ERRORS.INVALID_DURATION;
        }
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: QUẢN LÝ LOẠI HÌNH
    // ═══════════════════════════════════════════════════

    /** Tạo loại hình khám từ xa */
    static async createType(input: CreateTypeInput, createdBy: string): Promise<TeleConsultationType> {
        const codeUpper = input.code.toUpperCase().trim();

        /* Kiểm tra trùng code (bao gồm soft-deleted để tránh conflict UNIQUE) */
        const existing = await TeleConsultationTypeRepository.getTypeByCodeIncludeDeleted(codeUpper);
        if (existing) throw REMOTE_CONSULTATION_ERRORS.TYPE_CODE_EXISTS;

        /* Validate thời lượng */
        this.validateDuration(input.min_duration_minutes, input.default_duration_minutes, input.max_duration_minutes);

        /* Resolve capabilities mặc định theo code */
        const capabilities = this.resolveCapabilities(codeUpper, input);

        const typeId = this.generateId('TCT');
        return await TeleConsultationTypeRepository.createType({
            type_id: typeId,
            code: codeUpper,
            name: input.name,
            description: input.description || null,
            default_platform: capabilities.default_platform as string,
            requires_video: capabilities.requires_video,
            requires_audio: capabilities.requires_audio,
            allows_file_sharing: capabilities.allows_file_sharing,
            allows_screen_sharing: capabilities.allows_screen_sharing,
            default_duration_minutes: input.default_duration_minutes || 30,
            min_duration_minutes: input.min_duration_minutes || 10,
            max_duration_minutes: input.max_duration_minutes || 120,
            icon_url: input.icon_url || null,
            sort_order: input.sort_order || 0,
            created_by: createdBy,
        } as any);
    }

    /** Danh sách loại hình */
    static async getTypes(
        isActive?: string, keyword?: string,
        page: number = REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
        limit: number = REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<TeleConsultationType>> {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return await TeleConsultationTypeRepository.getTypes(
            active, keyword, page, Math.min(limit, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT)
        );
    }

    /** Chi tiết loại hình */
    static async getTypeById(typeId: string): Promise<TeleConsultationType> {
        const type = await TeleConsultationTypeRepository.getTypeById(typeId);
        if (!type) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;
        return type;
    }

    /** Cập nhật loại hình */
    static async updateType(typeId: string, input: UpdateTypeInput): Promise<TeleConsultationType> {
        const existing = await TeleConsultationTypeRepository.getTypeById(typeId);
        if (!existing) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;

        /* Validate thời lượng nếu có thay đổi */
        const minVal = input.min_duration_minutes ?? existing.min_duration_minutes;
        const defVal = input.default_duration_minutes ?? existing.default_duration_minutes;
        const maxVal = input.max_duration_minutes ?? existing.max_duration_minutes;
        this.validateDuration(minVal, defVal, maxVal);

        const updateData: Record<string, any> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.default_platform !== undefined) updateData.default_platform = input.default_platform;
        if (input.requires_video !== undefined) updateData.requires_video = input.requires_video;
        if (input.requires_audio !== undefined) updateData.requires_audio = input.requires_audio;
        if (input.allows_file_sharing !== undefined) updateData.allows_file_sharing = input.allows_file_sharing;
        if (input.allows_screen_sharing !== undefined) updateData.allows_screen_sharing = input.allows_screen_sharing;
        if (input.default_duration_minutes !== undefined) updateData.default_duration_minutes = input.default_duration_minutes;
        if (input.min_duration_minutes !== undefined) updateData.min_duration_minutes = input.min_duration_minutes;
        if (input.max_duration_minutes !== undefined) updateData.max_duration_minutes = input.max_duration_minutes;
        if (input.icon_url !== undefined) updateData.icon_url = input.icon_url;
        if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        return await TeleConsultationTypeRepository.updateType(typeId, updateData);
    }

    /** Soft delete loại hình */
    static async deleteType(typeId: string): Promise<void> {
        const existing = await TeleConsultationTypeRepository.getTypeById(typeId);
        if (!existing) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;

        /* Kiểm tra xem có config nào đang dùng không */
        const configCount = await TeleConsultationTypeRepository.countConfigsByType(typeId);
        if (configCount > 0) throw REMOTE_CONSULTATION_ERRORS.TYPE_IN_USE;

        await TeleConsultationTypeRepository.softDeleteType(typeId);
    }

    /** Danh sách active (cho dropdown) */
    static async getActiveTypes(): Promise<TeleConsultationType[]> {
        return await TeleConsultationTypeRepository.getActiveTypes();
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: CẤU HÌNH CHUYÊN KHOA
    // ═══════════════════════════════════════════════════

    /** Tạo cấu hình chuyên khoa */
    static async createConfig(input: CreateConfigInput, createdBy: string): Promise<TeleTypeSpecialtyConfig> {
        /* Validate type tồn tại */
        const type = await TeleConsultationTypeRepository.getTypeById(input.type_id);
        if (!type) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;
        if (!type.is_active) throw REMOTE_CONSULTATION_ERRORS.TYPE_INACTIVE;

        /* Validate specialty tồn tại */
        const specialtyOk = await TeleConsultationTypeRepository.specialtyExists(input.specialty_id);
        if (!specialtyOk) throw REMOTE_CONSULTATION_ERRORS.SPECIALTY_NOT_FOUND;

        /* Validate facility tồn tại */
        const facilityOk = await TeleConsultationTypeRepository.facilityExists(input.facility_id);
        if (!facilityOk) throw REMOTE_CONSULTATION_ERRORS.FACILITY_NOT_FOUND;

        /* Validate facility_service nếu có */
        if (input.facility_service_id) {
            const serviceOk = await TeleConsultationTypeRepository.facilityServiceExists(input.facility_service_id);
            if (!serviceOk) throw REMOTE_CONSULTATION_ERRORS.FACILITY_SERVICE_NOT_FOUND;
        }

        /* Kiểm tra trùng */
        const dup = await TeleConsultationTypeRepository.findDuplicateConfig(input.type_id, input.specialty_id, input.facility_id);
        if (dup) throw REMOTE_CONSULTATION_ERRORS.CONFIG_DUPLICATE;

        /* Validate giá */
        if (input.base_price < 0) throw REMOTE_CONSULTATION_ERRORS.INVALID_PRICE;

        /* Validate thời lượng nếu có override */
        if (input.min_duration_minutes || input.default_duration_minutes || input.max_duration_minutes) {
            const minVal = input.min_duration_minutes ?? type.min_duration_minutes;
            const defVal = input.default_duration_minutes ?? type.default_duration_minutes;
            const maxVal = input.max_duration_minutes ?? type.max_duration_minutes;
            this.validateDuration(minVal, defVal, maxVal);
        }

        const configId = this.generateId('TSC');
        return await TeleConsultationTypeRepository.createConfig({
            config_id: configId,
            type_id: input.type_id,
            specialty_id: input.specialty_id,
            facility_id: input.facility_id,
            facility_service_id: input.facility_service_id || null,
            is_enabled: input.is_enabled !== false,
            allowed_platforms: input.allowed_platforms || ['AGORA'],
            min_duration_minutes: input.min_duration_minutes || null,
            max_duration_minutes: input.max_duration_minutes || null,
            default_duration_minutes: input.default_duration_minutes || null,
            base_price: input.base_price?.toString() || '0',
            insurance_price: input.insurance_price?.toString() || null,
            vip_price: input.vip_price?.toString() || null,
            max_patients_per_slot: input.max_patients_per_slot || 1,
            advance_booking_days: input.advance_booking_days || 30,
            cancellation_hours: input.cancellation_hours || 2,
            auto_record: input.auto_record || false,
            priority: input.priority || 0,
            notes: input.notes || null,
            created_by: createdBy,
        } as any);
    }

    /** Danh sách cấu hình */
    static async getConfigs(
        typeId?: string, specialtyId?: string, facilityId?: string,
        isEnabled?: string, isActive?: string,
        page: number = REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE,
        limit: number = REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<TeleTypeSpecialtyConfig>> {
        const enabled = isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined;
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return await TeleConsultationTypeRepository.getConfigs(
            typeId, specialtyId, facilityId, enabled, active,
            page, Math.min(limit, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT)
        );
    }

    /** Chi tiết cấu hình */
    static async getConfigById(configId: string): Promise<TeleTypeSpecialtyConfig> {
        const config = await TeleConsultationTypeRepository.getConfigById(configId);
        if (!config) throw REMOTE_CONSULTATION_ERRORS.CONFIG_NOT_FOUND;
        return config;
    }

    /** Cập nhật cấu hình */
    static async updateConfig(configId: string, input: UpdateConfigInput): Promise<TeleTypeSpecialtyConfig> {
        const existing = await TeleConsultationTypeRepository.getConfigById(configId);
        if (!existing) throw REMOTE_CONSULTATION_ERRORS.CONFIG_NOT_FOUND;

        /* Validate facility_service nếu thay đổi */
        if (input.facility_service_id) {
            const serviceOk = await TeleConsultationTypeRepository.facilityServiceExists(input.facility_service_id);
            if (!serviceOk) throw REMOTE_CONSULTATION_ERRORS.FACILITY_SERVICE_NOT_FOUND;
        }

        /* Validate giá */
        if (input.base_price !== undefined && input.base_price < 0) throw REMOTE_CONSULTATION_ERRORS.INVALID_PRICE;

        const updateData: Record<string, any> = {};
        if (input.facility_service_id !== undefined) updateData.facility_service_id = input.facility_service_id;
        if (input.is_enabled !== undefined) updateData.is_enabled = input.is_enabled;
        if (input.allowed_platforms !== undefined) updateData.allowed_platforms = input.allowed_platforms;
        if (input.min_duration_minutes !== undefined) updateData.min_duration_minutes = input.min_duration_minutes;
        if (input.max_duration_minutes !== undefined) updateData.max_duration_minutes = input.max_duration_minutes;
        if (input.default_duration_minutes !== undefined) updateData.default_duration_minutes = input.default_duration_minutes;
        if (input.base_price !== undefined) updateData.base_price = input.base_price;
        if (input.insurance_price !== undefined) updateData.insurance_price = input.insurance_price;
        if (input.vip_price !== undefined) updateData.vip_price = input.vip_price;
        if (input.max_patients_per_slot !== undefined) updateData.max_patients_per_slot = input.max_patients_per_slot;
        if (input.advance_booking_days !== undefined) updateData.advance_booking_days = input.advance_booking_days;
        if (input.cancellation_hours !== undefined) updateData.cancellation_hours = input.cancellation_hours;
        if (input.auto_record !== undefined) updateData.auto_record = input.auto_record;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        return await TeleConsultationTypeRepository.updateConfig(configId, updateData);
    }

    /** Soft delete cấu hình */
    static async deleteConfig(configId: string): Promise<void> {
        const existing = await TeleConsultationTypeRepository.getConfigById(configId);
        if (!existing) throw REMOTE_CONSULTATION_ERRORS.CONFIG_NOT_FOUND;
        await TeleConsultationTypeRepository.softDeleteConfig(configId);
    }

    /** CK đã cấu hình cho 1 loại hình */
    static async getSpecialtiesByType(typeId: string, facilityId?: string): Promise<TeleTypeSpecialtyConfig[]> {
        const type = await TeleConsultationTypeRepository.getTypeById(typeId);
        if (!type) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;
        return await TeleConsultationTypeRepository.getSpecialtiesByType(typeId, facilityId);
    }

    /** Loại hình khả dụng cho 1 CK */
    static async getTypesBySpecialty(specialtyId: string, facilityId?: string): Promise<any[]> {
        return await TeleConsultationTypeRepository.getTypesBySpecialty(specialtyId, facilityId);
    }

    /** Batch create cấu hình */
    static async batchCreateConfigs(input: BatchConfigInput, createdBy: string): Promise<{ created: number; skipped: number; errors: string[] }> {
        if (!input.configs || input.configs.length === 0) throw REMOTE_CONSULTATION_ERRORS.NO_CONFIGS_PROVIDED;

        /* Validate type & facility */
        const type = await TeleConsultationTypeRepository.getTypeById(input.type_id);
        if (!type) throw REMOTE_CONSULTATION_ERRORS.TYPE_NOT_FOUND;
        const facilityOk = await TeleConsultationTypeRepository.facilityExists(input.facility_id);
        if (!facilityOk) throw REMOTE_CONSULTATION_ERRORS.FACILITY_NOT_FOUND;

        let created = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const cfg of input.configs) {
            try {
                /* Kiểm tra trùng → skip */
                const dup = await TeleConsultationTypeRepository.findDuplicateConfig(input.type_id, cfg.specialty_id, input.facility_id);
                if (dup) { skipped++; continue; }

                /* Validate specialty */
                const specialtyOk = await TeleConsultationTypeRepository.specialtyExists(cfg.specialty_id);
                if (!specialtyOk) { errors.push(`Chuyên khoa ${cfg.specialty_id} không tồn tại`); continue; }

                const configId = this.generateId('TSC');
                await TeleConsultationTypeRepository.createConfig({
                    config_id: configId,
                    type_id: input.type_id,
                    specialty_id: cfg.specialty_id,
                    facility_id: input.facility_id,
                    facility_service_id: cfg.facility_service_id || null,
                    is_enabled: true,
                    allowed_platforms: cfg.allowed_platforms || ['AGORA'],
                    min_duration_minutes: cfg.min_duration_minutes || null,
                    max_duration_minutes: cfg.max_duration_minutes || null,
                    default_duration_minutes: cfg.default_duration_minutes || null,
                    base_price: cfg.base_price?.toString() || '0',
                    insurance_price: cfg.insurance_price?.toString() || null,
                    vip_price: cfg.vip_price?.toString() || null,
                    auto_record: cfg.auto_record || false,
                    created_by: createdBy,
                } as any);
                created++;
            } catch (err: any) {
                errors.push(`Specialty ${cfg.specialty_id}: ${err.message || 'Lỗi không xác định'}`);
            }
        }

        return { created, skipped, errors };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: TRA CỨU & THỐNG KÊ
    // ═══════════════════════════════════════════════════

    /** Kiểm tra hình thức khả dụng */
    static async checkAvailability(specialtyId: string, facilityId: string): Promise<any[]> {
        return await TeleConsultationTypeRepository.checkAvailability(specialtyId, facilityId);
    }

    /** Thống kê tổng quan */
    static async getStats(): Promise<any> {
        return await TeleConsultationTypeRepository.getStats();
    }
}
