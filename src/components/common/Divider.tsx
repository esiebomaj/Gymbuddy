import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Spacing, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';

interface DividerProps {
  text?: string;
}

const Divider: React.FC<DividerProps> = ({text = 'or'}) => {
  const {colors} = useTheme();
  const styles = makeStyles(colors);
  return (
  <View style={styles.container}>
    <View style={styles.line} />
    <Text style={styles.text}>{text}</Text>
    <View style={styles.line} />
  </View>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  text: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default Divider;
