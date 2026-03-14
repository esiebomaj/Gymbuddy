import React, {useCallback, useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from './types';
import {Colors, type AppColors} from '../theme';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import IntroScreen, {INTRO_SEEN_KEY} from '../screens/auth/IntroScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {user, isLoading, needsOnboarding} = useAuth();
  const {colors} = useTheme();
  const styles = makeStyles(colors);

  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY).then(val => {
      setHasSeenIntro(val === 'true');
    });
  }, []);

  const handleIntroDone = useCallback(() => {
    setHasSeenIntro(true);
  }, []);

  if (isLoading || hasSeenIntro === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!hasSeenIntro && !user ? (
        <Stack.Screen name="Intro">
          {() => <IntroScreen onDone={handleIntroDone} />}
        </Stack.Screen>
      ) : !user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default RootNavigator;
