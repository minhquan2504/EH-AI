export interface MenuDetail {
    menus_id: string;
    code: string;
    name: string;
    url?: string;
    icon?: string;
    parent_id?: string;
    sort_order: number;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateMenuInput {
    code: string;
    name: string;
    url?: string;
    icon?: string;
    parent_id?: string;
    sort_order?: number;
}

export interface UpdateMenuInput {
    name?: string;
    url?: string | null;
    icon?: string | null;
    parent_id?: string | null;
    sort_order?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface MenuQueryFilter {
    search?: string;
    parent_id?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}
