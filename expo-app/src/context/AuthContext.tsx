import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('c5i_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Default initial operative user for easy testing
          const defaultUser: User = {
            id: 'usr-1',
            name: 'Oficial C5i Hidalgo',
            phone_number: '7711234567',
            callsign: 'PATRULLA-302',
            unit: 'Sector Pachuca Sur',
            role: 'Oficial Operativo',
            status: 'online',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=7711234567',
          };
          setUser(defaultUser);
          await AsyncStorage.setItem('c5i_user', JSON.stringify(defaultUser));
        }
      } catch (err) {
        console.error('Error cargando usuario en Expo:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifier: string, _pass: string) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: `Oficial (${identifier})`,
      phone_number: identifier,
      callsign: `RADIO-${identifier.slice(-4) || 'C5I'}`,
      unit: 'Sector Operativo Hidalgo',
      role: 'Oficial Operativo',
      status: 'online',
    };
    setUser(newUser);
    await AsyncStorage.setItem('c5i_user', JSON.stringify(newUser));
    return true;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('c5i_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
