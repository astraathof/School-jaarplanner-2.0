
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';

import { CompactSummaryBar } from './components/CompactSummaryBar';
import { Header } from './components/Header';
import { ShareModal } from './components/ShareModal';
import { HeatmapModal } from './components/HeatmapModal';
import { SummaryCards } from './components/SummaryCards';
import { Calendar, CalendarPdfListView, CalendarPdfGridView, CalendarPdfYearPoster, CalendarPdfMonthlyEvents } from './components/Calendar';
import { EventPalette } from './components/EventPalette';
import { SettingsModal } from './components/SettingsModal';
import { EventModal } from './components/EventModal';
import { OverviewModal } from './components/OverviewModal';
import { TodoPanel } from './components/TodoPanel';
import { TrashModal } from './components/TrashModal';
import { OnboardingTour } from './components/OnboardingTour';
import { AIImportModal } from './components/AIImportModal';
import { ConflictAssistant } from './components/ConflictAssistant';
import { HealthCheckModal } from './components/HealthCheckModal';
import { AIChatSidebar } from './components/AIChatSidebar';
import { WorkloadOverview } from './components/WorkloadOverview';
import { InspectionReport } from './components/InspectionReport';
import { RoadmapView } from './components/RoadmapView';
import { AuditAssistant } from './components/AuditAssistant';
import { InviteModal } from './components/InviteModal';
import { ActivityLogModal } from './components/ActivityLogModal';
import { HelpModal } from './components/HelpModal';
import { BulkAddModal } from './components/BulkAddModal';
import { ShortenedWeeksModal } from './components/ShortenedWeeksModal';
import { SchoolEvent, SchoolSettings, ViewMode, Filter, EventTypeString, ValidationWarning, TodoItem, SchoolGoal, SettingsModalSection, Holiday, EventTypeConfig, EventTemplate, ShortenedWeekDetail, INSPECTION_STANDARDS } from './types';
import { 
    auth, 
    loginWithGoogle, 
    logout, 
    db, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    where, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    FirebaseUser 
} from './lib/firebase';
import { initialEvents, initialSettings, getHolidaysForYear, STORAGE_KEY, VO_DAYS_NORM, PO_HOURS_NORM } from './constants';
import { createRoot } from 'react-dom/client';
import { X, Calendar as CalendarIcon, AlertCircle, Keyboard, Trash2, Check, ChevronDown, Sparkles } from 'lucide-react';

