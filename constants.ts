
import { SchoolEvent, SchoolSettings, EventTypeConfig, Holiday, VacationRegion, SchoolType } from './types';

export const STORAGE_KEY = 'school_planner_v1_data';

export const initialEventTypes: EventTypeConfig[] = [
    { name: 'Studiedag', isDefault: true, colors: { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400' } },
    { name: 'Teamoverleg', isDefault: true, colors: { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400' } },
    { name: 'Onderbouwoverleg', isDefault: true, colors: { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'border-cyan-400' } },
    { name: 'Middenbouwoverleg', isDefault: true, colors: { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-400' } },
    { name: 'Bovenbouwoverleg', isDefault: true, colors: { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400' } },
    { name: 'Activiteit', isDefault: true, colors: { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-400' } },
    { name: 'Lesvrije dag', isDefault: true, colors: { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400' } },
];

const getCurrentSchoolYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Jan, 7 = Aug
    
    // If we are in Jan-July (0-6), we are in the second half of the year starting the previous year
    // If we are in Aug-Dec (7-11), we are in the first half of the year starting this year
    if (currentMonth < 7) {
        return `${currentYear - 1}-${currentYear}`;
    } else {
        return `${currentYear}-${currentYear + 1}`;
    }
};

export const initialSettings: SchoolSettings = {
    schoolName: "De Vlinderboom",
    timetables: {
        ma: { startTime: '08:30', endTime: '15:00', breakMinutes: 60, teachingMinutes: 330 },
        di: { startTime: '08:30', endTime: '15:00', breakMinutes: 60, teachingMinutes: 330 },
        wo: { startTime: '08:30', endTime: '12:30', breakMinutes: 15, teachingMinutes: 225 },
        do: { startTime: '08:30', endTime: '15:00', breakMinutes: 60, teachingMinutes: 330 },
        vr: { startTime: '08:30', endTime: '15:00', breakMinutes: 60, teachingMinutes: 330 },
    },
    schoolYear: getCurrentSchoolYear(),
    region: 'Midden',
    schoolType: 'PO',
    isSetupComplete: false,
    eventTypes: initialEventTypes,
    goals: [
        { id: 101, title: 'Taal', description: 'Ontwikkeling van taalvaardigheid en geletterdheid.', icon: 'Languages' },
        { id: 102, title: 'Rekenen', description: 'Ontwikkeling van rekenvaardigheid en wiskundig inzicht.', icon: 'Calculator' },
        { id: 103, title: 'Burgerschap', description: 'Actief burgerschap en sociale integratie.', icon: 'Users' },
        { id: 104, title: 'Digitale Geletterdheid', description: 'Vaardigheden voor de digitale wereld.', icon: 'Monitor' }
    ],
    themes: ['Onderbouw', 'Digitale geletterdheid'],
    schoolLogoUrl: '',
    missionVision: 'Onze missie is om elk kind een stevige basis te bieden voor de toekomst, waarbij we focussen op zowel academische vaardigheden als persoonlijke groei in een veilige en stimulerende omgeving.',
    holidayOverrides: [],
};

export const initialEvents: SchoolEvent[] = [
    {
        id: 1,
        title: "Studiedag Onderwijsinnovatie",
        type: "Studiedag",
        date: "2024-10-28",
        theme: "Digitale geletterdheid",
        program: "Ochtend: Workshop over AI in de klas. Middag: Implementatieplan maken.",
        isPublic: true,
        goalIds: [104]
    },
    { id: 2, title: "Teamoverleg", type: "Teamoverleg", date: "2024-11-12", theme: "Onderbouw", program: "Agenda: 1. Voortgang leerlingen. 2. Kerstviering voorbereiden.", isPublic: false },
    { id: 3, title: "Sinterklaasviering", type: "Activiteit", date: "2024-12-05", isPublic: true },
    { id: 4, title: "Extra lesvrije dag", type: "Lesvrije dag", date: "2025-03-10", isPublic: true },
];

export const PO_HOURS_NORM = 940;
export const VO_DAYS_NORM = 189;

// --- Dynamic Holiday Calculation ---
export const vacationData = {
    '2023-2024': {
        Zomervakantie: { Noord: '2024-07-22/2024-09-01', Midden: '2024-07-15/2024-08-25', Zuid: '2024-07-08/2024-08-18' },
    },
    '2024-2025': {
        Herfstvakantie: { Noord: '2024-10-28/2024-11-03', Midden: '2024-10-28/2024-11-03', Zuid: '2024-10-21/2024-10-27' },
        Kerstvakantie: { Noord: '2024-12-23/2025-01-05', Midden: '2024-12-23/2025-01-05', Zuid: '2024-12-23/2025-01-05' },
        Voorjaarsvakantie: { Noord: '2025-02-17/2025-02-23', Midden: '2025-02-24/2025-03-02', Zuid: '2025-02-24/2025-03-02' },
        Meivakantie: { Noord: '2025-04-26/2025-05-04', Midden: '2025-04-26/2025-05-04', Zuid: '2025-04-26/2025-05-04' },
        Zomervakantie: { Noord: '2025-07-14/2025-08-24', Midden: '2025-07-21/2025-08-31', Zuid: '2025-07-07/2025-08-17' },
    },
    '2025-2026': {
        Herfstvakantie: { Noord: '2025-10-20/2025-10-26', Midden: '2025-10-13/2025-10-19', Zuid: '2025-10-13/2025-10-19' },
        Kerstvakantie: { Noord: '2025-12-22/2026-01-04', Midden: '2025-12-22/2026-01-04', Zuid: '2025-12-22/2026-01-04' },
        Voorjaarsvakantie: { Noord: '2026-02-23/2026-03-01', Midden: '2026-02-16/2026-02-22', Zuid: '2026-02-16/2026-02-22' },
        Meivakantie: { Noord: '2026-04-25/2026-05-03', Midden: '2026-04-25/2026-05-03', Zuid: '2026-04-25/2026-05-03' },
        Zomervakantie: { Noord: '2026-07-13/2026-08-23', Midden: '2026-07-20/2026-08-30', Zuid: '2026-07-06/2026-08-16' },
    },
    '2026-2027': {
        Herfstvakantie: { Noord: '2026-10-17/2026-10-25', Midden: '2026-10-17/2026-10-25', Zuid: '2026-10-24/2026-11-01' },
        Kerstvakantie: { Noord: '2026-12-21/2027-01-03', Midden: '2026-12-21/2027-01-03', Zuid: '2026-12-21/2027-01-03' },
        Voorjaarsvakantie: { Noord: '2027-02-20/2027-02-28', Midden: '2027-02-20/2027-02-28', Zuid: '2027-02-13/2027-02-21' },
        Meivakantie: { Noord: '2027-04-24/2027-05-02', Midden: '2027-04-24/2027-05-02', Zuid: '2027-04-24/2027-05-02' },
        Zomervakantie: { Noord: '2027-07-17/2027-08-29', Midden: '2027-07-10/2027-08-22', Zuid: '2027-07-24/2027-09-05' },
    },
    '2027-2028': {
        Herfstvakantie: { Noord: '2027-10-23/2027-10-31', Midden: '2027-10-16/2027-10-24', Zuid: '2027-10-16/2027-10-24' },
        Kerstvakantie: { Noord: '2027-12-27/2028-01-09', Midden: '2027-12-27/2028-01-09', Zuid: '2027-12-27/2028-01-09' },
        Voorjaarsvakantie: { Noord: '2028-02-19/2028-02-27', Midden: '2028-02-26/2028-03-05', Zuid: '2028-02-26/2028-03-05' },
        Meivakantie: { Noord: '2028-04-22/2028-04-30', Midden: '2028-04-22/2028-04-30', Zuid: '2028-04-22/2028-04-30' },
        Zomervakantie: { Noord: '2028-07-15/2028-08-27', Midden: '2028-07-22/2028-09-03', Zuid: '2028-07-08/2028-08-20' },
    }
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number): Date => { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; };
const generateSlug = (name: string, year: number) => `${name.toLowerCase().replace(/\s+/g, '-')}-${year}`;

const calculateEaster = (year: number): Date => {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
};

export const getHolidaysForYear = (schoolYear: string, region: VacationRegion): { holidays: Holiday[], previousSummerHolidayEnd: Date, currentSummerHolidayStart: Date } => {
    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const holidays: Holiday[] = [];

    // --- Official Dutch Holidays (Feestdagen) ---
    const easter = calculateEaster(endYear);
    const officialHolidays: Omit<Holiday, 'type'>[] = [
        { id: generateSlug('kerstmis', startYear), name: 'Kerstmis', date: `${startYear}-12-25`, endDate: `${startYear}-12-26`, isOfficial: true },
        { id: generateSlug('nieuwjaarsdag', endYear), name: 'Nieuwjaarsdag', date: `${endYear}-01-01`, isOfficial: true },
        { id: generateSlug('goede-vrijdag', endYear), name: 'Goede Vrijdag', date: formatDate(addDays(easter, -2)), isOfficial: true },
        { id: generateSlug('pasen', endYear), name: 'Pasen', date: formatDate(easter), endDate: formatDate(addDays(easter, 1)), isOfficial: true },
        { id: generateSlug('koningsdag', endYear), name: 'Koningsdag', date: `${endYear}-04-27`, isOfficial: true }, 
        { id: generateSlug('bevrijdingsdag', endYear), name: 'Bevrijdingsdag', date: `${endYear}-05-05`, isOfficial: true },
        { id: generateSlug('hemelvaartsdag', endYear), name: 'Hemelvaartsdag', date: formatDate(addDays(easter, 39)), isOfficial: true },
        { id: generateSlug('pinksteren', endYear), name: 'Pinksteren', date: formatDate(addDays(easter, 49)), endDate: formatDate(addDays(easter, 50)), isOfficial: true },
        { id: generateSlug('cao-vrij', endYear), name: 'CAO Vrije dag', date: formatDate(addDays(easter, 40)), isOfficial: true } 
    ];
    holidays.push(...officialHolidays.map(h => ({ ...h, type: 'feestdag' as const })));

    // --- School Vacations (Vakanties) ---
    const yearData = vacationData[schoolYear as keyof typeof vacationData];
    if (yearData) {
        for (const [name, regions] of Object.entries(yearData)) {
            const regionDates = regions[region];
            if (regionDates) {
                const dates = regionDates.split('/');
                holidays.push({ 
                    id: generateSlug(name, startYear), 
                    name, 
                    date: dates[0], 
                    endDate: dates[1], 
                    type: 'vakantie' 
                });
            }
        }
    }
    
    const prevSchoolYear = `${startYear - 1}-${startYear}`;
    const prevYearData = vacationData[prevSchoolYear as keyof typeof vacationData];
    const prevSummerDates = (prevYearData?.Zomervakantie?.[region] || '2024-07-15/2024-08-25').split('/');
    const currentSummerDates = (yearData?.Zomervakantie?.[region] || '2025-07-21/2025-08-31').split('/');

    // Add previous summer holiday
    holidays.push({ 
        id: generateSlug('zomervakantie-oud', startYear),
        name: 'Zomervakantie', 
        date: prevSummerDates[0], 
        endDate: prevSummerDates[1], 
        type: 'vakantie' 
    });

    return {
        holidays,
        previousSummerHolidayEnd: addDays(new Date(prevSummerDates[1] + 'T00:00:00Z'), 1),
        currentSummerHolidayStart: new Date(currentSummerDates[0] + 'T00:00:00Z'),
    };
};
