import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Radius} from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Stronger glass — higher opacity surface */
  elevated?: boolean;
  /** Show a subtle inner top-edge highlight ("glass rim") */
  highlight?: boolean;
  padding?: number;
}

/**
 * Reusable iOS-style glassmorphic card.
 * In dark mode: translucent white overlay with white border.
 * In light mode: translucent white with soft shadow.
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  elevated = false,
  highlight = true,
  padding,
}) => {
  const {colors, isDark} = useTheme();

  const bg = elevated ? colors.surfaceElevated : colors.glass;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: colors.glassBorder,
          padding: padding ?? 16,
        },
        !isDark && styles.lightShadow,
        style,
      ]}>
      {/* Inner top-edge highlight */}
      {highlight && (
        <View
          pointerEvents="none"
          style={[
            styles.highlight,
            {backgroundColor: colors.glassHighlight},
          ]}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    opacity: 0.5,
    borderRadius: 1,
  },
  lightShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
});

export default GlassCard;
