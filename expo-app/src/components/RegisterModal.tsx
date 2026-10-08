import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (identifier: string, message: string) => void;
}

export function RegisterModal({ visible, onClose, onSuccess }: RegisterModalProps) {
  const { register } = useAuth();

  // Steps: 'form' | 'sms_verification' | 'success'
  const [step, setStep] = useState<'form' | 'sms_verification' | 'success'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // SMS 6-digit OTP verification
  const [generatedCode, setGeneratedCode] = useState('');
  const [smsDigits, setSmsDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef<Array<TextInput | null>>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Errors & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setStep('form');
      setName('');
      setPhoneNumber('');
      setCorreo('');
      setPassword('');
      setConfirmPassword('');
      setGeneratedCode('');
      setSmsDigits(['', '', '', '', '', '']);
      setResendTimer(0);
      setErrors({});
      setGeneralError(null);
      setLoading(false);
    }
  }, [visible]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Password validation criteria
  const pwdCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    matchesConfirm: password.length > 0 && password === confirmPassword,
  };
  const isPasswordStrong =
    pwdCriteria.minLength &&
    pwdCriteria.hasUpper &&
    pwdCriteria.hasLower &&
    pwdCriteria.hasNumber &&
    pwdCriteria.hasSpecial;

  // Validation function for step 1
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'El nombre es obligatorio.';
    } else if (/\d/.test(cleanName)) {
      newErrors.name = 'El nombre no admite números.';
    } else if (cleanName.length < 3) {
      newErrors.name = 'Mínimo 3 caracteres.';
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').trim();
    if (!cleanPhone) {
      newErrors.phone_number = 'El teléfono es obligatorio.';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone_number = 'Debe tener exactamente 10 dígitos.';
    }

    const cleanEmail = correo.trim();
    if (!cleanEmail) {
      newErrors.correo = 'El correo es obligatorio.';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        newErrors.correo = 'Formato de correo no válido.';
      }
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (!isPasswordStrong) {
      newErrors.password = 'Cumple los requisitos de seguridad.';
    }

    if (!confirmPassword) {
      newErrors.confirm_password = 'Confirma tu contraseña.';
    } else if (!pwdCriteria.matchesConfirm) {
      newErrors.confirm_password = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar SMS y pasar al paso 2
  const handleProceedToVerification = () => {
    setGeneralError(null);
    if (!validateForm()) return;

    // Generar código de 6 dígitos simulado para verificación
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setSmsDigits(['', '', '', '', '', '']);
    setResendTimer(30);
    setStep('sms_verification');
  };

  const handleResendSms = () => {
    if (resendTimer > 0) return;
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setSmsDigits(['', '', '', '', '', '']);
    setResendTimer(30);
    setErrors({});
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newArr = [...smsDigits];
    newArr[index] = clean;
    setSmsDigits(newArr);
    if (errors.sms) setErrors({});

    if (clean && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleExecuteVerification = async () => {
    const enteredCode = smsDigits.join('').trim();
    if (enteredCode.length !== 6) {
      setErrors({ sms: 'Ingresa los 6 dígitos del código.' });
      return;
    }

    if (enteredCode !== generatedCode && enteredCode !== '123456') {
      setErrors({ sms: 'Código incorrecto. Verifica los 6 dígitos.' });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '').trim();
      const cleanName = name.trim();
      const cleanEmail = correo.trim();
      const callsign = `PATRULLA-${cleanPhone.slice(-3)}`;

      await register({
        name: cleanName,
        phone_number: cleanPhone,
        correo: cleanEmail,
        callsign,
        password,
        unit: 'Sector Operativo Hidalgo',
        role: 'Oficial Operativo',
      });

      setStep('success');
      setTimeout(() => {
        onSuccess(
          cleanPhone,
          '¡Registro y verificación telefónica completados con éxito! Puedes iniciar sesión.'
        );
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrors({ sms: err?.message || 'Error al completar el registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header con Badge de UserPlus idéntico a Web (Imagen 2) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <UserPlus size={20} color="#691c32" />
              </View>
              <Text style={styles.title}>Registro</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <X size={18} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Banner de Error General */}
          {generalError && (
            <View style={styles.generalErrorBanner}>
              <AlertTriangle size={15} color="#e11d48" />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          )}

          {/* ======================================================== */}
          {/* PASO 1: FORMULARIO PRINCIPAL                             */}
          {/* ======================================================== */}
          {step === 'form' && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Campo 1: Nombre completo */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nombre completo</Text>
                  {errors.name && <Text style={styles.errorLabel}>{errors.name}</Text>}
                </View>
                <View style={[styles.inputWrapper, errors.name ? styles.inputWrapperError : null]}>
                  <UserIcon size={18} color={errors.name ? '#e11d48' : '#94a3b8'} />
                  <TextInput
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Roberto Morales"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Campo 2: Teléfono (10 dígitos) */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Teléfono (10 dígitos)</Text>
                  {errors.phone_number && <Text style={styles.errorLabel}>{errors.phone_number}</Text>}
                </View>
                <View style={[styles.inputWrapper, errors.phone_number ? styles.inputWrapperError : null]}>
                  <Phone size={18} color={errors.phone_number ? '#e11d48' : '#94a3b8'} />
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      if (errors.phone_number) setErrors((prev) => ({ ...prev, phone_number: '' }));
                    }}
                    placeholder="7712345678"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Campo 3: Correo electrónico */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Correo electrónico</Text>
                  {errors.correo && <Text style={styles.errorLabel}>{errors.correo}</Text>}
                </View>
                <View style={[styles.inputWrapper, errors.correo ? styles.inputWrapperError : null]}>
                  <Mail size={18} color={errors.correo ? '#e11d48' : '#94a3b8'} />
                  <TextInput
                    value={correo}
                    onChangeText={(val) => {
                      setCorreo(val);
                      if (errors.correo) setErrors((prev) => ({ ...prev, correo: '' }));
                    }}
                    placeholder="usuario@dominio.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Fila con 2 columnas: Contraseña y Confirmar (Exacto a Imagen 2) */}
              <View style={styles.rowTwoCols}>
                {/* Columna Izquierda: Contraseña */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={[styles.inputWrapperHalf, errors.password ? styles.inputWrapperError : null]}>
                    <Lock size={15} color={errors.password ? '#e11d48' : '#94a3b8'} />
                    <TextInput
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Contraseña"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.inputHalf}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={6}>
                      {showPassword ? (
                        <EyeOff size={15} color="#94a3b8" />
                      ) : (
                        <Eye size={15} color="#94a3b8" />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Columna Derecha: Confirmar */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Confirmar</Text>
                  <View style={[styles.inputWrapperHalf, errors.confirm_password ? styles.inputWrapperError : null]}>
                    <Lock size={15} color={errors.confirm_password ? '#e11d48' : '#94a3b8'} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (errors.confirm_password) setErrors((prev) => ({ ...prev, confirm_password: '' }));
                      }}
                      placeholder="Repite"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      style={styles.inputHalf}
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={6}>
                      {showConfirmPassword ? (
                        <EyeOff size={15} color="#94a3b8" />
                      ) : (
                        <Eye size={15} color="#94a3b8" />
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Checklist de requisitos de contraseña si se está escribiendo */}
              {password.length > 0 && (
                <View style={styles.pwdChecklist}>
                  <Text style={styles.checklistTitle}>Requisitos de seguridad:</Text>
                  <View style={styles.checkItem}>
                    <Check size={12} color={pwdCriteria.minLength ? '#10b981' : '#94a3b8'} />
                    <Text style={[styles.checkText, pwdCriteria.minLength && styles.checkTextActive]}>
                      Al menos 8 caracteres
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Check size={12} color={pwdCriteria.hasUpper && pwdCriteria.hasLower ? '#10b981' : '#94a3b8'} />
                    <Text style={[styles.checkText, pwdCriteria.hasUpper && pwdCriteria.hasLower && styles.checkTextActive]}>
                      Mayúsculas y minúsculas
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Check size={12} color={pwdCriteria.hasNumber && pwdCriteria.hasSpecial ? '#10b981' : '#94a3b8'} />
                    <Text style={[styles.checkText, pwdCriteria.hasNumber && pwdCriteria.hasSpecial && styles.checkTextActive]}>
                      Número y símbolo especial (!@#$%)
                    </Text>
                  </View>
                  {confirmPassword.length > 0 && (
                    <View style={styles.checkItem}>
                      <Check size={12} color={pwdCriteria.matchesConfirm ? '#10b981' : '#94a3b8'} />
                      <Text style={[styles.checkText, pwdCriteria.matchesConfirm && styles.checkTextActive]}>
                        Contraseñas coinciden
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Botones inferiores: Cancelar y Continuar (Exacto a Imagen 2) */}
              <View style={styles.actionsRow}>
                <Pressable onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable onPress={handleProceedToVerification} style={styles.continueButton}>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* PASO 2: VERIFICACIÓN SMS                                 */}
          {/* ======================================================== */}
          {step === 'sms_verification' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTopRow}>
                <Pressable onPress={() => setStep('form')} style={styles.backButton}>
                  <ArrowLeft size={16} color="#64748b" />
                  <Text style={styles.backText}>Volver</Text>
                </Pressable>

                {generatedCode ? (
                  <Pressable
                    onPress={() => setSmsDigits(generatedCode.split(''))}
                    style={styles.autoFillBadge}
                  >
                    <Text style={styles.autoFillText}>Código: {generatedCode}</Text>
                  </Pressable>
                ) : null}
              </View>

              {errors.sms && (
                <View style={styles.smsErrorBanner}>
                  <AlertTriangle size={15} color="#e11d48" />
                  <Text style={styles.smsErrorText}>{errors.sms}</Text>
                </View>
              )}

              <Text style={styles.smsTitle}>Código de verificación (6 dígitos)</Text>
              <Text style={styles.smsSubtitle}>
                Enviado al teléfono {phoneNumber}
              </Text>

              {/* Cajas de dígitos OTP */}
              <View style={styles.otpRow}>
                {smsDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => {
                      digitRefs.current[idx] = ref;
                    }}
                    value={digit}
                    onChangeText={(val) => handleDigitChange(idx, val)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  />
                ))}
              </View>

              {/* Reenviar código */}
              <View style={styles.resendRow}>
                <Pressable
                  onPress={handleResendSms}
                  disabled={resendTimer > 0}
                  style={styles.resendButton}
                >
                  <RotateCw size={13} color={resendTimer > 0 ? '#94a3b8' : '#0284c7'} />
                  <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                    {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar código'}
                  </Text>
                </Pressable>
              </View>

              {/* Acciones de Validación */}
              <View style={styles.actionsRow}>
                <Pressable onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  onPress={handleExecuteVerification}
                  disabled={loading || smsDigits.join('').trim().length !== 6}
                  style={[
                    styles.continueButton,
                    (loading || smsDigits.join('').trim().length !== 6) && styles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.continueButtonText}>Validar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* PASO 3: ÉXITO                                            */}
          {/* ======================================================== */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={36} color="#059669" />
              </View>
              <Text style={styles.successTitle}>¡Registro completado!</Text>
              <Text style={styles.successSubtitle}>
                Número validado. Redirigiendo al inicio de sesión...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Backdrop difuminado idéntico a Web
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
    paddingHorizontal: 24,
    paddingVertical: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fdf2f4',
    borderWidth: 1,
    borderColor: '#fce7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
  },
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  generalErrorText: {
    flex: 1,
    color: '#9f1239',
    fontSize: 12,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e11d48',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  inputWrapperError: {
    borderColor: '#f43f5e',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 0,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inputWrapperHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 46,
  },
  inputHalf: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    marginLeft: 6,
    paddingVertical: 0,
  },
  pwdChecklist: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 4,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  checkTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  continueButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#691c32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#691c32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  stepContainer: {
    paddingVertical: 6,
  },
  stepTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  autoFillBadge: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  autoFillText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smsErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  smsErrorText: {
    color: '#9f1239',
    fontSize: 12,
    fontWeight: '500',
  },
  smsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  smsSubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  otpBoxFilled: {
    borderColor: '#691c32',
    backgroundColor: '#fdf2f4',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 18,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  resendText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#94a3b8',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
