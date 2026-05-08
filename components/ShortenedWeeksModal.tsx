import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { ShortenedWeekDetail } from '../types';

interface ShortenedWeeksModalProps {
    isOpen: boolean;
    onClose: () => void;
    weeks: ShortenedWeekDetail[];
    onGoToDate?: (date: Date) => void;
}

export const ShortenedWeeksModal: React.FC<ShortenedWeeksModalProps> = ({ isOpen, onClose, weeks, onGoToDate }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                                <LucideIcons.Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Ingekorte Weken</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Overzicht van weken met 4 of minder lesdagen</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <LucideIcons.X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="p-8 max-h-[60vh] overflow-y-auto">
                        {weeks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 mb-4">
                                    <LucideIcons.CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Geen ingekorte weken</h4>
                                <p className="text-xs text-slate-500 mt-2">Alle schoolweken hebben de volledige 5 lesdagen.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {weeks.map((week) => (
                                    <div 
                                        key={week.weekId}
                                        className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                        onClick={() => {
                                            onGoToDate?.(new Date(week.startDate));
                                            onClose();
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Week {week.weekId.split('-')[1]}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${week.teachingDays <= 3 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {week.teachingDays} lesdagen
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                    Start op {new Date(week.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                            <LucideIcons.ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                                        </div>

                                        <div className="space-y-2">
                                            {week.reasons.map((reason, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div className={`p-1 rounded-md ${reason.isHoliday ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-500'}`}>
                                                        {reason.isHoliday ? <LucideIcons.Sun size={12} /> : <LucideIcons.BookOpen size={12} />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{reason.title}</span>
                                                        <span className="text-[8px] text-slate-400 uppercase font-black">{new Date(reason.date).toLocaleDateString('nl-NL', { weekday: 'long' })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-3">
                            <LucideIcons.Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest leading-none">De 4-dagen norm</p>
                                <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                                    Gebaseerd op de WPO: Een school mag per jaar maximaal 7 weken hebben van 4 lesdagen. 
                                    Weken van 3 of minder dagen tellen ook mee voor dit budget. Officiële feestdagen vallen buiten deze telling.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
