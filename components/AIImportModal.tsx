
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { X, Upload, Loader2, Check, AlertCircle, FileText, Image as ImageIcon, Target, Sparkles, Plus, Calendar as CalendarIcon, ShieldCheck, ShieldAlert, FileSpreadsheet, Type as TypeIcon, Trash2 } from 'lucide-react';
import type { SchoolEvent, SchoolSettings, SchoolGoal } from '../types';
import { vacationData } from '../constants';
import * as XLSX from 'xlsx';

interface AISuggestion {
    id: number;
    title: string;
    date: string;
    type: string;
    reason: string;
    program: string;
}

interface HolidayValidation {
    name: string;
    uploadedDates: string;
    officialDates: string;
    isValid: boolean;
    difference: string;
}

interface AIImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (events: SchoolEvent[]) => void;
    onImportGoals?: (goals: { goals: SchoolGoal[], themes: string[] }) => void;
    settings: SchoolSettings;
    existingEvents?: SchoolEvent[];
}

export const AIImportModal: React.FC<AIImportModalProps> = ({ isOpen, onClose, onImport, onImportGoals, settings, existingEvents = [] }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [pastedText, setPastedText] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewEvents, setPreviewEvents] = useState<SchoolEvent[]>([]);
    const [previewGoals, setPreviewGoals] = useState<SchoolGoal[]>([]);
    const [previewThemes, setPreviewThemes] = useState<string[]>([]);
    const [previewSuggestions, setPreviewSuggestions] = useState<AISuggestion[]>([]);
    const [holidayValidation, setHolidayValidation] = useState<HolidayValidation[]>([]);
    const [studyDayCount, setStudyDayCount] = useState<number>(settings.studyDayCount || 5);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            setError(null);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processFiles = async () => {
        if (files.length === 0 && !pastedText.trim()) return;

        setIsProcessing(true);
        setError(null);
        setHolidayValidation([]);

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Gemini API key is niet geconfigureerd. Controleer de instellingen.");
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const fileParts: any[] = [];
            const textParts: string[] = [];

            if (pastedText.trim()) {
                textParts.push(`GEPLAKT KLADJE/TEKST:\n${pastedText}\n`);
            }

            await Promise.all(files.map(async (file) => {
                if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const data = await file.arrayBuffer();
                    const workbook = XLSX.read(data);
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const csv = XLSX.utils.sheet_to_csv(firstSheet);
                    textParts.push(`EXCEL DATA (${file.name}):\n${csv}\n`);
                } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                    const text = await file.text();
                    textParts.push(`TEKST BESTAND (${file.name}):\n${text}\n`);
                } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                    fileParts.push({
                        inlineData: {
                            mimeType: file.type,
                            data: await readFileAsBase64(file)
                        }
                    });
                }
            }));

            const yearData = vacationData[settings.schoolYear as keyof typeof vacationData];
            const nationalGuidelines = yearData ? Object.entries(yearData).map(([name, regions]) => {
                const dates = regions[settings.region as keyof typeof regions];
                return `${name}: ${dates}`;
            }).join('\n') : 'Geen landelijke richtlijnen beschikbaar voor dit jaar.';

            const prompt = `
                Analyseer deze documenten en teksten voor een school (${settings.schoolType} in regio ${settings.region}). 
                Dit is een jaarplan voor het schooljaar ${settings.schoolYear}.
                
                TAAK:
                1. EXTRAHEER DOELEN ('goals'):
                   - Zoek naar 'Schoolontwikkeldoelen', 'Onderwijskwaliteit', 'Onderbouw/Middenbouw/Bovenbouw doelen' en vakspecifieke doelen (Taal, Rekenen, etc.).
                   - Voor elk doel: Geef een heldere titel en een korte beschrijving.
                
                2. EXTRAHEER THEMA'S ('themes'):
                   - Identificeer de belangrijkste focusgebieden (bijv. 'Eigenaarschap', 'STEAM', 'Burgerschap').
                
                3. EXTRAHEER EVENEMENTEN ('events'):
                   - Zoek naar concrete data voor studiedagen, vergaderingen, ouderavonden, etc.
                   - Let op: Als er een maand of periode wordt genoemd (bijv. 'in november'), kies dan een logische datum in die periode.
                   - Type moet een van deze zijn: ${settings.eventTypes.map(t => t.name).join(', ')}.
                   - Voor studiedagen: extraheer ook het programma/inhoud indien vermeld.
                
                4. DOE SUGGESTIES ('suggestions'):
                   - Op basis van de doelen in het document: welke activiteiten ontbreken nog in de planning om deze doelen te bereiken?
                   - We willen in totaal ${studyDayCount} studiedagen inplannen dit jaar.
                   - Doe concrete suggesties voor extra studiedagen, werkgroepmomenten of ouderavonden om aan dit totaal te komen.
                   - Geef een reden ('reason') waarom deze suggestie helpt bij het bereiken van de doelen.
                
                5. VAKANTIE CONTROLE ('holidayCheck'):
                   - Vergelijk de vakanties in het document met de landelijke richtlijnen:
                   ${nationalGuidelines}
                
                GEGEVENS UIT TEKST/EXCEL:
                ${textParts.join('\n---\n')}
                
                Geef het resultaat terug in het gevraagde JSON formaat.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [{ parts: [{ text: prompt }, ...fileParts] }],
                config: {
                    systemInstruction: `Je bent een expert in schoolorganisatie en jaarplanning voor het Nederlandse onderwijs. 
                    Je MOET ALTIJD in het NEDERLANDS antwoorden. Gebruik NOOIT Chinees of Engels. 
                    Je missie is om uit geüploade documenten (zoals jaarplannen, schoolgidsen en kalenders) alle relevante informatie te extraheren om een vliegende start te maken met de jaarplanning.
                    
                    Focus op:
                    - Concrete doelen (Schoolontwikkeldoelen, Onderwijskwaliteit, etc.) in het Nederlands.
                    - Geplande evenementen en studiedagen.
                    - Het identificeren van hiaten in de planning en het doen van proactieve suggesties die passen bij de schoolvisie.
                    - Het controleren van de vakantiedata tegen de landelijke richtlijnen.`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            events: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        date: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        isPublic: { type: Type.BOOLEAN },
                                        program: { type: Type.STRING }
                                    },
                                    required: ["title", "date", "type", "isPublic"]
                                }
                            },
                            goals: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        icon: { type: Type.STRING }
                                    },
                                    required: ["title", "description"]
                                }
                            },
                            themes: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        date: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        reason: { type: Type.STRING },
                                        program: { type: Type.STRING }
                                    },
                                    required: ["title", "date", "type", "reason"]
                                }
                            },
                            holidayCheck: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        uploadedDates: { type: Type.STRING },
                                        isValid: { type: Type.BOOLEAN },
                                        difference: { type: Type.STRING }
                                    },
                                    required: ["name", "uploadedDates", "isValid"]
                                }
                            }
                        },
                        required: ["events", "goals", "themes", "suggestions"]
                    }
                }
            });

            const result = JSON.parse(response.text);
            
            setPreviewEvents(result.events.map((e: any, i: number) => ({ ...e, id: Date.now() + i, durationMultiplier: 1 })));
            setPreviewGoals(result.goals.map((g: any, i: number) => ({ ...g, id: Date.now() + 1000 + i })));
            setPreviewThemes(result.themes);
            setPreviewSuggestions(result.suggestions.map((s: any, i: number) => ({ ...s, id: Date.now() + 2000 + i })));
            
            if (result.holidayCheck) {
                const validated = result.holidayCheck.map((h: any) => {
                    const official = yearData ? (yearData as any)[h.name]?.[settings.region] : 'Onbekend';
                    return { ...h, officialDates: official || 'Onbekend' };
                });
                setHolidayValidation(validated);
            }

        } catch (err) {
            console.error("AI Processing Error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            
            if (errorMessage.includes("API key not valid")) {
                setError("De API-sleutel is ongeldig. Controleer de configuratie.");
            } else if (errorMessage.includes("quota")) {
                setError("Quota overschreden. Probeer het later opnieuw.");
            } else if (errorMessage.includes("model not found") || errorMessage.includes("not available")) {
                setError("Het AI-model is momenteel niet beschikbaar in deze regio.");
            } else {
                setError(`Er is een fout opgetreden: ${errorMessage}. Probeer het opnieuw met minder of kleinere bestanden.`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = () => {
        if (previewEvents.length > 0) onImport(previewEvents);
        if (onImportGoals && (previewGoals.length > 0 || previewThemes.length > 0)) {
            onImportGoals({ goals: previewGoals, themes: previewThemes });
        }
        onClose();
    };

    const updatePreviewGoal = (id: number, field: keyof SchoolGoal, value: string) => {
        setPreviewGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const removePreviewGoal = (id: number) => {
        setPreviewGoals(prev => prev.filter(g => g.id !== id));
    };

    const toggleGoalForEvent = (eventId: number, goalId: number) => {
        setPreviewEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                const currentGoalIds = e.goalIds || [];
                const newGoalIds = currentGoalIds.includes(goalId)
                    ? currentGoalIds.filter(id => id !== goalId)
                    : [...currentGoalIds, goalId];
                return { ...e, goalIds: newGoalIds };
            }
            return e;
        }));
    };

    const adoptSuggestion = (suggestion: AISuggestion) => {
        const newEvent: SchoolEvent = {
            id: Date.now(),
            title: suggestion.title,
            date: suggestion.date,
            type: suggestion.type,
            isPublic: false,
            program: suggestion.program,
            durationMultiplier: 1
        };
        setPreviewEvents(prev => [...prev, newEvent]);
        setPreviewSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };

    const toggleEventPublic = (id: number) => {
        setPreviewEvents(prev => prev.map(e => e.id === id ? { ...e, isPublic: !e.isPublic } : e));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tighter leading-none">Gecombineerde Slimme Import</h2>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                            Maak je jaarplanning in minuten door documenten te uploaden. 
                            <span className="block mt-1.5 font-bold text-blue-600">
                                <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                                Tip: Upload je <strong>Schoolplan</strong>, <strong>Schoolgids</strong> en de <strong>Vakantieplanning</strong> voor het beste resultaat.
                            </span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    {(previewEvents.length === 0 && previewGoals.length === 0 && previewThemes.length === 0 && previewSuggestions.length === 0) ? (
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TypeIcon className="h-4 w-4 text-blue-600" />
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Eigen kladje of tekst</h3>
                                    </div>
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        placeholder="Plak hier je eigen aantekeningen, een lijst met studiedagen of andere tekstuele planning..."
                                        className="w-full h-48 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-xs font-medium"
                                    />
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                                        Tip: Je kunt hier ook de inhoud van een e-mail plakken.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Upload className="h-4 w-4 text-blue-600" />
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Bestanden uploaden</h3>
                                    </div>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${files.length > 0 ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-900 hover:bg-slate-50'}`}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            multiple
                                            accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
                                        />
                                        <Upload className={`h-10 w-10 mb-3 transition-colors ${files.length > 0 ? 'text-blue-500' : 'text-slate-300'}`} />
                                        <p className="text-sm font-black text-slate-700 tracking-tight">Sleep bestanden hierheen</p>
                                        <p className="text-[10px] text-slate-400 mt-1.5 text-center px-4 font-medium uppercase tracking-widest">PDF, Excel, Afbeeldingen of Tekst</p>
                                    </div>
                                    
                                    {files.length > 0 && (
                                        <div className="grid grid-cols-1 gap-1.5 max-h-24 overflow-y-auto pr-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ? <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> : <FileText className="h-3.5 w-3.5 text-blue-500" />}
                                                        <span className="text-[11px] font-bold text-slate-700 truncate">{f.name}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-4xl p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-xl">
                                        <CalendarIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 tracking-tight">Hoeveelheid studiedagen</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Hoeveel studiedagen wil je dit jaar in totaal inplannen?</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setStudyDayCount(Math.max(1, studyDayCount - 1))}
                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={studyDayCount}
                                        onChange={(e) => setStudyDayCount(parseInt(e.target.value) || 0)}
                                        className="w-12 text-center font-black text-slate-900 bg-transparent border-none focus:ring-0"
                                    />
                                    <button 
                                        onClick={() => setStudyDayCount(studyDayCount + 1)}
                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-blue-50 rounded-lg mb-2">
                                        <Target className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Schoolplan</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-purple-50 rounded-lg mb-2">
                                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Schoolgids</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex flex-col items-center text-center">
                                    <div className="p-1.5 bg-amber-50 rounded-lg mb-2">
                                        <CalendarIcon className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Vakanties</p>
                                </div>
                                <div className="p-3 bg-white border border-emerald-100 rounded-xl shadow-sm flex flex-col items-center text-center bg-emerald-50/30">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg mb-2">
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Excel/Kladje</p>
                                </div>
                            </div>

                            <div className="w-full max-w-4xl p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                                    Geavanceerde Analyse
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[10px] text-slate-500 leading-relaxed font-medium">
                                    <div className="space-y-1.5">
                                        <p><strong className="text-slate-900 uppercase tracking-tighter">Studiedagen:</strong> We herkennen studiedagen en extraheren direct de inhoud voor in de agenda.</p>
                                        <p><strong className="text-slate-900 uppercase tracking-tighter">Kwaliteitscyclus:</strong> Activiteiten worden gekoppeld aan strategische doelen.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p><strong className="text-slate-900 uppercase tracking-tighter">Vakanties:</strong> Vergelijking met landelijke richtlijnen voor regio ${settings.region}.</p>
                                        <p><strong className="text-slate-900 uppercase tracking-tighter">Privacy:</strong> Gegevens worden alleen gebruikt voor deze analyse.</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 max-w-md">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <p className="text-[11px] font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={processFiles}
                                disabled={(files.length === 0 && !pastedText.trim()) || isProcessing}
                                className={`px-10 py-3 rounded-xl font-black text-white shadow-xl transition-all flex items-center gap-2 text-sm uppercase tracking-widest ${(files.length === 0 && !pastedText.trim()) || isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-blue-600 hover:scale-105'}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Analyseert...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Start Slimme Analyse
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">{previewEvents.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Items</p>
                                    </div>
                                    <div className="w-px bg-slate-200"></div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">{previewGoals.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Doelen</p>
                                    </div>
                                    <div className="w-px bg-slate-200"></div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">{previewThemes.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Thema's</p>
                                    </div>
                                    <div className="w-px bg-slate-200"></div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-900 tracking-tighter">{previewSuggestions.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Suggesties</p>
                                    </div>
                                </div>
                                <button onClick={() => { setPreviewEvents([]); setPreviewGoals([]); setPreviewThemes([]); setPreviewSuggestions([]); setFiles([]); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Reset & Nieuwe upload</button>
                            </div>

                            {previewEvents.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                        <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                        Jaarplanning Voorstel
                                    </h3>
                                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Datum</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Activiteit</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Gekoppelde Doelen</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ouders</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewEvents.map((event) => (
                                                    <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 text-[11px] font-black text-slate-700">{new Date(event.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}</td>
                                                        <td className="p-3">
                                                            <p className="text-[11px] font-black text-slate-900 tracking-tight">{event.title}</p>
                                                            {event.program && <p className="text-[10px] text-slate-400 mt-0.5 font-medium line-clamp-1">{event.program}</p>}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-wider">{event.type}</span>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {previewGoals.map(goal => (
                                                                    <button
                                                                        key={goal.id}
                                                                        onClick={() => toggleGoalForEvent(event.id as number, goal.id)}
                                                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all border ${
                                                                            (event.goalIds || []).includes(goal.id)
                                                                                ? 'bg-purple-600 text-white border-purple-600'
                                                                                : 'bg-white text-slate-400 border-slate-200 hover:border-purple-300'
                                                                        }`}
                                                                        title={goal.title}
                                                                    >
                                                                        {goal.title.substring(0, 10)}...
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button 
                                                                onClick={() => toggleEventPublic(event.id as number)}
                                                                className={`p-1.5 rounded-lg transition-all ${event.isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}
                                                            >
                                                                {event.isPublic ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {(previewGoals.length > 0 || previewThemes.length > 0) && (
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                            <div className="w-1.5 h-4 bg-purple-600 rounded-full"></div>
                                            Strategische Doelen
                                        </h3>
                                        <div className="space-y-2.5">
                                            {previewGoals.map(goal => (
                                                <div key={goal.id} className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 flex gap-3 shadow-sm group relative">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
                                                        <Target className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <div className="flex-grow space-y-2">
                                                        <input 
                                                           type="text"
                                                           value={goal.title}
                                                           onChange={(e) => updatePreviewGoal(goal.id, 'title', e.target.value)}
                                                           className="w-full bg-transparent border-none p-0 text-[11px] font-black text-purple-900 tracking-tight focus:ring-0"
                                                           placeholder="Doel titel..."
                                                        />
                                                        <textarea 
                                                           value={goal.description}
                                                           onChange={(e) => updatePreviewGoal(goal.id, 'description', e.target.value)}
                                                           className="w-full bg-transparent border-none p-0 text-[10px] text-purple-700 leading-relaxed font-medium focus:ring-0 resize-none"
                                                           placeholder="Doel beschrijving..."
                                                           rows={2}
                                                        />
                                                    </div>
                                                    <button 
                                                       onClick={() => removePreviewGoal(goal.id)}
                                                       className="absolute top-2 right-2 p-1 text-purple-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                       <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => setPreviewGoals(prev => [...prev, { id: Date.now(), title: 'Nieuw Doel', description: '' }])}
                                                className="w-full py-2 border-2 border-dashed border-purple-200 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Doel Toevoegen
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                            <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                                            Thema's & Focus
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {previewThemes.map(theme => (
                                                <span key={theme} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100 shadow-sm uppercase tracking-widest">
                                                    {theme}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                                            <div className="p-1.5 bg-blue-600 rounded-lg h-fit">
                                                <AlertCircle className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <p className="text-[10px] text-blue-800 leading-relaxed font-bold">
                                                Deze thema's zijn herkend als kernonderdelen van je kwaliteitsbeleid en worden toegevoegd aan je werkbalk.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {previewSuggestions.length > 0 && (
                                <section className="space-y-3">
                                     <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                         <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                         AI Suggesties
                                         <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-full animate-pulse">NIEUW</span>
                                     </h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                         {previewSuggestions.map(suggestion => (
                                             <div key={suggestion.id} className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                                                 <div>
                                                     <div className="flex items-start justify-between mb-2">
                                                         <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                             <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                         </div>
                                                         <span className="text-[8px] font-black text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-[0.2em]">
                                                             {suggestion.type}
                                                         </span>
                                                     </div>
                                                     <p className="text-[11px] font-black text-slate-900 leading-tight tracking-tight">{suggestion.title}</p>
                                                     <p className="text-[9px] text-slate-400 mt-0.5 font-black uppercase tracking-widest">{new Date(suggestion.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}</p>
                                                     <div className="mt-2.5 p-2.5 bg-white/60 rounded-lg border border-amber-100/50">
                                                         <p className="text-[10px] text-slate-600 leading-relaxed italic font-medium">
                                                             "{suggestion.reason}"
                                                         </p>
                                                     </div>
                                                 </div>
                                                 <button 
                                                     onClick={() => adoptSuggestion(suggestion)}
                                                     className="mt-3 w-full py-2 bg-white hover:bg-slate-900 hover:text-white text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                                                 >
                                                     <Plus className="h-3.5 w-3.5" />
                                                     Voeg toe
                                                 </button>
                                             </div>
                                         ))}
                                     </div>
                                 </section>
                            )}

                            {holidayValidation.length > 0 && (
                                <section className="space-y-3">
                                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                        <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                                        Vakantie Controle
                                    </h3>
                                    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vakantie</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">In document</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Landelijk</th>
                                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {holidayValidation.map((h, i) => (
                                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 text-[11px] font-black text-slate-700">{h.name}</td>
                                                        <td className="p-3 text-[10px] text-slate-500 font-mono">{h.uploadedDates}</td>
                                                        <td className="p-3 text-[10px] text-slate-500 font-mono">{h.officialDates}</td>
                                                        <td className="p-3">
                                                            <div className="flex flex-col items-center gap-1">
                                                                {h.isValid ? (
                                                                    <div className="flex items-center gap-1 text-emerald-600 font-black text-[8px] bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                        Correct
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 text-rose-600 font-black text-[8px] bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                        <ShieldAlert className="h-3 w-3" />
                                                                        Afwijkend
                                                                    </div>
                                                                )}
                                                                {h.difference && <p className="text-[8px] text-slate-400 text-center max-w-[120px] font-medium leading-tight">{h.difference}</p>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
                                        <CalendarIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                            Let op: Besturen mogen afwijken van de landelijke richtlijnen. Deze controle is bedoeld als hulpmiddel.
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-lg transition-colors">
                        Annuleren
                    </button>
                    {(previewEvents.length > 0 || previewGoals.length > 0) && (
                        <button 
                            onClick={handleConfirmImport}
                            className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all uppercase tracking-[0.2em]"
                        >
                            Bevestig & Importeer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
