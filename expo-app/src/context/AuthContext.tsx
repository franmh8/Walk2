import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { ApiService } from '../services/apiService';

interface RegisterData {
  name: string;
  phone_number: string;
  callsign: string;
  password?: string;
  unit?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga sesión persistente sólo si existe un login previo real
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('c5i_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Error leyendo sesión guardada:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    try {
      // 1. Intentar backend del servidor C5i
      try {
        const remoteRes = await ApiService.login(identifier, pass);
        if (remoteRes && remoteRes.success && remoteRes.user) {
          setUser(remoteRes.user);
          await AsyncStorage.setItem('c5i_user', JSON.stringify(remoteRes.user));
          return true;
        }
      } catch (_) {
        // Fallback local a base de datos de AsyncStorage
      }

      // 2. Verificar en usuarios registrados en el dispositivo
      const storedUsersRaw = await AsyncStorage.getItem('c5i_users_db');
      const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = pass.trim();

      const matched = users.find(
        (u) =>
          (u.phone_number?.toLowerCase() === cleanId ||
            u.correo?.toLowerCase() === cleanId ||
            u.callsign?.toLowerCase() === cleanId) &&
          (!u.password || u.password === cleanPass)
      );

      if (matched) {
        setUser(matched);
        await AsyncStorage.setItem('c5i_user', JSON.stringify(matched));
        return true;
      }

      // Si aún no hay usuarios y se ingresa una cuenta operativa inicial, permitir acceso táctico
      if (users.length === 0 && cleanPass.length >= 3) {
        const initialOpUser: User = {
          id: `usr-${Date.now()}`,
          name: `Oficial Operativo (${identifier})`,
          phone_number: identifier,
          callsign: `RADIO-${identifier.slice(-3) || 'C5I'}`,
          unit: 'Sector Operativo Hidalgo',
          role: 'Oficial Operativo',
          status: 'online',
          password: cleanPass,
        };
        const updated = [initialOpUser];
        await AsyncStorage.setItem('c5i_users_db', JSON.stringify(updated));
        setUser(initialOpUser);
        await AsyncStorage.setItem('c5i_user', JSON.stringify(initialOpUser));
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error en proceso de login:', err);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name,
      phone_number: data.phone_number,
      callsign: data.callsign,
      password: data.password,
      unit: data.unit || 'Sector Operativo Hidalgo',
      role: data.role || 'Oficial Operativo',
      status: 'online',
    };

    const storedUsersRaw = await AsyncStorage.getItem('c5i_users_db');
    const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
    users.push(newUser);

    await AsyncStorage.setItem('c5i_users_db', JSON.stringify(users));
    setUser(newUser);
    await AsyncStorage.setItem('c5i_user', JSON.stringify(newUser));
    return true;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('c5i_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
