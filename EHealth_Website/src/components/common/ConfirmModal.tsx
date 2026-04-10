/**
 * ConfirmModal Component
 * Modal xác nhận hành động nguy hiểm (xóa, khóa, hủy...)
 */

"use client";

import { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

// ============================================
// Types
// ============================================

export interface ConfirmModalProps {
    /** Trạng thái mở/đóng */
    isOpen: boolean;
    /** Callback khi đóng */
    onClose: () => void;
    /** Callback khi xác nhận */
    onConfirm: () => void;
    /** Tiêu đề */
    title?: string;
    /** Nội dung mô tả */
    description?: string | ReactNode;
    /** Text nút xác nhận */
    confirmText?: string;
    /** Text nút hủy */
    cancelText?: string;
    /** Variant nút xác nhận */
    confirmVariant?: 'primary' | 'danger';
    /** Icon hiển thị */
    icon?: string;
    /** Màu icon */
    iconColor?: 'red' | 'yellow' | 'blue';
    /** Trạng thái loading */
    loading?: boolean;
}

// ============================================
// Icon color styles
// ============================================

const iconColorStyles = {
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

// ============================================
// Component
// ============================================

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    description = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    confirmVariant = 'danger',
    icon = 'warning',
    iconColor = 'red',
    loading = false,
}: ConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            showCloseButton={false}
            closeOnOverlayClick={!loading}
        >
            <div className="text-center py-2">
                {/* Icon */}
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${iconColorStyles[iconColor]}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                        {icon}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmModal;
