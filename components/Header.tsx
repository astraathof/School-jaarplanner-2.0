
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ViewMode, ValidationWarning, SchoolSettings } from '../types';
import { FirebaseUser } from '../lib/firebase';
import { Notifications } from './Notifications';
import { 
    LogIn, LogOut, UserPlus, Globe, Database, Plus, LayoutDashboard, 
    Settings as SettingsIcon, Bell, Users, History, Activity, User, ChevronDown, HelpCircle, Sun, Moon,
    Share2, Link as LinkIcon, FileText, Download, Briefcase, Sparkles, MessageSquare, Trash2, Search, Target, ShieldCheck,
    Undo, Redo, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Menu, X, Trash
} from 'lucide-react';

interface HeaderProps {
    id?: string;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onShowSettings: () => void;
    settings: SchoolSettings;
    onExportICal: () => void;
    onExportJson: () => void;
    onImportJson: () => void;
    onExportPdf: (mode: ViewMode) => void;
    onExportPoster: () => void;
    onExportCsv: () => void;
    onShowICal: () => void;
    onShowShare: () => void;
    warnings: ValidationWarning[];
    onShowTrash: () => void;
    calendarView: 'grid-1' | 'grid-2' | 'grid-3' | 'list';
    onCalendarViewChange: (view: 'grid-1' | 'grid-2' | 'grid-3' | 'list') => void;
    onSchoolYearChange: (year: string) => void;
    onGoToToday: () => void;
    onToggleTodoPanel: () => void;
    onStartTour: () => void;
    onShowAIImport: () => void;
    onShowBulkAdd: () => void;
    onToggleAIChat: () => void;
    onShowWorkload: () => void;
    onShowInspection: () => void;
    onShowRoadmap: () => void;
    onShowAudit: () => void;
    onShowHeatmap: () => void;
    onShowConflictAssistant: () => void;
    onShowActivityLog: () => void;
    onShowHelp: () => void;
    validations: {
        fourDayWeek: { count: number, limit: number, isExceeded: boolean };
    };
    onSearchChange: (query: string) => void;
    onResetPlanning: () => void;
    uniqueConflictsCount?: number;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    showSaveIndicator?: boolean;
    headerRef?: React.RefObject<HTMLElement>;
    isScrolled?: boolean;
    theme?: 'light' | 'dark';
    onThemeToggle?: () => void;
    // Firebase Props
    user: FirebaseUser | null;
    isFirebaseMode: boolean;
    onToggleMode: (mode: 'online' | 'firebase') => void;
    onLogin: () => void;
    onLogout: () => void;
    onInviteClick: () => void;
    planners: {id: string, name: string}[];
    currentPlannerId: string | null;
    onPlannerChange: (id: string | null) => void;
    onCreatePlanner: (name: string) => void;
    activeUsers: {uid: string, displayName: string, photoURL: string}[];
}

const ChartBarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
);

const ChatBubbleLeftRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
);

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 18.256 8.256a1 1 0 010 1.932l-4.11 1.056-1.179 4.456a1 1 0 01-1.932 0l-1.056-4.11-4.456-1.179a1 1 0 010-1.932l4.11-1.056 1.056-4.11A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
);

const UsersIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
);

const BuildingOfficeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2H5a1 1 0 110-2V4zm3 1a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const CogIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const ArrowDownTrayIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const DocumentIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const ArrowUpTrayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const ViewListIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const ViewGridIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);
const NoteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
);
const QuestionMarkCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);


