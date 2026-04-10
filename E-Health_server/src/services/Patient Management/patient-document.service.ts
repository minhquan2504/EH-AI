import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { PatientDocumentRepository } from '../../repository/Patient Management/patient-document.repository';
import {
    PatientDocument,
    DocumentVersion,
    CreatePatientDocumentInput,
    UpdatePatientDocumentInput,
    PaginatedPatientDocuments
} from '../../models/Patient Management/patient-document.model';
import {
    PATIENT_DOCUMENT_ID_PREFIX,
    DOCUMENT_CLOUDINARY_FOLDER,
    DOCUMENT_MAX_FILE_SIZE,
    DOCUMENT_ALLOWED_FORMATS,
    PATIENT_DOCUMENT_ERRORS,
    DOCUMENT_CONFIG,
    DOCUMENT_VERSION_ID_PREFIX,
    DOCUMENT_VERSION_ERRORS
} from '../../constants/document.constant';
import { CLOUDINARY_CONFIG } from '../../constants/system.constant';

// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
    api_key: CLOUDINARY_CONFIG.API_KEY,
    api_secret: CLOUDINARY_CONFIG.API_SECRET,
});

export class PatientDocumentService {
    /**
     * Sinh ID theo format: DOC_YYMMDD_8charUUID
     */
    private static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${PATIENT_DOCUMENT_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }

    /**
     * Upload tài liệu: validate → upload Cloudinary → lưu metadata DB
     */
    static async upload(
        input: CreatePatientDocumentInput,
        file: Express.Multer.File,
        uploadedBy: string | null
    ): Promise<PatientDocument> {
        // Validate các trường bắt buộc
        if (!input.patient_id || !input.document_type_id || !input.document_name) {
            throw PATIENT_DOCUMENT_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        if (!file) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_REQUIRED;
        }

        // Validate file format
        if (!DOCUMENT_ALLOWED_FORMATS.includes(file.mimetype)) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_FORMAT_NOT_ALLOWED;
        }

