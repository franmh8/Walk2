import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Contact } from '../types';
import { User, Phone, Radio, Shield } from 'lucide-react-native';

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Comandante Morales', phone_number: '7711002233', callsign: 'ALFA-1', unit: 'Coordinación Operativa', status: 'online' },
  { id: '2', name: 'Oficial R. Tapia', phone_number: '7712003344', callsign: 'PATRULLA-102', unit: 'Sector Mineral de la Reforma', status: 'online' },
  { id: '3', name: 'Suboficial G. Mendoza', phone_number: '7713004455', callsign: 'HALCON-04', unit: 'Grupo Especial Reacción', status: 'online' },
  { id: '4', name: 'Despacho C5i Central', phone_number: '7719998877', callsign: 'CENTRAL-C5I', unit: 'Centro de Mando C5i', status: 'online' },
  { id: '5', name: 'Paramédico Cruz Roja', phone_number: '7714005566', callsign: 'MEDIC-02', unit: 'Urgencias Médicas Hidalgo', status: 'online' },
];

export function ContactsScreen({ navigation }: any) {
  const handlePttDirect = (contact: Contact) => {
    Alert.alert(
      'Frecuencia Privada Directa',
      `¿Deseas abrir enlace PTT punto a punto con ${contact.callsign} (${contact.name})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conectar Radio',
          onPress: () => {
            navigation.navigate('PTT');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DIRECTORIO OPERATIVO C5i</Text>
        <Text style={styles.headerSubtitle}>Unidades y mandos policiales enlazados</Text>
      </View>

      <FlatList
        data={INITIAL_CONTACTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <User color="#f8fafc" size={20} />
            </View>

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.callsign}>{item.callsign}</Text>
              <Text style={styles.unit}>{item.unit}</Text>
            </View>

            <Pressable
              onPress={() => handlePttDirect(item)}
              style={styles.pttDirectButton}
            >
              <Radio color="#ffffff" size={16} />
              <Text style={styles.pttDirectText}>PTT</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c16',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  callsign: {
    color: '#dfb15b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  unit: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  pttDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#691c32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pttDirectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
