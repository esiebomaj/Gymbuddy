import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Target, Flame, Dumbbell, Bell, Lock, Info, LogOut} from 'lucide-react-native';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useLock} from '../../context/LockContext';

// ── Row components ────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}> = ({icon, label, value, onPress, destructive, rightElement}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}>
    <View style={styles.rowLeft}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {rightElement ?? (
        <>
          {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
          {onPress && <Text style={styles.rowChevron}>›</Text>}
        </>
      )}
    </View>
  </TouchableOpacity>
);

const SectionHeader: React.FC<{title: string}> = ({title}) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const Separator = () => <View style={styles.separator} />;

// ── Screen ────────────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const {user, signOut} = useAuth();
  const {weeklyGoal, setWeeklyGoal, currentStreak, gymVisitDates} = useLock();

  const totalVisits = gymVisitDates.length;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Sign Out', style: 'destructive', onPress: signOut},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Page title ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'A')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Athlete'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* ── Gym schedule ── */}
        <SectionHeader title="GYM SCHEDULE" />
        <View style={styles.section}>
          <SettingRow
            icon={<Target size={20} color={Colors.primary} strokeWidth={1.8} />}
            label="Weekly goal"
            rightElement={
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, weeklyGoal <= 1 && styles.stepBtnDisabled]}
                  onPress={() => setWeeklyGoal(weeklyGoal - 1)}
                  disabled={weeklyGoal <= 1}
                  activeOpacity={0.7}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>
                  {weeklyGoal} day{weeklyGoal !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, weeklyGoal >= 7 && styles.stepBtnDisabled]}
                  onPress={() => setWeeklyGoal(weeklyGoal + 1)}
                  disabled={weeklyGoal >= 7}
                  activeOpacity={0.7}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>

        {/* ── Stats ── */}
        <SectionHeader title="STATS" />
        <View style={styles.section}>
          <SettingRow
            icon={<Flame size={20} color="#FF6B35" strokeWidth={1.8} />}
            label="Current streak"
            value={`${currentStreak} week${currentStreak !== 1 ? 's' : ''}`}
          />
          <Separator />
          <SettingRow
            icon={<Dumbbell size={20} color={Colors.textSecondary} strokeWidth={1.8} />}
            label="Total gym visits"
            value={`${totalVisits}`}
          />
        </View>

        {/* ── App ── */}
        <SectionHeader title="APP" />
        <View style={styles.section}>
          <SettingRow
            icon={<Bell size={20} color={Colors.textSecondary} strokeWidth={1.8} />}
            label="Notifications"
            value="Coming soon"
          />
          <Separator />
          <SettingRow
            icon={<Lock size={20} color={Colors.textSecondary} strokeWidth={1.8} />}
            label="Screen Time permission"
            value="Granted"
          />
          <Separator />
          <SettingRow
            icon={<Info size={20} color={Colors.textSecondary} strokeWidth={1.8} />}
            label="Version"
            value="1.0.0 (MVP)"
          />
        </View>

        {/* ── Account ── */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingRow
            icon={<LogOut size={20} color={Colors.error} strokeWidth={1.8} />}
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>

        <Text style={styles.footer}>GymBuddy · Built to keep you honest 💪</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},
  header: {paddingTop: Spacing.lg, paddingBottom: Spacing.lg},
  title: {...Typography.h2, color: Colors.textPrimary},

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {fontSize: 22, fontWeight: '700', color: Colors.white},
  profileInfo: {flex: 1},
  profileName: {...Typography.h4, color: Colors.textPrimary, marginBottom: 3},
  profileEmail: {...Typography.bodySmall, color: Colors.textMuted},

  // Sections
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  separator: {height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md},

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 15,
    minHeight: 52,
  },
  rowLeft: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1},
  rowRight: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  rowIconWrap: {width: 28, alignItems: 'center', justifyContent: 'center'},
  rowLabel: {...Typography.body, color: Colors.textPrimary},
  destructiveLabel: {color: Colors.error},
  rowValue: {...Typography.body, color: Colors.textMuted},
  rowChevron: {fontSize: 22, color: Colors.textMuted},

  // Stepper
  stepper: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {opacity: 0.3},
  stepBtnText: {fontSize: 18, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22},
  stepValue: {...Typography.body, color: Colors.textPrimary, minWidth: 56, textAlign: 'center'},

  // Footer
  footer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

export default SettingsScreen;
