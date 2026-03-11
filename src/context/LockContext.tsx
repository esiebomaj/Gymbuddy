import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {NativeModules, Alert} from 'react-native';
import {useAuth} from './AuthContext';
import {
  fetchSettings,
  fetchStats,
  updateSettings as apiUpdateSettings,
  submitVisit,
  ApiError,
} from '../services/api';
import type {
  StatsResponse,
  SettingsResponse,
  SettingsUpdate,
} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {ScreenTimeManager} = NativeModules;

export type LockStatus = 'locked' | 'unlocked';

const DEFAULT_SETTINGS: SettingsResponse = {
  weekly_goal: 3,
  gym_days: [1, 2, 3, 4, 5],
  lock_start_time: '06:00',
  lock_end_time: '23:59',
};

const DEFAULT_STATS: StatsResponse = {
  weekly_visits: 0,
  matching_weekly_visits: 0,
  weekly_goal: 3,
  current_streak: 0,
  longest_streak: 0,
  total_visits: 0,
  visited_today: false,
  visit_dates_this_week: [],
  matching_visit_dates_this_week: [],
};

export interface LockContextType {
  status: LockStatus;
  selectedAppCount: number;
  lockedAt: Date | null;
  elapsedSeconds: number;
  screenTimeAuthorized: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  settings: SettingsResponse;
  stats: StatsResponse;
  updateSettings: (patch: SettingsUpdate) => Promise<void>;
  requestAuthorization: () => Promise<void>;
  selectApps: () => Promise<void>;
  submitProof: (workoutType: string, note?: string, photoUri?: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

function shouldLockApps(
  settings: SettingsResponse,
  visitedToday: boolean,
): boolean {

  if (visitedToday) {return false;}

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  if (!settings.gym_days.includes(currentDay)) {return false;}

  const [startH, startM] = settings.lock_start_time.split(':').map(Number);
  const [endH, endM] = settings.lock_end_time.split(':').map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  return current >= start && current <= end;
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
  const {session, user} = useAuth();
  const token = session?.access_token;
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<LockStatus>('unlocked');
  const [selectedAppCount, setSelectedAppCount] = useState(0);
  const [lockedAt, setLockedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [screenTimeAuthorized, setScreenTimeAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedAtRestoredForUserId = useRef<string | null>(null);

  const [settings, setSettings] = useState<SettingsResponse>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<StatsResponse>(DEFAULT_STATS);

  // ── Check Screen Time authorization on mount ─────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const result = await ScreenTimeManager.checkAuthorizationStatus();
        if (result === 'approved') {
          setScreenTimeAuthorized(true);
          // Restore persisted app selection count so lockApps() works without re-picking.
          // Prefer the shielded count (actively locked) over the saved selection.
          const shieldedCount: number = await ScreenTimeManager.getShieldedAppCount();
          if (shieldedCount > 0) {
            setSelectedAppCount(shieldedCount);
            setStatus('locked');
          } else {
            const selectedCount: number = await ScreenTimeManager.getSelectedAppCount();
            setSelectedAppCount(selectedCount);
          }
          // Actual lock/unlock is handled by the scheduling effect once hydrated.
        }
      } catch {
        // iOS < 16 or module unavailable — leave as unauthorized
      }
    })();
  }, []);

  // Fetch data from backend
  useEffect(() => {
    if (!token) {return;}

    let cancelled = false;

    (async () => {
      try {
        const [s, st] = await Promise.all([
          fetchSettings(token),
          fetchStats(token),
        ]);
        if (cancelled) {return;}
        setSettings(s);
        setStats(st);
      } catch (e) {
        console.warn('LockContext hydration failed:', e);
      } finally {
        if (!cancelled) {setIsHydrated(true);}
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // ── Auto-lock / unlock based on schedule ────────────────────────────────────

  useEffect(() => {
    if (!isHydrated || !screenTimeAuthorized || selectedAppCount === 0) {return;}

    const evaluate = async () => {
      const shouldLock = shouldLockApps(settings, stats.visited_today);
      try {
        const shieldedCount: number =
        await ScreenTimeManager.getShieldedAppCount();
        const isCurrentlyLocked = shieldedCount > 0;

        if (shouldLock && !isCurrentlyLocked) {
          await ScreenTimeManager.lockApps();
          setStatus('locked');
          setLockedAt(new Date());
        } else if (!shouldLock && isCurrentlyLocked) {
          await ScreenTimeManager.unlockApps();
          setStatus('unlocked');
          setLockedAt(null);
        } else if (isCurrentlyLocked) {
          setStatus('locked');
          setLockedAt(prev => prev ?? new Date());
        }
        // If not locked and shouldn't be, leave status as 'unlocked'
      } catch (e) {
        console.warn('Lock schedule evaluation failed:', e);
      }
    };

    evaluate();
    const interval = setInterval(evaluate, 60_000);
    return () => clearInterval(interval);
  }, [
    isHydrated, 
    screenTimeAuthorized, 
    selectedAppCount, 
    settings, 
    settings.gym_days,
    settings.lock_start_time,
    settings.lock_end_time,
    stats.visited_today,
  ]);

  // Persist lockedAt per user: restore once per user, then sync on change
  useEffect(() => {
    if (userId == null) {
      lockedAtRestoredForUserId.current = null;
      return;
    }

    const storageKey = `lockedAt_${userId}`;

    if (lockedAtRestoredForUserId.current !== userId) {
      lockedAtRestoredForUserId.current = userId;
      setLockedAt(null);
      AsyncStorage.getItem(storageKey)
        .then((stored) => {
          if (stored) {
            const parsed = new Date(stored);
            if (!Number.isNaN(parsed.getTime())) setLockedAt(parsed);
          }
        })
        .catch(() => {});
      return;
    }



    const persist = async () => {
      try {
        if (lockedAt) {
          await AsyncStorage.setItem(storageKey, lockedAt.toISOString());
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } catch {
        // Non-critical; lock state still correct in memory
      }
    };
    persist();
  }, [userId, lockedAt]);

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

  // ── Refresh stats from backend ─────────────────────────────────────────────

  const refreshStats = useCallback(async () => {
    if (!token) {return;}
    try {
      setStats(await fetchStats(token));
    } catch {
      // Non-critical — dashboard will show stale data
    }
  }, [token]);

  const refreshSettings = useCallback(async () => {
    if (!token) {return;}
    try {
      setSettings(await fetchSettings(token));
    } catch {
      // Non-critical — settings will show cached data
    }
  }, [token]);

  // ── Settings mutation (optimistic update + persist) ────────────────────────

  const updateSettings = useCallback(async (patch: SettingsUpdate) => {
    const prevSettings = settings;
    setSettings(prev => ({...prev, ...patch}));
    if (!token) {return;}
    try {
      const updated = await apiUpdateSettings(token, patch);
      setSettings(updated);
    } catch (e: any) {
      setSettings(prevSettings); // revert if it failed
      Alert.alert('Update Failed', e.message);
    }
  }, [token, settings]);

  // ── Screen Time operations ─────────────────────────────────────────────────

  const requestAuthorization = useCallback(async () => {
    setIsLoading(true);
    try {
      await ScreenTimeManager.requestAuthorization();
      setScreenTimeAuthorized(true);
    } catch (e: any) {
      if (e?.code === 'ENTITLEMENT_MISSING') {
        Alert.alert(
          'Developer Account Required',
          'App locking uses Apple Screen Time and requires a paid Apple Developer Program account ($99/year).\n\nVisit developer.apple.com to enroll.',
          [{text: 'OK'}],
        );
      } else if (e?.code === 'UNSUPPORTED') {
        Alert.alert('iOS 16 Required', 'App locking requires iOS 16 or later.');
      } else {
        Alert.alert('Authorization Failed', e.message ?? 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await ScreenTimeManager.showAppPicker();
      if (count > 0) {
        setSelectedAppCount(count);
        if (status === 'locked') {
          await ScreenTimeManager.lockApps();
        }
      }
    } catch (e: any) {
      Alert.alert('App Picker Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // ── Submit proof (API + unlock + refresh) ──────────────────────────────────

  const submitProof = useCallback(async (
    workoutType: string,
    note?: string,
    photoUri?: string,
  ) => {
    if (!token) {
      Alert.alert('Not Signed In', 'Please sign in to submit proof.');
      return;
    }
    setIsLoading(true);
    try {
      await submitVisit(token, workoutType, note, photoUri);

      if (status === 'locked') {
        await ScreenTimeManager.unlockApps();
        setStatus('unlocked');
        setLockedAt(null);
      }

      await refreshStats();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Already Logged', 'You already submitted a gym visit for today.');
      } else {
        Alert.alert('Submission Failed', e.message);
      }
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [token, status, refreshStats]);

  return (
    <LockContext.Provider
      value={{
        status,
        selectedAppCount,
        lockedAt,
        elapsedSeconds,
        screenTimeAuthorized,
        isLoading,
        isHydrated,
        settings,
        stats,
        updateSettings,
        requestAuthorization,
        selectApps,
        submitProof,
        refreshStats,
        refreshSettings,
      }}>
      {children}
    </LockContext.Provider>
  );
};
