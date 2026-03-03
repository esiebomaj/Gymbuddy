import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useLock} from '../../context/LockContext';
import PrimaryButton from '../../components/common/PrimaryButton';

// LockStatusScreen is an orphaned screen kept for reference only — not in any navigator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavProp = any;

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};

const formatDate = (date: Date | null): string => {
  if (!date) {return '—';}
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

// ── Status config map ─────────────────────────────────────────────────────────

const getStatusConfig = (colors: AppColors) => ({
  unauthorized: {
    emoji: '🔐',
    label: 'Setup Required',
    color: colors.textMuted,
    ringColor: colors.border,
    bg: colors.surface,
    desc: 'Grant Screen Time permission to get started',
  },
  idle: {
    emoji: '⚙️',
    label: 'Not Set Up',
    color: colors.textSecondary,
    ringColor: colors.borderLight,
    bg: colors.surface,
    desc: 'Select apps to restrict — they lock immediately and stay locked until you hit the gym',
  },
  locked: {
    emoji: '🔒',
    label: 'Apps Locked',
    color: Colors.error,
    ringColor: Colors.error,
    bg: 'rgba(255,76,106,0.08)',
    desc: 'Hit the gym and submit your proof photo to unlock your apps',
  },
  unlocked: {
    emoji: '🏆',
    label: 'Unlocked',
    color: Colors.primary,
    ringColor: Colors.primary,
    bg: 'rgba(255,107,53,0.08)',
    desc: 'Workout verified! Your apps are unlocked for today',
  },
}) as const;

// ── Component ────────────────────────────────────────────────────────────────

const LockStatusScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const {
    status,
    selectedAppCount,
    lockedAt,
    elapsedSeconds,
    isLoading,
    requestAuthorization,
  } = useLock();
  const {colors, barStyle} = useTheme();
  const styles = makeStyles(colors);
  const cfg = getStatusConfig(colors)[status];

  // Pulsing ring animation
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'locked') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [status, pulse]);

  // ── Actions ──
  const handlePrimaryAction = async () => {
    if (status === 'unauthorized') {
      await requestAuthorization();
    } else if (status === 'idle') {
      navigation.navigate('Apps');
    } else if (status === 'locked') {
      navigation.navigate('Proof');
    }
    // unlocked: button disabled — apps are unlocked for today
  };

  const primaryLabel = {
    unauthorized: 'Grant Screen Time Access',
    idle: '📱 Set Up App Lock',
    locked: '📸 Submit Gym Proof',
    unlocked: '🎉 Apps Unlocked — Enjoy!',
  }[status];

  const isPrimaryDisabled = isLoading || status === 'unlocked';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Lock Status</Text>
          <Text style={styles.subtitle}>Your current app restriction state</Text>
        </View>

        {/* ── Pulsing Ring + Status ── */}
        <View style={[styles.heroCard, {backgroundColor: cfg.bg, borderColor: cfg.ringColor + '55'}]}>
          <View style={styles.ringContainer}>
            {/* Outer animated ring */}
            <Animated.View
              style={[
                styles.ring,
                {borderColor: cfg.ringColor + '44', transform: [{scale: pulse}]},
              ]}
            />
            {/* Inner solid ring */}
            <View style={[styles.ringInner, {borderColor: cfg.ringColor}]}>
              <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
            </View>
          </View>

          <Text style={[styles.statusLabel, {color: cfg.color}]}>{cfg.label}</Text>
          <Text style={styles.statusDesc}>{cfg.desc}</Text>

          {/* Live timer (only when locked) */}
          {status === 'locked' && (
            <View style={styles.timerPill}>
              <Text style={styles.timerText}>⏱ {formatElapsed(elapsedSeconds)}</Text>
            </View>
          )}
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{selectedAppCount}</Text>
            <Text style={styles.statLabel}>Apps Selected</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={[styles.statValue, {color: cfg.color}]}>{cfg.label}</Text>
            <Text style={styles.statLabel}>Current State</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {status === 'locked' ? formatElapsed(elapsedSeconds) : '—'}
            </Text>
            <Text style={styles.statLabel}>Time Locked</Text>
          </View>
        </View>

        {/* ── Detail Rows ── */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Status</Text>
            <View style={[styles.statusPill, {backgroundColor: cfg.color + '22'}]}>
              <Text style={[styles.statusPillText, {color: cfg.color}]}>
                {cfg.emoji} {cfg.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailSep} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Apps Selected</Text>
            <Text style={styles.detailValue}>{selectedAppCount} app{selectedAppCount !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.detailSep} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Locked At</Text>
            <Text style={styles.detailValue}>{formatDate(lockedAt)}</Text>
          </View>

          <View style={styles.detailSep} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Elapsed Time</Text>
            <Text style={[styles.detailValue, status === 'locked' && {color: Colors.error}]}>
              {status === 'locked' ? formatElapsed(elapsedSeconds) : '—'}
            </Text>
          </View>
        </View>

        {/* ── Primary Action ── */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title={primaryLabel}
            onPress={handlePrimaryAction}
            loading={isLoading}
            disabled={isPrimaryDisabled}
          />
          {status === 'unlocked' && (
            <Text style={styles.unlockedHint}>
              Your apps are unlocked for today — keep the momentum going tomorrow! 💪
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const RING_SIZE = 140;
const RING_INNER_SIZE = 104;

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},
  header: {paddingTop: Spacing.lg, paddingBottom: Spacing.xl},
  title: {...Typography.h2, color: colors.textPrimary, marginBottom: Spacing.xs},
  subtitle: {...Typography.body, color: colors.textSecondary},

  // Hero card
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  ringInner: {
    width: RING_INNER_SIZE,
    height: RING_INNER_SIZE,
    borderRadius: RING_INNER_SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusEmoji: {fontSize: 44},
  statusLabel: {...Typography.h2, marginBottom: Spacing.xs},
  statusDesc: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timerPill: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,76,106,0.15)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.error + '66',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timerText: {color: Colors.error, fontSize: 15, fontWeight: '600', letterSpacing: 0.5},

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  statCard: {flex: 1, alignItems: 'center', paddingVertical: Spacing.md},
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statValue: {...Typography.h4, color: colors.textPrimary, marginBottom: 3},
  statLabel: {...Typography.caption, color: colors.textMuted, textAlign: 'center'},

  // Detail card
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  detailSep: {height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.md},
  detailKey: {...Typography.body, color: colors.textSecondary},
  detailValue: {...Typography.body, color: colors.textPrimary, fontWeight: '500'},
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusPillText: {fontSize: 13, fontWeight: '600'},

  // Action section
  actionSection: {gap: Spacing.sm},
  unlockedHint: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});

export default LockStatusScreen;
