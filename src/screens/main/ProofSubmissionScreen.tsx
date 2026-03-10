import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera, type CameraOptions} from 'react-native-image-picker';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useLock} from '../../context/LockContext';
import PrimaryButton from '../../components/common/PrimaryButton';

// ── Constants ────────────────────────────────────────────────────────────────

const WORKOUT_TYPES = [
  {key: 'weights',   label: 'Weights',   icon: '🏋️'},
  {key: 'cardio',    label: 'Cardio',    icon: '🏃'},
  {key: 'hiit',      label: 'HIIT',      icon: '⚡'},
  {key: 'sport',     label: 'Sport',     icon: '⚽'},
  {key: 'yoga',      label: 'Yoga',      icon: '🧘'},
  {key: 'other',     label: 'Other',     icon: '💪'},
];

// ── Component ─────────────────────────────────────────────────────────────────

const ProofSubmissionScreen: React.FC = () => {
  const {status, isLoading, submitProof, settings, stats} = useLock();
  const {colors, isDark, barStyle} = useTheme();
  const styles = makeStyles(colors);

  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [selectedWorkout, setSelectedWorkout] = useState<string>('other');
  const [submitted, setSubmitted] = useState<boolean | null>(null);

  const isLocked = status === 'locked';

  // Format the next lock time from settings for display
  const nextLockTime = (() => {
    const t = settings.lock_start_time ?? '06:00';
    const h = parseInt(t.split(':')[0], 10);
    const suffix = h < 12 ? 'AM' : 'PM';
    const disp = h === 0 ? 12 : h === 12 ? 12 : h > 12 ? h - 12 : h;
    return `${disp}:00 ${suffix}`;
  })();

  const cameraOpts: CameraOptions = {
    mediaType: 'photo',
    cameraType: 'back',
    quality: 0.8,
    maxWidth: 1280,
    maxHeight: 1280,
    saveToPhotos: false,
  };

  const handleTakePhoto = async () => {
    const result = await launchCamera(cameraOpts);
    if (result.didCancel || result.errorCode) {
      if (result.errorCode === 'camera_unavailable') {
        Alert.alert('Camera Unavailable', 'This device does not have a camera.');
      } else if (result.errorCode === 'permission') {
        Alert.alert(
          'Permission Denied',
          'Please enable camera access in Settings to take gym photos.',
        );
      }
      return;
    }
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setPhotoUri(asset.uri);
      setPhotoTaken(true);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitProof(selectedWorkout, undefined, photoUri);
      setSubmitted(true);
    } catch {
      // submitProof already shows the error alert — clear the photo so user retakes
      setPhotoTaken(false);
      setPhotoUri(undefined);
    }
  };

  const handleLogAnother = () => {
    setPhotoTaken(false);
    setPhotoUri(undefined);
    setSelectedWorkout('other');
    setSubmitted(false);
  };

  // ── Unlocked confirmation (shown when already visited today) ──
  if (submitted ?? stats.visited_today) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🏆</Text>
          <Text style={styles.successTitle}>Apps Unlocked!</Text>
          <Text style={styles.successDesc}>
            You've proven you hit the gym today. Your apps stay unlocked until tomorrow.
          </Text>

          <View style={styles.nextLockCard}>
            <Text style={styles.nextLockLabel}>NEXT LOCK</Text>
            <Text style={styles.nextLockTime}>Tomorrow · {nextLockTime}</Text>
          </View>

          {/* <TouchableOpacity
            style={styles.logAnotherBtn}
            onPress={handleLogAnother}
            activeOpacity={0.7}>
            <Text style={styles.logAnotherText}>Log another workout →</Text>
          </TouchableOpacity> */}

        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Submit Proof</Text>
          <Text style={styles.subtitle}>
            Prove you hit the gym to unlock your apps
          </Text>
        </View>

        {/* ── Not locked warning ── */}
        {!isLocked && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ℹ️ Your apps aren't currently locked — you can still submit proof to log your workout
            </Text>
          </View>
        )}

        {/* ── Photo ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, photoTaken && styles.stepBadgeDone]}>
              <Text style={styles.stepBadgeText}>{photoTaken ? '✓' : '1'}</Text>
            </View>
            <Text style={styles.stepTitle}>Gym Photo</Text>
            <Text style={styles.stepRequired}>Required</Text>
          </View>

          <TouchableOpacity
            style={[styles.photoBox, photoTaken && styles.photoBoxDone]}
            onPress={handleTakePhoto}
            activeOpacity={0.75}>
            {photoTaken && photoUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{uri: photoUri}} style={styles.photoPreview} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>Tap to change</Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.photoCameraIcon}>📷</Text>
                <Text style={styles.photoBoxText}>Tap to take gym photo</Text>
                <Text style={styles.photoBoxSubtext}>
                  Show yourself at the gym, equipment, or your workout
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Workout Type ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, selectedWorkout !== 'other' && styles.stepBadgeDone]}>
              <Text style={styles.stepBadgeText}>{selectedWorkout !== 'other' ? '✓' : '2'}</Text>
            </View>
            <Text style={styles.stepTitle}>Workout Type</Text>
            <Text style={styles.stepOptional}>Optional</Text>
          </View>
          <View style={styles.pillGrid}>
            {WORKOUT_TYPES.map(w => (
              <TouchableOpacity
                key={w.key}
                style={[styles.pill, selectedWorkout === w.key && styles.pillSelected]}
                onPress={() => setSelectedWorkout(w.key)}
                activeOpacity={0.7}>
                <Text style={styles.pillIcon}>{w.icon}</Text>
                <Text style={[styles.pillLabel, selectedWorkout === w.key && styles.pillLabelSelected]}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Submit ── */}
        <View style={styles.submitSection}>
          <PrimaryButton
            title={isLocked ? '🔓 Submit & Unlock Apps' : 'Submit'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!photoTaken}
          />
          {isLocked && photoTaken && (
            <Text style={styles.submitHint}>
              Your selected apps will be unlocked immediately upon submission
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},

  // Header
  header: {paddingTop: Spacing.lg, paddingBottom: Spacing.xl},
  title: {...Typography.h2, color: colors.textPrimary, marginBottom: Spacing.xs},
  subtitle: {...Typography.body, color: colors.textSecondary, lineHeight: 22},

  // Warning
  warningCard: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: {...Typography.bodySmall, color: Colors.primaryLight, lineHeight: 18},

  // Step card
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepBadgeText: {color: colors.textPrimary, fontSize: 12, fontWeight: '700'},
  stepTitle: {...Typography.h4, color: colors.textPrimary, flex: 1},
  stepRequired: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepOptional: {
    ...Typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Workout pills
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
    gap: 6,
  },
  pillSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  pillIcon: {fontSize: 16},
  pillLabel: {...Typography.bodySmall, color: colors.textSecondary, fontWeight: '500'},
  pillLabelSelected: {color: Colors.primary, fontWeight: '700'},

  // Photo box
  photoBox: {
    height: 200,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    gap: Spacing.xs,
  },
  photoBoxDone: {
    borderStyle: 'solid',
    borderColor: Colors.success,
    backgroundColor: 'rgba(34,224,154,0.06)',
  },
  photoCameraIcon: {fontSize: 40, marginBottom: Spacing.xs},
  photoBoxText: {...Typography.h4, color: colors.textSecondary},
  photoBoxSubtext: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  photoPreviewWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md - 1,
    overflow: 'hidden',
  },
  photoPreview: {width: '100%', height: '100%', resizeMode: 'cover'},
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  photoOverlayText: {...Typography.bodySmall, color: '#fff', fontWeight: '600'},

  // Submit
  submitSection: {gap: Spacing.md, marginTop: Spacing.sm},
  submitHint: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Unlocked confirmation screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  successEmoji: {fontSize: 72, marginBottom: Spacing.lg},
  successTitle: {
    ...Typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successDesc: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  nextLockCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  nextLockLabel: {
    ...Typography.label,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  nextLockTime: {...Typography.h3, color: Colors.primary},
  logAnotherBtn: {paddingVertical: Spacing.sm},
  logAnotherText: {...Typography.body, color: colors.textMuted},
});

export default ProofSubmissionScreen;

