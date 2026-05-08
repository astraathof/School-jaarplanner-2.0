import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { SchoolEvent, SchoolSettings, SchoolGoal, INSPECTION_STANDARDS, InspectionStandard } from '../types';
import { Send, X, Loader2, Sparkles, MessageSquare, Bot, User, ChevronRight, AlertCircle, Plus, Calendar as CalendarIcon, Check, Mic, MicOff, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    events: SchoolEvent[];
    settings: SchoolSettings;
    onAddEvents: (events: SchoolEvent[]) => void;
}

interface SmartInsight {
    type: 'warning' | 'suggestion' | 'praise';
    title: string;
    description: string;
    action?: string;
}

interface AISuggestion {
    title: string;
    date: string;
    type: string;
    isPublic: boolean;
    program: string;
    inspectionStandards?: InspectionStandard[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    suggestions?: AISuggestion[];
}

// Declare SpeechRecognition for TypeScript
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ isOpen, onClose, events, settings, onAddEvents }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hoi! Ik ben je AI Planning Assistent. Hoe kan ik je vandaag helpen met de schooljaarplanning?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [addedSuggestionIndices, setAddedSuggestionIndices] = useState<Set<string>>(new Set());
    const [insights, setInsights] = useState<SmartInsight[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'nl-NL';

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
                setIsRecording(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording:', err);
            }
        }
    };

    useEffect(() => {
        if (isOpen && insights.length === 0 && !isAnalyzing) {
            generateInsights();
        }
    }, [isOpen]);

    const generateInsights = async () => {
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

            const prompt = `
                Analyseer de volgende schoolplanning en geef 3-4 "Smart Insights" in het NEDERLANDS.
                School: ${settings.schoolName} (${settings.schoolType})
                Doelen: ${settings.goals.map(g => g.title).join(', ')}
                Events: ${events.length} totaal.
                
                GEEF ANTWOORD IN HET NEDERLANDS.
                Geef antwoord in JSON formaat:
                {
                    "insights": [
                        {
                            "type": "warning" | "suggestion" | "praise",
                            "title": "Korte titel in het Nederlands",
                            "description": "Duidelijke uitleg in het Nederlands",
                            "action": "Optionele actie tekst in het Nederlands"
                        }
                    ]
                }
                
                Focus op:
                - Balans tussen werkdruk en rust.
                - Dekking van de schooldoelen.
                - Logische spreiding van evenementen.
                - Kansen voor professionalisering (studiedagen).
            `;

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });
            
            const text = result.text;
            const data = JSON.parse(text);
            setInsights(data.insights || []);
        } catch (error) {
            console.error('Error generating insights:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            text: `Je bent een expert in schooljaarplanning voor het basisonderwijs in Nederland. 
                            Je hebt toegang tot de huidige planning en instellingen van de school.
                            
                            SCHOOL NAAM: ${settings.schoolName}
                            SCHOOLJAAR: ${settings.schoolYear}
                            HUIDIGE DATUM: ${new Date().toISOString().split('T')[0]}
                            REGIO: ${settings.region}
                            TYPE: ${settings.schoolType}
                            DOELEN: ${JSON.stringify(settings.goals)}
                            THEMA'S: ${JSON.stringify(settings.themes)}
                            HUIDIGE EVENEMENTEN: ${JSON.stringify(events.filter(e => !e.deletedAt))}
                            INSPECTIE STANDAARDEN: ${JSON.stringify(INSPECTION_STANDARDS)}
                            BESCHIKBARE TYPES: ${settings.eventTypes.map(t => t.name).join(', ')}

                            Geef kort en krachtig advies. Als de gebruiker vraagt om iets te plannen, geef dan concrete suggesties in het 'suggestions' veld van de JSON.
                            Houd rekening met de werkdruk (bijv. niet te veel op dinsdag als dat al vol zit).
                            
                            Vraag van de gebruiker: ${userMessage}`
                        }]
                    }
                ],
                config: {
                    systemInstruction: "Je bent een behulpzame assistent voor schoolleiders in Nederland. Je MOET ALTIJD in het NEDERLANDS antwoorden. Gebruik onder geen beding een andere taal zoals Chinees of Engels. Wees professioneel maar toegankelijk. Als de gebruiker vraagt om iets te plannen of suggesties voor data wil, gebruik dan ALTIJD het 'suggestions' veld voor de concrete items. Houd de 'text' kort en bemoedigend.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING, description: "Het tekstuele antwoord aan de gebruiker in het NEDERLANDS." },
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING, description: "Titel van het evenement in het Nederlands" },
                                        date: { type: Type.STRING, description: "YYYY-MM-DD" },
                                        type: { type: Type.STRING, description: "Type evenement (bijv. Studiedag, Feestdag)" },
                                        isPublic: { type: Type.BOOLEAN, description: "Of het evenement zichtbaar is voor ouders." },
                                        program: { type: Type.STRING, description: "Beschrijving van het programma in het Nederlands" },
                                        inspectionStandards: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                    required: ["title", "date", "type", "isPublic"]
                                }
                            }
                        },
                        required: ["text"]
                    }
                }
            });

            const data = JSON.parse(response.text);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.text || "Hier is mijn advies.",
                suggestions: data.suggestions 
            }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Er ging iets mis bij het verwerken van je vraag. Controleer je internetverbinding." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSuggestion = (suggestion: AISuggestion, msgIdx: number, sugIdx: number) => {
        const key = `${msgIdx}-${sugIdx}`;
        if (addedSuggestionIndices.has(key)) return;

        const newEvent: SchoolEvent = {
            title: suggestion.title,
            date: suggestion.date,
            type: suggestion.type,
            program: suggestion.program,
            inspectionStandards: suggestion.inspectionStandards,
            isPublic: suggestion.isPublic ?? false
        };

        onAddEvents([newEvent]);
        setAddedSuggestionIndices(prev => new Set(prev).add(key));
    };

    return (
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
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] shadow-2xl z-[80] flex flex-col border-l border-[var(--border-main)]"
                    >
                        <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl shadow-xl shadow-slate-200 dark:shadow-none">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-black text-[var(--text-main)] tracking-tighter leading-none">AI Assistent</h3>
                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1.5 opacity-40">Planning & Advies</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2.5 hover:bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-grow overflow-y-auto p-5 space-y-6 bg-[var(--bg-sidebar)]/30 scrollbar-hide">
                            {/* Smart Insights Section */}
                            {insights.length > 0 && (
                                <div className="space-y-4 mb-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <Sparkles className="h-4 w-4 text-purple-500" />
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Smart Insights</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {insights.map((insight, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                                                    insight.type === 'warning' ? 'bg-[var(--bg-card)] border-rose-100 dark:border-rose-900/30' :
                                                    insight.type === 'praise' ? 'bg-[var(--bg-card)] border-emerald-100 dark:border-emerald-900/30' :
                                                    'bg-[var(--bg-card)] border-blue-100 dark:border-blue-900/30'
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`p-2 rounded-xl h-fit shadow-sm ${
                                                        insight.type === 'warning' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                                                        insight.type === 'praise' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                                                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                        {insight.type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
                                                         insight.type === 'praise' ? <Check className="h-5 w-5" /> :
                                                         <Sparkles className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-black text-[var(--text-main)] tracking-tight">{insight.title}</h4>
                                                        <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed font-medium">{insight.description}</p>
                                                        {insight.action && (
                                                            <button 
                                                                onClick={() => {
                                                                    setInput(insight.action || '');
                                                                }}
                                                                className="mt-3 text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1"
                                                            >
                                                                {insight.action} <ChevronRight className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="flex items-center gap-3 p-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm animate-pulse mb-4">
                                    <div className="p-2 bg-[var(--bg-sidebar)] rounded-xl">
                                        <Loader2 className="h-4 w-4 text-[var(--text-muted)] animate-spin" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Analyseren...</span>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)]">Ik bekijk je planning voor optimalisaties</span>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)]'}`}>
                                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>
                                        <div className={`p-4 rounded-3xl shadow-sm text-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-none' : 'bg-[var(--bg-card)] text-[var(--text-main)] rounded-tl-none border border-[var(--border-main)] shadow-slate-200/50 dark:shadow-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                    
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="mt-2 ml-14 space-y-4 w-[85%]">
                                            <div className="flex items-center gap-2">
                                                <ListTodo className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Voorgestelde Activiteiten</p>
                                            </div>
                                            {msg.suggestions.map((sug, sIdx) => {
                                                const isAdded = addedSuggestionIndices.has(`${idx}-${sIdx}`);
                                                return (
                                                    <motion.div 
                                                        key={sIdx}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: sIdx * 0.05 }}
                                                        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-4 shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 transition-all group"
                                                    >
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className="text-[8px] font-black px-2 py-0.5 bg-[var(--bg-sidebar)] text-[var(--text-muted)] rounded-full uppercase tracking-wider">
                                                                        {sug.type}
                                                                    </span>
                                                                    <span className="text-[9px] text-[var(--text-muted)] font-bold">
                                                                        {new Date(sug.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-black text-[var(--text-main)] text-xs tracking-tight">{sug.title}</h4>
                                                                {sug.program && <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 italic font-medium leading-relaxed">{sug.program}</p>}
                                                                
                                                                {sug.inspectionStandards && sug.inspectionStandards.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {sug.inspectionStandards.map(std => (
                                                                            <span key={std} className="text-[8px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-800 font-black uppercase tracking-tighter">
                                                                                {std}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={() => handleAddSuggestion(sug, idx, sIdx)}
                                                                disabled={isAdded}
                                                                className={`flex-shrink-0 p-2.5 rounded-xl transition-all shadow-sm ${isAdded ? 'bg-emerald-500 text-white shadow-emerald-100 dark:shadow-none' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500 shadow-slate-200 dark:shadow-none'}`}
                                                            >
                                                                {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            {msg.suggestions.length > 1 && !Array.from(addedSuggestionIndices).some((k: string) => k.startsWith(`${idx}-`)) && (
                                                <button 
                                                    onClick={() => msg.suggestions?.forEach((s, sIdx) => handleAddSuggestion(s, idx, sIdx))}
                                                    className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 dark:shadow-none hover:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Alles toevoegen
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] flex items-center justify-center shadow-sm border border-[var(--border-main)]">
                                            <Loader2 className="h-4 w-4 text-[var(--text-muted)] animate-spin" />
                                        </div>
                                        <div className="p-4 bg-[var(--bg-card)] rounded-3xl rounded-tl-none border border-[var(--border-main)] shadow-sm shadow-slate-200/50 dark:shadow-none">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-[var(--border-main)] rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-[var(--border-main)] rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-1.5 h-1.5 bg-[var(--border-main)] rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-[var(--border-main)] bg-[var(--bg-card)]">
                            <div className="flex gap-2 items-center bg-[var(--bg-sidebar)] p-1.5 rounded-3xl border border-[var(--border-main)] focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                                <input 
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Stel een vraag..."
                                    className="flex-grow px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                                />
                                <button 
                                    onClick={toggleRecording}
                                    className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm border border-[var(--border-main)]'}`}
                                    title={isRecording ? "Stop met opnemen" : "Praat met de assistent"}
                                >
                                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </button>
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className={`p-2.5 rounded-xl transition-all ${!input.trim() || isLoading ? 'bg-[var(--bg-sidebar)] text-[var(--text-muted)]' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500 shadow-xl shadow-slate-200 dark:shadow-none active:scale-95'}`}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <button 
                                    onClick={() => setInput("Hoe is de verdeling van de studiedagen?")}
                                    className="whitespace-nowrap px-4 py-2 bg-[var(--bg-sidebar)] hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-main)] transition-all"
                                >
                                    Verdeling checken
                                </button>
                                <button 
                                    onClick={() => setInput("Geef suggesties voor een studiedag over AI")}
                                    className="whitespace-nowrap px-4 py-2 bg-[var(--bg-sidebar)] hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-main)] transition-all"
                                >
                                    AI Studiedag tips
                                </button>
                                <button 
                                    onClick={() => setInput("Voldoen we aan de inspectie-standaarden?")}
                                    className="whitespace-nowrap px-4 py-2 bg-[var(--bg-sidebar)] hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-main)] transition-all"
                                >
                                    Inspectie check
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
