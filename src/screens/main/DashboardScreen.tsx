import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CompositeNavigationProp, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Smartphone, Settings as SettingsIcon, ChevronRight} from 'lucide-react-native';
import {MainTabParamList, MainStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useLock} from '../../context/LockContext';
import Skeleton from '../../components/common/Skeleton';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const getStatusConfig = (colors: AppColors, isDark: boolean) => ({
  unauthorized: {
    emoji: '🔐',
    label: 'Setup Required',
    color: colors.textMuted,
    bg: colors.glass,
    border: colors.glassBorder,
    glow: 'transparent',
    description: 'Authorize Screen Time to get started',
  },
  noAppsSelected: {
    emoji: '⚙️',
    label: 'Not Set Up',
    color: colors.textSecondary,
    bg: colors.glass,
    border: colors.glassBorder,
    glow: 'transparent',
    description: 'Select apps to restrict. They lock immediately until you hit the gym',
  },
  outsideWindow: {
    emoji: '🌙',
    label: 'Outside Window',
    color: colors.accent,
    bg: isDark ? 'rgba(191,90,242,0.10)' : 'rgba(191,90,242,0.07)',
    border: `${colors.accent}55`,
    glow: 'rgba(191,90,242,0.20)',
    description: 'Apps unlocked. Your gym window isn\'t active right now',
  },
  locked: {
    emoji: '🔒',
    label: 'Apps Locked',
    color: colors.error,
    bg: isDark ? 'rgba(255,69,58,0.12)' : 'rgba(255,59,48,0.07)',
    border: `${colors.error}55`,
    glow: colors.glowError,
    description: 'Submit gym proof to unlock your apps',
  },
  unlocked: {
    emoji: '🏋️',
    label: 'Gym Done!',
    color: Colors.primary,
    bg: isDark ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.07)',
    border: `${Colors.primary}55`,
    glow: colors.glowPrimary,
    description: 'Workout verified! Apps are unlocked for today --',
  },
});

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useAuth();
  const {
    status,
    selectedAppCount,
    elapsedSeconds,
    settings,
    stats,
    refreshStats,
    refreshSettings,
    screenTimeAuthorized,
    isHydrated,
  } = useLock();
  const {colors, isDark, barStyle} = useTheme();
  const styles = makeStyles(colors);

  // True iff today is a configured gym day AND `now` falls inside the
  // configured daily lock window. On non-gym days the window doesn't
  // apply at all, so we treat them as "outside window".
  const isInLockWindow = (() => {
    const now = new Date();
    if (!settings.gym_days.includes(now.getDay())) {return false;}

    const [startH, startM] = settings.lock_start_time.split(':').map(Number);
    const [endH, endM] = settings.lock_end_time.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= startH * 60 + startM && cur <= endH * 60 + endM;
  })();

  const finalStatus = !screenTimeAuthorized
    ? 'unauthorized'
    : selectedAppCount <= 0
      ? 'noAppsSelected'
      : status === 'unlocked' && !stats.visited_today && !isInLockWindow
        ? 'outsideWindow'
        : status;

  const cfg = getStatusConfig(colors, isDark)[finalStatus];

  useFocusEffect( useCallback(() => { refreshSettings(); }, [refreshSettings]));
  useFocusEffect(useCallback(() => { refreshStats(); }, [refreshStats]));

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {return `${h}h ${m}m`;}
    if (m > 0) {return `${m}m ${s}s`;}
    return `${s}s`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good{getTimeOfDay()},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Athlete'} 💪</Text>
          </View>
        </View>

        {!isHydrated ? (
          <DashboardSkeleton styles={styles} />
        ) : (
        <>
        {/* ── Status Hero Card ── (only when locked/unlocked) */}
        {(status === 'locked' || status === 'unlocked') && (
          <View style={[styles.heroCard, {backgroundColor: cfg.bg, borderColor: cfg.border}]}>
            {/* Glow behind hero */}
            <View style={[styles.heroGlow, {backgroundColor: cfg.glow}]} />
            {/* Top rim highlight */}
            <View style={styles.heroHighlight} />
            <Text style={styles.heroEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.heroStatus, {color: cfg.color}]}>{cfg.label}</Text>
            <Text style={styles.heroDescription}>{cfg.description}</Text>
            {status === 'locked' && (
              <View style={[styles.timerPill, {borderColor: `${colors.error}55`}]}>
                <Text style={[styles.timerText, {color: colors.error}]}>
                  ⏱ {formatElapsed(elapsedSeconds)} locked
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Weekly Streak Card ── */}
        <View style={styles.streakCard}>
          <View style={styles.streakHighlight} />
          {/* Header */}
          <View style={styles.streakHeader}>
            <Text style={styles.streakSectionLabel}>THIS WEEK</Text>
            <View style={[styles.streakBadge, stats.current_streak === 0 && styles.streakBadgeDim]}>
              <Text style={styles.streakBadgeText}>
                {stats.current_streak > 0
                  ? `🔥 ${stats.current_streak} week${stats.current_streak !== 1 ? 's' : ''}`
                  : stats.weekly_visits > 0
                  ? '💪 Keep going!'
                  : '🎯 Start this week'}
              </Text>
            </View>
          </View>

          {/* Progress dots — one per configured gym day, filled if that exact day was logged */}
          <View style={styles.dotsRow}>
            {(() => {
              const sortedGymDays = [...settings.gym_days].sort((a, b) => a - b);
              if (sortedGymDays.length === 0) {return null;}

              const now = new Date();
              const todayDay = now.getDay(); // 0=Sun … 6=Sat
              const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayDay);
              const visited = new Set(stats.matching_visit_dates_this_week);

              return sortedGymDays.map(dayNum => {
                const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayNum);
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const isVisited = visited.has(iso);
                const isToday = dayNum === todayDay;
                const isPast = dayNum < todayDay && !isVisited;

                return (
                  <View key={dayNum} style={styles.dayCell}>
                    <Text
                      style={[
                        styles.dayLabel,
                        isVisited && styles.dayLabelFilled,
                        isToday && !isVisited && styles.dayLabelToday,
                        isPast && styles.dayLabelMissed,
                      ]}>
                      {DAY_LABELS[dayNum]}
                    </Text>
                    <View
                      style={[
                        styles.dot,
                        isVisited
                          ? styles.dotFilled
                          : isToday
                          ? styles.dotToday
                          : isPast
                          ? styles.dotMissed
                          : styles.dotEmpty,
                      ]}
                    />
                  </View>
                );
              });
            })()}
          </View>

          {/* Count */}
          <View style={styles.streakCountRow}>
            <Text style={styles.streakVisits}>{stats.matching_weekly_visits}</Text>
            <Text style={styles.streakSep}> / </Text>
            <Text style={styles.streakGoalNum}>{stats.weekly_goal}</Text>
            <Text style={styles.streakCountLabel}> visits this week</Text>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_visits}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={styles.statValue}>{selectedAppCount}</Text>
            <Text style={styles.statLabel}>Apps Locked</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={styles.statValue}>
              {status === 'locked' ? formatElapsed(elapsedSeconds) : stats.visited_today ? '✓' : '—'}
            </Text>
            <Text style={styles.statLabel}>{status === 'locked' ? 'Locked' : 'Today'}</Text>
          </View>
        </View>

        {/* ── Quick Nav Cards ── */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Apps')}
          activeOpacity={0.7}>
          <View style={styles.navHighlight} />
          <View style={[styles.navIcon, {backgroundColor: 'rgba(255,107,53,0.18)'}]}>
            <Smartphone size={22} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>App Selection</Text>
            <Text style={styles.navSubtitle}>
              {selectedAppCount > 0
                ? `${selectedAppCount} apps locked. Tap to change`
                : 'Choose which apps to restrict'}
            </Text>
          </View>
          <View style={styles.navChevronWrap}>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}>
          <View style={styles.navHighlight} />
          <View style={[styles.navIcon, {backgroundColor: 'rgba(191,90,242,0.16)'}]}>
            <SettingsIcon size={22} color={colors.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Settings</Text>
            <Text style={styles.navSubtitle}>Gym schedule, account & more</Text>
          </View>
          <View style={styles.navChevronWrap}>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
          </View>
        </TouchableOpacity>
        </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

type DashboardStyles = ReturnType<typeof makeStyles>;

const DashboardSkeleton: React.FC<{styles: DashboardStyles}> = ({styles}) => (
  <View>
    {/* Hero placeholder */}
    <View style={styles.skeletonHero}>
      <Skeleton width={64} height={64} radius={32} style={styles.skeletonHeroEmoji} />
      <Skeleton width={'55%'} height={22} style={styles.skeletonCenter} />
      <Skeleton width={'80%'} height={14} style={styles.skeletonCenter} />
      <Skeleton width={'40%'} height={14} style={styles.skeletonCenter} />
    </View>

    {/* Streak placeholder */}
    <View style={styles.skeletonStreak}>
      <View style={styles.skeletonStreakHeader}>
        <Skeleton width={90} height={12} />
        <Skeleton width={110} height={24} radius={Radius.full} />
      </View>
      <View style={styles.skeletonDotsRow}>
        {Array.from({length: 3}).map((_, i) => (
          <Skeleton key={i} width={30} height={30} radius={15} />
        ))}
      </View>
      <View style={styles.skeletonCenterRow}>
        <Skeleton width={'60%'} height={36} />
      </View>
    </View>

    {/* Stats row placeholder */}
    <View style={styles.skeletonStatsRow}>
      {Array.from({length: 3}).map((_, i) => (
        <View key={i} style={styles.skeletonStatCard}>
          <Skeleton width={40} height={22} style={styles.skeletonStatValue} />
          <Skeleton width={64} height={10} />
        </View>
      ))}
    </View>

    <Skeleton width={110} height={12} style={styles.skeletonSectionTitle} />

    {/* Nav card placeholders */}
    {Array.from({length: 2}).map((_, i) => (
      <View key={i} style={styles.skeletonNavCard}>
        <Skeleton width={50} height={50} radius={Radius.lg} />
        <View style={styles.skeletonNavContent}>
          <Skeleton width={'55%'} height={16} style={styles.skeletonNavTitle} />
          <Skeleton width={'80%'} height={12} />
        </View>
        <Skeleton width={28} height={28} radius={14} />
      </View>
    ))}
  </View>
);

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) {return ' morning';}
  if (h < 18) {return ' afternoon';}
  return ' evening';
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    ...Typography.h2,
    color: colors.textPrimary,
    marginTop: 4,
    letterSpacing: -0.5,
  },

  // ── Hero card ──
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -80,
    alignSelf: 'center',
  },
  heroHighlight: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderRadius: 1,
  },
  heroEmoji: {fontSize: 54, marginBottom: Spacing.sm},
  heroStatus: {...Typography.h3, marginBottom: Spacing.xs, fontWeight: '700'},
  heroDescription: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timerPill: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  timerText: {fontSize: 13, fontWeight: '700', letterSpacing: 0.3},

  // ── Streak card ──
  streakCard: {
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  streakHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakSectionLabel: {
    ...Typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,107,53,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${Colors.primary}44`,
  },
  streakBadgeDim: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  streakBadgeText: {fontSize: 13, fontWeight: '700', color: colors.textPrimary},
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  dayCell: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayLabelFilled: {
    color: Colors.primary,
  },
  dayLabelToday: {
    color: colors.textPrimary,
  },
  dayLabelMissed: {
    color: colors.textMuted,
    opacity: 0.6,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  dotEmpty: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dotToday: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dotMissed: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    opacity: 0.5,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  streakVisits: {fontSize: 38, fontWeight: '800', color: Colors.primary, letterSpacing: -1},
  streakSep: {fontSize: 28, fontWeight: '300', color: colors.textMuted},
  streakGoalNum: {fontSize: 38, fontWeight: '800', color: colors.textSecondary, letterSpacing: -1},
  streakCountLabel: {...Typography.body, color: colors.textMuted, marginLeft: 4},

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...Typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  sectionTitle: {
    ...Typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },

  // ── Nav cards ──
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  navHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },
  navIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navContent: {flex: 1},
  navTitle: {...Typography.h4, color: colors.textPrimary, marginBottom: 3, fontWeight: '600'},
  navSubtitle: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    lineHeight: 18,
  },
  navChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Skeleton placeholders ──
  skeletonHero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skeletonHeroEmoji: {
    marginBottom: Spacing.xs,
  },
  skeletonCenter: {
    alignSelf: 'center',
  },
  skeletonStreak: {
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  skeletonStreakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skeletonDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  skeletonCenterRow: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  skeletonStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  skeletonStatValue: {
    marginBottom: 6,
  },
  skeletonSectionTitle: {
    marginBottom: Spacing.md,
  },
  skeletonNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  skeletonNavContent: {
    flex: 1,
    gap: 6,
  },
  skeletonNavTitle: {
    marginBottom: 2,
  },
});

export default DashboardScreen;

