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
import {Colors, Spacing, Radius, Typography} from '../../theme';
import {useLock} from '../../context/LockContext';
import PrimaryButton from '../../components/common/PrimaryButton';

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

  const isLocked = status === 'locked';
  const hasApps = selectedAppCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2} />
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
              style={[styles.pickerButton, isLocked && styles.pickerButtonDisabled]}
              onPress={selectApps}
              disabled={isLoading || isLocked}
              activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <Smartphone size={28} color={isLocked ? Colors.textMuted : Colors.primary} strokeWidth={1.6} />
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerTitle}>
                      {hasApps ? 'Change App Selection' : 'Select Apps to Lock'}
                    </Text>
                    <Text style={styles.pickerSubtitle}>
                      Apps lock immediately after selection
                    </Text>
                  </View>
                  <ChevronRight size={20} color={isLocked ? Colors.textMuted : Colors.primary} strokeWidth={2} />
                </>
              )}
            </TouchableOpacity>

            {isLocked && (
              <View style={styles.lockedNotice}>
                <Text style={styles.lockedNoticeText}>
                  🔒 Submit gym proof first, then you can update your app selection
                </Text>
              </View>
            )}

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
                  <Smartphone size={44} color={Colors.textMuted} strokeWidth={1.4} />
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.xs},
  subtitle: {...Typography.body, color: Colors.textSecondary, lineHeight: 22},
  // Gate
  gateCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  gateIconWrap: {marginBottom: Spacing.md},
  gateTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  gateDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  gateButton: {width: '100%'},
  // Count card
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  countBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: Colors.primary,
  },
  countNumber: {...Typography.h2, color: Colors.textPrimary},
  countInfo: {flex: 1},
  countTitle: {...Typography.h4, color: Colors.textPrimary, marginBottom: 3},
  countSubtitle: {...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18},
  // Picker button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderFocused,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    minHeight: 64,
  },
  pickerButtonDisabled: {
    borderColor: Colors.border,
    opacity: 0.5,
  },
  pickerContent: {flex: 1},
  pickerTitle: {...Typography.h4, color: Colors.primary, marginBottom: 2},
  pickerSubtitle: {...Typography.bodySmall, color: Colors.textMuted},
  lockedNotice: {
    backgroundColor: 'rgba(255,76,106,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lockedNoticeText: {color: Colors.error, fontSize: 13, fontWeight: '500', textAlign: 'center'},
  // Selected apps section
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  appTileLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  privacyNote: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  privacyNoteText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
  },
  emptyStateHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});

export default AppSelectionScreen;
