import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import {Colors, Spacing, Radius, Typography} from '../../theme';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
}

const GoogleLogo = () => (
  <View style={styles.googleLogo}>
    <Text style={styles.googleLogoText}>G</Text>
  </View>
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
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogoText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4285F4',
    lineHeight: 22,
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
