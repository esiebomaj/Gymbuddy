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

const {ScreenTimeManager} = NativeModules;

export type LockStatus = 'unauthorized' | 'idle' | 'locked' | 'unlocked';

const DEFAULT_SETTINGS: SettingsResponse = {
  weekly_goal: 3,
  gym_days: [1, 2, 3, 4, 5],
  lock_start_time: '06:00',
  lock_end_time: '22:00',
};

const DEFAULT_STATS: StatsResponse = {
  weekly_visits: 0,
  weekly_goal: 3,
  current_streak: 0,
  longest_streak: 0,
  total_visits: 0,
  visited_today: false,
  visit_dates_this_week: [],
};

export interface LockContextType {
  status: LockStatus;
  selectedAppCount: number;
  lockedAt: Date | null;
  elapsedSeconds: number;
  screenTimeAuthorized: boolean;
  isLoading: boolean;
  settings: SettingsResponse;
  stats: StatsResponse;
  updateSettings: (patch: SettingsUpdate) => Promise<void>;
  requestAuthorization: () => Promise<void>;
  selectApps: () => Promise<void>;
  lockApps: () => Promise<void>;
  unlockApps: () => Promise<void>;
  submitProof: (workoutType: string, note?: string, photoUri?: string) => Promise<void>;
  refreshStats: () => Promise<void>;
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
  const {session} = useAuth();
  const token = session?.access_token;

  const [status, setStatus] = useState<LockStatus>('unauthorized');
  const [selectedAppCount, setSelectedAppCount] = useState(0);
  const [lockedAt, setLockedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [screenTimeAuthorized, setScreenTimeAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [settings, setSettings] = useState<SettingsResponse>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<StatsResponse>(DEFAULT_STATS);

  // ── Hydrate from backend on session change ─────────────────────────────────

  useEffect(() => {
    if (!token) {return;}

    let cancelled = false;

    const hydrate = async () => {
      try {
        const [s, st] = await Promise.all([
          fetchSettings(token),
          fetchStats(token),
        ]);
        if (cancelled) {return;}
        setSettings(s);
        setStats(st);
      } catch {
        // Silently fail — settings may not exist yet during onboarding
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [token]);

  // ── Tick elapsed time while locked ─────────────────────────────────────────

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
      setStatus('idle');
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
        await ScreenTimeManager.lockApps();
        if (status !== 'locked') {
          setStatus('locked');
          setLockedAt(new Date());
        }
        // If already locked, keep the existing lock timestamp — just update the selection
      }
      // If count === 0 and already locked, ignore the result to prevent bypassing the lock
    } catch (e: any) {
      Alert.alert('App Picker Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const lockApps = useCallback(async () => {
    if (selectedAppCount === 0) {
      Alert.alert('No Apps Selected', 'Please select apps to lock first.');
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
    } catch (e: any) {
      Alert.alert('Unlock Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        settings,
        stats,
        updateSettings,
        requestAuthorization,
        selectApps,
        lockApps,
        unlockApps,
        submitProof,
        refreshStats,
      }}>
      {children}
    </LockContext.Provider>
  );
};
