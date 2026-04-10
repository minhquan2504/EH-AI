import { randomUUID } from 'crypto';
import { Response } from 'express';
import { getGeminiModel, getGeminiModelByName } from '../../config/gemini';
import { AiHealthChatRepository } from '../../repository/AI/ai-health-chat.repository';
import { AiRagService } from './ai-rag.service';
import {
    AiChatSession,
    AiChatMessage,
    AiAnalysisData,
    AiChatResponse,
    AiChatSessionDetail,
    SpecialtyForPrompt,
} from '../../models/AI/ai-health-chat.model';
import {
    AI_GEMINI_CONFIG,
    AI_CHAT_CONFIG,
    AI_CHAT_STATUS,
    AI_CHAT_ROLES,
    AI_CHAT_ERRORS,
    AI_CHAT_SUCCESS,
    AI_CORE_PROMPT,
    AI_DISEASE_KNOWLEDGE_BASE,
} from '../../constants/ai-health-chat.constant';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

/**
 * Service chính cho Module 7.1 — AI Tư Vấn Sức Khỏe Ban Đầu.
 * Chịu trách nhiệm toàn bộ nghiệp vụ: quản lý phiên, gọi Gemini, parse kết quả, ghi log.
 */
export class AiHealthChatService {


    /**
     * Tạo phiên tư vấn AI mới.
     */
    static async startSession(
        userId: string | null,
        message: string
    ): Promise<AiChatResponse> {
        this.validateMessage(message);

        // Kiểm tra giới hạn phiên ACTIVE đồng thời (chỉ áp dụng cho user đã đăng nhập)
        if (userId) {
            const activeCount = await AiHealthChatRepository.countActiveSessionsByUser(userId);
            if (activeCount >= AI_CHAT_CONFIG.MAX_ACTIVE_SESSIONS) {
                throw new AppError(HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_SESSIONS', AI_CHAT_ERRORS.MAX_SESSIONS_REACHED);
            }
        }

        // Tạo session mới
        const sessionId = `AIC_${this.shortId()}`;
        const sessionCode = this.generateSessionCode();

        const session = await AiHealthChatRepository.createSession({
            session_id: sessionId,
            session_code: sessionCode,
            user_id: userId,
            patient_id: null,
            status: AI_CHAT_STATUS.ACTIVE,
            message_count: 0,
        });

        // Lấy danh sách chuyên khoa + RAG context song song
        const [specialties, ragContext] = await Promise.all([
            AiHealthChatRepository.getActiveSpecialties(),
            this.safeRetrieveContext(message),
        ]);

        // Build system prompt — lượt đầu chỉ dùng AI_CORE_PROMPT (tiết kiệm token)
        const systemPrompt = this.buildSystemPrompt(specialties, ragContext, true);

        // Gọi Gemini
        const startTime = Date.now();
        const aiRawResponse = await this.callGeminiWithFallback(systemPrompt, [], message);
        const responseTimeMs = Date.now() - startTime;

        // Parse kết quả
        const { textReply, analysisData, modelUsed, tokensUsed } = aiRawResponse;

        // Lưu 2 tin nhắn: USER + ASSISTANT
        const userMsgId = `MSG_${this.shortId()}`;
        const assistantMsgId = `MSG_${this.shortId()}`;

        await Promise.all([
            AiHealthChatRepository.addMessage({
                message_id: userMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.USER,
                content: message,
                tokens_used: 0,
                response_time_ms: 0,
            }),
            AiHealthChatRepository.addMessage({
                message_id: assistantMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.ASSISTANT,
                content: textReply,
                model_used: modelUsed,
                tokens_used: tokensUsed,
                response_time_ms: responseTimeMs,
                analysis_data: analysisData,
            }),
        ]);

        // Cập nhật session (message_count + kết quả phân tích nếu AI đã đưa gợi ý)
        const sessionUpdates = await this.buildSessionUpdates(analysisData, 2);
        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        return {
            session: updatedSession || session,
            ai_reply: textReply,
            analysis: analysisData,
        };
    }

    /**
     * Gửi tin nhắn tiếp theo trong phiên (JSON response).
     */
    static async sendMessage(
        sessionId: string,
        userId: string | null,
        message: string
    ): Promise<AiChatResponse> {
        this.validateMessage(message);

        const session = await this.validateAndGetSession(sessionId, userId);

        // Kiểm tra giới hạn tin nhắn
        if (session.message_count >= AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Load history + specialties + RAG context song song
        const [existingMessages, specialties, ragContext] = await Promise.all([
            AiHealthChatRepository.getMessagesBySession(sessionId),
            AiHealthChatRepository.getActiveSpecialties(),
            this.safeRetrieveContext(message),
        ]);

        // Lượt 2 trở đi: inject thêm bảng kiến thức bệnh lý
        const isFirstTurn = existingMessages.length <= 2;
        const systemPrompt = this.buildSystemPrompt(specialties, ragContext, isFirstTurn);

        // Convert history sang format Gemini
        const geminiHistory = this.convertHistoryToGemini(existingMessages);

        // Gọi Gemini
        const startTime = Date.now();
        const aiRawResponse = await this.callGeminiWithFallback(systemPrompt, geminiHistory, message);
        const responseTimeMs = Date.now() - startTime;

        const { textReply, analysisData, modelUsed, tokensUsed } = aiRawResponse;

        // Lưu 2 tin nhắn
        const userMsgId = `MSG_${this.shortId()}`;
        const assistantMsgId = `MSG_${this.shortId()}`;

        await Promise.all([
            AiHealthChatRepository.addMessage({
                message_id: userMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.USER,
                content: message,
                tokens_used: 0,
                response_time_ms: 0,
            }),
            AiHealthChatRepository.addMessage({
                message_id: assistantMsgId,
                session_id: sessionId,
                role: AI_CHAT_ROLES.ASSISTANT,
                content: textReply,
                model_used: modelUsed,
                tokens_used: tokensUsed,
                response_time_ms: responseTimeMs,
                analysis_data: analysisData,
            }),
        ]);

        // Cập nhật session
        const newMessageCount = session.message_count + 2;
        const sessionUpdates = await this.buildSessionUpdates(analysisData, newMessageCount);

        // Nếu AI đã gợi ý specialty_code → map sang specialty_id từ DB
        if (analysisData?.suggested_specialty_code) {
            const specialty = await AiHealthChatRepository.findSpecialtyByCode(analysisData.suggested_specialty_code);
            if (specialty) {
                sessionUpdates.suggested_specialty_id = specialty.specialties_id;
                sessionUpdates.suggested_specialty_name = specialty.name;
            }
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

        return {
            session: updatedSession || session,
            ai_reply: textReply,
            analysis: analysisData,
        };
    }

    /**
     * Gửi tin nhắn với streaming response (SSE).
     * SSE Events: chunk → analysis → done | error.
     */
    static async sendMessageStream(
        sessionId: string,
        userId: string | null,
        message: string,
        res: Response
    ): Promise<void> {
        this.validateMessage(message);

        const session = await this.validateAndGetSession(sessionId, userId);

        if (session.message_count >= AI_CHAT_CONFIG.MAX_MESSAGES_PER_SESSION) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MAX_MESSAGES', AI_CHAT_ERRORS.MAX_MESSAGES_REACHED);
        }

        // Setup SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        try {
            const [existingMessages, specialties, ragContext] = await Promise.all([
                AiHealthChatRepository.getMessagesBySession(sessionId),
                AiHealthChatRepository.getActiveSpecialties(),
                this.safeRetrieveContext(message),
            ]);

            const isFirstTurn = existingMessages.length <= 2;
            const systemPrompt = this.buildSystemPrompt(specialties, ragContext, isFirstTurn);
            const geminiHistory = this.convertHistoryToGemini(existingMessages);

            const startTime = Date.now();

            // Gọi Gemini streaming
            const { stream, modelUsed } = await this.callGeminiStreamWithFallback(systemPrompt, geminiHistory, message);

            let fullText = '';
            let totalTokens = 0;

            // Stream từng chunk text tới client
            for await (const chunk of stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullText += chunkText;
                    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
                }
                if (chunk.usageMetadata?.totalTokenCount) {
                    totalTokens = chunk.usageMetadata.totalTokenCount;
                }
            }

            const responseTimeMs = Date.now() - startTime;

            // Parse analysis từ full text
            const analysisData = this.parseGeminiResponse(fullText);
            const textReply = this.extractTextFromResponse(fullText);

            // Gửi event replace — client thay thế nội dung đã stream bằng text sạch (đã loại bỏ JSON)
            if (textReply !== fullText) {
                res.write(`data: ${JSON.stringify({ type: 'replace', content: textReply })}\n\n`);
            }

            // Gửi event analysis
            res.write(`data: ${JSON.stringify({ type: 'analysis', data: analysisData })}\n\n`);

            // Lưu messages vào DB
            const userMsgId = `MSG_${this.shortId()}`;
            const assistantMsgId = `MSG_${this.shortId()}`;

            await Promise.all([
                AiHealthChatRepository.addMessage({
                    message_id: userMsgId,
                    session_id: sessionId,
                    role: AI_CHAT_ROLES.USER,
                    content: message,
                    tokens_used: 0,
                    response_time_ms: 0,
                }),
                AiHealthChatRepository.addMessage({
                    message_id: assistantMsgId,
                    session_id: sessionId,
                    role: AI_CHAT_ROLES.ASSISTANT,
                    content: textReply,
                    model_used: modelUsed,
                    tokens_used: totalTokens,
                    response_time_ms: responseTimeMs,
                    analysis_data: analysisData,
                }),
            ]);

            // Cập nhật session
            const newMessageCount = session.message_count + 2;
            const sessionUpdates = await this.buildSessionUpdates(analysisData, newMessageCount);

            if (analysisData?.suggested_specialty_code) {
                const specialty = await AiHealthChatRepository.findSpecialtyByCode(analysisData.suggested_specialty_code);
                if (specialty) {
                    sessionUpdates.suggested_specialty_id = specialty.specialties_id;
                    sessionUpdates.suggested_specialty_name = specialty.name;
                }
            }

            const updatedSession = await AiHealthChatRepository.updateSession(sessionId, sessionUpdates);

            // Gửi event done
            res.write(`data: ${JSON.stringify({ type: 'done', session: updatedSession })}\n\n`);
            res.end();

        } catch (error: any) {
            const errorMessage = error instanceof AppError ? error.message : AI_CHAT_ERRORS.AI_SERVICE_ERROR;
            res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
            res.end();
        }
    }

