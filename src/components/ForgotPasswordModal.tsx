import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  findUserByIdentifier,
  generateSecurityToken,
  verifySecurityToken,
  resetUserPasswordInDb,
} from '../api/authApi';
import { User } from '../types';
import {
  evaluatePassword,
  isPasswordStrong,
  PasswordStrengthChecklist,
} from './PasswordStrengthChecklist';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (identifier: string, message: string) => void;
}

type RecoveryStep = 'identify' | 'token' | 'new_password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<RecoveryStep>('identify');
  const [identifier, setIdentifier] = useState('');
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  // Token state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState(['', '', '', '', '', '']);
  const tokenRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // New Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('identify');
      setIdentifier('');
      setMatchedUser(null);
      setGeneratedCode(null);
      setTokenInput(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  // STEP 1: Search user in DB & send Token
  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = identifier.trim();
    if (!clean) {
      setErrorMessage('Ingresa tu teléfono o correo.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = findUserByIdentifier(clean);
      setLoading(false);

      if (!user) {
        setErrorMessage('Usuario no registrado.');
        return;
      }

      setMatchedUser(user);
      const isEmail = clean.includes('@');
      const destination = isEmail ? user.correo || clean : user.phone_number;

      const { token } = generateSecurityToken(destination, 'password_reset');
      setGeneratedCode(token);
      setResendCooldown(30);

      setStep('token');
    }, 300);
  };

  // Handle Token input changes
  const handleTokenDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newArr = [...tokenInput];
    newArr[index] = clean;
    setTokenInput(newArr);

    if (clean && index < 5) {
      tokenRefs.current[index + 1]?.focus();
    }
  };

  const handleTokenKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !tokenInput[index] && index > 0) {
      tokenRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteToken = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newArr = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newArr[i] = pasted[i];
      }
      setTokenInput(newArr);
      const nextFocus = Math.min(5, pasted.length);
      tokenRefs.current[nextFocus]?.focus();
    }
  };

  const handleAutoFillToken = () => {
    if (generatedCode) {
      const digits = generatedCode.split('');
      setTokenInput(digits);
      setErrorMessage(null);
    }
  };

  const handleResendToken = () => {
    if (resendCooldown > 0 || !matchedUser) return;
    setErrorMessage(null);

    const isEmail = identifier.includes('@');
    const destination = isEmail ? matchedUser.correo || identifier : matchedUser.phone_number;
    const { token } = generateSecurityToken(destination, 'password_reset');

    setGeneratedCode(token);
    setResendCooldown(30);
  };

  // STEP 2: Verify Token
  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = tokenInput.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMessage('Ingresa el código de 6 dígitos.');
      return;
    }

    if (!matchedUser) {
      setStep('identify');
      return;
    }

    const isEmail = identifier.includes('@');
    const destination = isEmail ? matchedUser.correo || identifier : matchedUser.phone_number;

    const result = verifySecurityToken(destination, fullCode, 'password_reset');
    if (!result.valid) {
      setErrorMessage(result.message);
      return;
    }

    setStep('new_password');
  };

  // STEP 3: Submit New Password
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMessage('Ingresa la nueva contraseña.');
      return;
    }

    const pwdCriteria = evaluatePassword(cleanPass, cleanConfirm);
    if (!isPasswordStrong(pwdCriteria)) {
      setErrorMessage('La contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }

    if (!pwdCriteria.matchesConfirm) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const result = await resetUserPasswordInDb(matchedUser?.phone_number || identifier, cleanPass);
    setLoading(false);

    if (result.success) {
      setStep('success');
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md select-none animate-fadeIn transition-colors duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#111726]/95 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative z-10 animate-scaleUp text-slate-800 dark:text-slate-100 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#691c32]/10 border border-[#691c32]/25 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Recuperar Contraseña
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Error */}
        {errorMessage && (
          <div className="mb-4 p-2.5 bg-rose-50 dark:bg-[#2a0e17]/95 border border-rose-200 dark:border-rose-900/70 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="flex-1 leading-tight text-xs">{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: IDENTIFY USER */}
        {/* ========================================================= */}
        {step === 'identify' && (
          <form onSubmit={handleIdentifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Teléfono o Correo
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                  {identifier.includes('@') ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </div>
                <input
                  id="input-recovery-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ingresa tu teléfono o correo"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700/70 focus:border-[#8a1a36] dark:focus:border-[#a62846] focus:ring-1 focus:ring-[#8a1a36]/25 dark:focus:ring-[#a62846]/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all font-sans"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-search-user-recovery"
                type="submit"
                disabled={loading || !identifier.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] hover:via-[#9f2241] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-[#691c32]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Continuar</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: ENTER & VERIFY 6-DIGIT TOKEN */}
        {/* ========================================================= */}
        {step === 'token' && (
          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('identify')}
                className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              {generatedCode && (
                <button
                  type="button"
                  onClick={handleAutoFillToken}
                  className="text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Código: {generatedCode}
                </button>
              )}
            </div>

            <div className="text-center">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
                Código de verificación (6 dígitos)
              </label>

              {/* 6 Digit Inputs */}
              <div
                className="flex items-center justify-center gap-2 my-2"
                onPaste={handlePasteToken}
              >
                {tokenInput.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (tokenRefs.current[idx] = el)}
                    id={`input-token-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTokenDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleTokenKeyDown(idx, e)}
                    className="w-10 h-12 bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-white font-mono font-bold text-center text-lg rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500/30 dark:focus:ring-sky-400/30 transition-all"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleResendToken}
                disabled={resendCooldown > 0}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:text-slate-300 dark:disabled:text-slate-600 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <RotateCw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                </span>
              </button>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-token-recovery"
                type="submit"
                disabled={tokenInput.join('').trim().length !== 6}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] hover:via-[#9f2241] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-[#691c32]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Validar</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SET NEW PASSWORD */}
        {/* ========================================================= */}
        {step === 'new_password' && (
          <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="input-new-password"
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-sky-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="input-confirm-new-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Repite la contraseña"
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-sky-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist de Requisitos de Contraseña en Vivo */}
            {(newPassword.length > 0 || confirmPassword.length > 0) && (
              <div className="animate-fadeIn">
                <PasswordStrengthChecklist
                  criteria={evaluatePassword(newPassword, confirmPassword)}
                  showConfirmCheck={true}
                  hasTypedConfirm={confirmPassword.length > 0}
                />
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-save-new-password"
                type="submit"
                disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] hover:via-[#9f2241] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-[#691c32]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 4: SUCCESS CONFIRMATION */}
        {/* ========================================================= */}
        {step === 'success' && (
          <div className="text-center py-2 space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Contraseña actualizada</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>

            <button
              id="btn-finish-recovery-to-login"
              type="button"
              onClick={() => {
                onSuccess(
                  matchedUser?.phone_number || identifier,
                  'Contraseña actualizada con éxito. Puedes iniciar sesión.'
                );
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] hover:via-[#9f2241] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#691c32]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
