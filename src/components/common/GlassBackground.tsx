import React from 'react';
import {StyleSheet, View} from 'react-native';

interface Props {
  isDark: boolean;
}

/**
 * Renders ambient color "blobs" behind screen content — simulating the
 * mesh-gradient background seen in iOS 16+ / Vision OS.
 * Must be rendered as the first child of a relative-positioned container.
 */
const GlassBackground: React.FC<Props> = ({isDark}) => {
  const o = isDark ? 1 : 0.6;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-left orange glow */}
      <View
        style={[
          styles.blob,
          {
            width: 340,
            height: 340,
            top: -100,
            left: -120,
            borderRadius: 170,
            backgroundColor: `rgba(255,107,53,${isDark ? 0.18 : 0.10})`,
            opacity: o,
          },
        ]}
      />
      {/* Top-right purple glow */}
      <View
        style={[
          styles.blob,
          {
            width: 280,
            height: 280,
            top: 80,
            right: -110,
            borderRadius: 140,
            backgroundColor: `rgba(191,90,242,${isDark ? 0.13 : 0.07})`,
            opacity: o,
          },
        ]}
      />
      {/* Mid-left blue glow */}
      <View
        style={[
          styles.blob,
          {
            width: 260,
            height: 260,
            top: 380,
            left: -80,
            borderRadius: 130,
            backgroundColor: `rgba(10,132,255,${isDark ? 0.10 : 0.05})`,
            opacity: o,
          },
        ]}
      />
      {/* Bottom-right pink glow */}
      <View
        style={[
          styles.blob,
          {
            width: 300,
            height: 300,
            bottom: 60,
            right: -100,
            borderRadius: 150,
            backgroundColor: `rgba(255,45,148,${isDark ? 0.10 : 0.05})`,
            opacity: o,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});

export default GlassBackground;
