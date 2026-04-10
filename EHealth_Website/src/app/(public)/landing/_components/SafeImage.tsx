"use client";

import { useState } from "react";
import Image from "next/image";

export function SafeImage({ src, alt, fill, className, style }: {
    src: string; alt: string; fill?: boolean; className?: string; style?: React.CSSProperties;
}) {
    const [error, setError] = useState(false);
    if (error || !src) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 ${className || ""}`}
                style={{ ...style, position: fill ? "absolute" : "relative", inset: fill ? 0 : undefined, width: fill ? "100%" : undefined, height: fill ? "100%" : undefined }}>
                <span className="material-symbols-outlined text-3xl mb-1">image</span>
                <span className="text-[10px] text-center px-2 leading-tight">{src.split("/").pop()}</span>
            </div>
        );
    }
    return <Image src={src} alt={alt} fill={fill} className={className} style={style} onError={() => setError(true)} unoptimized />;
}
