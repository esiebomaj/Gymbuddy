import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {NativeModules, Alert, Platform, AppState} from 'react-native';
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

  // ── Check Screen Time authorization on mount + on foreground ─────────────
  // iOS can transiently return `notDetermined` for FamilyControls auth on
  // cold launch (especially after the app has been killed for a long time)
  // before the daemon loads. We:
  //  1. Re-run the check whenever the app becomes active so a transient
  //     `notDetermined` self-corrects on the next foreground.
  //  2. Treat persisted/shielded apps as a strong "previously authorized"
  //     hint — only flip to unauthorized when iOS explicitly says `denied`.

  useEffect(() => {
    let cancelled = false;

    const reconcileAuth = async () => {
      try {
        // Read persisted app counts first — these don't require auth and tell
        // us if the user has used the app successfully before.
        let shieldedCount = 0;
        let selectedCount = 0;
        try {
          shieldedCount = await ScreenTimeManager.getShieldedAppCount();
        } catch {}
        try {
          selectedCount = await ScreenTimeManager.getSelectedAppCount();
        } catch {}

        const hasPriorSelection = shieldedCount > 0 || selectedCount > 0;

        let result: string = 'notDetermined';
        try {
          result = await ScreenTimeManager.checkAuthorizationStatus();
        } catch {
          // iOS < 16 or module unavailable — leave as unauthorized.
          return;
        }
        if (cancelled) {return;}

        if (result === 'approved') {
          setScreenTimeAuthorized(true);
        } else if (result === 'denied') {
          // User explicitly revoked in Settings — trust this.
          setScreenTimeAuthorized(false);
        } else if (hasPriorSelection) {
          // `notDetermined` + we have shielded/selected apps means iOS just
          // hasn't loaded auth state yet. Stay optimistic — the next
          // foreground or retry will confirm.
          setScreenTimeAuthorized(true);
        }

        if (shieldedCount > 0) {
          setSelectedAppCount(shieldedCount);
          setStatus('locked');
        } else if (selectedCount > 0) {
          setSelectedAppCount(prev => (prev === 0 ? selectedCount : prev));
        }
      } catch {
        // Swallow — we'll retry on the next foreground transition.
      }
    };

    reconcileAuth();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {reconcileAuth();}
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
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

  // ── Register the OS-level lock schedule ────────────────────────────────────
  // The DeviceActivityMonitor extension actually flips the shield at the
  // boundaries — even when the app is closed. JS only declares intent here.
  // Re-runs whenever the user's gym days or lock window change, or when the
  // selected-app set transitions between empty and non-empty.

  useEffect(() => {
    if (!isHydrated || !screenTimeAuthorized) {
      console.log('[LockContext] schedule effect skipped', {isHydrated, screenTimeAuthorized});
      return;
    }

    if (selectedAppCount === 0) {
      console.log('[LockContext] no apps selected — clearing schedule');
      ScreenTimeManager.clearScheduledLockWindow?.().catch(() => {});
      return;
    }

    const [startH, startM] = settings.lock_start_time.split(':').map(Number);
    const [endH, endM] = settings.lock_end_time.split(':').map(Number);


    const params = {
      gymDays: settings.gym_days,
      startHour: startH,
      startMinute: startM,
      endHour: endH,
      endMinute: endM,
    };
    console.log('[LockContext] calling scheduleLockWindow', params);
    ScreenTimeManager.scheduleLockWindow?.(params)
      .then(() => {
        console.log('[LockContext] scheduleLockWindow ok');
        ScreenTimeManager.getScheduleDebugInfo?.()
          .then((info: unknown) => console.log('[LockContext] schedule info', info))
          .catch(() => {});
      })
      .catch((e: any) => {
        console.warn('[LockContext] scheduleLockWindow failed:', e);
      });
  }, [
    isHydrated,
    screenTimeAuthorized,
    selectedAppCount,
    settings.gym_days,
    settings.lock_start_time,
    settings.lock_end_time,
  ]);

  // ── Reconcile in-foreground status with the OS shield ──────────────────────
  // The OS may have flipped the shield while we were closed/backgrounded.
  // Run a single reconciliation now and on every foreground transition.

  useEffect(() => {
    if (!isHydrated || !screenTimeAuthorized || selectedAppCount === 0) {return;}

    const reconcile = async () => {
      try {
        const shouldLock = shouldLockApps(settings, stats.visited_today);
        const shieldedCount: number = await ScreenTimeManager.getShieldedAppCount();
        const isCurrentlyLocked = shieldedCount > 0;

        // If the app is open mid-window and the OS hasn't shielded yet
        // (e.g. user just picked apps, or just changed settings), apply now
        // so the UX matches the schedule without waiting for the next boundary.
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
        } else {
          setStatus('unlocked');
          setLockedAt(null);
        }
      } catch (e) {
        console.warn('Lock reconciliation failed:', e);
      }
    };

    reconcile();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {reconcile();}
    });
    return () => sub.remove();
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
      } else if (Platform.OS === 'android' && e?.code === 'ACCESSIBILITY_NOT_GRANTED') {
        Alert.alert(
          'Accessibility Required',
          'To block apps on Android, enable GymBuddy in Settings → Accessibility.',
          [
            {text: 'OK'},
            {
              text: 'Open Settings',
              onPress: () => {
                ScreenTimeManager?.openAccessibilitySettings?.().catch(() => {});
              },
            },
          ],
        );
      } else {
        Alert.alert('Authorization Failed', e.message ?? 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectApps = useCallback(async () => {
    if (status === 'locked' && selectedAppCount > 0) {
      Alert.alert('Not allowed', 'Cannot change app selection while in locked state');
      return;
    }
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

      // Tell native (and the DeviceActivityMonitor extension via shared
      // defaults) that today's gym visit is logged. The extension will
      // skip applying the shield at the next interval start today.
      try {
        await ScreenTimeManager.markVisitedToday?.();
      } catch {
        // Non-critical — backend is still source of truth.
      }

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
