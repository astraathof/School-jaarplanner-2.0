
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { SchoolEvent, SchoolSettings, AcademicYear } from '../types';

interface HeatmapModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: SchoolEvent[];
    settings: SchoolSettings;
    academicYear: AcademicYear;
    onMonthClick: (date: Date) => void;
}

export const HeatmapModal: React.FC<HeatmapModalProps> = ({ 
    isOpen, 
    onClose, 
    events, 
    settings, 
    academicYear,
    onMonthClick
}) => {
    const holidaySet = new Set(settings.holidayOverrides.map(h => h.date));
    const eventsByDate = new Map<string, SchoolEvent[]>();
    events.forEach(e => {
        const dateStr = e.date;
        if (!eventsByDate.has(dateStr)) eventsByDate.set(dateStr, []);
        eventsByDate.get(dateStr)!.push(e);
    });

    const months: { name: string; date: Date; days: { date: string; hasEvent: boolean; isHoliday: boolean }[] }[] = [];
    let current = new Date(academicYear.start);
    current.setUTCDate(1);
    while (current < academicYear.end) {
        const monthName = current.toLocaleDateString('nl-NL', { month: 'long' });
        const daysInMonth = [];
        const m = current.getUTCMonth();
        const y = current.getUTCFullYear();
        const d = new Date(Date.UTC(y, m, 1));
        const monthStart = new Date(d);
        while (d.getUTCMonth() === m) {
            const dateStr = d.toISOString().split('T')[0];
            daysInMonth.push({
                date: dateStr,
                hasEvent: eventsByDate.has(dateStr),
                isHoliday: holidaySet.has(dateStr)
            });
            d.setUTCDate(d.getUTCDate() + 1);
        }
        months.push({ name: monthName, date: monthStart, days: daysInMonth });
        current.setUTCMonth(current.getUTCMonth() + 1);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
                    >
                        <div className="flex justify-between items-center p-8 border-b bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none">Jaaroverzicht</h2>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2 opacity-40">Dichtheid van activiteiten</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                                        <span>Rustig</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-100"></div>
                                        <span>Vakantie</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-900 shadow-lg shadow-slate-200"></div>
                                        <span>Druk</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto bg-slate-50/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {months.map(month => (
                                    <div 
                                        key={month.name} 
                                        className="flex flex-col gap-4 cursor-pointer bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 hover:border-slate-900 hover:shadow-xl transition-all duration-500 group"
                                        onClick={() => {
                                            onMonthClick(month.date);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">
                                                {month.name}
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                                                {month.days.filter(d => d.hasEvent).length} items
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2">
                                            {month.days.map((day, idx) => (
                                                <div 
                                                    key={day.date}
                                                    title={day.date}
                                                    className={`aspect-square rounded-full transition-all duration-500 ${
                                                        day.isHoliday ? 'bg-rose-50' : 
                                                        day.hasEvent ? 'bg-slate-900 shadow-lg shadow-slate-200 scale-110' : 
                                                        'bg-slate-50 group-hover:bg-slate-100'
                                                    }`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Info className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1">Tip voor navigatie</h4>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Klik op een specifieke maand om direct naar die periode in de kalender te springen. De heatmap helpt je om piekmomenten in de schoolplanning te identificeren en de werkdruk beter te verdelen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
