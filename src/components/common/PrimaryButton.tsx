import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
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
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'ghost' && styles.ghostButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}>
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
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.h4,
    letterSpacing: 0.3,
  },
  primaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
});

export default PrimaryButton;
