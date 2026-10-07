import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Lock, Eye, EyeOff, KeyRound, UserPlus, X, CheckCircle2, AlertTriangle } from 'lucide-react-native';

export function LoginScreen() {
  const { login, register } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal de Registro
  const [registerVisible, setRegisterVisible] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCallsign, setRegCallsign] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Modal de Recuperación
  const [recoverVisible, setRecoverVisible] = useState(false);
  const [recoverPhone, setRecoverPhone] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(null);
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMessage('Por favor ingresa tu teléfono o correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(cleanId, cleanPass);
      if (!success) {
        setErrorMessage('Credenciales no válidas. Si es tu primera vez, pulsa "Registrarse".');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor llena todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName.trim(),
        phone_number: regPhone.trim(),
        callsign: regCallsign.trim() || `PATRULLA-${regPhone.slice(-3)}`,
        password: regPassword.trim(),
        unit: 'Sector Operativo Hidalgo',
        role: 'Oficial Operativo',
      });
      setRegisterVisible(false);
      setIdentifier(regPhone.trim());
      setPassword(regPassword.trim());
      Alert.alert('Registro Exitoso', 'Tu usuario táctico C5i ha sido creado. Sesión iniciada.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = () => {
    if (!recoverPhone.trim()) {
      Alert.alert('Atención', 'Ingresa tu teléfono o correo registrado.');
      return;
    }
    setRecoverSuccess(true);
    setTimeout(() => {
      setRecoverSuccess(false);
      setRecoverVisible(false);
      Alert.alert('Código Enviado', 'Se ha enviado un código de restablecimiento temporal.');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Floating Minimalist Card (Image 2 design) */}
        <View style={styles.card}>
          {/* Logo C5i */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/c5i-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Titles */}
          <Text style={styles.title}>C5i Walkiet</Text>
          <Text style={styles.subtitle}>Sistema de Radiocomunicación Táctica</Text>

          {/* Error Alert */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={15} color="#e11d48" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Campo: Teléfono o Correo */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Teléfono o Correo</Text>
            <View style={styles.inputWrapper}>
              <UserIcon size={18} color="#94a3b8" />
              <TextInput
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ingresa tu teléfono o correo"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          {/* Campo: Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94a3b8" />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Botón Iniciar Sesión */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginButton, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </Pressable>

          {/* Enlaces de pie de tarjeta */}
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => setRecoverVisible(true)}
              style={styles.linkButton}
            >
              <KeyRound size={15} color="#475569" />
              <Text style={styles.recoverText}>Recuperar acceso</Text>
            </Pressable>

            <Pressable
              onPress={() => setRegisterVisible(true)}
              style={styles.linkButton}
            >
              <UserPlus size={15} color="#691c32" />
              <Text style={styles.registerText}>Registrarse</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Registro Limpio */}
      <Modal
        visible={registerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRegisterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registro de Unidad C5i</Text>
              <Pressable onPress={() => setRegisterVisible(false)}>
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Crea una credencial táctica limpia</Text>

            <View style={styles.modalField}>
              <Text style={styles.label}>Nombre y Apellidos</Text>
              <TextInput
                value={regName}
                onChangeText={setRegName}
                placeholder="Ej. Oficial Rodrigo Mendoza"
                placeholderTextColor="#94a3b8"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                value={regPhone}
                onChangeText={setRegPhone}
                placeholder="10 dígitos (ej. 7711234567)"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Indicativo de Radio (Callsign)</Text>
              <TextInput
                value={regCallsign}
                onChangeText={setRegCallsign}
                placeholder="Ej. PATRULLA-302 / ALFA-1"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                value={regPassword}
                onChangeText={setRegPassword}
                placeholder="Crea tu contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                style={styles.modalInput}
              />
            </View>

            <Pressable
              onPress={handleRegisterSubmit}
              disabled={loading}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Completar Registro</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Recuperar Acceso */}
      <Modal
        visible={recoverVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRecoverVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar Acceso</Text>
              <Pressable onPress={() => setRecoverVisible(false)}>
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Ingresa tu identificador para recibir asistencia C5i</Text>

            <View style={styles.modalField}>
              <Text style={styles.label}>Teléfono o Correo</Text>
              <TextInput
                value={recoverPhone}
                onChangeText={setRecoverPhone}
                placeholder="Teléfono o correo registrado"
                placeholderTextColor="#94a3b8"
                style={styles.modalInput}
              />
            </View>

            {recoverSuccess && (
              <View style={styles.successBanner}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.successText}>Instrucciones enviadas con éxito</Text>
              </View>
            )}

            <Pressable
              onPress={handleRecoverSubmit}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Enviar Código</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Fondo gris claro minimalista exacto
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 26,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 140,
    height: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '400',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#be123c',
    fontSize: 12,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 0,
  },
  loginButton: {
    backgroundColor: '#691c32', // Vino C5i exacto
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#691c32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  recoverText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  registerText: {
    fontSize: 12,
    color: '#691c32',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  modalButton: {
    backgroundColor: '#691c32',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
  },
  successText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
});
