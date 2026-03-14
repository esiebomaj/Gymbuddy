import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Smartphone,
  Lock,
  Camera,
  CheckCircle,
  Flame,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import {Colors, Radius, type AppColors} from '../../theme';
import {useTheme} from '../../context/ThemeContext';
import GlassBackground from '../../components/common/GlassBackground';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
export const INTRO_SEEN_KEY = '@gymbuddy_intro_seen';

// ── Slide data ────────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  bullets: {icon: React.ReactNode; text: string}[];
  accentColor: string;
  glowColor: string;
  IconComponent: React.ReactNode;
}

const makeSlides = (colors: AppColors): Slide[] => [
  {
    id: 'lock',
    tag: 'THE CONCEPT',
    title: 'Lock What\nDistracts You',
    subtitle:
      'Social media, games, anything that steals your time — locked until you hit the gym.',
    bullets: [
      {
        icon: <Smartphone size={16} color={Colors.primary} strokeWidth={2} />,
        text: 'Block your most distracting apps',
      },
      {
        icon: <Lock size={16} color={Colors.primary} strokeWidth={2} />,
        text: 'Powered by iOS Screen Time — private & secure',
      },
      {
        icon: <ShieldCheck size={16} color={Colors.primary} strokeWidth={2} />,
        text: 'GymBuddy never sees which apps you choose',
      },
    ],
    accentColor: Colors.primary,
    glowColor: 'rgba(255,107,53,0.25)',
    IconComponent: null,
  },
  {
    id: 'proof',
    tag: 'HOW IT WORKS',
    title: 'Snap.\nSubmit.\nUnlock.',
    subtitle:
      'Take a quick photo at the gym. Get verified, get unlocked. Simple as that.',
    bullets: [
      {
        icon: <Camera size={16} color="#BF5AF2" strokeWidth={2} />,
        text: 'Submit a gym selfie or equipment photo',
      },
      {
        icon: <CheckCircle size={16} color="#BF5AF2" strokeWidth={2} />,
        text: "AI verifies you're actually at the gym",
      },
      {
        icon: <Smartphone size={16} color="#BF5AF2" strokeWidth={2} />,
        text: 'Apps unlock instantly after approval',
      },
    ],
    accentColor: '#BF5AF2',
    glowColor: 'rgba(191,90,242,0.25)',
    IconComponent: null,
  },
  {
    id: 'streak',
    tag: 'THE HABIT',
    title: 'Build a\nStreak That\nActually Sticks',
    subtitle:
      'Set your gym days. Watch your consistency streak grow. Miss a day — back on lockdown.',
    bullets: [
      {
        icon: <Flame size={16} color="#FF9F0A" strokeWidth={2} />,
        text: 'Track your current & longest streak',
      },
      {
        icon: <TrendingUp size={16} color="#FF9F0A" strokeWidth={2} />,
        text: 'Set your own weekly gym schedule',
      },
      {
        icon: <Lock size={16} color="#FF9F0A" strokeWidth={2} />,
        text: 'Real consequences make habits stick',
      },
    ],
    accentColor: '#FF9F0A',
    glowColor: 'rgba(255,159,10,0.25)',
    IconComponent: null,
  },
];

// ── Slide icons ───────────────────────────────────────────────────────────────

const SlideIcon: React.FC<{slideId: string; accent: string; glow: string}> = ({
  slideId,
  accent,
  glow,
}) => {
  return (
    <View style={[slideIconStyles.wrap, {shadowColor: accent}]}>
      <View style={[slideIconStyles.outerRing, {borderColor: `${accent}30`}]}>
        <View style={[slideIconStyles.innerCircle, {backgroundColor: `${accent}18`}]}>
          {slideId === 'lock' && (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Smartphone size={52} color={accent} strokeWidth={1.4} />
              <View style={slideIconStyles.lockBadge}>
                <Lock size={18} color="#fff" strokeWidth={2.2} />
              </View>
            </View>
          )}
          {slideId === 'proof' && (
            <Camera size={56} color={accent} strokeWidth={1.4} />
          )}
          {slideId === 'streak' && (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Flame size={52} color={accent} strokeWidth={1.4} />
            </View>
          )}
        </View>
      </View>
      {/* Ambient glow blob */}
      <View
        style={[
          slideIconStyles.glow,
          {backgroundColor: glow},
        ]}
      />
    </View>
  );
};

const slideIconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 12,
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: -1,
  },
});

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  onDone: () => void;
}

const IntroScreen: React.FC<Props> = ({onDone}) => {
  const {colors, isDark} = useTheme();
  const styles = makeStyles(colors, isDark);
  const slides = makeSlides(colors);

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === slides.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
      onDone();
    } else {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({index: next, animated: true});
      setActiveIndex(next);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
    onDone();
  };

  const renderSlide = ({item}: {item: Slide}) => (
    <View style={styles.slide}>
      {/* Icon */}
      <View style={styles.iconArea}>
        <SlideIcon
          slideId={item.id}
          accent={item.accentColor}
          glow={item.glowColor}
        />
      </View>

      {/* Tag */}
      <Text style={[styles.tag, {color: item.accentColor}]}>{item.tag}</Text>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{item.subtitle}</Text>

      {/* Bullets */}
      <View style={[styles.bulletsCard, {borderColor: `${item.accentColor}22`}]}>
        {item.bullets.map((b, i) => (
          <View key={i} style={[styles.bulletRow, i < item.bullets.length - 1 && styles.bulletDivider]}>
            <View style={[styles.bulletIconWrap, {backgroundColor: `${item.accentColor}15`}]}>
              {b.icon}
            </View>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <GlassBackground isDark={isDark} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Skip */}
        <View style={styles.topRow}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>GymBuddy</Text>
          </View>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={s => s.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          renderItem={renderSlide}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: false},
          )}
          style={styles.flatList}
        />

        {/* Bottom controls */}
        <View style={styles.bottomSection}>
          {/* Dots */}
          <View style={styles.dotsRow}>
            {slides.map((s, i) => {
              const inputRange = [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: 'clamp',
              });
              const accentColor = slides[activeIndex].accentColor;
              return (
                <Animated.View
                  key={s.id}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              {
                backgroundColor: slides[activeIndex].accentColor,
                shadowColor: slides[activeIndex].accentColor,
              },
            ]}
            onPress={handleNext}
            activeOpacity={0.85}>
            {/* Inner highlight */}
            <View style={styles.ctaBtnHighlight} />
            <Text style={styles.ctaBtnText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            {!isLast && (
              <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          {/* Step counter */}
          <Text style={styles.stepCounter}>
            {activeIndex + 1} of {slides.length}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safe: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 4,
    },
    logoWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    flatList: {
      flex: 1,
    },
    slide: {
      width: SCREEN_WIDTH,
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 12,
      paddingBottom: 8,
      justifyContent: 'flex-start',
    },
    iconArea: {
      alignItems: 'center',
      marginBottom: 28,
      marginTop: 8,
    },
    tag: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      marginBottom: 10,
    },
    title: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.8,
      lineHeight: 42,
      marginBottom: 14,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
      fontWeight: '400',
    },
    bulletsCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.035)',
      overflow: 'hidden',
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      gap: 13,
    },
    bulletDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.07)',
    },
    bulletIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bulletText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
      flex: 1,
      lineHeight: 20,
    },
    bottomSection: {
      paddingHorizontal: 28,
      paddingBottom: Platform.OS === 'ios' ? 8 : 20,
      gap: 16,
      alignItems: 'center',
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 8,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    ctaBtn: {
      width: '100%',
      height: 56,
      borderRadius: Radius.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.38,
      shadowRadius: 18,
      elevation: 8,
      overflow: 'hidden',
    },
    ctaBtnHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
    },
    ctaBtnText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: -0.2,
    },
    stepCounter: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
  });

export default IntroScreen;
