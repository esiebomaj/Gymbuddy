import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Spacing} from '../../theme';

interface DividerProps {
  text?: string;
}

const Divider: React.FC<DividerProps> = ({text = 'or'}) => (
  <View style={styles.container}>
    <View style={styles.line} />
    <Text style={styles.text}>{text}</Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default Divider;
