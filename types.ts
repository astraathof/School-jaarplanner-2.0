
export type ViewMode = 'school' | 'parent';
export type VacationRegion = 'Noord' | 'Midden' | 'Zuid';
export type SchoolType = 'PO' | 'VO';

export type EventTypeString = string;

export interface EventTypeConfig {
    name: EventTypeString;
    isDefault?: boolean;
    color?: string; // Base hex color for modern themes
    colors?: {
        bg: string;
        text: string;
        border: string;
    };
}

export type InspectionStandard = 
    | 'OP0' | 'OP1' | 'OP2' | 'OP3' | 'OP4' | 'OP6' 
    | 'SK1' | 'SK2' 
    | 'OR1' | 'OR2' 
    | 'KA1' | 'KA2' | 'KA3';

export interface InspectionStandardConfig {
    code: InspectionStandard;
    title: string;
    description: string;
    color: string;
}

export const INSPECTION_STANDARDS: InspectionStandardConfig[] = [
    // 1. Onderwijsproces (OP)
    { code: 'OP0', title: 'Basisvaardigheden', description: 'Taal, rekenen, burgerschap.', color: 'bg-blue-100 text-blue-700' },
    { code: 'OP1', title: 'Zicht op ontwikkeling', description: 'Zicht op ontwikkeling en begeleiding.', color: 'bg-blue-100 text-blue-700' },
    { code: 'OP2', title: 'Pedagogisch-didactisch', description: 'Pedagogisch-didactisch handelen.', color: 'bg-blue-100 text-blue-700' },
    { code: 'OP3', title: 'Afstemming', description: 'Afstemming (differentiatie).', color: 'bg-blue-100 text-blue-700' },
    { code: 'OP4', title: 'Onderwijstijd', description: 'Effectieve onderwijstijd.', color: 'bg-blue-100 text-blue-700' },
    { code: 'OP6', title: 'Afsluiting', description: 'Overgangen en doorstroom.', color: 'bg-blue-100 text-blue-700' },
    
    // 2. Schoolklimaat (SK)
    { code: 'SK1', title: 'Veiligheid', description: 'Sociale en fysieke veiligheid.', color: 'bg-emerald-100 text-emerald-700' },
    { code: 'SK2', title: 'Pedagogisch klimaat', description: 'Sfeer en omgangsvormen.', color: 'bg-emerald-100 text-emerald-700' },
    
    // 3. Onderwijsresultaten (OR)
    { code: 'OR1', title: 'Resultaten', description: 'Behaalde resultaten van leerlingen.', color: 'bg-indigo-100 text-indigo-700' },
    { code: 'OR2', title: 'Sociale competenties', description: 'Maatschappelijke competenties.', color: 'bg-indigo-100 text-indigo-700' },
    
    // 4. Kwaliteitszorg en ambitie (KA)
    { code: 'KA1', title: 'Kwaliteitszorg', description: 'Systematische kwaliteitszorg.', color: 'bg-slate-100 text-slate-700' },
    { code: 'KA2', title: 'Kwaliteitscultuur', description: 'Professionele cultuur en dialoog.', color: 'bg-slate-100 text-slate-700' },
    { code: 'KA3', title: 'Verantwoording', description: 'Verantwoording en dialoog.', color: 'bg-slate-100 text-slate-700' },
];

export interface SchoolGoal {
    id: number;
    title: string;
    description: string;
    icon?: string; // Lucide icon name
    inspectionStandard?: InspectionStandard;
}

export interface SubAgendaItem {
    id: number;
    time: string;
    activity: string;
    speaker?: string;
    location?: string;
    theme?: string;
}

export interface PresetTemplate {
    title: string;
    description: string;
    type: EventTypeString;
    color: string;
}

export interface EventPreset {
    id: string;
    icon: string;
    template: PresetTemplate;
}

export interface SchoolEvent {
    id?: number;
    title: string;
    type: EventTypeString;
    date: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD for multi-day events
    theme?: string;
    location?: string;
    program?: string;
    subAgenda?: SubAgendaItem[];
    isPublic: boolean;
    isIncomplete?: boolean;
    durationMultiplier?: number; // 1 = full day, 0.5 = half day
    color?: string; // Optional custom color for this specific event
    recurrence?: {
        frequency: 'none' | 'weekly' | 'monthly';
        endDate: string; // YYYY-MM-DD
    };
    goalIds?: number[];
    inspectionStandards?: InspectionStandard[];
    deletedAt?: string; // ISO string when event was "deleted"
}

export interface Holiday {
    id: string; // Mandatory ID for tracking
    name: string;
    date: string; // YYYY-MM-DD
    endDate?: string;
    type: 'vakantie' | 'feestdag';
    isOfficial?: boolean; // Determines if this holiday excuses a 4-day week
}

export interface DailySchedule {
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    breakMinutes: number;
    teachingMinutes: number;
}

export interface SchoolSettings {
    schoolName: string;
    timetables: {
        ma: DailySchedule;
        di: DailySchedule;
        wo: DailySchedule;
        do: DailySchedule;
        vr: DailySchedule;
    };
    schoolYear: string; // e.g., '2024-2025'
    region: VacationRegion;
    schoolType: SchoolType;
    isSetupComplete: boolean;
    eventTypes: EventTypeConfig[];
    goals: SchoolGoal[];
    themes: string[];
    schoolLogoUrl?: string;
    missionVision?: string;
    holidayOverrides: Holiday[]; // New field to store customized holidays
    studyDayCount?: number; // Number of study days to plan
}

export interface Filter {
    eventTypes: EventTypeString[];
    theme: string;
}

export interface ValidationWarning {
    id: string;
    type: 'incomplete' | 'conflict' | 'norm';
    message: string;
    eventId?: number;
}

export interface ShortenedWeekDetail {
    weekId: string;
    startDate: string;
    teachingDays: number;
    reasons: {
        date: string;
        type: string;
        title: string;
        isHoliday: boolean;
    }[];
}

export interface TodoItem {
    id: number;
    text: string;
    completed: boolean;
}

export interface EventTemplate {
    id: string;
    name: string;
    type: EventTypeString;
    program?: string;
    subAgenda?: Omit<SubAgendaItem, 'id'>[];
    durationMultiplier?: number;
    goalIds?: number[];
    inspectionStandards?: InspectionStandard[];
}

export type SettingsModalSection = 'general' | 'eventTypes' | 'goals' | 'timetables';

export interface AcademicYear {
    startYear: number;
    endYear: number;
}
