import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useLock} from '../../context/LockContext';
import {
  Smartphone,
  CalendarDays,
  Clock,
  Lock,
  ShieldCheck,
  ChevronRight,
  Check,
} from 'lucide-react-native';

const DAYS = [
  {label: 'Su', full: 'Sunday', value: 0},
  {label: 'Mo', full: 'Monday', value: 1},
  {label: 'Tu', full: 'Tuesday', value: 2},
  {label: 'We', full: 'Wednesday', value: 3},
  {label: 'Th', full: 'Thursday', value: 4},
  {label: 'Fr', full: 'Friday', value: 5},
  {label: 'Sa', full: 'Saturday', value: 6},
];

const HOURS = Array.from({length: 24}, (_, i) => {
  const h = i; // 12AM – 11PM (full 24h)
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return {label: `${display}${suffix}`, value: `${String(h).padStart(2, '0')}:00`};
});

const END_HOURS = Array.from({length: 24}, (_, i) => {
  const h = i;
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return {time: `${display}:59`, suffix, value: `${String(h).padStart(2, '0')}:59`};
});

const TOTAL_STEPS = 3;

const OnboardingScreen: React.FC = () => {
  const {completeOnboarding} = useAuth();
  const {selectApps, updateSettings: updateLockSettings, requestAuthorization} = useLock();
  const {colors, barStyle} = useTheme();
  const styles = makeStyles(colors);

  const [step, setStep] = useState(0);
  const [appsSelected, setAppsSelected] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('23:59');
  const [loading, setLoading] = useState(false);

  // ── Step actions ─────────────────────────────────────────────────────────────
  const handleSelectApps = async () => {
    try {
      await requestAuthorization();
      await selectApps();
      setAppsSelected(true);
    } catch {
      // selectApps handles its own alerts
    }
  };

  const toggleDay = (val: number) => {
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val],
    );
  };

  const handleFinish = async () => {
    if (loading) {return;}
    setLoading(true);
    try {
      await updateLockSettings({
        weekly_goal: selectedDays.length,
        gym_days: selectedDays,
        lock_start_time: startTime,
        lock_end_time: endTime,
      });
      await completeOnboarding();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong.');
      setLoading(false);
    }
  };

  const canContinue = () => {
    if (step === 1) {return selectedDays.length > 0;}
    return true;
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {setStep(s => s + 1);}
    else {handleFinish();}
  };

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <View style={styles.progressRow}>
      {Array.from({length: TOTAL_STEPS}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i <= step ? styles.progressActive : styles.progressInactive,
            i < TOTAL_STEPS - 1 && {marginRight: 6},
          ]}
        />
      ))}
    </View>
  );

  // ── Step 1: Select Apps ───────────────────────────────────────────────────────
  const StepApps = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Smartphone size={32} color={Colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.stepTitle}>Block Your Distractions</Text>
      <Text style={styles.stepSubtitle}>
        Choose which apps get locked until you prove you hit the gym. Social
        media, games — anything that tempts you.
      </Text>

      <TouchableOpacity
        style={[styles.selectAppsBtn, appsSelected && styles.selectAppsBtnDone]}
        onPress={handleSelectApps}
        activeOpacity={0.8}>
        {appsSelected ? (
          <>
            <Check size={20} color={Colors.success} strokeWidth={2.5} />
            <Text style={[styles.selectAppsBtnText, {color: Colors.success}]}>
              Apps Selected
            </Text>
          </>
        ) : (
          <>
            <Lock size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.selectAppsBtnText}>Select Apps to Block</Text>
            <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.privacyNote}>
        <ShieldCheck size={14} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.privacyText}>
          App selection uses iOS Screen Time. GymBuddy never sees which apps
          you choose.
        </Text>
      </View>

      {!appsSelected && (
        <TouchableOpacity onPress={nextStep} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Step 2: Gym Days ─────────────────────────────────────────────────────────
  const StepDays = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <CalendarDays size={32} color={Colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.stepTitle}>Your Gym Schedule</Text>
      <Text style={styles.stepSubtitle}>
        Pick the days you plan to train. Apps stay locked on these days until
        you submit your gym proof.
      </Text>

      <View style={styles.daysRow}>
        {DAYS.map(d => {
          const active = selectedDays.includes(d.value);
          return (
            <TouchableOpacity
              key={d.value}
              style={[styles.dayPill, active && styles.dayPillActive]}
              onPress={() => toggleDay(d.value)}
              activeOpacity={0.75}>
              <Text
                style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.daysHint}>
        {selectedDays.length === 0
          ? 'Select at least one day'
          : `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''} selected`}
      </Text>
    </View>
  );

  // ── Step 3: Lock Time ─────────────────────────────────────────────────────────
  const StepTime = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Clock size={32} color={Colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.stepTitle}>Set Your Lock Window</Text>
      <Text style={styles.stepSubtitle}>
        Apps are locked during this time window on your gym days. Outside these
        hours they stay accessible.
      </Text>

      {/* Start time */}
      <Text style={styles.timeLabel}>Locks at</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeScroll}>
        {HOURS.map(h => {
          const active = startTime === h.value;
          return (
            <TouchableOpacity
              key={h.value}
              style={[styles.timePill, active && styles.timePillActive]}
              onPress={() => setStartTime(h.value)}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.timePillText,
                  active && styles.timePillTextActive,
                ]}>
                {h.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* End time */}
      <Text style={[styles.timeLabel, {marginTop: Spacing.lg}]}>
        Unlocks at
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeScroll}>
        {END_HOURS.map(h => {
          const active = endTime === h.value;
          return (
            <TouchableOpacity
              key={h.value}
              style={[styles.timePill, active && styles.timePillActive, {alignItems: 'center'}]}
              onPress={() => setEndTime(h.value)}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.timePillText,
                  active && styles.timePillTextActive,
                  {textAlign: 'center'},
                ]}>
                {h.time}
              </Text>
              <Text
                style={[
                  styles.timePillSuffix,
                  active && styles.timePillTextActive,
                ]}>
                {h.suffix}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.timePreview}>
        <Text style={styles.timePreviewText}>
          {formatTime(startTime)} → {formatTime(endTime)}
        </Text>
        <Text style={styles.timePreviewSub}>daily lock window</Text>
      </View>
    </View>
  );

  const formatTime = (val: string) => {
    const [hStr, mStr] = val.split(':');
    const h = parseInt(hStr, 10);
    const suffix = h < 12 ? 'AM' : 'PM';
    const disp = h === 12 ? 12 : h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${disp}:${mStr} ${suffix}`;
  };

  const steps = [StepApps(), StepDays(), StepTime()];
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />

      {/* ── Top header ── */}
      <View style={styles.header}>
        <ProgressBar />
        <Text style={styles.stepCounter}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* ── Step content ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        directionalLockEnabled>
        {steps[step]}
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !canContinue() && styles.continueBtnDisabled,
            step === 0 && {flex: 1},
          ]}
          onPress={nextStep}
          disabled={!canContinue() || loading}
          activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>
            {loading ? 'Setting up…' : isLastStep ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},

  // Header / progress
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressRow: {flexDirection: 'row', flex: 1},
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: {backgroundColor: Colors.primary},
  progressInactive: {backgroundColor: colors.border},
  stepCounter: {
    ...Typography.label,
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },

  // Scroll + step
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },

  // Icon
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },

  // Titles
  stepTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  // Step 1 — Apps
  selectAppsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.md,
  },
  selectAppsBtnDone: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}12`,
  },
  selectAppsBtnText: {
    ...Typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    width: '100%',
  },
  privacyText: {
    ...Typography.caption,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  skipBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: colors.textMuted,
  },

  // Step 2 — Days
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  dayPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillText: {
    ...Typography.label,
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  dayPillTextActive: {color: Colors.white},
  daysHint: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Step 3 — Time
  timeLabel: {
    ...Typography.label,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeScroll: {
    paddingBottom: Spacing.xs,
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePillText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    width: '100%',
  },
  timePillTextActive: {color: Colors.white},
  timePillSuffix: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  timePreview: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  timePreviewText: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  timePreviewSub: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default OnboardingScreen;
