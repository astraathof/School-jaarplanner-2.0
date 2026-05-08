import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, User, Calendar, Clock } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'create' | 'update' | 'delete';
    userName: string;
    userPhoto: string;
    eventTitle: string;
    timestamp: any;
}

interface ActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    activities: ActivityItem[];
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose, activities }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-[var(--border-main)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-[var(--text-main)] tracking-tighter leading-none">Activiteitenlog</h2>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2 opacity-50">Wie heeft wat gewijzigd?</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-[var(--bg-sidebar)] rounded-2xl transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow bg-[var(--bg-sidebar)]/30 space-y-6">
                            {activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div key={activity.id} className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 dark:border-slate-800 ml-4 last:border-l-0">
                                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-[var(--bg-card)] overflow-hidden shadow-sm">
                                            <img src={activity.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="flex flex-col gap-1 pl-4 pt-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black text-[var(--text-main)]">{activity.userName}</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    activity.type === 'create' ? 'bg-emerald-100 text-emerald-700' :
                                                    activity.type === 'update' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {activity.type === 'create' ? 'Toegevoegd' : activity.type === 'update' ? 'Aangepast' : 'Verwijderd'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--text-main)] font-medium leading-relaxed">
                                                {activity.eventTitle}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-[var(--text-muted)] uppercase">
                                                <Clock size={10} />
                                                {activity.timestamp?.toDate ? new Date(activity.timestamp.toDate()).toLocaleString('nl-NL') : 'Zojuist'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-[var(--text-muted)] italic">Nog geen activiteiten gevonden.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
