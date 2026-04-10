'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================
// Web Speech API types augmentation
// ============================================

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}

// ============================================
// Options
// ============================================

interface UseVoiceInputOptions {
    lang?: string;
    continuous?: boolean;
}

// ============================================
// Return type
// ============================================

interface UseVoiceInputReturn {
    isListening: boolean;
    transcript: string;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
}

// ============================================
// Hook
// ============================================

export function useVoiceInput(options?: UseVoiceInputOptions): UseVoiceInputReturn {
    const lang = options?.lang ?? 'vi-VN';
    const continuous = options?.continuous ?? false;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    // Detect support
    const isSupported =
        typeof window !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition: SpeechRecognitionInstance = new SpeechRecognition();

        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = true;

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let fullTranscript = '';
            for (let i = 0; i < e.results.length; i++) {
                fullTranscript += e.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setTranscript('');
    }, [isSupported, lang, continuous]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return { isListening, transcript, isSupported, startListening, stopListening };
}
