import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import GlassBackground from '../../components/common/GlassBackground';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Target, Flame, Dumbbell, LogOut, CalendarDays, Clock, X, Check, Moon} from 'lucide-react-native';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useLock} from '../../context/LockContext';

// ── Constants (mirrors OnboardingScreen) ──────────────────────────────────────

const DAYS = [
  {label: 'Mo', value: 1},
  {label: 'Tu', value: 2},
  {label: 'We', value: 3},
  {label: 'Th', value: 4},
  {label: 'Fr', value: 5},
  {label: 'Sa', value: 6},
  {label: 'Su', value: 0},
];

const HOURS = Array.from({length: 24}, (_, i) => {
  const h = i; // 12AM – 11PM (full 24h)
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h === 12 ? 12 : h > 12 ? h - 12 : h;
  return {label: `${display}${suffix}`, value: `${String(h).padStart(2, '0')}:00`};
});

const formatTime = (val: string) => {
  const h = parseInt(val.split(':')[0], 10);
  const suffix = h < 12 ? 'AM' : 'PM';
  const disp = h === 12 ? 12 : h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${disp}:00 ${suffix}`;
};

// ── Row components ────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}> = ({icon, label, value, onPress, destructive, rightElement}) => {
  const {colors} = useTheme();
  const styles = makeStyles(colors);
  return (
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
};

const SectionHeader: React.FC<{title: string}> = ({title}) => {
  const {colors} = useTheme();
  const styles = makeStyles(colors);
  return <Text style={styles.sectionHeader}>{title}</Text>;
};

const Separator = () => {
  const {colors} = useTheme();
  const styles = makeStyles(colors);
  return <View style={styles.separator} />;
};

// ── Screen ────────────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const {user, signOut} = useAuth();
  const {settings, stats, updateSettings} = useLock();
  const {current_streak, longest_streak, total_visits} = stats;
  const {colors, isDark, barStyle, toggleTheme} = useTheme();
  const styles = makeStyles(colors);

  // ── Schedule modal state ──────────────────────────────────────────────────
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(settings.gym_days ?? [1,2,3,4,5]);
  const [startTime, setStartTime] = useState(settings.lock_start_time ?? '06:00');
  const [endTime, setEndTime] = useState(settings.lock_end_time ?? '22:00');
  const [saving, setSaving] = useState(false);

  const openSchedule = () => {
    // Seed with current saved settings each time the modal opens
    setSelectedDays(settings.gym_days ?? [1,2,3,4,5]);
    setStartTime(settings.lock_start_time ?? '06:00');
    setEndTime(settings.lock_end_time ?? '22:00');
    setScheduleVisible(true);
  };

  const toggleDay = (val: number) =>
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val],
    );

  const saveSchedule = async () => {
    if (selectedDays.length === 0) {
      Alert.alert('No days selected', 'Pick at least one gym day.');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        weekly_goal: selectedDays.length,
        gym_days: selectedDays,
        lock_start_time: startTime,
        lock_end_time: endTime,
      });
      setScheduleVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save schedule.');
    } finally {
      setSaving(false);
    }
  };

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

  // Friendly summary for the settings row
  const scheduleSummary = (() => {
    const days = settings.gym_days ?? [];
    const dayLabels = DAYS.filter(d => days.includes(d.value)).map(d => d.label);
    const dayStr = dayLabels.length > 0 ? dayLabels.join(', ') : 'No days';
    return `${dayStr} · ${formatTime(settings.lock_start_time ?? '06:00')}–${formatTime(settings.lock_end_time ?? '22:00')}`;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      <GlassBackground isDark={isDark} />
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
            icon={<CalendarDays size={20} color={Colors.primary} strokeWidth={1.8} />}
            label="Schedule"
            onPress={openSchedule}
          />
        </View>

        {/* ── Stats ── */}
        <SectionHeader title="STATS" />
        <View style={styles.section}>
          <SettingRow
            icon={<Flame size={20} color="#FF6B35" strokeWidth={1.8} />}
            label="Current streak"
            value={`${current_streak} week${current_streak !== 1 ? 's' : ''}`}
          />
          <Separator />
          <SettingRow
            icon={<Target size={20} color={Colors.primary} strokeWidth={1.8} />}
            label="Longest streak"
            value={`${longest_streak} week${longest_streak !== 1 ? 's' : ''}`}
          />
          <Separator />
          <SettingRow
            icon={<Dumbbell size={20} color={Colors.primary} strokeWidth={1.8} />}
            label="Total gym visits"
            value={`${total_visits}`}
          />
        </View>

        {/* ── Appearance ── */}
        <SectionHeader title="APPEARANCE" />
        <View style={styles.section}>
          <SettingRow
            icon={<Moon size={20} color={Colors.primary} strokeWidth={1.8} />}
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{false: colors.border, true: Colors.primary + '88'}}
                thumbColor={isDark ? Colors.primary : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
            }
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

      {/* ── Gym Schedule Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={scheduleVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setScheduleVisible(false)}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setScheduleVisible(false)}
              activeOpacity={0.7}>
              <X size={20} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Gym Schedule</Text>
            <View style={{width: 36}} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}>

            {/* ── Days ── */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <CalendarDays size={18} color={Colors.primary} strokeWidth={1.8} />
                <Text style={styles.modalSectionTitle}>Training days</Text>
              </View>
              <View style={styles.daysRow}>
                {DAYS.map(d => {
                  const active = selectedDays.includes(d.value);
                  return (
                    <TouchableOpacity
                      key={d.value}
                      style={[styles.dayPill, active && styles.dayPillActive]}
                      onPress={() => toggleDay(d.value)}
                      activeOpacity={0.75}>
                      {active && <Check size={11} color={Colors.white} strokeWidth={3} style={{marginBottom: 1}} />}
                      <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.daysHint}>
                {selectedDays.length === 0
                  ? 'Select at least one day'
                  : `${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''} · ${selectedDays.length}x/week goal`}
              </Text>
            </View>

            {/* ── Lock start time ── */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Clock size={18} color={Colors.primary} strokeWidth={1.8} />
                <Text style={styles.modalSectionTitle}>Locks at</Text>
              </View>
              <ScrollView
                horizontal
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
                      <Text style={[styles.timePillText, active && styles.timePillTextActive]}>
                        {h.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Lock end time ── */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Clock size={18} color={Colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.modalSectionTitle}>Unlocks at</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeScroll}>
                {HOURS.map(h => {
                  const active = endTime === h.value;
                  return (
                    <TouchableOpacity
                      key={h.value}
                      style={[styles.timePill, active && styles.timePillActive]}
                      onPress={() => setEndTime(h.value)}
                      activeOpacity={0.75}>
                      <Text style={[styles.timePillText, active && styles.timePillTextActive]}>
                        {h.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Preview */}
            <View style={styles.timePreview}>
              <Text style={styles.timePreviewText}>
                {formatTime(startTime)} → {formatTime(endTime)}
              </Text>
              <Text style={styles.timePreviewSub}>daily lock window</Text>
            </View>

          </ScrollView>

          {/* Save button */}
          <View style={styles.modalSaveFooter}>
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && {opacity: 0.5}]}
              onPress={saveSchedule}
              disabled={saving}
              activeOpacity={0.8}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.modalSaveBtnText}>Save Schedule</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},
  header: {paddingTop: Spacing.lg, paddingBottom: Spacing.lg},
  title: {...Typography.h2, color: colors.textPrimary, letterSpacing: -0.5},

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  avatarText: {fontSize: 22, fontWeight: '700', color: Colors.white},
  profileInfo: {flex: 1},
  profileName: {...Typography.h4, color: colors.textPrimary, marginBottom: 3, fontWeight: '700'},
  profileEmail: {...Typography.bodySmall, color: colors.textMuted},

  // Sections
  sectionHeader: {
    ...Typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  section: {
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  separator: {height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.md},

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
  rowLabel: {...Typography.body, color: colors.textPrimary},
  destructiveLabel: {color: Colors.error},
  rowValue: {...Typography.bodySmall, color: colors.textMuted, flexShrink: 1, textAlign: 'right', maxWidth: 180},
  rowChevron: {fontSize: 22, color: colors.textMuted},

  // Footer
  footer: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.glass,
  },
  modalTitle: {...Typography.h4, color: colors.textPrimary, fontWeight: '700'},
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.glass,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.40,
    shadowRadius: 16,
  },
  modalSaveBtnText: {color: Colors.white, fontWeight: '700', fontSize: 16},
  modalScroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.lg},
  modalSection: {marginBottom: Spacing.xl},
  modalSectionHeader: {flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md},
  modalSectionTitle: {...Typography.h4, color: colors.textPrimary, fontWeight: '600'},

  // Days
  daysRow: {flexDirection: 'row', gap: 8, flexWrap: 'nowrap'},
  dayPill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  dayPillText: {...Typography.caption, color: colors.textMuted, fontWeight: '600'},
  dayPillTextActive: {color: Colors.white},
  daysHint: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Time picker
  timeScroll: {paddingVertical: 4, gap: 8},
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  timePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.40,
    shadowRadius: 8,
  },
  timePillText: {...Typography.bodySmall, color: colors.textMuted, fontWeight: '600'},
  timePillTextActive: {color: Colors.white},

  // Preview
  timePreview: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  timePreviewText: {...Typography.h3, color: Colors.primary, fontWeight: '700'},
  timePreviewSub: {...Typography.caption, color: colors.textMuted, marginTop: 4},
});

export default SettingsScreen;
