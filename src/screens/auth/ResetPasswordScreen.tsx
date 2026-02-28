import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {AuthStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import {supabase} from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
  route: RouteProp<AuthStackParamList, 'ResetPassword'>;
};

interface Requirement {
  label: string;
  met: boolean;
}

const ResetPasswordScreen: React.FC<Props> = ({navigation, route}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {email} = route.params;

  const requirements: Requirement[] = [
    {label: 'At least 6 characters', met: newPassword.length >= 6},
    {label: 'One uppercase letter', met: /[A-Z]/.test(newPassword)},
    {label: 'One number', met: /[0-9]/.test(newPassword)},
    {label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword)},
  ];

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!newPassword) {
      e.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      e.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) {return;}
    setLoading(true);
    try {
      const {error} = await supabase.auth.updateUser({password: newPassword});
      if (error) {
        throw new Error(error.message);
      }
      setSuccess(true);
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successScreen}>
          <View style={styles.iconRing}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.subtitle}>
            Your password has been successfully updated. You can now sign in
            with your new password.
          </Text>
          <PrimaryButton
            title="Sign In Now"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.iconRing}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a new strong password for your account.
          </Text>

          <View style={styles.card}>
            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={t => {
                setNewPassword(t);
                if (errors.newPassword) {
                  setErrors(p => ({...p, newPassword: undefined}));
                }
              }}
              isPassword
              error={errors.newPassword}
            />

            <InputField
              label="Confirm New Password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChangeText={t => {
                setConfirmPassword(t);
                if (errors.confirmPassword) {
                  setErrors(p => ({...p, confirmPassword: undefined}));
                }
              }}
              isPassword
              error={errors.confirmPassword}
            />

            {/* Requirements checklist */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Password Requirements</Text>
              {requirements.map((req, i) => (
                <View key={i} style={styles.reqRow}>
                  <Text
                    style={[styles.reqIcon, req.met && styles.reqIconMet]}>
                    {req.met ? '✓' : '○'}
                  </Text>
                  <Text
                    style={[styles.reqText, req.met && styles.reqTextMet]}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            <PrimaryButton
              title="Reset Password"
              onPress={handleReset}
              loading={loading}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  flex: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  backButton: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {color: Colors.primary, fontSize: 16, fontWeight: '500'},
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  iconEmoji: {fontSize: 40},
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  requirementsBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: Spacing.sm,
  },
  reqIcon: {fontSize: 13, color: Colors.textMuted, width: 16},
  reqIconMet: {color: Colors.success},
  reqText: {fontSize: 13, color: Colors.textMuted},
  reqTextMet: {color: Colors.textSecondary},
  // Success screen
  successScreen: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  successEmoji: {fontSize: 44},
  actionButton: {marginTop: Spacing.xl, width: '100%'},
});

export default ResetPasswordScreen;
