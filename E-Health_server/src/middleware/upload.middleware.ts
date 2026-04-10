import multer from 'multer';

const storage = multer.memoryStorage();

// Giới hạn file 5MB
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls');

    if (isExcel) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
};

export const uploadExcel = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh'));
    }
};

export const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

