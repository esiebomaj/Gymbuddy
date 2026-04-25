import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Radius} from '../../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = Radius.md,
  style,
}) => {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export default Skeleton;
