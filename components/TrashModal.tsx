import React from 'react';
import type { SchoolEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCcw, X, AlertCircle } from 'lucide-react';

interface TrashModalProps {
    isOpen: boolean;
    onClose: () => void;
    deletedEvents: SchoolEvent[];
    onRestore: (eventId: number) => void;
    onPermanentDelete: (eventId: number) => void;
    onEmptyTrash: () => void;
    isFirebaseMode: boolean;
}

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose, deletedEvents, onRestore, onPermanentDelete, onEmptyTrash, isFirebaseMode }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 print:hidden" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-8 border-b bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none">Prullenbak</h2>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2 opacity-40">Beheer verwijderde items</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto flex-grow bg-slate-50/30">
                            {isFirebaseMode ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                        <AlertCircle className="h-10 w-10 text-blue-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Prullenbak niet beschikbaar in Cloud</h3>
                                    <p className="text-sm text-slate-400 mt-2 max-w-[280px]">In Cloud-modus worden verwijderde items permanent gewist voor alle gebruikers. Deze functie is alleen beschikbaar in de lokale modus.</p>
                                </div>
                            ) : deletedEvents.length > 0 ? (
                                <ul className="space-y-4">
                                    {deletedEvents.map(event => (
                                        <li key={event.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{event.title}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-60">
                                                        {new Date(event.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                                    </span>
                                                    {event.deletedAt && (
                                                        <>
                                                            <span className="text-slate-200 text-[10px]">•</span>
                                                            <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest opacity-60">
                                                                Verwijderd op {new Date(event.deletedAt).toLocaleDateString('nl-NL')}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => onRestore(event.id!)} 
                                                    className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    title="Herstellen"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onPermanentDelete(event.id!)} 
                                                    className="p-2.5 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    title="Permanent verwijderen"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <Trash2 className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">De prullenbak is leeg</h3>
                                    <p className="text-sm text-slate-400 mt-2 max-w-[240px]">Verwijderde items verschijnen hier zodat je ze eventueel kunt herstellen.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 border-t bg-white flex justify-between items-center">
                            <button 
                                onClick={onEmptyTrash} 
                                disabled={deletedEvents.length === 0}
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-rose-600 rounded-2xl hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-100 disabled:shadow-none"
                            >
                                Leeg Prullenbak
                            </button>
                            <button 
                                onClick={onClose} 
                                className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl transition-all border border-slate-100"
                            >
                                Sluiten
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
