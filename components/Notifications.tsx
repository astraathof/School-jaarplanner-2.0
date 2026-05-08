
import React, { useState, useRef, useEffect } from 'react';
import type { ValidationWarning } from '../types';

interface NotificationsProps {
    warnings: ValidationWarning[];
    buttonClass?: string;
    id?: string;
}

const BellIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

const WarningIcon: React.FC<{ type: ValidationWarning['type'] }> = ({ type }) => {
    const color = type === 'conflict' ? 'text-red-500' : type === 'incomplete' ? 'text-amber-500' : 'text-blue-500';
    return (
       <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${color} flex-shrink-0`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
    )
};


export const Notifications: React.FC<NotificationsProps> = ({ warnings, buttonClass, id }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasWarnings = warnings.length > 0;
    const defaultButtonClass = "relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";


    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClass || defaultButtonClass}
                title="Meldingen"
            >
                <BellIcon />
                {hasWarnings && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-black leading-none">{warnings.length}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-main)] z-[110] text-[var(--text-main)] overflow-hidden">
                    <div className="p-4 font-black text-[10px] uppercase tracking-[0.2em] border-b border-[var(--border-main)] bg-[var(--bg-sidebar)]/30 text-[var(--text-muted)]">Aandachtspunten</div>
                    {hasWarnings ? (
                        <ul className="max-h-80 overflow-y-auto">
                            {warnings.map((warning) => (
                                <li key={warning.id} className="flex items-start gap-4 p-4 border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-sidebar)]/50 transition-colors">
                                    <WarningIcon type={warning.type} />
                                    <p className="text-xs text-[var(--text-main)] leading-relaxed">{warning.message}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LucideIcons.CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">Geen meldingen. Alles ziet er goed uit!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Add LucideIcons import if needed, or use existing ones.
import * as LucideIcons from 'lucide-react';
