import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import {Colors, Spacing, Radius, Typography} from '../../theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecure(v => !v)}
            style={styles.eyeButton}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.eyeText}>{isSecure ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  inputFocused: {
    borderColor: Colors.borderFocused,
    backgroundColor: Colors.surfaceElevated,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
  },
  eyeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: 2,
  },
});

export default InputField;
