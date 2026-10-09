import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, Terminal, ExternalLink, QrCode } from 'lucide-react';

interface ExpoProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPO_FILES = [
  {
    name: 'README.md',
    desc: 'Guía de inicio rápido para Expo Go',
    path: 'expo-app/README.md',
    code: `# C5i Hidalgo WalkieT Radio (React Native / Expo)

1. En tu computadora:
cd expo-app
npm install

2. Iniciar servidor Expo:
npx expo start --tunnel -c

3. En tu teléfono:
- iPhone: Escanea el código QR con la Cámara para abrir en Expo Go.
- Android: Abre Expo Go y toca "Scan QR code".`,
  },
  {
    name: 'index.js',
    desc: 'Punto de entrada nativo de Expo (registerRootComponent)',
    path: 'expo-app/index.js',
    code: `import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);`,
  },
  {
    name: 'App.tsx',
    desc: 'Entrada principal con Bottom Tabs y Providers',
    path: 'expo-app/App.tsx',
    code: `import React from 'react';
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
              }}
            >
              <Tab.Screen name="PTT" component={PttScreen} options={{ tabBarIcon: ({ color, size }) => <Mic color={color} size={size} /> }} />
              <Tab.Screen name="Grupos" component={ChannelsScreen} options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
              <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }} />
              <Tab.Screen name="Contactos" component={ContactsScreen} options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }} />
              <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
            </Tab.Navigator>
          </NavigationContainer>
        </ChatProvider>
      </RadioProvider>
    </AuthProvider>
  );
}`,
  },
  {
    name: 'PttScreen.tsx',
    desc: 'Pantalla principal de Radio PTT con audio y háptica',
    path: 'expo-app/src/screens/PttScreen.tsx',
    code: `// Ubicado en: expo-app/src/screens/PttScreen.tsx
// Incluye botón táctico con soporte de presión prolongada (Pressable onPressIn/onPressOut),
// audio en tiempo real con expo-av y vibración háptica con expo-haptics.`,
  },
  {
    name: 'package.json',
    desc: 'Dependencias para Expo 57 y React Native',
    path: 'expo-app/package.json',
    code: `{
  "name": "c5i-hidalgo-walkiet-expo",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@expo/metro-runtime": "~57.0.27",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native": "^6.1.17",
    "axios": "^1.20.0",
    "expo": "^57.0.27",
    "expo-av": "~16.0.8",
    "expo-camera": "~57.0.6",
    "expo-constants": "~18.0.13",
    "expo-haptics": "~57.0.3",
    "expo-location": "~57.0.20",
    "expo-status-bar": "~3.0.9",
    "lucide-react-native": "^0.395.0",
    "qrcode": "^1.5.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-svg": "~15.11.1",
    "react-native-web": "~0.21.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/qrcode": "^1.5.6",
    "@types/react": "~19.2.4",
    "babel-preset-expo": "~57.0.27",
    "typescript": "~5.8.2"
  }
}`,
  },
  {
    name: 'app.json',
    desc: 'Configuración Expo para permisos de micrófono en iOS y Android',
    path: 'expo-app/app.json',
    code: `{
  "expo": {
    "name": "C5i WalkieT Radio",
    "slug": "c5i-walkiet-radio",
    "version": "1.0.0",
    "userInterfaceStyle": "dark",
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "C5i requiere acceso al micrófono para transmisiones tácticas PTT."
      }
    },
    "android": {
      "permissions": ["RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS", "VIBRATE"]
    }
  }
}`,
  },
];

export const ExpoProjectModal: React.FC<ExpoProjectModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = EXPO_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-[#691c32]/50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#691c32]/30 border border-[#691c32] flex items-center justify-center text-[#eb527c]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                Código Completo Expo / React Native
                <span className="text-[10px] bg-[#691c32] text-white px-2 py-0.5 rounded-full font-mono">
                  iOS & Android
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Archivos generados en la carpeta <code className="text-[#dfb15b]">/expo-app</code> listos para Expo Go
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-[#121927] px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-[#dfb15b]" />
            <span>Ejecuta en tu terminal:</span>
            <code className="bg-black/50 px-2 py-1 rounded text-emerald-400 font-mono">
              cd expo-app && npm install && npx expo start --tunnel
            </code>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <QrCode className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Escanea el QR en Expo Go</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* File selector tabs */}
          <div className="w-full md:w-56 bg-slate-950 p-3 border-r border-slate-800 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto">
            {EXPO_FILES.map((f, idx) => (
              <button
                key={f.name}
                onClick={() => setSelectedFileIdx(idx)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex flex-col ${
                  selectedFileIdx === idx
                    ? 'bg-[#691c32] text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{f.name}</span>
                <span className="text-[10px] opacity-75 font-sans truncate">{f.desc}</span>
              </button>
            ))}
          </div>

          {/* File preview */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#070c16]">
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">{currentFile.path}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar código'}</span>
              </button>
            </div>
            <pre className="flex-1 p-4 text-xs font-mono text-slate-300 overflow-auto whitespace-pre leading-relaxed select-text">
              {currentFile.code}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>También puedes probar directamente esta web como PWA en Safari (iOS) o Chrome (Android).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
