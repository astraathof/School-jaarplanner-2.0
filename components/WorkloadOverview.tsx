import React from 'react';
import { SchoolEvent, EventTypeConfig, SchoolSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Calendar as CalendarIcon, Info } from 'lucide-react';

interface WorkloadOverviewProps {
    events: SchoolEvent[];
    settings: SchoolSettings;
}

const WEEKDAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
const WEEKDAY_MAP: Record<number, string> = {
    1: 'Maandag',
    2: 'Dinsdag',
    3: 'Woensdag',
    4: 'Donderdag',
    5: 'Vrijdag',
    6: 'Zaterdag',
    0: 'Zondag'
};

export const WorkloadOverview: React.FC<WorkloadOverviewProps> = ({ events, settings }) => {
    // Filter for study days (usually "Studiedag" or similar)
    const studyDayType = settings.eventTypes.find(t => t.name.toLowerCase().includes('studie'))?.name || 'Studiedag';
    const studyDays = events.filter(e => e.type === studyDayType && !e.deletedAt);

    // Calculate distribution by weekday
    const distribution = WEEKDAYS.map(day => {
        const count = studyDays.filter(e => {
            const date = new Date(e.date);
            return WEEKDAY_MAP[date.getDay()] === day;
        }).length;
        return { day, count };
    });

    const totalStudyDays = studyDays.length;
    const maxOnOneDay = Math.max(...distribution.map(d => d.count));
    const problematicDay = distribution.find(d => d.count === maxOnOneDay && d.count > totalStudyDays / 3);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Verdeling Studiedagen</h3>
                        <p className="text-sm text-slate-500">Zorg voor een evenwichtige spreiding over de weekdagen.</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Totaal: {totalStudyDays}</span>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                {distribution.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.count > totalStudyDays / 3 ? '#f43f5e' : '#3b82f6'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {problematicDay && problematicDay.count > 1 && (
                    <div className="mt-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-rose-800">Onevenwichtige verdeling!</p>
                            <p className="text-xs text-rose-600 mt-1">
                                Er zijn relatief veel studiedagen op de <span className="font-bold">{problematicDay.day.toLowerCase()}</span> gepland ({problematicDay.count} van de {totalStudyDays}). 
                                Overweeg om een studiedag te verplaatsen naar een andere dag om de werkdruk voor parttimers die op {problematicDay.day.toLowerCase()} werken te ontlasten.
                            </p>
                        </div>
                    </div>
                )}

                {!problematicDay && totalStudyDays > 0 && (
                    <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Info className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Goede spreiding</p>
                            <p className="text-xs text-emerald-600 mt-1">
                                De studiedagen zijn goed verdeeld over de verschillende werkdagen van de week.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        Advies voor Planning
                    </h4>
                    <ul className="space-y-3">
                        <li className="text-xs text-slate-600 flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            Plan studiedagen bij voorkeur op verschillende dagen om parttimers gelijkmatig te belasten.
                        </li>
                        <li className="text-xs text-slate-600 flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            Combineer studiedagen met vakanties (bijv. de maandag na een vakantie) voor een rustige start.
                        </li>
                        <li className="text-xs text-slate-600 flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                            Houd rekening met de landelijke vakantiespreiding in regio {settings.region}.
                        </li>
                    </ul>
                </div>
                
                <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-400" />
                        Wist je dat?
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Een evenwichtige verdeling van studiedagen over de weekdagen (ma-vr) zorgt voor een hogere betrokkenheid van het hele team. 
                        Wanneer studiedagen vaak op dezelfde dag vallen, missen bepaalde parttimers structureel de gezamenlijke professionalisering.
                    </p>
                </div>
            </div>
        </div>
    );
};
