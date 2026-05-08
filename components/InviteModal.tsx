import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Mail, Shield, User } from 'lucide-react';
import { auth } from '../lib/firebase';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string) => void;
    collaborators: string[]; 
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onInvite, collaborators }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim() && !collaborators.includes(email)) {
            onInvite(email.trim());
            setEmail('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-[var(--border-main)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-[var(--text-main)] tracking-tighter leading-none">Collega Uitnodigen</h2>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2 opacity-50">Werk samen aan de planning</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-[var(--bg-sidebar)] rounded-2xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 bg-[var(--bg-sidebar)]/30">
                            {/* Invitation Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="naam@school.nl"
                                        className="w-full pl-11 pr-4 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-[var(--text-main)] transition-all placeholder:text-[var(--text-muted)] shadow-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 shadow-xl shadow-slate-100 dark:shadow-none transition-all active:scale-95"
                                >
                                    Uitnodiging Versturen
                                </button>
                            </form>

                            {/* Current Collaborators */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Huidige Teamleden</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {collaborators.length > 0 ? (
                                        collaborators.map((collabEmail, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                        <User size={14} className="text-[var(--text-muted)]" />
                                                    </div>
                                                    <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[180px]">
                                                        {collabEmail === auth.currentUser?.email ? 'Jij (Eigenaar)' : collabEmail}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    <Shield size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">Editor</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">Nog geen andere collega's.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/40 text-center">
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                                Collega's die je toevoegt kunnen de planning bekijken en bewerken zodra ze inloggen met hun emailadres.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
