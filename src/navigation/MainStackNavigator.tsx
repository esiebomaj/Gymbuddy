import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {MainStackParamList} from './types';
import MainTabNavigator from './MainTabNavigator';
import AppSelectionScreen from '../screens/main/AppSelectionScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Tabs" component={MainTabNavigator} />
    <Stack.Screen name="Apps" component={AppSelectionScreen} />
  </Stack.Navigator>
);

export default MainStackNavigator;
