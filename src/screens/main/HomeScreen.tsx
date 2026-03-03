import React, {useState} from 'react';
import {
  Alert,
  Button,
  NativeModules,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';

const {ScreenTimeManager} = NativeModules;

const HomeScreen: React.FC = () => {
  const [status, setStatus] = useState('Not authorized');
  const [appCount, setAppCount] = useState(0);
  const {user, signOut} = useAuth();
  const {colors} = useTheme();
  const styles = makeStyles(colors);

  const requestAuth = async () => {
    try {
      const result = await ScreenTimeManager.requestAuthorization();
      setStatus(result);
    } catch (e: any) {
      Alert.alert('Auth Error', e.message);
    }
  };

  const pickApps = async () => {
    try {
      const count = await ScreenTimeManager.showAppPicker();
      setAppCount(count);
    } catch (e: any) {
      Alert.alert('Picker Error', e.message);
    }
  };

  const lock = async () => {
    try {
      const result = await ScreenTimeManager.lockApps();
      Alert.alert('Locked 🔒', result);
    } catch (e: any) {
      Alert.alert('Lock Error', e.message);
    }
  };

  const unlock = async () => {
    try {
      const result = await ScreenTimeManager.unlockApps();
      Alert.alert('Unlocked 🏋️', result);
    } catch (e: any) {
      Alert.alert('Unlock Error', e.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: signOut},
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name ?? 'Athlete'} 💪</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Screen Time Status</Text>
        <Text style={styles.statusValue}>{status}</Text>
        {appCount > 0 && (
          <Text style={styles.appCount}>{appCount} apps selected</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={requestAuth}>
          <Text style={styles.actionIcon}>🔐</Text>
          <Text style={styles.actionLabel}>Request Authorization</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={pickApps}>
          <Text style={styles.actionIcon}>📱</Text>
          <Text style={styles.actionLabel}>Select Apps to Lock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={lock}>
          <Text style={styles.actionIcon}>🔒</Text>
          <Text style={styles.actionLabel}>Lock Selected Apps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={unlock}>
          <Text style={styles.actionIcon}>🏋️</Text>
          <Text style={[styles.actionLabel, styles.primaryActionLabel]}>
            Gym Check-In (Unlock)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  userName: {
    ...Typography.h3,
    color: colors.textPrimary,
    marginTop: 2,
  },
  signOutButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusLabel: {
    ...Typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    ...Typography.h4,
    color: colors.textPrimary,
  },
  appCount: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  actionIcon: {fontSize: 22},
  actionLabel: {
    ...Typography.h4,
    color: colors.textPrimary,
  },
  primaryActionLabel: {
    color: Colors.white,
  },
});

export default HomeScreen;
