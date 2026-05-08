
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldCheck, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp,
    Target,
    BookOpen,
    Plus,
    ShieldAlert
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { SchoolEvent, SchoolSettings } from '../types';

interface CompactSummaryBarProps {
    qualityScore: number;
    reliabilityScore: number;
    teachingDays: number;
    teachingHours: number;
    shortWeeksCount: number;
    shortWeeksLimit: number;
    studyDaysCount: number;
    goalsCount: number;
    coveredGoalsCount: number;
    isVO: boolean;
    onToggleDashboard: () => void;
    isDashboardOpen: boolean;
    onShowHealthCheck: () => void;
    onShowSettings: (section?: any) => void;
    onShowShortenedWeeks: () => void;
    onShowAIImport: () => void;
    onShowBulkAdd: () => void;
}

const SnelstartDropdown: React.FC<{ 
    onShowSettings: (section?: any) => void,
    onShowAIImport: () => void,
    onShowBulkAdd: () => void
}> = ({ onShowSettings, onShowAIImport, onShowBulkAdd }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-all active:scale-95 group"
            >
                <div className="p-1 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
                    <Plus size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Snelstart</span>
                <ChevronDown size={12} className={`opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            <button 
                                onClick={() => { onShowSettings('school-basis'); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><LucideIcons.Settings size={14} /></div>
                                <div>
                                    <div className="font-bold">Basis Instellingen</div>
                                    <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Naam, Type, Regio</div>
                                </div>
                            </button>
                            <button 
                                onClick={() => { onShowAIImport(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group border-t border-slate-50 dark:border-slate-800 pt-3"
                            >
                                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><LucideIcons.Sparkles size={14} /></div>
                                <div>
                                    <div className="font-bold text-indigo-600">Slimme Import</div>
                                    <div className="text-[9px] text-slate-400 uppercase tracking-tighter">AI Document Analyse</div>
                                </div>
                            </button>
                            <button 
                                onClick={() => { onShowBulkAdd(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group"
                            >
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><LucideIcons.LayoutDashboard size={14} /></div>
                                <div>
                                    <div className="font-bold">Bulk Toevoegen</div>
                                    <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Lijst met datums</div>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const CompactSummaryBar: React.FC<CompactSummaryBarProps> = ({
    qualityScore,
    reliabilityScore,
    teachingDays,
    teachingHours,
    shortWeeksCount,
    shortWeeksLimit,
    studyDaysCount,
    goalsCount,
    coveredGoalsCount,
    isVO,
    onToggleDashboard,
    isDashboardOpen,
    onShowHealthCheck,
    onShowSettings,
    onShowShortenedWeeks,
    onShowAIImport,
    onShowBulkAdd
}) => {
    return (
        <div className="flex flex-wrap items-center gap-3 md:gap-6 py-2">
            {/* Snelstart Dropdown */}
            <SnelstartDropdown 
                onShowSettings={onShowSettings}
                onShowAIImport={onShowAIImport}
                onShowBulkAdd={onShowBulkAdd}
            />
            {/* Quality Pill */}
            <button 
                onClick={onShowHealthCheck}
                title={`Kwaliteitsscore: ${qualityScore}%. Klik voor checkup.`}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all group"
            >
                <div className="relative flex items-center justify-center">
                    <svg className="w-5 h-5 -rotate-90">
                        <circle cx="10" cy="10" r="8" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-slate-100 dark:text-slate-700" />
                        <motion.circle 
                            cx="10" cy="10" r="8" fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray="50.27" 
                            initial={{ strokeDashoffset: 50.27 }}
                            animate={{ strokeDashoffset: 50.27 - (50.27 * qualityScore / 100) }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={qualityScore < 50 ? "text-rose-500" : qualityScore < 80 ? "text-amber-500" : "text-emerald-500"} 
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                         <ShieldCheck size={10} className={qualityScore < 50 ? "text-rose-500" : qualityScore < 80 ? "text-amber-500" : "text-emerald-500"} />
                    </div>
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Kwaliteit</span>
                    <span className={`text-xs font-black leading-none ${qualityScore < 50 ? 'text-rose-600' : qualityScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{qualityScore}%</span>
                </div>
            </button>

            {/* Reliability Pill */}
            <button 
                onClick={onShowHealthCheck}
                title={`Betrouwbaarheidsscore: ${reliabilityScore}%. Klik voor checkup.`}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all group"
            >
                <div className="relative flex items-center justify-center">
                    <svg className="w-5 h-5 -rotate-90">
                        <circle cx="10" cy="10" r="8" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-slate-100 dark:text-slate-700" />
                        <motion.circle 
                            cx="10" cy="10" r="8" fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray="50.27" 
                            initial={{ strokeDashoffset: 50.27 }}
                            animate={{ strokeDashoffset: 50.27 - (50.27 * reliabilityScore / 100) }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={reliabilityScore < 50 ? "text-rose-500" : reliabilityScore < 80 ? "text-blue-500" : "text-indigo-500"} 
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                         <LucideIcons.ShieldAlert size={10} className={reliabilityScore < 50 ? "text-rose-500" : reliabilityScore < 80 ? "text-blue-500" : "text-indigo-500"} />
                    </div>
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Betrouwbaarheid</span>
                    <span className={`text-xs font-black leading-none ${reliabilityScore < 50 ? 'text-rose-600' : reliabilityScore < 80 ? 'text-blue-600' : 'text-indigo-600'}`}>{reliabilityScore}%</span>
                </div>
            </button>

            {/* Teaching Stats Pill */}
            <button 
                onClick={onShowHealthCheck}
                title={isVO ? "Totaal aantal lesdagen in dit schooljaar." : "Totaal aantal lesuren in dit schooljaar."}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all group"
            >
                <div className="p-1 rounded-full bg-blue-500/10 text-blue-500 group-hover:rotate-12 transition-transform">
                    {isVO ? <Calendar size={14} /> : <Clock size={14} />}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{isVO ? 'Lesdagen' : 'Lesuren'}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{isVO ? teachingDays : teachingHours.toLocaleString('nl-NL')}</span>
                </div>
            </button>

            {/* Short Weeks Pill */}
            <button 
                onClick={onShowShortenedWeeks}
                title="Weken met minder dan 5 lesdagen. Klik voor details."
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all group ${shortWeeksCount > shortWeeksLimit ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 hover:border-rose-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'}`}
            >
                <div className="relative">
                    <div className={`p-1 rounded-full transition-transform group-hover:scale-110 ${shortWeeksCount > shortWeeksLimit ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <AlertTriangle size={14} />
                    </div>
                    {shortWeeksCount > shortWeeksLimit && (
                        <motion.div 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-rose-500 rounded-full -z-10"
                        />
                    )}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ingekorte Weken</span>
                    <span className={`text-xs font-black leading-none ${shortWeeksCount > shortWeeksLimit ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{shortWeeksCount} / {shortWeeksLimit}</span>
                </div>
            </button>

            {/* Goals Info (Pull-down-ish) */}
            <button 
                onClick={() => onShowSettings('goals')}
                title="Voortgang van leerdoelen. Klik om doelen te beheren."
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all group"
            >
                <div className="p-1 rounded-full bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <Target size={14} />
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Doelen</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{coveredGoalsCount} / {goalsCount}</span>
                </div>
            </button>

            <div className="flex-grow" />

            {/* Toggle Dashboard Button */}
            <button 
                onClick={onToggleDashboard}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-blue-600 text-white rounded-full shadow-lg hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest relative group"
            >
                {!isDashboardOpen && (shortWeeksCount > shortWeeksLimit || qualityScore < 70) && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                )}
                {isDashboardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Dashboard
            </button>

        </div>
    );
};
