
/** Nhà cung cấp */
export interface Supplier {
    supplier_id: string;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_code?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateSupplierInput {
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_code?: string;
}

export interface UpdateSupplierInput {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_code?: string;
    is_active?: boolean;
}

/** Phiếu nhập kho */
export interface StockInOrder {
    stock_in_order_id: string;
    order_code: string;
    supplier_id: string;
    warehouse_id: string;
    created_by: string;
    status: string;
    notes?: string;
    total_amount: number;
    received_at?: string;
    received_by?: string;
    cancelled_at?: string;
    cancelled_reason?: string;
    created_at: string;
    updated_at: string;
    /** JOIN */
    supplier_name?: string;
    warehouse_name?: string;
    created_by_name?: string;
    received_by_name?: string;
}

/** Chi tiết dòng thuốc trong phiếu */
export interface StockInDetail {
    stock_in_detail_id: string;
    stock_in_order_id: string;
    drug_id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    unit_cost: number;
    unit_price?: number;
    amount: number;
    created_at: string;
    /** JOIN */
    drug_code?: string;
    brand_name?: string;
    dispensing_unit?: string;
}

/** Input thêm dòng thuốc */
export interface AddStockInItemInput {
    drug_id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    unit_cost: number;
    unit_price?: number;
}
