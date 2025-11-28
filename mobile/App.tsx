// BerryVision AI - Main App

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAnalysisStore } from './src/store/analysisStore';
import {
  CameraScreen,
  ResultScreen,
  HistoryScreen,
  MapScreen,
} from './src/screens';

// Tipos de navegación
type RootStackParamList = {
  Main: undefined;
  Result: { analysisId: string };
};

type TabParamList = {
  Camera: undefined;
  History: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator
function MainTabs() {
  const { stats } = useAnalysisStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarLabel: 'Captura',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>📷</Text>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>📋</Text>
          ),
          tabBarBadge:
            stats.pending_sync > 0 ? stats.pending_sync : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#3B82F6',
            color: '#fff',
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>🗺️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Splash Screen
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashEmoji}>🫐</Text>
      <Text style={styles.splashTitle}>BerryVision AI</Text>
      <Text style={styles.splashSubtitle}>
        Monitoreo Inteligente de Cultivos
      </Text>
      <ActivityIndicator
        size="large"
        color="#22C55E"
        style={styles.splashLoader}
      />
    </View>
  );
}

// App Principal
export default function App() {
  const { loadAnalyses, isLoading, checkConnection } = useAnalysisStore();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const init = async () => {
      await checkConnection();
      await loadAnalyses();
      // Pequeño delay para mostrar splash
      setTimeout(() => setIsReady(true), 1000);
    };
    init();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111827',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#111827',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: 'Resultado del Análisis',
            headerBackTitle: 'Atrás',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  splashTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  splashSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 32,
  },
  splashLoader: {
    marginTop: 24,
  },
});
