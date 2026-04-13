export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(
    file: File,
    options?: {
        maxSize?: number;
        allowedTypes?: string[];
    }
): { valid: boolean; message: string } {
    const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
    if (file.size > maxSize) {
        return { valid: false, message: `File quá lớn (tối đa ${Math.round(maxSize / 1024 / 1024)}MB)` };
    }
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !options.allowedTypes.includes(ext)) {
            return { valid: false, message: `Định dạng không hợp lệ. Cho phép: ${options.allowedTypes.join(", ")}` };
        }
    }
    return { valid: true, message: "" };
}
