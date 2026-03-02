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
import {Smartphone, Settings as SettingsIcon} from 'lucide-react-native';
import {MainTabParamList, MainStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useLock} from '../../context/LockContext';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
    NativeStackNavigationProp<MainStackParamList>
  >;
};

const statusConfig = {
  unauthorized: {
    emoji: '🔐',
    label: 'Setup Required',
    color: Colors.textMuted,
    bg: Colors.surfaceElevated,
    border: Colors.border,
    description: 'Authorize Screen Time to get started',
  },
  idle: {
    emoji: '⚙️',
    label: 'Not Set Up',
    color: Colors.textSecondary,
    bg: Colors.surfaceElevated,
    border: Colors.border,
    description: 'Select apps to restrict — they lock immediately until you hit the gym',
  },
  locked: {
    emoji: '🔒',
    label: 'Apps Locked',
    color: Colors.error,
    bg: '#2E0A14',
    border: Colors.error,
    description: 'Submit gym proof to unlock your apps',
  },
  unlocked: {
    emoji: '🏋️',
    label: 'Gym Done!',
    color: Colors.primary,
    bg: '#2E1A0A',
    border: Colors.primary,
    description: 'Workout verified! Apps are unlocked for today',
  },
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useAuth();
  const {status, selectedAppCount, elapsedSeconds, stats, refreshStats} = useLock();

  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats]),
  );

  const cfg = statusConfig[status];

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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
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

        {/* ── Status Hero Card — only show when unlocked ── */}
        {status === 'unlocked' && (
        <View style={[styles.heroCard, {backgroundColor: cfg.bg, borderColor: cfg.border}]}>
          <Text style={styles.heroEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.heroStatus, {color: cfg.color}]}>{cfg.label}</Text>
          <Text style={styles.heroDescription}>{cfg.description}</Text>
        </View>
        )}

        {/* ── Weekly Streak Card ── */}
        <View style={styles.streakCard}>
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

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({length: stats.weekly_goal}).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i < stats.weekly_visits ? styles.dotFilled : styles.dotEmpty]}
              />
            ))}
          </View>

          {/* Count */}
          <View style={styles.streakCountRow}>
            <Text style={styles.streakVisits}>{stats.weekly_visits}</Text>
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
            <Text style={styles.statLabel}>Apps Selected</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={styles.statValue}>
              {status === 'locked' ? formatElapsed(elapsedSeconds) : stats.visited_today ? '✓' : '—'}
            </Text>
            <Text style={styles.statLabel}>{status === 'locked' ? 'Time Locked' : 'Today'}</Text>
          </View>
        </View>

        {/* ── Quick Nav Cards ── */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Apps')}
          activeOpacity={0.7}>
          <View style={[styles.navIcon, {backgroundColor: '#1A2E3A'}]}>
            <Smartphone size={24} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>App Selection</Text>
            <Text style={styles.navSubtitle}>
              {selectedAppCount > 0
                ? `${selectedAppCount} apps locked — tap to change selection`
                : 'Choose which apps to restrict — they lock immediately'}
            </Text>
          </View>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('Settings')}>
          <View style={[styles.navIcon, {backgroundColor: '#1A1A2E'}]}>
            <SettingsIcon size={24} color={Colors.textSecondary} strokeWidth={1.8} />
          </View>
          <View style={styles.navContent}>
            <Text style={styles.navTitle}>Settings</Text>
            <Text style={styles.navSubtitle}>Weekly goal, account & more</Text>
          </View>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>



      </ScrollView>
    </SafeAreaView>
  );
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) {return ' morning';}
  if (h < 18) {return ' afternoon';}
  return ' evening';
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
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
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {...Typography.h3, color: Colors.textPrimary, marginTop: 2},
  // Hero
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroEmoji: {fontSize: 52, marginBottom: Spacing.sm},
  heroStatus: {...Typography.h3, marginBottom: Spacing.xs},
  heroDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timerPill: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,76,106,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timerText: {color: Colors.error, fontSize: 13, fontWeight: '600'},
  heroAction: {marginTop: Spacing.md},
  heroActionText: {color: Colors.primary, fontSize: 15, fontWeight: '700'},
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
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
    borderColor: Colors.border,
  },
  statValue: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },
  // Nav cards
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  navCardHighlight: {borderColor: Colors.borderLight},
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navEmoji: {fontSize: 24},
  navContent: {flex: 1},
  navTitle: {...Typography.h4, color: Colors.textPrimary, marginBottom: 3},
  navSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  navChevron: {fontSize: 22, color: Colors.textMuted},
  urgentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentText: {color: Colors.white, fontWeight: '700', fontSize: 14},
  // Streak card
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakSectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  streakBadgeDim: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  streakBadgeText: {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  dotEmpty: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  streakVisits: {fontSize: 36, fontWeight: '800', color: Colors.primary},
  streakSep: {fontSize: 28, fontWeight: '300', color: Colors.textMuted},
  streakGoalNum: {fontSize: 36, fontWeight: '800', color: Colors.textSecondary},
  streakCountLabel: {...Typography.body, color: Colors.textMuted, marginLeft: 4},
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  goalLabel: {...Typography.body, color: Colors.textSecondary},
  goalStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {opacity: 0.3},
  stepperBtnText: {fontSize: 18, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22},
  stepperValue: {...Typography.h4, color: Colors.textPrimary, minWidth: 64, textAlign: 'center'},
});

export default DashboardScreen;
