import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RadioProvider } from './src/context/RadioContext';
import { ChatProvider } from './src/context/ChatContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { PttScreen } from './src/screens/PttScreen';
import { ChannelsScreen } from './src/screens/ChannelsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Mic, Users, MessageSquare, BookOpen, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#691c32" />
      </View>
    );
  }

  // Si no hay usuario logueado, muestra la pantalla de Login limpia y minimalista (Imagen 2)
  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    );
  }

  // Si el usuario está autenticado, muestra la app con las pestañas operativas limpias
  return (
    <RadioProvider>
      <ChatProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#070c16',
                borderTopColor: '#1e293b',
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              },
              tabBarActiveTintColor: '#eb527c',
              tabBarInactiveTintColor: '#64748b',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
            }}
          >
            <Tab.Screen
              name="PTT"
              component={PttScreen}
              options={{
                tabBarLabel: 'PTT',
                tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Grupos"
              component={ChannelsScreen}
              options={{
                tabBarLabel: 'Grupos',
                tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                tabBarLabel: 'Chat',
                tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Contactos"
              component={ContactsScreen}
              options={{
                tabBarLabel: 'Contactos',
                tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Perfil"
              component={ProfileScreen}
              options={{
                tabBarLabel: 'Perfil',
                tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </ChatProvider>
    </RadioProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}