const getWeekIdentifier = (d: Date): string => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // @ts-ignore
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const App: React.FC = () => {
    // --- Persistence Logic ---
    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure holidayOverrides exists in legacy data
                if (parsed.settings && !parsed.settings.holidayOverrides) {
                    parsed.settings.holidayOverrides = [];
                }
                return parsed;
            }
        } catch (e) {
            console.error("Failed to load from local storage", e);
        }
        return null;
    };

    const initialData = loadFromStorage();
    const hasPreviousSession = !!initialData;

    // --- Firebase & Auth State ---
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [currentPlannerId, setCurrentPlannerId] = useState<string | null>(null);
    const [currentPlanner, setCurrentPlanner] = useState<any>(null);
    const [isFirebaseMode, setIsFirebaseMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('school_planner_mode') === 'firebase';
        }
        return false;
    });
    const [planners, setPlanners] = useState<{id: string, name: string}[]>([]);
    const [activeUsers, setActiveUsers] = useState<{uid: string, displayName: string, photoURL: string, lastActive: any}[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isEmbedMode, setIsEmbedMode] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('embed') === 'true') {
            setIsEmbedMode(true);
        }
        if (params.get('view') === 'parent') {
            setViewMode('parent');
        }
    }, []);

    // --- Main State ---
    const [viewMode, setViewMode] = useState<ViewMode>('school');
    const [theme, setTheme] = useState<'light' | 'dark'>(initialData?.theme || 'light');
    const [events, setEvents] = useState<SchoolEvent[]>(initialData?.events || initialEvents);
    const [deletedEvents, setDeletedEvents] = useState<SchoolEvent[]>(initialData?.deletedEvents || []);
    const [settings, setSettings] = useState<SchoolSettings>(initialData?.settings || initialSettings);
    const [todos, setTodos] = useState<TodoItem[]>(initialData?.todos || []);

    // --- Presence System ---
    useEffect(() => {
        if (!user || !currentPlannerId || !isFirebaseMode) return;

        const presenceRef = doc(db, 'planners', currentPlannerId, 'presence', user.uid);
        
        const updatePresence = async () => {
            await setDoc(presenceRef, {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastActive: serverTimestamp()
            }, { merge: true });
        };

        const interval = setInterval(updatePresence, 30000); // Pulse every 30s
        updatePresence();

        // Listen for others (active in last 5 mins)
        const q = collection(db, 'planners', currentPlannerId, 'presence');
        const unsub = onSnapshot(q, (snapshot) => {
            const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
            const active = snapshot.docs
                .map(doc => doc.data())
                .filter(d => {
                    const lastActive = d.lastActive?.toMillis?.() || 0;
                    return lastActive > fiveMinsAgo && d.uid !== user.uid;
                }) as any[];
            setActiveUsers(active);
        });

        return () => {
            clearInterval(interval);
            unsub();
        };
    }, [user, currentPlannerId, isFirebaseMode]);

    // --- Activity Log Listener ---
    useEffect(() => {
        if (!currentPlannerId || !isFirebaseMode) return;

        const q = query(
            collection(db, 'planners', currentPlannerId, 'activities'),
            // Note: need index, omitting order for now to avoid crashes if index not yet ready
            // orderBy('timestamp', 'desc'), 
            // limit(50)
        );
        
        const unsub = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }))
                .sort((a: any, b: any) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
            setActivities(fetched);
        });

        return unsub;
    }, [currentPlannerId, isFirebaseMode]);

    const logActivity = useCallback(async (type: 'create' | 'update' | 'delete', eventTitle: string) => {
        if (!currentPlannerId || !user || !isFirebaseMode) return;
        await addDoc(collection(db, 'planners', currentPlannerId, 'activities'), {
            type,
            eventTitle,
            userName: user.displayName,
            userPhoto: user.photoURL,
            timestamp: serverTimestamp()
        });
    }, [currentPlannerId, user, isFirebaseMode]);

    const [filters, setFilters] = useState<Filter>({ eventTypes: [], theme: '' });
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [templates, setTemplates] = useState<EventTemplate[]>(initialData?.templates || []);
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);
    const [isExportValidationOpen, setIsExportValidationOpen] = useState(false);
    const [exportValidationItems, setExportValidationItems] = useState<{id: number, title: string, reason: string}[]>([]);
    const [pendingExportType, setPendingExportType] = useState<'pdf' | 'ics' | 'json' | 'poster' | 'csv' | null>(null);
    const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);

    // History for Undo/Redo
    const [history, setHistory] = useState<SchoolEvent[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const pushToHistory = useCallback((newEvents: SchoolEvent[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push([...newEvents]);
            // Limit history to 50 steps
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const handleBulkAdd = useCallback(async (newEventsData: Omit<SchoolEvent, 'id'>[]) => {
        const newEvents: SchoolEvent[] = newEventsData.map(data => ({
            ...data,
            id: Date.now() + Math.floor(Math.random() * 10000)
        }));
        
        const updatedEvents = [...events, ...newEvents];
        setEvents(updatedEvents);
        pushToHistory(updatedEvents);
        
        if (isFirebaseMode && currentPlannerId) {
            for (const event of newEvents) {
                await addDoc(collection(db, 'planners', currentPlannerId, 'events'), event);
                logActivity('create', event.title);
            }
        }
    }, [events, isFirebaseMode, currentPlannerId, pushToHistory, logActivity]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevEvents = history[historyIndex - 1];
            setEvents(prevEvents);
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextEvents = history[historyIndex + 1];
            setEvents(nextEvents);
            setHistoryIndex(prev => prev + 1);
        }
    }, [history, historyIndex]);

    // Initialize history
    useEffect(() => {
        if (historyIndex === -1 && events.length > 0) {
            setHistory([events]);
            setHistoryIndex(0);
        }
    }, [events, historyIndex]);

    // Onboarding State
    const [showTour, setShowTour] = useState(!hasPreviousSession && !settings.isSetupComplete);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [settingsModalInitialFocus, setSettingsModalInitialFocus] = useState<SettingsModalSection | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
    const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);
    const [overviewModalState, setOverviewModalState] = useState<{isOpen: boolean; eventType: EventTypeString | null}>({isOpen: false, eventType: null});
    const [selectedEvent, setSelectedEvent] = useState<Partial<SchoolEvent> | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
    const [calendarView, setCalendarView] = useState<'grid-1' | 'grid-2' | 'grid-3' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768 ? 'list' : 'grid-2';
        }
        return 'grid-2';
    });
    const [isDragging, setIsDragging] = useState(false);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isTodoPanelOpen, setIsTodoPanelOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
    const [isWorkloadOpen, setIsWorkloadOpen] = useState(false);
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);
    const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
    const [isConflictAssistantOpen, setIsConflictAssistantOpen] = useState(false);
    const [highlightedType, setHighlightedType] = useState<EventTypeString | null>(null);
    const [isICalModalOpen, setIsICalModalOpen] = useState(false);
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isShortenedWeeksOpen, setIsShortenedWeeksOpen] = useState(false);
    const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('school_planner_dashboard_collapsed');
            return saved === null ? true : saved === 'true';
        }
        return true;
    });

    useEffect(() => {
        if (!isDashboardCollapsed) {
            const timer = setTimeout(() => {
                const element = document.getElementById('summary-cards');
                if (element) {
                    // Using scrollIntoView with scrollMarginTop on the element is preferred.
                    // We also ensure it's scrolled correctly.
                    const top = element.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }, 400); 
            return () => clearTimeout(timer);
        }
    }, [isDashboardCollapsed]);

    useEffect(() => {
        localStorage.setItem('school_planner_dashboard_collapsed', isDashboardCollapsed.toString());
    }, [isDashboardCollapsed]);

    // --- Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                // Upsert user profile
                const userRef = doc(db, 'users', u.uid);
                await setDoc(userRef, {
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    photoURL: u.photoURL,
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }
            setIsAuthLoading(false);
        });
        return unsubscribe;
    }, []);

    // --- Fetch User's Planners ---
    useEffect(() => {
        if (!user || !isFirebaseMode) return;

        // Query planners where user is owner or collaborator by email
        const q = query(collection(db, 'planners'), where('collaborators', 'array-contains', user.email));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPlanners = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, collaborators: doc.data().collaborators || [] }));
            setPlanners(fetchedPlanners);
            
            // Auto-select first planner if none selected
            if (fetchedPlanners.length > 0 && !currentPlannerId) {
                setCurrentPlannerId(fetchedPlanners[0].id);
            }
        });

        return unsubscribe;
    }, [user, isFirebaseMode, currentPlannerId]);

    // --- Real-time Planner Sync (Events & Settings) ---
    useEffect(() => {
        if (!currentPlannerId || !isFirebaseMode) return;

        // Sync Settings & Metadata
        const plannerRef = doc(db, 'planners', currentPlannerId);
        const unsubPlanner = onSnapshot(plannerRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings(data.settings);
                setCurrentPlanner(data);
            }
        });

        // Sync Events
        const eventsRef = collection(db, 'planners', currentPlannerId, 'events');
        const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any as SchoolEvent));
            setEvents(fetchedEvents);
        });

        // Sync Todos
        const todosRef = collection(db, 'planners', currentPlannerId, 'todos');
        const unsubTodos = onSnapshot(todosRef, (snapshot) => {
            const fetchedTodos = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id } as any as TodoItem))
                .sort((a, b) => (b as any).createdAt?.toMillis?.() - (a as any).createdAt?.toMillis?.());
            setTodos(fetchedTodos);
        });

        return () => {
            unsubPlanner();
            unsubEvents();
            unsubTodos();
        };
    }, [currentPlannerId, isFirebaseMode]);

    const handleCreatePlanner = useCallback(async (name: string) => {
        if (!user) return;
        const plannerRef = await addDoc(collection(db, 'planners'), {
            name,
            ownerId: user.uid,
            collaborators: [user.email],
            settings: initialSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        setCurrentPlannerId(plannerRef.id);
    }, [user]);

    const toggleMode = (mode: 'online' | 'firebase') => {
        setIsFirebaseMode(mode === 'firebase');
        localStorage.setItem('school_planner_mode', mode);
        // Reload to clean up states or fetch new data
        window.location.reload();
    };

    const handleInviteByEmail = useCallback(async (email: string) => {
        if (!currentPlannerId || !user) return;
        
        try {
            const plannerRef = doc(db, 'planners', currentPlannerId);
            const currentCollaborators = currentPlanner?.collaborators || [];
            
            if (currentCollaborators.includes(email)) {
                alert("Deze collega is al lid van deze planner.");
                return;
            }

            await updateDoc(plannerRef, {
                collaborators: [...currentCollaborators, email],
                updatedAt: serverTimestamp()
            });

            alert(`Uitnodiging naar ${email} succesvol verwerkt! Deze persoon kan nu inloggen en ziet deze planner in hun lijst.`);
        } catch (error) {
            console.error("Fout bij uitnodigen:", error);
            alert("Er is een fout opgetreden bij het verzenden van de uitnodiging.");
        }
    }, [currentPlannerId, user, currentPlanner]);

    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(73);
    const [goToTodayTrigger, setGoToTodayTrigger] = useState(0);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const handleGoToToday = useCallback(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Determine if current date is within the selected school year
        const [startYear, endYear] = settings.schoolYear.split('-').map(Number);
        const isInCurrentYear = (currentYear === startYear && currentMonth >= 7) || (currentYear === endYear && currentMonth <= 7);
        
        if (!isInCurrentYear) {
            // Find the correct school year
            let targetSchoolYear = settings.schoolYear;
            if (currentMonth >= 7) {
                targetSchoolYear = `${currentYear}-${currentYear + 1}`;
            } else {
                targetSchoolYear = `${currentYear - 1}-${currentYear}`;
            }
            
            // Only update if it's a valid option (we have data for it)
            if (['2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'].includes(targetSchoolYear)) {
                setSettings(prev => ({ ...prev, schoolYear: targetSchoolYear }));
            }
        }
        
        setGoToTodayTrigger(prev => prev + 1);
    }, [settings.schoolYear]);

    const handleBatchDelete = useCallback(() => {
        if (selectedEventIds.length === 0) return;
        if (window.confirm(`Weet je zeker dat je deze ${selectedEventIds.length} items wilt verwijderen?`)) {
            const eventsToDelete = events.filter(e => selectedEventIds.includes(e.id!));
            const remainingEvents = events.filter(e => !selectedEventIds.includes(e.id!));
            
            setEvents(remainingEvents);
            setDeletedEvents(prev => [...prev, ...eventsToDelete.map(e => ({ ...e, deletedAt: new Date().toISOString() }))]);
            pushToHistory(remainingEvents);
            setSelectedEventIds([]);
        }
    }, [selectedEventIds, events, pushToHistory]);

    const handleBatchChangeType = useCallback((newType: EventTypeString) => {
        if (selectedEventIds.length === 0) return;
        const newEvents = events.map(e => 
            selectedEventIds.includes(e.id!) ? { ...e, type: newType } : e
        );
        setEvents(newEvents);
        pushToHistory(newEvents);
        setSelectedEventIds([]);
    }, [selectedEventIds, events, pushToHistory]);

    const validatePlanForExport = useCallback(() => {
        const issues: {id: number, title: string, reason: string}[] = [];
        events.forEach(e => {
            if (!e.program || e.program.trim().length < 5) {
                issues.push({ id: e.id!, title: e.title, reason: 'Programma ontbreekt of is erg kort' });
            }
        });
        return issues;
    }, [events]);

    const startExportFlow = (type: 'pdf' | 'ics' | 'json' | 'poster' | 'csv', mode?: ViewMode) => {
        const issues = validatePlanForExport();
        if (issues.length > 0) {
            setExportValidationItems(issues);
            setPendingExportType(type);
            setPendingViewMode(mode || null);
            setIsExportValidationOpen(true);
        } else {
            executeExport(type, mode);
        }
    };

    const executeExport = (type: 'pdf' | 'ics' | 'json' | 'poster' | 'csv', mode?: ViewMode) => {
        const finalMode = mode || pendingViewMode || viewMode;
        switch(type) {
            case 'pdf': handleExportToPdf(finalMode); break;
            case 'ics': handleExportToICal(); break;
            case 'json': handleExportToJson(); break;
            case 'poster': handleExportPoster(); break;
            case 'csv': handleExportToCsv(); break;
        }
        setIsExportValidationOpen(false);
        setPendingExportType(null);
        setPendingViewMode(null);
    };

    const resetPlanning = useCallback(() => {
        if (window.confirm('Weet je zeker dat je de volledige planning wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
            setEvents(initialEvents);
            setDeletedEvents([]);
            setTodos([]);
            setSettings(prev => ({
                ...prev,
                goals: [],
                themes: [],
                missionVision: '',
                holidayOverrides: []
            }));
            pushToHistory(initialEvents);
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload(); // Reload to ensure a completely clean state
        }
    }, [pushToHistory]);

    const headerRef = useRef<HTMLElement>(null);

    // Measure header height for sticky positioning
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        const observer = new ResizeObserver(updateHeaderHeight);
        if (headerRef.current) observer.observe(headerRef.current);
        
        updateHeaderHeight();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case '?':
                    setIsShortcutsHelpOpen(prev => !prev);
                    break;
                case 'c':
                    setIsAIChatOpen(prev => !prev);
                    break;
                case 't':
                    setIsTodoPanelOpen(prev => !prev);
                    break;
                case 's':
                    setIsSettingsModalOpen(true);
                    break;
                case 'a':
                    e.preventDefault();
                    setSelectedDate(new Date());
                    setSelectedEvent({});
                    setIsEventModalOpen(true);
                    break;
                case 'f':
                    e.preventDefault();
                    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (searchInput) searchInput.focus();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleRedo();
                        } else {
                            handleUndo();
                        }
                    }
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRedo();
                    }
                    break;
                case 'escape':
                    setIsShortcutsHelpOpen(false);
                    setIsAIChatOpen(false);
                    setIsTodoPanelOpen(false);
                    setIsSettingsModalOpen(false);
                    setIsEventModalOpen(false);
                    setIsICalModalOpen(false);
                    setIsConflictAssistantOpen(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Save to LocalStorage on Change ---
    useEffect(() => {
        if (isFirebaseMode) return;
        const dataToSave = {
            settings,
            events,
            deletedEvents,
            todos,
            theme,
            templates,
            version: '1.2'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        
        // Show save indicator
        setShowSaveIndicator(true);
        const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
        return () => clearTimeout(timer);
    }, [settings, events, deletedEvents, todos, theme, templates, isFirebaseMode]);

    // --- Theme Application ---
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    const handleTourComplete = () => {
        setShowTour(false);
    };
    
    const handleStartTourManually = () => {
        setShowTour(true);
    };

    const holidayData = useMemo(() => getHolidaysForYear(settings.schoolYear, settings.region), [settings.schoolYear, settings.region]);

    // Merge system holidays with user overrides by ID
    const allHolidays = useMemo(() => {
        const baseHolidays = holidayData.holidays;
        const overrides = settings.holidayOverrides || [];
        
        // Map for quick lookup
        const overrideMap = new Map(overrides.map(h => [h.id, h]));
        
        // 1. Merge overrides into base holidays (for system holidays)
        const merged = baseHolidays.map(holiday => {
            const override = overrideMap.get(holiday.id);
            if (override) {
                return Object.assign({}, holiday, override); 
            }
            return holiday;
        });

        // 2. Add purely custom holidays (those in overrides that don't match any base ID)
        overrides.forEach(override => {
            if (!baseHolidays.find(h => h.id === override.id)) {
                merged.push(override);
            }
        });

        return merged;
    }, [holidayData, settings.holidayOverrides]);

    const academicYear = useMemo(() => {
        return {
            start: holidayData.previousSummerHolidayEnd,
            end: holidayData.currentSummerHolidayStart,
        };
    }, [holidayData]);
    
    const holidaySet = useMemo(() => {
        const set = new Set<string>();
        allHolidays.forEach(h => {
            let currentDate = new Date(h.date + 'T00:00:00Z');
            const endDate = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : new Date(currentDate);
            while (currentDate <= endDate) {
                set.add(currentDate.toISOString().split('T')[0]);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        });
        return set;
    }, [allHolidays]);


    const filteredEvents = useMemo(() => {
        let eventsToDisplay = viewMode === 'parent' ? events.filter(e => e.isPublic) : events;

        // Filter by academic year to ensure sidebar counts match calendar view
        const yearStart = new Date(academicYear.start);
        const yearEnd = new Date(academicYear.end);
        eventsToDisplay = eventsToDisplay.filter(e => {
            const eventDate = new Date(e.date + 'T00:00:00Z');
            return eventDate >= yearStart && eventDate < yearEnd;
        });

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            eventsToDisplay = eventsToDisplay.filter(e => 
                e.title.toLowerCase().includes(query) || 
                e.description?.toLowerCase().includes(query) ||
                e.type.toLowerCase().includes(query) ||
                e.theme?.toLowerCase().includes(query) ||
                e.inspectionStandards?.some(s => s.toLowerCase().includes(query))
            );
        }

        if (filters.eventTypes.length > 0) {
            eventsToDisplay = eventsToDisplay.filter(e => filters.eventTypes.includes(e.type));
        }
        if (filters.theme) {
            eventsToDisplay = eventsToDisplay.filter(e => e.theme?.toLowerCase().includes(filters.theme.toLowerCase()));
        }
        if (selectedGoalId !== null) {
            eventsToDisplay = eventsToDisplay.filter(e => e.goalIds?.includes(selectedGoalId));
        }

        return eventsToDisplay;
    }, [events, viewMode, filters, searchQuery, selectedGoalId, academicYear]);

    const currentYearEvents = useMemo(() => {
        return filteredEvents.filter(e => {
            const d = new Date(e.date + 'T00:00:00Z');
            return d >= new Date(academicYear.start) && d < new Date(academicYear.end);
        });
    }, [filteredEvents, academicYear]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('header-search-input')?.focus();
            }
            if (e.key === 'Escape') {
                setIsSettingsModalOpen(false);
                setIsInspectionOpen(false);
                setOverviewModalState(prev => ({ ...prev, isOpen: false }));
                setIsAIImportModalOpen(false);
                setIsConflictAssistantOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const teachingNormValidation = useMemo(() => {
        const eventsByDate = new Map<string, SchoolEvent[]>();
        events.forEach(e => {
            const date = e.date;
            if (!eventsByDate.has(date)) {
                eventsByDate.set(date, []);
            }
            eventsByDate.get(date)?.push(e);
        });

        const holidaySet = new Set<string>();
        allHolidays.forEach(h => {
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
        const isVO = settings.schoolType === 'VO';
        const isBelowNorm = isVO ? teachingDays < VO_DAYS_NORM : totalTeachingHours < PO_HOURS_NORM;

        return {
            teachingDays,
            totalTeachingHours,
            isBelowNorm,
            norm: isVO ? VO_DAYS_NORM : PO_HOURS_NORM,
            unit: isVO ? 'dagen' : 'uur'
        };
    }, [events, allHolidays, academicYear, settings.schoolType, settings.timetables]);

    const fourDayWeekValidation = useMemo(() => {
        const eventsByDate = new Map<string, SchoolEvent>();
        events.forEach(e => {
            if (e.type === 'Studiedag' || e.type === 'Lesvrije dag' || e.type === 'Vrije dag' || e.type === 'Vakantie') {
                eventsByDate.set(e.date, e);
            }
        });

        const holidaysByDate = new Map<string, Holiday>();
        allHolidays.forEach(h => {
             let currentDate = new Date(h.date + 'T00:00:00Z');
             const endDate = h.endDate ? new Date(h.endDate + 'T00:00:00Z') : new Date(currentDate);
             while (currentDate <= endDate) {
                 holidaysByDate.set(currentDate.toISOString().split('T')[0], h);
                 currentDate.setUTCDate(currentDate.getUTCDate() + 1);
             }
        });

        const interruptedWeeks = new Set<string>();
        const threeDayWeeks = new Set<string>();
        const details: ShortenedWeekDetail[] = [];
        
        let cursor = new Date(academicYear.start);
        const day = cursor.getUTCDay();
        const diff = cursor.getUTCDate() - day + (day === 0 ? -6 : 1);
        cursor.setUTCDate(diff);

        while (cursor < academicYear.end) {
            const weekId = getWeekIdentifier(cursor);
            const weekStartDate = new Date(cursor).toISOString().split('T')[0];
            let teachingDays = 5; 
            let hasSchoolPlannedOffDay = false;
            const weekReasons: { date: string, type: string, title: string, isHoliday: boolean }[] = [];

            for (let i = 0; i < 5; i++) {
                const d = new Date(cursor);
                d.setUTCDate(d.getUTCDate() + i);
                const dStr = d.toISOString().split('T')[0];

                const holiday = holidaysByDate.get(dStr);
                const event = eventsByDate.get(dStr);

                if (holiday) {
                    teachingDays--;
                    weekReasons.push({
                        date: dStr,
                        type: holiday.type,
                        title: holiday.name,
                        isHoliday: true
                    });
                } else if (event) {
                    if (event.type === 'Vakantie') {
                        teachingDays--;
                        weekReasons.push({
                            date: dStr,
                            type: event.type,
                            title: event.title,
                            isHoliday: false
                        });
                    } else {
                        // School planned off days (Studiedagen etc)
                        hasSchoolPlannedOffDay = true;
                        const factor = event.durationMultiplier !== undefined ? event.durationMultiplier : 1;
                        teachingDays -= factor;
                        weekReasons.push({
                            date: dStr,
                            type: event.type,
                            title: event.title,
                            isHoliday: false
                        });
                    }
                }
            }
            
            if (hasSchoolPlannedOffDay && teachingDays > 0 && teachingDays < 5) {
                interruptedWeeks.add(weekId);
                if (teachingDays <= 3) {
                    threeDayWeeks.add(weekId);
                }
                details.push({
                    weekId,
                    startDate: weekStartDate,
                    teachingDays,
                    reasons: weekReasons
                });
            }
            cursor.setUTCDate(cursor.getUTCDate() + 7);
        }

        return {
            count: interruptedWeeks.size,
            threeDayCount: threeDayWeeks.size,
            limit: 7,
            isExceeded: interruptedWeeks.size > 7,
            details
        };
    }, [events, allHolidays, academicYear]);
    
    // --- Validation Engine ---
    useEffect(() => {
        const newWarnings: ValidationWarning[] = [];
        
        events.forEach(event => {
            const eventDateStr = new Date(event.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
            if (event.isIncomplete) {
                newWarnings.push({
                    id: `incomplete-${event.id}`,
                    type: 'incomplete',
                    message: `Item "${event.title}" op ${eventDateStr} is nog niet volledig ingevuld.`,
                    eventId: event.id
                });
            }
            
            if (holidaySet.has(event.date) && event.type !== 'Vakantie') {
                 newWarnings.push({
                    id: `conflict-${event.id}`,
                    type: 'conflict',
                    message: `Conflict: "${event.title}" op ${eventDateStr} is gepland op een vakantiedag.`,
                    eventId: event.id
                });
            }

            // New: Check for high workload (more than 3 events a day)
            const eventsOnSameDay = events.filter(e => e.date === event.date);
            if (eventsOnSameDay.length > 3 && event.id === eventsOnSameDay[0].id) {
                 newWarnings.push({
                    id: `workload-${event.date}`,
                    type: 'norm',
                    message: `Hoge werkdruk op ${eventDateStr}: Er zijn ${eventsOnSameDay.length} items gepland.`,
                });
            }

            // New: Check for potential duplicates
            const duplicates = events.filter(e => e.title.toLowerCase() === event.title.toLowerCase() && e.id !== event.id);
            if (duplicates.length > 0 && event.id! < (duplicates[0].id || 0)) {
                 newWarnings.push({
                    id: `duplicate-${event.id}`,
                    type: 'incomplete',
                    message: `Mogelijke dubbel gevonden: "${event.title}" komt vaker voor in de planner.`,
                    eventId: event.id
                });
            }
        });

        if(fourDayWeekValidation.isExceeded) {
             const message = fourDayWeekValidation.threeDayCount > 0 
                ? `De limiet van ${fourDayWeekValidation.limit} ingekorte schoolweken is overschreden (${fourDayWeekValidation.count} weken, waarvan ${fourDayWeekValidation.threeDayCount} van 3 dagen of minder).`
                : `De limiet van ${fourDayWeekValidation.limit} vierdaagse schoolweken is overschreden (${fourDayWeekValidation.count}).`;
             newWarnings.push({
                id: 'norm-4day',
                type: 'norm',
                message: message
            });
        }

        if (teachingNormValidation.isBelowNorm) {
            newWarnings.push({
                id: 'norm-teaching-hours',
                type: 'norm',
                message: `Het totaal aantal les${teachingNormValidation.unit} (${settings.schoolType === 'VO' ? teachingNormValidation.teachingDays : teachingNormValidation.totalTeachingHours}) is onder de norm van ${teachingNormValidation.norm} ${teachingNormValidation.unit}.`
            });
        }

        settings.goals.forEach(goal => {
            const linkedEvents = events.filter(e => e.goalIds?.includes(goal.id));
            if (linkedEvents.length === 0) {
                newWarnings.push({
                    id: `goal-gap-${goal.id}`,
                    type: 'norm',
                    message: `Hiaat: Het strategisch doel "${goal.title}" is nog niet gekoppeld aan activiteiten in de jaarplanning.`
                });
            }
        });
        
        setWarnings(newWarnings);

    }, [events, holidaySet, fourDayWeekValidation, teachingNormValidation, settings.schoolType, settings.goals]);


    const eventCounts = useMemo(() => {
        const counts = filteredEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<EventTypeString, number>);

        // Add holidays of type 'vakantie' that fall within the academic year
        const yearStart = new Date(academicYear.start);
        const yearEnd = new Date(academicYear.end);
        
        const holidayVacationCount = allHolidays.filter(h => {
            if (h.type !== 'vakantie') return false;
            const hDate = new Date(h.date + 'T00:00:00Z');
            return hDate >= yearStart && hDate < yearEnd;
        }).length;

        counts['Vakantie'] = (counts['Vakantie'] || 0) + holidayVacationCount;

        return counts;
    }, [filteredEvents, allHolidays, academicYear]);

    const handleDayClick = useCallback((date: Date) => {
        setSelectedDate(date);
        setSelectedEvent(null);
        setIsEventModalOpen(true);
    }, []);

    const handleEventClick = useCallback((event: SchoolEvent | Holiday) => {
        setIsHealthCheckOpen(false);
        // Check if it's a holiday (checking if it has 'type' property of 'vakantie' or 'feestdag')
        const isHoliday = (event as any).type === 'vakantie' || (event as any).type === 'feestdag';
        
        if (isHoliday) {
             const h = event as Holiday;
             setSelectedEvent({
                 // If it's a holiday, map to partial SchoolEvent for the modal
                 id: h.id as any, // Pass string ID in field, cast to any to suppress TS error in modal for now
                 title: h.name,
                 type: h.type === 'feestdag' ? 'Feestdag' : 'Vakantie',
                 date: h.date,
                 endDate: h.endDate,
                 isPublic: true,
                 theme: h.id // Store real ID in theme for reference in save
             });
        } else {
             setSelectedEvent(event as SchoolEvent);
        }
        setSelectedDate(null);
        setIsEventModalOpen(true);
    }, []);

    // --- Shortcuts Handling ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key === 'n' || e.key === 't') {
                e.preventDefault();
                setSelectedDate(new Date());
                setIsEventModalOpen(true);
            } else if (e.key === 's') {
                e.preventDefault();
                const searchInput = document.getElementById('main-search-input');
                searchInput?.focus();
            } else if (e.key === 'g' || e.key === '.') {
                e.preventDefault();
                handleGoToToday();
            } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleUndo();
            } else if (e.key === 'Escape') {
                setIsEventModalOpen(false);
                setIsSettingsModalOpen(false);
                setIsTrashModalOpen(false);
                setOverviewModalState({ isOpen: false, eventType: null });
                setSelectedEventIds([]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo]);

    const toggleEventSelection = useCallback((id: number, shiftKey?: boolean) => {
        setSelectedEventIds(prev => {
            const isCurrentlySelected = prev.includes(id);
            if (!shiftKey || prev.length === 0) {
                return isCurrentlySelected ? prev.filter(eid => eid !== id) : [...prev, id];
            }

            // Shift-selection logic: find all events between the last selected and this one
            const lastId = prev[prev.length - 1];
            const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const lastIdx = sortedEvents.findIndex(e => e.id === lastId);
            const currentIdx = sortedEvents.findIndex(e => e.id === id);

            if (lastIdx === -1 || currentIdx === -1) return [...prev, id];

            const start = Math.min(lastIdx, currentIdx);
            const end = Math.max(lastIdx, currentIdx);
            const rangeIds = sortedEvents.slice(start, end + 1).map(e => e.id!).filter(eid => eid !== undefined);
            
            // Merge range into selection, ensuring uniqueness
            const newSelection = Array.from(new Set([...prev, ...rangeIds]));
            return newSelection;
        });
    }, [events]);

    const { qualityScore, reliabilityScore } = useMemo(() => {
        if (events.length === 0) return { qualityScore: 0, reliabilityScore: 0 };
        
        const yearEvents = events.filter(e => {
            const d = new Date(e.date);
            return d >= academicYear.start && d <= academicYear.end;
        });
        
        if (yearEvents.length === 0) return { qualityScore: 0, reliabilityScore: 0 };

        const totalEvents = yearEvents.length;
        const completeEvents = yearEvents.filter(e => !e.isIncomplete && (e.program && e.program.length > 10)).length;
        const eventsWithGoals = yearEvents.filter(e => e.goalIds && e.goalIds.length > 0).length;
        const coveredStandardsCount = INSPECTION_STANDARDS.filter(std => 
            yearEvents.some(e => e.inspectionStandards?.includes(std.code))
        ).length;

        // Peak workloads
        const eventsPerWeek: { [week: string]: number } = {};
        yearEvents.forEach(e => {
            const date = new Date(e.date);
            const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
            eventsPerWeek[week] = (eventsPerWeek[week] || 0) + 1;
        });
        const peakWeeksCount = Object.values(eventsPerWeek).filter(count => count > 5).length;
        const balanceScore = Math.max(0, 100 - (peakWeeksCount * 20));

        const goalsScore = settings.goals.length > 0 ? (yearEvents.filter(e => e.goalIds && e.goalIds.length > 0).length / settings.goals.length) * 100 : 0;
        const standardsScore = (coveredStandardsCount / INSPECTION_STANDARDS.length) * 100;
        const completenessScore = (completeEvents / totalEvents) * 100;

        const qScore = Math.round(
            (goalsScore * 0.4) + 
            (standardsScore * 0.3) + 
            (completenessScore * 0.2) + 
            (balanceScore * 0.1)
        );

        // Reliability Score (Feasibility & Logic)
        const holidayConflictCount = yearEvents.filter(e => holidaySet.has(e.date) && e.type !== 'Vakantie').length;
        const conflictDeduction = totalEvents > 0 ? (holidayConflictCount / totalEvents) * 50 : 0;

        const rScore = Math.round(
            (completenessScore * 0.4) + 
            (balanceScore * 0.3) +      
            (goalsScore * 0.2) +        
            (yearEvents.length >= 10 ? 10 : (yearEvents.length / 10) * 10) -
            conflictDeduction
        );
        
        return { 
            qualityScore: Math.min(100, qScore), 
            reliabilityScore: Math.min(100, rScore) 
        };
    }, [events, settings.goals, academicYear]);

    const uniqueConflicts = useMemo(() => {
        const conflicts = events.filter(e => {
            return events.some(other => 
                other.id !== e.id && 
                other.date === e.date && 
                other.type !== 'Thema' && e.type !== 'Thema'
            );
        });
        return Array.from(new Set(conflicts.map(c => c.date)));
    }, [events]);

    const handleEventDrop = useCallback((type: EventTypeString, date: Date, title?: string) => {
        const newEvent: SchoolEvent = {
            id: Date.now(),
            title: title || type,
            type: type,
            date: date.toISOString().split('T')[0],
            isPublic: type === 'Studiedag' || type === 'Lesvrije dag' || type === 'Vrije dag' || type === 'Vakantie',
            isIncomplete: type !== 'Vakantie' && !title,
            durationMultiplier: 1 
        };
        setEvents(prev => [...prev, newEvent]);
        
        if (type === 'Vakantie' || !title) {
             setSelectedEvent(newEvent);
             setIsEventModalOpen(true);
        }

    }, []);

    const handleMoveEvent = useCallback(async (eventId: number | string, newDate: Date) => {
        const newDateStr = newDate.toISOString().split('T')[0];
        
        if (typeof eventId === 'number' || (typeof eventId === 'string' && !eventId.startsWith('custom-') && !eventId.startsWith('holiday-'))) {
            // Standard SchoolEvent move
            if (holidaySet.has(newDateStr)) {
                 const event = events.find(e => e.id === eventId);
                 if (event && event.type !== 'Vakantie') {
                     alert('Kan item niet naar een vakantiedag verplaatsen.');
                     return;
                 }
            }
            
            if (isFirebaseMode && currentPlannerId) {
                const event = events.find(e => e.id === eventId);
                if (event) {
                    await setDoc(doc(db, 'planners', currentPlannerId, 'events', String(eventId)), { ...event, date: newDateStr }, { merge: true });
                    logActivity('update', event.title);
                }
            } else {
                setEvents(prev => prev.map(e => e.id === eventId ? { ...e, date: newDateStr } : e));
            }
        } else {
            // Holiday Move logic
            const holiday = allHolidays.find(h => h.id === eventId);
            if (!holiday) return;

            const start = new Date(holiday.date);
            const end = holiday.endDate ? new Date(holiday.endDate) : new Date(holiday.date);
            const durationMs = end.getTime() - start.getTime();
            const newStart = new Date(newDateStr);
            const newEnd = new Date(newStart.getTime() + durationMs).toISOString().split('T')[0];

            const newOverride: Holiday = {
                ...holiday,
                date: newDateStr,
                endDate: newEnd
            };

            const updatedSettings = {
                ...settings,
                holidayOverrides: settings.holidayOverrides.some(h => h.id === eventId)
                    ? settings.holidayOverrides.map(h => h.id === eventId ? newOverride : h)
                    : [...settings.holidayOverrides, newOverride]
            };

            setSettings(updatedSettings);
            if (isFirebaseMode && currentPlannerId) {
                await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
                logActivity('update', holiday.name);
            }
        }
    }, [holidaySet, events, allHolidays, isFirebaseMode, currentPlannerId, settings, logActivity]);

    const handleOpenOverview = useCallback((type: EventTypeString) => {
        setOverviewModalState({ isOpen: true, eventType: type });
    }, []);

    const handleAddNewItem = useCallback(() => {
        setSelectedDate(null);
        setSelectedEvent({});
        setIsEventModalOpen(true);
    }, []);
    
    const handleCreateFromOverview = (type: EventTypeString) => {
        setOverviewModalState({ isOpen: false, eventType: null });
        setSelectedDate(null);
        // Default isPublic based on type, but default to true if we're not a special private type
        const defaultPublic = ['Studiedag', 'Lesvrije dag', 'Vrije dag', 'Open dag', 'Vakantie', 'Feestdag', 'Ouderavond'].includes(type) || !type.toLowerCase().includes('overleg');
        setSelectedEvent({ type, isPublic: defaultPublic });
        setIsEventModalOpen(true);
    }
    
    const handleEditFromOverview = (event: SchoolEvent) => {
        setOverviewModalState({ isOpen: false, eventType: null });
        handleEventClick(event);
    }

    const handleSaveEvent = async (event: SchoolEvent) => {
        // Handle Holiday Override or Creation
        if (event.type === 'Vakantie' || event.type === 'Feestdag') {
            let holidayId: string;
            if (typeof event.id === 'number') {
                holidayId = `custom-vakantie-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            } else {
                holidayId = event.theme || (event.id as any as string);
            }

            const newOverride: Holiday = {
                id: holidayId,
                name: event.title || event.type,
                date: event.date,
                endDate: event.endDate,
                type: event.type === 'Feestdag' ? 'feestdag' : 'vakantie'
            };

            const updatedSettings = {
                ...settings,
                holidayOverrides: settings.holidayOverrides.some(h => h.id === holidayId)
                    ? settings.holidayOverrides.map(h => h.id === holidayId ? newOverride : h)
                    : [...settings.holidayOverrides, newOverride]
            };

            setSettings(updatedSettings);
            if (isFirebaseMode && currentPlannerId) {
                await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
                logActivity(typeof event.id === 'number' ? 'create' : 'update', event.title || event.type);
            }

            if (typeof event.id === 'number') {
                if (isFirebaseMode && currentPlannerId) {
                    await deleteDoc(doc(db, 'planners', currentPlannerId, 'events', String(event.id)));
                } else {
                    setEvents(prev => prev.filter(e => e.id !== event.id));
                }
            }

            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
            return;
        }

        const finalEvent = { ...event };
        if (finalEvent.durationMultiplier === undefined) finalEvent.durationMultiplier = 1;
        if (!finalEvent.title || !finalEvent.title.trim()) {
            finalEvent.isIncomplete = true;
            finalEvent.title = finalEvent.type;
        } else {
            finalEvent.isIncomplete = false;
        }
        
        if (finalEvent.recurrence?.frequency === 'none') delete finalEvent.recurrence;

        if (isFirebaseMode && currentPlannerId) {
            const eventsRef = collection(db, 'planners', currentPlannerId, 'events');
            if (finalEvent.id && typeof finalEvent.id === 'string') {
                const { id, ...data } = finalEvent;
                await setDoc(doc(db, 'planners', currentPlannerId, 'events', id), data, { merge: true });
                logActivity('update', finalEvent.title);
            } else {
                const { id, ...data } = finalEvent;
                await addDoc(eventsRef, data);
                logActivity('create', finalEvent.title);
            }
        } else {
            const existingEvent = events.find(e => e.id === finalEvent.id);
            let newEvents: SchoolEvent[];
            if (existingEvent) {
                newEvents = events.map(e => e.id === finalEvent.id ? finalEvent : e);
            } else {
                newEvents = [...events, { ...finalEvent, id: Date.now() }];
            }
            setEvents(newEvents);
            pushToHistory(newEvents);
        }

        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setSelectedDate(null);
    };

    const handleSaveSettings = async (newSettings: SchoolSettings) => {
        const updated = { ...newSettings, isSetupComplete: true };
        setSettings(updated);
        if (isFirebaseMode && currentPlannerId) {
            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updated, updatedAt: serverTimestamp() });
            logActivity('update', 'Planner instellingen');
        }
        if (isSettingsModalOpen) setIsSettingsModalOpen(false);
    };

    const handleDeleteEvent = useCallback(async (eventId: number | string) => {
        if (typeof eventId === 'string') {
             // Deleting a holiday (override)
             if (window.confirm('Wil je deze vakantie/vrije dag verwijderen?')) {
                 const updatedSettings = {
                     ...settings,
                     holidayOverrides: settings.holidayOverrides.filter(h => h.id !== eventId)
                 };
                 setSettings(updatedSettings);
                 if (isFirebaseMode && currentPlannerId) {
                     await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
                     logActivity('delete', "Vakantie/Feestdag");
                 }
                 setIsEventModalOpen(false);
             }
        } else {
            const eventToDelete = events.find(e => e.id === eventId);
            if (eventToDelete) {
                if (isFirebaseMode && currentPlannerId) {
                    await deleteDoc(doc(db, 'planners', currentPlannerId, 'events', String(eventId)));
                    logActivity('delete', eventToDelete.title);
                } else {
                    setDeletedEvents(prev => [...prev, { ...eventToDelete, deletedAt: new Date().toISOString() }]);
                    const newEvents = events.filter(e => e.id !== eventId);
                    setEvents(newEvents);
                    pushToHistory(newEvents);
                }
                setIsEventModalOpen(false);
                setOverviewModalState({ isOpen: false, eventType: null });
                setSelectedEvent(null);
            }
        }
    }, [events, isFirebaseMode, currentPlannerId, settings, logActivity]);

    const handleRestoreEvent = useCallback((eventId: number) => {
        const eventToRestore = deletedEvents.find(e => e.id === eventId);
        if (eventToRestore) {
            const { deletedAt, ...restoredEvent } = eventToRestore;
            const newEvents = [...events, restoredEvent];
            setEvents(newEvents);
            pushToHistory(newEvents);
            setDeletedEvents(prev => prev.filter(e => e.id !== eventId));
        }
    }, [deletedEvents, events, pushToHistory]);

    const handlePermanentDelete = useCallback((eventId: number) => {
        setDeletedEvents(prev => prev.filter(e => e.id !== eventId));
    }, []);

    const handleEmptyTrash = useCallback(() => {
        if (window.confirm('Weet u zeker dat u de prullenbak wilt legen? Deze actie kan niet ongedaan worden gemaakt.')) {
            setDeletedEvents([]);
        }
    }, []);

    const handleDuplicateEvent = useCallback(async (eventId: number | string) => {
        const eventToDuplicate = events.find(e => e.id === eventId);
        if (eventToDuplicate) {
            const newTitle = `${eventToDuplicate.title} (Kopie)`;
            if (isFirebaseMode && currentPlannerId) {
                const { id, ...data } = eventToDuplicate;
                await addDoc(collection(db, 'planners', currentPlannerId, 'events'), {
                    ...data,
                    title: newTitle,
                    recurrence: undefined
                });
                logActivity('create', newTitle);
            } else {
                const newEvent: SchoolEvent = {
                    ...eventToDuplicate,
                    id: Date.now(),
                    title: newTitle,
                    recurrence: undefined, 
                };
                setEvents(prev => [...prev, newEvent]);
            }
        }
    }, [events, isFirebaseMode, currentPlannerId, logActivity]);

    const handleAddTodo = async (text: string) => {
        if (isFirebaseMode && currentPlannerId) {
            await addDoc(collection(db, 'planners', currentPlannerId, 'todos'), {
                text,
                completed: false,
                createdAt: serverTimestamp()
            });
        } else {
            setTodos(prev => [{ id: Date.now(), text, completed: false }, ...prev]);
        }
    };
    const handleToggleTodo = async (id: number | string) => {
        if (isFirebaseMode && currentPlannerId) {
            const todoRef = doc(db, 'planners', currentPlannerId, 'todos', String(id));
            const todo = todos.find(t => t.id === id);
            if (todo) {
                await updateDoc(todoRef, { completed: !todo.completed });
            }
        } else {
            setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
        }
    };
    const handleDeleteTodo = async (id: number | string) => {
        if (isFirebaseMode && currentPlannerId) {
            await deleteDoc(doc(db, 'planners', currentPlannerId, 'todos', String(id)));
        } else {
            setTodos(prev => prev.filter(todo => todo.id !== id));
        }
    };
    
    const handleAddTheme = async (theme: string) => {
        const trimmedTheme = theme.trim();
        if (trimmedTheme && !settings.themes.find(t => t.toLowerCase() === trimmedTheme.toLowerCase())) {
            const updatedSettings = { ...settings, themes: [...settings.themes, trimmedTheme] };
            setSettings(updatedSettings);
            if (isFirebaseMode && currentPlannerId) {
                await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
            }
        }
    };

    const handleAddEventType = async (type: { name: string, color: string }) => {
        if (settings.eventTypes.find(et => et.name.toLowerCase() === type.name.toLowerCase())) return;
        
        const updatedSettings: SchoolSettings = {
            ...settings,
            eventTypes: [...settings.eventTypes, {
                name: type.name,
                color: type.color
            }]
        };
        setSettings(updatedSettings);
        if (isFirebaseMode && currentPlannerId) {
            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
        }
    };

    const handleUpdateEventType = async (typeName: string, updates: Partial<EventTypeConfig>) => {
        const updatedSettings: SchoolSettings = {
            ...settings,
            eventTypes: settings.eventTypes.map(et => et.name === typeName ? { ...et, ...updates } : et)
        };
        setSettings(updatedSettings);
        if (isFirebaseMode && currentPlannerId) {
            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
        }
    };

    const handleDeleteEventType = async (typeName: string) => {
        const updatedSettings = {
            ...settings,
            eventTypes: settings.eventTypes.filter(et => et.name !== typeName)
        };
        setSettings(updatedSettings);
        if (isFirebaseMode && currentPlannerId) {
            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
        }
    };

    const handleExportToCsv = () => {
        const headers = ['Titel', 'Datum', 'Type', 'Thema', 'Programma', 'Doelen'];
        const csvRows = events.map(event => {
            const goals = (event.goalIds || []).map(gid => {
                const goal = settings.goals.find(g => g.id === gid);
                return goal ? goal.title : '';
            }).filter(Boolean).join('; ');

            return [
                `"${(event.title || '').replace(/"/g, '""')}"`,
                event.date,
                event.type,
                event.theme || '',
                `"${(event.program || '').replace(/"/g, '""')}"`,
                `"${goals.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `school_planning_${academicYear.year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportToICal = () => {
        const formatICalDate = (dateStr: string) => dateStr.replace(/-/g, '');
        
        // Function to escape text for iCalendar format
        const escapeICS = (str: string = '') => {
            return str
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');
        };

        // Function to fold long lines in ICS
        const foldLine = (line: string) => {
            if (line.length <= 75) return line;
            let result = '';
            let currentLine = line;
            while (currentLine.length > 75) {
                result += currentLine.substring(0, 75) + '\r\n ';
                currentLine = currentLine.substring(75);
            }
            result += currentLine;
            return result;
        };
    
        let icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SchoolJaarPlanner//NL',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${settings.schoolName || 'Schoolplanning'}`,
            'X-WR-TIMEZONE:Europe/Amsterdam'
        ];
    
        const itemsToExport = [
            ...events,
            ...allHolidays.map(h => ({
                id: `holiday-${h.name}-${h.date}`,
                title: h.name,
                date: h.date,
                endDate: h.endDate,
                program: h.name,
                isPublic: true,
                type: 'vakantie'
            }))
        ].filter(item => viewMode === 'parent' ? (item as any).isPublic : true);

        itemsToExport.forEach((item, index) => {
            const startDate = new Date(item.date + 'T00:00:00Z');
            const endValue = item.endDate || item.date;
            const endDate = new Date(endValue + 'T00:00:00Z');
            // DTEND should be the day AFTER the event ends for all-day events
            endDate.setUTCDate(endDate.getUTCDate() + 1);

            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z';
            const cleanUid = `${item.id || 'evt'}-${index}-${item.date}`.replace(/[^a-zA-Z0-9-]/g, '');

            icalContent.push('BEGIN:VEVENT');
            icalContent.push(foldLine(`UID:${cleanUid}@schoolplanner.app`));
            icalContent.push(`DTSTAMP:${timestamp}`);
            icalContent.push(`CREATED:${timestamp}`);
            icalContent.push(`LAST-MODIFIED:${timestamp}`);
            icalContent.push(`DTSTART;VALUE=DATE:${formatICalDate(item.date)}`);
            icalContent.push(`DTEND;VALUE=DATE:${formatICalDate(endDate.toISOString().split('T')[0])}`);
            icalContent.push(foldLine(`SUMMARY:${escapeICS(item.title)}`));
            
            if (item.program) {
                icalContent.push(foldLine(`DESCRIPTION:${escapeICS(item.program)}`));
            }
            
            // Add categories if it's a specific event type
            if ((item as any).type) {
                icalContent.push(`CATEGORIES:${escapeICS((item as any).type)}`);
            }

            icalContent.push('TRANSP:TRANSPARENT'); // All-day events shouldn't block time by default
            icalContent.push('SEQUENCE:0');
            icalContent.push('END:VEVENT');
        });
    
        icalContent.push('END:VCALENDAR');
    
        const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const perspective = viewMode === 'school' ? 'intern' : 'ouders';
        const fileName = `${settings.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${settings.schoolYear}_${perspective}.ics`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportToJson = () => {
        const backupData = {
            settings,
            events,
            deletedEvents,
            todos,
            version: '1.1'
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `planner_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetData = async () => {
        if (isFirebaseMode) {
            alert("In Cloud-modus kunt u de data niet via deze knop wissen. Beheer uw planners via het gebruikersmenu.");
            return;
        }
        if (window.confirm('Weet u zeker dat u ALLE data wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };

    const handleImportFromJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') throw new Error("File content is not a string");
                const data = JSON.parse(result);
                
                if (data.version && data.settings && Array.isArray(data.events)) {
                    if (window.confirm('Weet u zeker dat u deze backup wilt importeren? Alle huidige data wordt overschreven.')) {
                        if (!data.settings.holidayOverrides) {
                            data.settings.holidayOverrides = [];
                        }

                        if (isFirebaseMode && currentPlannerId) {
                            // Sync all to Firebase
                            // 1. Settings
                            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: data.settings, updatedAt: serverTimestamp() });
                            
                            // 2. Events (Bulk upload - note: could be many, but for now we do it simple)
                            const eventsRef = collection(db, 'planners', currentPlannerId, 'events');
                            for (const evt of data.events) {
                                const { id, ...evtData } = evt;
                                await addDoc(eventsRef, evtData);
                            }

                            // 3. Todos
                            if (data.todos) {
                                const todosRef = collection(db, 'planners', currentPlannerId, 'todos');
                                for (const todo of data.todos) {
                                    const { id, ...todoData } = todo;
                                    await addDoc(todosRef, { ...todoData, createdAt: serverTimestamp() });
                                }
                            }
                            
                            logActivity('update', 'Volledige backup import');
                        } else {
                            setSettings(data.settings);
                            setEvents(data.events);
                            setDeletedEvents(data.deletedEvents || []);
                            setTodos(data.todos || []);
                        }
                        
                        setIsSettingsModalOpen(false);
                        alert('Importeren is gelukt! De gegevens zijn gesynchroniseerd.');
                    }
                } else {
                    throw new Error("Ongeldig backup-bestand.");
                }
            } catch (error) {
                console.error("Fout bij importeren:", error);
                alert(`Fout bij importeren: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
            } finally {
                if (importFileInputRef.current) {
                    importFileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleExportPoster = async () => {
        setIsGeneratingPdf(true);
        const offscreenContainer = document.createElement('div');
        offscreenContainer.style.position = 'absolute';
        offscreenContainer.style.left = '-9999px';
        offscreenContainer.style.top = '0';
        document.body.appendChild(offscreenContainer);

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Render Poster Page
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'flex flex-col h-[1122px] bg-white box-border px-12 pt-10 pb-10';
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8';
            header.innerHTML = `
                <div class="flex flex-col">
                    <h1 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">${settings.schoolName}</h1>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-widest">Jaarposter</span>
                        <span class="text-slate-400 text-xs font-medium">${settings.schoolYear}</span>
                    </div>
                </div>
            `;
            pageWrapper.appendChild(header);

            const posterContainer = document.createElement('div');
            posterContainer.className = 'flex-grow overflow-hidden';
            const root = createRoot(posterContainer);
            root.render(
                <CalendarPdfYearPoster 
                    events={events}
                    holidays={allHolidays}
                    settings={settings}
                    academicYear={academicYear}
                />
            );
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            pageWrapper.appendChild(posterContainer);

            const footer = document.createElement('div');
            footer.className = 'mt-auto pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest';
            footer.innerHTML = `
                <span>© ${settings.schoolName}</span>
                <span>Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}</span>
            `;
            pageWrapper.appendChild(footer);

            offscreenContainer.appendChild(pageWrapper);
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(pageWrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, height: 1122 });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            pdf.save(`${settings.schoolName.replace(/\s+/g, '_')}_Jaarposter_${settings.schoolYear}.pdf`);
        } catch (error) {
            console.error("Poster Export Error:", error);
            alert("Er ging iets mis bij het genereren van de poster.");
        } finally {
            document.body.removeChild(offscreenContainer);
            setIsGeneratingPdf(false);
        }
    };

    const handleExportToPdf = async (exportMode: ViewMode) => {
        setIsGeneratingPdf(true);
        const previousView = calendarView;
        setCalendarView('grid');
        
        // Wait for fonts and rendering
        await new Promise(resolve => setTimeout(resolve, 1500));

        const offscreenContainer = document.createElement('div');
        offscreenContainer.style.position = 'fixed';
        offscreenContainer.style.top = '0';
        offscreenContainer.style.left = '-4000px';
        offscreenContainer.style.width = '794px'; // A4 portrait width at 96 DPI
        offscreenContainer.style.height = '1122px'; // A4 portrait height at 96 DPI
        offscreenContainer.className = 'bg-white';
        document.body.appendChild(offscreenContainer);

        const months: Date[] = [];
        let currentMonthDate = new Date(academicYear.start);
        currentMonthDate.setUTCDate(1);
        while (currentMonthDate < academicYear.end) {
            months.push(new Date(currentMonthDate));
            currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() + 1);
        }
        
        const totalPages = (exportMode === 'school' ? months.length + 3 : months.length + 1);

        const addPdfHeader = (container: HTMLElement, title: string) => {
            const header = document.createElement('div');
            header.className = 'flex justify-between items-end pb-8 border-b-2 border-slate-900 mb-8 bg-white';
            
            const logoHtml = settings.schoolLogoUrl 
                ? `<img src="${settings.schoolLogoUrl}" class="h-10 w-auto object-contain mr-6" crossOrigin="anonymous" />` 
                : '<div class="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center mr-6"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>';

            header.innerHTML = `
                <div class="flex items-center">
                    ${logoHtml}
                    <div class="flex flex-col">
                        <h1 class="text-xl font-black text-slate-900 leading-none font-display tracking-tight uppercase">${settings.schoolName}</h1>
                        <div class="flex items-center gap-3 mt-2">
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">${settings.schoolYear}</span>
                            <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">${exportMode === 'school' ? 'Strategisch Kader' : 'Activiteitenoverzicht'}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end">
                    <span class="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1.5">Publicatie</span>
                    <span class="text-2xl font-black text-slate-900 uppercase tracking-tighter font-display leading-none">${title}</span>
                </div>
            `;
            container.appendChild(header);
        };

        const addLegendAndNotes = (container: HTMLElement) => {
            const bottomSection = document.createElement('div');
            bottomSection.className = 'grid grid-cols-4 gap-12 py-10 bg-white border-t-2 border-slate-900 mt-auto';
            
            // Legend
            const legendContainer = document.createElement('div');
            legendContainer.className = 'flex flex-col col-span-3';
            legendContainer.innerHTML = '<h3 class="text-[10px] font-black text-slate-900 mb-6 uppercase tracking-[0.3em]">Legenda Activiteiten</h3>';
            
            const legendGrid = document.createElement('div');
            legendGrid.className = 'grid grid-cols-4 gap-x-8 gap-y-4';
            
            const visibleTypes = exportMode === 'school' 
                ? settings.eventTypes 
                : settings.eventTypes.filter(type => events.some(e => e.type === type.name && e.isPublic));

            visibleTypes.forEach(type => {
                const item = document.createElement('div');
                item.className = 'flex items-center text-[9px] text-slate-700 font-black uppercase tracking-tight';
                const style = type.color ? `background-color: ${type.color}` : '';
                const bgClass = !type.color ? (type.colors?.bg || 'bg-slate-100') : '';
                
                item.innerHTML = `
                    <div class="w-2.5 h-2.5 rounded-full mr-3 shadow-sm ring-1 ring-black/5 ${bgClass}" style="${style}"></div>
                    <span class="whitespace-nowrap truncate">${type.name}</span>
                `;
                legendGrid.appendChild(item);
            });
            
            // Holiday legend
            const holidayItem = document.createElement('div');
            holidayItem.className = 'flex items-center text-[9px] text-slate-700 font-black uppercase tracking-tight';
            holidayItem.innerHTML = `
                <div class="w-2.5 h-2.5 rounded-full mr-3 bg-rose-500 shadow-sm ring-1 ring-black/5"></div>
                <span>Vakantie / Vrij</span>
            `;
            legendGrid.appendChild(holidayItem);
            legendContainer.appendChild(legendGrid);
            
            // Notes section
            const notesContainer = document.createElement('div');
            notesContainer.className = 'flex flex-col col-span-1';
            notesContainer.innerHTML = `
                <h3 class="text-[10px] font-black text-slate-900 mb-6 uppercase tracking-[0.3em]">Notities</h3>
                <div class="flex-grow border border-slate-200 rounded-2xl bg-slate-50/20 p-4 min-h-[80px]">
                    <div class="w-full h-px bg-slate-100 mb-6"></div>
                    <div class="w-full h-px bg-slate-100 mb-6"></div>
                    <div class="w-full h-px bg-slate-100 mb-6"></div>
                </div>
            `;
            
            bottomSection.appendChild(legendContainer);
            bottomSection.appendChild(notesContainer);
            container.appendChild(bottomSection);
        };

        const addPdfFooter = (container: HTMLElement, pageNum: number, totalPages: number) => {
            const footer = document.createElement('div');
            footer.className = 'pt-8 pb-4 bg-white text-slate-400 flex justify-between items-center text-[8px] uppercase tracking-[0.3em] font-black border-t border-slate-100';
            footer.innerHTML = `
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
                        </div>
                        <span class="text-slate-900 lowercase tracking-tighter">eduplan.pro</span>
                    </div>
                    <span class="text-slate-200">|</span>
                    <span>Pagina ${pageNum} van ${totalPages}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span>${settings.schoolName}</span>
                    <span class="text-slate-200">•</span>
                    <span>Document ID: ${Math.random().toString(36).substring(2, 7).toUpperCase()}</span>
                </div>
            `;
            container.appendChild(footer);
        };

        const addCoverPage = (container: HTMLElement, exportMode: ViewMode) => {
            const cover = document.createElement('div');
            cover.className = 'flex flex-col h-[1122px] bg-white box-border px-24 py-32 items-center justify-between text-center';
            
            const logoHtml = settings.schoolLogoUrl 
                ? `<img src="${settings.schoolLogoUrl}" class="h-32 w-auto object-contain mb-12" crossOrigin="anonymous" />` 
                : '<div class="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-12"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>';

            cover.innerHTML = `
                <div class="flex flex-col items-center">
                    ${logoHtml}
                    <h1 class="text-5xl font-black text-slate-900 leading-tight font-display tracking-tighter uppercase mb-4">${settings.schoolName}</h1>
                    <div class="w-24 h-2 bg-blue-600 rounded-full mb-8"></div>
                    <h2 class="text-2xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Jaarplanning</h2>
                    <h3 class="text-4xl font-black text-slate-900 uppercase tracking-widest">${settings.schoolYear}</h3>
                </div>

                <div class="flex flex-col items-center gap-6">
                    <div class="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-4">
                        <span class="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Publicatie Type</span>
                        <span class="text-lg font-bold text-slate-700 uppercase">${exportMode === 'school' ? 'Interne Strategische Planning' : 'Ouderagenda & Activiteiten'}</span>
                    </div>
                    <p class="text-slate-400 text-sm max-w-md italic">
                        "${settings.missionVision || 'Samen bouwen aan de toekomst van onze leerlingen.'}"
                    </p>
                </div>

                <div class="text-slate-300 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Gegenereerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            `;
            container.appendChild(cover);
            
            // Add legend to cover page (Page 1)
            const legendWrapper = document.createElement('div');
            legendWrapper.className = 'w-full px-24 pb-12';
            addLegendAndNotes(legendWrapper);
            container.appendChild(legendWrapper);
        };

        const addStrategicOverview = (container: HTMLElement) => {
            const page = document.createElement('div');
            page.className = 'flex flex-col h-[1122px] bg-white box-border px-16 py-16';
            
            addPdfHeader(page, 'Strategisch Kader');
            
            const content = document.createElement('div');
            content.className = 'flex-grow flex flex-col gap-12 mt-8';

            // Mission/Vision
            const mvSection = document.createElement('div');
            mvSection.className = 'bg-blue-50/50 border border-blue-100 rounded-3xl p-10';
            mvSection.innerHTML = `
                <h3 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Missie & Visie</h3>
                <p class="text-xl font-bold text-slate-700 leading-relaxed italic">
                    "${settings.missionVision || 'Geen missie/visie geformuleerd.'}"
                </p>
            `;
            content.appendChild(mvSection);

            // Goals
            const goalsSection = document.createElement('div');
            goalsSection.className = 'grid grid-cols-2 gap-8';
            
            const goalsList = document.createElement('div');
            goalsList.className = 'flex flex-col gap-4';
            goalsList.innerHTML = '<h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Jaardoelen</h3>';
            
            settings.goals.forEach(goal => {
                const item = document.createElement('div');
                item.className = 'flex items-start gap-4 bg-white border border-slate-100 rounded-xl p-4 shadow-sm';
                item.innerHTML = `
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-800">${goal.title}</span>
                        <span class="text-[10px] text-slate-500 leading-tight mt-1">${goal.description}</span>
                    </div>
                `;
                goalsList.appendChild(item);
            });
            goalsSection.appendChild(goalsList);

            // Event Types / Focus
            const focusList = document.createElement('div');
            focusList.className = 'flex flex-col gap-4';
            focusList.innerHTML = '<h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Focusgebieden</h3>';
            
            settings.eventTypes.slice(0, 6).forEach(type => {
                const item = document.createElement('div');
                item.className = 'flex items-center gap-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4';
                const bgClass = !type.color ? (type.colors?.bg || 'bg-slate-100') : '';
                const style = type.color ? `style="background-color: ${type.color}"` : '';
                item.innerHTML = `
                    <div class="w-3 h-3 rounded-full ${bgClass} border border-black/5" ${style}></div>
                    <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">${type.name}</span>
                `;
                item.innerHTML = `
                    <div class="w-3 h-3 rounded-full ${bgClass} border border-black/5" ${style}></div>
                    <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">${type.name}</span>
                `;
                focusList.appendChild(item);
            });
            goalsSection.appendChild(focusList);

            content.appendChild(goalsSection);
            page.appendChild(content);
            addPdfFooter(page, 2, totalPages);
            container.appendChild(page);
        };

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // --- PAGE 1: COVER ---
            offscreenContainer.innerHTML = '';
            addCoverPage(offscreenContainer, exportMode);
            await new Promise(resolve => setTimeout(resolve, 800));
            const coverCanvas = await html2canvas(offscreenContainer.firstChild as HTMLElement, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff', 
                width: 794, 
                height: 1122,
                onclone: (clonedDoc) => {
                    // Sanitize oklch and oklab colors from styles
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    for (let i = 0; i < styleTags.length; i++) {
                        styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                    }
                    // Force computed styles to fix any var(), oklch() or oklab()
                    const allElements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i] as HTMLElement;
                        if (el.style) {
                            const computed = window.getComputedStyle(el);
                            ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                                const val = computed.getPropertyValue(prop);
                                if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
                                    el.style.setProperty(prop, '#000000', 'important');
                                }
                            });
                        }
                    }
                }
            });
            pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.addPage();
            let currentPage = 2;

            if (exportMode === 'school') {
                // --- PAGE 2: STRATEGIC OVERVIEW ---
                offscreenContainer.innerHTML = '';
                addStrategicOverview(offscreenContainer);
                await new Promise(resolve => setTimeout(resolve, 800));
                const stratCanvas = await html2canvas(offscreenContainer.firstChild as HTMLElement, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff', 
                    width: 794, 
                    height: 1122,
                    onclone: (clonedDoc) => {
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                        }
                        const allElements = clonedDoc.getElementsByTagName('*');
                        for (let i = 0; i < allElements.length; i++) {
                            const el = allElements[i] as HTMLElement;
                            if (el.style) {
                                const computed = window.getComputedStyle(el);
                                ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                                    const val = computed.getPropertyValue(prop);
                                    if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
                                        el.style.setProperty(prop, '#000000', 'important');
                                    }
                                });
                            }
                        }
                    }
                });
                pdf.addImage(stratCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.addPage();
                currentPage++;

                // --- PAGE 3: SUMMARY CARDS ---
                offscreenContainer.innerHTML = '';
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'flex flex-col h-[1122px] bg-white box-border px-16 pt-10 pb-16';
                
                addPdfHeader(pageWrapper, 'Analyse & Kengetallen');
                
                const summaryContent = document.createElement('div');
                summaryContent.className = 'flex-grow px-12 py-4 flex flex-col gap-10';

                const summaryCards = document.getElementById('summary-cards');
                if (summaryCards) {
                    const clonedCards = summaryCards.cloneNode(true) as HTMLElement;
                    
                    const cardsGrid = clonedCards.querySelector('.grid') as HTMLElement;
                    if (cardsGrid) {
                        cardsGrid.className = 'grid grid-cols-2 gap-8 items-stretch';
                        
                        cardsGrid.querySelectorAll('button').forEach(btn => btn.remove());
                        cardsGrid.querySelectorAll('.shadow-sm').forEach(card => {
                            const c = card as HTMLElement;
                            c.style.boxShadow = 'none';
                            c.className = 'bg-slate-50 border border-slate-200 rounded-[1.5rem] p-8 flex flex-col h-full min-h-[220px]';
                            
                            const h3 = c.querySelector('h3');
                            if (h3) h3.className = 'text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6';
                            
                            const pMain = c.querySelector('p.text-3xl');
                            if (pMain) pMain.className = 'text-5xl font-black text-slate-900 mb-3';

                            const pSub = c.querySelector('p.text-xs');
                            if (pSub) pSub.className = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6';

                            // Style lists in goal coverage
                            const ul = c.querySelector('ul');
                            if (ul) {
                                ul.className = 'space-y-3 mt-2';
                                ul.querySelectorAll('li').forEach(li => {
                                    li.className = 'flex items-center gap-3 text-[11px] text-slate-700 font-bold';
                                });
                            }

                            // Handle PieChart container
                            const chartContainer = c.querySelector('.h-32');
                            if (chartContainer) {
                                (chartContainer as HTMLElement).style.height = '140px';
                                (chartContainer as HTMLElement).style.width = '100%';
                            }
                        });
                    }

                    // Style Heatmap - REMOVE from PDF summary to keep it clean
                    const heatmapContainer = clonedCards.querySelector('#year-heatmap');
                    if (heatmapContainer) {
                        heatmapContainer.remove();
                    }
                    
                    summaryContent.appendChild(clonedCards);
                }
                
                pageWrapper.appendChild(summaryContent);
                addPdfFooter(pageWrapper, currentPage, totalPages);
                offscreenContainer.appendChild(pageWrapper);

                await new Promise(resolve => setTimeout(resolve, 800));
                const canvas = await html2canvas(pageWrapper, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff', 
                    width: 794, 
                    height: 1122,
                    onclone: (clonedDoc) => {
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                        }
                        const allElements = clonedDoc.getElementsByTagName('*');
                        for (let i = 0; i < allElements.length; i++) {
                            const el = allElements[i] as HTMLElement;
                            if (el.style) {
                                const computed = window.getComputedStyle(el);
                                ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                                    const val = computed.getPropertyValue(prop);
                                    if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
                                        el.style.setProperty(prop, '#000000', 'important');
                                    }
                                });
                            }
                        }
                    }
                });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.addPage();
                currentPage++;
            }

            // --- CALENDAR PAGES (1 Month Per Page - COMBINED GRID & LIST) ---
            const pdfEvents = exportMode === 'parent' ? events.filter(e => e.isPublic) : events;

            for (let i = 0; i < months.length; i++) {
                offscreenContainer.innerHTML = '';
                
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'flex flex-col h-[1122px] bg-white box-border px-16 pt-10 pb-16';
                
                const monthDate = months[i];
                const monthName = monthDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
                
                addPdfHeader(pageWrapper, monthName);
                
                const gridContainer = document.createElement('div');
                gridContainer.style.height = '520px'; // More compact grid for PDF
                gridContainer.className = 'flex flex-col mb-10 overflow-hidden';
                
                const gridRoot = createRoot(gridContainer);
                gridRoot.render(
                    <CalendarPdfGridView 
                        monthDate={monthDate}
                        events={pdfEvents}
                        holidays={allHolidays}
                        settings={settings}
                        onDayClick={() => {}}
                        onEventClick={() => {}}
                        onEventDrop={() => {}}
                        onEventMove={() => {}}
                        onDuplicateEvent={() => {}}
                        onDeleteEvent={() => {}}
                        academicYear={academicYear}
                        warnings={[]}
                        calendarView="grid-1"
                    />
                );
                
                const listContainer = document.createElement('div');
                listContainer.className = 'flex flex-col overflow-hidden';
                const listRoot = createRoot(listContainer);
                listRoot.render(
                    <CalendarPdfMonthlyEvents
                        monthDate={monthDate}
                        events={pdfEvents}
                        holidays={allHolidays}
                        settings={settings}
                    />
                );

                // Wait for React to render both parts
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                pageWrapper.appendChild(gridContainer);
                pageWrapper.appendChild(listContainer);
                
                const spacer = document.createElement('div');
                spacer.className = 'flex-grow';
                pageWrapper.appendChild(spacer);

                addPdfFooter(pageWrapper, currentPage, totalPages);
                offscreenContainer.appendChild(pageWrapper);

                await new Promise(resolve => setTimeout(resolve, 1000));
                const canvas = await html2canvas(pageWrapper, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff', 
                    width: 794, 
                    height: 1122,
                    onclone: (clonedDoc) => {
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#000000');
                        }
                        const allElements = clonedDoc.getElementsByTagName('*');
                        for (let i = 0; i < allElements.length; i++) {
                            const el = allElements[i] as HTMLElement;
                            if (el.style) {
                                const computed = window.getComputedStyle(el);
                                ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                                    const val = computed.getPropertyValue(prop);
                                    if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
                                        el.style.setProperty(prop, '#000000', 'important');
                                    }
                                });
                            }
                        }
                    }
                });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdfWidth, pdfHeight);
                if (i < months.length - 1) pdf.addPage();
                currentPage++;
            }

            const perspective = exportMode === 'school' ? 'intern' : 'ouders';
            pdf.save(`${settings.schoolName.replace(/\s+/g, '_')}_${settings.schoolYear}_${perspective}.pdf`);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Er is een fout opgetreden bij het genereren van de PDF.');
        } finally {
            document.body.removeChild(offscreenContainer);
            setCalendarView(previousView);
            setIsGeneratingPdf(false);
        }
    };
    
    const handleAIImport = (newEvents: SchoolEvent[]) => {
        setEvents(prev => [...prev, ...newEvents]);
    };

    const handleAddEventsFromAI = (newEvents: SchoolEvent[]) => {
        // First, identify any new event types that need to be added to settings
        const newTypes: EventTypeConfig[] = [];
        newEvents.forEach(event => {
            const typeExistsInSettings = settings.eventTypes.some(t => t.name === event.type);
            const typeExistsInNewTypes = newTypes.some(t => t.name === event.type);
            
            if (!typeExistsInSettings && !typeExistsInNewTypes) {
                newTypes.push({
                    name: event.type,
                    colors: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
                });
            }
        });

        if (newTypes.length > 0) {
            setSettings(prev => ({
                ...prev,
                eventTypes: [...prev.eventTypes, ...newTypes]
            }));
        }

        setEvents(prev => {
            const updatedEvents = [...prev];
            let nextId = Math.max(0, ...updatedEvents.map(e => e.id || 0)) + 1;
            
            newEvents.forEach(newEvent => {
                updatedEvents.push({
                    ...newEvent,
                    id: nextId++
                });
            });
            return updatedEvents;
        });
    };

    const handleImportGoals = (data: { goals: SchoolGoal[], themes: string[] }) => {
        setSettings(prev => ({
            ...prev,
            goals: [...prev.goals, ...data.goals],
            themes: Array.from(new Set([...prev.themes, ...data.themes]))
        }));
    };

    const handleRequestAddGoal = () => {
        setSettingsModalInitialFocus('goals');
        setIsSettingsModalOpen(true);
    };

    const handleGoToDate = useCallback((date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const monthId = `month-${date.getUTCFullYear()}-${date.getUTCMonth()}`;
        const dayId = `day-${dateStr}`;
        
        setOverviewModalState({ isOpen: false, eventType: null });
        
        const monthElement = document.getElementById(monthId);
        if (monthElement) {
            monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            setTimeout(() => {
                const dayElement = document.getElementById(dayId);
                if (dayElement) {
                    dayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    dayElement.classList.add('ring-4', 'ring-blue-500', 'ring-inset', 'z-20');
                    setTimeout(() => {
                        dayElement.classList.remove('ring-4', 'ring-blue-500', 'ring-inset', 'z-20');
                    }, 3000);
                }
            }, 500);
        }
    }, []);

    const handleSchoolYearChange = async (newYear: string) => {
        const updatedSettings = { ...settings, schoolYear: newYear };
        setSettings(updatedSettings);
        if (isFirebaseMode && currentPlannerId) {
            try {
                await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
                logActivity('update', `Schooljaar gewijzigd naar ${newYear}`);
            } catch (error) {
                console.error("Fout bij opslaan schooljaar:", error);
            }
        }
    };

    if (isAuthLoading && isFirebaseMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-[#F8FAFC]'}`}>
            {isGeneratingPdf && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-lg font-semibold flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p>PDF wordt voorbereid...</p>
                        <p className="text-sm text-slate-500 font-normal">Grote bestanden kunnen even duren.</p>
                    </div>
                </div>
            )}

            <OnboardingTour 
                isOpen={showTour} 
                onComplete={handleTourComplete} 
            />

            <AIChatSidebar 
                isOpen={isAIChatOpen} 
                onClose={() => setIsAIChatOpen(false)} 
                events={events}
                settings={settings}
                onAddEvents={handleAddEventsFromAI}
            />

            <AnimatePresence>
                {isWorkloadOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b bg-slate-50">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Werkdruk Analyse</h2>
                                <button onClick={() => setIsWorkloadOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="h-6 w-6 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto">
                                <WorkloadOverview events={events} settings={settings} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isInspectionOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b bg-slate-50">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kwaliteitsrapportage</h2>
                                <button onClick={() => setIsInspectionOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="h-6 w-6 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto">
                                <InspectionReport 
                                    events={filteredEvents} 
                                    onEventClick={(event) => {
                                        handleEventClick(event);
                                        setIsInspectionOpen(false);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {!isEmbedMode && (
                <Header 
                    id="main-header"
                    headerRef={headerRef}
                    isScrolled={isScrolled}
                    viewMode={viewMode} 
                    onViewModeChange={setViewMode} 
                    onShowSettings={() => setIsSettingsModalOpen(true)} 
                    settings={settings}
                    onExportICal={() => startExportFlow('ics')}
                    onExportJson={() => startExportFlow('json')}
                    onImportJson={handleImportClick}
                    onExportPdf={(mode) => startExportFlow('pdf', mode)}
                    onExportPoster={() => startExportFlow('poster')}
                    onExportCsv={() => startExportFlow('csv')}
                    onShowICal={() => setIsICalModalOpen(true)}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    showSaveIndicator={showSaveIndicator}
                    warnings={warnings}
                    onShowTrash={() => setIsTrashModalOpen(true)}
                    calendarView={calendarView}
                    onCalendarViewChange={setCalendarView}
                    onSchoolYearChange={handleSchoolYearChange}
                    onGoToToday={handleGoToToday}
                    onToggleTodoPanel={() => setIsTodoPanelOpen(prev => !prev)}
                    onStartTour={handleStartTourManually}
                    onShowAIImport={() => setIsAIImportModalOpen(true)}
                    onShowBulkAdd={() => setIsBulkAddOpen(true)}
                    onToggleAIChat={() => setIsAIChatOpen(prev => !prev)}
                    onShowWorkload={() => setIsWorkloadOpen(true)}
                    onShowInspection={() => setIsInspectionOpen(true)}
                    onShowRoadmap={() => setIsRoadmapOpen(true)}
                    onShowAudit={() => setIsAuditOpen(true)}
                    onShowHeatmap={() => setIsHeatmapOpen(true)}
                    onShowConflictAssistant={() => setIsConflictAssistantOpen(true)}
                    onSearchChange={setSearchQuery}
                    onResetPlanning={resetPlanning}
                    uniqueConflictsCount={uniqueConflicts.length}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                    // Firebase Props
                    user={user}
                    isFirebaseMode={isFirebaseMode}
                    onToggleMode={toggleMode}
                    onLogin={loginWithGoogle}
                    onLogout={logout}
                    onInviteClick={() => setIsInviteModalOpen(true)}
                    planners={planners}
                    currentPlannerId={currentPlannerId}
                    onPlannerChange={setCurrentPlannerId}
                    onCreatePlanner={handleCreatePlanner}
                    activeUsers={activeUsers}
                    onShowActivityLog={() => setIsActivityLogOpen(true)}
                    onShowHelp={() => setIsHelpModalOpen(true)}
                    onShowShare={() => setIsShareModalOpen(true)}
                    validations={{
                        fourDayWeek: fourDayWeekValidation
                    }}
                />
            )}
            <input
                type="file"
                ref={importFileInputRef}
                className="hidden"
                accept="application/json"
                onChange={handleImportFromJson}
            />

            <AnimatePresence>
                {isExportValidationOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="h-8 w-8 text-amber-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Check voor export</h2>
                                <p className="text-slate-500 text-sm">We vonden een aantal punten die je plan nog beter kunnen maken voor de export.</p>
                            </div>
                            
                            <div className="px-8 py-4 max-h-[300px] overflow-y-auto space-y-3">
                                {exportValidationItems.map(item => (
                                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Item: {item.title}</span>
                                            <span className="text-xs text-slate-700 font-bold">{item.reason}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 flex flex-col gap-3">
                                <button
                                    onClick={() => setIsExportValidationOpen(false)}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    Planing Verbeteren
                                </button>
                                <button
                                    onClick={() => executeExport(pendingExportType!, pendingViewMode!)}
                                    className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg transition-all"
                                >
                                    Toch Exporteren
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedEventIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-4 flex items-center gap-6"
                    >
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black">
                                {selectedEventIds.length}
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Geselecteerd</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBatchDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                                Verwijderen
                            </button>

                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Type Aanpassen
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 w-48 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all origin-bottom-left">
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {settings.eventTypes.map(type => (
                                            <button
                                                key={type.name}
                                                onClick={() => handleBatchChangeType(type.name)}
                                                className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-bold flex items-center gap-2"
                                            >
                                                <div 
                                                    className={`w-2 h-2 rounded-full ${!type.color ? (type.colors?.bg || 'bg-slate-500') : ''}`} 
                                                    style={type.color ? { backgroundColor: type.color } : undefined}
                                                />
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedEventIds([])}
                            className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all"
                            title="Deselecteren"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isICalModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-main)]"
                        >
                            <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-sidebar)]">
                                <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Agenda Koppelen</h2>
                                <button onClick={() => setIsICalModalOpen(false)} className="p-2 hover:bg-[var(--bg-sidebar)] rounded-full transition-colors">
                                    <X className="h-6 w-6 text-[var(--text-muted)]" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <CalendarIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-blue-900 dark:text-blue-300">Live Agenda Koppeling</h3>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">Importeer je schoolplanning direct in Google, Outlook of Apple Agenda.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--bg-sidebar)] text-[var(--text-muted)] flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-main)]">Download het .ics bestand</p>
                                            <p className="text-xs text-[var(--text-muted)]">Klik op de knop hieronder om de huidige planning te downloaden.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[var(--bg-sidebar)] text-[var(--text-muted)] flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-main)]">Importeer in je agenda</p>
                                            <p className="text-xs text-[var(--text-muted)]">Ga naar je agenda-instellingen en kies 'Bestand importeren'.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 flex gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed">
                                            <strong>Let op:</strong> Omdat dit een lokale app is zonder cloud-sync, moet je het bestand opnieuw downloaden en importeren als je wijzigingen aanbrengt. 
                                            <em> (Cloud-synchronisatie komt in een volgende update!)</em>
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        handleExportToICal();
                                        setIsICalModalOpen(false);
                                    }}
                                    className="w-full py-4 bg-blue-600 dark:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg transition-all transform hover:scale-[1.02]"
                                >
                                    Download .ics Bestand
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isShortcutsHelpOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex justify-center items-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Keyboard className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sneltoetsen</h2>
                                </div>
                                <button onClick={() => setIsShortcutsHelpOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {[
                                    { key: '?', label: 'Sneltoetsen overzicht' },
                                    { key: 'A', label: 'Nieuw evenement toevoegen' },
                                    { key: 'C', label: 'AI Assistent openen/sluiten' },
                                    { key: 'T', label: 'Takenlijst openen/sluiten' },
                                    { key: 'S', label: 'Instellingen openen' },
                                    { key: 'F', label: 'Zoeken / Filteren' },
                                    { key: 'Esc', label: 'Sluit alles / Focus verlies' },
                                ].map((item) => (
                                    <div key={item.key} className="flex justify-between items-center group">
                                        <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                                        <kbd className="px-2 py-1 bg-slate-100 border-b-2 border-slate-300 rounded text-xs font-mono font-bold text-slate-800 min-w-[32px] text-center group-hover:bg-blue-50 group-hover:border-blue-300 transition-colors">
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-blue-50 text-center">
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Tip: Gebruik deze toetsen voor maximale snelheid</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <HealthCheckModal 
                isOpen={isHealthCheckOpen}
                onClose={() => setIsHealthCheckOpen(false)}
                events={events}
                settings={settings}
                onEventClick={handleEventClick}
            />

            <main className="flex-grow max-w-[1920px] mx-auto w-full relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col md:flex-row min-h-screen"
                    >
                        {!isEmbedMode && (
                            <EventPalette
                                id="event-palette"
                                settings={settings}
                                filters={filters} 
                                onFilterChange={setFilters} 
                                eventCounts={eventCounts} 
                                highlightedType={highlightedType}
                                onToggleHighlight={setHighlightedType}
                                onAddNewItem={handleAddNewItem}
                                onAddEventByType={handleCreateFromOverview}
                                onOpenOverview={handleOpenOverview}
                                onAddTheme={handleAddTheme}
                                onAddEventType={handleAddEventType}
                                onUpdateEventType={handleUpdateEventType}
                                onDeleteEventType={handleDeleteEventType}
                                onGoToDate={handleGoToDate}
                            />
                        )}

                        <div className="flex-1 relative bg-white"> 
                             {viewMode === 'parent' && (
                                 <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                     <AlertCircle className="h-3 w-3" />
                                     Ouderweergave Actief: Alleen publieke items zijn zichtbaar
                                 </div>
                             )}
                             <div id="main-content-wrapper">
                                 {!isEmbedMode && (
                                     <div className={`transition-all duration-300 px-4 sm:px-6 lg:px-8 py-2 sticky top-[73px] z-30 ${isScrolled ? 'bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border-main)]' : 'bg-[var(--bg-main)]'}`}>
                                         <CompactSummaryBar 
                                            qualityScore={qualityScore}
                                            reliabilityScore={reliabilityScore}
                                            teachingDays={teachingNormValidation.teachingDays}
                                            teachingHours={teachingNormValidation.totalTeachingHours}
                                            shortWeeksCount={fourDayWeekValidation.count}
                                            shortWeeksLimit={fourDayWeekValidation.limit}
                                            studyDaysCount={events.filter(e => e.type === 'Studiedag').length}
                                            goalsCount={settings.goals.length}
                                            coveredGoalsCount={settings.goals.filter(goal => events.some(e => e.goalIds?.includes(goal.id))).length}
                                            isVO={settings.schoolType === 'VO'}
                                            onToggleDashboard={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
                                            isDashboardOpen={!isDashboardCollapsed}
                                            onShowHealthCheck={() => setIsHealthCheckOpen(true)}
                                             onShowShortenedWeeks={() => setIsShortenedWeeksOpen(true)}
                                             onShowSettings={(section) => {
                                                 setSettingsModalInitialFocus(section || null);
                                                 setIsSettingsModalOpen(true);
                                             }}
                                             onShowAIImport={() => setIsAIImportModalOpen(true)}
                                             onShowBulkAdd={() => setIsBulkAddOpen(true)}
                                          />
                                     </div>
                                 )}

                                 {!isEmbedMode && !isDashboardCollapsed && (
                                     <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 sm:px-6 lg:px-8 py-4 overflow-hidden border-b border-[var(--border-main)] bg-[var(--bg-sidebar)]/30"
                                     >
                                        <SummaryCards 
                                            id="summary-cards"
                                            events={currentYearEvents} 
                                            holidays={allHolidays} 
                                            settings={settings} 
                                            academicYear={academicYear} 
                                            validations={{ 
                                                fourDayWeek: fourDayWeekValidation,
                                                teachingNorm: teachingNormValidation
                                            }}
                                            selectedGoalId={selectedGoalId}
                                            onAddGoalClick={handleRequestAddGoal}
                                            onShowSettings={(section) => {
                                                setSettingsModalInitialFocus(section);
                                                setIsSettingsModalOpen(true);
                                            }}
                                            onShowOverview={(type) => setOverviewModalState({ isOpen: true, eventType: type })}
                                            onMonthClick={(date) => {
                                                const monthId = `month-${date.getUTCFullYear()}-${date.getUTCMonth()}`;
                                                const element = document.getElementById(monthId);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            onGoalClick={(goalId) => setSelectedGoalId(goalId)}
                                            onGoToDate={handleGoToDate}
                                            onShowHealthCheck={() => setIsHealthCheckOpen(true)}
                                            onShowShortenedWeeks={() => setIsShortenedWeeksOpen(true)}
                                        />
                                    </motion.div>
                                )}
                                
                                <div className="p-4 sm:p-5 lg:p-6">
                                    {!isEmbedMode && !isDashboardCollapsed && (
                                        <div className="mb-8 flex flex-col lg:flex-row items-stretch gap-6">
                                            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center justify-between group">
                                                <div className="flex items-center gap-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Plan Kwaliteit</span>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32 sm:w-48 h-2.5 bg-slate-900/5 rounded-full overflow-hidden shadow-inner">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${qualityScore}%` }}
                                                                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                                                                    className={`h-full shadow-sm transition-all duration-1000 ${qualityScore > 70 ? 'bg-emerald-500' : qualityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                ></motion.div>
                                                            </div>
                                                            <span className={`text-xl font-black tracking-tighter ${qualityScore > 70 ? 'text-emerald-600' : qualityScore > 40 ? 'text-amber-600' : 'text-rose-600'}`}>{qualityScore}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-12 w-px bg-slate-100 hidden xl:block" />
                                                    <div className="hidden xl:flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Status</span>
                                                        <p className="text-xs font-bold text-slate-600">
                                                            {qualityScore > 80 ? 'Audit proof' : qualityScore > 50 ? 'In ontwikkeling' : 'Startfase'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-black text-slate-900 tracking-tighter">{events.length}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activiteiten</span>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-100" />
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-black text-slate-900 tracking-tighter">{settings.goals.length}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Doelen</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setIsConflictAssistantOpen(true)}
                                                className="lg:w-72 bg-slate-900 dark:bg-slate-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                                            >
                                                <div className="absolute -right-4 -bottom-4 text-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110">
                                                    <Sparkles size={120} />
                                                </div>
                                                <div className="relative z-10 flex flex-col h-full w-full">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2 bg-white/10 rounded-xl">
                                                            <Sparkles size={18} className="text-amber-400" />
                                                        </div>
                                                        {uniqueConflicts.length > 0 && (
                                                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                                                {uniqueConflicts.length} ACTIE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-white/90">Conflict Assistent</h4>
                                                        <p className="text-[10px] text-white/50 mt-1 font-medium">Optimaliseer je planning</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    <Calendar 
                                        events={filteredEvents}
                                        holidays={allHolidays}
                                        highlightedType={highlightedType}
                                        searchTerm={searchQuery}
                                        onDayClick={handleDayClick}
                                        onEventClick={handleEventClick}
                                        onEventDrop={handleEventDrop}
                                        onEventMove={handleMoveEvent}
                                        onDuplicateEvent={handleDuplicateEvent}
                                        onDeleteEvent={handleDeleteEvent}
                                        onUpdateEvent={handleSaveEvent}
                                        academicYear={academicYear}
                                        settings={settings}
                                        warnings={warnings}
                                        calendarView={calendarView}
                                        isDragging={isDragging}
                                        goToTodayTrigger={goToTodayTrigger}
                                        selectedEventIds={selectedEventIds}
                                        onToggleSelection={toggleEventSelection}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            <HeatmapModal 
                isOpen={isHeatmapOpen}
                onClose={() => setIsHeatmapOpen(false)}
                events={events}
                settings={settings}
                academicYear={academicYear}
                onMonthClick={(date) => {
                    const monthId = `month-${date.getUTCFullYear()}-${date.getUTCMonth()}`;
                    const element = document.getElementById(monthId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }}
            />

            <AIImportModal 
                isOpen={isAIImportModalOpen}
                onClose={() => setIsAIImportModalOpen(false)}
                onImport={handleAIImport}
                onImportGoals={handleImportGoals}
                settings={settings}
                existingEvents={events}
            />

            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => {
                    setIsSettingsModalOpen(false);
                    setSettingsModalInitialFocus(null);
                }}
                settings={settings}
                onSave={handleSaveSettings}
                onSyncHolidays={async () => {
                    const updatedSettings = { ...settings, holidayOverrides: [] };
                    setSettings(updatedSettings);
                    if (isFirebaseMode && currentPlannerId) {
                        try {
                            await updateDoc(doc(db, 'planners', currentPlannerId), { settings: updatedSettings, updatedAt: serverTimestamp() });
                            logActivity('update', "Holidays gesynchroniseerd/gereset");
                        } catch (error) {
                            console.error("Fout bij sync holidays:", error);
                        }
                    }
                }}
                initialFocus={settingsModalInitialFocus}
                onImportBackup={handleImportClick}
                onExportBackup={handleExportToJson}
                onResetData={handleResetData}
            />

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={(id) => handleDeleteEvent(id)}
                event={selectedEvent}
                date={selectedDate}
                viewMode={viewMode}
                settings={settings}
                allHolidays={allHolidays}
                onOpenGoals={() => {
                    setIsEventModalOpen(false);
                    setIsSettingsModalOpen(true);
                    setSettingsModalInitialFocus('goals');
                }}
                onOpenAIImport={() => {
                    setIsEventModalOpen(false);
                    setIsAIImportModalOpen(true);
                }}
            />

            <TrashModal
                isOpen={isTrashModalOpen}
                onClose={() => setIsTrashModalOpen(false)}
                deletedEvents={deletedEvents}
                onRestore={handleRestoreEvent}
                onPermanentDelete={handlePermanentDelete}
                onEmptyTrash={handleEmptyTrash}
                isFirebaseMode={isFirebaseMode}
            />

            {overviewModalState.isOpen && overviewModalState.eventType && (
                 <OverviewModal
                    isOpen={overviewModalState.isOpen}
                    onClose={() => setOverviewModalState({isOpen: false, eventType: null})}
                    eventType={overviewModalState.eventType}
                    events={overviewModalState.eventType === 'Vakantie' 
                        ? [
                            ...currentYearEvents.filter(e => e.type === 'Vakantie'),
                            ...allHolidays.filter(h => h.type === 'vakantie').map(h => ({
                                id: h.id as any,
                                title: h.name,
                                type: 'Vakantie',
                                date: h.date,
                                endDate: h.endDate,
                                isPublic: true
                            }))
                          ]
                        : currentYearEvents.filter(e => e.type === overviewModalState.eventType)}
                    goals={settings.goals}
                    settings={settings}
                    onAdd={() => handleCreateFromOverview(overviewModalState.eventType!)}
                    onEdit={handleEditFromOverview}
                    onGoToDate={handleGoToDate}
                />
            )}

            <TodoPanel
                isOpen={isTodoPanelOpen}
                onClose={() => setIsTodoPanelOpen(false)}
                items={todos}
                onAdd={handleAddTodo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
            />

            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInviteByEmail}
                collaborators={[]} // This would be fetched from the planner doc
            />

            <ActivityLogModal
                isOpen={isActivityLogOpen}
                onClose={() => setIsActivityLogOpen(false)}
                activities={activities}
            />

            <HelpModal 
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
                onStartTour={() => setShowTour(true)}
            />
            <ConflictAssistant
                isOpen={isConflictAssistantOpen}
                onClose={() => setIsConflictAssistantOpen(false)}
                events={filteredEvents}
                settings={settings}
                validations={{
                    fourDayWeek: fourDayWeekValidation,
                    teachingNorm: teachingNormValidation
                }}
                onGoToEvent={(id) => {
                    const element = document.getElementById(`event-${id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setIsConflictAssistantOpen(false);
                    }
                }}
            />
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                schoolName={settings.schoolName}
            />
            <BulkAddModal
                isOpen={isBulkAddOpen}
                onClose={() => setIsBulkAddOpen(false)}
                onAddEvents={handleBulkAdd}
            />
            <ShortenedWeeksModal
                isOpen={isShortenedWeeksOpen}
                onClose={() => setIsShortenedWeeksOpen(false)}
                weeks={fourDayWeekValidation.details || []}
                onGoToDate={handleGoToDate}
            />

            {isRoadmapOpen && (
                <RoadmapView 
                    events={events}
                    settings={settings}
                    academicYear={academicYear}
                    onClose={() => setIsRoadmapOpen(false)}
                />
            )}

            <AuditAssistant 
                isOpen={isAuditOpen}
                onClose={() => setIsAuditOpen(false)}
                events={events}
                settings={settings}
            />
        </div>
    );
};

export default App;
