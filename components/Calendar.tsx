
import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { SchoolEvent, Holiday, SchoolSettings, ValidationWarning, EventTypeString, EventTypeConfig } from '../types';

import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
    events: SchoolEvent[];
    holidays: Holiday[];
    onDayClick: (date: Date) => void;
    onEventClick: (event: SchoolEvent | Holiday) => void;
    onEventDrop: (type: EventTypeString, date: Date, title?: string) => void;
    onEventMove: (eventId: number | string, date: Date) => void; // Supports both Event IDs (number) and Holiday IDs (string)
    onDuplicateEvent: (eventId: number) => void;
    onDeleteEvent: (eventId: number | string) => void;
    onUpdateEvent?: (event: SchoolEvent) => void;
    academicYear: { start: Date; end: Date };
    settings: SchoolSettings;
    warnings: ValidationWarning[];
    calendarView: 'grid-1' | 'grid-2' | 'grid-3' | 'list';
    isDragging?: boolean;
    goToTodayTrigger?: number;
    selectedEventIds?: (number | string)[];
    onToggleSelection?: (id: number | string, shiftKey?: boolean) => void;
    searchTerm?: string;
    highlightedType?: string | null;
}

export const CalendarPdfListView: React.FC<CalendarProps & { monthDate: Date }> = ({ monthDate, events, holidays, settings }) => {
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();
    
    const days = useMemo(() => {
        const d = new Date(Date.UTC(year, month, 1));
        const result = [];
        while (d.getUTCMonth() === month) {
            result.push(new Date(d));
            d.setUTCDate(d.getUTCDate() + 1);
        }
        return result;
    }, [year, month]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, SchoolEvent[]>();
        events.forEach(e => {
            if (!map.has(e.date)) map.set(e.date, []);
            map.get(e.date)?.push(e);
        });
        return map;
    }, [events]);

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, Holiday>();
        holidays.forEach(h => {
            let current = new Date(h.date + 'T00:00:00Z');
            const end = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : new Date(current);
            while (current <= end) {
                map.set(current.toISOString().split('T')[0], h);
                current.setUTCDate(current.getUTCDate() + 1);
            }
        });
        return map;
    }, [holidays]);

    const colorMap = useMemo(() => {
        const map = new Map<string, EventTypeConfig>();
        settings.eventTypes.forEach(t => map.set(t.name, t));
        return map;
    }, [settings.eventTypes]);

    return (
        <div className="flex flex-col w-full bg-[var(--bg-card)] font-sans text-[var(--text-main)] h-full overflow-hidden">
            <div className="grid grid-cols-[4rem_1fr] border-b border-[var(--border-main)] bg-[var(--bg-sidebar)] py-2 px-4">
                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Datum</div>
                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Activiteiten & Vakanties</div>
            </div>
            <div className="flex flex-col divide-y divide-[var(--border-main)]">
                {days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayEvents = eventsByDate.get(dateStr) || [];
                    const holiday = holidaysByDate.get(dateStr);
                    const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' });
                    const dayNum = date.getUTCDate();
                    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

                    return (
                        <div key={dateStr} className={`grid grid-cols-[4rem_1fr] py-1.5 px-4 items-center ${isWeekend ? 'bg-[var(--bg-sidebar)]/50' : ''}`}>
                            <div className="flex flex-col items-end pr-4 border-r border-[var(--border-main)]">
                                <span className={`text-sm font-black ${isWeekend ? 'text-[var(--text-muted)] opacity-30' : 'text-[var(--text-main)]'}`}>{dayNum}</span>
                                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{dayName}</span>
                            </div>
                            <div className="pl-4 flex flex-wrap gap-x-4 gap-y-1 items-center">
                                {holiday && (
                                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-800">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">{holiday.name}</span>
                                        <span className="text-[7px] font-black text-rose-300 dark:text-rose-500 uppercase tracking-tighter">Vakantie</span>
                                    </div>
                                )}
                                {dayEvents.map(event => {
                                    const typeConfig = colorMap.get(event.type);
                                    const dotStyle = typeConfig?.color 
                                        ? { backgroundColor: typeConfig.color } 
                                        : undefined;
                                    const dotClass = !typeConfig?.color 
                                        ? (typeConfig?.colors?.bg || 'bg-slate-100') 
                                        : '';
                                    
                                    const isHalfDay = event.durationMultiplier === 0.5;
                                    return (
                                        <div key={event.id} className="flex items-center gap-1.5 py-0.5">
                                            <div 
                                                className={`w-1.5 h-1.5 rounded-full ${dotClass}`} 
                                                style={dotStyle}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-[var(--text-main)] leading-tight">
                                                    {event.title}
                                                </span>
                                                {isHalfDay && (
                                                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Halve dag</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {!holiday && dayEvents.length === 0 && (
                                    <span className="text-[9px] text-[var(--text-muted)] opacity-20 italic font-medium"></span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const getMonthName = (month: number) => {
    return new Date(2000, month).toLocaleString('nl-NL', { month: 'long' });
};

const getDayName = (day: number) => {
    const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    return days[day];
};

const isSameDay = (d1: Date, d2: Date) => 
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate();

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // @ts-ignore
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const DuplicateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2-2H9a2 2 0 01-2-2V9z" />
        <path d="M4 3a2 2 0 00-2 2v6a2 2 0 002 2h2v-1H4a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v2h1V5a2 2 0 00-2-2H4z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


const EventPill: React.FC<{ 
    event: SchoolEvent; 
    onClick: (event: SchoolEvent) => void; 
    onDuplicate: (id: number) => void; 
    onDelete: (id: number) => void;
    onUpdate?: (event: SchoolEvent) => void;
    isConflict: boolean; 
    colorMap: Map<string, EventTypeConfig>; 
    onDragStart?: () => void;
    isSelected?: boolean;
    onToggleSelection?: (id: number, shiftKey?: boolean) => void;
    searchTerm?: string;
}> = ({ event, onClick, onDuplicate, onDelete, onUpdate, isConflict, colorMap, onDragStart, isSelected, onToggleSelection, searchTerm }) => {
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [titleValue, setTitleValue] = useState(event.title);
    const inputRef = useRef<HTMLInputElement>(null);

    const typeConfig = colorMap.get(event.type);
    const customColor = event.color || typeConfig?.color;
    
    // Modern Tailwind colors fallback
    const tailwindColors = typeConfig?.colors || { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };

    useEffect(() => {
        if (isInlineEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isInlineEditing]);

    const handleUpdate = () => {
        if (titleValue.trim() && titleValue !== event.title && onUpdate) {
            onUpdate({ ...event, title: titleValue.trim() });
        }
        setIsInlineEditing(false);
    };
    
    const handleDragStart = (e: React.DragEvent) => {
        if (isInlineEditing) {
            e.preventDefault();
            return;
        }
        e.stopPropagation(); 
        if(onDragStart) onDragStart();
        const payload = JSON.stringify({ action: 'move', eventId: event.id });
        e.dataTransfer.setData('application/json', payload);
        e.dataTransfer.effectAllowed = 'move';
    };

    let pillClasses = `relative group text-[11px] px-1.5 py-1 rounded-md flex items-center justify-between w-full transition-all border shadow-sm hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' : 'border-transparent hover:border-black/5'}`;
    
    const pillStyle: React.CSSProperties = {};
    if (customColor) {
        // Hex color provided (direct or from type)
        pillStyle.backgroundColor = `${customColor}15`; // ~8% opacity
        pillStyle.borderLeft = `3px solid ${customColor}`;
        pillStyle.color = customColor;
        pillStyle.borderTopColor = 'transparent';
        pillStyle.borderRightColor = 'transparent';
        pillStyle.borderBottomColor = 'transparent';
    } else {
        // Fallback to Tailwind classes if no hex is available
        pillClasses += ` ${tailwindColors.bg} ${tailwindColors.text} ${tailwindColors.border}`;
    }

    if (isConflict) {
        pillClasses += ` border-rose-500 ring-2 ring-rose-400/20 ring-offset-1 animate-pulse`;
    }
    const isDraggable = !event.endDate && !event.recurrence && !isInlineEditing;
     if (isDraggable) {
        pillClasses += ` cursor-grab active:cursor-grabbing`;
    }

    const isHalfDay = event.durationMultiplier === 0.5;

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? 
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-[var(--text-main)] rounded-sm px-0.5">{part}</mark> : 
                        part
                )}
            </span>
        );
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={pillClasses}
            title={event.title + (isHalfDay ? ' (Halve dag)' : '')}
            data-type={event.type}
            draggable={isDraggable}
            onDragStart={isDraggable ? handleDragStart : undefined}
            style={pillStyle}
        >
            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                {onToggleSelection && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); onToggleSelection(event.id!, e.shiftKey); }}
                        className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-[var(--border-main)] group-hover:border-blue-400'}`}
                    >
                        {isSelected && <LucideIcons.Check className="h-2.5 w-2.5 text-white stroke-[4]" />}
                    </div>
                )}
                <div className="flex items-center truncate flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onClick(event); }}>
                    <span 
                        className={`w-1.5 h-1.5 rounded-full ${!customColor ? tailwindColors.bg : ''} mr-1.5 flex-shrink-0 shadow-sm`}
                        style={customColor ? { backgroundColor: customColor } : undefined}
                    />
                    {event.isIncomplete && <WarningIcon />}
                    {isConflict && <LucideIcons.AlertTriangle className="h-3 w-3 text-rose-500 mr-1.5 animate-bounce" />}
                    
                    {isInlineEditing ? (
                        <input
                            ref={inputRef}
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleUpdate}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdate();
                                if (e.key === 'Escape') {
                                    setTitleValue(event.title);
                                    setIsInlineEditing(false);
                                }
                                e.stopPropagation();
                            }}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold tracking-tight text-inherit"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span 
                            className="truncate font-bold tracking-tight cursor-text select-none"
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setIsInlineEditing(true);
                            }}
                        >
                            {searchTerm ? highlightText(event.title, searchTerm) : event.title}{isHalfDay ? ' (½)' : ''}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all absolute right-0.5 top-1/2 -translate-y-1/2 bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-md p-0.5 shadow-sm border border-[var(--border-main)] z-20">
                {isDraggable && (
                    <div className="p-1 text-[var(--text-muted)] hover:text-blue-500 cursor-move" title="Verslepen">
                        <LucideIcons.Move className="h-3 w-3" />
                    </div>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDuplicate(event.id!); }}
                    className="p-1 rounded-md hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-blue-600 transition-colors" 
                    title="Dupliceren">
                    <DuplicateIcon />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(event.id!); }}
                    className="p-1 rounded-md hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-rose-600 transition-colors" 
                    title="Verwijderen">
                    <TrashIcon />
                </button>
            </div>
        </motion.div>
    );
};

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

