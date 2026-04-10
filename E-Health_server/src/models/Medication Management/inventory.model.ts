
/** Lô tồn kho (từ DB) */
export interface InventoryItem {
    pharmacy_inventory_id: string;
    drug_id: string;
    batch_number: string;
    expiry_date: string;
    stock_quantity: number;
    unit_cost: number;
    unit_price: number;
    location_bin: string;
    low_stock_threshold: number;
    warehouse_id?: string;

    /** JOIN fields */
    drug_code?: string;
    brand_name?: string;
    active_ingredients?: string;
    dispensing_unit?: string;
    category_name?: string;
}

/** Input tạo lô mới */
export interface CreateInventoryInput {
    drug_id: string;
    batch_number: string;
    expiry_date: string;
    stock_quantity: number;
    unit_cost?: number;
    unit_price?: number;
    location_bin?: string;
    low_stock_threshold?: number;
    warehouse_id?: string;
}

/** Input cập nhật lô */
export interface UpdateInventoryInput {
    stock_quantity?: number;
    unit_cost?: number;
    unit_price?: number;
    location_bin?: string;
    low_stock_threshold?: number;
    adjustment_reason?: string;
}

/** Cảnh báo hết hạn */
export interface ExpiryAlert {
    pharmacy_inventory_id: string;
    drug_id: string;
    drug_code: string;
    brand_name: string;
    batch_number: string;
    expiry_date: string;
    stock_quantity: number;
    days_until_expiry: number;
    alert_level: 'CRITICAL' | 'WARNING' | 'NOTICE';
    location_bin: string;
}

/** Cảnh báo tồn kho thấp */
export interface LowStockAlert {
    drug_id: string;
    drug_code: string;
    brand_name: string;
    total_stock: number;
    min_threshold: number;
    percentage_remaining: number;
    batches: {
        pharmacy_inventory_id: string;
        batch_number: string;
        stock_quantity: number;
        low_stock_threshold: number;
    }[];
}
