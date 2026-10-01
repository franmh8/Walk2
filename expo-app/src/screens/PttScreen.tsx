import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { AudioService } from '../services/audioService';
import { Mic, Volume2, ShieldAlert, Radio as RadioIcon, History, Zap } from 'lucide-react-native';

export function PttScreen({ navigation }: any) {
  const { user } = useAuth();
  const {
    selectedChannel,
    isTransmitting,
    startTransmitting,
    stopTransmitting,
    voiceHistory,
  } = useRadio();

  const [historyVisible, setHistoryVisible] = useState(false);

  const handleSosTrigger = () => {
    Alert.alert(
      '🚨 ALERTA ROJA SOS C5i',
      '¿Deseas emitir una alerta de emergencia inmediata a todo el Centro de Comando C5i?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'EMITIR SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Alerta SOS Emitida', 'Se ha enviado tu ubicación y alerta prioritaria al C5i.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Táctico */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <RadioIcon color="#dfb15b" size={18} />
          </View>
          <View>
            <Text style={styles.headerTitle}>C5i HIDALGO</Text>
            <Text style={styles.headerSubtitle}>RADIO TÁCTICO PTT</Text>
          </View>
        </View>

        <Pressable onPress={handleSosTrigger} style={styles.sosButton}>
          <ShieldAlert color="#ffffff" size={16} />
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
      </View>

      {/* Selector de Canal Activo */}
      <Pressable
        onPress={() => navigation.navigate('Grupos')}
        style={styles.channelBanner}
      >
        <View style={styles.channelInfo}>
          <Text style={styles.channelLabel}>CANAL SELECCIONADO</Text>
          <Text style={styles.channelName}>{selectedChannel.name}</Text>
          <Text style={styles.channelMeta}>
            34 unidades activas • Cifrado AES-256
          </Text>
        </View>
        <View style={styles.channelBadge}>
          <Text style={styles.channelBadgeText}>CAMBIAR</Text>
        </View>
      </Pressable>

      {/* Operador Info */}
      <View style={styles.operatorCard}>
        <Text style={styles.operatorCallsign}>{user?.callsign || 'PATRULLA-302'}</Text>
        <Text style={styles.operatorUnit}>{user?.unit || 'Sector Sur Pachuca'}</Text>
      </View>

      {/* Botón Central PTT */}
      <View style={styles.pttContainer}>
        <Pressable
          onPressIn={startTransmitting}
          onPressOut={stopTransmitting}
          style={[styles.pttButtonOuter, isTransmitting && styles.pttOuterActive]}
        >
          <View style={[styles.pttButtonInner, isTransmitting && styles.pttInnerActive]}>
            <Mic
              color="#ffffff"
              size={54}
              strokeWidth={2.5}
            />
            <Text style={styles.pttText}>
              {isTransmitting ? 'TRANSMITIENDO...' : 'MANTÉN PRESIONADO'}
            </Text>
            <Text style={styles.pttSubText}>
              {isTransmitting ? 'RÁFAGA EN VIVO' : 'PARA HABLAR'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Barra de Historial Reciente */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => setHistoryVisible(!historyVisible)}
          style={styles.historyToggle}
        >
          <History color="#94a3b8" size={18} />
          <Text style={styles.historyToggleText}>
            Últimas transmisiones ({voiceHistory.length})
          </Text>
        </Pressable>

        {historyVisible && (
          <ScrollView style={styles.historyList}>
            {voiceHistory.length === 0 ? (
              <Text style={styles.emptyText}>Sin transmisiones grabadas.</Text>
            ) : (
              voiceHistory.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => AudioService.playAudio(item.audio_url)}
                  style={styles.historyItem}
                >
                  <Volume2 color="#eb527c" size={16} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.historySender}>{item.sender_callsign}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.playText}>REPRODUCIR</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1e1622',
    borderWidth: 1,
    borderColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#dfb15b',
    fontSize: 10,
    fontWeight: '600',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  sosText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  channelBanner: {
    margin: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  channelName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  channelMeta: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
  },
  channelBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  channelBadgeText: {
    color: '#dfb15b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  operatorCard: {
    alignItems: 'center',
    marginVertical: 10,
  },
  operatorCallsign: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  operatorUnit: {
    color: '#64748b',
    fontSize: 12,
  },
  pttContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pttButtonOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#161b26',
    borderWidth: 8,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  pttOuterActive: {
    borderColor: '#eb527c',
    backgroundColor: '#23151c',
  },
  pttButtonInner: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  pttInnerActive: {
    backgroundColor: '#bc2e54',
    transform: [{ scale: 0.95 }],
  },
  pttText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 1,
  },
  pttSubText: {
    color: '#fecdd3',
    fontSize: 10,
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    gap: 8,
  },
  historyToggleText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  historyList: {
    maxHeight: 140,
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 10,
    fontSize: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  historySender: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyTime: {
    color: '#64748b',
    fontSize: 10,
  },
  playText: {
    color: '#eb527c',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
