
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, Globe, Code, ExternalLink, X } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    schoolName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, schoolName }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');

    // In a real app, this would be the actual deployment URL
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/?view=parent&embed=true`;
    const embedCode = `<iframe src="${shareUrl}" width="100%" height="800px" frameborder="0" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;"></iframe>`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <Share2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Deel Jaarplanner</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Voor {schoolName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setActiveTab('link')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'link' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Globe size={14} /> Directe Link
                            </button>
                            <button
                                onClick={() => setActiveTab('embed')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'embed' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Code size={14} /> Website Embed
                            </button>
                        </div>

                        {activeTab === 'link' ? (
                            <div className="space-y-4">
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                                    Deel deze link met ouders of collega's. Zij kunnen de kalender bekijken zonder in te loggen.
                                </p>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 group focus-within:border-blue-500 transition-all">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={shareUrl} 
                                        className="flex-1 bg-transparent text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                                    />
                                    <button 
                                        onClick={() => handleCopy(shareUrl)}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                                    Kopieer deze code en plaats deze op je schoolwebsite voor een altijd up-to-date jaarplanner.
                                </p>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <textarea 
                                            readOnly 
                                            value={embedCode} 
                                            rows={4}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 outline-none resize-none"
                                        />
                                        <button 
                                            onClick={() => handleCopy(embedCode)}
                                            className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                                        >
                                            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                            Live synchronisatie
                                        </div>
                                        <button 
                                            onClick={() => window.open(shareUrl, '_blank')}
                                            className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                                        >
                                            Bekijk voorbeeld <ExternalLink size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Privacy tip: Embed modus verbergt automatisch alle beheer-opties.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
