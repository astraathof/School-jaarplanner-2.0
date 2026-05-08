import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolEvent, SchoolSettings, INSPECTION_STANDARDS, ValidationWarning } from '../types';
import { AlertTriangle, CheckCircle2, Target, ShieldCheck, Zap, X, ChevronRight, Info } from 'lucide-react';

interface HealthCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: SchoolEvent[];
    settings: SchoolSettings;
    onEventClick: (event: SchoolEvent) => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({ isOpen, onClose, events, settings, onEventClick }) => {
    const activeEvents = events.filter(e => !e.deletedAt);

    // 1. Check Goals Coverage
    const goalCoverage = settings.goals.map(goal => {
        const linkedEvents = activeEvents.filter(e => e.goalIds?.includes(goal.id));
        return { goal, count: linkedEvents.length };
    });
    const uncoveredGoals = goalCoverage.filter(gc => gc.count === 0);

    // 2. Check Inspection Standards Coverage
    const standardCoverage = INSPECTION_STANDARDS.map(std => {
        const linkedEvents = activeEvents.filter(e => e.inspectionStandards?.includes(std.code));
        return { std, count: linkedEvents.length };
    });
    const uncoveredStandards = standardCoverage.filter(sc => sc.count === 0);

    // 3. Check Workload Peaks
    const eventsPerWeek: { [week: string]: number } = {};
    activeEvents.forEach(e => {
        const date = new Date(e.date);
        const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`; // Simple week calc
        eventsPerWeek[week] = (eventsPerWeek[week] || 0) + 1;
    });
    const peaks = Object.entries(eventsPerWeek).filter(([_, count]) => count > 5);

    // 4. Incomplete Events
    const incompleteEvents = activeEvents.filter(e => !e.program || e.program.length < 10);

    const totalIssues = uncoveredGoals.length + uncoveredStandards.length + peaks.length + incompleteEvents.length;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
                    >
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${totalIssues > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {totalIssues > 0 ? <AlertTriangle className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Planning Health Check</h2>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2.5 opacity-40">Kwaliteitscontrole van je jaarplan</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-10 bg-slate-50/30 space-y-10 scrollbar-hide">
                            {totalIssues === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Perfecte Planning!</h3>
                                    <p className="text-slate-500 font-medium mt-3 max-w-md mx-auto">Je planning voldoet aan alle kwaliteitschecks. Alle doelen zijn gedekt en de werkdruk is goed verdeeld.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Goals Coverage */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Target className="h-5 w-5 text-purple-600" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Schooldoelen Dekking</h3>
                                        </div>
                                        {uncoveredGoals.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {uncoveredGoals.map(gc => (
                                                    <div key={gc.goal.id} className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-all">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Geen dekking</span>
                                                            <span className="text-sm font-bold text-slate-800">{gc.goal.title}</span>
                                                        </div>
                                                        <div className="p-2 bg-rose-50 text-rose-400 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                            <Info className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <p className="text-sm font-bold text-emerald-900">Alle schooldoelen hebben minimaal één gekoppelde activiteit.</p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Inspection Standards */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inspectie Standaarden</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {standardCoverage.map(sc => (
                                                <div 
                                                    key={sc.std.code} 
                                                    className={`px-4 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${sc.count > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}
                                                >
                                                    <span className={sc.count > 0 ? 'text-emerald-600' : 'text-slate-300'}>{sc.std.code}</span>
                                                    <span>{sc.count} items</span>
                                                    {sc.count > 0 && <CheckCircle2 className="h-3 w-3" />}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Workload Peaks */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Werkdruk & Pieken</h3>
                                        </div>
                                        {peaks.length > 0 ? (
                                            <div className="space-y-3">
                                                {peaks.map(([week, count]) => (
                                                    <div key={week} className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl font-black text-xs">
                                                                {week}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-amber-900">Hoge werkdruk gesignaleerd</p>
                                                                <p className="text-xs text-amber-600 font-medium">{count} activiteiten in deze week</p>
                                                            </div>
                                                        </div>
                                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                <p className="text-sm font-bold text-emerald-900">De activiteiten zijn goed verspreid over het jaar.</p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Incomplete Events */}
                                    {incompleteEvents.length > 0 && (
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <AlertTriangle className="h-5 w-5 text-rose-500" />
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Onvolledige Items ({incompleteEvents.length})</h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {incompleteEvents.slice(0, 5).map(event => (
                                                    <button 
                                                        key={event.id} 
                                                        onClick={() => onEventClick(event)}
                                                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-2 h-8 bg-rose-400 rounded-full"></div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-slate-800">{event.title}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.date}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                    </button>
                                                ))}
                                                {incompleteEvents.length > 5 && (
                                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest py-2">En nog {incompleteEvents.length - 5} andere items...</p>
                                                )}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-10 border-t border-slate-100 bg-white flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Rapportage</span>
                                <span className={`text-xs font-bold ${totalIssues === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {totalIssues === 0 ? 'Planning is optimaal' : `${totalIssues} verbeterpunten gevonden`}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                Begrepen
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
