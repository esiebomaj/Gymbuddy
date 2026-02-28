import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {Colors} from '../theme';
import {useAuth} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {user, isLoading, needsOnboarding} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default RootNavigator;
