import React, { useState } from 'react';
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
import { useRadio } from '../context/RadioContext';
import { Channel } from '../types';
import { Radio, Users, ShieldCheck, Check, Plus, X } from 'lucide-react-native';

export function ChannelsScreen({ navigation }: any) {
  const { channels, selectedChannel, setSelectedChannel, createChannel } = useRadio();
  const [modalVisible, setModalVisible] = useState(false);
  const [channelName, setChannelName] = useState('');

  const handleSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    navigation.navigate('PTT');
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para el canal táctico.');
      return;
    }
    const created = await createChannel(channelName.trim());
    setChannelName('');
    setModalVisible(false);
    setSelectedChannel(created);
    navigation.navigate('PTT');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CANALES Y GRUPOS TÁCTICOS</Text>
          <Text style={styles.headerSubtitle}>Red C5i de Seguridad Pública Hidalgo</Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Plus color="#ffffff" size={18} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </Pressable>
      </View>

      {channels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Radio color="#94a3b8" size={48} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Sin Canales Tácticos</Text>
          <Text style={styles.emptySubtitle}>
            Aún no tienes canales configurados. Pulsa el botón superior para crear tu primer grupo o frecuencia de radio.
          </Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={styles.emptyButton}
          >
            <Plus color="#ffffff" size={16} />
            <Text style={styles.emptyButtonText}>Crear Primer Canal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedChannel?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelect(item)}
                style={[styles.channelCard, isSelected && styles.selectedCard]}
              >
                <View style={styles.iconContainer}>
                  <Radio color={isSelected ? '#eb527c' : '#94a3b8'} size={22} />
                </View>

                <View style={styles.details}>
                  <Text style={[styles.channelName, isSelected && styles.selectedName]}>
                    {item.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Users color="#64748b" size={12} />
                      <Text style={styles.metaText}>{item.member_count || 1} activos</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ShieldCheck color="#10b981" size={12} />
                      <Text style={styles.metaText}>AES-256</Text>
                    </View>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Check color="#ffffff" size={15} />
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Modal Crear Canal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Canal Táctico</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color="#64748b" size={20} />
              </Pressable>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Nombre de la Frecuencia o Grupo</Text>
              <TextInput
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Ej. CANAL 1 - GENERAL C5i"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                style={styles.modalInput}
              />
            </View>

            <Pressable
              onPress={handleCreateChannel}
              style={styles.modalSubmitButton}
            >
              <Text style={styles.modalSubmitText}>Guardar y Conectar</Text>
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
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  selectedCard: {
    borderColor: '#691c32',
    backgroundColor: '#171420',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  channelName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedName: {
    color: '#eb527c',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#64748b',
    fontSize: 11,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 14,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  modalSubmitButton: {
    backgroundColor: '#691c32',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
