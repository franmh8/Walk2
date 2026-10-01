import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRadio } from '../context/RadioContext';
import { Channel } from '../types';
import { Radio, Users, Lock, ShieldCheck, Check } from 'lucide-react-native';

export function ChannelsScreen({ navigation }: any) {
  const { channels, selectedChannel, setSelectedChannel } = useRadio();

  const handleSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    navigation.navigate('PTT');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CANALES Y GRUPOS TÁCTICOS</Text>
        <Text style={styles.headerSubtitle}>Red C5i de Seguridad Pública Hidalgo</Text>
      </View>

      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedChannel.id;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[styles.channelCard, isSelected && styles.selectedCard]}
            >
              <View style={styles.iconContainer}>
                {item.category === 'emergencia' ? (
                  <Radio color="#ef4444" size={24} />
                ) : (
                  <Radio color={isSelected ? '#eb527c' : '#94a3b8'} size={24} />
                )}
              </View>

              <View style={styles.details}>
                <View style={styles.nameRow}>
                  <Text style={[styles.channelName, isSelected && styles.selectedName]}>
                    {item.name}
                  </Text>
                  {item.is_private ? <Lock color="#64748b" size={14} /> : null}
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Users color="#64748b" size={12} />
                    <Text style={styles.metaText}>{item.member_count} miembros</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <ShieldCheck color="#10b981" size={12} />
                    <Text style={styles.metaText}>AES-256</Text>
                  </View>
                </View>
              </View>

              {isSelected && (
                <View style={styles.checkBadge}>
                  <Check color="#ffffff" size={16} />
                </View>
              )}
            </Pressable>
          );
        }}
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
