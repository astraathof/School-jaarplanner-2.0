import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import type { SchoolEvent, SchoolSettings } from '../types';

interface AuditAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    events: SchoolEvent[];
    settings: SchoolSettings;
}

export const AuditAssistant: React.FC<AuditAssistantProps> = ({ isOpen, onClose, events, settings }) => {
    const analysis = useMemo(() => {
        const issues: { title: string; desc: string; type: 'warning' | 'info' | 'success' }[] = [];
        
        // 1. Check for Rapportage cycles
        const rapports = events.filter(e => e.type === 'Rapportage' || e.title.toLowerCase().includes('rapport'));
        if (rapports.length < 2) {
            issues.push({ 
                title: 'Rapportage Cyclus', 
                desc: 'Er zijn minder dan 2 rapportagemomenten gevonden. Meestal zijn er 3 per jaar.',
                type: 'warning'
            });
        }

        // 2. Check for Studiedagen distribution
        const studyDays = events.filter(e => e.type === 'Studiedag');
        if (studyDays.length > 0 && studyDays.length < 4) {
            issues.push({
                title: 'Professionalisering',
                desc: `Je hebt ${studyDays.length} studiedagen. Voor een gezonde kwaliteitsontwikkeling worden vaak 5-7 dagen geadviseerd.`,
                type: 'info'
            });
        }

        // 3. Parent meetings check
        const parentMeetings = events.filter(e => e.type === 'Ouderavond' || e.title.toLowerCase().includes('ouder'));
        if (parentMeetings.length === 0) {
            issues.push({
                title: 'Ouderbetrokkenheid',
                desc: 'Geen ouderavonden of 10-minuten gesprekken gevonden in de planning.',
                type: 'warning'
            });
        }

        // 4. Balanced workload check (peak months)
        const monthlyCounts: Record<string, number> = {};
        events.forEach(e => {
            const m = new Date(e.date).getUTCMonth();
            monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
        });
        const peakMonth = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1])[0];
        if (peakMonth && peakMonth[1] > 15) {
            const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
            issues.push({
                title: 'Piekbelasting',
                desc: `De maand ${months[parseInt(peakMonth[0])]} lijkt erg druk met ${peakMonth[1]} activiteiten.`,
                type: 'info'
            });
        }

        if (issues.length === 0) {
            issues.push({
                title: 'Planning Optimale Balans',
                desc: 'De planning lijkt goed gebalanceerd en alle kernelementen van het schooljaar zijn aanwezig.',
                type: 'success'
            });
        }

        return issues;
    }, [events]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex justify-end">
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl pointer-events-auto flex flex-col border-l border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Audit Assistant</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Professionele Kwaliteitscheck</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                                <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">Analyse van {events.length} activiteiten</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Ik heb je jaarplanning getoetst aan de standaard inspectienormen en professionele jaarcycli.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bevindingen</h4>
                                {analysis.map((issue, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-4 rounded-2xl border flex gap-4 ${
                                            issue.type === 'warning' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800' :
                                            issue.type === 'success' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800' :
                                            'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="mt-1">
                                            {issue.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                                             issue.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                             <ChevronRight className="w-4 h-4 text-blue-500" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{issue.title}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                {issue.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                             <p className="text-[10px] text-slate-400 italic">
                                 Tip: Gebruik deze suggesties om je planning meer "body" te geven voor de inspectie.
                             </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
