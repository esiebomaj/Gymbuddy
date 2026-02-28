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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {Colors, Spacing, Radius, Typography} from '../../theme';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
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
  if (score <= 1) {return {label: 'Weak', color: Colors.error, bars: 1};}
  if (score === 2) {return {label: 'Fair', color: '#FFA040', bars: 2};}
  if (score === 3) {return {label: 'Good', color: '#FFD040', bars: 3};}
  return {label: 'Strong', color: Colors.success, bars: 4};
};

const PasswordStrengthBar: React.FC<{password: string}> = ({password}) => {
  const strength = getPasswordStrength(password);
  if (!strength) {return null;}
  return (
    <View style={strengthStyles.row}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              {backgroundColor: i <= strength.bars ? strength.color : Colors.border},
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) {e.name = 'Full name is required';}
    if (!email.trim()) {e.email = 'Email is required';}
    else if (!/\S+@\S+\.\S+/.test(email)) {e.email = 'Enter a valid email address';}
    if (!password) {e.password = 'Password is required';}
    else if (password.length < 6) {e.password = 'Password must be at least 6 characters';}
    if (!confirmPassword) {e.confirmPassword = 'Please confirm your password';}
    else if (password !== confirmPassword) {e.confirmPassword = 'Passwords do not match';}
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors(p => ({...p, [field]: undefined}));

  const handleSignUp = async () => {
    if (!validate()) {return;}
    navigation.navigate('Onboarding', {
      name: name.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
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
          <View style={styles.card}>
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

            <InputField
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); clearError('confirmPassword'); }}
              isPassword
              error={errors.confirmPassword}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleSignUp}
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
  header: {paddingTop: Spacing.sm, paddingBottom: Spacing.lg},
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {...Typography.body, color: Colors.textSecondary},
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {color: Colors.textSecondary, fontSize: 15},
  footerLink: {color: Colors.primary, fontSize: 15, fontWeight: '700'},
});

export default SignUpScreen;
