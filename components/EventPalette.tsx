
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { EventTypeString, Filter, SchoolSettings } from '../types';

interface EventPaletteProps {
    filters: Filter;
    onFilterChange: (filters: Filter) => void;
    eventCounts: Record<EventTypeString, number>;
    highlightedType?: string | null;
    onToggleHighlight?: (type: string | null) => void;
    onAddNewItem: () => void;
    onAddEventByType: (type: EventTypeString) => void;
    onOpenOverview: (type: EventTypeString) => void;
    settings: SchoolSettings;
    onAddTheme: (theme: string) => void;
    onDeleteEventType: (typeName: string) => void;
    onAddEventType: (type: { name: string, color: string }) => void;
    onUpdateEventType: (typeName: string, updates: Partial<{ name: string; color: string }>) => void;
    onGoToDate: (date: Date) => void;
    className?: string;
    id?: string;
}

export const EventPalette: React.FC<EventPaletteProps> = ({ 
    filters, 
    onFilterChange, 
    eventCounts, 
    highlightedType,
    onToggleHighlight,
    onAddNewItem, 
    onAddEventByType, 
    onOpenOverview, 
    settings, 
    onAddTheme, 
    onDeleteEventType, 
    onAddEventType,
    onUpdateEventType,
    onGoToDate,
    className, 
    id 
}) => {
    
    const [newTheme, setNewTheme] = useState('');
    const [newActivityName, setNewActivityName] = useState('');
    const [newActivityColor, setNewActivityColor] = useState('#3b82f6'); // Default blue-500
    const [searchQuery, setSearchQuery] = useState('');
    const [width, setWidth] = useState(288); 
    const [isCollapsed, setIsCollapsed] = useState(false);
    const lastWidth = React.useRef(288);
    const isResizing = React.useRef(false);

    const getHexColor = (type: any) => {
        if (type.color) return type.color;
        const colorMap: Record<string, string> = {
            'bg-orange-200': '#fed7aa', 'bg-teal-200': '#99f6e4', 'bg-cyan-200': '#a5f3fc',
            'bg-sky-200': '#bae6fd', 'bg-blue-200': '#bfdbfe', 'bg-indigo-200': '#c7d2fe',
            'bg-green-200': '#bbf7d0', 'bg-rose-200': '#fecdd3', 'bg-red-200': '#fecaca',
            'bg-emerald-100': '#d1fae5', 'bg-indigo-100': '#e0e7ff', 'bg-orange-100': '#ffedd5',
            'bg-emerald-200': '#a7f3d0', 'bg-emerald-300': '#6ee7b7'
        };
        return colorMap[type.colors?.bg] || '#94a3b8';
    };

    const toggleCollapse = () => {
        if (!isCollapsed) {
            lastWidth.current = width;
            setWidth(80);
            setIsCollapsed(true);
        } else {
            setWidth(lastWidth.current);
            setIsCollapsed(false);
        }
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.min(Math.max(240, e.clientX), 480);
        setWidth(newWidth);
    }, []);

    const stopResizing = React.useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, [handleMouseMove]);

    const startResizing = React.useCallback((e: React.MouseEvent) => {
        if (isCollapsed) return;
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [isCollapsed, handleMouseMove, stopResizing]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, eventType: EventTypeString) => {
        e.dataTransfer.setData('text/plain', eventType);
    };

    const handleAddTheme = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTheme.trim()) return;
        onAddTheme(newTheme.trim());
        setNewTheme('');
    };

    const handleAddActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivityName.trim()) return;
        onAddEventType({
            name: newActivityName.trim(),
            color: newActivityColor
        });
        setNewActivityName('');
        // Cycle colors for next one
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        const nextColor = colors[(colors.indexOf(newActivityColor) + 1) % colors.length];
        setNewActivityColor(nextColor);
    };

    const filteredEventTypes = useMemo(() => {
        return settings.eventTypes.filter(type => 
            type.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [settings.eventTypes, searchQuery]);

    const filteredThemes = useMemo(() => {
        return settings.themes.filter(theme => 
            theme.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [settings.themes, searchQuery]);

    const handleDeleteClick = (e: React.MouseEvent, typeName: string) => {
        e.stopPropagation();
        const isStandard = ['Studiedag', 'Vakantie', 'Feestdag'].includes(typeName);
        const msg = isStandard 
            ? `Weet je zeker dat je het standaard type "${typeName}" wilt verwijderen? Dit wordt niet aangeraden.` 
            : `Weet je zeker dat je "${typeName}" wilt verwijderen uit de lijst? Bestaande items in de kalender blijven behouden.`;

        if (window.confirm(msg)) {
            onDeleteEventType(typeName);
        }
    };

    return (
        <aside 
            id={id} 
            className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-[80px] flex flex-col overflow-hidden relative group/sidebar ${className || ''}`}
            style={{ width: `${width}px` }}
        >
            {/* Resizer Handle */}
            <div 
                onMouseDown={startResizing}
                className={`absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors z-50 group-hover/sidebar:opacity-100 opacity-0 ${isCollapsed ? 'hidden' : ''}`}
            />
            
            {/* Collapse Toggle Button */}
            <button 
                onClick={toggleCollapse}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 shadow-sm z-[60] transition-all hover:scale-110 active:scale-95"
            >
                {isCollapsed ? <LucideIcons.ChevronRight size={14} /> : <LucideIcons.ChevronLeft size={14} />}
            </button>

            {/* Header */}
            <div className={`p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 ${isCollapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none shrink-0">
                            <LucideIcons.Wrench size={16} />
                        </div>
                        {!isCollapsed && (
                            <div>
                                <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Gereedschap</h2>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">Toevoegen & Filters</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            {!isCollapsed && (
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Zoek types, thema's..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        <LucideIcons.Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <LucideIcons.X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 ${isCollapsed ? 'px-2' : ''}`}>
                
                {/* Categories / Types */}
                <section>
                    <div className={`flex items-center justify-between mb-4 px-1 ${isCollapsed ? 'justify-center border-b border-slate-100 pb-2 mb-2' : ''}`}>
                        {!isCollapsed ? (
                            <>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Activiteiten
                                    {(filters.eventTypes.length > 0 || filters.theme || searchQuery) && (
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Filters actief" />
                                    )}
                                </h3>
                                <span className="text-xs font-bold text-slate-300">{filteredEventTypes.length}</span>
                            </>
                        ) : (
                            <LucideIcons.Layers size={14} className="text-slate-300" />
                        )}
                    </div>

                    {!isCollapsed && (
                        <form onSubmit={handleAddActivity} className="mb-4">
                            <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'];
                                        const nextColor = colors[(colors.indexOf(newActivityColor) + 1) % colors.length];
                                        setNewActivityColor(nextColor);
                                    }}
                                    className="w-6 h-6 rounded-full shrink-0 transition-transform active:scale-90 shadow-sm"
                                    style={{ backgroundColor: newActivityColor }}
                                    title="Kies kleur"
                                />
                                <input
                                    type="text"
                                    value={newActivityName}
                                    onChange={(e) => setNewActivityName(e.target.value)}
                                    placeholder="Snel activiteit toevoegen..."
                                    className="flex-1 bg-transparent border-none text-[11px] outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newActivityName.trim()}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <LucideIcons.Check size={16} />
                                </button>
                            </div>
                        </form>
                    )}

                    <div 
                        className="grid gap-2"
                        style={{ gridTemplateColumns: (!isCollapsed && width > 380) ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))' }}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredEventTypes.map((type) => {
                                const count = eventCounts[type.name] || 0;
                                
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={type.name}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, type.name)}
                                        onClick={() => onOpenOverview(type.name)}
                                        className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-grab active:cursor-grabbing border transition-all ${isCollapsed ? 'flex-col gap-1 p-2' : ''} bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm hover:shadow-md ${highlightedType === type.name ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : ''}`}
                                        style={getHexColor(type) && getHexColor(type) !== '#94a3b8' ? { 
                                            backgroundColor: `${getHexColor(type)}10`, 
                                            borderColor: `${getHexColor(type)}40`      
                                        } : undefined}
                                    >
                                        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'flex-col gap-1' : ''}`}>
                                            <div className="relative group/highlight flex items-center">
                                                <div 
                                                    className={`w-2.5 h-10 rounded-full shrink-0 transition-all hover:scale-x-125 relative overflow-hidden ${isCollapsed ? 'w-full h-1' : ''} ${highlightedType === type.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                                    style={{ backgroundColor: getHexColor(type) }}
                                                >
                                                    <input 
                                                        type="color"
                                                        value={getHexColor(type)}
                                                        onChange={(e) => onUpdateEventType(type.name, { color: e.target.value })}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                                        title="Wijzig kleur voor dit type"
                                                    />
                                                </div>
                                                
                                                {!isCollapsed && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onToggleHighlight) {
                                                                onToggleHighlight(highlightedType === type.name ? null : type.name);
                                                            }
                                                        }}
                                                        className={`absolute -left-1 w-4 h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover/highlight:opacity-100 transition-all hover:scale-110 z-20 ${highlightedType === type.name ? 'opacity-100 bg-blue-500 border-blue-500 text-white' : 'text-slate-400 hover:text-blue-500'}`}
                                                        title="Focus modus (Highlighten)"
                                                    >
                                                        <LucideIcons.Eye size={8} />
                                                    </button>
                                                )}

                                                {!isCollapsed && (
                                                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[8px] font-bold rounded opacity-0 group-hover/highlight:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
                                                        Stripe: Kleur wijzigen | Eye: Focus modus
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex flex-col min-w-0 ${isCollapsed ? 'items-center' : ''}`}>
                                                <span className={`text-[12px] font-black uppercase tracking-tight truncate ${isCollapsed ? 'text-[8px] w-full text-center' : ''} text-slate-900 dark:text-slate-100`}>
                                                    {isCollapsed ? type.name.substring(0, 3) : type.name}
                                                </span>
                                                {count > 0 && !isCollapsed && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {count} {count === 1 ? 'item' : 'items'}
                                                    </span>
                                                )}
                                                {count > 0 && isCollapsed && (
                                                    <span className="text-[7px] font-bold text-blue-500">{count}</span>
                                                )}
                                            </div>
                                        </div>

                                        {!isCollapsed && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddEventByType(type.name); }}
                                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg"
                                                >
                                                    <LucideIcons.Plus size={12} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteClick(e, type.name)}
                                                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg"
                                                >
                                                    <LucideIcons.Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Themes List */}
                {!isCollapsed && (
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thema's</h3>
                            <LucideIcons.Tag size={14} className="text-blue-400" />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTheme}
                                    onChange={(e) => setNewTheme(e.target.value)}
                                    placeholder="Nieuw thema..."
                                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-white"
                                />
                                <button 
                                    onClick={handleAddTheme}
                                    className="p-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
                                >
                                    <LucideIcons.Plus size={14} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                <button 
                                    onClick={() => onFilterChange({ ...filters, theme: undefined })}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border ${!filters.theme ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}
                                >
                                    Alles
                                </button>
                                {filteredThemes.map(theme => (
                                    <button 
                                        key={theme}
                                        onClick={() => onFilterChange({ ...filters, theme: theme === filters.theme ? undefined : theme })}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border group relative overflow-hidden ${filters.theme === theme ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}`}
                                    >
                                        <span className="relative z-10">{theme}</span>
                                        {filters.theme === theme && (
                                            <motion.span 
                                                layoutId="activeTheme"
                                                className="absolute inset-0 bg-blue-600 -z-0"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Footer / Info */}
            {!isCollapsed && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <LucideIcons.MousePointer2 size={12} className="text-blue-500" />
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                            Sleep items naar de kalender om ze in te plannen
                        </p>
                    </div>
                </div>
            )}
        </aside>
    );
};


