import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AudioService } from '../services/audioService';
import {
  Mic,
  AlertTriangle,
  Users,
  Wifi,
  History,
  Trash2,
  Volume2,
} from 'lucide-react-native';

export function PttScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const {
    selectedChannel,
    isTransmitting,
    startTransmitting,
    stopTransmitting,
    voiceHistory,
    clearHistory,
    channels,
  } = useRadio();

  const [historyVisible, setHistoryVisible] = useState(false);

  const handleSosTrigger = () => {
    Alert.alert(
      '🚨 ALERTA ROJA SOS C5i',
      '¿Deseas emitir una alerta de emergencia inmediata a la Central de Despacho C5i?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'EMITIR SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Alerta SOS Emitida',
              `Alerta transmitida a Central C5i para la unidad ${user?.callsign || 'OPERATIVA'}.`
            );
          },
        },
      ]
    );
  };

  const channelTitle = selectedChannel
    ? selectedChannel.name
    : channels.length === 0
    ? 'Sin canales (Toca para crear)'
    : 'Selecciona un canal';

  const memberCount = selectedChannel?.member_count || (channels.length === 0 ? 0 : 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP BAR: CANAL ACTUAL, SOS & MEMBER BADGE (EXACTO A WEB - IMAGEN 2) */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.navigate('Grupos')}
          style={styles.channelTitleWrapper}
          android_ripple={{ color: 'transparent' }}
        >
          <Text style={[styles.channelLabel, { color: colors.textMuted }]}>
            CANAL ACTUAL
          </Text>
          <Text
            style={[styles.channelTitle, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {channelTitle}
          </Text>
        </Pressable>

        {/* Action Pills: SOS Emergency and Member Count */}
        <View style={styles.topActions}>
          {/* Emergency SOS Button */}
          <Pressable
            onPress={handleSosTrigger}
            style={styles.sosButton}
          >
            <AlertTriangle color="#ffffff" size={14} fill="rgba(255,255,255,0.2)" />
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>

          {/* Member count pill */}
          <Pressable
            onPress={() => navigation.navigate('Grupos')}
            style={[
              styles.membersPill,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Users color={colors.textSecondary} size={14} />
            <Text style={[styles.membersText, { color: colors.text }]}>
              {memberCount}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* CENTER AREA: STATUS PROMPT, PTT CIRCLE BUTTON & CONNECTED PILL */}
      <View style={styles.centerArea}>
        {/* Status prompt */}
        <View style={styles.promptWrapper}>
          {isTransmitting ? (
            <View style={styles.promptRow}>
              <View style={styles.transmittingDot} />
              <Text style={styles.transmittingText}>
                Transmitiendo audio en vivo...
              </Text>
            </View>
          ) : (
            <View style={styles.promptRow}>
              <View style={styles.idleDot} />
              <Text style={[styles.idleText, { color: colors.textSecondary }]}>
                Mantén presionado para hablar
              </Text>
            </View>
          )}
        </View>

        {/* Concentric Circle PTT Button (Exacto a Web - Imagen 2) */}
        <View style={styles.pttCircleWrapper}>
          {/* Outer Ring */}
          <View
            style={[
              styles.pttOuterRing,
              {
                backgroundColor: isTransmitting
                  ? isDark
                    ? '#1e1017'
                    : '#fff1f2'
                  : colors.pttOuterBg,
                borderColor: isTransmitting
                  ? '#f43f5e'
                  : colors.pttOuterBorder,
                shadowColor: isDark ? '#000000' : '#64748b',
              },
            ]}
          >
            {/* Inner PTT Button */}
            <Pressable
              onPressIn={startTransmitting}
              onPressOut={stopTransmitting}
              style={({ pressed }) => [
                styles.pttInnerButton,
                {
                  backgroundColor: isTransmitting || pressed
                    ? '#be123c'
                    : colors.pttInnerBg,
                  borderColor: isTransmitting || pressed
                    ? '#f43f5e'
                    : colors.pttInnerBorder,
                },
                (isTransmitting || pressed) && styles.pttInnerActive,
              ]}
            >
              <Mic
                color={
                  isTransmitting
                    ? '#ffffff'
                    : isDark
                    ? '#cbd5e1'
                    : '#334155'
                }
                size={52}
                strokeWidth={1.8}
              />
            </Pressable>
          </View>
        </View>

        {/* Connected Dynamic Status Pill: Conectado (Wi-Fi) */}
        <View
          style={[
            styles.networkPill,
            {
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            },
          ]}
        >
          <Wifi color={colors.pillText} size={14} />
          <Text style={[styles.networkPillText, { color: colors.pillText }]}>
            Conectado (Wi-Fi)
          </Text>
        </View>
      </View>

      {/* BOTTOM AREA: Historial de transmisiones colapsable limpio */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <View style={styles.historyToggleRow}>
          <Pressable
            onPress={() => setHistoryVisible(!historyVisible)}
            style={styles.historyToggle}
          >
            <History color={colors.textMuted} size={15} />
            <Text style={[styles.historyToggleText, { color: colors.textSecondary }]}>
              Transmisiones registradas ({voiceHistory.length})
            </Text>
          </Pressable>

          {voiceHistory.length > 0 && (
            <Pressable onPress={clearHistory} style={styles.clearHistoryButton}>
              <Trash2 color="#ef4444" size={14} />
            </Pressable>
          )}
        </View>

        {historyVisible && (
          <ScrollView
            style={[styles.historyList, { maxHeight: 130 }]}
            nestedScrollEnabled
          >
            {voiceHistory.length === 0 ? (
              <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                Sin transmisiones registradas aún.
              </Text>
            ) : (
              voiceHistory.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => AudioService.playAudio(item.audio_url)}
                  style={[
                    styles.historyItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Volume2 color="#8a1a36" size={15} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.historySender, { color: colors.text }]}>
                      {item.sender_callsign || 'Patrulla'}
                    </Text>
                    <Text style={[styles.historyTime, { color: colors.textMuted }]}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 14 : 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  channelTitleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  channelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48', // rose-600 idéntico a web
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  membersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  membersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  promptWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  idleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981', // emerald-500
  },
  idleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  transmittingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  transmittingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e11d48',
  },
  pttCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pttOuterRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  pttInnerButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  pttInnerActive: {
    transform: [{ scale: 0.96 }],
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginTop: 32,
  },
  networkPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  historyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  historyToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearHistoryButton: {
    padding: 6,
  },
  historyList: {
    marginTop: 8,
  },
  emptyHistoryText: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  historySender: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyTime: {
    fontSize: 10,
    marginTop: 2,
  },
  playText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8a1a36',
  },
});
