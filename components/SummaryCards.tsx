
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import type { SchoolEvent, Holiday, SchoolSettings, SettingsModalSection, EventTypeString } from '../types';
import { INSPECTION_STANDARDS } from '../types';
import { PO_HOURS_NORM, VO_DAYS_NORM } from '../constants';

interface SummaryCardsProps {
    id?: string;
    events: SchoolEvent[];
    holidays: Holiday[];
    settings: SchoolSettings;
    academicYear: { start: Date; end: Date };
    validations: {
        fourDayWeek: { count: number; limit: number; isExceeded: boolean };
        teachingNorm: { isBelowNorm: boolean; norm: number; unit: string };
    };
    selectedGoalId: number | null;
    onAddGoalClick: () => void;
    onShowSettings: (section: SettingsModalSection) => void;
    onShowOverview: (type: EventTypeString) => void;
    onMonthClick: (date: Date) => void;
    onGoalClick: (goalId: number | null) => void;
    onGoToDate?: (date: Date) => void;
    onShowHealthCheck: () => void;
    onShowShortenedWeeks: () => void;
}

const SummaryCard: React.FC<{ 
    title: string; 
    value?: string; 
    subtext?: string; 
    children: React.ReactNode; 
    icon?: React.ReactNode; 
    statusColor?: string; 
    isDimmed?: boolean; 
    className?: string;
    onClick?: () => void;
    isActive?: boolean;
    style?: React.CSSProperties;
}> = ({ title, value, subtext, children, icon, statusColor = 'bg-[var(--bg-card)]', isDimmed, className = '', onClick, isActive, style }) => (
    <div 
        onClick={onClick}
        style={style}
        className={`${statusColor} p-4 rounded-xl shadow-sm flex flex-col ${isDimmed ? 'opacity-40' : ''} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300' : ''} ${isActive ? 'ring-2 ring-blue-500/20 border-blue-500' : 'border border-[var(--border-main)]'} ${className}`}
    >
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] font-sans">{title}</h3>
            <div className="p-1.5 bg-[var(--bg-card)]/60 backdrop-blur-sm rounded-lg text-[var(--text-muted)] shadow-sm border border-[var(--border-main)]">
                {icon}
            </div>
        </div>
        {value && (
            <div className="mb-3">
                <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter font-sans leading-none">{value}</p>
                {subtext && <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1.5 opacity-40">{subtext}</p>}
            </div>
        )}
        <div className="flex-grow flex flex-col">{children}</div>
    </div>
);

const DynamicIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Target;
  return <IconComponent className={className || "h-4 w-4"} />;
};

const CheckCircleIcon: React.FC<{ className: string }> = ({ className }) => (
    <LucideIcons.CheckCircle2 className={className} />
);

const ExclamationCircleIcon: React.FC<{ className: string }> = ({ className }) => (
    <LucideIcons.AlertCircle className={className} />
);

