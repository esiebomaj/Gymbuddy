import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {Colors, Spacing, Radius, Typography} from '../../theme';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
}

export const GoogleLogo = ({size = 20}: {size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

// Apple logo character (U+F8FF) renders as  on Apple devices
const AppleLogo = () => <Text style={styles.appleLogoText}>{'\uF8FF'}</Text>;

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  loading = false,
}) => {
  const isGoogle = provider === 'google';

  return (
    <TouchableOpacity
      style={[styles.button, isGoogle ? styles.googleButton : styles.appleButton]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator
          color={isGoogle ? '#333' : Colors.white}
          size="small"
        />
      ) : (
        <>
          {isGoogle ? <GoogleLogo /> : <AppleLogo />}
          <Text
            style={[
              styles.buttonText,
              isGoogle ? styles.googleText : styles.appleText,
            ]}>
            {isGoogle ? 'Continue with Google' : 'Continue with Apple'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  googleButton: {
    backgroundColor: Colors.googleBg,
  },
  appleButton: {
    backgroundColor: Colors.appleBg,
    borderWidth: 1,
    borderColor: '#333333',
  },
  
  appleLogoText: {
    fontSize: 20,
    color: Colors.white,
    lineHeight: 24,
  },
  buttonText: {
    ...Typography.h4,
    letterSpacing: 0.2,
  },
  googleText: {
    color: '#1C1C1E',
  },
  appleText: {
    color: Colors.white,
  },
});

export default SocialButton;
