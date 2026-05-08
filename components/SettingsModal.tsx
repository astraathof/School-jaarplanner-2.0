
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SchoolSettings, DailySchedule, VacationRegion, SchoolType, SchoolGoal, EventTypeConfig, SettingsModalSection, InspectionStandard, Holiday } from '../types';
import { INSPECTION_STANDARDS } from '../types';
import { getHolidaysForYear } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Target, Palette, Clock, School, MapPin, Calendar, Info, Trash2, Plus, Copy, RefreshCw, Upload, Download, Database } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SchoolSettings;
    onSave: (settings: SchoolSettings) => void;
    onSyncHolidays: () => void;
    initialFocus?: SettingsModalSection | null;
    onImportBackup?: () => void; 
    onExportBackup?: () => void;
    onResetData?: () => void;
}

const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    isSetup?: boolean;
}> = ({ isOpen, onClose, title, children, footer, isSetup }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 print:hidden" onClick={isSetup ? undefined : onClose}>
                        <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-main)]" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[var(--bg-sidebar)] text-[var(--text-muted)] rounded-xl border border-[var(--border-main)]">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-black text-[var(--text-main)] tracking-tighter leading-none">{title}</h2>
                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1.5 opacity-40">Configureer je jaarplanning</span>
                                </div>
                            </div>
                            {!isSetup && (
                                <button onClick={onClose} className="p-2.5 hover:bg-[var(--bg-sidebar)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow bg-[var(--bg-main)]/30">
                            {children}
                        </div>
                        <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex justify-end items-center gap-3">
                            {footer}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const GoalManager: React.FC<{goals: SchoolGoal[], onGoalsChange: (goals: SchoolGoal[]) => void}> = ({ goals, onGoalsChange }) => {
    const [newGoal, setNewGoal] = useState<{title: string, description: string, icon: string, inspectionStandard?: InspectionStandard}>({ title: '', description: '', icon: 'Target' });

    const handleAddGoal = () => {
        if (newGoal.title.trim()) {
            const goalToAdd: SchoolGoal = {
                id: Date.now(),
                ...newGoal
            };
            onGoalsChange([...goals, goalToAdd]);
            setNewGoal({ title: '', description: '', icon: 'Target' });
        }
    };
    
    const handleDeleteGoal = (id: number) => {
        onGoalsChange(goals.filter(goal => goal.id !== id));
    };

    const iconOptions = ['Target', 'Languages', 'Calculator', 'Users', 'Monitor', 'Book', 'Heart', 'Star', 'Lightbulb', 'Compass'];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-[var(--text-muted)]" />
                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Schoolplan Doelen</h3>
            </div>
            
            <div className="space-y-4">
                {goals.map(goal => (
                    <div key={goal.id} className="flex items-start justify-between p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800">
                                <span className="text-[10px] font-black uppercase tracking-widest">{goal.icon?.substring(0, 2) || 'TG'}</span>
                            </div>
                            <div>
                                <p className="text-sm font-black text-[var(--text-main)] tracking-tight">{goal.title}</p>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">{goal.description}</p>
                                {goal.inspectionStandard && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                                            {goal.inspectionStandard}
                                        </span>
                                        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                            {INSPECTION_STANDARDS.find(s => s.code === goal.inspectionStandard)?.title}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteGoal(goal.id)} 
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                {goals.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-[var(--border-main)] rounded-3xl text-center">
                        <p className="text-xs text-[var(--text-muted)] font-medium">Nog geen doelen gedefinieerd. Voeg je eerste doel toe hieronder.</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Titel</label>
                        <input
                            type="text"
                            placeholder="Bijv. Basisvaardigheden versterken"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Icoon</label>
                        <select
                            value={newGoal.icon}
                            onChange={(e) => setNewGoal({...newGoal, icon: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] appearance-none"
                        >
                            {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Omschrijving</label>
                        <input
                            type="text"
                            placeholder="Korte toelichting op dit doel"
                            value={newGoal.description}
                            onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Inspectiestandaard</label>
                        <select
                            value={newGoal.inspectionStandard || ''}
                            onChange={(e) => setNewGoal({...newGoal, inspectionStandard: e.target.value as InspectionStandard || undefined})}
                            className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] appearance-none"
                        >
                            <option value="">Geen koppeling</option>
                            {INSPECTION_STANDARDS.map(standard => (
                                <option key={standard.code} value={standard.code}>{standard.code} - {standard.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={handleAddGoal} 
                        disabled={!newGoal.title.trim()}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-[var(--bg-sidebar)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Doel Toevoegen
                    </button>
                </div>
            </div>
        </div>
    );
};

const colorPresets: EventTypeConfig['colors'][] = [
    { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-400' },
    { bg: 'bg-pink-200', text: 'text-pink-900', border: 'border-pink-400' },
    { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-400' },
    { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-400' },
    { bg: 'bg-gray-200', text: 'text-gray-900', border: 'border-gray-400' }
];

const ColorDot: React.FC<{ colors: EventTypeConfig['colors'], isSelected: boolean, onClick: () => void }> = ({ colors, isSelected, onClick }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className={`w-8 h-8 rounded-full ${colors.bg} ${isSelected ? 'ring-4 ring-slate-900 ring-offset-2' : 'hover:scale-110'} transition-all border ${colors.border}`}
  />
);

const EventTypeManager: React.FC<{eventTypes: EventTypeConfig[], onEventTypesChange: (types: EventTypeConfig[]) => void}> = ({ eventTypes, onEventTypesChange }) => {
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeColors, setNewTypeColors] = useState<EventTypeConfig['colors']>(colorPresets[0]);

    const handleAddType = () => {
        if (newTypeName.trim() && !eventTypes.find(et => et.name.toLowerCase() === newTypeName.trim().toLowerCase())) {
            const newType: EventTypeConfig = {
                name: newTypeName.trim(),
                colors: newTypeColors,
                isDefault: false,
            };
            onEventTypesChange([...eventTypes, newType]);
            setNewTypeName('');
        } else {
            alert('Typenaam is ongeldig of bestaat al.');
        }
    };

    const handleDeleteType = (name: string) => {
        onEventTypesChange(eventTypes.filter(et => et.name !== name));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-[var(--text-muted)]" />
                <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Itemtypen Beheren</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventTypes.map(type => (
                    <div key={type.name} className="flex items-center justify-between p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] shadow-sm group">
                        <div className="flex items-center gap-3">
                            <div 
                                className={`w-2.5 h-2.5 rounded-full ${!type.color ? (type.colors?.bg || 'bg-slate-500') : ''} border ${!type.color ? (type.colors?.border || 'border-slate-600') : 'border-black/10'}`} 
                                style={type.color ? { backgroundColor: type.color } : undefined}
                            />
                            <span className="text-sm font-black text-[var(--text-main)] tracking-tight">{type.name}</span>
                            {type.isDefault && <span className="text-[8px] font-black bg-[var(--bg-sidebar)] text-[var(--text-muted)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--border-main)]">Standaard</span>}
                        </div>
                        {!type.isDefault && (
                            <button 
                                onClick={() => handleDeleteType(type.name)} 
                                className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-6 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm flex flex-col md:flex-row items-end gap-5">
                <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Nieuw Type</label>
                    <input
                        type="text"
                        placeholder="Naam van het item"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                    />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Kleur</label>
                    <div className="flex gap-2.5 p-1.5 bg-[var(--bg-sidebar)] rounded-xl border border-[var(--border-main)]">
                       {colorPresets.map((colors, index) => (
                           <ColorDot key={index} colors={colors} isSelected={JSON.stringify(colors) === JSON.stringify(newTypeColors)} onClick={() => setNewTypeColors(colors)} />
                       ))}
                    </div>
                 </div>
                <button 
                    onClick={handleAddType} 
                    disabled={!newTypeName.trim()}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-[var(--bg-sidebar)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Toevoegen
                </button>
            </div>
        </div>
    );
};

const HolidayManager: React.FC<{
    holidays: Holiday[], 
    baseHolidays: Holiday[],
    onHolidaysChange: (holidays: Holiday[]) => void 
}> = ({ holidays, baseHolidays, onHolidaysChange }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Holiday | null>(null);

    const handleEdit = (holiday: Holiday) => {
        setEditingId(holiday.id);
        setEditData({ ...holiday });
    };

    const handleSaveEdit = () => {
        if (editData) {
            const newOverrides = [...holidays];
            const index = newOverrides.findIndex(h => h.id === editData.id);
            if (index >= 0) {
                newOverrides[index] = editData;
            } else {
                newOverrides.push(editData);
            }
            onHolidaysChange(newOverrides);
            setEditingId(null);
            setEditData(null);
        }
    };

    const handleReset = (id: string) => {
        onHolidaysChange(holidays.filter(h => h.id !== id));
    };

    // Combine base and overrides for display
    const displayHolidays = useMemo(() => {
        const overrideMap = new Map(holidays.map(h => [h.id, h]));
        return baseHolidays.map(h => overrideMap.get(h.id) || h);
    }, [baseHolidays, holidays]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Vakanties & Feestdagen</h3>
                </div>
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-sidebar)] px-3 py-1 rounded-full border border-[var(--border-main)]">
                    {holidays.length} aanpassingen
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {displayHolidays.map(holiday => {
                    const isOverridden = holidays.some(h => h.id === holiday.id);
                    const isEditing = editingId === holiday.id;

                    return (
                        <div key={holiday.id} className={`p-4 rounded-2xl border transition-all ${isOverridden ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-[var(--bg-card)] border-[var(--border-main)]'}`}>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{holiday.name} aanpassen</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--text-main)]">Annuleer</button>
                                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg">Opslaan</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Startdatum</label>
                                            <input 
                                                type="date" 
                                                value={editData?.date} 
                                                onChange={e => setEditData(prev => prev ? {...prev, date: e.target.value} : null)}
                                                className="w-full px-3 py-2 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl text-xs font-bold"
                                            />
                                        </div>
                                        {holiday.endDate && (
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Einddatum</label>
                                                <input 
                                                    type="date" 
                                                    value={editData?.endDate} 
                                                    onChange={e => setEditData(prev => prev ? {...prev, endDate: e.target.value} : null)}
                                                    className="w-full px-3 py-2 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl text-xs font-bold"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${holiday.type === 'vakantie' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-[var(--text-main)] tracking-tight">{holiday.name}</p>
                                                {isOverridden && <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-1.5 py-0.5 rounded">Aangepast</span>}
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight mt-0.5">
                                                {new Date(holiday.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                                {holiday.endDate && ` t/m ${new Date(holiday.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {isOverridden && (
                                            <button 
                                                onClick={() => handleReset(holiday.id)}
                                                className="p-2 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                                                title="Herstel naar standaard"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleEdit(holiday)}
                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-blue-100 dark:border-blue-800"
                                        >
                                            Aanpassen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onSyncHolidays, initialFocus, onImportBackup, onExportBackup, onResetData }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);

    const goalManagerRef = useRef<HTMLDivElement>(null);
    const eventTypeManagerRef = useRef<HTMLDivElement>(null);
    const holidayManagerRef = useRef<HTMLDivElement>(null);
    const generalInfoRef = useRef<HTMLDivElement>(null);

    const baseHolidays = useMemo(() => {
        return getHolidaysForYear(currentSettings.schoolYear, currentSettings.region).holidays;
    }, [currentSettings.schoolYear, currentSettings.region]);

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings, isOpen]);
    
    useEffect(() => {
        if (isOpen && initialFocus) {
           setTimeout(() => {
             if (initialFocus === 'goals' && goalManagerRef.current) {
                goalManagerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
             } else if (initialFocus === 'school-basis' && generalInfoRef.current) {
                generalInfoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
           }, 100); 
        }
    }, [isOpen, initialFocus]);

    const handleSave = () => {
        onSave(currentSettings);
    };

    const handleTimetableChange = (day: keyof SchoolSettings['timetables'], field: keyof DailySchedule, value: string | number) => {
        const newTimetables = { ...currentSettings.timetables, [day]: { ...currentSettings.timetables[day], [field]: value } };
        
        const { startTime, endTime, breakMinutes } = newTimetables[day];
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}`);
            const end = new Date(`1970-01-01T${endTime}`);
            // @ts-ignore
            const diffMs = end - start;
            const totalMinutes = Math.max(0, (diffMs / (1000 * 60)));
            newTimetables[day].teachingMinutes = totalMinutes - (Number(breakMinutes) || 0);
        }

        setCurrentSettings({ ...currentSettings, timetables: newTimetables });
    };
    
    const copyToAll = (fromDay: keyof SchoolSettings['timetables']) => {
        const sourceSchedule = currentSettings.timetables[fromDay];
        const newTimetables = { ...currentSettings.timetables };
        (Object.keys(newTimetables) as Array<keyof SchoolSettings['timetables']>).forEach(day => {
            if (day !== fromDay) {
                newTimetables[day] = { ...sourceSchedule };
            }
        });
        setCurrentSettings({ ...currentSettings, timetables: newTimetables });
    };

    const schoolYearOptions = Array.from({ length: 5 }, (_, i) => {
        const startYear = new Date().getFullYear() - 2 + i;
        return `${startYear}-${startYear + 1}`;
    });
    
    const regionOptions: VacationRegion[] = ['Noord', 'Midden', 'Zuid'];

    const isInitialSetup = !settings.isSetupComplete;

    const weeklyTotal = useMemo(() => {
        const totalMinutes = (Object.values(currentSettings.timetables) as DailySchedule[]).reduce((acc, day) => acc + day.teachingMinutes, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return { hours, minutes, totalMinutes };
    }, [currentSettings.timetables]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isInitialSetup ? "Welkom bij Schoolplanner" : "Schoolinstellingen"}
            isSetup={isInitialSetup}
            footer={
                <>
                    {isInitialSetup && onImportBackup && (
                        <button 
                            onClick={onImportBackup} 
                            className="mr-auto px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-2xl hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Importeer Backup
                        </button>
                    )}
                    {!isInitialSetup && (
                        <button 
                            onClick={onClose} 
                            className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] bg-[var(--bg-sidebar)] hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-2xl transition-all border border-[var(--border-main)]"
                        >
                            Annuleren
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        className="px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-blue-600 rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg"
                    >
                        {isInitialSetup ? 'Start met plannen' : 'Instellingen Opslaan'}
                    </button>
                </>
            }
        >
            <div className="space-y-12 pb-12">
                <div className="space-y-8" ref={generalInfoRef}>
                    <div className="flex items-center gap-3">
                        <School className="h-5 w-5 text-[var(--text-muted)]" />
                        <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Algemene Informatie</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Schoolnaam</label>
                            <input
                                type="text"
                                value={currentSettings.schoolName}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, schoolName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                            />
                        </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Schooltype</label>
                             <div className="flex gap-4 p-1 bg-[var(--bg-sidebar)] rounded-xl border border-[var(--border-main)]">
                                <button 
                                    onClick={() => setCurrentSettings({...currentSettings, schoolType: 'PO'})}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentSettings.schoolType === 'PO' ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Primair (PO)
                                </button>
                                <button 
                                    onClick={() => setCurrentSettings({...currentSettings, schoolType: 'VO'})}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentSettings.schoolType === 'VO' ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    Voortgezet (VO)
                                </button>
                             </div>
                        </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Schooljaar</label>
                             <select
                                value={currentSettings.schoolYear}
                                onChange={e => setCurrentSettings({ ...currentSettings, schoolYear: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] appearance-none"
                            >
                                {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Vakantieregio</label>
                             <div className="flex gap-3">
                                <select
                                    value={currentSettings.region}
                                    onChange={e => setCurrentSettings({ ...currentSettings, region: e.target.value as VacationRegion })}
                                    className="flex-1 px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] appearance-none"
                                >
                                    {regionOptions.map(region => <option key={region} value={region}>{region}</option>)}
                                </select>
                                <button 
                                    onClick={(e) => { e.preventDefault(); onSyncHolidays(); }}
                                    className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Sync
                                </button>
                             </div>
                        </div>
                         <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">School Logo URL</label>
                            <div className="flex gap-4 items-start">
                                <input
                                    type="text"
                                    placeholder="https://.../logo.png"
                                    value={currentSettings.schoolLogoUrl || ''}
                                    onChange={(e) => setCurrentSettings({ ...currentSettings, schoolLogoUrl: e.target.value })}
                                    className="flex-1 px-4 py-2.5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                                />
                                {currentSettings.schoolLogoUrl && (
                                    <div className="w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-1.5 flex items-center justify-center shadow-sm">
                                        <img src={currentSettings.schoolLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Missie & Visie</label>
                            <textarea
                                rows={3}
                                placeholder="Beschrijf hier de kernwaarden van de school..."
                                value={currentSettings.missionVision || ''}
                                onChange={(e) => setCurrentSettings({ ...currentSettings, missionVision: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div ref={eventTypeManagerRef} className="pt-8 border-t border-slate-100">
                    <EventTypeManager
                        eventTypes={currentSettings.eventTypes}
                        onEventTypesChange={(newEventTypes) => setCurrentSettings({...currentSettings, eventTypes: newEventTypes})}
                    />
                </div>
                
                <div ref={goalManagerRef} className="pt-8 border-t border-slate-100">
                    <GoalManager 
                        goals={currentSettings.goals} 
                        onGoalsChange={(newGoals) => setCurrentSettings({...currentSettings, goals: newGoals})}
                    />
                </div>

                <div ref={holidayManagerRef} className="pt-8 border-t border-slate-100">
                    <HolidayManager 
                        holidays={currentSettings.holidayOverrides || []}
                        baseHolidays={baseHolidays}
                        onHolidaysChange={(newHolidays) => setCurrentSettings({...currentSettings, holidayOverrides: newHolidays})}
                    />
                </div>

                <div className="pt-8 border-t border-[var(--border-main)] space-y-8">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-[var(--text-muted)]" />
                        <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Roostertijden</h3>
                    </div>
                    
                    <div className="p-8 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
                        <div className="grid grid-cols-6 gap-6 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-4 opacity-60">
                             <div>Dag</div>
                            <div>Start</div>
                            <div>Einde</div>
                            <div>Pauze</div>
                            <div className="text-center">Lesminuten</div>
                            <div></div>
                        </div>

                        {(Object.keys(currentSettings.timetables) as Array<keyof SchoolSettings['timetables']>).map(day => (
                            <div key={day} className="grid grid-cols-6 gap-6 items-center p-1.5 hover:bg-[var(--bg-sidebar)] rounded-xl transition-all">
                                <div className="text-sm font-black text-[var(--text-main)] capitalize px-2">{day}</div>
                                <input type="time" value={currentSettings.timetables[day].startTime} onChange={e => handleTimetableChange(day, 'startTime', e.target.value)} className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs font-bold text-[var(--text-main)] focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 outline-none" />
                                <input type="time" value={currentSettings.timetables[day].endTime} onChange={e => handleTimetableChange(day, 'endTime', e.target.value)} className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs font-bold text-[var(--text-main)] focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 outline-none" />
                                <div className="relative">
                                    <input type="number" value={currentSettings.timetables[day].breakMinutes} onChange={e => handleTimetableChange(day, 'breakMinutes', parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs font-bold text-[var(--text-main)] focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 outline-none pr-8" />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-[var(--text-muted)] uppercase">min</span>
                                </div>
                                <div className="text-center">
                                    <span className="inline-block px-3 py-1.5 bg-slate-900 dark:bg-blue-600 text-white text-[9px] font-black rounded-lg shadow-sm">
                                        {currentSettings.timetables[day].teachingMinutes}
                                    </span>
                                </div>
                                <div className="flex justify-center">
                                    {day === 'ma' && (
                                        <button 
                                            onClick={() => copyToAll('ma')} 
                                            className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800"
                                            title="Kopieer naar alle dagen"
                                        >
                                            <Copy className="h-2.5 w-2.5" />
                                            Kopieer
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        <div className="mt-8 pt-8 border-t border-[var(--border-main)] flex justify-end items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Wekelijks Totaal</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{weeklyTotal.hours}u {weeklyTotal.minutes}m</span>
                                    <span className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">({weeklyTotal.totalMinutes} min)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data & Backup Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-[var(--text-muted)]" />
                        <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Data & Backup</h3>
                    </div>

                    <div className="p-8 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            Je gegevens worden momenteel lokaal in je browser opgeslagen. Voor maximale betrouwbaarheid raden we aan regelmatig een backup te maken of over te stappen naar cloud-opslag.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={onExportBackup}
                                className="flex items-center justify-between p-5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-2xl hover:border-blue-300 hover:bg-[var(--bg-card)] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Download className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[var(--text-main)]">Backup Exporteren</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Download je volledige jaarplan als JSON</p>
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={onImportBackup}
                                className="flex items-center justify-between p-5 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-2xl hover:border-blue-300 hover:bg-[var(--bg-card)] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[var(--text-main)]">Backup Importeren</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Herstel een eerder opgeslagen jaarplan</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {!isInitialSetup && (
                            <div className="pt-6 border-t border-[var(--border-main)]">
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Weet je zeker dat je ALLE gegevens wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
                                            onResetData?.();
                                        }
                                    }}
                                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Alle gegevens wissen (Reset)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
