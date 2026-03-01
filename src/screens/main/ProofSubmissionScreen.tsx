import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera, type CameraOptions} from 'react-native-image-picker';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import {useLock} from '../../context/LockContext';
import PrimaryButton from '../../components/common/PrimaryButton';

// ── Workout types ─────────────────────────────────────────────────────────────

const WORKOUT_TYPES = [
  {id: 'weights', label: 'Weights', icon: '💪'},
  {id: 'cardio', label: 'Cardio', icon: '🏃'},
  {id: 'yoga', label: 'Yoga', icon: '🧘'},
  {id: 'boxing', label: 'Boxing', icon: '🥊'},
  {id: 'cycling', label: 'Cycling', icon: '🚴'},
  {id: 'swimming', label: 'Swimming', icon: '🏊'},
  {id: 'hiit', label: 'HIIT', icon: '🔥'},
  {id: 'other', label: 'Other', icon: '🏋️'},
];

// ── Component ─────────────────────────────────────────────────────────────────

const ProofSubmissionScreen: React.FC = () => {
  const {status, isLoading, submitProof} = useLock();

  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const isLocked = status === 'locked';
  const canSubmit = selectedWorkout !== null && photoTaken;

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
    if (!selectedWorkout) {return;}
    try {
      await submitProof(
        selectedWorkout,
        note.trim() || undefined,
        photoUri,
      );
      setSubmitted(true);
    } catch {
      // submitProof already shows alerts for errors (409, network, etc.)
    }
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🏆</Text>
          <Text style={styles.successTitle}>Proof Accepted!</Text>
          <Text style={styles.successDesc}>
            Your workout has been logged and your apps are unlocked for today. Keep up the grind!
          </Text>
          <View style={styles.successDetails}>
            <Text style={styles.successDetailText}>
              {WORKOUT_TYPES.find(w => w.id === selectedWorkout)?.icon}{' '}
              {WORKOUT_TYPES.find(w => w.id === selectedWorkout)?.label} session logged
            </Text>
            {note.trim() !== '' && (
              <Text style={styles.successNote}>"{note.trim()}"</Text>
            )}
          </View>
          <PrimaryButton
            title="Back to Dashboard"
            onPress={() => setSubmitted(false)}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
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

        {/* ── Step 1: Photo ── */}
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

        {/* ── Step 2: Workout type ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, selectedWorkout !== null && styles.stepBadgeDone]}>
              <Text style={styles.stepBadgeText}>
                {selectedWorkout !== null ? '✓' : '2'}
              </Text>
            </View>
            <Text style={styles.stepTitle}>Workout Type</Text>
            <Text style={styles.stepRequired}>Required</Text>
          </View>

          <View style={styles.pillGrid}>
            {WORKOUT_TYPES.map(w => {
              const selected = selectedWorkout === w.id;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setSelectedWorkout(w.id)}
                  activeOpacity={0.7}>
                  <Text style={styles.pillIcon}>{w.icon}</Text>
                  <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
                    {w.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Step 3: Note (optional) ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Check-in Note</Text>
            <Text style={styles.stepOptional}>Optional</Text>
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="How was the session? Personal best? New PR?"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            maxLength={280}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{note.length}/280</Text>
        </View>

        {/* ── Submit ── */}
        <View style={styles.submitSection}>
          {!canSubmit && (
            <View style={styles.checklistCard}>
              <Text style={styles.checklistTitle}>Before you submit:</Text>
              <Text style={[styles.checklistItem, photoTaken && styles.checklistDone]}>
                {photoTaken ? '✅' : '⬜'} Take a gym photo
              </Text>
              <Text style={[styles.checklistItem, selectedWorkout !== null && styles.checklistDone]}>
                {selectedWorkout !== null ? '✅' : '⬜'} Select workout type
              </Text>
            </View>
          )}

          <PrimaryButton
            title={isLocked ? '🔓 Submit & Unlock Apps' : '✅ Log Workout'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!canSubmit}
          />

          {isLocked && canSubmit && (
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl},

  // Header
  header: {paddingTop: Spacing.lg, paddingBottom: Spacing.xl},
  title: {...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.xs},
  subtitle: {...Typography.body, color: Colors.textSecondary, lineHeight: 22},

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

  // Step cards
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepBadgeText: {color: Colors.textPrimary, fontSize: 12, fontWeight: '700'},
  stepTitle: {...Typography.h4, color: Colors.textPrimary, flex: 1},
  stepRequired: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepOptional: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Photo box
  photoBox: {
    height: 160,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    gap: Spacing.xs,
  },
  photoBoxDone: {
    borderStyle: 'solid',
    borderColor: Colors.success,
    backgroundColor: 'rgba(34,224,154,0.06)',
  },
  photoCameraIcon: {fontSize: 36, marginBottom: Spacing.xs},
  photoBoxText: {...Typography.h4, color: Colors.textSecondary},
  photoBoxSubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  photoPreviewWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md - 1,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  photoOverlayText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
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
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceElevated,
    gap: 6,
  },
  pillSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  pillIcon: {fontSize: 16},
  pillLabel: {...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500'},
  pillLabelSelected: {color: Colors.primary, fontWeight: '700'},

  // Note input
  noteInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 96,
    lineHeight: 22,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // Submit section
  submitSection: {gap: Spacing.md, marginTop: Spacing.sm},
  checklistCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  checklistTitle: {...Typography.label, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.8},
  checklistItem: {...Typography.body, color: Colors.textSecondary},
  checklistDone: {color: Colors.success},
  submitHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Success screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  successEmoji: {fontSize: 72, marginBottom: Spacing.lg},
  successTitle: {...Typography.h1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm},
  successDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  successDetails: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  successDetailText: {...Typography.h4, color: Colors.primary},
  successNote: {...Typography.body, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center'},
  successButton: {width: '100%'},
});

export default ProofSubmissionScreen;
