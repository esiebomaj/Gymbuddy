import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import {GoogleLogo} from '../../components/common/SocialButton';
import SocialButton from '../../components/common/SocialButton';
import {useAuth} from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface StrengthInfo {
  label: string;
  color: string;
  bars: number;
}

const getPasswordStrength = (password: string): StrengthInfo | null => {
  if (!password) {return null;}
  let score = 0;
  if (password.length >= 8) {score++;}
  if (/[A-Z]/.test(password)) {score++;}
  if (/[0-9]/.test(password)) {score++;}
  if (/[^A-Za-z0-9]/.test(password)) {score++;}
  if (score <= 1) {return {label: 'Weak', color: '#FF4C6A', bars: 1};}
  if (score === 2) {return {label: 'Fair', color: '#FFA040', bars: 2};}
  if (score === 3) {return {label: 'Good', color: '#FFD040', bars: 3};}
  return {label: 'Strong', color: '#22E09A', bars: 4};
};

const PasswordStrengthBar: React.FC<{password: string}> = ({password}) => {
  const strength = getPasswordStrength(password);
  const {colors} = useTheme();
  if (!strength) {return null;}
  return (
    <View style={strengthStyles.row}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              {backgroundColor: i <= strength.bars ? strength.color : colors.border},
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, {color: strength.color}]}>
        {strength.label}
      </Text>
    </View>
  );
};

const strengthStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  bars: {flexDirection: 'row', flex: 1, gap: 4},
  bar: {flex: 1, height: 3, borderRadius: 2},
  label: {fontSize: 12, fontWeight: '600', minWidth: 46, textAlign: 'right'},
});

const SignUpScreen: React.FC<Props> = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const {colors, isDark, barStyle} = useTheme();
  const styles = makeStyles(colors);

  const {signInWithGoogle, signInWithApple, signUp} = useAuth();

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) {e.name = 'Full name is required';}
    if (!email.trim()) {e.email = 'Email is required';}
    else if (!/\S+@\S+\.\S+/.test(email)) {e.email = 'Enter a valid email address';}
    if (!password) {e.password = 'Password is required';}
    else if (password.length < 6) {e.password = 'Password must be at least 6 characters';}
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors(p => ({...p, [field]: undefined}));

  const handleSignUp = async () => {
    if (!validate()) {return;}
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message ?? 'Something went wrong.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Apple Sign In Failed', error.message ?? 'Something went wrong.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ── Back ── */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join thousands of gym enthusiasts
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <InputField
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={t => { setName(t); clearError('name'); }}
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
            />

            <InputField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={t => { setEmail(t); clearError('email'); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <InputField
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={t => { setPassword(t); clearError('password'); }}
              isPassword
              error={errors.password}
            />
            {password.length > 0 && <PasswordStrengthBar password={password} />}

            <PrimaryButton
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
            />

            {/* ── Divider ── */}
            {/* <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View> */}

            {/* ── Google ── */}
            {/* <TouchableOpacity
              style={styles.googleButton}
              onPress={async () => {
                setGoogleLoading(true);
                try {
                  await signInWithGoogle();
                } catch (error: any) {
                  if (error.code !== 'SIGN_IN_CANCELLED') {
                    Alert.alert('Google Sign Up Failed', error.message ?? 'Something went wrong.');
                  }
                } finally {
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading}
              activeOpacity={0.85}>
              <GoogleLogo />
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Signing up…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* ── Social ── */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialStack}>
            <SocialButton
              provider="google"
              onPress={handleGoogleSignUp}
              loading={socialLoading === 'google'}
            />
            <SocialButton
              provider="apple"
              onPress={handleAppleSignUp}
              loading={socialLoading === 'apple'}
            />
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
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
  header: {paddingTop: Spacing.sm, paddingBottom: Spacing.lg},
  title: {
    ...Typography.h2,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {...Typography.body, color: colors.textSecondary},
  card: {
    backgroundColor: colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: Radius.xl,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: Spacing.sm,
  },
  googleButtonText: {
    ...Typography.h4,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  form: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {color: colors.textSecondary, fontSize: 15},
  footerLink: {color: Colors.primary, fontSize: 15, fontWeight: '700'},
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    ...Typography.bodySmall,
    color: colors.textMuted,
  },
  socialStack: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});

export default SignUpScreen;
