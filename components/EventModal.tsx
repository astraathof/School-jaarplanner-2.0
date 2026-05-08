
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Plus, Trash2, Copy, Clock, User, MapPin, Tag, CheckCircle2, X, ShieldCheck, Calendar, ListTodo, Target, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { SchoolEvent, ViewMode, SchoolGoal, SchoolSettings, EventTypeString, SubAgendaItem, InspectionStandard, INSPECTION_STANDARDS, Holiday, EventPreset } from '../types';

const EVENT_PRESETS: EventPreset[] = [
    { id: 'studiedag', icon: 'BookOpen', template: { title: 'Studiedag Team', description: 'Gehele team lesvrij.', type: 'Studiedag', color: '#f59e0b' } },
    { id: 'mr', icon: 'Users', template: { title: 'MR Vergadering', description: 'Overleg medezeggenschapsraad.', type: 'Overig', color: '#10b981' } },
    { id: 'bouw', icon: 'Layout', template: { title: 'Bouwoverleg', description: 'Sectie/Bouw overleg.', type: 'Overig', color: '#3b82f6' } },
    { id: 'viering', icon: 'Sparkles', template: { title: 'Viering', description: 'Gezamenlijke viering.', type: 'Activiteit', color: '#8b5cf6' } },
];
import { isWithinInterval, parseISO } from 'date-fns';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: SchoolEvent) => void;
    onDelete: (eventId: number) => void;
    event: Partial<SchoolEvent> | null;
    date: Date | null;
    viewMode: ViewMode;
    settings: SchoolSettings;
    allHolidays: Holiday[];
    onOpenGoals: () => void;
    onOpenAIImport: () => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode; }> = ({ isOpen, onClose, title, children, footer }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-center p-4 print:hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                        <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-main)] relative z-10" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-8 py-6 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black text-[var(--text-main)] tracking-tighter capitalize leading-none">{title}</h2>
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1.5 opacity-40">Detailoverzicht</span>
                            </div>
                            <button onClick={onClose} className="p-2.5 hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto scrollbar-hide bg-[var(--bg-card)]">
                            {children}
                        </div>
                        <div className="flex justify-end items-center px-8 py-6 border-t border-[var(--border-main)] bg-[var(--bg-sidebar)]/50">
                            {footer}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, date, viewMode, settings, allHolidays, onOpenGoals, onOpenAIImport }) => {
    const [currentEvent, setCurrentEvent] = useState<Partial<SchoolEvent>>({});
    const [copySuccess, setCopySuccess] = useState(false);
    const [suggestedGoals, setSuggestedGoals] = useState<SchoolGoal[]>([]);

    useEffect(() => {
        if (!currentEvent.title && !currentEvent.program) {
            setSuggestedGoals([]);
            return;
        }

        const searchText = `${currentEvent.title || ''} ${currentEvent.program || ''}`.toLowerCase();
        const suggestions = settings.goals.filter(goal => {
            const goalText = `${goal.title} ${goal.description}`.toLowerCase();
            // Simple keyword matching
            const keywords = searchText.split(/\s+/).filter(w => w.length > 3);
            return keywords.some(kw => goalText.includes(kw)) && !(currentEvent.goalIds || []).includes(goal.id);
        });

        setSuggestedGoals(suggestions);
    }, [currentEvent.title, currentEvent.program, settings.goals, currentEvent.goalIds]);

    const vacationConflict = currentEvent.date ? allHolidays.find(holiday => {
        const start = parseISO(holiday.date);
        const end = holiday.endDate ? parseISO(holiday.endDate) : start;
        const eventDate = parseISO(currentEvent.date!);
        return isWithinInterval(eventDate, { start, end });
    }) : null;

    useEffect(() => {
        const defaultEventType = settings.eventTypes.find(et => et.name === 'Activiteit') ? 'Activiteit' : settings.eventTypes[0]?.name || '';
        if (event) {
            const initialEvent = { ...event };
            if (initialEvent.title === undefined) initialEvent.title = ''; // Ensure title is initialized
            
            if (event.isIncomplete && event.title === event.type) {
                initialEvent.title = '';
            }
            if (!initialEvent.type) {
                initialEvent.type = defaultEventType;
            }
             if (!initialEvent.date && date) {
                initialEvent.date = date.toISOString().split('T')[0];
            }
            // Default duration if not present
            if (initialEvent.durationMultiplier === undefined) {
                initialEvent.durationMultiplier = 1;
            }
            setCurrentEvent(initialEvent);
        } else if (date) {
            setCurrentEvent({
                title: '',
                type: defaultEventType,
                date: date.toISOString().split('T')[0],
                isPublic: false,
                theme: '',
                program: '',
                goalIds: [],
                durationMultiplier: 1
            });
        }
    }, [event, date, isOpen, settings.eventTypes]);

    const titleInputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = (andNew: boolean = false) => {
        const eventToSave = { ...currentEvent };
        onSave(eventToSave as SchoolEvent);
        if (andNew) {
            // Keep date but reset everything else
            setCurrentEvent({
                title: '',
                type: currentEvent.type,
                date: currentEvent.date,
                isPublic: currentEvent.isPublic,
                theme: '',
                program: '',
                goalIds: [],
                durationMultiplier: 1,
                subAgenda: []
            });
            // Refocus title input
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    };

    const isSchoolView = viewMode === 'school';
    const isHoliday = currentEvent.type === 'Vakantie' || currentEvent.type === 'Feestdag';
    const isLesvrij = currentEvent.type === 'Lesvrije dag';

    // Logic to check if it's a "system" holiday which should be read-only title, 
    // OR if it's a custom holiday where the title should be editable.
    // We use 'theme' property as a hacky way to store original name for comparison, 
    // or we rely on whether the event has an ID (dragged event = ID exists)
    const systemHolidayNames = ['Herfstvakantie', 'Kerstvakantie', 'Voorjaarsvakantie', 'Meivakantie', 'Zomervakantie'];
    // @ts-ignore
    const isSystemHoliday = isHoliday && systemHolidayNames.some(name => currentEvent.title?.includes(name));
    
    // if (!isOpen) return null;
    
    const showExtraFields = [
        'Studiedag', 
        'Algemeen Overleg',
        'Teamoverleg',
        'Onderbouwoverleg',
        'Middenbouwoverleg',
        'Bovenbouwoverleg'
    ].includes(currentEvent.type as EventTypeString) && !isHoliday;
    
    const canHaveGoals = ['Studiedag', 'Activiteit'].includes(currentEvent.type as EventTypeString) && !isHoliday;

    const canRecur = [
        'Teamoverleg',
        'Onderbouwoverleg',
        'Middenbouwoverleg',
        'Bovenbouwoverleg',
        'Activiteit'
    ].includes(currentEvent.type as EventTypeString) && !isHoliday;
    
    const handleRecurrenceChange = (field: 'frequency' | 'endDate', value: string) => {
        const newRecurrence = { ...currentEvent.recurrence, [field]: value };
        if (field === 'frequency' && value === 'none') {
             setCurrentEvent({ ...currentEvent, recurrence: { frequency: 'none', endDate: '' } });
        } else {
             setCurrentEvent({ ...currentEvent, recurrence: { frequency: 'weekly', endDate: '', ...newRecurrence } });
        }
    };
    
    const handleGoalToggle = (goalId: number) => {
        const currentGoalIds = currentEvent.goalIds || [];
        const newGoalIds = currentGoalIds.includes(goalId) 
            ? currentGoalIds.filter(id => id !== goalId)
            : [...currentGoalIds, goalId];
        setCurrentEvent({ ...currentEvent, goalIds: newGoalIds });
    };

    const handleInspectionStandardToggle = (standard: InspectionStandard) => {
        const currentStandards = currentEvent.inspectionStandards || [];
        const newStandards = currentStandards.includes(standard)
            ? currentStandards.filter(s => s !== standard)
            : [...currentStandards, standard];
        setCurrentEvent({ ...currentEvent, inspectionStandards: newStandards });
    };

    const addSubAgendaItem = () => {
        const newItem: SubAgendaItem = {
            id: Date.now(),
            time: '',
            activity: '',
            speaker: '',
            location: '',
            theme: ''
        };
        setCurrentEvent({
            ...currentEvent,
            subAgenda: [...(currentEvent.subAgenda || []), newItem]
        });
    };

    const updateSubAgendaItem = (id: number, field: keyof SubAgendaItem, value: string) => {
        setCurrentEvent({
            ...currentEvent,
            subAgenda: (currentEvent.subAgenda || []).map(item => 
                item.id === id ? { ...item, [field]: value } : item
            )
        });
    };

    const removeSubAgendaItem = (id: number) => {
        setCurrentEvent({
            ...currentEvent,
            subAgenda: (currentEvent.subAgenda || []).filter(item => item.id !== id)
        });
    };

    const copyToNewsletter = () => {
        if (!currentEvent.subAgenda || currentEvent.subAgenda.length === 0) return;

        const dateStr = currentEvent.date ? new Date(currentEvent.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
        let text = `📅 PROGRAMMA: ${currentEvent.title}\n🗓️ Datum: ${dateStr}\n\n`;
        
        currentEvent.subAgenda.forEach(item => {
            text += `⏰ ${item.time} - ${item.activity}\n`;
            if (item.speaker) text += `👤 Spreker: ${item.speaker}\n`;
            if (item.location) text += `📍 Locatie: ${item.location}\n`;
            if (item.theme) text += `🏷️ Thema: ${item.theme}\n`;
            text += `\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const isSaveDisabled = !currentEvent.date;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!isSaveDisabled && currentEvent.title) {
                    handleSave(false);
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSaveDisabled, currentEvent.title]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isHoliday ? 'Vakantie Aanpassen' : (event?.id ? 'Item Bewerken' : 'Nieuw Item Toevoegen')}
            footer={
                <div className="w-full flex justify-between items-center">
                    <div>
                        {event?.id && isSchoolView && !isHoliday && (
                            <button onClick={() => onDelete(event.id!)} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-100 dark:shadow-none transition-all active:scale-95">Verwijder</button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl hover:bg-[var(--bg-sidebar)] transition-all active:scale-95">Annuleren</button>
                        {isSchoolView && !event?.id && !isHoliday && (
                            <button 
                                onClick={() => handleSave(true)} 
                                disabled={isSaveDisabled || !currentEvent.title}
                                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus size={12} strokeWidth={3} />
                                Opslaan & Nieuw
                            </button>
                        )}
                        {isSchoolView && <button onClick={() => handleSave(false)} disabled={isSaveDisabled} className="px-7 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 disabled:bg-[var(--bg-sidebar)]/50 disabled:shadow-none disabled:cursor-not-allowed">Opslaan</button>}
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sneltoetsen</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EVENT_PRESETS.map((preset) => {
                            const Icon = (LucideIcons as any)[preset.icon];
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => {
                                        setCurrentEvent({
                                            ...currentEvent,
                                            title: preset.template.title,
                                            type: preset.template.type,
                                            color: preset.template.color
                                        });
                                    }}
                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                >
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                        {Icon && <Icon size={14} className="text-blue-500" />}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter line-clamp-1">{preset.template.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Titel van de activiteit</label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            autoFocus
                            readOnly={!isSchoolView} 
                            value={currentEvent.title || ''}
                            onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                            className={`block w-full px-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 ${!isSchoolView ? 'bg-[var(--bg-sidebar)]/50 text-[var(--text-muted)] cursor-not-allowed' : ''}`}
                            placeholder={currentEvent.type}
                        />

                        {isSchoolView && !isHoliday && (
                            <div className="relative mt-2">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                                <input 
                                    type="text"
                                    value={currentEvent.location || ''}
                                    onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                                    className="block w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 transition-all focus:border-blue-500 outline-none"
                                    placeholder="Locatie (optioneel)"
                                />
                            </div>
                        )}
                        
                        {isSchoolView && (
                            <div className="mt-2 flex items-center gap-3">
                                <button 
                                    onClick={onOpenGoals}
                                    className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 flex items-center gap-1 transition-colors"
                                >
                                    <Target className="h-3 w-3" />
                                    Schooldoelen Beheren
                                </button>
                                <div className="w-px h-2 bg-slate-200 dark:bg-slate-800" />
                                <button 
                                    onClick={onOpenAIImport}
                                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Slimme Import
                                </button>
                            </div>
                        )}

                        {suggestedGoals.length > 0 && isSchoolView && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/50"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                    <span className="text-[10px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-widest">Suggestie: Koppel aan doelen</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedGoals.map(goal => (
                                        <button
                                            key={goal.id}
                                            onClick={() => handleGoalToggle(goal.id)}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <Plus className="h-3 w-3" />
                                            {goal.title}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Type</label>
                        {isHoliday ? (
                            <div className="px-4 py-3 bg-[var(--bg-sidebar)]/50 border border-[var(--border-main)] text-[var(--text-muted)] rounded-xl font-bold text-sm">
                                {currentEvent.type}
                            </div>
                        ) : (
                            <select
                                disabled={!isSchoolView}
                                value={currentEvent.type}
                                onChange={(e) => {
                                    const newType = e.target.value as EventTypeString;
                                    const typeConfig = settings.eventTypes.find(et => et.name === newType);
                                    setCurrentEvent({ 
                                        ...currentEvent, 
                                        type: newType,
                                        // Update default color if user hasn't set a custom one or if changing to a very different type
                                        color: currentEvent.color === settings.eventTypes.find(et => et.name === currentEvent.type)?.color ? typeConfig?.color : currentEvent.color
                                    });
                                }}
                                className="block w-full px-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] disabled:bg-[var(--bg-sidebar)]/50 disabled:cursor-not-allowed appearance-none"
                            >
                                {settings.eventTypes.map(type => <option key={type.name} value={type.name}>{type.name}</option>)}
                            </select>
                        )}
                        
                        {isSchoolView && !isHoliday && (
                            <div className="mt-4">
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Kleur (optioneel)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCurrentEvent({ ...currentEvent, color })}
                                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${currentEvent.color === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {currentEvent.color === color && (
                                                <LucideIcons.Check size={12} className="text-white drop-shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentEvent({ ...currentEvent, color: undefined })}
                                        className={`w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[8px] font-black uppercase tracking-tighter ${!currentEvent.color ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-900' : 'bg-white dark:bg-slate-900'}`}
                                    >
                                        Standaard
                                    </button>
                                    <input 
                                        type="color"
                                        value={currentEvent.color || '#3b82f6'}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, color: e.target.value })}
                                        className="w-7 h-7 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Startdatum</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                            <input
                                type="date"
                                readOnly={!isSchoolView}
                                value={currentEvent.date || ''}
                                onChange={(e) => setCurrentEvent({ ...currentEvent, date: e.target.value })}
                                className={`block w-full pl-11 pr-4 py-3 bg-[var(--bg-sidebar)] border rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] read-only:bg-[var(--bg-sidebar)]/50 ${vacationConflict ? 'border-amber-400 ring-4 ring-amber-400/10' : 'border-[var(--border-main)]'}`}
                            />
                        </div>
                        {vacationConflict && !isHoliday && (
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800">
                                <AlertCircle className="h-3 w-3" />
                                Let op: Valt in {vacationConflict.name}
                            </div>
                        )}
                    </div>
                    {isHoliday && (
                        <div>
                             <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Einddatum</label>
                             <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                                <input
                                    type="date"
                                    readOnly={!isSchoolView}
                                    value={currentEvent.endDate || currentEvent.date || ''}
                                    onChange={(e) => setCurrentEvent({ ...currentEvent, endDate: e.target.value })}
                                    className="block w-full pl-11 pr-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] read-only:bg-[var(--bg-sidebar)]/50"
                                    min={currentEvent.date}
                                />
                             </div>
                        </div>
                    )}
                    <div className={isHoliday ? "md:col-span-1" : "md:col-span-2"}>
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Categorie / Thema</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                            <input
                                type="text"
                                list="theme-suggestions"
                                value={currentEvent.theme || ''}
                                onChange={(e) => setCurrentEvent({ ...currentEvent, theme: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40"
                                placeholder="bv. Onderbouw, Digitale geletterdheid"
                            />
                            <datalist id="theme-suggestions">
                                {settings.themes.map(theme => <option key={theme} value={theme} />)}
                            </datalist>
                        </div>
                    </div>
                </div>
                
                {isLesvrij && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-800">
                        <label className="block text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest mb-3">Duur van de dag</label>
                        <div className="flex gap-6">
                             <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="radio" 
                                        name="duration"
                                        checked={currentEvent.durationMultiplier !== 0.5}
                                        onChange={() => setCurrentEvent({ ...currentEvent, durationMultiplier: 1 })}
                                        className="peer h-5 w-5 opacity-0 absolute"
                                    />
                                    <div className="h-5 w-5 border-2 border-blue-200 dark:border-blue-800 rounded-full peer-checked:border-blue-600 dark:peer-checked:border-blue-400 peer-checked:border-[6px] transition-all" />
                                </div>
                                <span className="ml-3 text-sm font-bold text-[var(--text-main)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Hele dag</span>
                            </label>
                             <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="radio" 
                                        name="duration"
                                        checked={currentEvent.durationMultiplier === 0.5}
                                        onChange={() => setCurrentEvent({ ...currentEvent, durationMultiplier: 0.5 })}
                                        className="peer h-5 w-5 opacity-0 absolute"
                                    />
                                    <div className="h-5 w-5 border-2 border-blue-200 dark:border-blue-800 rounded-full peer-checked:border-blue-600 dark:peer-checked:border-blue-400 peer-checked:border-[6px] transition-all" />
                                </div>
                                <span className="ml-3 text-sm font-bold text-[var(--text-main)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Halve dag (bv. middag vrij)</span>
                            </label>
                        </div>
                        <p className="text-[10px] font-medium text-blue-400 dark:text-blue-500 mt-4 italic">
                            * Een lesvrije dag is een werkdag voor het personeel.
                        </p>
                    </div>
                )}
                
                {canRecur && isSchoolView && (
                    <div className="p-5 bg-[var(--bg-sidebar)] rounded-3xl border border-[var(--border-main)]">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                            <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Herhaling</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Frequentie</label>
                                <select
                                    value={currentEvent.recurrence?.frequency || 'none'}
                                    onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                                    className="block w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] appearance-none"
                                >
                                    <option value="none">Geen</option>
                                    <option value="weekly">Wekelijks</option>
                                    <option value="monthly">Maandelijks</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">Einddatum</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                                    <input
                                        type="date"
                                        disabled={!currentEvent.recurrence || currentEvent.recurrence.frequency === 'none'}
                                        value={currentEvent.recurrence?.endDate || ''}
                                        onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                                        className="block w-full pl-11 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-bold text-[var(--text-main)] disabled:bg-[var(--bg-sidebar)]/50 disabled:cursor-not-allowed"
                                        min={currentEvent.date}
                                    />
                                </div>
                             </div>
                        </div>
                    </div>
                )}
                
                {showExtraFields && isSchoolView && (
                     <div className="space-y-8 border-t border-[var(--border-main)] pt-10">
                        {currentEvent.type === 'Studiedag' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Programma / Agenda</h3>
                                    </div>
                                    <button 
                                        onClick={copyToNewsletter}
                                        disabled={!currentEvent.subAgenda || currentEvent.subAgenda.length === 0}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-sm ${copySuccess ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-sidebar)] disabled:opacity-50'}`}
                                    >
                                        {copySuccess ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copySuccess ? 'Gekopieerd!' : 'Kopieer voor nieuwsbrief'}
                                    </button>
                                </div>
                                
                                <div className="border border-[var(--border-main)] rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none bg-[var(--bg-card)]">
                                    <div className="overflow-x-auto scrollbar-hide">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-[var(--bg-sidebar)]/50 border-b border-[var(--border-main)]">
                                                    <th className="px-6 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-28">Tijd</th>
                                                    <th className="px-6 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Activiteit / Onderwerp</th>
                                                    <th className="px-6 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-40">Spreker</th>
                                                    <th className="px-6 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-40">Locatie</th>
                                                    <th className="px-6 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(currentEvent.subAgenda || []).map((item) => (
                                                    <tr key={item.id} className="border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--bg-sidebar)]/30 transition-colors group">
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text"
                                                                placeholder="09:00"
                                                                value={item.time}
                                                                onChange={(e) => updateSubAgendaItem(item.id, 'time', e.target.value)}
                                                                className="w-full px-3 py-2 text-xs border-transparent hover:border-[var(--border-main)] focus:border-slate-900 dark:focus:border-blue-500 focus:ring-0 rounded-xl transition-all font-bold bg-transparent text-[var(--text-main)]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text"
                                                                placeholder="Inloop & Koffie"
                                                                value={item.activity}
                                                                onChange={(e) => updateSubAgendaItem(item.id, 'activity', e.target.value)}
                                                                className="w-full px-3 py-2 text-xs border-transparent hover:border-[var(--border-main)] focus:border-slate-900 dark:focus:border-blue-500 focus:ring-0 rounded-xl transition-all font-black text-[var(--text-main)] bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text"
                                                                placeholder="Naam"
                                                                value={item.speaker || ''}
                                                                onChange={(e) => updateSubAgendaItem(item.id, 'speaker', e.target.value)}
                                                                className="w-full px-3 py-2 text-[10px] border-transparent hover:border-[var(--border-main)] focus:border-slate-900 dark:focus:border-blue-500 focus:ring-0 rounded-xl transition-all text-[var(--text-muted)] bg-transparent font-medium"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text"
                                                                placeholder="Zaal"
                                                                value={item.location || ''}
                                                                onChange={(e) => updateSubAgendaItem(item.id, 'location', e.target.value)}
                                                                className="w-full px-3 py-2 text-[10px] border-transparent hover:border-[var(--border-main)] focus:border-slate-900 dark:focus:border-blue-500 focus:ring-0 rounded-xl transition-all text-[var(--text-muted)] bg-transparent font-medium"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                onClick={() => removeSubAgendaItem(item.id)}
                                                                className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <button 
                                        onClick={addSubAgendaItem}
                                        className="w-full py-5 bg-[var(--bg-sidebar)]/50 hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-t border-[var(--border-main)]"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Rij toevoegen
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentEvent.type !== 'Studiedag' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Programma / Beschrijving</h3>
                                </div>
                                <textarea
                                    rows={4}
                                    value={currentEvent.program || ''}
                                    onChange={(e) => setCurrentEvent({ ...currentEvent, program: e.target.value })}
                                    className="block w-full px-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-3xl shadow-sm focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-blue-500/10 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 resize-none"
                                    placeholder="Beschrijf hier het programma..."
                                />
                            </div>
                        )}
                    </div>
                )}
                
                {canHaveGoals && isSchoolView && settings.goals.length > 0 && (
                    <div className="space-y-6 border-t border-[var(--border-main)] pt-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Koppel aan schoolplan doelen</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {settings.goals.map(goal => {
                                const isSelected = currentEvent.goalIds?.includes(goal.id) || false;
                                return (
                                    <button 
                                        key={goal.id}
                                        onClick={() => handleGoalToggle(goal.id)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-4 text-left ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-xl shadow-purple-100 dark:shadow-none' : 'bg-[var(--bg-sidebar)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-purple-200 dark:hover:border-purple-900 hover:bg-[var(--bg-card)]'}`}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : 'bg-[var(--border-main)]'}`}></div>
                                        <span className="line-clamp-1">{goal.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {canHaveGoals && isSchoolView && (
                    <div className="space-y-6 border-t border-[var(--border-main)] pt-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
                            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Kwaliteitscyclus (Inspectie)</h3>
                        </div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Koppel aan inspectiestandaarden voor rapportage</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {INSPECTION_STANDARDS.map(standard => {
                                const isSelected = currentEvent.inspectionStandards?.includes(standard.code) || false;
                                return (
                                    <button 
                                        key={standard.code}
                                        onClick={() => handleInspectionStandardToggle(standard.code)}
                                        title={standard.description}
                                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col gap-1 text-left ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100 dark:shadow-none' : 'bg-[var(--bg-sidebar)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-emerald-200 dark:hover:border-emerald-900 hover:bg-[var(--bg-card)]'}`}
                                    >
                                        <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>{standard.code}</span>
                                        <span className={`opacity-80 font-bold normal-case tracking-normal line-clamp-1 ${isSelected ? 'text-white' : 'text-[var(--text-muted)]'}`}>{standard.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isSchoolView && !isHoliday && (
                    <div className="flex items-center p-5 bg-slate-900 dark:bg-blue-950 rounded-3xl border border-slate-800 dark:border-blue-900 shadow-2xl shadow-slate-200 dark:shadow-none">
                        <div className="relative flex items-center">
                            <input
                                id="isPublic"
                                type="checkbox"
                                checked={currentEvent.isPublic || false}
                                onChange={(e) => setCurrentEvent({ ...currentEvent, isPublic: e.target.checked })}
                                className="peer h-5 w-5 opacity-0 absolute cursor-pointer"
                            />
                            <div className="h-5 w-5 border-2 border-slate-700 dark:border-blue-800 rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                                <CheckCircle2 className={`h-3.5 w-3.5 text-white transition-opacity ${currentEvent.isPublic ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                        </div>
                        <div className="ml-4 flex flex-col">
                            <label htmlFor="isPublic" className="text-sm font-black text-white uppercase tracking-widest cursor-pointer">Publiceer voor ouders</label>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-blue-400/60 mt-0.5">Zichtbaar in de ouder-agenda</span>
                        </div>
                        <Globe className={`ml-auto h-5 w-5 transition-colors ${currentEvent.isPublic ? 'text-blue-400' : 'text-slate-700 dark:text-blue-800'}`} />
                    </div>
                 )}
            </div>
        </Modal>
    );
};
