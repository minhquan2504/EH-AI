/** Escape HTML entities */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Convert simple markdown to HTML (bold, italic, code, blockquote, list) */
export function formatMd(text: string): string {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">$1</code>')
        .replace(/^&gt; (.*)/gm, '<div class="pl-3 border-l-2 border-violet-400 text-gray-500 italic">$1</div>')
        .replace(/^- (.*)/gm, '<div class="flex gap-1.5"><span class="text-violet-500">•</span><span>$1</span></div>')
        .replace(/\| (.*)/g, '<span class="font-mono text-xs">| $1</span>')
        .replace(/\n/g, '<br/>');
}

/** Get current time as HH:MM */
export function getNow(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Role labels in Vietnamese */
export const ROLE_LABELS: Record<string, string> = {
    doctor: 'Bác sĩ',
    pharmacist: 'Dược sĩ',
    receptionist: 'Lễ tân',
    patient: 'Bệnh nhân',
    admin: 'Quản trị',
};

/** Role icons (Material Symbols) */
export const ROLE_ICONS: Record<string, string> = {
    doctor: 'stethoscope',
    pharmacist: 'medication',
    receptionist: 'person_add',
    patient: 'person',
    admin: 'admin_panel_settings',
};
