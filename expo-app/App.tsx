import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './src/context/AuthContext';
import { RadioProvider } from './src/context/RadioContext';
import { ChatProvider } from './src/context/ChatContext';
import { PttScreen } from './src/screens/PttScreen';
import { ChannelsScreen } from './src/screens/ChannelsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Mic, Users, MessageSquare, BookOpen, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
