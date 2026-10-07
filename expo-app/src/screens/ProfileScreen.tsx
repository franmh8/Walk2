import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Lock, Phone, LogOut, CheckCircle } from 'lucide-react-native';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión Táctica',
      '¿Deseas desconectar este dispositivo de la red C5i?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Credencial Digital */}
        <View style={styles.badgeCard}>
          <View style={styles.avatarLarge}>
            <User color="#f8fafc" size={36} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Oficial Operativo'}</Text>
          <Text style={styles.userCallsign}>{user?.callsign || 'OPERATIVO'}</Text>
          <Text style={styles.userUnit}>{user?.unit || 'Sector Operativo Hidalgo'}</Text>

          <View style={styles.statusBadge}>
            <CheckCircle color="#10b981" size={14} />
            <Text style={styles.statusText}>ENLACE CIFRADO ACTIVO</Text>
          </View>
        </View>

        {/* Parámetros de Seguridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESCUDO DE SEGURIDAD OPERATIVA</Text>

          <View style={styles.row}>
            <Shield color="#dfb15b" size={18} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Protocolo de Cifrado</Text>
              <Text style={styles.rowValue}>AES-256-GCM + HMAC-SHA256</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Lock color="#38bdf8" size={18} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Autenticación</Text>
              <Text style={styles.rowValue}>PBKDF2-SHA512 (100k rounds)</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Phone color="#10b981" size={18} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Línea Vinculada</Text>
              <Text style={styles.rowValue}>{user?.phone_number || 'No especificada'}</Text>
            </View>
          </View>
        </View>

        {/* Desconectar */}
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Cerrar Sesión Táctica</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c16',
  },
  badgeCard: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#691c32',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userCallsign: {
    color: '#dfb15b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },
  userUnit: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#06281e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  rowText: {
    marginLeft: 12,
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  rowValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1519',
    borderWidth: 1,
    borderColor: '#dc2626',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
