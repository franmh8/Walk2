import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
  Share,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRadio } from '../context/RadioContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Channel } from '../types';
import {
  Radio,
  Users,
  ShieldCheck,
  Plus,
  X,
  Search,
  Lock,
  LogIn,
  KeyRound,
  FolderPlus,
  QrCode,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Settings,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { QrCodeView } from '../components/QrCodeView';

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'general', label: 'General' },
  { id: 'emergencia', label: 'Emergencia' },
  { id: 'tactico', label: 'Táctico' },
  { id: 'vialidad', label: 'Vialidad' },
  { id: 'inteligencia', label: 'Inteligencia' },
  { id: 'privados', label: 'Privados' },
];

export function ChannelsScreen({ navigation }: any) {
  const { user } = useAuth();
  const {
    channels,
    selectedChannel,
    setSelectedChannel,
    createChannel,
    joinChannel,
    joinChannelByCode,
    deleteChannel,
    availableNetworkChannels,
    refreshNetworkChannels,
  } = useRadio();
  const { colors, isDark } = useTheme();

  // Búsqueda y categoría
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Modal: Crear nuevo canal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newCategory, setNewCategory] = useState<'general' | 'emergencia' | 'tactico' | 'vialidad' | 'inteligencia'>('tactico');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Modal: Unirse a canal existente (lista online)
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedChannelToJoin, setSelectedChannelToJoin] = useState<Channel | null>(null);
  const [joinPinInput, setJoinPinInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Modal: Unirse con código de 6 campos (estilo SMS)
  const [sixDigitModalVisible, setSixDigitModalVisible] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const digitInputRefs = useRef<(TextInput | null)[]>([]);

  // Modal: Configuración del canal (QR, URL, código de invitación)
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configChannel, setConfigChannel] = useState<Channel | null>(null);
  const [copiedCodeNotice, setCopiedCodeNotice] = useState(false);
  const [copiedUrlNotice, setCopiedUrlNotice] = useState(false);

  // Cargar canales de red cuando se abre el modal de unirse
  useEffect(() => {
    if (joinModalVisible) {
      refreshNetworkChannels();
      setJoinError(null);
      setSelectedChannelToJoin(null);
      setJoinPinInput('');
    }
  }, [joinModalVisible]);

  // Selección de canal principal y navegar a PTT
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    navigation.navigate('PTT');
  };

  // Crear canal
  const handleCreateChannelSubmit = async () => {
    if (!newChannelName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para el nuevo canal.');
      return;
    }

    if (newIsPrivate && newAccessCode.trim().length > 0 && newAccessCode.trim().length < 4) {
      Alert.alert('PIN no válido', 'El código PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    setIsCreating(true);
    try {
      const pinToUse = newIsPrivate
        ? newAccessCode.trim() || String(Math.floor(100000 + Math.random() * 900000))
        : String(Math.floor(100000 + Math.random() * 900000));

      const created = await createChannel(
        newChannelName.trim(),
        newIsPrivate,
        newCategory,
        pinToUse
      );

      setNewChannelName('');
      setNewAccessCode('');
      setNewIsPrivate(false);
      setCreateModalVisible(false);
      setSelectedChannel(created);
      navigation.navigate('PTT');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No fue posible crear el canal.');
    } finally {
      setIsCreating(false);
    }
  };

  // Unirse a canal desde la lista en línea
  const handleJoinFromList = async (targetChannel: Channel) => {
    const alreadyJoined = channels.some((c) => c.id === targetChannel.id);
    if (alreadyJoined) {
      setSelectedChannel(targetChannel);
      setJoinModalVisible(false);
      navigation.navigate('PTT');
      return;
    }

    if (targetChannel.is_private) {
      setSelectedChannelToJoin(targetChannel);
      setJoinPinInput('');
      setJoinError(null);
      return;
    }

    setIsJoining(true);
    const res = await joinChannel(targetChannel.id);
    setIsJoining(false);

    if (res.success && res.channel) {
      setJoinModalVisible(false);
      setSelectedChannel(res.channel);
      navigation.navigate('PTT');
    } else {
      setJoinError(res.message || 'No fue posible unirse al canal.');
    }
  };

  // Confirmar PIN al unirse a canal privado
  const handleConfirmPrivateJoin = async () => {
    if (!selectedChannelToJoin) return;
    if (!joinPinInput.trim()) {
      setJoinError('Ingresa el código PIN del canal privado.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);
    const res = await joinChannel(selectedChannelToJoin.id, joinPinInput.trim());
    setIsJoining(false);

    if (res.success && res.channel) {
      setJoinModalVisible(false);
      setSelectedChannelToJoin(null);
      setJoinPinInput('');
      setSelectedChannel(res.channel);
      navigation.navigate('PTT');
    } else {
      setJoinError(res.message || 'Código PIN incorrecto.');
    }
  };

  // Manejo de código de 6 campos (estilo SMS)
  const handleDigitChange = (index: number, val: string) => {
    setCodeError(null);
    const cleaned = val.replace(/[^0-9]/g, '');

    // Si pegan múltiples dígitos
    if (cleaned.length > 1) {
      const parts = cleaned.slice(0, 6).split('');
      const updated = [...codeDigits];
      parts.forEach((p, idx) => {
        if (index + idx < 6) updated[index + idx] = p;
      });
      setCodeDigits(updated);
      const nextIndex = Math.min(index + parts.length, 5);
      digitInputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...codeDigits];
    updated[index] = cleaned;
    setCodeDigits(updated);

    if (cleaned && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySixDigitCode = async () => {
    const fullCode = codeDigits.join('').trim();
    if (fullCode.length < 4) {
      setCodeError('Ingresa los 6 dígitos del código de acceso.');
      return;
    }

    setIsVerifyingCode(true);
    setCodeError(null);

    const res = await joinChannelByCode(fullCode);
    setIsVerifyingCode(false);

    if (res.success && res.channel) {
      setSixDigitModalVisible(false);
      setCodeDigits(['', '', '', '', '', '']);
      setSelectedChannel(res.channel);
      navigation.navigate('PTT');
    } else {
      setCodeError(res.message || 'Código de canal no encontrado o PIN incorrecto.');
    }
  };

  // Abrir configuración del canal
  const handleOpenConfig = (channel: Channel) => {
    setConfigChannel(channel);
    setCopiedCodeNotice(false);
    setCopiedUrlNotice(false);
    setConfigModalVisible(true);
  };

  // Compartir canal mediante Share nativo
  const handleShareChannel = async () => {
    if (!configChannel) return;
    const channelPin = configChannel.access_code || '104920';
    const channelUrl = `https://c5i.hidalgo.gob.mx/radio/canal/${configChannel.id}`;

    try {
      await Share.share({
        title: `Canal Táctico C5i: ${configChannel.name}`,
        message: `🚨 *Radiocomunicación Táctica C5i Hidalgo*\n\nCanal: *${configChannel.name}*\nCategoría: ${configChannel.category?.toUpperCase() || 'GENERAL'}\nCódigo de enlace (6 dígitos): *${channelPin}*\nEnlace directo: ${channelUrl}\n\nIngresa este código en tu aplicación para unirte a la frecuencia.`,
      });
    } catch (e) {
      console.warn('Error compartiendo canal:', e);
    }
  };

  // Eliminar canal
  const handleDeleteChannel = (channel: Channel) => {
    Alert.alert(
      'Eliminar Canal',
      `¿Deseas eliminar permanentemente el canal "${channel.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteChannel(channel.id);
            if (configModalVisible && configChannel?.id === channel.id) {
              setConfigModalVisible(false);
            }
          },
        },
      ]
    );
  };

  // Filtrado de canales
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      (ch.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ch.access_code || '').includes(searchTerm);

    const matchesCategory =
      selectedCategory === 'todos' ||
      (selectedCategory === 'privados' && Boolean(ch.is_private)) ||
      ch.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header con botones Unirse y Nuevo (SIN botón de SOS, exclusivo de PTT) */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadgeRow}>
            <View
              style={[
                styles.headerBadgeIcon,
                { backgroundColor: isDark ? 'rgba(235, 82, 124, 0.15)' : '#fff1f2' },
              ]}
            >
              <Radio color={colors.primary} size={13} />
            </View>
            <Text style={[styles.headerLabel, { color: colors.primary }]}>CANALES TÁCTICOS</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Grupos de Transmisión
          </Text>
        </View>

        {/* Botones de acción superiores: Unirse y Crear Grupo */}
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setJoinModalVisible(true)}
            style={[
              styles.actionButtonSecondary,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <LogIn color={colors.primary} size={15} />
            <Text style={[styles.actionButtonSecondaryText, { color: colors.text }]}>
              Unirse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setNewChannelName('');
              setNewAccessCode('');
              setNewIsPrivate(false);
              setCreateModalVisible(true);
            }}
            style={[styles.actionButtonPrimary, { backgroundColor: colors.primary }]}
          >
            <Plus color="#ffffff" size={15} />
            <Text style={styles.actionButtonPrimaryText}>Nuevo</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Barra de Búsqueda */}
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
            placeholder="Buscar canal, frecuencia o código PIN..."
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

      {/* 3. Filtrador por Categorías (Horizontal Scroll con fondo guinda y letra blanca al seleccionar) */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryChip,
                  isSelected
                    ? [styles.categoryChipSelected, { backgroundColor: colors.primary }]
                    : [
                        styles.categoryChipUnselected,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected
                      ? styles.categoryChipTextSelected
                      : { color: colors.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Lista de Canales */}
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
            {searchTerm || selectedCategory !== 'todos'
              ? 'No se encontraron canales'
              : 'Sin canales activos'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchTerm || selectedCategory !== 'todos'
              ? 'Intenta con otro término de búsqueda o selecciona otra categoría.'
              : 'Crea tu propio canal o únete a una frecuencia táctica con código PIN.'}
          </Text>

          <View style={styles.emptyButtonsRow}>
            <Pressable
              onPress={() => setJoinModalVisible(true)}
              style={[
                styles.emptyBtnSecondary,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <LogIn color={colors.primary} size={15} />
              <Text style={[styles.emptyBtnSecondaryText, { color: colors.text }]}>
                Unirse a Canal
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={[styles.emptyBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Plus color="#ffffff" size={15} />
              <Text style={styles.emptyBtnPrimaryText}>Crear Canal</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          renderItem={({ item }) => {
            const isSelected = selectedChannel?.id === item.id;
            const categoryName = (item.category || 'general').toUpperCase();

            return (
              <Pressable
                onPress={() => handleSelectChannel(item)}
                style={[
                  styles.channelCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                  isSelected && styles.channelCardSelected,
                ]}
              >
                {/* Icono de frecuencia */}
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

                {/* Detalles del Canal */}
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
                    {item.is_private ? (
                      <View style={styles.lockBadge}>
                        <Lock color="#f59e0b" size={12} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={[styles.categoryTag, { color: colors.textMuted }]}>
                      {categoryName}
                    </Text>
                    <Text style={[styles.metaDivider, { color: colors.textMuted }]}>•</Text>
                    <View style={styles.metaBadge}>
                      <Users color={colors.textMuted} size={11} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.member_count || 1} activos
                      </Text>
                    </View>
                    <Text style={[styles.metaDivider, { color: colors.textMuted }]}>•</Text>
                    <View style={styles.metaBadge}>
                      <ShieldCheck color="#10b981" size={11} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        E2EE
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Acciones Derecha: Botón Configuración (QR/URL) e indicador ACTIVO */}
                <View style={styles.cardRightActions}>
                  {isSelected && (
                    <View
                      style={[
                        styles.activeTag,
                        {
                          backgroundColor: isDark
                            ? 'rgba(235, 82, 124, 0.15)'
                            : '#fff1f2',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <CheckCircle2 color={colors.primary} size={11} />
                      <Text style={[styles.activeTagText, { color: colors.primary }]}>
                        ACTIVO
                      </Text>
                    </View>
                  )}

                  {/* Botón Configuración del Canal (QR y URL) */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenConfig(item);
                    }}
                    style={[
                      styles.configIconBtn,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    title="Configuración y QR del Canal"
                  >
                    <QrCode color={colors.primary} size={16} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREAR NUEVO CANAL (Nombre, Categoría y PIN)      */}
      {/* ======================================================== */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View
                  style={[
                    styles.modalHeaderIconBadge,
                    { backgroundColor: isDark ? 'rgba(235, 82, 124, 0.15)' : '#fff1f2' },
                  ]}
                >
                  <FolderPlus color={colors.primary} size={18} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Nuevo Canal Táctico
                </Text>
              </View>
              <Pressable onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                <X color={colors.textMuted} size={18} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Nombre */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                NOMBRE DEL CANAL *
              </Text>
              <TextInput
                value={newChannelName}
                onChangeText={setNewChannelName}
                placeholder="Ej. Operativo Huasteca Hidalguense"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
              />

              {/* Categoría */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                CATEGORÍA / PROPÓSITO
              </Text>
              <View style={styles.categoryPickerGrid}>
                {[
                  { id: 'tactico', label: 'Táctico', desc: 'Operaciones Especiales' },
                  { id: 'general', label: 'General', desc: 'Despacho Central' },
                  { id: 'emergencia', label: 'Emergencia', desc: 'Línea 911' },
                  { id: 'vialidad', label: 'Vialidad', desc: 'Tránsito y Carreteras' },
                  { id: 'inteligencia', label: 'Inteligencia', desc: 'Vigilancia C5i' },
                ].map((item) => {
                  const isCat = newCategory === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setNewCategory(item.id as any)}
                      style={[
                        styles.categoryPickerItem,
                        {
                          backgroundColor: isCat
                            ? colors.primary
                            : isDark
                            ? '#1e293b'
                            : '#f8fafc',
                          borderColor: isCat ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPickerTitle,
                          { color: isCat ? '#ffffff' : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.categoryPickerDesc,
                          { color: isCat ? 'rgba(255,255,255,0.85)' : colors.textMuted },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Canal Privado Switch */}
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>
                    Canal Privado con PIN
                  </Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                    Requiere clave de 6 dígitos para ingresar
                  </Text>
                </View>
                <Switch
                  value={newIsPrivate}
                  onValueChange={setNewIsPrivate}
                  trackColor={{ false: '#94a3b8', true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Input PIN si es privado */}
              {newIsPrivate && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    CÓDIGO PIN DE ACCESO (6 DÍGITOS)
                  </Text>
                  <TextInput
                    value={newAccessCode}
                    onChangeText={setNewAccessCode}
                    placeholder="Ej. 771042 (o se genera en automático)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[
                      styles.textInput,
                      styles.pinInput,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
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
                onPress={handleCreateChannelSubmit}
                disabled={isCreating}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                {isCreating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Crear Canal</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: UNIRSE A CANAL (Lista Online + Botón PIN abajo)  */}
      {/* ======================================================== */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              styles.joinModalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View
                  style={[
                    styles.modalHeaderIconBadge,
                    { backgroundColor: isDark ? 'rgba(235, 82, 124, 0.15)' : '#fff1f2' },
                  ]}
                >
                  <LogIn color={colors.primary} size={18} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Unirse a Canal de Radio
                </Text>
              </View>
              <Pressable onPress={() => setJoinModalVisible(false)} style={styles.closeBtn}>
                <X color={colors.textMuted} size={18} />
              </Pressable>
            </View>

            {joinError && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <AlertTriangle color="#ef4444" size={14} />
                <Text style={styles.errorBannerText}>{joinError}</Text>
              </View>
            )}

            {!selectedChannelToJoin ? (
              <>
                <Text style={[styles.joinSubtitle, { color: colors.textSecondary }]}>
                  Selecciona uno de los canales en línea en la red C5i para unirte a la transmisión:
                </Text>

                {/* Lista de canales disponibles */}
                <ScrollView style={styles.availableChannelsList}>
                  {availableNetworkChannels.length === 0 ? (
                    <View style={styles.emptyAvailableChannels}>
                      <Text style={[styles.emptyAvailableText, { color: colors.textMuted }]}>
                        No hay canales públicos disponibles en este momento.
                      </Text>
                    </View>
                  ) : (
                    availableNetworkChannels.map((c) => {
                      const alreadyJoined = channels.some((myC) => myC.id === c.id);
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => handleJoinFromList(c)}
                          style={[
                            styles.availableChannelItem,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                              borderColor: colors.cardBorder,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.availableChannelIcon,
                              { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                            ]}
                          >
                            <Radio color={colors.primary} size={16} />
                          </View>

                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={styles.nameRow}>
                              <Text
                                style={[styles.availableChannelName, { color: colors.text }]}
                                numberOfLines={1}
                              >
                                {c.name}
                              </Text>
                              {c.is_private ? (
                                <Lock color="#f59e0b" size={11} style={{ marginLeft: 4 }} />
                              ) : null}
                            </View>
                            <Text style={[styles.availableChannelMeta, { color: colors.textMuted }]}>
                              {(c.category || 'GENERAL').toUpperCase()} • {c.member_count || 1} activos
                            </Text>
                          </View>

                          <View style={{ marginLeft: 8 }}>
                            {alreadyJoined ? (
                              <View style={styles.joinedPill}>
                                <Check color="#10b981" size={12} />
                                <Text style={styles.joinedPillText}>Unido</Text>
                              </View>
                            ) : (
                              <Text style={[styles.joinActionText, { color: colors.primary }]}>
                                Unirse →
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>

                {/* BOTÓN REQUERIDO: Ingresar código PIN de 6 dígitos */}
                <View style={styles.bottomCodeSection}>
                  <Pressable
                    onPress={() => {
                      setJoinModalVisible(false);
                      setCodeDigits(['', '', '', '', '', '']);
                      setCodeError(null);
                      setSixDigitModalVisible(true);
                    }}
                    style={[
                      styles.enterCodeButton,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <KeyRound color={colors.primary} size={16} />
                    <Text style={[styles.enterCodeButtonText, { color: colors.primary }]}>
                      Ingresar Código del Grupo (PIN)
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* Sub-formulario si seleccionó un canal privado específico */
              <View style={styles.pinEntryCard}>
                <View
                  style={[
                    styles.pinChannelSummary,
                    { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder },
                  ]}
                >
                  <Lock color="#f59e0b" size={20} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.pinChannelName, { color: colors.text }]}>
                      {selectedChannelToJoin.name}
                    </Text>
                    <Text style={[styles.pinChannelNotice, { color: colors.textMuted }]}>
                      Canal protegido. Ingresa el código PIN táctico:
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={joinPinInput}
                  onChangeText={setJoinPinInput}
                  placeholder="PIN de 4 o 6 dígitos"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    styles.textInput,
                    styles.pinInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                      marginTop: 14,
                    },
                  ]}
                  autoFocus
                />

                <View style={[styles.modalButtons, { marginTop: 16 }]}>
                  <Pressable
                    onPress={() => setSelectedChannelToJoin(null)}
                    style={[
                      styles.cancelBtn,
                      { borderColor: colors.cardBorder, backgroundColor: colors.badgeBackground },
                    ]}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                      Volver
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmPrivateJoin}
                    disabled={isJoining}
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  >
                    {isJoining ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Acceder al Canal</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: INGRESO CON CÓDIGO DE 6 CAMPOS (ESTILO SMS/OTP)  */}
      {/* ======================================================== */}
      <Modal
        visible={sixDigitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSixDigitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View
                  style={[
                    styles.modalHeaderIconBadge,
                    { backgroundColor: isDark ? 'rgba(235, 82, 124, 0.15)' : '#fff1f2' },
                  ]}
                >
                  <KeyRound color={colors.primary} size={18} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Código del Grupo
                </Text>
              </View>
              <Pressable
                onPress={() => setSixDigitModalVisible(false)}
                style={styles.closeBtn}
              >
                <X color={colors.textMuted} size={18} />
              </Pressable>
            </View>

            <Text style={[styles.smsSubtitle, { color: colors.textSecondary }]}>
              Ingresa el código PIN de 6 campos compartido para sincronizar el canal en tu equipo:
            </Text>

            {codeError && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <AlertTriangle color="#ef4444" size={14} />
                <Text style={styles.errorBannerText}>{codeError}</Text>
              </View>
            )}

            {/* 6 CAMPOS NUMÉRICOS TIPO SMS / OTP */}
            <View style={styles.sixBoxesRow}>
              {codeDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => (digitInputRefs.current[idx] = ref)}
                  value={digit}
                  onChangeText={(val) => handleDigitChange(idx, val)}
                  onKeyPress={({ nativeEvent }) => handleDigitKeyPress(idx, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  style={[
                    styles.digitBox,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: digit ? colors.primary : colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.smsHint, { color: colors.textMuted }]}>
              Solicita el código al oficial administrador de la frecuencia.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setSixDigitModalVisible(false);
                  setJoinModalVisible(true);
                }}
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
                onPress={handleVerifySixDigitCode}
                disabled={isVerifyingCode}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                {isVerifyingCode ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Unirse al Grupo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: CONFIGURACIÓN DEL CANAL (CÓDIGO, QR Y URL)      */}
      {/* ======================================================== */}
      {configChannel && (
        <Modal
          visible={configModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfigModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                styles.configModalCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <View
                    style={[
                      styles.modalHeaderIconBadge,
                      { backgroundColor: isDark ? 'rgba(235, 82, 124, 0.15)' : '#fff1f2' },
                    ]}
                  >
                    <Settings color={colors.primary} size={18} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Configuración del Canal
                  </Text>
                </View>
                <Pressable
                  onPress={() => setConfigModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <X color={colors.textMuted} size={18} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                {/* Resumen del canal */}
                <View
                  style={[
                    styles.configChannelSummary,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.nameRow}>
                    <Text style={[styles.configSummaryName, { color: colors.text }]}>
                      {configChannel.name}
                    </Text>
                    {configChannel.is_private ? (
                      <View style={styles.lockBadge}>
                        <Lock color="#f59e0b" size={13} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.configSummaryMeta, { color: colors.textMuted }]}>
                    {(configChannel.category || 'general').toUpperCase()} • {configChannel.member_count || 1} miembros activos
                  </Text>
                </View>

                {/* 1. CÓDIGO DE INVITACIÓN (6 DÍGITOS) */}
                <View style={styles.configSection}>
                  <Text style={[styles.configSectionTitle, { color: colors.textSecondary }]}>
                    CÓDIGO PIN DEL GRUPO (6 DÍGITOS)
                  </Text>
                  <View style={styles.codeBoxesRow}>
                    {(configChannel.access_code || '104920')
                      .slice(0, 6)
                      .split('')
                      .map((char, i) => (
                        <View
                          key={i}
                          style={[
                            styles.codeBoxDisplay,
                            {
                              backgroundColor: isDark ? '#1e293b' : '#ffffff',
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          <Text style={[styles.codeBoxChar, { color: colors.primary }]}>
                            {char}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>

                {/* 2. CÓDIGO QR TÁCTICO */}
                <View style={styles.configQrContainer}>
                  <Text style={[styles.configSectionTitle, { color: colors.textSecondary }]}>
                    CÓDIGO QR DE VINCULACIÓN DIRECTA
                  </Text>
                  <View style={styles.qrWrapper}>
                    <QrCodeView
                      value={`c5i://canal/${configChannel.id}?pin=${configChannel.access_code || ''}`}
                      size={170}
                      color={isDark ? '#f8fafc' : '#0f172a'}
                      backgroundColor={isDark ? '#0f172a' : '#ffffff'}
                    />
                  </View>
                  <Text style={[styles.qrInstruction, { color: colors.textMuted }]}>
                    Los compañeros pueden escanear este código QR o introducir el PIN para unirse al canal.
                  </Text>
                </View>

                {/* 3. URL DIRECTA */}
                <View style={styles.configSection}>
                  <Text style={[styles.configSectionTitle, { color: colors.textSecondary }]}>
                    ENLACE WEB DEL CANAL
                  </Text>
                  <View
                    style={[
                      styles.urlBox,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.urlText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {`https://c5i.hidalgo.gob.mx/radio/canal/${configChannel.id}`}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Botones de acción del Modal de Configuración */}
              <View style={styles.configModalActions}>
                <Pressable
                  onPress={handleShareChannel}
                  style={[styles.shareFullBtn, { backgroundColor: colors.primary }]}
                >
                  <Share2 color="#ffffff" size={16} />
                  <Text style={styles.shareFullBtnText}>Compartir Canal con Compañeros</Text>
                </Pressable>

                {(!configChannel.created_by || configChannel.created_by === user?.id) && (
                  <Pressable
                    onPress={() => handleDeleteChannel(configChannel)}
                    style={[
                      styles.deleteChannelBtn,
                      { borderColor: 'rgba(239, 68, 68, 0.3)' },
                    ]}
                  >
                    <Trash2 color="#ef4444" size={14} />
                    <Text style={styles.deleteChannelBtnText}>Eliminar este Canal</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  actionButtonSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoriesWrapper: {
    paddingVertical: 6,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipSelected: {
    borderColor: '#8a1a36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipUnselected: {},
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
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
  emptyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  emptyBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emptyBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
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
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  lockBadge: {
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metaDivider: {
    fontSize: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  configIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  joinModalCard: {
    maxHeight: '85%',
  },
  configModalCard: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    paddingBottom: 12,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeaderIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  pinInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 3,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPickerItem: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPickerDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  joinSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  availableChannelsList: {
    maxHeight: 220,
  },
  emptyAvailableChannels: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyAvailableText: {
    fontSize: 12,
  },
  availableChannelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  availableChannelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  availableChannelName: {
    fontSize: 12,
    fontWeight: '700',
  },
  availableChannelMeta: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  joinedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  joinActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomCodeSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 12,
  },
  enterCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  enterCodeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pinEntryCard: {
    paddingVertical: 8,
  },
  pinChannelSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pinChannelName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  pinChannelNotice: {
    fontSize: 11,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#ef4444',
    fontSize: 11,
    flex: 1,
  },
  smsSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  sixBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 6,
  },
  digitBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  smsHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  configChannelSummary: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  configSummaryName: {
    fontSize: 15,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  configSummaryMeta: {
    fontSize: 11,
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  configSection: {
    marginBottom: 16,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  codeBoxDisplay: {
    width: 40,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxChar: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  configQrContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  qrWrapper: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  qrInstruction: {
    fontSize: 10,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 4,
  },
  urlBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  urlText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  configModalActions: {
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 14,
  },
  shareFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareFullBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteChannelBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
