import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Plus, AlertCircle, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react';
import { SchoolEvent, EventTypeString } from '../types';

interface BulkAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddEvents: (events: Omit<SchoolEvent, 'id'>[]) => void;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ isOpen, onClose, onAddEvents }) => {
    const [inputText, setInputText] = useState('');
    const [defaultTitle, setDefaultTitle] = useState('Studiedag');
    const [defaultType, setDefaultType] = useState<EventTypeString>('Studiedag');

    const parsedDates = useMemo(() => {
        if (!inputText.trim()) return [];
        
        // Match various date formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
        // Also match names like '21 oktober'
        const lines = inputText.split('\n');
        const dates: Date[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Try simple date parsing
            // Check for DD-MM-YYYY or DD/MM/YYYY
            const ddmmyyyyMatch = trimmed.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
            if (ddmmyyyyMatch) {
                const [_, day, month, year] = ddmmyyyyMatch;
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (!isNaN(date.getTime())) {
                    dates.push(date);
                    return;
                }
            }

            // ISO format YYYY-MM-DD
            const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoMatch) {
                const [_, year, month, day] = isoMatch;
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (!isNaN(date.getTime())) {
                    dates.push(date);
                    return;
                }
            }

            // Textual formats (Dutch)
            // Example: '21 oktober 2024'
            const dutchMonths = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
            const textualMatch = trimmed.toLowerCase().match(/(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s*(\d{4})?/);
            if (textualMatch) {
                const [_, day, monthStr, yearStr] = textualMatch;
                const month = dutchMonths.indexOf(monthStr);
                const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
                const date = new Date(year, month, parseInt(day));
                if (!isNaN(date.getTime())) {
                    dates.push(date);
                    return;
                }
            }
        });

        // Filter unique dates (by time)
        return Array.from(new Map(dates.map(d => [d.getTime(), d])).values())
            .sort((a, b) => a.getTime() - b.getTime());
    }, [inputText]);

    const handleAdd = () => {
        const newEvents = parsedDates.map(date => ({
            title: defaultTitle,
            type: defaultType,
            date: date.toISOString().split('T')[0],
            color: defaultType === 'Studiedag' ? '#f59e0b' : '#3b82f6',
            description: 'Bulk toegevoegd',
        }));
        onAddEvents(newEvents);
        setInputText('');
        onClose();
    };

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
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Bulk Toevoegen</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Snel je jaarplan vullen</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Planbare datums</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Plak hier je lijstje met datums...&#10;Bijv:&#10;21-10-2024&#10;Studiedag 15 november&#10;2024-12-05"
                                    className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standaard Titel</label>
                                    <input 
                                        type="text"
                                        value={defaultTitle}
                                        onChange={(e) => setDefaultTitle(e.target.value)}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                    <div className="flex gap-2">
                                        {(['Studiedag', 'Activiteit', 'Overig'] as EventTypeString[]).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setDefaultType(type)}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                    defaultType === type 
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
                                                        : 'bg-transparent text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Preview ({parsedDates.length})</label>
                            <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-2 max-h-[440px]">
                                {parsedDates.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-8">
                                        <Calendar size={32} className="mb-3 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nog geen datums herkend</p>
                                    </div>
                                ) : (
                                    parsedDates.map((date, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                                                    <span className="text-[10px] font-black">{date.getDate()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{defaultTitle}</span>
                                                </div>
                                            </div>
                                            <CheckCircle2 size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                disabled={parsedDates.length === 0}
                                onClick={handleAdd}
                                className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                {parsedDates.length} Events Toevoegen
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-[10px] text-slate-400 italic">
                        <AlertCircle size={14} />
                        <p>Tip: Je kunt een lijst met datums kopiëren uit Excel of een PDF en hier plakken. Wij proberen ze automatisch te herkennen.</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