        // Validate file size
        if (file.size > DOCUMENT_MAX_FILE_SIZE) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_TOO_LARGE;
        }

        // Kiểm tra bệnh nhân tồn tại
        const patientExists = await PatientDocumentRepository.checkPatientExists(input.patient_id);
        if (!patientExists) {
            throw PATIENT_DOCUMENT_ERRORS.PATIENT_NOT_FOUND;
        }

        // Kiểm tra loại tài liệu hợp lệ
        const typeValid = await PatientDocumentRepository.checkDocumentTypeValid(input.document_type_id);
        if (!typeValid) {
            throw PATIENT_DOCUMENT_ERRORS.DOCUMENT_TYPE_INVALID;
        }

        const newId = this.generateId();

        // Xác định resource_type: PDF dùng 'raw', ảnh dùng 'image'
        const isPdf = file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'image';

        // Upload lên Cloudinary bằng stream từ buffer
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `${DOCUMENT_CLOUDINARY_FOLDER}/${input.patient_id}`,
                    public_id: `doc_${newId}`,
                    overwrite: true,
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error || !result) reject(PATIENT_DOCUMENT_ERRORS.UPLOAD_FAILED);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        const extension = file.originalname.split('.').pop() || file.mimetype.split('/')[1];

        // Lưu metadata vào DB
        await PatientDocumentRepository.create(
            newId,
            input,
            uploadResult.secure_url,
            extension,
            file.size,
            uploadedBy
        );

        return await PatientDocumentRepository.getById(newId) as PatientDocument;
    }


    /**
     * Lấy danh sách tài liệu theo bệnh nhân (phân trang)
     */
    static async getByPatient(
        patientId: string,
        documentTypeId: string | null,
        page: number,
        limit: number
    ): Promise<PaginatedPatientDocuments> {
        const patientExists = await PatientDocumentRepository.checkPatientExists(patientId);
        if (!patientExists) {
            throw PATIENT_DOCUMENT_ERRORS.PATIENT_NOT_FOUND;
        }

        // Clamp giá trị page/limit
        const safePage = Math.max(page || DOCUMENT_CONFIG.DEFAULT_PAGE, 1);
        const safeLimit = Math.min(Math.max(limit || DOCUMENT_CONFIG.DEFAULT_LIMIT, 1), DOCUMENT_CONFIG.MAX_LIMIT);

        return await PatientDocumentRepository.getByPatient(patientId, documentTypeId, safePage, safeLimit);
    }

    /**
     * Chi tiết tài liệu
     */
    static async getById(id: string): Promise<PatientDocument> {
        const doc = await PatientDocumentRepository.getById(id);
        if (!doc) {
            throw PATIENT_DOCUMENT_ERRORS.NOT_FOUND;
        }
        return doc;
    }

    /**
     * Cập nhật metadata (tên, loại, ghi chú). Không upload lại file.
     */
    static async updateMetadata(id: string, input: UpdatePatientDocumentInput): Promise<PatientDocument> {
        const existing = await PatientDocumentRepository.getById(id);
        if (!existing) {
            throw PATIENT_DOCUMENT_ERRORS.NOT_FOUND;
        }

        if (input.document_type_id) {
            const typeValid = await PatientDocumentRepository.checkDocumentTypeValid(input.document_type_id);
            if (!typeValid) {
                throw PATIENT_DOCUMENT_ERRORS.DOCUMENT_TYPE_INVALID;
            }
        }

        await PatientDocumentRepository.updateMetadata(id, input);

        // Gọi lại getById để trả về dữ liệu đầy đủ có JOIN với document_types
        return await PatientDocumentRepository.getById(id) as PatientDocument;

    }

    /**
     * Xóa mềm tài liệu (KHÔNG xóa file trên Cloudinary — giữ lại phục vụ audit pháp lý)
     */
    static async delete(id: string): Promise<void> {
        const existing = await PatientDocumentRepository.getById(id);
        if (!existing) {
            throw PATIENT_DOCUMENT_ERRORS.NOT_FOUND;
        }

        await PatientDocumentRepository.softDelete(id);
    }

    /**
     * Upload file mới tạo phiên bản kế tiếp cho tài liệu.
     */
    static async uploadNewVersion(
        documentId: string,
        file: Express.Multer.File,
        uploadedBy: string | null
    ): Promise<PatientDocument> {
        const existing = await PatientDocumentRepository.getById(documentId);
        if (!existing) {
            throw DOCUMENT_VERSION_ERRORS.DOCUMENT_NOT_FOUND;
        }

        if (!file) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_REQUIRED;
        }

        if (!DOCUMENT_ALLOWED_FORMATS.includes(file.mimetype)) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_FORMAT_NOT_ALLOWED;
        }

        if (file.size > DOCUMENT_MAX_FILE_SIZE) {
            throw PATIENT_DOCUMENT_ERRORS.FILE_TOO_LARGE;
        }

        // Bước Lưu bản hiện tại vào bảng lịch sử
        const snapshotId = this.generateVersionId();
        await PatientDocumentRepository.snapshotToVersionHistory(existing, snapshotId);

        // Bước Upload file mới lên Cloudinary
        const isPdf = file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'image';
        const newVersionNum = existing.version_number + 1;

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `${DOCUMENT_CLOUDINARY_FOLDER}/${existing.patient_id}`,
                    public_id: `doc_${documentId}_v${newVersionNum}`,
                    overwrite: true,
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error || !result) reject(PATIENT_DOCUMENT_ERRORS.UPLOAD_FAILED);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        const extension = file.originalname.split('.').pop() || file.mimetype.split('/')[1];

        // Bước Cập nhật bản chính, tăng version_number
        return await PatientDocumentRepository.upgradeVersion(
            documentId,
            uploadResult.secure_url,
            extension,
            file.size,
            uploadedBy
        );
    }

    /**
     * Lấy toàn bộ lịch sử phiên bản cũ của tài liệu
     */
    static async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
        const existing = await PatientDocumentRepository.getById(documentId);
        if (!existing) {
            throw DOCUMENT_VERSION_ERRORS.DOCUMENT_NOT_FOUND;
        }

        return await PatientDocumentRepository.getVersionHistory(documentId);
    }

    /**
     * Lấy chi tiết 1 phiên bản cụ thể
     */
    static async getVersionById(documentId: string, versionId: string): Promise<DocumentVersion> {
        const existing = await PatientDocumentRepository.getById(documentId);
        if (!existing) {
            throw DOCUMENT_VERSION_ERRORS.DOCUMENT_NOT_FOUND;
        }

        const version = await PatientDocumentRepository.getVersionById(versionId);
        if (!version) {
            throw DOCUMENT_VERSION_ERRORS.VERSION_NOT_FOUND;
        }

        return version;
    }
    /**
     * Lấy file_url của tài liệu để dùng cho proxy view/download.
     * Sau khi gọi, controller sẽ redirect về URL này.
     */
    static async getFileUrl(documentId: string): Promise<string> {
        const doc = await PatientDocumentRepository.getById(documentId);
        if (!doc) {
            throw PATIENT_DOCUMENT_ERRORS.NOT_FOUND;
        }

        if (!doc.file_url) {
            throw DOCUMENT_VERSION_ERRORS.NO_FILE_URL;
        }

        return doc.file_url;
    }

    /**
     * Sinh ID cho phiên bản tài liệu: DOCV_YYMMDD_8charUUID
     */
    private static generateVersionId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${DOCUMENT_VERSION_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }
}

