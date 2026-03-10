import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {Colors, Radius, Typography} from '../../theme';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <View style={[variant === 'primary' && !isDisabled && styles.glow, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          variant === 'primary' && styles.primaryButton,
          variant === 'outline' && styles.outlineButton,
          variant === 'ghost' && styles.ghostButton,
          isDisabled && styles.disabledButton,
        ]}
        disabled={isDisabled}
        activeOpacity={0.82}
        {...props}>
        {/* Inner top highlight */}
        {variant === 'primary' && (
          <View pointerEvents="none" style={styles.innerHighlight} />
        )}
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.white : Colors.primary}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.buttonText,
              variant === 'primary' && styles.primaryText,
              variant === 'outline' && styles.outlineText,
              variant === 'ghost' && styles.ghostText,
            ]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  button: {
    height: 56,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    ...Typography.h4,
    letterSpacing: 0.3,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: '700',
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
});

export default PrimaryButton;
