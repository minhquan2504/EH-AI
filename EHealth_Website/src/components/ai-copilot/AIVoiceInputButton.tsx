'use client';

import { useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

// ============================================
// Props
// ============================================

interface AIVoiceInputButtonProps {
    onTranscript: (text: string) => void;
    size?: 'sm' | 'md';
}

// ============================================
// Component
// ============================================

export default function AIVoiceInputButton({
    onTranscript,
    size = 'md',
}: AIVoiceInputButtonProps) {
    const { isListening, transcript, isSupported, startListening, stopListening } =
        useVoiceInput({ lang: 'vi-VN' });

    // Forward transcript to parent whenever it changes
    useEffect(() => {
        if (transcript) {
            onTranscript(transcript);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    // Don't render if Web Speech API is unavailable
    if (!isSupported) return null;

    const btnSize = size === 'sm'
        ? 'w-7 h-7'
        : 'w-8 h-8';

    const iconSize = size === 'sm' ? 14 : 16;

    const handleClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            title={isListening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
            className={`
                flex items-center justify-center flex-shrink-0 rounded-full transition-colors
                ${btnSize}
                ${isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-[#687582] dark:text-gray-400'
                }
            `}
        >
            <span
                className="material-symbols-outlined"
                style={{ fontSize: iconSize }}
            >
                {isListening ? 'mic' : 'mic'}
            </span>
        </button>
    );
}
