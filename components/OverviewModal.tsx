import React from 'react';
import type { SchoolEvent, SchoolGoal, EventTypeString, SchoolSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag, Edit3, Plus } from 'lucide-react';

interface OverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventType: EventTypeString;
    events: SchoolEvent[];
    goals: SchoolGoal[];
    settings: SchoolSettings;
    onAdd: () => void;
    onEdit: (event: SchoolEvent) => void;
    onGoToDate?: (date: Date) => void;
}

export const OverviewModal: React.FC<OverviewModalProps> = ({ isOpen, onClose, eventType, events, goals, settings, onAdd, onEdit, onGoToDate }) => {
    const goalMap = new Map(goals.map(g => [g.id, g.title]));
    const sortedEvents = [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 print:hidden" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[var(--border-main)]" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-8 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[var(--bg-sidebar)] text-[var(--text-muted)] rounded-2xl">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-[var(--text-main)] tracking-tighter leading-none">Overzicht: {eventType}</h2>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 opacity-40">Alle geplande activiteiten</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-[var(--bg-sidebar)] rounded-2xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto flex-grow bg-[var(--bg-sidebar)]/30">
                            {sortedEvents.length > 0 ? (
                                <ul className="space-y-4">
                                    {sortedEvents.map(event => {
                                        const typeConfig = settings.eventTypes.find(et => et.name === event.type);
                                        const eventColor = event.color || typeConfig?.color || '#94a3b8';
                                        
                                        return (
                                            <li key={event.id} className="p-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                <div 
                                                    className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                                                    style={{ backgroundColor: eventColor }}
                                                />
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-grow pl-2">
                                                        <p className="text-base font-black text-[var(--text-main)] tracking-tight">{event.title}</p>
                                                        <button 
                                                            onClick={() => onGoToDate?.(new Date(event.date))}
                                                            className="text-[11px] font-black hover:text-blue-600 uppercase tracking-widest mt-1.5 flex items-center gap-2 group/date"
                                                            style={{ color: eventColor }}
                                                        >
                                                            {new Date(event.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            <span className="opacity-0 group-hover/date:opacity-100 transition-opacity text-[9px] text-blue-500">Bekijk in kalender →</span>
                                                        </button>
                                                        {event.goalIds && event.goalIds.length > 0 && (
                                                            <div className="mt-4 flex flex-wrap gap-2 items-center">
                                                                <Tag className="h-3 w-3 text-[var(--text-muted)]" />
                                                                {event.goalIds.map(id => (
                                                                    <span key={id} className="text-[9px] font-black uppercase tracking-widest bg-[var(--bg-sidebar)] text-[var(--text-muted)] px-2.5 py-1 rounded-full border border-[var(--border-main)]">
                                                                        {goalMap.get(id) || 'Onbekend doel'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => onEdit(event)} 
                                                        className="p-2.5 text-[var(--text-muted)] hover:text-blue-600 bg-[var(--bg-sidebar)] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                        title="Bewerken"
                                                    >
                                                        <Edit3 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center mb-6">
                                        <Calendar className="h-10 w-10 text-[var(--text-muted)]" />
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Geen items gevonden</h3>
                                    <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[240px]">Er zijn nog geen items van het type "{eventType}" gepland voor dit schooljaar.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex justify-end items-center gap-4">
                             <button 
                                onClick={onAdd} 
                                className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-blue-600 rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-100 dark:shadow-none flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Nieuwe {eventType}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