const PublishDropdown: React.FC<{ 
    onExportPdf: (mode: ViewMode) => void, 
    onExportPoster: () => void, 
    onExportCsv: () => void,
    onShowICal: () => void, 
    onShowShare: () => void,
    onExportJson: () => void,
    onImportJson: () => void
}> = ({ onExportPdf, onExportPoster, onExportCsv, onShowICal, onShowShare, onExportJson, onImportJson }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-500 transition-all active:scale-95"
                title="Publiceren en Delen"
            >
                <Share2 size={14} />
                Publiceren
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="p-2 space-y-1">
                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Delen & Embed</div>
                        <button onClick={() => { onShowShare(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><LinkIcon size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Deel / Embed</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Code voor website</div>
                            </div>
                        </button>
                        <button onClick={() => { onShowICal(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><Globe size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">iCal Koppeling</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Live agenda link</div>
                            </div>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Downloads (PDF)</div>
                        <button onClick={() => { onExportPdf('school'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 rounded-lg group-hover:scale-110 transition-transform"><FileText size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Schoolversie</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Gedetailleerd overzicht</div>
                            </div>
                        </button>
                        <button onClick={() => { onExportPdf('parent'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-orange-50 dark:bg-orange-900/40 text-orange-600 rounded-lg group-hover:scale-110 transition-transform"><Users size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Ouderversie</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Schoon overzicht</div>
                            </div>
                        </button>
                        <button onClick={() => { onExportCsv(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><Database size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Excel / CSV</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Administratieve export</div>
                            </div>
                        </button>
                        <button onClick={() => { onExportPoster(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group">
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><LayoutDashboard size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Jaarposter</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">A3 formaat drukwerk</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageDropdown: React.FC<{
    onShowSettings: () => void,
    onShowTrash: () => void,
    onResetPlanning: () => void,
    onExportJson: () => void,
    onImportJson: () => void,
    isFirebaseMode: boolean,
    onToggleMode: (mode: 'online' | 'firebase') => void
}> = ({ onShowSettings, onShowTrash, onResetPlanning, onExportJson, onImportJson, isFirebaseMode, onToggleMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all active:scale-95"
            >
                <SettingsIcon size={14} />
                Beheer
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="p-2 space-y-1">
                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Basics</div>
                        <button onClick={() => { onShowSettings(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group font-bold">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg group-hover:scale-110 transition-transform"><Briefcase size={14} /></div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">Schoolinstellingen</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">Type, Uren, Normen</div>
                            </div>
                        </button>
                        
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <div className="px-3 py-2 text-[9px] font-black text-blue-500 uppercase tracking-widest">Cloud & Sync</div>
                        <button onClick={() => { onToggleMode(isFirebaseMode ? 'online' : 'firebase'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group font-bold">
                            <div className={`p-1.5 ${isFirebaseMode ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-lg group-hover:scale-110 transition-transform`}>
                                {isFirebaseMode ? <Database size={14} /> : <Globe size={14} />}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">{isFirebaseMode ? 'Wissel naar Lokaal' : 'Activeer Cloud Sync'}</div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{isFirebaseMode ? 'Data op dit apparaat' : 'Live samenwerken'}</div>
                            </div>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data & Backup</div>
                        <button onClick={() => { onExportJson(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group flex items-center gap-2 font-bold">
                            <Download size={12} className="text-blue-500" /> Backup exporteren
                        </button>
                        <button onClick={() => { onImportJson(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group flex items-center gap-2 font-bold">
                            <Database size={12} className="text-blue-500" /> Backup importeren
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <div className="px-3 py-2 text-[9px] font-black text-rose-500 uppercase tracking-widest">Onderhoud</div>
                        <button onClick={() => { onShowTrash(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors text-left group flex items-center gap-2 font-bold">
                            <Trash2 size={12} className="group-hover:text-rose-600" /> Prullenbak bekijken
                        </button>
                        <button onClick={() => { if(confirm('Weet je zeker dat je de gehele planning wilt wissen?')) { onResetPlanning(); setIsOpen(false); } }} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors text-left font-black flex items-center gap-2">
                            <Trash2 size={12} /> Hele planning wissen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RasterDropdown: React.FC<{ currentView: string, onChange: (view: 'grid-1' | 'grid-2' | 'grid-3' | 'list') => void }> = ({ currentView, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const baseButtonClass = "flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150";
    const isGrid = currentView.startsWith('grid');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${baseButtonClass} ${isGrid ? 'bg-[var(--bg-card)] text-blue-600 shadow-sm font-bold border border-[var(--border-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]'}`}
            >
                <ViewGridIcon />
                {currentView === 'grid-1' ? 'Raster (1)' : currentView === 'grid-2' ? 'Raster (2)' : currentView === 'grid-3' ? 'Raster (3)' : 'Raster'}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-main)] z-50 text-[var(--text-main)] overflow-hidden">
                    <button
                        onClick={() => { onChange('grid-1'); setIsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-sidebar)] flex items-center gap-2 ${currentView === 'grid-1' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                    >
                        <ViewGridIcon className="h-4 w-4" /> Raster (1 maand)
                    </button>
                    <button
                        onClick={() => { onChange('grid-2'); setIsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-sidebar)] flex items-center gap-2 ${currentView === 'grid-2' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                    >
                        <ViewGridIcon className="h-4 w-4" /> Raster (2 maanden)
                    </button>
                    <button
                        onClick={() => { onChange('grid-3'); setIsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-sidebar)] flex items-center gap-2 ${currentView === 'grid-3' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
                    >
                        <ViewGridIcon className="h-4 w-4" /> Raster (3 maanden)
                    </button>
                </div>
            )}
        </div>
    );
};

const AnalysesDropdown: React.FC<{ onShowHeatmap: () => void; onShowWorkload: () => void; onShowInspection: () => void; onShowRoadmap: () => void; onShowAudit: () => void; onShowConflictAssistant: () => void; conflictCount?: number }> = ({ onShowHeatmap, onShowWorkload, onShowInspection, onShowRoadmap, onShowAudit, onShowConflictAssistant, conflictCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const secondaryButtonClass = "flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-sidebar)] hover:text-blue-600 shadow-sm transition-all";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="header-analyses-dropdown"
                onClick={() => setIsOpen(!isOpen)}
                className={secondaryButtonClass}
            >
                <div className="relative">
                    <ChartBarIcon />
                    {conflictCount && conflictCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-white" />
                    )}
                </div>
                Analyses
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-main)] z-50 text-[var(--text-main)] overflow-hidden">
                    <ul className="py-1">
                        <li>
                            <button 
                                onClick={() => { onShowConflictAssistant(); setIsOpen(false); }} 
                                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <SparklesIcon className="text-amber-500 h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold">Conflict Assistent</span>
                                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Optimaliseer planning</span>
                                    </div>
                                </div>
                                {conflictCount && conflictCount > 0 && (
                                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{conflictCount}</span>
                                )}
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onShowHeatmap(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <ChartBarIcon className="text-blue-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Jaar Heatmap</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Visualiseer drukte</span>
                                </div>
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onShowWorkload(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <SparklesIcon className="text-emerald-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Werkdruk Analyse</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Check de balans</span>
                                </div>
                            </button>
                        </li>
                        <li>
                            <button 
                                id="tour-inspection-btn"
                                onClick={() => { onShowInspection(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <MagnifyingGlassIcon className="text-amber-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Kwaliteitsrapportage</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Voldoet je plan?</span>
                                </div>
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onShowRoadmap(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Target className="text-blue-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Strategische Roadmap</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Lange termijn horizon</span>
                                </div>
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onShowAudit(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors border-b border-[var(--border-main)]"
                            >
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <ShieldCheck className="text-emerald-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Audit Assistant</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Kwaliteitscheck AI</span>
                                </div>
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onShowConflictAssistant(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors"
                            >
                                <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                    <ExclamationTriangleIcon className="text-rose-600 h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">Conflict Assistent</span>
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Los overlappingen op</span>
                                </div>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const UserHub: React.FC<{
    user: FirebaseUser | null;
    isFirebaseMode: boolean;
    onToggleMode: (mode: 'online' | 'firebase') => void;
    onLogin: () => void;
    onLogout: () => void;
    onInviteClick: () => void;
    planners: {id: string, name: string}[];
    currentPlannerId: string | null;
    onPlannerChange: (id: string | null) => void;
    onCreatePlanner: (name: string) => void;
    onShowActivityLog: () => void;
    onStartTour: () => void;
    activeUsers: {uid: string, displayName: string, photoURL: string}[];
}> = ({ user, isFirebaseMode, onToggleMode, onLogin, onLogout, onInviteClick, planners, currentPlannerId, onPlannerChange, onCreatePlanner, onShowActivityLog, onStartTour, activeUsers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activePlanner = planners.find(p => p.id === currentPlannerId);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="user-hub-toggle"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1 pl-3 bg-white dark:bg-slate-800 border rounded-2xl transition-all shadow-sm active:scale-95 ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-[var(--border-main)] hover:border-slate-300'}`}
            >
                <div className="flex flex-col items-end pr-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] leading-none">
                        {user ? user.displayName?.split(' ')[0] : 'Account'}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-tight mt-1 opacity-50">
                        {user ? (activePlanner?.name || 'Schoolplanner') : 'Niet ingelogd'}
                    </span>
                </div>
                {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-[10px] border border-[var(--border-main)]" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-8 h-8 rounded-[10px] bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <User size={16} />
                    </div>
                )}
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 bg-[var(--bg-card)] rounded-[2rem] shadow-2xl border border-[var(--border-main)] z-[100] overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-[var(--border-main)]">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <img src={user.photoURL || ''} alt="" className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md" referrerPolicy="no-referrer" />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-black text-[var(--text-main)] leading-none">{user.displayName}</p>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1 truncate max-w-[140px] opacity-60 font-mono tracking-tighter">{user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-2">
                                    <button
                                        onClick={() => { onLogin(); setIsOpen(false); }}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-500 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95"
                                    >
                                        <LogIn size={18} /> Inloggen
                                    </button>
                                    <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-4 opacity-40">Gebruik Cloud voor samenwerking</p>
                                </div>
                            )}
                        </div>

                        {/* Cloud Features (only if firebase mode and logged in) */}
                        {isFirebaseMode && user && (
                            <div className="p-4 space-y-1">
                                <p className="px-3 py-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Mijn Planners</p>
                                {planners.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { onPlannerChange(p.id); setIsOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPlannerId === p.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800' : 'text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <LayoutDashboard size={14} className={currentPlannerId === p.id ? 'text-blue-500' : 'text-[var(--text-muted)]'} />
                                            <span>{p.name}</span>
                                        </div>
                                        {currentPlannerId === p.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { onCreatePlanner("Mijn Nieuwe Planner"); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all group"
                                >
                                    <Plus size={14} className="group-hover:scale-125 transition-transform" />
                                    <span>Nieuwe Planner maken</span>
                                </button>
                                
                                <div className="my-2 h-px bg-[var(--border-main)]" />
                                
                                <button
                                    onClick={() => { onInviteClick(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                >
                                    <UserPlus size={16} />
                                    <span>Samenwerken</span>
                                </button>
                                
                                <button
                                    onClick={() => { onShowActivityLog(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] rounded-xl transition-all opacity-40 hover:opacity-100"
                                >
                                    <Activity size={16} />
                                    <span>Activiteitenlog</span>
                                </button>

                                <button
                                    onClick={() => { onStartTour(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                >
                                    <HelpCircle size={16} />
                                    <span>Rondleiding</span>
                                </button>

                                {activeUsers.length > 0 && (
                                    <div className="mt-4 px-3 space-y-2">
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] opacity-40">Nu aanwezig</p>
                                        <div className="flex -space-x-2">
                                            {activeUsers.map(u => (
                                                <div key={u.uid} className="relative group" title={u.displayName}>
                                                    <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Global Settings & Logout */}
                        <div className="p-4 pt-2 border-t border-[var(--border-main)] bg-[var(--bg-sidebar)]/10">
                            {user && (
                                <button
                                    onClick={() => { onLogout(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <LogOut size={16} />
                                    <span>Uitloggen</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = (props) => {
    const { 
        id, viewMode, onViewModeChange, onShowSettings, settings, onExportICal, onExportJson, onImportJson, 
        onExportPdf, onExportPoster, onExportCsv, onShowICal, onShowShare, warnings, onShowTrash, calendarView, onCalendarViewChange, 
        onSchoolYearChange, onGoToToday, onToggleTodoPanel, onStartTour, onShowAIImport, onShowBulkAdd, onToggleAIChat, 
        onShowWorkload, onShowInspection, onShowRoadmap, onShowAudit, onShowHeatmap, onShowConflictAssistant, onSearchChange, onResetPlanning, 
        onUndo, onRedo, canUndo, canRedo, showSaveIndicator, headerRef, isScrolled, theme, onThemeToggle,
        user, isFirebaseMode, onToggleMode, onLogin, onLogout, onInviteClick, planners, currentPlannerId, onPlannerChange, onCreatePlanner,
        onShowActivityLog, onShowHelp, activeUsers, uniqueConflictsCount
    } = props;
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    
    const healthScore = useMemo(() => {
        let score = 100;
        if (props.validations.fourDayWeek.isExceeded) score -= 30;
        const shortWeekDiff = Math.max(0, props.validations.fourDayWeek.count - 4);
        if (shortWeekDiff > 0) score -= (shortWeekDiff * 5);
        return Math.max(0, score);
    }, [props.validations]);

    const healthStatus = useMemo(() => {
        if (healthScore >= 90) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
        if (healthScore >= 70) return { label: 'Goed', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
        if (healthScore >= 50) return { label: 'Aandacht', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
        return { label: 'Kritiek', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' };
    }, [healthScore]);

    const baseButtonClass = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150";
    const activeClass = "bg-slate-600 text-white";
    const inactiveClass = "text-slate-200 hover:bg-slate-700 hover:text-white";
    
    const aiButtonClass = "flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 shadow-xl shadow-slate-200 dark:shadow-none transition-all hover:scale-105 active:scale-95";
    const aiSecondaryButtonClass = "flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all hover:scale-105 active:scale-95";
    
    const secondaryButtonClass = "flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 shadow-sm transition-all active:scale-95";


    const schoolYearOptions = Array.from({ length: 5 }, (_, i) => {
        const startYear = new Date().getFullYear() - 2 + i;
        return `${startYear}-${startYear + 1}`;
    });

    return (
        <header 
            id={id} 
            ref={headerRef} 
            className={`px-4 flex items-center justify-between gap-4 sticky top-0 z-40 transition-all duration-500 ${isScrolled ? 'bg-[var(--bg-sidebar)]/80 backdrop-blur-xl shadow-sm border-b border-[var(--border-main)] py-2' : 'bg-[var(--bg-main)] border-b border-transparent py-3'}`}
        >
            {/* Left Section: Identity & Context */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md shadow-slate-200 group-hover:scale-105 transition-transform duration-300">
                        <BuildingOfficeIcon />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-[var(--text-main)] leading-none tracking-tight">{settings.schoolName}</h1>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Jaarplanner</span>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className={`flex items-center gap-2 ${healthStatus.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Score: {healthScore}%</span>
                    </div>
                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <span className={`text-[8px] font-bold uppercase tracking-tighter ${healthStatus.color}`}>{healthStatus.label}</span>
                </div>
                
                <div className="h-6 w-px bg-[var(--border-main)] hidden md:block" />

                <select
                    value={settings.schoolYear}
                    onChange={e => onSchoolYearChange(e.target.value)}
                    className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] rounded-lg text-[11px] font-bold px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                >
                    {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>

                <AnimatePresence>
                    {showSaveIndicator && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Opgeslagen
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Center Section: Main View & Layout Toggles */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl border border-[var(--border-main)] backdrop-blur-sm">
                <button
                    onClick={onGoToToday}
                    className="px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-blue-600 hover:bg-[var(--bg-card)] hover:shadow-sm rounded-lg transition-all"
                    title="Ga naar vandaag (. of G)"
                >
                    Vandaag
                </button>
                
                <div className="w-px h-3 bg-[var(--border-main)] mx-0.5" />

                <div id="header-view-toggles" className="flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-lg transition-all ${canUndo ? 'text-[var(--text-main)] hover:bg-[var(--bg-card)]' : 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'}`}
                        title="Ongedaan maken (Ctrl+Z)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-lg transition-all ${canRedo ? 'text-[var(--text-main)] hover:bg-[var(--bg-card)]' : 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'}`}
                        title="Opnieuw (Ctrl+Y)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>

                    <div className="w-px h-4 bg-[var(--border-main)] mx-1" />

                    <button
                        onClick={() => onViewModeChange('school')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${viewMode === 'school' ? 'bg-[var(--bg-card)] text-blue-600 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        title="School View"
                    >
                        <BuildingOfficeIcon />
                        <span className="hidden sm:inline">School</span>
                    </button>
                    <button
                        onClick={() => onViewModeChange('parent')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${viewMode === 'parent' ? 'bg-[var(--bg-card)] text-blue-600 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        title="Ouder View"
                    >
                        <UsersIcon />
                        <span className="hidden sm:inline">Ouders</span>
                    </button>

                    <div className="w-px h-3 bg-[var(--border-main)] mx-0.5" />

                    <div className="flex items-center gap-1">
                        <RasterDropdown currentView={calendarView} onChange={onCalendarViewChange} />
                        <button 
                            onClick={() => onCalendarViewChange('list')} 
                            className={`flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${calendarView === 'list' ? 'bg-[var(--bg-card)] text-blue-600 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            title="Lijstweergave"
                        >
                            <ViewListIcon /> Lijst
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Section: Actions & Utilities */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Search - Integrated */}
                <div className="relative hidden lg:block group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        id="header-search-input"
                        type="text"
                        placeholder="Zoek events..."
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="block w-40 lg:w-56 pl-10 pr-3 py-2 border border-[var(--border-main)] rounded-xl bg-[var(--bg-card)] text-[var(--text-main)] text-[12px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-[var(--text-muted)] shadow-sm"
                    />
                </div>

                {/* AI Assistant - Prominent Placement */}
                <button
                    onClick={onToggleAIChat}
                    className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all group"
                >
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">AI Assistent</span>
                    <span className="sm:hidden">AI</span>
                </button>

                {/* Beheer & Publiceren Clusters */}
                <div className="flex items-center gap-1.5 lg:bg-slate-100/50 lg:dark:bg-slate-800/50 lg:p-1 lg:rounded-xl lg:border lg:border-[var(--border-main)] lg:backdrop-blur-sm">
                    <ManageDropdown 
                        onShowSettings={onShowSettings}
                        onShowTrash={onShowTrash}
                        onResetPlanning={onResetPlanning}
                        onExportJson={onExportJson}
                        onImportJson={onImportJson}
                        isFirebaseMode={isFirebaseMode}
                        onToggleMode={onToggleMode}
                    />

                    <div className="hidden xl:block">
                        <AnalysesDropdown 
                            onShowHeatmap={onShowHeatmap} 
                            onShowWorkload={onShowWorkload} 
                            onShowInspection={onShowInspection} 
                            onShowRoadmap={onShowRoadmap}
                            onShowAudit={onShowAudit}
                            onShowConflictAssistant={onShowConflictAssistant} 
                            conflictCount={uniqueConflictsCount}
                        />
                    </div>

                    <PublishDropdown 
                        onExportPdf={onExportPdf}
                        onExportPoster={onExportPoster}
                        onExportCsv={onExportCsv}
                        onShowICal={onShowICal}
                        onShowShare={onShowShare}
                        onExportJson={onExportJson}
                        onImportJson={onImportJson}
                    />
                </div>

                <div className="h-6 w-px bg-[var(--border-main)] hidden lg:block" />

                {/* Utilities */}
                <div className="flex items-center gap-0.5">
                    <button
                        id="header-theme-toggle"
                        onClick={onThemeToggle}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-blue-600 rounded-xl transition-all"
                        title={theme === 'dark' ? "Licht thema" : "Donker thema"}
                    >
                        {theme === 'dark' ? (
                            <Sun size={20} />
                        ) : (
                            <Moon size={20} />
                        )}
                    </button>

                    <button
                        id="header-notes-btn"
                        onClick={onToggleTodoPanel}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-blue-600 rounded-xl transition-all"
                        title="Notities"
                    >
                        <NoteIcon />
                    </button>

                    <Notifications 
                        id="header-notifications-btn"
                        warnings={warnings} 
                        buttonClass="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-amber-600 rounded-xl transition-all relative" 
                    />

                    <button
                        id="header-help-btn"
                        onClick={onShowHelp}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-blue-600 rounded-xl transition-all"
                        title="Helpcentrum"
                    >
                        <HelpCircle size={20} />
                    </button>

                    <button
                        onClick={onShowTrash}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-rose-600 rounded-xl transition-all"
                        title="Prullenbak"
                    >
                        <TrashIcon />
                    </button>

                    <div className="h-6 w-px bg-[var(--border-main)] mx-2" />

                    <UserHub 
                        user={user}
                        isFirebaseMode={isFirebaseMode}
                        onToggleMode={onToggleMode}
                        onLogin={onLogin}
                        onLogout={onLogout}
                        onInviteClick={onInviteClick}
                        planners={planners}
                        currentPlannerId={currentPlannerId}
                        onPlannerChange={onPlannerChange}
                        onCreatePlanner={onCreatePlanner}
                        onShowActivityLog={onShowActivityLog}
                        onStartTour={onStartTour}
                        activeUsers={activeUsers}
                    />
                </div>
            </div>

            {/* Shortcuts Modal */}
            <AnimatePresence>
                {isShortcutsOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsShortcutsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-4 top-full mt-2 w-64 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-main)] p-4 z-[70] overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-main)]">
                                <Search size={14} className="text-blue-500" />
                                <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Sneltoetsen</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)] font-medium">Zoeken</span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono shadow-sm text-[var(--text-main)]">/</kbd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)] font-medium">Nieuw Event</span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono shadow-sm text-[var(--text-main)]">A</kbd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)] font-medium">Vandaag</span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono shadow-sm text-[var(--text-main)]">T</kbd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)] font-medium">Ongedaan maken</span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono shadow-sm text-[var(--text-main)]">⌘ Z</kbd>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};
