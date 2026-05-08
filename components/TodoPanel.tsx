
import React, { useState } from 'react';
import type { TodoItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, CheckCircle2, Circle, StickyNote } from 'lucide-react';

interface TodoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    items: TodoItem[];
    onAdd: (text: string) => void;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}

export const TodoPanel: React.FC<TodoPanelProps> = ({ isOpen, onClose, items, onAdd, onToggle, onDelete }) => {
    const [newItemText, setNewItemText] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            onAdd(newItemText.trim());
            setNewItemText('');
        }
    };

    const incompleteItems = items.filter(item => !item.completed);
    const completedItems = items.filter(item => item.completed);

    const TodoListItem: React.FC<{ item: TodoItem }> = ({ item }) => (
        <li className="flex items-center gap-4 group p-4 hover:bg-[var(--bg-sidebar)] rounded-2xl transition-all duration-300">
            <button 
                onClick={() => onToggle(item.id)}
                className={`flex-shrink-0 transition-all duration-300 ${item.completed ? 'text-emerald-500' : 'text-[var(--text-muted)] hover:text-blue-500'}`}
            >
                {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>
            <span className={`flex-1 text-sm font-medium transition-all duration-300 ${item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                {item.text}
            </span>
            <button 
                onClick={() => onDelete(item.id)} 
                className="text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </li>
    );

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose} 
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]" 
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--bg-card)] shadow-2xl flex flex-col z-[80] border-l border-[var(--border-main)]"
                        >
                            <header className="p-8 flex justify-between items-center border-b border-[var(--border-main)] bg-[var(--bg-card)] flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[var(--bg-sidebar)] text-[var(--text-muted)] rounded-2xl">
                                        <StickyNote className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tighter leading-none">Taken & Notities</h3>
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 opacity-40">Houd focus op je doelen</span>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 hover:bg-[var(--bg-sidebar)] rounded-2xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                    <X className="h-6 w-6" />
                                </button>
                            </header>
                            
                            <div className="p-6 overflow-y-auto flex-grow bg-[var(--bg-sidebar)]/30">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center mb-6">
                                            <StickyNote className="h-10 w-10 text-[var(--text-muted)]" />
                                        </div>
                                        <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Geen taken</h3>
                                        <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[200px]">Voeg taken toe om je planning proces te ondersteunen.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {incompleteItems.map(item => <TodoListItem key={item.id} item={item} />)}
                                        
                                        {completedItems.length > 0 && (
                                            <div className="pt-8 mt-4 border-t border-[var(--border-main)]">
                                                <h4 className="px-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Voltooid ({completedItems.length})</h4>
                                                <ul className="space-y-1">
                                                    {completedItems.map(item => <TodoListItem key={item.id} item={item} />)}
                                                </ul>
                                            </div>
                                        )}
                                    </ul>
                                )}
                            </div>
                            
                            <form onSubmit={handleAdd} className="p-8 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col gap-4 flex-shrink-0">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        placeholder="Nieuwe taak toevoegen..."
                                        className="w-full pl-5 pr-12 py-4 bg-[var(--bg-sidebar)] border border-[var(--border-main)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newItemText.trim()}
                                        className="absolute right-2 top-2 p-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] text-center font-medium">Druk op Enter om snel toe te voegen</p>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
