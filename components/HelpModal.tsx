
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Clock, Users, Shield, Zap, Info, HelpCircle, ChevronRight, FileDown, Sparkles, Target, FileText } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTour: () => void;
    onDownloadManual: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onStartTour, onDownloadManual }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-8 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                    <HelpCircle className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Helpcentrum & Resources</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-60">Alles over de Jaarplanner</p>
                                        <div className="h-1 w-1 bg-slate-200 rounded-full" />
                                        <button 
                                            onClick={onDownloadManual}
                                            className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-widest hover:underline group"
                                        >
                                            <FileText size={12} className="group-hover:translate-y-0.5 transition-transform" />
                                            Handleiding (PDF)
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto flex-grow bg-slate-50/30 dark:bg-slate-900/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Section: Snelstart */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Zap size={18} className="fill-current bg-blue-100 dark:bg-blue-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Snelstartgids</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full text-[10px] font-bold">1</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Gebruik <b>AI Snelstart</b> (Slimme Import) om direct een PDF of foto om te zetten naar een werkende agenda.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full text-[10px] font-bold">2</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400"><b>Uniek:</b> Koppel <b>Jaardoelen</b> direct uit het schoolplan aan je kalender voor kwaliteitsborging.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full text-[10px] font-bold">3</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Draai een <b>Health Check</b> of bekijk de <b>Heatmap</b> voor direct inzicht in werkdruk en dekking.</p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Section: Kwaliteit & Strategie */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Target size={18} className="fill-current bg-indigo-100 dark:bg-indigo-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Kwaliteit & Strategie</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full text-[10px] font-bold">4</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Gebruik de <b>Kwaliteitsmatrix</b> om te zien of je planning voldoet aan de inspectie-eisen.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full text-[10px] font-bold">5</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">De <b>Heatmap</b> geeft je direct visueel inzicht in de werkdrukspreiding over het jaar.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full text-[10px] font-bold">6</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Draai een <b>Health Check</b> om blinde vlekken in je planning te ontdekken.</p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Section: FAQ */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-rose-600">
                                        <HelpCircle size={18} className="fill-current bg-rose-100 dark:bg-rose-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Veelgestelde Vragen</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <details className="group cursor-pointer">
                                            <summary className="text-xs font-bold text-slate-800 dark:text-slate-200 list-none flex justify-between items-center group-open:text-blue-600">
                                                Hoe wordt de kwaliteitsscore berekend?
                                                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                                            </summary>
                                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                                De score kijkt naar de dekking van schooldoelen (40%), inspectiestandaarden (30%), volledigheid van de agenda-items (20%) en spreiding van de werkdruk (10%).
                                            </p>
                                        </details>
                                        <details className="group cursor-pointer">
                                            <summary className="text-xs font-bold text-slate-800 dark:text-slate-200 list-none flex justify-between items-center group-open:text-blue-600">
                                                Wat zijn de urennormen?
                                                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                                            </summary>
                                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                                Voor het Primair Onderwijs (PO) geldt een norm van 940 uur. Voor het Voortgezet Onderwijs (VO) rekenen we met een norm van 189 lesdagen.
                                            </p>
                                        </details>
                                        <details className="group cursor-pointer">
                                            <summary className="text-xs font-bold text-slate-800 dark:text-slate-200 list-none flex justify-between items-center group-open:text-blue-600">
                                                Kan ik gegevens exporteren?
                                                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                                            </summary>
                                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                                Ja, via de "Export" knop bovenin kun je de planning opslaan als PDF in verschillende formats, of de data back-uppen als JSON.
                                            </p>
                                        </details>
                                    </div>
                                </div>

                                {/* Section: Cloud & Samenwerken */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <Users size={18} className="fill-current bg-emerald-100 dark:bg-emerald-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Samenwerken</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Log in met Google om de <b>Cloud-modus</b> te activeren. Hiermee kun je collega's uitnodigen en tegelijkertijd aan dezelfde planning werken.
                                    </p>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-start gap-3">
                                            <Info size={16} className="text-emerald-500 mt-0.5" />
                                            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed">
                                                Wijzigingen in de Cloud worden direct opgeslagen en gesynchroniseerd met al je apparaten en collega's.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Professionalisering */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Shield size={18} className="fill-current bg-indigo-100 dark:bg-indigo-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Kwaliteitsborging</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><b>Strategische Roadmap:</b> Borging van schoolplan doelen door het jaar heen.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><b>Inspectie Dashboard:</b> Real-time audit op de 4-daagse week en urennormen.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><b>Audit Assistant:</b> AI-gestuurd advies over professionele jaarcycli.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Sneltoetsen */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <Clock size={18} className="fill-current bg-amber-100 dark:bg-amber-900/40 p-1 rounded-md" />
                                        <h3 className="text-sm font-black uppercase tracking-widest">Slim Werken</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">Snel zoeken</span>
                                            <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-slate-400 shadow-sm">⌘ F</kbd>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">Naar vandaag</span>
                                            <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-slate-400 shadow-sm">T</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Call to action: Tour */}
                            <div className="mt-12 p-8 bg-blue-600 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                    <HelpCircle size={160} />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black tracking-tight mb-2">Liever een visuele tour?</h4>
                                    <p className="text-blue-100 text-xs">Laat ons je de belangrijkste functies stap-voor-stap laten zien.</p>
                                </div>
                                <button 
                                    onClick={() => { onStartTour(); onClose(); }}
                                    className="relative z-10 px-8 py-3 bg-white text-blue-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                                >
                                    Start de Rondleiding
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 School Jaarplanner • v1.2</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
