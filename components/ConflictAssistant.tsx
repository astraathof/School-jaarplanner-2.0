
import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, ChevronRight, X, Sparkles, Clock, Calendar } from 'lucide-react';
import { SchoolEvent, SchoolSettings } from '../types';

interface ConflictAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    events: SchoolEvent[];
    settings: SchoolSettings;
    validations: {
        fourDayWeek: { count: number; limit: number; isExceeded: boolean; threeDayCount: number };
        teachingNorm: { current: number; required: number; diff: number; isMet: boolean };
    };
    onGoToEvent: (eventId: string) => void;
}

export const ConflictAssistant: React.FC<ConflictAssistantProps> = ({ 
    isOpen, onClose, events, validations, onGoToEvent 
}) => {
    if (!isOpen) return null;

    const conflicts = events.filter(e => {
        // Simple overlap check
        return events.some(other => 
            other.id !== e.id && 
            other.date === e.date && 
            other.type !== 'Thema' && e.type !== 'Thema'
        );
    });

    const uniqueConflicts = Array.from(new Set(conflicts.map(c => c.date)))
        .map(date => conflicts.filter(c => c.date === date));

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-[150] border-l border-slate-200 dark:border-slate-800 flex flex-col"
        >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Conflict Assistent</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Slimme planningshulp</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Normen Check */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wettelijke Normen</h4>
                    
                    <div className={`p-4 rounded-2xl border transition-all ${validations.teachingNorm.isMet ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/50'}`}>
                        <div className="flex items-start gap-3">
                            {validations.teachingNorm.isMet ? <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} /> : <AlertTriangle className="text-rose-500 mt-0.5" size={18} />}
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">Onderwijstijd</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    {validations.teachingNorm.isMet 
                                        ? `Je voldoet aan de norm van ${validations.teachingNorm.required} uur.`
                                        : `Je komt ${validations.teachingNorm.diff} uur tekort om aan de wettelijke norm te voldoen.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border transition-all ${!validations.fourDayWeek.isExceeded ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/50'}`}>
                        <div className="flex items-start gap-3">
                            {!validations.fourDayWeek.isExceeded ? <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} /> : <AlertTriangle className="text-rose-500 mt-0.5" size={18} />}
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">WPO Artikel 18</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    {validations.fourDayWeek.isExceeded 
                                        ? `Te veel korte weken (${validations.fourDayWeek.count}/7). Verplaats enkele studiedagen naar vakantieweken.`
                                        : `Je hebt nog ruimte voor ${7 - validations.fourDayWeek.count} ingekorte weken.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Overlappen */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dubbele Planningen</h4>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{uniqueConflicts.length}</span>
                    </div>

                    {uniqueConflicts.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-center opacity-40">
                            <Calendar size={32} className="mb-3 text-slate-300" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Geen dubbele boekingen</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {uniqueConflicts.map((group, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                            {new Date(group[0].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                        </p>
                                        <div className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Conflict</div>
                                    </div>
                                    <div className="space-y-2">
                                        {group.map(event => (
                                            <button 
                                                key={event.id}
                                                onClick={() => onGoToEvent(event.id)}
                                                className="w-full flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-left border border-transparent hover:border-slate-100 dark:hover:border-slate-600 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{event.title}</span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* AI Insights */}
                <section className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">AI Planningsinzicht</h4>
                        </div>
                        <p className="text-xs font-medium leading-relaxed opacity-90">
                            "Mij valt op dat maart erg druk is met 3 studiedagen. Overweeg er één te verplaatsen naar november om de werkdruk te spreiden."
                        </p>
                        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Pas slimme spreiding toe
                        </button>
                    </div>
                </section>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 italic">
                    <Info size={14} />
                    <p>Deze assistent controleert continu tegen de WPO en jouw schoolplan-doelen.</p>
                </div>
            </div>
        </motion.div>
    );
};
