import { randomUUID } from 'crypto';
// pdf-parse v1.1.1 là CJS thuần, require() trả về hàm trực tiếp
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

import { getOpenAIClient } from '../../config/openai';
import { AiRagRepository } from '../../repository/AI/ai-rag.repository';
import { AiDocument, AiDocumentChunk, RAGSearchResult } from '../../models/AI/ai-rag.model';
import { AI_RAG_CONFIG, AI_RAG_ERRORS, AI_RAG_SUCCESS, AI_RAG_DOCUMENT_STATUS } from '../../constants/ai-rag.constant';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class AiRagService {

    /**
     * Hàm chính: Xử lý file PDF upload
     */
    static async processDocumentFile(
        fileBuffer: Buffer,
        fileName: string,
        uploadedBy: string | null
    ): Promise<AiDocument> {
        const utf8FileName = Buffer.from(fileName, 'latin1').toString('utf8');
        const docId = `DOC_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const document = await AiRagRepository.createDocument({
            document_id: docId,
            file_name: utf8FileName,
            file_type: 'PDF',
            uploaded_by: uploadedBy,
            file_size_bytes: fileBuffer.length,
            status: AI_RAG_DOCUMENT_STATUS.PROCESSING
        });

        this.runIngestionPipeline(fileBuffer, docId).catch((error) => {
            console.error(`[RAG Ingestion Failed] Document ${docId}:`, error);
        });

        return document;
    }

    /**
     * Pipeline ngầm
     */
    private static async runIngestionPipeline(fileBuffer: Buffer, documentId: string) {
        try {
            const textContent = await this.extractTextFromPdf(fileBuffer);

            const textChunks = this.chunkText(textContent, AI_RAG_CONFIG.CHUNK_SIZE, AI_RAG_CONFIG.CHUNK_OVERLAP);

            if (textChunks.length === 0) {
                throw new Error(AI_RAG_ERRORS.EMPTY_FILE);
            }


            const chunksWithEmbeddings = await this.embedTextChunks(textChunks, documentId);


            await AiRagRepository.insertChunks(chunksWithEmbeddings);


            await AiRagRepository.updateDocumentStatus(
                documentId,
                AI_RAG_DOCUMENT_STATUS.COMPLETED,
                textChunks.length
            );

        } catch (error: any) {

            await AiRagRepository.updateDocumentStatus(
                documentId,
                AI_RAG_DOCUMENT_STATUS.FAILED,
                0,
                error?.message || AI_RAG_ERRORS.EMBEDDING_FAILED
            );
        }
    }

    /**
     * Đọc buffer PDF thành Text
     */
    private static async extractTextFromPdf(buffer: Buffer): Promise<string> {
        try {
            const data = await pdfParse(buffer);
            const text = data.text || '';
            if (!text.trim()) {
                throw new Error(AI_RAG_ERRORS.EMPTY_FILE);
            }
            return text;
        } catch (error: any) {
            console.error('[RAG] Lỗi khi đọc file PDF:', error?.message || error);
            throw new Error(error?.message || AI_RAG_ERRORS.INVALID_FILE_TYPE);
        }
    }

    /**
     * Thuật toán Chunking Text có Overlap
     */
    private static chunkText(text: string, chunkSize: number, overlap: number): string[] {

        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();
        if (!cleanText) return [];

        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < cleanText.length) {
            let endIndex = startIndex + chunkSize;


            if (endIndex < cleanText.length) {
                let lastPunctuation = Math.max(
                    cleanText.lastIndexOf('.', endIndex),
                    cleanText.lastIndexOf('\n', endIndex),
                    cleanText.lastIndexOf(' ', endIndex)
                );

                if (lastPunctuation !== -1 && lastPunctuation > startIndex && (endIndex - lastPunctuation) < 100) {
                    endIndex = lastPunctuation + 1;
                }
            }

            const chunk = cleanText.substring(startIndex, endIndex).trim();
            if (chunk) {
                chunks.push(chunk);
            }

            startIndex = endIndex - overlap;
            if (startIndex <= endIndex - chunkSize) {
                startIndex = endIndex;
            }
        }
        return chunks;
    }

    /**
     * Gọi OpenAI Embeddings API theo Batch.
     */
    private static async embedTextChunks(texts: string[], documentId: string): Promise<AiDocumentChunk[]> {
        const BATCH_SIZE = AI_RAG_CONFIG.EMBEDDING_BATCH_SIZE;
        const MAX_RETRIES = AI_RAG_CONFIG.EMBEDDING_MAX_RETRIES;
        const client = getOpenAIClient();
        const results: AiDocumentChunk[] = [];
        const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
            const start = batchIdx * BATCH_SIZE;
            const batchTexts = texts.slice(start, start + BATCH_SIZE);

            console.log(`🧠 [RAG ${documentId}] Embedding batch ${batchIdx + 1}/${totalBatches} (chunks ${start}-${start + batchTexts.length - 1})...`);

            let attempt = 0;
            let batchEmbeddings: number[][] = [];

            while (attempt < MAX_RETRIES) {
                try {

                    const response = await client.embeddings.create({
                        model: AI_RAG_CONFIG.EMBEDDING_MODEL,
                        input: batchTexts,
                        dimensions: AI_RAG_CONFIG.EMBEDDING_OUTPUT_DIMENSIONS,
                    });


                    batchEmbeddings = response.data
                        .sort((a, b) => a.index - b.index)
                        .map(item => item.embedding);

                    break;

                } catch (error: any) {

                    const isRateLimit = error?.status === 429 || error?.code === 'rate_limit_exceeded';
                    if (isRateLimit) {
                        attempt++;
                        const retryAfterMs = this.parseOpenAIRetryDelay(error);
                        if (attempt >= MAX_RETRIES) {
                            console.error(`❌ [RAG ${documentId}] Hết ${MAX_RETRIES} lần retry, bỏ qua.`);
                            throw error;
                        }
                        console.warn(`⚠️  [RAG ${documentId}] 429 Rate Limit. Retry sau ${retryAfterMs / 1000}s (lần ${attempt}/${MAX_RETRIES})...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfterMs));
                    } else {
                        throw error;
                    }
                }
            }


            batchTexts.forEach((textContent, relIdx) => {
                const globalIdx = start + relIdx;
                const vectorString = '[' + batchEmbeddings[relIdx].join(',') + ']';
                results.push({
                    chunk_id: `CHK_${documentId}_${globalIdx}`,
                    document_id: documentId,
                    chunk_index: globalIdx,
                    content: textContent,
                    embedding: vectorString,
                    created_at: new Date()
                });
            });


            if (batchIdx < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return results;
    }

    /**
     * Phân tích retryDelay từ error 429 của OpenAI.
     */
    private static parseOpenAIRetryDelay(error: any): number {
        try {

            const retryAfterStr = error?.headers?.['retry-after'];
            if (retryAfterStr) {
                const seconds = parseFloat(retryAfterStr);
                if (!isNaN(seconds)) return seconds * 1000;
            }

            const match = error?.message?.match(/retry after (\d+(?:\.\d+)?)\s*s/i);
            if (match) return parseFloat(match[1]) * 1000;
        } catch { }
        return 10000;
    }

    /**
     * Tìm kiếm ngữ cảnh: Biến câu hỏi thành Vector -> So sánh Cosine trên DB
     */
    static async retrieveContext(queryText: string): Promise<string> {
        try {
            const client = getOpenAIClient();


            const response = await client.embeddings.create({
                model: AI_RAG_CONFIG.EMBEDDING_MODEL,
                input: queryText,
                dimensions: AI_RAG_CONFIG.EMBEDDING_OUTPUT_DIMENSIONS,
            });

            const queryVectorStr = '[' + response.data[0].embedding.join(',') + ']';


            const topResults = await AiRagRepository.searchSimilarChunks(
                queryVectorStr,
                AI_RAG_CONFIG.TOP_K_RESULTS
            );


            const validResults = topResults.filter(r => r.similarity > 0.5);

            if (validResults.length === 0) {
                return '';
            }


            const contextText = validResults
                .map((r, i) => `--- TÀI LIỆU [${i + 1}]: (Trích từ file ${r.file_name})\n${r.content}`)
                .join('\n\n');

            return contextText;
        } catch (error) {
            console.error('Lỗi khi Retrieve Context:', error);
            return '';
        }
    }


    static async getAllDocuments() {
        return await AiRagRepository.getAllDocuments();
    }

    static async deleteDocument(documentId: string) {
        const success = await AiRagRepository.deleteDocument(documentId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', AI_RAG_ERRORS.DOCUMENT_NOT_FOUND);
        }
        return AI_RAG_SUCCESS.DOCUMENT_DELETED;
    }
}
