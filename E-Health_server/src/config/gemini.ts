import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_GEMINI_CONFIG, AI_CHAT_ERRORS } from '../constants/ai-health-chat.constant';

/**
 * Khởi tạo client Google Gemini AI.
 */
export const getGeminiClient = (): GoogleGenerativeAI => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(AI_CHAT_ERRORS.MISSING_API_KEY);
    }
    return new GoogleGenerativeAI(apiKey);
};

/**
 * Lấy Gemini generative model đã cấu hình sẵn.
 */
export const getGeminiModel = () => {
    const client = getGeminiClient();
    return client.getGenerativeModel({
        model: AI_GEMINI_CONFIG.MODEL_NAME,
        generationConfig: {
            maxOutputTokens: AI_GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: AI_GEMINI_CONFIG.TEMPERATURE,
            topP: AI_GEMINI_CONFIG.TOP_P,
            topK: AI_GEMINI_CONFIG.TOP_K,
        },
    });
};

/**
 * Lấy Gemini model theo tên — dùng cho cơ chế fallback khi model chính hết quota.
 */
export const getGeminiModelByName = (modelName: string) => {
    const client = getGeminiClient();
    return client.getGenerativeModel({
        model: modelName,
        generationConfig: {
            maxOutputTokens: AI_GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: AI_GEMINI_CONFIG.TEMPERATURE,
            topP: AI_GEMINI_CONFIG.TOP_P,
            topK: AI_GEMINI_CONFIG.TOP_K,
        },
    });
};
