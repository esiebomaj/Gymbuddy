import React from 'react';
import {View, Text, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, Camera, Settings} from 'lucide-react-native';
import type {MainTabParamList} from './types';
import {Colors, type AppColors} from '../theme';
import {useTheme} from '../context/ThemeContext';

import DashboardScreen from '../screens/main/DashboardScreen';
import ProofSubmissionScreen from '../screens/main/ProofSubmissionScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import {useLock} from '../context/LockContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Tab icon component ────────────────────────────────────────────────────────

interface TabIconProps {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
  badge?: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({icon, label, focused, badge}) => {
  const {colors} = useTheme();
  return (
  <View style={{alignItems: 'center', justifyContent: 'center', paddingTop: 4, minWidth: 56}}>
    <View style={{position: 'relative'}}>
      {icon}
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -6,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: Colors.error,
            borderWidth: 1.5,
            borderColor: colors.background,
          }}
        />
      )}
    </View>
    <Text
      style={{
        fontSize: 10,
        color: focused ? Colors.primary : colors.textMuted,
        marginTop: 3,
        fontWeight: focused ? '700' : '400',
        textAlign: 'center',
      }}>
      {label}
    </Text>
  </View>
  );
};

// ── Navigator ─────────────────────────────────────────────────────────────────

const MainTabNavigator: React.FC = () => {
  const {status} = useLock();
  const {colors, isDark} = useTheme();
  const isLocked = status === 'locked';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(10,10,22,0.96)' : 'rgba(248,248,252,0.94)',
          borderTopColor: colors.glassBorder,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -4},
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 16,
        },
      }}>

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              icon={<Home size={23} color={focused ? Colors.primary : colors.textMuted} strokeWidth={focused ? 2.2 : 1.8} />}
              label="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Proof"
        component={ProofSubmissionScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              icon={<Camera size={23} color={focused ? Colors.primary : colors.textMuted} strokeWidth={focused ? 2.2 : 1.8} />}
              label="Proof"
              focused={focused}
              badge={isLocked}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              icon={<Settings size={23} color={focused ? Colors.primary : colors.textMuted} strokeWidth={focused ? 2.2 : 1.8} />}
              label="Settings"
              focused={focused}
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
};

export default MainTabNavigator;
