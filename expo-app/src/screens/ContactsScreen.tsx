import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';
import { User, Radio, Plus, X, Users } from 'lucide-react-native';

export function ContactsScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('c5i_contacts');
        if (stored) {
          setContacts(JSON.parse(stored));
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.warn('Error leyendo contactos:', err);
      }
    })();
  }, []);

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa al menos nombre y teléfono.');
      return;
    }

    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      name: name.trim(),
      phone_number: phone.trim(),
      callsign: callsign.trim().toUpperCase() || 'UNIDAD',
      unit: 'Sector Operativo Hidalgo',
      status: 'online',
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    await AsyncStorage.setItem('c5i_contacts', JSON.stringify(updated));
    setModalVisible(false);
    setName('');
    setCallsign('');
    setPhone('');
  };

  const handlePttDirect = (c: Contact) => {
    Alert.alert(
      'Enlace PTT Directo',
      `¿Deseas iniciar enlace táctico punto a punto con ${c.callsign} (${c.name})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Conectar Radio', onPress: () => navigation.navigate('PTT') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DIRECTORIO TÁCTICO C5i</Text>
          <Text style={styles.headerSubtitle}>Unidades y contactos enlazados</Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Plus color="#ffffff" size={18} />
          <Text style={styles.addButtonText}>Agregar</Text>
        </Pressable>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users color="#94a3b8" size={48} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Directorio Vacío</Text>
          <Text style={styles.emptySubtitle}>
            No hay unidades registradas aún. Agrega una nueva unidad o compañero usando el botón superior.
          </Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={styles.emptyButton}
          >
            <Plus color="#ffffff" size={16} />
            <Text style={styles.emptyButtonText}>Agregar Primera Unidad</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={contacts}
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
                <Text style={styles.unit}>{item.phone_number}</Text>
              </View>

              <Pressable
                onPress={() => handlePttDirect(item)}
                style={styles.pttDirectButton}
              >
                <Radio color="#ffffff" size={14} />
                <Text style={styles.pttDirectText}>PTT</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {/* Modal Agregar Contacto */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Unidad Táctica</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color="#64748b" size={20} />
              </Pressable>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Oficial García"
                placeholderTextColor="#94a3b8"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Indicativo (Callsign)</Text>
              <TextInput
                value={callsign}
                onChangeText={setCallsign}
                placeholder="Ej. PATRULLA-108"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="10 dígitos"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                style={styles.modalInput}
              />
            </View>

            <Pressable
              onPress={handleAddContact}
              style={styles.modalSubmitButton}
            >
              <Text style={styles.modalSubmitText}>Guardar Contacto</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#691c32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#691c32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    marginTop: 1,
  },
  pttDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#691c32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pttDirectText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalField: {
    marginBottom: 12,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: '#ffffff',
    fontSize: 14,
  },
  modalSubmitButton: {
    backgroundColor: '#691c32',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
