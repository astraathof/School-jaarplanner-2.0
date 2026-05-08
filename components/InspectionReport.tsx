import React from 'react';
import { SchoolEvent, INSPECTION_STANDARDS, InspectionStandard, Holiday } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck, Target, Info, AlertCircle, CheckCircle2, Download, ExternalLink, ChevronRight } from 'lucide-react';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

interface InspectionReportProps {
    events: SchoolEvent[];
    onEventClick: (event: SchoolEvent) => void;
}

export const InspectionReport: React.FC<InspectionReportProps> = ({ events, onEventClick }) => {
    const [isExporting, setIsExporting] = React.useState(false);
    const activeEvents = events.filter(e => !e.deletedAt);
    
    const handleExportPdf = async () => {
        const element = document.getElementById('inspection-report-content');
        if (!element || isExporting) return;

        try {
            setIsExporting(true);
            
            // Give the browser a moment to render state changes if any
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false, 
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // 1. Sanitize all style tags and stylesheets
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    for (let i = 0; i < styleTags.length; i++) {
                        styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                    }

                    // 2. Iterate through all stylesheets (including linked ones)
                    try {
                        const sheets = clonedDoc.styleSheets;
                        for (let i = 0; i < sheets.length; i++) {
                            try {
                                const rules = sheets[i].cssRules || sheets[i].rules;
                                if (!rules) continue;
                                for (let j = 0; j < rules.length; j++) {
                                    const rule = rules[j];
                                    if (rule instanceof CSSStyleRule) {
                                        for (let k = 0; k < rule.style.length; k++) {
                                            const prop = rule.style[k];
                                            const val = rule.style.getPropertyValue(prop);
                                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
                                                rule.style.setProperty(prop, '#000000', 'important');
                                            }
                                        }
                                    }
                                }
                            } catch (e) { /* Cross-origin or empty sheet */ }
                        }
                    } catch (e) { /* Error accessing stylesheets */ }

                    // 3. Force computed styles on all elements
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach((node) => {
                        const el = node as HTMLElement;
                        
                        // Sanitize inline styles
                        if (el.style && el.style.cssText && (el.style.cssText.includes('oklch') || el.style.cssText.includes('oklab'))) {
                            el.style.cssText = el.style.cssText.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                        }

                        // Sanitize attributes
                        ['fill', 'stroke', 'color', 'background-color', 'border-color'].forEach(attr => {
                            if (el.hasAttribute(attr)) {
                                const val = el.getAttribute(attr);
                                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                                    el.setAttribute(attr, val.replace(/(oklch|oklab)\([^)]+\)/g, '#000000'));
                                }
                            }
                        });

                        // Force computed color props to safe values if they're still problematic
                        const style = window.getComputedStyle(el);
                        ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                            // @ts-ignore
                            const value = style[prop];
                            if (value && (value.includes('oklch') || value.includes('oklab') || value.includes('var('))) {
                                el.style.setProperty(prop, '#000000', 'important');
                            }
                        });

                        // Remove shadows as they often cause oklch parsing issues in html2canvas
                        if (style.boxShadow && (style.boxShadow.includes('oklch') || style.boxShadow.includes('oklab'))) {
                            el.style.setProperty('box-shadow', 'none', 'important');
                            el.style.setProperty('filter', 'none', 'important');
                        }
                    });
                }
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Get original canvas dimensions
            const canvasWidthInPt = canvas.width / 2; // account for scale 2
            const canvasHeightInPt = canvas.height / 2;
            
            // Calculate height in PDF units keeping aspect ratio
            const imgWidthOnPdf = pdfWidth;
            const imgHeightOnPdf = (canvasHeightInPt * pdfWidth) / canvasWidthInPt;
            
            let heightLeft = imgHeightOnPdf;
            let position = 0;

            // Page 1
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidthOnPdf, imgHeightOnPdf);
            heightLeft -= pdfHeight;

            // Consecutive pages if content exceeds A4 height
            while (heightLeft > 0) {
                position = heightLeft - imgHeightOnPdf;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidthOnPdf, imgHeightOnPdf);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Kwaliteitsrapportage_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Export Error Details:', error);
            alert("Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw of gebruik een andere browser.");
        } finally {
            setIsExporting(false);
        }
    };
    
    // Calculate stats for each standard with hex-color support
    const stats = INSPECTION_STANDARDS.map(standard => {
        const count = activeEvents.filter(e => 
            e.inspectionStandards?.includes(standard.code)
        ).length;

        // Map tailwind classes to hex colors for better compatibility with html2canvas (no oklch)
        let hexColors = { bg: '#eff6ff', text: '#1e40af', main: '#3b82f6' }; // Default blue
        
        if (standard.code.startsWith('OP')) hexColors = { bg: '#eff6ff', text: '#1e40af', main: '#3b82f6' };
        if (standard.code.startsWith('SK')) hexColors = { bg: '#ecfdf5', text: '#047857', main: '#10b981' };
        if (standard.code.startsWith('OR')) hexColors = { bg: '#eef2ff', text: '#3730a3', main: '#6366f1' };
        if (standard.code.startsWith('KA')) hexColors = { bg: '#f8fafc', text: '#334155', main: '#64748b' };
        
        return { 
            name: standard.title, 
            code: standard.code,
            value: count, 
            color: standard.color,
            hex: hexColors,
            description: standard.description
        };
    });

    const totalLinked = stats.reduce((acc, s) => acc + s.value, 0);
    const dataForChart = stats.filter(s => s.value > 0);

    const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

    return (
        <div id="inspection-report" className="space-y-8 pb-10">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tight">Kwaliteitsdashboard – Jaaroverzicht</h3>
                    <p className="text-sm text-[#64748b] font-medium">Strategische dekking van inspectiestandaarden over het gehele schooljaar.</p>
                </div>
                <button 
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className={`flex items-center gap-2 px-6 py-3 ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0f172a] hover:bg-[#1e293b]'} text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95`}
                >
                    <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                    {isExporting ? 'Genereren...' : 'Rapportage Opslaan als PDF'}
                </button>
            </div>

            <div id="inspection-report-content" style={{ backgroundColor: '#ffffff' }} className="space-y-8 p-8 bg-white rounded-3xl border shadow-xl">
                {/* Executive Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-6 rounded-3xl shadow-xl shadow-blue-100">
                        <ShieldCheck className="h-8 w-8 mb-4 opacity-80" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Inspectie-Gereedheid</p>
                        <p className="text-4xl font-black tracking-tighter">
                            {Math.round((dataForChart.length / INSPECTION_STANDARDS.length) * 100)}%
                        </p>
                        <p className="text-xs font-bold mt-2 opacity-80">{dataForChart.length} van de {INSPECTION_STANDARDS.length} standaarden gedekt</p>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} className="p-6 rounded-3xl border">
                        <Target className="h-8 w-8 mb-4 text-[#2563eb]" />
                        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-2">Totaal Kwaliteitsacties</p>
                        <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{totalLinked}</p>
                        <p className="text-xs font-bold mt-2 text-[#64748b]">Gekoppelde items in jaarplanning</p>
                    </div>
                    <div style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="p-6 rounded-3xl text-white">
                        <Info className="h-8 w-8 mb-4 text-emerald-400" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Focus Standaard</p>
                        <p className="text-xl font-black tracking-tight leading-tight">
                            {dataForChart.length > 0 
                                ? dataForChart.sort((a, b) => b.value - a.value)[0].name.split(':')[0]
                                : 'Geen data'}
                        </p>
                        <p className="text-xs font-bold mt-2 opacity-60">Meest voorkomende kwaliteitscomponent</p>
                    </div>
                </div>

                {/* Yearly Matrix */}
                <div className="mt-12">
                    <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-6 border-b pb-4">
                        Kwaliteits-Matrix (Focus per Standaard)
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        {stats.map((s) => (
                            <div key={s.code} className="flex items-center gap-6 p-4 rounded-2xl transition-colors group">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shadow-black/5 shrink-0"
                                    style={{ backgroundColor: s.hex.bg, color: s.hex.text }}
                                >
                                    {s.code}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-end mb-2">
                                        <h5 className="text-sm font-bold text-[#0f172a] truncate">{s.name}</h5>
                                        <span className={`text-[11px] font-black tracking-tighter ${s.value > 0 ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>
                                            {s.value}x gepland
                                        </span>
                                    </div>
                                    <div style={{ backgroundColor: '#f1f5f9' }} className="h-2 w-full rounded-full overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (s.value / 10) * 100)}%`, backgroundColor: s.hex.main }}
                                        />
                                    </div>
                                </div>
                                <div className="hidden lg:flex gap-1 shrink-0">
                                    {s.value === 0 && (
                                        <div style={{ backgroundColor: '#fffbe2', borderColor: '#fef3c7' }} className="flex items-center gap-2 px-3 py-1 rounded-lg border italic">
                                            <AlertCircle className="h-3 w-3 text-[#f59e0b]" />
                                            <span className="text-[9px] font-bold text-[#b45309] uppercase">Geen dekking</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Strategisch Advies */}
                <div style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }} className="mt-12 p-8 rounded-[2.5rem] border">
                    <div className="flex items-start gap-6">
                        <div style={{ backgroundColor: '#ffffff' }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 shrink-0">
                            <Target className="h-6 w-6 text-[#2563eb]" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight mb-2">Strategisch AI Advies</h4>
                            <div className="text-sm text-[#475569] leading-relaxed space-y-4">
                                {dataForChart.length < INSPECTION_STANDARDS.length ? (
                                    <p>Er zijn nog <strong>{INSPECTION_STANDARDS.length - dataForChart.length} standaarden</strong> die in dit schooljaar nog geen expliciete dekking hebben in de planning. Overweeg om deze te koppelen aan de komende studiedagen of teamvergaderingen.</p>
                                ) : (
                                    <p>Je planning dekt alle relevante inspectiestandaarden. De spreiding ziet er gebalanceerd uit voor het gehele jaar.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Details */}
            <details className="group">
                <summary style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }} className="flex items-center justify-between cursor-pointer p-6 rounded-2xl border list-none hover:bg-slate-200 transition-colors">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">Gedetailleerde Activiteiten Lijst (Optioneel)</span>
                    <ChevronRight className="h-5 w-5 text-[#94a3b8] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="p-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {activeEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeEvents.filter(e => e.inspectionStandards && e.inspectionStandards.length > 0).map(e => (
                                <div key={e.id} style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} className="p-4 rounded-xl border shadow-sm flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-1">
                                        {e.inspectionStandards?.map(code => (
                                            <span key={code} style={{ backgroundColor: '#dbeafe', color: '#2563eb' }} className="text-[8px] font-black px-1.5 py-0.5 rounded">{code}</span>
                                        ))}
                                    </div>
                                    <h6 className="font-bold text-xs truncate">{e.title}</h6>
                                    <span className="text-[10px] text-[#94a3b8]">{new Date(e.date).toLocaleDateString('nl-NL')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-10 text-[#94a3b8] text-sm italic">Nog geen activiteiten met standaarden gekoppeld.</p>
                    )}
                </div>
            </details>
        </div>
    );
};
