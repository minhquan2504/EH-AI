export interface RoleMenuDetail {
    menus_id: string;
    code: string;
    name: string;
    url?: string;
    icon?: string;
    parent_id?: string;
    sort_order: number;
}

export interface AssignMenuInput {
    menu_id: string; // Hoặc code
}