const DayPopover: React.FC<{
    date: Date;
    events: SchoolEvent[];
    holiday?: Holiday;
    onAdd: (date: Date) => void;
    onEdit: (event: SchoolEvent | Holiday) => void;
    onDuplicate: (id: number) => void;
    onDelete: (id: number) => void;
    style: React.CSSProperties;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    colorMap: Map<string, EventTypeConfig>;
    conflictingEventIds: Set<number | string>;
}> = ({ date, events, holiday, onAdd, onEdit, onDuplicate, onDelete, style, onMouseEnter, onMouseLeave, colorMap, conflictingEventIds, isMobile, onClose }) => {
    const weekNumber = getWeekNumber(date);
    
    const content = (
        <div 
            className={`${isMobile ? 'fixed inset-x-0 bottom-0 z-[200] rounded-t-3xl border-t' : 'absolute z-50 w-72 rounded-2xl border shadow-2xl animate-fade-in-fast'} bg-[var(--bg-card)]/95 backdrop-blur-2xl border-[var(--border-main)] p-5 flex flex-col gap-4`} 
            style={isMobile ? undefined : style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {isMobile && (
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-1 bg-[var(--border-main)]/20 rounded-full" onClick={onClose} />
                </div>
            )}
            <div className="flex justify-between items-start border-b border-[var(--border-main)] pb-4">
                <div className="flex flex-col">
                    <span className="text-lg font-black text-[var(--text-main)] tracking-tighter capitalize leading-none">{format(date, 'EEEE d MMMM', { locale: nl })}</span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2 opacity-40">Week {weekNumber}</span>
                </div>
                {!isMobile && (
                    <button 
                        onClick={() => onAdd(date)}
                        className="p-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95"
                        title="Event toevoegen"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                {holiday && (
                    <div 
                        className="flex items-center text-[11px] text-rose-700 dark:text-rose-400 font-black uppercase tracking-widest truncate bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-800 transition-all shadow-sm" 
                        title={`Wijzig ${holiday.name}`}
                        onClick={() => onEdit(holiday)}
                    >
                        <span className="mr-2 opacity-60"><CalendarIcon /></span>
                        {holiday.name}
                    </div>
                )}
                {events.length > 0 ? events.map(event => (
                     <div key={event.id} className={`group relative text-[12px] p-3 rounded-xl flex items-center justify-between w-full border transition-all hover:shadow-md ${conflictingEventIds.has(event.id!) ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-400' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] hover:border-blue-200'}`}>
                        <div className="flex items-center truncate cursor-pointer flex-1 gap-3" onClick={() => onEdit(event)}>
                            {event.isIncomplete && <WarningIcon />}
                            {conflictingEventIds.has(event.id!) && <LucideIcons.AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />}
                            <span 
                                className={`h-2 w-2 rounded-full ${!colorMap.get(event.type)?.color ? (colorMap.get(event.type)?.colors?.bg || 'bg-gray-200') : ''} flex-shrink-0 shadow-sm`}
                                style={colorMap.get(event.type)?.color ? { backgroundColor: colorMap.get(event.type)?.color } : undefined}
                            />
                            <span className="truncate font-black tracking-tight text-[var(--text-main)]">
                                {event.title}
                                {event.durationMultiplier === 0.5 && <span className="text-[8px] text-[var(--text-muted)] ml-1 font-mono opacity-60">(½)</span>}
                            </span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                            <button onClick={() => onDuplicate(event.id!)} className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-blue-600 transition-all" title="Dupliceren"><DuplicateIcon /></button>
                            <button onClick={() => onDelete(event.id!)} className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-rose-600 transition-all" title="Verwijderen"><TrashIcon /></button>
                        </div>
                    </div>
                )) : (!holiday && <p className="text-[11px] text-[var(--text-muted)] text-center py-6 font-black uppercase tracking-[0.2em] opacity-20">Geen items gepland</p>)}
            </div>
            <button
                onClick={() => onAdd(date)}
                className="w-full py-4 flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
            >
                <PlusIcon className="h-3 w-3" />
                Item Toevoegen
            </button>
            {isMobile && (
                <button onClick={onClose} className="w-full py-3 text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest hover:text-[var(--text-main)] opacity-40">
                    Sluiten
                </button>
            )}
        </div>
    );

    return ReactDOM.createPortal(
        <AnimatePresence mode="wait">
            {isMobile && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
                    onClick={onClose}
                />
            )}
            <motion.div
                initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
                animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
                exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
                transition={isMobile ? { type: "spring", damping: 25, stiffness: 200 } : { duration: 0.15 }}
                className={isMobile ? "fixed inset-x-0 bottom-0 z-[200]" : "fixed z-[200]"}
                style={isMobile ? undefined : style}
                onClick={(e) => isMobile && e.stopPropagation()}
            >
                {content}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};const CalendarGridView: React.FC<CalendarProps> = ({ events, holidays, onDayClick, onEventClick, onEventDrop, onEventMove, onDuplicateEvent, onDeleteEvent, onUpdateEvent, academicYear, settings, warnings, isDragging, calendarView, goToTodayTrigger, selectedEventIds = [], onToggleSelection, searchTerm, highlightedType }) => {
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);
    const [hoveredDay, setHoveredDay] = useState<{ date: Date; target: HTMLElement } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState<React.CSSProperties>({});
    const [contextMenu, setContextMenu] = useState<{ date: Date; x: number; y: number } | null>(null);
    const popoverTimeoutRef = useRef<number | null>(null);
    const currentMonthRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const now = new Date();
    const currentMonthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;

    useEffect(() => {
        if (currentMonthRef.current) {
            currentMonthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [goToTodayTrigger]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, date: Date) => {
        e.preventDefault();
        setContextMenu({ date, x: e.clientX, y: e.clientY });
    };

    const colorMap = useMemo(() => {
        const map = new Map<string, EventTypeConfig>();
        settings.eventTypes.forEach(et => {
            map.set(et.name, et);
        });
        // Add non-user-configurable types
        map.set('Vakantie', { name: 'Vakantie', color: '#f43f5e', colors: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-200' } });
        map.set('Feestdag', { name: 'Feestdag', color: '#ef4444', colors: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-200' } });
        map.set('Vrij', { name: 'Vrij', color: '#10b981', colors: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' } });
        return map;
    }, [settings.eventTypes]);

    // Force close popover immediately when dragging starts (globally)
    useEffect(() => {
        if (isDragging) {
            if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
            setHoveredDay(null);
        }
    }, [isDragging]);

    // Callback to immediately clear hover state when item drag starts (locally)
    const handleItemDragStart = () => {
        setHoveredDay(null);
    };

    useLayoutEffect(() => {
        if (!hoveredDay) return;
        const rect = hoveredDay.target.getBoundingClientRect();
        const popoverHeight = 280; 
        const popoverWidth = 288;
    
        let top = rect.top + window.scrollY;
        let left = rect.right + window.scrollX + 8;
    
        if (left + popoverWidth > window.innerWidth) {
            left = rect.left + window.scrollX - popoverWidth - 8;
        }
        if (rect.top + popoverHeight > window.innerHeight) {
            top = rect.bottom + window.scrollY - popoverHeight;
        }
    
        setPopoverPosition({ top: `${top}px`, left: `${left}px` });

    }, [hoveredDay]);

    const handleMouseEnterDay = (date: Date, e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        if (popoverTimeoutRef.current) {
            clearTimeout(popoverTimeoutRef.current);
        }
        setHoveredDay({ date, target: e.currentTarget });
    };

    const handleMouseLeaveDay = () => {
        popoverTimeoutRef.current = window.setTimeout(() => {
            setHoveredDay(null);
        }, 100);
    };

    const conflictingEventIds = useMemo(() => new Set(
        warnings.filter(w => w.type === 'conflict' && w.eventId).map(w => w.eventId)
    ), [warnings]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, SchoolEvent[]>();
        
        events.forEach(event => {
            if (!event.recurrence || event.recurrence.frequency === 'none') {
                let currentDate = new Date(event.date + 'T00:00:00Z');
                const endDate = event.endDate ? new Date(event.endDate + 'T00:00:00Z') : new Date(currentDate);
                 while (currentDate <= endDate) {
                     const dateStr = currentDate.toISOString().split('T')[0];
                     const dayEvents = map.get(dateStr) || [];
                     dayEvents.push(event);
                     map.set(dateStr, dayEvents);
                     currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                 }
            } else { 
                let currentDate = new Date(event.date + 'T00:00:00Z');
                const recurrenceEndDate = new Date(event.recurrence.endDate + 'T00:00:00Z');
                while (currentDate <= recurrenceEndDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const dayEvents = map.get(dateStr) || [];
                    dayEvents.push(event);
                    map.set(dateStr, dayEvents);

                    if (event.recurrence.frequency === 'weekly') {
                        currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                    } else if (event.recurrence.frequency === 'monthly') {
                        currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    } else {
                        break;
                    }
                }
            }
        });
        return map;
    }, [events]);

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, Holiday>();
        holidays.forEach(holiday => {
            let currentDate = new Date(holiday.date + 'T00:00:00Z');
            const endDate = holiday.endDate ? new Date(holiday.endDate + 'T00:00:00Z') : new Date(currentDate);
            while (currentDate <= endDate) {
                map.set(currentDate.toISOString().split('T')[0], holiday);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        });
        return map;
    }, [holidays]);


    const highlightText = (text: string, highlight: string) => {
        if (!highlight || !highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? 
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-[var(--text-main)] rounded-sm px-0.5">{part}</mark> : 
                        part
                )}
            </span>
        );
    };

    const renderMonth = (year: number, month: number) => {
        const firstDateOfMonth = new Date(Date.UTC(year, month, 1));
        const firstDayOfWeek = (firstDateOfMonth.getUTCDay() + 6) % 7;

        const allCells: { date: Date; isCurrentMonth: boolean }[] = [];
        
        const startDate = new Date(firstDateOfMonth);
        startDate.setUTCDate(startDate.getUTCDate() - firstDayOfWeek);

        for(let i=0; i < 42; i++) {
            const date = new Date(startDate);
            date.setUTCDate(date.getUTCDate() + i);
            allCells.push({
                date,
                isCurrentMonth: date.getUTCMonth() === month
            });
        }
        
        const rows: typeof allCells[] = [];
        for (let i = 0; i < allCells.length; i += 7) {
            const row = allCells.slice(i, i + 7);
            // Only add the row if it contains at least one day from the current month
            if (row.some(cell => cell.isCurrentMonth)) {
                rows.push(row);
            }
        }

        const colWidth = 
            calendarView === 'grid-1' ? 'w-full' : 
            calendarView === 'grid-2' ? 'w-full lg:w-1/2' : 
            'w-full lg:w-1/2 xl:w-1/3';
        const monthTints = [
            'bg-slate-50/30 dark:bg-slate-900/10',
            'bg-blue-50/30 dark:bg-blue-900/10',
            'bg-indigo-50/30 dark:bg-indigo-900/10',
            'bg-slate-50/30 dark:bg-slate-900/10',
            'bg-emerald-50/30 dark:bg-emerald-900/10',
            'bg-amber-50/30 dark:bg-amber-900/10',
        ];
        const monthTint = monthTints[month % monthTints.length];
        const isCurrentMonthView = `${year}-${month}` === currentMonthKey;

        return (
            <div key={`${year}-${month}`} id={`month-${year}-${month}`} ref={isCurrentMonthView ? currentMonthRef : null} className={`flex-none ${colWidth} p-4 print-calendar-month scroll-mt-24`}>
                <div className={`rounded-2xl shadow-sm overflow-hidden border border-[var(--border-main)] h-full flex flex-col transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5 group/month ${monthTint}`}>
                    <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-card)]/40 border-b border-[var(--border-main)] backdrop-blur-sm">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black tracking-tighter capitalize text-[var(--text-main)] leading-none">{getMonthName(month)}</h3>
                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1 opacity-40 group-hover/month:opacity-100 transition-opacity">{year}</span>
                        </div>
                        <div className="w-10 h-1 bg-[var(--bg-sidebar)] rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 dark:bg-blue-600 w-1/4 rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] text-center text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] py-3 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
                        <div className="text-[var(--text-muted)] opacity-30 border-r border-[var(--border-main)]">#</div>
                        {Array.from({ length: 7 }, (_, i) => <div key={i} className={i < 6 ? 'border-r border-[var(--border-main)]' : ''}>{getDayName(i)}</div>)}
                    </div>
                    <div id="calendar-month-grid" className="grid grid-cols-1 flex-grow border-l border-[var(--border-main)]">
                        {rows.map((row, rowIndex) => {
                             const weekDate = row[0].date;
                             const weekNumber = getWeekNumber(weekDate);

                            return (
                                <div key={rowIndex} className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] flex-grow">
                                     <div className="flex items-center justify-center text-[9px] text-[var(--text-muted)] opacity-50 font-black border-r border-b border-[var(--border-main)] bg-[var(--bg-sidebar)]/30 font-mono">{weekNumber}</div>
                                    {row.map(({ date, isCurrentMonth }, dayIndex) => {
                                        const day = date.getUTCDate();
                                        const dateStr = date.toISOString().split('T')[0];
                                        const dayOfWeek = (date.getUTCDay() + 6) % 7;
                                        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                                        const holiday = holidaysByDate.get(dateStr);
                                        const dayEvents = eventsByDate.get(dateStr) || [];
                                        const today = new Date();
                                        const isToday = isSameDay(today, new Date(dateStr + 'T00:00:00Z'));
                                        const isDragOver = dragOverDate === dateStr;
                                        const isDimmed = highlightedType && !dayEvents.some(e => e.type === highlightedType) && !(highlightedType === 'Vakantie' && holiday);

                                        // Find specific full-day colored events
                                        const specialDayEvent = dayEvents.find(e => e.type === 'Studiedag' || e.type === 'Lesvrije dag');

                                        let cellClasses = 'relative group p-1.5 border-r border-b border-[var(--border-main)] min-h-[100px] text-left flex flex-col gap-1 overflow-y-auto transition-all duration-300 print-calendar-day';
                                        let cellStyle: React.CSSProperties = {};

                                        if (holiday) {
                                            const holidayColor = colorMap.get('Vakantie')?.bg || 'bg-rose-50';
                                            cellClasses += ` ${holidayColor} bg-opacity-10 dark:bg-opacity-20`;
                                        } else if (specialDayEvent) {
                                            const colors = colorMap.get(specialDayEvent.type) || { bg: 'bg-slate-100 dark:bg-slate-800' };
                                            if (specialDayEvent.durationMultiplier === 0.5) {
                                                cellStyle.background = `linear-gradient(to right, var(--tw-gradient-stops))`;
                                            } 
                                        } else if (!isCurrentMonth) {
                                            cellClasses += ' bg-slate-400/5 dark:bg-slate-900/20';
                                        } else if (isWeekend) {
                                            cellClasses += ' bg-[var(--bg-sidebar)]/40';
                                        }

                                        if (isCurrentMonth) {
                                            if (!isWeekend && !holiday && !specialDayEvent) cellClasses += ' cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:shadow-inner';
                                            if (isDragOver) cellClasses += ' bg-blue-100/50 dark:bg-blue-900/30 ring-4 ring-inset ring-blue-500/20 z-10 shadow-2xl scale-[1.01]';
                                        } else {
                                            if (!isWeekend && !holiday && !specialDayEvent) cellClasses += ' cursor-pointer hover:bg-slate-200/30 dark:hover:bg-slate-800/30';
                                            if (isDragOver) cellClasses += ' bg-slate-200/50 dark:bg-slate-800/50 ring-2 ring-inset ring-slate-400/20';
                                        }

                                        if (isDimmed) {
                                            cellClasses += ' opacity-20 filter grayscale-[0.5] hover:opacity-100 transition-opacity';
                                        }

                                        const dayNumberClasses = `text-[10px] font-black z-10 relative mb-0.5 transition-all ${isToday ? 'bg-blue-600 text-white rounded-lg h-5 w-5 flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none' : !isCurrentMonth ? 'text-[var(--text-muted)] opacity-40' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`;
                                        
                                        const renderSpecialBackground = () => {
                                            if (!specialDayEvent) return null;
                                            const colors = colorMap.get(specialDayEvent.type);
                                            if (!colors) return null;
                                            
                                            if (specialDayEvent.durationMultiplier === 0.5) {
                                                return (
                                                    <div className={`absolute inset-0 ${colors.bg} opacity-20`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                                                );
                                            } else {
                                                return (
                                                    <div className={`absolute inset-0 ${colors.bg} opacity-20`}></div>
                                                );
                                            }
                                        };

                                        return (
                                            <div 
                                                key={dateStr} 
                                                id={`day-${dateStr}`}
                                                className={cellClasses} 
                                                style={cellStyle}
                                                onDoubleClick={(e) => {
                                                    if (!isWeekend && !holiday && !specialDayEvent) {
                                                        e.stopPropagation();
                                                        onDayClick(date);
                                                    }
                                                }}
                                                onClick={() => {
                                                    if (!isWeekend) {
                                                        if (holiday) {
                                                            onEventClick(holiday);
                                                        } else if (specialDayEvent) {
                                                            onEventClick(specialDayEvent);
                                                        } else {
                                                            onDayClick(date);
                                                        }
                                                    }
                                                }}
                                                onMouseEnter={(e) => handleMouseEnterDay(date, e)}
                                                onMouseLeave={handleMouseLeaveDay}
                                                onContextMenu={(e) => handleContextMenu(e, date)}
                                                onDragOver={(e) => { 
                                                    if(!isWeekend && !holiday && !specialDayEvent) {
                                                        e.preventDefault(); 
                                                        e.dataTransfer.dropEffect = "move"; 
                                                        setDragOverDate(dateStr); 
                                                    } 
                                                }}
                                                onDragEnter={(e) => {
                                                    if(!isWeekend && !holiday && !specialDayEvent) {
                                                        setDragOverDate(dateStr);
                                                    }
                                                }}
                                                onDragLeave={() => {
                                                    setDragOverDate(null);
                                                }}
                                                onDrop={(e) => {
                                                    if (isWeekend || holiday || specialDayEvent) return;
                                                    e.preventDefault();
                                                    setDragOverDate(null);
                                                    
                                                    const jsonData = e.dataTransfer.getData('application/json');
                                                    const plainText = e.dataTransfer.getData('text/plain');

                                                    if (jsonData) {
                                                        try {
                                                            const data = JSON.parse(jsonData);
                                                            if (data.action === 'move') {
                                                                onEventMove(data.eventId, date);
                                                            } else if (data.isTemplate) {
                                                                // Handle template drop
                                                                // We'll need a new callback or use onEventDrop with title
                                                                // For now, let's assume onEventDrop can take an object or we handle it here
                                                                onEventDrop(data.type, date, data.title);
                                                            }
                                                        } catch (err) {
                                                            // Fallback to plain text if JSON fails
                                                            onEventDrop(plainText as EventTypeString, date);
                                                        }
                                                    } else if (plainText) {
                                                        // Check if plain text is a template JSON
                                                        try {
                                                            const data = JSON.parse(plainText);
                                                            if (data.isTemplate) {
                                                                onEventDrop(data.type, date, data.title);
                                                            } else {
                                                                onEventDrop(plainText as EventTypeString, date);
                                                            }
                                                        } catch (err) {
                                                            onEventDrop(plainText as EventTypeString, date);
                                                        }
                                                    }
                                                }}
                                            >
                                                {renderSpecialBackground()}
                                                <span className={dayNumberClasses}>{day}</span>
                                                
                                                {dayEvents.some(e => conflictingEventIds.has(e.id!)) && (
                                                    <div className="absolute top-1 right-1 z-20">
                                                        <LucideIcons.AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                                                    </div>
                                                )}
                                                
                                                {!isWeekend && !holiday && !specialDayEvent && (
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <PlusIcon className="h-3 w-3 text-blue-400" />
                                                    </div>
                                                )}
                                                
                                                {/* Render Holiday Block */}
                                                {holiday && (
                                                    <div 
                                                        className={`relative group text-[10px] text-rose-900 bg-rose-300/50 border border-rose-400/30 rounded px-1.5 py-0.5 font-bold cursor-grab active:cursor-grabbing hover:bg-rose-300 transition-colors z-10 flex justify-between items-center overflow-hidden ${!isCurrentMonth ? 'opacity-80 mix-blend-multiply' : ''}`} 
                                                        title={holiday.name}
                                                        draggable={true}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEventClick(holiday);
                                                        }}
                                                        onDragStart={(e) => {
                                                            handleItemDragStart();
                                                            e.stopPropagation();
                                                            e.dataTransfer.setData('application/json', JSON.stringify({ action: 'move', eventId: holiday.id }));
                                                            e.dataTransfer.effectAllowed = 'move';
                                                        }}
                                                    >
                                                        <span className="truncate">{searchTerm ? highlightText(holiday.name, searchTerm) : holiday.name}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onDeleteEvent(holiday.id); }}
                                                            className="p-0.5 rounded hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                            title="Verwijderen">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Render Special Day Block (Studiedag/Lesvrij) if it acts as background */}
                                                {specialDayEvent && (
                                                     <div 
                                                        className={`relative group text-[10px] px-1.5 py-0.5 rounded font-bold cursor-grab active:cursor-grabbing transition-colors z-10 flex justify-between items-center ${colorMap.get(specialDayEvent.type)?.text} bg-white/60 border border-black/10 overflow-hidden ${!isCurrentMonth ? 'opacity-80' : ''}`}
                                                        title={specialDayEvent.title}
                                                        draggable={true}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEventClick(specialDayEvent);
                                                        }}
                                                        onDragStart={(e) => {
                                                            handleItemDragStart();
                                                            e.stopPropagation();
                                                            e.dataTransfer.setData('application/json', JSON.stringify({ action: 'move', eventId: specialDayEvent.id }));
                                                            e.dataTransfer.effectAllowed = 'move';
                                                        }}
                                                    >
                                                        <span className="truncate">{searchTerm ? highlightText(specialDayEvent.title, searchTerm) : specialDayEvent.type} {specialDayEvent.durationMultiplier === 0.5 && '(½)'}</span>
                                                         <button 
                                                            onClick={(e) => { e.stopPropagation(); onDeleteEvent(specialDayEvent.id!); }}
                                                            className="p-0.5 rounded hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                            title="Verwijderen">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className={`flex flex-col gap-1 z-10 ${!isCurrentMonth ? 'opacity-80' : ''}`}>
                                                    {dayEvents.map(event => {
                                                        // Skip rendering pill if it's the special day rendered as background
                                                        if (specialDayEvent && event.id === specialDayEvent.id) return null;
                                                        
                                                        return (
                                                            <EventPill 
                                                               key={event.id} 
                                                               event={event} 
                                                               onClick={onEventClick}
                                                               onDuplicate={onDuplicateEvent}
                                                               onDelete={(id) => onDeleteEvent(id)}
                                                               isConflict={conflictingEventIds.has(event.id!)} 
                                                               colorMap={colorMap}
                                                               onDragStart={handleItemDragStart}
                                                               isSelected={selectedEventIds.includes(event.id!)}
                                                               onToggleSelection={onToggleSelection}
                                                               searchTerm={searchTerm}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const schoolYearStartYear = parseInt(settings.schoolYear.split('-')[0]);
    const monthsToRender = Array.from({ length: 12 }).map((_, i) => {
        const monthIndex = (7 + i) % 12; // August is month 7
        const year = schoolYearStartYear + Math.floor((7 + i) / 12);
        return { year, month: monthIndex };
    });

    return (
        <div id="calendar-main-container">
            <div 
                className="flex flex-wrap -m-2 print-calendar-grid"
                onDragLeave={() => setDragOverDate(null)}
            >
                {monthsToRender.map(({ year, month }) => renderMonth(year, month))}
            </div>

            {contextMenu && (
                <div 
                    className="fixed z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 min-w-[200px] animate-in fade-in zoom-in duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {contextMenu.date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <button 
                        onClick={() => { onDayClick(contextMenu.date); setContextMenu(null); }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <LucideIcons.Plus className="w-3.5 h-3.5 text-blue-500" />
                        Nieuwe activiteit
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                    {settings.eventTypes.slice(0, 5).map(type => (
                        <button 
                            key={type.name}
                            onClick={() => { 
                                onDayClick(contextMenu.date); 
                                setContextMenu(null); 
                            }}
                            className="w-full text-left px-3 py-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: type.color }} />
                                {type.name}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {hoveredDay && !isDragging && (
                <DayPopover
                    date={hoveredDay.date}
                    events={eventsByDate.get(hoveredDay.date.toISOString().split('T')[0]) || []}
                    holiday={holidaysByDate.get(hoveredDay.date.toISOString().split('T')[0])}
                    onAdd={onDayClick}
                    onEdit={onEventClick}
                    onDuplicate={onDuplicateEvent}
                    onDelete={onDeleteEvent}
                    style={popoverPosition}
                    onMouseEnter={() => {
                        if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeaveDay}
                    colorMap={colorMap}
                    conflictingEventIds={conflictingEventIds}
                />
            )}
        </div>
    );
};

const CalendarListView: React.FC<CalendarProps> = ({ events, holidays, onEventClick, onDuplicateEvent, onDeleteEvent, onUpdateEvent, settings, academicYear, goToTodayTrigger, selectedEventIds = [], onToggleSelection, searchTerm, highlightedType }) => {
     const highlightText = (text: string, highlight: string) => {
        if (!highlight || !highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? 
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-[var(--text-main)] rounded-sm px-0.5">{part}</mark> : 
                        part
                )}
            </span>
        );
    };

     const colorMap = useMemo(() => {
        const map = new Map<string, EventTypeConfig['colors']>();
        settings.eventTypes.forEach(et => {
            map.set(et.name, et.colors);
        });
        map.set('Vakantie', { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-300' });
        map.set('Feestdag', { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' });
        return map;
    }, [settings.eventTypes]);
    
    // Generate a continuous list of months from academic year start to end
    const allMonths = useMemo(() => {
        const months = [];
        if (!academicYear.start || !academicYear.end) return [];
        
        let current = new Date(academicYear.start);
        if (isNaN(current.getTime())) return [];
        
        // Start from the actual first month of the academic year (usually August or September based on calculation)
        // Ensure we start at the 1st of that month UTC
        current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
        
        const end = new Date(academicYear.end);
        if (isNaN(end.getTime())) return [];
        
        // Ensure we include the last month fully
        const safeEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1));

        // Safety break to prevent infinite loop
        let safety = 0;
        while (current < safeEnd && safety < 24) {
            months.push(new Date(current));
            current.setUTCMonth(current.getUTCMonth() + 1);
            safety++;
        }
        return months;
    }, [academicYear]);

    const currentMonthRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentMonthRef.current) {
            currentMonthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [goToTodayTrigger]);

    const itemsByMonth = useMemo(() => {
        const map = new Map<string, any[]>();
        
        // Pre-fill all months keys to ensure continuity
        allMonths.forEach(monthDate => {
            const key = `${monthDate.getUTCFullYear()}-${monthDate.getUTCMonth()}`;
            map.set(key, []);
        });

        // Expand Events
        events.forEach(event => {
             if (!event.recurrence || event.recurrence.frequency === 'none') {
                 const d = new Date(event.date + 'T00:00:00Z');
                 const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
                 if (map.has(key)) {
                     map.get(key)?.push({ ...event, itemType: 'event' });
                 }
             } else {
                // Recurrence logic similar to Grid
                let currentDate = new Date(event.date + 'T00:00:00Z');
                const recurrenceEndDate = new Date(event.recurrence.endDate + 'T00:00:00Z');
                while (currentDate <= recurrenceEndDate) {
                     const key = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}`;
                     if (map.has(key)) {
                         map.get(key)?.push({ ...event, date: currentDate.toISOString().split('T')[0], itemType: 'event' });
                     }
                     if (event.recurrence.frequency === 'weekly') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                     else if (event.recurrence.frequency === 'monthly') currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                     else break;
                }
             }
        });
        
        // Expand Holidays
        holidays.forEach(holiday => {
             let currentDate = new Date(holiday.date + 'T00:00:00Z');
             const endDate = holiday.endDate ? new Date(holiday.endDate + 'T00:00:00Z') : new Date(currentDate);
             while(currentDate <= endDate) {
                const key = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}`;
                if (map.has(key)) {
                    map.get(key)?.push({
                        id: holiday.id,
                        title: holiday.name,
                        date: currentDate.toISOString().split('T')[0],
                        type: holiday.type === 'feestdag' ? 'Feestdag' : 'Vakantie',
                        itemType: 'holiday',
                        originalHoliday: holiday
                    });
                }
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
             }
        });
        
        // Sort items within each month
        map.forEach((items, key) => {
            items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });

        return map;
    }, [allMonths, events, holidays]);

    const now = new Date();
    const currentMonthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 py-8">
            {allMonths.map((monthDate) => {
                const monthKey = `${monthDate.getUTCFullYear()}-${monthDate.getUTCMonth()}`;
                const displayMonth = monthDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
                const items = itemsByMonth.get(monthKey) || [];
                const isCurrentMonth = monthKey === currentMonthKey;

                if (items.length === 0) return null;

                return (
                <div key={monthKey} className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-main)] overflow-hidden transition-all hover:shadow-xl group/list-month" ref={isCurrentMonth ? currentMonthRef : null}>
                    <div className={`px-5 py-3 border-b flex items-center justify-between sticky top-[80px] z-10 transition-colors ${isCurrentMonth ? 'bg-blue-50/90 dark:bg-blue-900/20 backdrop-blur-md border-blue-100 dark:border-blue-800' : 'bg-[var(--bg-sidebar)]/90 backdrop-blur-md border-[var(--border-main)]'}`}>
                        <h3 className={`text-sm font-black tracking-tighter capitalize ${isCurrentMonth ? 'text-blue-900 dark:text-blue-400' : 'text-[var(--text-main)]'}`}>
                            {displayMonth}
                        </h3>
                        {isCurrentMonth && <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Huidige maand</span>}
                    </div>
                    <div className="divide-y divide-[var(--border-main)]">
                        {items.map((item: any, idx) => {
                            const date = new Date(item.date + 'T00:00:00Z');
                            const colors = colorMap.get(item.type) || { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
                            const isHalfDay = item.durationMultiplier === 0.5;
                            const isSelected = selectedEventIds.includes(item.id);
                            const isDimmed = highlightedType && item.type !== highlightedType;

                            return (
                                <div key={`${item.id}-${item.date}-${idx}`} className={`flex items-center gap-6 p-4 hover:bg-[var(--bg-sidebar)]/50 transition-colors group/day ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${isDimmed ? 'opacity-20 grayscale-[0.5]' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        {onToggleSelection && item.itemType === 'event' && (
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); onToggleSelection(item.id, e.shiftKey); }}
                                                className={`w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-[var(--border-main)]'}`}
                                            >
                                                {isSelected && <LucideIcons.Check className="h-3 w-3 stroke-[3]" />}
                                            </div>
                                        )}
                                        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--bg-sidebar)] rounded-xl p-2 group-hover/day:bg-[var(--bg-card)] group-hover/day:shadow-sm transition-all border border-transparent shadow-sm">
                                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">{format(date, 'EEE', { locale: nl })}</span>
                                            <span className="text-lg font-black text-[var(--text-main)] leading-none">{format(date, 'd')}</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col gap-1 cursor-pointer" onClick={() => item.itemType === 'event' && onEventClick(item)}>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-1.5 w-1.5 rounded-full ${colors.bg} shadow-sm`}></span>
                                            <p className="text-[11px] font-black text-[var(--text-main)] tracking-tight">
                                                {searchTerm ? highlightText(item.title, searchTerm) : item.title}
                                                {isHalfDay && <span className="text-[9px] text-[var(--text-muted)] ml-2 font-mono opacity-60">(½)</span>}
                                            </p>
                                        </div>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${colors.text} opacity-60`}>{item.type}</p>
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover/day:opacity-100 transition-all gap-1">
                                        {item.itemType === 'event' ? (
                                            <>
                                                <button onClick={() => onEventClick(item)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-blue-600 shadow-sm border border-transparent hover:border-[var(--border-main)] transition-all" title="Details"><LucideIcons.Edit3 className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => onDuplicateEvent(item.id!)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-blue-600 shadow-sm border border-transparent hover:border-[var(--border-main)] transition-all" title="Dupliceren"><DuplicateIcon /></button>
                                                <button onClick={() => onDeleteEvent(item.id!)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-rose-600 shadow-sm border border-transparent hover:border-[var(--border-main)] transition-all" title="Verwijderen"><TrashIcon /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => onEventClick(item.originalHoliday)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-blue-600 shadow-sm border border-transparent hover:border-[var(--border-main)] transition-all" title="Wijzigen"><LucideIcons.Edit3 className="h-3.5 w-3.5" /></button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )})}
        </div>
    );
};

const getDayColor = (dayIndex: number) => {
    // School specifieke kleuren van de week (Planbord methode)
    const colors = [
        '#FFEB3B', // Maandag - Geel
        '#2196F3', // Dinsdag - Blauw
        '#F44336', // Woensdag - Rood
        '#4CAF50', // Donderdag - Groen
        '#FF9800', // Vrijdag - Oranje
        '#F5F5F5', // Zaterdag - Grijs
        '#F5F5F5'  // Zondag - Grijs
    ];
    return colors[dayIndex];
};

export const CalendarPdfGridView: React.FC<CalendarProps & { monthDate: Date }> = ({ monthDate, events, holidays, settings }) => {
    const year = monthDate.getUTCFullYear();
    const month = monthDate.getUTCMonth();
    const firstDateOfMonth = new Date(Date.UTC(year, month, 1));
    const firstDayOfWeek = (firstDateOfMonth.getUTCDay() + 6) % 7;

    const allCells: { date: Date; isCurrentMonth: boolean }[] = [];
    const startDate = new Date(firstDateOfMonth);
    startDate.setUTCDate(startDate.getUTCDate() - firstDayOfWeek);

    for(let i=0; i < 42; i++) {
        const date = new Date(startDate);
        date.setUTCDate(date.getUTCDate() + i);
        allCells.push({
            date,
            isCurrentMonth: date.getUTCMonth() === month
        });
    }

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, Holiday>();
        holidays.forEach(h => {
            let currentDate = new Date(h.date + 'T00:00:00Z');
            const endDate = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : new Date(currentDate);
            while(currentDate <= endDate) {
                map.set(currentDate.toISOString().split('T')[0], h);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        });
        return map;
    }, [holidays]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, SchoolEvent[]>();
        events.forEach(event => {
            if (!event.recurrence || event.recurrence.frequency === 'none') {
                const dateStr = event.date;
                if (!map.has(dateStr)) map.set(dateStr, []);
                map.get(dateStr)!.push(event);
            } else {
                let currentDate = new Date(event.date + 'T00:00:00Z');
                const recurrenceEndDate = new Date(event.recurrence.endDate + 'T00:00:00Z');
                while (currentDate <= recurrenceEndDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    if (!map.has(dateStr)) map.set(dateStr, []);
                    map.get(dateStr)!.push({ ...event, date: dateStr });
                    if (event.recurrence.frequency === 'weekly') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                    else if (event.recurrence.frequency === 'monthly') currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    else break;
                }
            }
        });
        return map;
    }, [events]);

    const typeColors = useMemo(() => {
        const map = new Map<string, { bg: string; text: string; hex: string }>();
        settings.eventTypes.forEach(t => {
            let hex = t.color || '#94a3b8';
            if (!t.color && t.colors?.bg) {
                const colorMap: Record<string, string> = {
                    'bg-orange-200': '#fed7aa', 'bg-teal-200': '#99f6e4', 'bg-cyan-200': '#a5f3fc',
                    'bg-sky-200': '#bae6fd', 'bg-blue-200': '#bfdbfe', 'bg-indigo-200': '#c7d2fe',
                    'bg-green-200': '#bbf7d0', 'bg-rose-200': '#fecdd3', 'bg-red-200': '#fecaca'
                };
                hex = colorMap[t.colors.bg] || hex;
            }
            map.set(t.name, { 
                bg: t.colors?.bg || 'bg-slate-100', 
                text: t.colors?.text || 'text-slate-700',
                hex: hex
            });
        });
        return map;
    }, [settings.eventTypes]);

    const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Grid Header */}
            <div className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] border-y-2 border-slate-900 overflow-hidden">
                <div className="bg-slate-50 border-r border-slate-200"></div>
                {days.map((day, i) => (
                    <div 
                        key={day} 
                        className="py-3 text-center border-r border-slate-900 last:border-r-0"
                        style={{ backgroundColor: getDayColor(i) }}
                    >
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{day}</span>
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-1 grid-rows-6 flex-grow">
                {Array.from({ length: 6 }).map((_, rowIndex) => {
                    const rowCells = allCells.slice(rowIndex * 7, (rowIndex + 1) * 7);
                    
                    // Check if entire row is outside current month
                    if (!rowCells.some(cell => cell.isCurrentMonth)) return null;

                    const weekNumber = getWeekNumber(rowCells[0].date);

                    return (
                        <div key={rowIndex} className="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] border-b border-slate-900 last:border-b-0 min-h-[85px]">
                            <div className="flex items-center justify-center text-[8px] text-slate-400 font-black tracking-widest bg-slate-50 border-r border-slate-900 [writing-mode:vertical-lr] rotate-180">
                                W {weekNumber}
                            </div>
                            {rowCells.map(({ date, isCurrentMonth }, colIdx) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const dayOfWeek = (date.getUTCDay() + 6) % 7;
                                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                                const holiday = holidaysByDate.get(dateStr);
                                const dayEvents = eventsByDate.get(dateStr) || [];
                                
                                return (
                                    <div 
                                        key={dateStr}
                                        className={`relative p-2 border-r border-slate-900 last:border-r-0 flex flex-col gap-1
                                            ${!isCurrentMonth ? 'bg-slate-50 opacity-40' : ''}
                                            ${isWeekend && isCurrentMonth ? 'bg-slate-50/50' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-base font-black tracking-tighter tabular-nums ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}`}>
                                                {date.getUTCDate()}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            {holiday && (
                                                <div className="text-[9px] font-black text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded border border-rose-200/50 truncate">
                                                    {holiday.name}
                                                </div>
                                            )}

                                            {dayEvents.map((event, eventIdx) => {
                                                const config = typeColors.get(event.type);
                                                if (eventIdx > 5) return null;
                                                if (eventIdx === 5 && dayEvents.length > 6) {
                                                    return (
                                                        <div key="more" className="text-[7px] font-black text-slate-300 uppercase italic">
                                                            + {dayEvents.length - 5} items
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div 
                                                        key={event.id}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <div 
                                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: event.color || config?.hex || '#94a3b8' }}
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-800 leading-tight truncate">
                                                            {event.title}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const CalendarPdfMonthlyEvents: React.FC<{
    monthDate: Date;
    events: SchoolEvent[];
    holidays: Holiday[];
    settings: SchoolSettings;
}> = ({ monthDate, events, holidays, settings }) => {
    const month = monthDate.getUTCMonth();
    const year = monthDate.getUTCFullYear();

    const monthEvents = useMemo(() => {
        return events.filter(e => {
            const eventDate = new Date(e.date + 'T00:00:00Z');
            return eventDate.getUTCMonth() === month && eventDate.getUTCFullYear() === year;
        }).sort((a, b) => a.date.localeCompare(b.date));
    }, [events, month, year]);

    const monthHolidays = useMemo(() => {
        return holidays.filter(h => {
            const startDate = new Date(h.date + 'T00:00:00Z');
            const endDate = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : startDate;
            return (startDate.getUTCMonth() === month && startDate.getUTCFullYear() === year) ||
                   (endDate.getUTCMonth() === month && endDate.getUTCFullYear() === year);
        }).sort((a, b) => a.date.localeCompare(b.date));
    }, [holidays, month, year]);

    const typeColors = useMemo(() => {
        const map = new Map<string, string>();
        settings.eventTypes.forEach(t => {
            let hex = t.color || '#94a3b8';
            if (!t.color && t.colors?.bg) {
                const colorMap: Record<string, string> = {
                    'bg-orange-200': '#fb923c', 'bg-teal-200': '#2dd4bf', 'bg-cyan-200': '#22d3ee',
                    'bg-sky-200': '#38bdf8', 'bg-blue-200': '#60a5fa', 'bg-indigo-200': '#818cf8',
                    'bg-green-200': '#4ade80', 'bg-rose-200': '#fb7185', 'bg-red-200': '#f87171'
                };
                hex = colorMap[t.colors.bg] || hex;
            }
            map.set(t.name, hex);
        });
        return map;
    }, [settings.eventTypes]);

    if (monthEvents.length === 0 && monthHolidays.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <span className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[8px]">Geen geplande activiteiten deze maand</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Belangrijke Data</h3>
                <div className="flex-grow border-b border-slate-100"></div>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3.5">
                {[...monthHolidays.map(h => ({ ...h, isHoliday: true })), ...monthEvents].slice(0, 16).map((item, idx) => {
                    const date = new Date(item.date + 'T00:00:00Z');
                    const day = date.getUTCDate();
                    const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '');
                    
                    const isHoliday = 'isHoliday' in item;
                    const event = !isHoliday ? item as SchoolEvent : null;
                    const holiday = isHoliday ? item as Holiday : null;

                    return (
                        <div key={idx} className="flex items-start gap-4">
                            <div className="flex flex-col items-center min-w-[36px] bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                                <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1.5">{dayName}</span>
                                <span className="text-base font-black text-slate-900 leading-none tabular-nums tracking-tighter">{day}</span>
                            </div>
                            <div className="flex flex-col flex-grow pt-1">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className={`w-2 h-2 rounded-full shadow-sm ring-1 ring-white`}
                                        style={{ backgroundColor: isHoliday ? '#f43f5e' : (typeColors.get(event!.type) || '#94a3b8') }}
                                    />
                                    <span className="text-[11px] font-black text-slate-800 leading-none tracking-tight">
                                        {isHoliday ? holiday!.name : event!.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        {isHoliday ? 'Vakantie' : event!.type}
                                    </span>
                                    {event?.location && (
                                        <span className="text-[7px] font-bold text-slate-300 truncate max-w-[120px]">
                                            • {event.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const CalendarPdfYearPoster: React.FC<{
    events: SchoolEvent[];
    holidays: Holiday[];
    settings: SchoolSettings;
    academicYear: { start: Date; end: Date };
}> = ({ events, holidays, settings, academicYear }) => {
    const months = useMemo(() => {
        const m = [];
        let current = new Date(academicYear.start);
        current.setUTCDate(1);
        while (current < academicYear.end) {
            m.push(new Date(current));
            current.setUTCMonth(current.getUTCMonth() + 1);
        }
        return m;
    }, [academicYear]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, SchoolEvent[]>();
        events.forEach(e => {
            if (!map.has(e.date)) map.set(e.date, []);
            map.get(e.date)?.push(e);
        });
        return map;
    }, [events]);

    const holidaysByDate = useMemo(() => {
        const map = new Map<string, Holiday>();
        holidays.forEach(h => {
            let current = new Date(h.date + 'T00:00:00Z');
            const end = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : current;
            while (current <= end) {
                map.set(current.toISOString().split('T')[0], h);
                current.setUTCDate(current.getUTCDate() + 1);
            }
        });
        return map;
    }, [holidays]);

    return (
        <div className="grid grid-cols-3 gap-x-8 gap-y-10 p-2 bg-white w-[794px] h-[1122px]">
            {months.map(monthDate => {
                const year = monthDate.getUTCFullYear();
                const month = monthDate.getUTCMonth();
                const firstDay = new Date(Date.UTC(year, month, 1));
                const lastDay = new Date(Date.UTC(year, month + 1, 0));
                const startOffset = (firstDay.getUTCDay() + 6) % 7;
                const totalDays = lastDay.getUTCDate();
                
                const cells = [];
                for (let i = 0; i < startOffset; i++) cells.push(null);
                for (let i = 1; i <= totalDays; i++) cells.push(new Date(Date.UTC(year, month, i)));

                return (
                    <div key={monthDate.toISOString()} className="flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 border-b-2 border-slate-900 pb-1.5 font-display flex justify-between items-end">
                            <span>{monthDate.toLocaleString('nl-NL', { month: 'long' })}</span>
                            <span className="text-[8px] text-slate-400 font-bold">{year}</span>
                        </h3>
                        <div className="grid grid-cols-7 gap-[2px] bg-slate-100 border border-slate-100 rounded-sm overflow-hidden">
                            {['M', 'D', 'W', 'D', 'V', 'Z', 'Z'].map((d, i) => (
                                <div key={i} className="bg-slate-50 text-[7px] font-black text-slate-400 text-center py-1 border-b border-slate-100">{d}</div>
                            ))}
                            {cells.map((date, i) => {
                                if (!date) return <div key={i} className="bg-white h-7"></div>;
                                const dateStr = date.toISOString().split('T')[0];
                                const holiday = holidaysByDate.get(dateStr);
                                const dayEvents = eventsByDate.get(dateStr) || [];
                                const hasImportantEvent = dayEvents.some(e => e.type === 'Studiedag' || e.type === 'Lesvrije dag');
                                
                                let bgClass = 'bg-white';
                                if (holiday) bgClass = 'bg-rose-100/80';
                                else if (hasImportantEvent) bgClass = 'bg-amber-100/80';
                                else if (dayEvents.length > 0) bgClass = 'bg-blue-50';

                                return (
                                    <div key={i} className={`${bgClass} h-7 flex flex-col items-center justify-center relative`}>
                                        <span className={`text-[8px] font-black ${holiday ? 'text-rose-900' : 'text-slate-700'} tabular-nums`}>
                                            {date.getUTCDate()}
                                        </span>
                                        {dayEvents.length > 0 && !holiday && !hasImportantEvent && (
                                            <div className="w-[3px] h-[3px] rounded-full bg-blue-500 absolute bottom-1"></div>
                                        )}
                                        {holiday && (
                                            <div className="w-[10px] h-[1px] bg-rose-300 absolute bottom-1"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const Calendar: React.FC<CalendarProps> = (props) => {
    return (
        <div>
            <div id="grid-view-content" className={props.calendarView.startsWith('grid') ? '' : 'hidden'}>
                <CalendarGridView {...props} />
            </div>
            <div id="list-view-content" className={props.calendarView === 'list' ? '' : 'hidden'}>
                <CalendarListView {...props} />
            </div>
        </div>
    );
};
