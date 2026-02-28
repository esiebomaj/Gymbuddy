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
import {AuthStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import {KeyRound} from 'lucide-react-native';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import {useAuth} from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {sendPasswordReset} = useAuth();

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSend = async () => {
    if (!validate()) {return;}
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

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

          {sent ? (
            /* ── Success State ── */
            <View style={styles.centeredSection}>
              <View style={styles.iconRing}>
                <Text style={styles.iconEmoji}>✉️</Text>
              </View>
              <Text style={styles.title}>Check Your Inbox</Text>
              <Text style={styles.subtitle}>
                We've sent a password reset link to:
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.emailBadgeText}>{email}</Text>
              </View>
              <Text style={styles.hint}>
                Didn't receive it? Check your spam folder or try again.
              </Text>

              <PrimaryButton
                title="Back to Sign In"
                onPress={() => navigation.navigate('SignIn')}
                style={styles.actionButton}
              />
              <TouchableOpacity onPress={() => setSent(false)} style={styles.resendRow}>
                <Text style={styles.resendText}>Resend Email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form State ── */
            <>
              <View style={styles.iconRing}>
                <KeyRound size={36} color={Colors.primary} strokeWidth={1.6} />
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you a reset link.
              </Text>

              <View style={styles.card}>
                <InputField
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={t => {
                    setEmail(t);
                    if (emailError) {setEmailError(undefined);}
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={emailError}
                />
                <PrimaryButton
                  title="Send Reset Link"
                  onPress={handleSend}
                  loading={loading}
                />
              </View>

              <TouchableOpacity
                style={styles.backToSignIn}
                onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.backToSignInText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}

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
  centeredSection: {alignItems: 'center', paddingTop: Spacing.sm},
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
    marginBottom: Spacing.md,
  },
  backToSignIn: {alignSelf: 'center', paddingVertical: Spacing.sm},
  backToSignInText: {color: Colors.primary, fontSize: 15, fontWeight: '500'},
  // Success state
  emailBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emailBadgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  actionButton: {marginTop: Spacing.xl, width: '100%'},
  resendRow: {paddingVertical: Spacing.md},
  resendText: {color: Colors.primary, fontSize: 14, fontWeight: '600'},
});

export default ForgotPasswordScreen;
