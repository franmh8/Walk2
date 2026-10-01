import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../utils/initialDbData';
import { loginApi, registerApi, deleteUserAccountApi } from '../api/authApi';
import { updateStatusApi } from '../api/radioApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message: string; code?: string }>;
  quickLoginAs: (user: User) => void;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  deleteAccount: (userId?: string | number) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserStatus: (status: 'online' | 'offline' | 'transmitting') => void;
  updateUserProfile: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize DB in localStorage if not set or migrate legacy demo seeds
  useEffect(() => {
    // Si la base de datos contiene los usuarios demo antiguos (ej. 'u-1' o 'Carlos Ruiz'), limpiarla
    const currentUsersRaw = localStorage.getItem('c5i_users_db');
    if (currentUsersRaw && (currentUsersRaw.includes('carlos.ruiz') || currentUsersRaw.includes('u-6a7ded071b7b3'))) {
      localStorage.setItem('c5i_users_db', JSON.stringify([]));
      localStorage.setItem('c5i_channels_db', JSON.stringify([]));
      localStorage.setItem('c5i_contacts_db', JSON.stringify([]));
      localStorage.setItem('c5i_voice_messages_db', JSON.stringify([]));
      localStorage.setItem('c5i_chat_messages_db', JSON.stringify([]));
      localStorage.setItem('c5i_emergency_alerts_db', JSON.stringify([]));
      localStorage.removeItem('userData');
      localStorage.removeItem('userToken');
    } else if (!localStorage.getItem('c5i_users_db')) {
      localStorage.setItem('c5i_users_db', JSON.stringify(INITIAL_USERS));
    }

    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Error loading saved user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await loginApi(identifier, pass);
      if (res && (res.status === 'success' || res.success)) {
        const userData: User = res.usuario || res.user || {
          id: res.userId || 'u-1',
          name: 'Operador C5i',
          phone_number: identifier,
          status: 'online',
        };

        localStorage.setItem('userToken', String(userData.id));
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        updateStatusApi(userData.id, 'online');
        return { success: true, message: res.message || 'Sesión iniciada', code: 'SUCCESS' };
      } else {
        return { success: false, message: res?.message || 'Credenciales no válidas', code: res?.code };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Error de conexión', code: 'CONNECTION_ERROR' };
    }
  };

  const quickLoginAs = (selectedUser: User) => {
    localStorage.setItem('userToken', String(selectedUser.id));
    localStorage.setItem('userData', JSON.stringify(selectedUser));
    setUser(selectedUser);
    updateStatusApi(selectedUser.id, 'online');
  };

  const register = async (userData: any) => {
    try {
      const res = await registerApi(userData);
      if (res && (res.status === 'success' || res.success)) {
        const createdUser: User = res.usuario || {
          id: res.userId || `u-${Date.now()}`,
          name: userData.name,
          phone_number: userData.phone_number,
          correo: userData.correo,
          status: 'online',
          role: userData.role || 'Oficial C5i',
          callsign: userData.callsign || 'RADIO-C5I',
          unit: userData.unit || 'C5i Hidalgo',
        };
        localStorage.setItem('userToken', String(createdUser.id));
        localStorage.setItem('userData', JSON.stringify(createdUser));
        setUser(createdUser);
        return { success: true, message: res.message || 'Registro exitoso' };
      } else {
        return { success: false, message: res?.message || 'Error al registrar' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Error en registro' };
    }
  };

  const updateUserStatus = (status: 'online' | 'offline' | 'transmitting') => {
    if (user) {
      const updated = { ...user, status };
      setUser(updated);
      localStorage.setItem('userData', JSON.stringify(updated));
      updateStatusApi(user.id, status);
    }
  };

  const updateUserProfile = (updatedFields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      setUser(updated);
      localStorage.setItem('userData', JSON.stringify(updated));

      const rawUsers = localStorage.getItem('c5i_users_db');
      if (rawUsers) {
        try {
          const users: User[] = JSON.parse(rawUsers);
          const index = users.findIndex((u) => u.id === user.id);
          if (index !== -1) {
            users[index] = { ...users[index], ...updatedFields };
            localStorage.setItem('c5i_users_db', JSON.stringify(users));
          }
        } catch (e) {
          console.error('Error updating user in c5i_users_db', e);
        }
      }
    }
  };

  const deleteAccount = async (userId?: string | number) => {
    const targetId = userId || user?.id;
    if (!targetId) return { success: false, message: 'Usuario no identificado' };

    setLoading(true);
    try {
      if (user) {
        updateStatusApi(user.id, 'offline');
      }
      const res = await deleteUserAccountApi(targetId);
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      setUser(null);
      return res;
    } catch (e: any) {
      return { success: false, message: e?.message || 'Error al eliminar cuenta' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      updateStatusApi(user.id, 'offline');
    }
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        quickLoginAs,
        register,
        deleteAccount,
        logout,
        updateUserStatus,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
