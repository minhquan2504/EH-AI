/** Interface cho bảng patient_classification_rules */
export interface ClassificationRule {
    rule_id: string;
    name: string;
    criteria_type: string;
    criteria_operator: string;
    criteria_value: string;
    target_tag_id: string;
    timeframe_days: number | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    tag_code?: string;
    tag_name?: string;
    tag_color_hex?: string;
}

/** Input tạo mới Rule */
export interface CreateRuleInput {
    name: string;
    criteria_type: string;
    criteria_operator: string;
    criteria_value: string;
    target_tag_id: string;
    timeframe_days?: number | null;
}

/** Input cập nhật Rule */
export interface UpdateRuleInput {
    name?: string;
    criteria_type?: string;
    criteria_operator?: string;
    criteria_value?: string;
    target_tag_id?: string;
    timeframe_days?: number | null;
    is_active?: boolean;
}

/** Phân trang danh sách Rule */
export interface PaginatedRules {
    data: ClassificationRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
