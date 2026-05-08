
import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface OnboardingTourProps {
    isOpen: boolean;
    onComplete: () => void;
}

interface Step {
    title: string;
    content: string;
    targetId: string | null; // null = center of screen
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: Step[] = [
    {
        title: "Welkom bij de Jaarplanner Pro!",
        content: "Deze nieuwe versie is ontworpen voor schoolleiders die niet alleen plannen, maar ook sturen op kwaliteit. We laten je zien hoe je de planner gebruikt als strategisch instrument.",
        targetId: null,
        position: "center"
    },
    {
        title: "1. Basisinrichting & Regio",
        content: "Stel hier je schooljaar en regio in. De planner synchroniseert automatisch de officiële vakanties, zodat je direct weet welke weken beschikbaar zijn voor onderwijs.",
        targetId: "header-settings-btn",
        position: "bottom"
    },
    {
        title: "2. Strategische Doelen",
        content: "Koppel je jaardoelen uit het schoolplan direct aan activiteiten. Gebruik de 'Strategische Roadmap' in het Analyses menu om te zien of je doelen over het hele jaar gedekt zijn.",
        targetId: "header-analyses-dropdown",
        position: "bottom"
    },
    {
        title: "3. Inspectie & Kwaliteit",
        content: "Met de unieke Kwaliteitsmatrix zie je direct of je planning voldoet aan de inspectienormen (zoals de 4-daagse schoolweek en urennormen).",
        targetId: "header-analyses-dropdown",
        position: "bottom"
    },
    {
        title: "4. AI Audit Assistant",
        content: "Nieuw: Laat de AI Audit Assistant je planning scannen op professionele jaarcycli. De AI adviseert over de spreiding van rapportage, ouderavonden en studiedagen.",
        targetId: "header-analyses-dropdown",
        position: "bottom"
    },
    {
        title: "5. Werkdruk Management",
        content: "Voorkom overbelasting. De visuele dashboards onderin geven je direct inzicht in de drukste maanden en de balans tussen onderwijs, organisatie en team-activiteiten.",
        targetId: "summary-cards",
        position: "top"
    },
    {
        title: "6. Samenwerken in de Cloud",
        content: "Schakel over naar de Cloud-modus om met je hele MT of werkgroep tegelijk in dezelfde planning te werken. Je ziet live wie wat aanpast.",
        targetId: "user-hub-toggle",
        position: "bottom"
    },
    {
        title: "7. Heldere Communicatie",
        content: "Wissel tussen de interne 'School' versie en de publieke 'Ouder' versie. Exporteer professionele jaarposters of deel een live link voor op de website.",
        targetId: "header-view-toggles",
        position: "bottom"
    },
    {
        title: "Klaar om te bouwen!",
        content: "Je planning is nu meer dan een kalender; het is het fundament van je schoolkwaliteit. Succes met plannen!",
        targetId: null,
        position: "center"
    }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [maskRect, setMaskRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    const currentStep = steps[stepIndex];
    
    useLayoutEffect(() => {
        if (!isOpen) return;
        
        const updatePosition = () => {
            if (currentStep.targetId) {
                const element = document.getElementById(currentStep.targetId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    
                    // Check visibility
                    if (rect.width === 0 || rect.height === 0) {
                        setMaskRect(null);
                        setTooltipStyle({});
                        return;
                    }

                    // Determine if we should scroll. 
                    // Skip scrolling for sticky/fixed elements (header, palette) to prevent jitter/jumping.
                    const isStickyOrFixed = 
                        currentStep.targetId.startsWith('header-') || 
                        currentStep.targetId === 'event-palette' || 
                        currentStep.targetId === 'palette-vacation-btn';
                    
                    if (!isStickyOrFixed) {
                         // Only scroll if the element is significantly off-screen.
                         const isInViewport = rect.top >= 80 && rect.bottom <= window.innerHeight;
                         
                         if (!isInViewport) {
                            const blockPos = (rect.height > window.innerHeight * 0.6) ? 'start' : 'center';
                            element.scrollIntoView({ behavior: 'smooth', block: blockPos, inline: 'nearest' });
                         }
                    }

                    // Use Viewport Coordinates (rect) directly for Fixed Positioning
                    const padding = 8; 
                    const mask = {
                        top: rect.top - padding,
                        left: rect.left - padding,
                        width: rect.width + (padding * 2),
                        height: rect.height + (padding * 2)
                    };
                    setMaskRect(mask);
                    
                    // Tooltip Positioning
                    const gap = 16; 
                    const tooltipWidth = 340; 
                    const screenW = window.innerWidth;
                    const screenH = window.innerHeight;
                    
                    let style: React.CSSProperties = { maxWidth: `${tooltipWidth}px`, width: '100%' };
                    
                    // Initial Calculate
                    if (currentStep.position === 'right') {
                        style.left = mask.left + mask.width + gap;
                        style.top = mask.top;
                    } else if (currentStep.position === 'left') {
                        style.left = mask.left - tooltipWidth - gap;
                        style.top = mask.top;
                    } else if (currentStep.position === 'bottom') {
                        style.top = mask.top + mask.height + gap;
                        style.left = mask.left + (mask.width / 2) - (tooltipWidth / 2);
                    } else if (currentStep.position === 'top') {
                        style.bottom = (screenH - mask.top) + gap;
                        style.left = mask.left + (mask.width / 2) - (tooltipWidth / 2);
                    }

                    // Boundary Checks (Horizontal)
                    // @ts-ignore
                    let calculatedLeft = style.left as number;
                    if (calculatedLeft !== undefined) {
                        if (calculatedLeft + tooltipWidth > screenW - 20) {
                             style.left = 'auto'; 
                             style.right = 20;
                        } else if (calculatedLeft < 20) {
                            style.left = 20;
                        }
                    }
                    
                    // Boundary Checks (Vertical)
                    // @ts-ignore
                    if (style.top !== undefined && (style.top as number) < 80) {
                         style.top = 80; // Force below sticky header
                    }
                    
                    setTooltipStyle(style);
                    return;
                }
            }
            // Fallback
            setMaskRect(null);
            setTooltipStyle({});
        };

        updatePosition();
        
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        
        // Re-check after a small delay to allow for scroll animations to settle
        const timer = setTimeout(updatePosition, 300);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(timer);
        };
    }, [stepIndex, isOpen, currentStep]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
        }
    };