export const SummaryCards: React.FC<SummaryCardsProps> = ({ id, events, holidays, settings, academicYear, validations, selectedGoalId, onAddGoalClick, onShowSettings, onShowOverview, onMonthClick, onGoalClick, onGoToDate, onShowHealthCheck, onShowShortenedWeeks }) => {
    const summary = useMemo(() => {
        // Filter events to current academic year
        const yearEvents = events.filter(e => {
            const d = new Date(e.date);
            return d >= academicYear.start && d <= academicYear.end;
        });

        const eventsByDate = new Map<string, SchoolEvent[]>();
        yearEvents.forEach(e => {
            const date = e.date;
            if (!eventsByDate.has(date)) {
                eventsByDate.set(date, []);
            }
            eventsByDate.get(date)?.push(e);
        });

        const holidaySet = new Set<string>();
        holidays.forEach(h => {
             let currentDate = new Date(h.date + 'T00:00:00Z');
             const endDate = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : new Date(currentDate);
             while (currentDate <= endDate) {
                  holidaySet.add(currentDate.toISOString().split('T')[0]);
                  currentDate.setUTCDate(currentDate.getUTCDate() + 1);
             }
        });

        let teachingDays = 0;
        let totalTeachingMinutes = 0;
        const dayMapping = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        
        let currentDate = new Date(academicYear.start);
        const endDate = new Date(academicYear.end);
        endDate.setUTCDate(endDate.getUTCDate() - 1);

        while(currentDate <= endDate) {
            const dayOfWeek = currentDate.getUTCDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
                const dateStr = currentDate.toISOString().split('T')[0];
                
                if (!holidaySet.has(dateStr)) {
                    const daysEvents = eventsByDate.get(dateStr) || [];
                    let dayTeachingFactor = 1.0;
                    for (const event of daysEvents) {
                        if (event.type === 'Studiedag' || event.type === 'Lesvrije dag' || event.type === 'Vrije dag') {
                            const factor = event.durationMultiplier !== undefined ? event.durationMultiplier : 1;
                            dayTeachingFactor -= factor;
                        }
                    }
                    if (dayTeachingFactor < 0) dayTeachingFactor = 0;
                    if (dayTeachingFactor > 0) {
                        teachingDays += 1;
                    }
                    const dayKey = dayMapping[dayOfWeek] as keyof typeof settings.timetables;
                    const minutesForDay = settings.timetables[dayKey]?.teachingMinutes || 0;
                    totalTeachingMinutes += (minutesForDay * dayTeachingFactor);
                }
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        const totalTeachingHours = Math.round(totalTeachingMinutes / 60);
        const studyDays = yearEvents.filter(e => e.type === 'Studiedag');
        studyDays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const goalCoverage = settings.goals.map(goal => {
            const linkedEvents = yearEvents.filter(event => event.goalIds?.includes(goal.id));
            return { ...goal, count: linkedEvents.length };
        });

        const coveredGoalsCount = goalCoverage.filter(g => g.count > 0).length;
        const totalGoalsCount = settings.goals.length;
        
        const coveredStandardsCount = settings.eventTypes.length > 0 ? 
            INSPECTION_STANDARDS.filter(std => 
                yearEvents.some(e => e.inspectionStandards?.includes(std.code))
            ).length : 0;
        
        // Quality Score calculation:
        // 40% Goals Coverage
        // 30% Inspection Standards Coverage
        // 20% Event Completeness (programs defined)
        // 10% Workload Balance (if no weeks with >5 events)
        
        const goalsScore = totalGoalsCount > 0 ? (coveredGoalsCount / totalGoalsCount) * 100 : 0;
        const standardsScore = (coveredStandardsCount / INSPECTION_STANDARDS.length) * 100;
        
        const completedEvents = yearEvents.length > 0 ? 
            yearEvents.filter(e => e.program && e.program.length > 10).length : 0;
        const completenessScore = yearEvents.length > 0 ? (completedEvents / yearEvents.length) * 100 : 0;
        
        // Workload balance
        const eventsPerWeek: { [week: string]: number } = {};
        yearEvents.forEach(e => {
            const date = new Date(e.date);
            const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
            eventsPerWeek[week] = (eventsPerWeek[week] || 0) + 1;
        });
        const peakWeeksCount = Object.values(eventsPerWeek).filter(count => count > 5).length;
        const balanceScore = yearEvents.length > 0 ? Math.max(0, 100 - (peakWeeksCount * 20)) : 100;

        const qualityScore = Math.round(
            (goalsScore * 0.4) + 
            (standardsScore * 0.3) + 
            (completenessScore * 0.2) + 
            (yearEvents.length > 0 ? balanceScore * 0.1 : 0)
        );

        // Reliability Score (Betrouwbaarheid)
        // Focuses on feasibility and level of detail
        const reliabilityScore = Math.round(
            (completenessScore * 0.5) + // Do we have details for events?
            (balanceScore * 0.3) +      // Is the workload spread out?
            (yearEvents.length > 0 ? 20 : 0) // Bonus for having a plan at all
        );

        const typeCounts = new Map<string, number>();
        yearEvents.forEach(e => {
            typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
        });

        // Strategic Balance Calculation
        const strategicGroups = {
            'Onderwijs': ['Studiedag', 'Toets', 'Rapportage', 'Examen', 'Projectweek', 'Ouderavond'],
            'Team': ['Teamuitje', 'Borrel', 'Viering', 'Personeelsvergadering'],
            'Organisatie': ['Vergadering', 'Logistiek', 'Inschrijving', 'Open dag']
        };

        const balanceData = Object.entries(strategicGroups).map(([group, types]) => {
            const count = yearEvents.filter(e => types.includes(e.type)).length;
            return { name: group, value: count };
        });

        // Monthly Workload Heatmap
        const monthList: Date[] = [];
        let m = new Date(academicYear.start);
        while (m < academicYear.end) {
            monthList.push(new Date(m));
            m.setUTCMonth(m.getUTCMonth() + 1);
        }

        const monthlyWorkload = monthList.map(m => {
            const count = yearEvents.filter(e => {
                const d = new Date(e.date);
                return d.getUTCFullYear() === m.getUTCFullYear() && d.getUTCMonth() === m.getUTCMonth();
            }).length;
            return { month: m.toLocaleString('nl-NL', { month: 'short' }), count };
        });
        
        const focusData = Array.from(typeCounts.entries()).map(([name, value]) => {
            const typeConfig = settings.eventTypes.find(t => t.name === name);
            let color = '#94a3b8'; // Default slate
            if (typeConfig?.color) {
                color = typeConfig.color;
            } else if (typeConfig?.colors?.bg) {
                // Map common tailwind bg classes to hex for the chart
                const colorMap: Record<string, string> = {
                    'bg-orange-200': '#fed7aa', 'bg-teal-200': '#99f6e4', 'bg-cyan-200': '#a5f3fc',
                    'bg-sky-200': '#bae6fd', 'bg-blue-200': '#bfdbfe', 'bg-indigo-200': '#c7d2fe',
                    'bg-green-200': '#bbf7d0', 'bg-rose-200': '#fecdd3', 'bg-red-200': '#fecaca'
                };
                color = colorMap[typeConfig.colors.bg] || color;
            }
            return { name, value, color };
        });

        return {
            teachingDays,
            totalTeachingHours,
            studyDays,
            goalCoverage,
            qualityScore,
            reliabilityScore,
            focusData,
            balanceData,
            monthlyWorkload
        };
    }, [events, holidays, settings, academicYear]);

    const isVO = settings.schoolType === 'VO';
    const { fourDayWeek, teachingNorm } = validations;
    const teachingDaysMet = !isVO || !teachingNorm.isBelowNorm;
    const teachingHoursMet = isVO || !teachingNorm.isBelowNorm;

    const upcomingStudyDays = useMemo(() => {
        const today = new Date();
        return summary.studyDays
            .filter(d => new Date(d.date) >= today)
            .slice(0, 3);
    }, [summary.studyDays]);

    const studyDayType = settings.eventTypes.find(t => t.name === 'Studiedag');
    const studyDayColor = studyDayType?.color || '#6366f1'; // Default indigo-500

    return (
        <div className="space-y-6">
            <div id={id} style={{ scrollMarginTop: '100px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 auto-rows-fr">
                 <SummaryCard 
                    title="Kwaliteit" 
                    value={`${summary.qualityScore}%`}
                    subtext="Dekkingsgraad schoolplan"
                    statusColor={summary.qualityScore < 50 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : summary.qualityScore < 80 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}
                    icon={<LucideIcons.ShieldCheck className={`h-5 w-5 ${summary.qualityScore < 50 ? 'text-rose-500' : summary.qualityScore < 80 ? 'text-amber-500' : 'text-emerald-500'}`} />}
                    onClick={onShowHealthCheck}
                    className="lg:col-span-2 xl:col-span-1"
                >
                    <div className="mt-6 h-3 w-full bg-[var(--bg-sidebar)] rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${summary.qualityScore}%` }}
                            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                            className={`h-full rounded-full shadow-sm ${summary.qualityScore < 50 ? 'bg-rose-500' : summary.qualityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        ></motion.div>
                    </div>
                </SummaryCard>

                 <SummaryCard 
                    title="Betrouwbaarheid" 
                    value={`${summary.reliabilityScore}%`}
                    subtext="Haalbaarheid & Detail"
                    statusColor={summary.reliabilityScore < 50 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : summary.reliabilityScore < 80 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800'}
                    icon={<LucideIcons.ShieldAlert className={`h-5 w-5 ${summary.reliabilityScore < 50 ? 'text-rose-500' : summary.reliabilityScore < 80 ? 'text-blue-500' : 'text-indigo-500'}`} />}
                    className="lg:col-span-2 xl:col-span-1"
                >
                    <div className="mt-6 h-3 w-full bg-[var(--bg-sidebar)] rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${summary.reliabilityScore}%` }}
                            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                            className={`h-full rounded-full shadow-sm ${summary.reliabilityScore < 50 ? 'bg-rose-500' : summary.reliabilityScore < 80 ? 'bg-blue-500' : 'bg-indigo-500'}`}
                        ></motion.div>
                    </div>
                </SummaryCard>

                 <SummaryCard 
                    title="Lesdagen" 
                    value={summary.teachingDays.toString()}
                    subtext={`Norm VO: ${VO_DAYS_NORM} dagen`}
                    statusColor={!isVO ? 'bg-[var(--bg-card)]' : teachingDaysMet ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'}
                    icon={!isVO ? <LucideIcons.Info className="text-[var(--text-muted)]" /> : teachingDaysMet ? <CheckCircleIcon className="text-emerald-500"/> : <ExclamationCircleIcon className="text-rose-500" />}
                    isDimmed={!isVO}
                    onClick={() => onShowSettings('timetables')}
                >
                    <div className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${!isVO ? 'text-[var(--text-muted)]' : teachingDaysMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                         {isVO && (teachingDaysMet ? `Status: OK` : `Status: TE LAAG`)}
                         {!isVO && 'Alleen voor VO'}
                     </div>
                </SummaryCard>

                   <SummaryCard 
                    title="Lesuren" 
                    value={summary.totalTeachingHours.toLocaleString('nl-NL')}
                    subtext={`Norm PO: ${PO_HOURS_NORM} uur`}
                    statusColor={isVO ? 'bg-[var(--bg-card)]' : teachingHoursMet ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800'}
                    icon={isVO ? <LucideIcons.Info className="text-[var(--text-muted)]" /> : teachingHoursMet ? <CheckCircleIcon className="text-emerald-500"/> : <ExclamationCircleIcon className="text-rose-500" />}
                    isDimmed={isVO}
                    onClick={() => onShowSettings('timetables')}
                >
                     <div className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${isVO ? 'text-[var(--text-muted)]' : teachingHoursMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isVO && 'Alleen voor PO'}
                        {!isVO && (teachingHoursMet ? 'Status: OK' : 'Status: TE LAAG')}
                     </div>
                </SummaryCard>

                <SummaryCard
                    title="Ingekorte Weken"
                    value={`${fourDayWeek.count} / ${fourDayWeek.limit}`}
                    subtext="Weken van 4 of minder dagen"
                    statusColor={fourDayWeek.isExceeded ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'}
                    icon={fourDayWeek.isExceeded ? <ExclamationCircleIcon className="text-rose-500" /> : <CheckCircleIcon className="text-emerald-500" />}
                    onClick={onShowShortenedWeeks}
                >
                    <div className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${fourDayWeek.isExceeded ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {fourDayWeek.isExceeded ? `Limiet bereikt` : `Binnen norm (max. ${fourDayWeek.limit})`}
                    </div>
                </SummaryCard>

                <SummaryCard 
                    title="Studiedagen"
                    value={summary.studyDays.length.toString()}
                    subtext="Totaal dit jaar"
                    icon={<LucideIcons.BookOpen className="h-4 w-4" style={{ color: studyDayColor }} />}
                    onClick={() => onShowOverview('Studiedag')}
                    statusColor="bg-[var(--bg-card)]"
                    style={{ 
                        backgroundColor: `${studyDayColor}10`,
                        borderColor: `${studyDayColor}40`
                    }}
                >
                    <div className="mt-3 space-y-2">
                        {upcomingStudyDays.length > 0 ? (
                            upcomingStudyDays.map(day => (
                                <button 
                                    key={day.id}
                                    onClick={(e) => { e.stopPropagation(); onGoToDate?.(new Date(day.date)); }}
                                    className="w-full flex items-center justify-between group/day"
                                >
                                    <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-tight group-hover/day:text-indigo-600 transition-colors">
                                        {new Date(day.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[9px] font-bold text-[var(--text-muted)] truncate max-w-[80px] group-hover/day:text-indigo-500 transition-colors">
                                        {day.title}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="text-[9px] text-[var(--text-muted)] italic">Geen gepland</p>
                        )}
                    </div>
                </SummaryCard>

                <SummaryCard 
                    title="Schoolplan Doelen"
                    icon={<LucideIcons.Target className="h-4 w-4 text-[var(--text-muted)]" />}
                    statusColor={summary.goalCoverage.some(g => g.count === 0) ? 'bg-amber-50/30 dark:bg-amber-900/10' : 'bg-[var(--bg-card)]'}
                    className="lg:col-span-2 xl:col-span-2"
                >
                    <div className="flex-grow">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {summary.goalCoverage.map(goal => (
                                <motion.button 
                                    key={goal.id} 
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => { e.stopPropagation(); onGoalClick(selectedGoalId === goal.id ? null : goal.id); }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black transition-all border shadow-sm ${selectedGoalId === goal.id ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-700 shadow-lg shadow-slate-200 dark:shadow-none' : goal.count > 0 ? 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] hover:border-blue-200 hover:shadow-md' : 'bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800 hover:border-amber-300'}`}
                                >
                                    <DynamicIcon name={goal.icon || 'Target'} className={`h-3 w-3 ${selectedGoalId === goal.id ? 'text-blue-400' : goal.count > 0 ? 'text-blue-500' : 'text-amber-500'}`} />
                                    <span className="truncate max-w-[80px] uppercase tracking-tight">{goal.title}</span>
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-lg font-mono text-[10px] ${selectedGoalId === goal.id ? 'bg-white/20' : goal.count > 0 ? 'bg-slate-100 dark:bg-slate-700 text-[var(--text-main)]' : 'bg-amber-100 dark:bg-amber-800 text-amber-900 dark:text-amber-200'}`}>
                                        {goal.count}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex justify-between items-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddGoalClick(); }} 
                            className="text-[9px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-[0.15em] flex items-center gap-1.5 group"
                        >
                            <span className="p-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-md group-hover:bg-blue-100 transition-colors">+</span>
                            Doel Toevoegen
                        </button>
                        {selectedGoalId !== null && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onGoalClick(null); }} 
                                className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-black uppercase tracking-[0.15em]"
                            >
                                Filter Wissen
                            </button>
                        )}
                    </div>
                </SummaryCard>

                <SummaryCard 
                    title="Focus Analyse"
                    icon={<LucideIcons.PieChart className="h-4 w-4 text-[var(--text-muted)]" />}
                    className="lg:col-span-2 xl:col-span-2"
                >
                    <div className="flex items-center gap-6 mt-1 flex-grow">
                        <div className="h-32 w-32 flex-shrink-0 relative">
                            {summary.focusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={summary.focusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={55}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            onClick={(data) => onShowOverview(data.name as EventTypeString)}
                                            className="cursor-pointer"
                                            isAnimationActive={true}
                                        >
                                            {summary.focusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-500 hover:opacity-80" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '9px', borderRadius: '12px', border: '1px solid var(--border-main)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-[var(--border-main)] rounded-full">
                                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Geen data</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5 flex-grow pr-2">
                            {summary.focusData.length > 0 ? (
                                summary.focusData.slice(0, 5).map((entry, index) => (
                                    <div 
                                        key={entry.name} 
                                        className="flex items-center justify-between group cursor-pointer py-0.5 border-b border-[var(--border-main)] last:border-0"
                                        onClick={() => onShowOverview(entry.name as EventTypeString)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-[9px] text-[var(--text-muted)] font-black group-hover:text-blue-600 transition-colors uppercase tracking-wider">{entry.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-[var(--text-main)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded-md">{entry.value}</span>
                                    </div>
                                ))
                            ) : (
                                [1,2,3].map(i => (
                                    <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
                                ))
                            )}
                        </div>
                    </div>
                </SummaryCard>
            </div>

            {/* Strategic Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategische Balans</h3>
                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Spreiding over kerngebieden</p>
                        </div>
                        <LucideIcons.BarChart3 className="w-5 h-5 text-blue-500 opacity-20" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {summary.balanceData.map((item) => {
                            const colors = {
                                'Onderwijs': 'bg-blue-600',
                                'Team': 'bg-emerald-500',
                                'Organisatie': 'bg-amber-500'
                            };
                            return (
                                <div key={item.name} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{item.name}</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{item.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${(colors as any)[item.name] || 'bg-slate-400'}`}
                                            style={{ width: `${Math.min(100, (item.value / events.length) * 300)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Piekbelasting Dashboard</h3>
                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Verwachte drukte per maand</p>
                        </div>
                        <LucideIcons.Activity className="w-5 h-5 text-rose-500 opacity-20" />
                    </div>
                    <div className="flex items-end justify-between gap-1 h-14">
                        {summary.monthlyWorkload.map((m, idx) => {
                            const maxVal = Math.max(...summary.monthlyWorkload.map(mw => mw.count), 1);
                            const height = (m.count / maxVal) * 100;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {m.count} items
                                    </div>
                                    <div 
                                        className={`w-full rounded-t-sm transition-all duration-300 ${m.count > maxVal * 0.8 ? 'bg-rose-500' : m.count > maxVal * 0.4 ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                    />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
