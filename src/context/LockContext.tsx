import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {NativeModules, Alert} from 'react-native';

const {ScreenTimeManager} = NativeModules;

// ── Week tracking utilities ───────────────────────────────────────────────────
const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // shift to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getWeeklyVisitCount = (dates: string[]): number => {
  const weekStart = getWeekStart(new Date());
  const wStart = new Date(weekStart + 'T00:00:00');
  const wEnd = new Date(weekStart + 'T00:00:00');
  wEnd.setDate(wEnd.getDate() + 6);
  return dates.filter(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt >= wStart && dt <= wEnd;
  }).length;
};

export type LockStatus = 'unauthorized' | 'idle' | 'locked' | 'unlocked';

export interface LockContextType {
  status: LockStatus;
  selectedAppCount: number;
  lockedAt: Date | null;
  elapsedSeconds: number;
  screenTimeAuthorized: boolean;
  isLoading: boolean;
  weeklyGoal: number;
  weeklyVisits: number;
  gymVisitDates: string[];
  currentStreak: number;
  gymDays: number[];
  lockStartTime: string;
  lockEndTime: string;
  setWeeklyGoal: (days: number) => void;
  setGymDays: (days: number[]) => void;
  setLockTimes: (start: string, end: string) => void;
  requestAuthorization: () => Promise<void>;
  selectApps: () => Promise<void>;
  lockApps: () => Promise<void>;
  unlockApps: () => Promise<void>;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export const useLock = (): LockContextType => {
  const ctx = useContext(LockContext);
  if (!ctx) {throw new Error('useLock must be used within LockProvider');}
  return ctx;
};

export const LockProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [status, setStatus] = useState<LockStatus>('unauthorized');
  const [selectedAppCount, setSelectedAppCount] = useState(0);
  const [lockedAt, setLockedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [screenTimeAuthorized, setScreenTimeAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [weeklyGoal, setWeeklyGoalState] = useState(3);
  const [gymVisitDates, setGymVisitDates] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [gymDays, setGymDaysState] = useState<number[]>([1, 2, 3, 4, 5]);
  const [lockStartTime, setLockStartTime] = useState('06:00');
  const [lockEndTime, setLockEndTime] = useState('22:00');

  // Tick elapsed time while locked
  useEffect(() => {
    if (status === 'locked' && lockedAt) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - lockedAt.getTime()) / 1000),
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) {clearInterval(timerRef.current);}
    };
  }, [status, lockedAt]);

  const requestAuthorization = useCallback(async () => {
    setIsLoading(true);
    try {
      await ScreenTimeManager.requestAuthorization();
      setScreenTimeAuthorized(true);
      setStatus('idle');
    } catch (e: any) {
      Alert.alert('Authorization Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await ScreenTimeManager.showAppPicker();
      setSelectedAppCount(count);
      // Auto-lock immediately — apps stay locked until gym proof is submitted
      if (count > 0) {
        await ScreenTimeManager.lockApps();
        setStatus('locked');
        setLockedAt(new Date());
      }
    } catch (e: any) {
      Alert.alert('App Picker Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lockApps = useCallback(async () => {
    if (selectedAppCount === 0) {
      Alert.alert(
        'No Apps Selected',
        'Please select apps to lock first.',
      );
      return;
    }
    setIsLoading(true);
    try {
      await ScreenTimeManager.lockApps();
      setStatus('locked');
      setLockedAt(new Date());
    } catch (e: any) {
      Alert.alert('Lock Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAppCount]);

  const unlockApps = useCallback(async () => {
    setIsLoading(true);
    try {
      await ScreenTimeManager.unlockApps();
      setStatus('unlocked');
      setLockedAt(null);
      // Record today as a gym visit (one entry per day max)
      const today = new Date().toISOString().split('T')[0];
      setGymVisitDates(prev => {
        if (prev.includes(today)) {return prev;}
        const updated = [...prev, today];
        // Completing the weekly goal increments the streak
        if (getWeeklyVisitCount(updated) === weeklyGoal) {
          setCurrentStreak(s => s + 1);
        }
        return updated;
      });
    } catch (e: any) {
      Alert.alert('Unlock Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [weeklyGoal]);

  const weeklyVisits = getWeeklyVisitCount(gymVisitDates);

  const setWeeklyGoal = useCallback((days: number) => {
    setWeeklyGoalState(Math.max(1, Math.min(7, days)));
  }, []);

  const setGymDays = useCallback((days: number[]) => {
    setGymDaysState(days);
  }, []);

  const setLockTimes = useCallback((start: string, end: string) => {
    setLockStartTime(start);
    setLockEndTime(end);
  }, []);

  return (
    <LockContext.Provider
      value={{
        status,
        selectedAppCount,
        lockedAt,
        elapsedSeconds,
        screenTimeAuthorized,
        isLoading,
        weeklyGoal,
        weeklyVisits,
        gymVisitDates,
        currentStreak,
        gymDays,
        lockStartTime,
        lockEndTime,
        setWeeklyGoal,
        setGymDays,
        setLockTimes,
        requestAuthorization,
        selectApps,
        lockApps,
        unlockApps,
      }}>
      {children}
    </LockContext.Provider>
  );
};
