import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {ChevronLeft, ChevronRight, Smartphone, Lock, ShieldAlert} from 'lucide-react-native';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useLock} from '../../context/LockContext';
import PrimaryButton from '../../components/common/PrimaryButton';
import GlassBackground from '../../components/common/GlassBackground';

const AppSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    status,
    selectedAppCount,
    screenTimeAuthorized,
    isLoading,
    requestAuthorization,
    selectApps,
  } = useLock();
  const {colors, isDark, barStyle} = useTheme();
  const styles = makeStyles(colors);

  const isLocked = status === 'locked';
  const hasApps = selectedAppCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      <GlassBackground isDark={isDark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>App Selection</Text>
          <Text style={styles.subtitle}>
            Select apps to restrict — they lock immediately and stay locked until you hit the gym
          </Text>
        </View>

        {/* ── Authorization Gate ── */}
        {!screenTimeAuthorized ? (
          <View style={styles.gateCard}>
            <View style={styles.gateIconWrap}>
              <ShieldAlert size={40} color={Colors.primary} strokeWidth={1.6} />
            </View>
            <Text style={styles.gateTitle}>Screen Time Access Needed</Text>
            <Text style={styles.gateDesc}>
              GymBuddy needs Screen Time permission to lock apps on your behalf.
              This is required before you can select apps.
            </Text>
            <PrimaryButton
              title="Grant Permission"
              onPress={requestAuthorization}
              loading={isLoading}
              style={styles.gateButton}
            />
          </View>
        ) : (
          <>
            {/* ── Selected Count Badge ── */}
            <View style={styles.countCard}>
              <View style={[styles.countBadge, hasApps && styles.countBadgeActive]}>
                <Text style={styles.countNumber}>{selectedAppCount}</Text>
              </View>
              <View style={styles.countInfo}>
                <Text style={styles.countTitle}>
                  {hasApps
                    ? `${selectedAppCount} app${selectedAppCount !== 1 ? 's' : ''} selected`
                    : 'No apps selected'}
                </Text>
                <Text style={styles.countSubtitle}>
                  {hasApps
                    ? 'These apps are locked — submit gym proof to unlock'
                    : 'Tap the button below to pick apps to lock'}
                </Text>
              </View>
            </View>

            {/* ── Native Picker CTA ── */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={selectApps}
              disabled={isLoading}
              activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <Smartphone size={28} color={Colors.primary} strokeWidth={1.6} />
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerTitle}>
                      {hasApps ? 'Change App Selection' : 'Select Apps to Lock'}
                    </Text>
                    <Text style={styles.pickerSubtitle}>
                      {isLocked ? 'Add or change locked apps — lock stays active' : 'Apps lock immediately after selection'}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.primary} strokeWidth={2} />
                </>
              )}
            </TouchableOpacity>

            {/* ── Selected Apps ── */}
            {hasApps ? (
              <>
                <Text style={styles.sectionLabel}>LOCKED APPS</Text>
                <View style={styles.appGrid}>
                  {Array.from({length: selectedAppCount}).map((_, i) => (
                    <View key={i} style={styles.appTile}>
                      <Lock size={22} color={Colors.primary} strokeWidth={1.8} />
                      <Text style={styles.appTileLabel}>App {i + 1}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.privacyNote}>
                  <Text style={styles.privacyNoteText}>
                    🔐 iOS hides app names for privacy. Your selections are enforced by the system.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIconWrap}>
                  <Smartphone size={44} color={colors.textMuted} strokeWidth={1.4} />
                </View>
                <Text style={styles.emptyStateText}>No apps selected yet</Text>
                <Text style={styles.emptyStateHint}>
                  Tap the button above to choose which apps to lock
                </Text>
              </View>
            )}

          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {...Typography.h2, color: colors.textPrimary, marginBottom: Spacing.xs, letterSpacing: -0.5},
  subtitle: {...Typography.body, color: colors.textSecondary, lineHeight: 22},
  // Gate
  gateCard: {
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  gateIconWrap: {marginBottom: Spacing.md},
  gateTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  gateDesc: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  gateButton: {width: '100%'},
  // Count card
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  countBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  countNumber: {...Typography.h2, color: colors.textPrimary, letterSpacing: -1},
  countInfo: {flex: 1},
  countTitle: {...Typography.h4, color: colors.textPrimary, marginBottom: 3, fontWeight: '700'},
  countSubtitle: {...Typography.bodySmall, color: colors.textMuted, lineHeight: 18},
  // Picker button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderFocused,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    minHeight: 64,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.20,
    shadowRadius: 12,
  },
  pickerButtonDisabled: {
    borderColor: colors.border,
    shadowOpacity: 0,
    opacity: 0.5,
  },
  pickerContent: {flex: 1},
  pickerTitle: {...Typography.h4, color: Colors.primary, marginBottom: 2, fontWeight: '700'},
  pickerSubtitle: {...Typography.bodySmall, color: colors.textMuted},
  lockedNotice: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.error}55`,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lockedNoticeText: {color: Colors.error, fontSize: 13, fontWeight: '500', textAlign: 'center'},
  // Selected apps section
  sectionLabel: {
    ...Typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  appTile: {
    width: 72,
    height: 80,
    backgroundColor: colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  appTileLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  privacyNote: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.22)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  privacyNoteText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyStateIconWrap: {marginBottom: Spacing.xs},
  emptyStateText: {
    ...Typography.h4,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyStateHint: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});

export default AppSelectionScreen;
