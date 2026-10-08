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
  Platform,
} from 'react-native';
import { useRadio } from '../context/RadioContext';
import { useTheme } from '../context/ThemeContext';
import { Channel } from '../types';
import { Radio, Users, ShieldCheck, Plus, X, Search, Lock } from 'lucide-react-native';

export function ChannelsScreen({ navigation }: any) {
  const { channels, selectedChannel, setSelectedChannel, createChannel } = useRadio();
  const { colors, isDark } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    navigation.navigate('PTT');
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para el nuevo canal.');
      return;
    }
    const created = await createChannel(channelName.trim());
    setChannelName('');
    setModalVisible(false);
    setSelectedChannel(created);
    navigation.navigate('PTT');
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerLabel, { color: colors.textMuted }]}>CANALES</Text>
          <h1 style={[styles.headerTitle, { color: colors.text }] as any}>
            Grupos de Transmisión
          </h1>
        </View>

        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.createButton, { backgroundColor: colors.primary }]}
        >
          <Plus color="#ffffff" size={16} />
          <Text style={styles.createButtonText}>Nuevo</Text>
        </Pressable>
      </View>

      {/* Barra de Búsqueda */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Search color={colors.textMuted} size={16} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar canales o frecuencias..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm('')}>
              <X color={colors.textMuted} size={16} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Lista de Canales */}
      {filteredChannels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.badgeBackground, borderColor: colors.badgeBorder },
            ]}
          >
            <Radio color={colors.textMuted} size={32} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchTerm ? 'No se encontraron canales' : 'Sin canales creados'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchTerm
              ? 'Intenta con otro término o crea un nuevo canal.'
              : 'Comienza creando tu primera frecuencia de radio para el equipo.'}
          </Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          >
            <Plus color="#ffffff" size={15} />
            <Text style={styles.emptyButtonText}>Crear Canal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedChannel?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelect(item)}
                style={[
                  styles.channelCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                  isSelected && styles.channelCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.channelIconBadge,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(235, 82, 124, 0.15)'
                          : '#fff1f2'
                        : colors.badgeBackground,
                    },
                  ]}
                >
                  <Radio
                    color={isSelected ? colors.primary : colors.textSecondary}
                    size={20}
                  />
                </View>

                <View style={styles.channelDetails}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.channelName,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.activeTag,
                          {
                            backgroundColor: isDark
                              ? 'rgba(235, 82, 124, 0.2)'
                              : '#fff1f2',
                            borderColor: colors.primary,
                          },
                        ]}
                      >
                        <Text style={[styles.activeTagText, { color: colors.primary }]}>
                          ACTIVO
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                      <Users color={colors.textMuted} size={12} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.member_count || 1} activos
                      </Text>
                    </View>

                    <View style={styles.metaBadge}>
                      <ShieldCheck color="#10b981" size={12} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        Cifrado
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Modal Crear Canal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Crear Nuevo Canal
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={colors.textMuted} size={20} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              NOMBRE DE LA FRECUENCIA O CANAL
            </Text>
            <TextInput
              value={channelName}
              onChangeText={setChannelName}
              placeholder="Ej. Operaciones Centro, Patrullas..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[
                  styles.cancelBtn,
                  { borderColor: colors.cardBorder, backgroundColor: colors.badgeBackground },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCreateChannel}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confirmBtnText}>Crear Canal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 14 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  channelCardSelected: {
    borderWidth: 1.5,
  },
  channelIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  activeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 5,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
