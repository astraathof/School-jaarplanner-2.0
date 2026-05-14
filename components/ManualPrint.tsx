
import React from 'react';
import { 
    HelpCircle, Sparkles, Target, Zap, ShieldCheck, Users, LayoutDashboard, Globe, 
    FileText, MessageSquare, Shield, Info, Search, Printer, Calendar, Filter, 
    Settings, Download, Share2, BarChart3, AlertTriangle, Eye, Edit3, ClipboardList,
    Clock, CheckCircle2, List, Trash2, Mail, ExternalLink, Activity
} from 'lucide-react';

export const ManualPrint: React.FC = () => {
    return (
        <div id="manual-print-content" className="w-[794px] bg-white flex flex-col items-center font-sans text-slate-900 border border-slate-200">
            
            {/* PAGE 1: INTRODUCTIE & SNELSTART */}
            <div className="manual-page w-[794px] h-[1122px] p-16 relative flex flex-col gap-12 border-b-2 border-slate-100">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">Functionele Handleiding</h1>
                        <p className="text-slate-500 font-bold text-sm tracking-widest mt-2 uppercase">School Jaarplanner 2.0</p>
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Versie 2.0.4<br/>Strategisch Model
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 uppercase text-slate-900">1. Inleiding</h2>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        De School Jaarplanner 2.0 is een strategisch regie-instrument dat schoolleiders ondersteunt bij het integraal plannen van het schooljaar. Het combineert operationele agenda-voering met strategische kwaliteitsborging en werkdrukmanagement.
                    </p>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="p-6 bg-white rounded-2xl border-2 border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Doelgroep</h3>
                            <p className="text-xs text-slate-500 leading-relaxed italic">Directie, Management Teams (MT), Kwaliteitscoördinatoren en Ondersteuning.</p>
                        </div>
                        <div className="p-6 bg-white rounded-2xl border-2 border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Systeemvereisten</h3>
                            <p className="text-xs text-slate-500 leading-relaxed italic">Moderne webbrowser (Chrome, Edge, Safari). Geoptimaliseerd voor desktop gebruik.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 uppercase text-slate-900">2. AI Snelstart & Data-Import</h2>
                    <div className="space-y-4">
                        <div className="flex gap-6 items-start">
                            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl grow-0 shrink-0 border border-slate-200"><Sparkles size={20} /></div>
                            <div>
                                <h3 className="font-bold text-sm uppercase mb-1 text-slate-900">AI Slimme Import</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Importeer bestaande planningen door een PDF of foto te uploaden via de 'AI Snelstart' knop in de header. Onze AI herkent automatisch datum-strings, titels en omschrijvingen en zet deze om in concept-agenda-items.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl grow-0 shrink-0 border border-slate-200"><MessageSquare size={20} /></div>
                            <div>
                                <h3 className="font-bold text-sm uppercase mb-1 text-slate-900">AI Chat Zijbalk</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Gebruik de AI Chatbot (rechtsonder) voor natuurlijke taalopdrachten zoals: <i>"Zoek alle MR vergaderingen in mei"</i> of <i>"Welke weken hebben te weinig onderwijstijd gereserveerd?"</i>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-2 border-slate-900 p-8 rounded-[2rem] bg-white mt-auto">
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-tighter text-slate-900">Snel aan de slag (Checklist)</h3>
                    <ul className="grid grid-cols-2 gap-y-3 gap-x-8 text-[11px] font-medium text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-900" /> Stel Regio in via Instellingen</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-900" /> Definieer Strategische Jaardoelen</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-900" /> Importeer basisplanning via AI</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-900" /> Deel de planning met het MT</li>
                    </ul>
                </div>
            </div>

            {/* PAGE 2: AGENDA BEHEER & NAVIGATIE */}
            <div className="manual-page w-[794px] h-[1122px] p-16 relative flex flex-col gap-10 border-b-2 border-slate-100">
                <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 uppercase text-slate-900">3. Agenda Beheer & Navigatie</h2>
                
                <div className="space-y-8">
                    <section>
                        <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Kalender Weergaves</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { title: "Raster 1 Maand", desc: "Detailfocus voor dagelijks beheer." },
                                { title: "Raster 2 Maanden", desc: "De standaard strategische weergave." },
                                { title: "Raster 3 Maanden", desc: "Kwartaaloverzicht voor lange-termijn visie." }
                            ].map((view, i) => (
                                <div key={i} className="p-4 border-2 border-slate-100 rounded-2xl">
                                    <h4 className="font-bold text-[11px] uppercase mb-1 text-slate-900">{view.title}</h4>
                                    <p className="text-[10px] text-slate-500 italic leading-snug">{view.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Activiteiten Beheer</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100">
                                <Edit3 size={18} className="text-slate-900 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase tracking-tight text-slate-900">Items Toevoegen & Bewerken</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Klik op 'Nieuw Item' of dubbelklik op een dag. In het detailvenster kunt u titels, tijden, locaties en gedetailleerde programma-omschrijvingen opgeven.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100">
                                <Zap size={18} className="text-slate-900 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase tracking-tight text-slate-900">Conflict Assistent</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Het systeem bewaakt automatisch de agenda van het MT. Bij dubbele boekingen of overlappende studiemiddagen kleurt de dag in de kalender signaal-rood.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100">
                                <Filter size={18} className="text-slate-900 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase tracking-tight text-slate-900">Zoeken & Filteren</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Gebruik de filterbalk om te filteren op categorieën (MT, Ouders, Onderwijs). Met de zoekfunctie vindt u items razendsnel terug op basis van trefwoorden in de titel of omschrijving.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                
                <div className="mt-auto flex items-center justify-between py-6 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-300">Pagina 2 / 4</span>
                    <div className="flex gap-3 text-slate-400">
                        <div className="px-3 py-1 bg-slate-50 rounded text-[9px] font-bold uppercase border border-slate-100">Sneltoets: CTRL+F (Zoeken)</div>
                        <div className="px-3 py-1 bg-slate-50 rounded text-[9px] font-bold uppercase border border-slate-100">Sneltoets: ESC (Sluiten)</div>
                    </div>
                </div>
            </div>

            {/* PAGE 3: STRATEGIE & KWALITEITSBORGING */}
            <div className="manual-page w-[794px] h-[1122px] p-16 relative flex flex-col gap-10 border-b-2 border-slate-100">
                <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 uppercase text-slate-900">4. Strategie & Kwaliteitsborging</h2>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 space-y-4">
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Koppel activiteiten aan Jaardoelen</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Een unieke eigenschap van de School Jaarplanner is de directe koppeling met het schoolplan. Bij elk event kunt u aangeven welk <b>Strategisch Doel (OP/SK)</b> hiermee wordt gediend.
                        </p>
                    </div>
                    
                    <div className="col-span-6 p-6 bg-white border-2 border-slate-900 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                            <Target size={20} />
                            <span className="font-bold text-xs uppercase tracking-widest">Strategische Roadmap</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">
                            De Roadmap vindt u onder het kopje 'Analyses'. Het geeft in één oogopslag weer welk deel van het jaar u aan welk doel werkt. Zitten er 'gaten' in de borging van een specifiek doel? Dan ziet u dit hier direct.
                        </p>
                    </div>

                    <div className="col-span-6 p-6 bg-white border-2 border-slate-100 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                            <ShieldCheck size={20} />
                            <span className="font-bold text-xs uppercase tracking-widest">Inspectie Kwaliteitsmatrix</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">
                            De Kwaliteitsmatrix analyseert uw planning op basis van inspectie-normen (OP1 t/m OP4). Het systeem laat zien of u voldoende overlegmomenten en evaluaties heeft ingepland om te voldoen aan de onderzoeksstandaarden.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 mt-4">
                    <section>
                        <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest">Urennormering & Gezondheidscheck</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 border-2 border-slate-100 rounded-3xl bg-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock size={16} className="text-slate-900" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">1000-urennorm</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                                    De Health Check in de header berekent real-time de geschatte onderwijstijd op basis van de ingevoerde schoolweken, vakanties en vrije dagen.
                                </p>
                            </div>
                            <div className="p-6 border-2 border-slate-100 rounded-3xl bg-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={16} className="text-slate-900" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Verkorte Weken</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                                    U kunt via 'Verkorte Weken' (in menu) specifieke weken markeren als 4-daags of met afwijkende tijden. De uren-teller past zich hier direct op aan.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-auto py-6 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-300">Pagina 3 / 4</span>
                </div>
            </div>

            {/* PAGE 4: WERKDRUK, TEAM & EXPORTS */}
            <div className="manual-page w-[794px] h-[1122px] p-16 relative flex flex-col gap-10">
                <h2 className="text-2xl font-bold border-l-4 border-slate-900 pl-4 uppercase text-slate-900">5. Werkdruk, Team & Publicatie</h2>

                <div className="space-y-10">
                    <section>
                        <h3 className="text-sm font-black uppercase text-slate-900 mb-4 tracking-widest px-2 border-b-2 border-slate-900 w-fit">Werkdruk Dashboard</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                            De <b>Werkdruk Heatmap</b> onderin de kalender geeft een visuele indicatie van de druk op de schoolorganisatie.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-white rounded-full overflow-hidden flex border-2 border-slate-100">
                                    <div className="h-full w-1/4 bg-slate-100" />
                                    <div className="h-full w-1/4 bg-slate-200" />
                                    <div className="h-full w-1/4 bg-slate-300" />
                                    <div className="h-full w-1/4 bg-slate-400" />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                                    <span>Laag</span>
                                    <span>Gemiddeld</span>
                                    <span>Hoog (Piekmoment)</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 italic font-bold leading-relaxed">
                                Gebruik de dashboards 'Dashboard' en 'Analyses' om proactief te schuiven met activiteiten wanneer een maand diep kleurt (te hoge belasting).
                            </p>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border-2 border-slate-900 space-y-6">
                        <div className="flex items-center gap-3">
                            <Users size={20} className="text-slate-900" />
                            <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">Samenwerking & Cloud</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">
                            Activeer <b>"Cloud Mode"</b> om live samen te werken met uw hele MT. Wijzigingen van collega's verschijnen direct in uw scherm. De 'Activity Log' houdt exact bij wie welke wijzigingen heeft doorgevoerd voor maximale audit-trail.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Exports & Publicatie</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 border-2 border-slate-100 rounded-2xl flex flex-col gap-3 bg-white">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Globe size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ouder-View (Publiek)</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    Zet de weergave-toggle op 'Ouder-view' om alle interne items te verbergen. Kopieer de link in de header om deze te delen op de website of in de nieuwsbrief. 
                                </p>
                            </div>
                            <div className="p-6 border-2 border-slate-100 rounded-2xl flex flex-col gap-3 bg-white">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Printer size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">A3 Jaarposter</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                    De Jaarposter-knop in de header genereert een professionele full-color PDF op A3 formaat, gesorteerd per kwartaal voor in de teamkamer.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-auto py-8 border-t-2 border-slate-900 flex justify-between items-center text-slate-300">
                    <div className="flex items-center gap-6">
                        <span className="text-slate-900 font-black text-[11px] uppercase tracking-widest">School Jaarplanner 2.0</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-900">Einde Handleiding — v2.0.4</span>
                </div>
            </div>

        </div>
    );
};
