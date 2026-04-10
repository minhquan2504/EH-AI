import OpenAI from 'openai';

let _openaiClient: OpenAI | null = null;

/**
 * Khởi tạo và trả về singleton OpenAI client.
 */
export const getOpenAIClient = (): OpenAI => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables.');
    }
    if (!_openaiClient) {
        _openaiClient = new OpenAI({ apiKey });
    }
    return _openaiClient;
};