    const isCentered = !maskRect;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans" aria-live="polite">
            {/* Spotlight Mask - Uses Fixed Positioning based on Viewport Rect */}
            {maskRect ? (
                <div 
                    className="absolute rounded-lg transition-all duration-300 ease-out pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]"
                    style={{
                        top: maskRect.top, 
                        left: maskRect.left,
                        width: maskRect.width,
                        height: maskRect.height,
                        border: '2px solid rgba(255, 255, 255, 0.4)', 
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/75 transition-opacity duration-300" />
            )}

            {/* Tooltip - Uses Fixed Positioning */}
            <div 
                className={`fixed bg-white rounded-lg shadow-2xl p-6 flex flex-col gap-4 transition-all duration-300 border border-slate-100 ${isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4' : ''}`}
                style={!isCentered ? tooltipStyle : undefined}
            >
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-slate-800">{currentStep.title}</h3>
                        <button onClick={onComplete} className="text-slate-400 hover:text-slate-600 p-1" title="Sluiten">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{currentStep.content}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-1">
                     <button 
                        onClick={onComplete} 
                        className="text-sm font-medium text-slate-400 hover:text-slate-600 hover:underline"
                    >
                        Sla over
                    </button>
                    
                    <div className="flex gap-3 items-center">
                        <span className="text-xs font-semibold text-slate-300 mr-2">{stepIndex + 1} / {steps.length}</span>
                        {stepIndex > 0 && (
                            <button 
                                onClick={handlePrev}
                                className="px-3 py-1.5 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                            >
                                Vorige
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors"
                        >
                            {stepIndex === steps.length - 1 ? "Starten" : "Volgende"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
