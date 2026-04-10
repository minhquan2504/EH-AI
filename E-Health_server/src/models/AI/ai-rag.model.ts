import { AI_RAG_DOCUMENT_STATUS } from '../../constants/ai-rag.constant';

/**
 * Model ánh xạ bảng `ai_documents`
 * Lưu trữ thông tin metadata của file được upload
 */
export interface AiDocument {
    document_id: string;
    file_name: string;
    file_type: string;
    uploaded_by: string | null;
    file_size_bytes: number;
    total_chunks: number;
    status: typeof AI_RAG_DOCUMENT_STATUS[keyof typeof AI_RAG_DOCUMENT_STATUS];
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
}

/**
 * Model ánh xạ bảng `ai_document_chunks`
 * Lưu các đoạn cắt nhỏ và vector embedding
 */
export interface AiDocumentChunk {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    embedding?: string;
    created_at: Date;
}

/**
 * Cấu trúc Payload trả về sau khi tìm kiếm thành công
 */
export interface RAGSearchResult {
    content: string;
    document_id: string;
    file_name: string;
    similarity: number;
}
