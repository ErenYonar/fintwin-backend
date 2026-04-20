// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useStore, restoreSession } from '../store/useStore';
import { useColors, Colors } from '../utils/theme';

import LoginScreen          from '../screens/LoginScreen';
import OTPScreen            from '../screens/OTPScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import HomeScreen           from '../screens/HomeScreen';
import AnalysisScreen       from '../screens/AnalysisScreen';
import CoachScreen          from '../screens/CoachScreen';
import SettingsScreen       from '../screens/SettingsScreen';
import AccountScreen        from '../screens/AccountScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionsScreen   from '../screens/TransactionsScreen';
import StatementScreen      from '../screens/StatementScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  const lang = useStore(s => s.lang);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap: Record<string, [string, string]> = {
            Home:      ['home',      'home-outline'],
            Analysis:  ['bar-chart', 'bar-chart-outline'],
            Statement: ['card',      'card-outline'],
            Coach:     ['bulb',      'bulb-outline'],
            Settings:  ['settings',  'settings-outline'],
          };
          const colorMap: Record<string, string> = {
            Home:      '#7C6EFA',
            Analysis:  '#34D399',
            Statement: '#60A5FA',
            Coach:     '#FBBF24',
            Settings:  '#F472B6',
          };
          const [filled, outline] = iconMap[route.name] || ['ellipse', 'ellipse-outline'];
          const iconColor = focused ? (colorMap[route.name] || Colors.primary) : '#6B7280';
          return <Ionicons name={(focused ? filled : outline) as any} size={size} color={iconColor} />;
        },
        tabBarActiveTintColor: Colors.primary,
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: lang === 'TR' ? 'Ana Sayfa' : 'Home',      tabBarActiveTintColor: '#7C6EFA' }} />
      <Tab.Screen name="Analysis"  component={AnalysisScreen}  options={{ tabBarLabel: lang === 'TR' ? 'Analiz' : 'Analysis',      tabBarActiveTintColor: '#34D399' }} />
      <Tab.Screen name="Statement" component={StatementScreen} options={{ tabBarLabel: lang === 'TR' ? 'Ekstre' : 'Statement',     tabBarActiveTintColor: '#60A5FA' }} />
      <Tab.Screen name="Coach"     component={CoachScreen}     options={{ tabBarLabel: lang === 'TR' ? 'Koç' : 'Coach',           tabBarActiveTintColor: '#FBBF24' }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{ tabBarLabel: lang === 'TR' ? 'Ayarlar' : 'Settings',    tabBarActiveTintColor: '#F472B6' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP"      component={OTPScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"        component={MainTabs} />
      <Stack.Screen name="Account"         component={AccountScreen} />
      <Stack.Screen name="AddTransaction"  component={AddTransactionScreen} />
      <Stack.Screen name="EditTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="Transactions"    component={TransactionsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const Colors = useColors();
  // isLoggedIn state'ini doğrudan store'dan takip et
  // Bu sayede logout() çağrılınca isLoggedIn false olur → otomatik AuthStack'e geçer
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4FF' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    // key prop: isLoggedIn değişince NavigationContainer sıfırlanır
    // Bu sayede çıkış yapınca eski screen stack'i temizlenir
    <NavigationContainer key={isLoggedIn ? 'app' : 'auth'}>
      {isLoggedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
