/**
 * Interfaces cho module Cấp phát thuốc (Dispensing Management 5.5)
 */

/** Phiếu cấp phát thuốc (header) */
export interface DispenseOrder {
    drug_dispense_orders_id: string;
    dispense_code: string;
    prescription_id: string;
    pharmacist_id: string;
    status: string;
    notes: string | null;
    dispensed_at: string;
    cancelled_at: string | null;
    cancelled_reason: string | null;

    /** JOIN fields */
    pharmacist_name?: string;
    prescription_code?: string;
    patient_name?: string;
    patient_id?: string;
    doctor_name?: string;
}

/** Chi tiết dòng cấp phát */
export interface DispenseDetail {
    drug_dispense_details_id: string;
    dispense_order_id: string;
    prescription_detail_id: string;
    inventory_id: string;
    dispensed_quantity: number;

    /** JOIN fields */
    drug_code?: string;
    brand_name?: string;
    active_ingredients?: string;
    dispensing_unit?: string;
    batch_number?: string;
    expiry_date?: string;
    location_bin?: string;
    unit_price?: number;
}

/** Input tạo phiếu cấp phát */
export interface CreateDispenseInput {
    notes?: string;
    items: DispenseItemInput[];
}

/** Mỗi dòng thuốc cấp phát */
export interface DispenseItemInput {
    prescription_detail_id: string;
    inventory_id: string;
    dispensed_quantity: number;
}

/** Lô tồn kho */
export interface InventoryBatch {
    pharmacy_inventory_id: string;
    drug_id: string;
    batch_number: string;
    expiry_date: string;
    stock_quantity: number;
    unit_cost: number;
    unit_price: number;
    location_bin: string;

    /** JOIN fields */
    drug_code?: string;
    brand_name?: string;
    dispensing_unit?: string;
}

/** Kết quả kiểm tra tồn kho */
export interface StockCheckResult {
    drug_id: string;
    drug_code: string;
    brand_name: string;
    requested_quantity: number;
    total_available: number;
    is_sufficient: boolean;
    batches: InventoryBatch[];
}

/** Phiếu cấp phát + chi tiết đầy đủ */
export interface DispenseOrderFull {
    order: DispenseOrder;
    details: DispenseDetail[];
    total_items: number;
    total_cost: number;
}
