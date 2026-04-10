
/** Phiếu xuất kho */
export interface StockOutOrder {
    stock_out_order_id: string;
    order_code: string;
    warehouse_id: string;
    reason_type: string;
    supplier_id?: string;
    dest_warehouse_id?: string;
    created_by: string;
    status: string;
    notes?: string;
    total_quantity: number;
    confirmed_at?: string;
    confirmed_by?: string;
    cancelled_at?: string;
    cancelled_reason?: string;
    created_at: string;
    updated_at: string;
    /** JOIN */
    warehouse_name?: string;
    supplier_name?: string;
    dest_warehouse_name?: string;
    created_by_name?: string;
    confirmed_by_name?: string;
}

/** Chi tiết dòng xuất kho */
export interface StockOutDetail {
    stock_out_detail_id: string;
    stock_out_order_id: string;
    inventory_id: string;
    drug_id: string;
    batch_number: string;
    quantity: number;
    reason_note?: string;
    created_at: string;
    /** JOIN */
    drug_code?: string;
    brand_name?: string;
    dispensing_unit?: string;
    expiry_date?: string;
    stock_quantity?: number;
}

/** Input thêm dòng thuốc xuất */
export interface AddStockOutItemInput {
    inventory_id: string;
    quantity: number;
    reason_note?: string;
}
