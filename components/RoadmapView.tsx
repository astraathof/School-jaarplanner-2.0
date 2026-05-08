
import React from 'react';
import { motion } from 'motion/react';
import { Target, ChevronRight, Calendar, X } from 'lucide-react';
import type { SchoolEvent, SchoolSettings } from '../types';

interface RoadmapViewProps {
    events: SchoolEvent[];
    settings: SchoolSettings;
    academicYear: { start: Date; end: Date };
    onClose: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ events, settings, academicYear, onClose }) => {
    const months = [];
    let current = new Date(academicYear.start);
    while (current < academicYear.end) {
        months.push(new Date(current));
        current.setUTCMonth(current.getUTCMonth() + 1);
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 font-sans">
            <div className="p-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Strategische Roadmap</h2>
                        <p className="text-sm text-slate-500 font-bold">Lange-termijn doelen vs. Jaarinhoud</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                </button>
            </div>

            <div className="flex-grow overflow-x-auto overflow-y-auto p-10">
                <div className="min-w-[1200px] space-y-12">
                    {/* Month Header */}
                    <div className="grid grid-cols-[250px_1fr] border-b border-slate-200 pb-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schoolplan Doelen</div>
                        <div className="grid grid-cols-12 gap-2">
                            {months.map(m => (
                                <div key={m.toISOString()} className="text-center">
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                        {m.toLocaleString('nl-NL', { month: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Goal Tracks */}
                    {settings.goals.map(goal => {
                        const goalEvents = events.filter(e => e.goalIds?.includes(goal.id));
                        return (
                            <div key={goal.id} className="grid grid-cols-[250px_1fr] items-center group">
                                <div className="pr-10">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-tight mb-1">{goal.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: `${Math.min(100, (goalEvents.length / 5) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-slate-400">{goalEvents.length}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-12 gap-2 relative h-10">
                                    {/* Rail */}
                                    <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-800/30 rounded-full" />
                                    
                                    {/* Event markers */}
                                    {months.map((m, monthIdx) => {
                                        const eventsInMonth = goalEvents.filter(e => {
                                            const d = new Date(e.date);
                                            return d.getUTCFullYear() === m.getUTCFullYear() && d.getUTCMonth() === m.getUTCMonth();
                                        });

                                        return (
                                            <div key={monthIdx} className="relative h-full flex items-center justify-center">
                                                {eventsInMonth.length > 0 && (
                                                    <motion.div 
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-[9px] font-black z-10"
                                                    >
                                                        {eventsInMonth.length}
                                                    </motion.div>
                                                )}
                                                {eventsInMonth.length > 1 && (
                                                     <div className="absolute inset-0 flex items-center justify-center">
                                                         <div className="w-8 h-8 rounded-full border border-blue-400/20 animate-ping opacity-20" />
                                                     </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="mt-20 p-10 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                         <div className="flex items-start gap-8">
                            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Roadmap Inzicht</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-3xl font-medium leading-relaxed">
                                    Dit overzicht groepeert je losse activiteiten tot strategische "tracks" in je schoolplan. 
                                    Zie je ergens grote gaten? Dat zijn gebieden waar in die maanden geen voortgang op schoolniveau wordt geregistreerd. 
                                    Zie je enorme pieken? Dat duidt op mogelijke overbelasting van die specifieke werkgroep of doelhouder.
                                </p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