    /**
     * Kết thúc phiên tư vấn — đánh dấu COMPLETED.
     */
    static async completeSession(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSession> {
        const session = await this.validateAndGetSession(sessionId, userId);

        if (session.status !== AI_CHAT_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_NOT_ACTIVE', AI_CHAT_ERRORS.SESSION_NOT_ACTIVE);
        }

        const updatedSession = await AiHealthChatRepository.updateSession(sessionId, {
            status: AI_CHAT_STATUS.COMPLETED,
            completed_at: new Date(),
        });

        return updatedSession!;
    }

    /**
     * Lấy lịch sử chat của 1 phiên (session + messages).
     */
    static async getSessionHistory(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSessionDetail> {
        const session = await this.validateAndGetSession(sessionId, userId);
        const messages = await AiHealthChatRepository.getMessagesBySession(sessionId);

        return { session, messages };
    }

    /**
     * Danh sách phiên tư vấn AI của user (phân trang).
     */
    static async getUserSessions(
        userId: string,
        page: number,
        limit: number,
        status?: string
    ): Promise<{ sessions: AiChatSession[]; total: number }> {
        const [sessions, total] = await AiHealthChatRepository.getSessionsByUser(userId, page, limit, status);
        return { sessions, total };
    }

    /**
     * Validate tin nhắn đầu vào: không rỗng, không quá dài.
     */
    private static validateMessage(message: string): void {
        if (!message || !message.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'EMPTY_MESSAGE', AI_CHAT_ERRORS.EMPTY_MESSAGE);
        }
        if (message.length > AI_CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MESSAGE_TOO_LONG', AI_CHAT_ERRORS.MESSAGE_TOO_LONG);
        }
    }

    /**
     * Validate phiên tồn tại, thuộc sở hữu user, và đang ACTIVE.
     */
    private static async validateAndGetSession(
        sessionId: string,
        userId: string | null
    ): Promise<AiChatSession> {
        const session = await AiHealthChatRepository.getSessionById(sessionId);

        if (!session) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SESSION_NOT_FOUND', AI_CHAT_ERRORS.SESSION_NOT_FOUND);
        }

        // Kiểm tra quyền sở hữu (chỉ áp dụng nếu cả 2 đều có userId)
        if (userId && session.user_id && session.user_id !== userId) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, 'UNAUTHORIZED_SESSION', AI_CHAT_ERRORS.UNAUTHORIZED_SESSION);
        }

        if (session.status !== AI_CHAT_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'SESSION_ENDED', AI_CHAT_ERRORS.SESSION_ENDED);
        }

        return session;
    }

    /**
     * Build system prompt hoàn chỉnh.
     * Lượt đầu: chỉ AI_CORE_PROMPT + specialties + RAG.
     * Lượt 2+: thêm AI_DISEASE_KNOWLEDGE_BASE để AI có thêm kiến thức mapping.
     */
    private static buildSystemPrompt(
        specialties: SpecialtyForPrompt[],
        ragContext: string,
        isFirstTurn: boolean
    ): string {
        // Format danh sách chuyên khoa
        const specialtiesList = specialties.length > 0
            ? specialties.map(s => `- ${s.code}: ${s.name}${s.description ? ` (${s.description})` : ''}`).join('\n')
            : '- Chưa có dữ liệu chuyên khoa. Hãy gợi ý chung.';

        // Inject vào template prompt
        let prompt = AI_CORE_PROMPT
            .replace('{{SPECIALTIES_LIST}}', specialtiesList)
            .replace('{{RAG_CONTEXT}}', ragContext || 'Không có tài liệu tham khảo bổ sung.');

        // Từ lượt 2 trở đi mới inject bảng kiến thức bệnh lý
        if (!isFirstTurn) {
            prompt += '\n\n' + AI_DISEASE_KNOWLEDGE_BASE;
        }

        return prompt;
    }

    /**
     * Gọi Gemini với cơ chế fallback
     */
    private static async callGeminiWithFallback(
        systemPrompt: string,
        history: Array<{ role: string; parts: Array<{ text: string }> }>,
        userMessage: string
    ): Promise<{
        textReply: string;
        analysisData: AiAnalysisData | null;
        modelUsed: string;
        tokensUsed: number;
    }> {
        const allModels = [AI_GEMINI_CONFIG.MODEL_NAME, ...AI_GEMINI_CONFIG.FALLBACK_MODELS];

        for (const modelName of allModels) {
            try {
                const model = modelName === AI_GEMINI_CONFIG.MODEL_NAME
                    ? getGeminiModel()
                    : getGeminiModelByName(modelName);

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: 'system: ' + systemPrompt }] },
                        { role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẽ tuân thủ đúng vai trò trợ lý AI sàng lọc triệu chứng và các quy tắc được giao.' }] },
                        ...history,
                    ],
                });

                const result = await chat.sendMessage(userMessage);
                const responseText = result.response.text();
                const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

                // Parse analysis JSON từ response
                const analysisData = this.parseGeminiResponse(responseText);
                const textReply = this.extractTextFromResponse(responseText);

                return {
                    textReply,
                    analysisData,
                    modelUsed: modelName,
                    tokensUsed,
                };

            } catch (error: any) {
                const isRetryable = error?.status === 429 || error?.status === 503 ||
                    error?.message?.includes('429') || error?.message?.includes('503') ||
                    error?.message?.includes('Resource has been exhausted');

                // Nếu là model cuối cùng hoặc lỗi không thuộc dạng retryable → throw
                if (!isRetryable || modelName === allModels[allModels.length - 1]) {
                    console.error(`❌ [AI Chat] Model ${modelName} thất bại:`, error?.message);
                    throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
                }

                console.warn(`⚠️ [AI Chat] Model ${modelName} bị 429/503, đang chuyển sang fallback...`);
                // Chờ 1 giây trước khi thử model tiếp theo — tránh cascading 429
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
    }

    /**
     * Gọi Gemini Streaming với cơ chế fallback.
     */
    private static async callGeminiStreamWithFallback(
        systemPrompt: string,
        history: Array<{ role: string; parts: Array<{ text: string }> }>,
        userMessage: string
    ): Promise<{ stream: AsyncIterable<any>; modelUsed: string }> {
        const allModels = [AI_GEMINI_CONFIG.MODEL_NAME, ...AI_GEMINI_CONFIG.FALLBACK_MODELS];

        for (const modelName of allModels) {
            try {
                const model = modelName === AI_GEMINI_CONFIG.MODEL_NAME
                    ? getGeminiModel()
                    : getGeminiModelByName(modelName);

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: 'system: ' + systemPrompt }] },
                        { role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẽ tuân thủ đúng vai trò trợ lý AI sàng lọc triệu chứng và các quy tắc được giao.' }] },
                        ...history,
                    ],
                });

                const result = await chat.sendMessageStream(userMessage);
                return { stream: result.stream, modelUsed: modelName };

            } catch (error: any) {
                const isRetryable = error?.status === 429 || error?.status === 503 ||
                    error?.message?.includes('429') || error?.message?.includes('503');

                if (!isRetryable || modelName === allModels[allModels.length - 1]) {
                    throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
                }
                console.warn(`⚠️ [AI Chat Stream] Model ${modelName} bị 429/503, chuyển fallback...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw new AppError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'AI_ERROR', AI_CHAT_ERRORS.AI_ALL_MODELS_FAILED);
    }

    /**
     * Trích xuất JSON analysis_data từ response text.
     */
    private static parseGeminiResponse(rawText: string): AiAnalysisData | null {
        try {
            // Tìm block ```json ... ```
            const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
            const match = rawText.match(jsonBlockRegex);

            if (match && match[1]) {
                const parsed = JSON.parse(match[1].trim());
                return this.normalizeAnalysisData(parsed);
            }

            // Fallback: tìm object JSON raw trong text
            const jsonObjectRegex = /\{[\s\S]*"is_complete"[\s\S]*\}/;
            const fallbackMatch = rawText.match(jsonObjectRegex);

            if (fallbackMatch) {
                const parsed = JSON.parse(fallbackMatch[0]);
                return this.normalizeAnalysisData(parsed);
            }

            return null;
        } catch (error) {
            console.warn('⚠️ [AI Chat] Không thể parse analysis JSON:', error);
            return null;
        }
    }

    /**
     * Chuẩn hóa dữ liệu analysis — đảm bảo tất cả trường đều có giá trị mặc định.
     */
    private static normalizeAnalysisData(raw: any): AiAnalysisData {
        return {
            is_complete: raw.is_complete ?? false,
            suggested_specialty_code: raw.suggested_specialty_code || null,
            suggested_specialty_name: raw.suggested_specialty_name || null,
            priority: raw.priority || null,
            symptoms_collected: Array.isArray(raw.symptoms_collected) ? raw.symptoms_collected : [],
            should_suggest_booking: raw.should_suggest_booking ?? false,
            reasoning: raw.reasoning || null,
            severity: raw.severity || null,
            can_self_treat: raw.can_self_treat ?? false,
            preliminary_assessment: raw.preliminary_assessment || null,
            recommended_actions: Array.isArray(raw.recommended_actions) ? raw.recommended_actions : [],
            red_flags_detected: Array.isArray(raw.red_flags_detected) ? raw.red_flags_detected : [],
            needs_doctor: raw.needs_doctor ?? false,
        };
    }

    /**
     * Tách phần text phản hồi (hiển thị cho BN) ra khỏi block JSON.
     * Xử lý 3 trường hợp:
     * 1. Block ```json ... ``` chuẩn
     * 2. Raw JSON object {...} chứa "is_complete" (khi AI quên backtick)
     * 3. Dòng ``` thừa còn sót lại
     */
    private static extractTextFromResponse(rawText: string): string {
        let text = rawText;

        // 1. Loại bỏ block ```json ... ``` (chuẩn format)
        text = text.replace(/```json[\s\S]*?```/g, '');

        // 2. Loại bỏ block ``` ... ``` còn lại (ví dụ ``` { ... } ```)
        text = text.replace(/```[\s\S]*?```/g, '');

        // 3. Loại bỏ raw JSON object chứa "is_complete" (khi AI không bọc backtick)
        text = text.replace(/\{[\s\S]*?"is_complete"[\s\S]*?\}/g, '');

        // 4. Loại bỏ dòng ``` thừa nếu còn sót
        text = text.replace(/```/g, '');

        // 5. Trim và loại bỏ dòng trống liên tiếp
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        return text;
    }

    /**
     * Convert lịch sử tin nhắn từ DB sang format Gemini SDK.
     */
    private static convertHistoryToGemini(
        messages: AiChatMessage[]
    ): Array<{ role: string; parts: Array<{ text: string }> }> {
        return messages
            .filter(m => m.role === AI_CHAT_ROLES.USER || m.role === AI_CHAT_ROLES.ASSISTANT)
            .map(m => ({
                role: m.role === AI_CHAT_ROLES.USER ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));
    }

    /**
     * Build object cập nhật cho session dựa trên analysis results.
     */
    private static async buildSessionUpdates(
        analysisData: AiAnalysisData | null,
        newMessageCount: number
    ): Promise<Partial<AiChatSession>> {
        const updates: Partial<AiChatSession> = {
            message_count: newMessageCount,
        };

        if (analysisData) {
            if (analysisData.priority) {
                updates.suggested_priority = analysisData.priority;
            }
            if (analysisData.symptoms_collected && analysisData.symptoms_collected.length > 0) {
                updates.symptoms_summary = analysisData.symptoms_collected.join(', ');
            }
            if (analysisData.is_complete && analysisData.preliminary_assessment) {
                updates.ai_conclusion = analysisData.preliminary_assessment;
            }
        }

        return updates;
    }

    /**
     * Tạo mã phiên dạng AIC-YYYYMMDD-XXXX.
     */
    private static generateSessionCode(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
        return `${AI_CHAT_CONFIG.SESSION_CODE_PREFIX}-${dateStr}-${randomPart}`;
    }

    /** Tạo short ID duy nhất cho message/session */
    private static shortId(): string {
        return randomUUID().replace(/-/g, '').slice(0, 16);
    }

    /**
     * Gọi RAG context an toàn — nếu lỗi thì trả empty string thay vì throw.
     */
    private static async safeRetrieveContext(query: string): Promise<string> {
        try {
            return await AiRagService.retrieveContext(query);
        } catch (error) {
            console.warn('⚠️ [AI Chat] Lỗi khi lấy RAG context, tiếp tục không có context:', error);
            return '';
        }
    }
}
