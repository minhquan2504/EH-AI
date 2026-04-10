/**
 * DataTable Component
 * Bảng dữ liệu tái sử dụng với search, filter, pagination
 */

"use client";

import { useState, useMemo, ReactNode } from 'react';
import { cn } from '@/utils/helpers';

// ============================================
// Types
// ============================================

export interface Column<T> {
    /** Key truy cập dữ liệu */
    key: string;
    /** Tiêu đề cột */
    title: string;
    /** Chiều rộng cột */
    width?: string;
    /** Có thể sắp xếp */
    sortable?: boolean;
    /** Custom render */
    render?: (value: any, record: T, index: number) => ReactNode;
    /** Căn chỉnh */
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    /** Dữ liệu hiển thị */
    data: T[];
    /** Cấu hình cột */
    columns: Column<T>[];
    /** Key duy nhất cho mỗi row */
    rowKey: string;
    /** Đang tải dữ liệu */
    loading?: boolean;
    /** Tổng số bản ghi (cho server-side pagination) */
    total?: number;
    /** Số bản ghi mỗi trang */
    pageSize?: number;
    /** Trang hiện tại */
    currentPage?: number;
    /** Callback thay đổi trang */
    onPageChange?: (page: number) => void;
    /** Callback thay đổi page size */
    onPageSizeChange?: (size: number) => void;
    /** Callback click row */
    onRowClick?: (record: T) => void;
    /** Không hiển thị pagination */
    noPagination?: boolean;
    /** Text khi không có dữ liệu */
    emptyText?: string;
    /** Icon khi không có dữ liệu */
    emptyIcon?: string;
}

// ============================================
// Constants
// ============================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============================================
// Component
// ============================================

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    rowKey,
    loading = false,
    total,
    pageSize = 10,
    currentPage = 1,
    onPageChange,
    onPageSizeChange,
    onRowClick,
    noPagination = false,
    emptyText = 'Không có dữ liệu',
    emptyIcon = 'inbox',
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Tính tổng số trang
    const totalItems = total || data.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Sắp xếp dữ liệu (client-side nếu không có server pagination)
    const sortedData = useMemo(() => {
        if (!sortKey || total) return data; // Skip sort nếu có server-side pagination
        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortOrder, total]);

    // Phân trang client-side
    const displayData = useMemo(() => {
        if (total || noPagination) return sortedData; // Server-side pagination hoặc không pagination
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, total, noPagination]);

    // Xử lý sort
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    // Tạo danh sách trang
    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const alignStyles = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* Header */}
                    <thead>
                        <tr className="border-b border-[#e5e7eb] dark:border-[#2d353e] bg-[#f9fafb] dark:bg-[#1a2030]">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider',
                                        alignStyles[col.align || 'left'],
                                        col.sortable && 'cursor-pointer select-none hover:text-[#3C81C6] transition-colors'
                                    )}
                                    style={{ width: col.width }}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className={cn(
                                        'flex items-center gap-1',
                                        col.align === 'center' && 'justify-center',
                                        col.align === 'right' && 'justify-end'
                                    )}>
                                        {col.title}
                                        {col.sortable && sortKey === col.key && (
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody>
                        {loading ? (
                            /* Loading skeleton */
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-[#e5e7eb] dark:border-[#2d353e]">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3.5">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : displayData.length === 0 ? (
                            /* Empty state */
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600" style={{ fontSize: '48px' }}>
                                            {emptyIcon}
                                        </span>
                                        <p className="text-sm text-gray-400 dark:text-gray-500">{emptyText}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            /* Data rows */
                            displayData.map((record, index) => (
                                <tr
                                    key={record[rowKey]}
                                    className={cn(
                                        'border-b border-[#e5e7eb] dark:border-[#2d353e] last:border-b-0',
                                        'hover:bg-[#f8fafc] dark:hover:bg-[#232b36] transition-colors',
                                        onRowClick && 'cursor-pointer'
                                    )}
                                    onClick={() => onRowClick?.(record)}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300',
                                                alignStyles[col.align || 'left']
                                            )}
                                        >
                                            {col.render
                                                ? col.render(record[col.key], record, index)
                                                : record[col.key]
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!noPagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb] dark:border-[#2d353e] bg-[#f9fafb] dark:bg-[#1a2030]">
                    {/* Info */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Hiển thị {((currentPage - 1) * pageSize) + 1} đến{' '}
                            {Math.min(currentPage * pageSize, totalItems)} trong tổng số{' '}
                            <span className="font-medium">{totalItems}</span> kết quả
                        </span>
                        {onPageSizeChange && (
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-[#1e242b] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3C81C6]"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>{size} / trang</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Page buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                        </button>

                        {getPageNumbers().map((page, i) => (
                            page === '...' ? (
                                <span key={`dots-${i}`} className="px-2 text-xs text-gray-400">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange?.(page as number)}
                                    className={cn(
                                        'w-8 h-8 rounded-md text-xs font-medium transition-colors',
                                        currentPage === page
                                            ? 'bg-[#3C81C6] text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    )}
                                >
                                    {page}
                                </button>
                            )
                        ))}

                        <button
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
