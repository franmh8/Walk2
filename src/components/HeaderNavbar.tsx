import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  AlertTriangle,
  Server,
  LogOut,
  Shield,
  Circle,
  RadioTower,
  MessageSquare,
  MoreVertical,
  X,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Database,
  Bell,
  BellRing,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRadio } from '../context/RadioContext';
import { pushNotificationService } from '../services/pushNotificationService';
import { PushNotificationModal } from './PushNotificationModal';
import { ExpoProjectModal } from './ExpoProjectModal';
import { ThemeToggle } from './ThemeToggle';
import { C5iLogo } from './C5iLogo';

interface HeaderNavbarProps {
  onOpenSosModal: () => void;
  onOpenApiSettings: () => void;
  activeView: 'radio' | 'chat';
  setActiveView: (view: 'radio' | 'chat') => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenSosModal,
  onOpenApiSettings,
  activeView,
  setActiveView,
}) => {
  const { user, logout } = useAuth();
  const {
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isTransmitting,
    isReceiving,
    simulateIncomingTransmission,
  } = useRadio();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showExpoModal, setShowExpoModal] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicializar Service Worker de forma transparente al montar
    pushNotificationService.initServiceWorker();
    setPushPermission(pushNotificationService.getPermission());

    const unsubscribe = pushNotificationService.onStatusChange((status) => {
      setPushPermission(status);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-MX', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-14 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 sm:px-5 flex items-center justify-between gap-2 shadow-sm dark:shadow-lg backdrop-blur-md select-none relative z-30 transition-colors duration-200">
      {/* Brand: Compact & Minimalist */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center justify-center shrink-0">
          <C5iLogo className="w-10 h-9 drop-shadow-sm" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-xs sm:text-sm truncate">
              C5i Walkiet
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden xs:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400">{currentTime || '00:00'} CST</span>
          </div>
        </div>
      </div>

      {/* Center View Selector: Sleek iOS / Tactical Segmented Pills */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 p-0.5 sm:p-1 rounded-xl shadow-inner">
        <button
          id="tab-view-radio"
          type="button"
          onClick={() => setActiveView('radio')}
          className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'radio'
              ? 'bg-[#691c32] text-white shadow-md shadow-[#691c32]/30 scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>PTT</span>
        </button>

        <button
          id="tab-view-chat"
          type="button"
          onClick={() => setActiveView('chat')}
          className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'chat'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
      </div>

      {/* Right side: Security Badge + SOS button + Theme Toggle + Minimalist Menu Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Tactical Security Shield Badge */}
        <button
          type="button"
          onClick={() => setShowSecurityModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400/50 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] sm:text-xs transition-all cursor-pointer shadow-sm"
          title="Ver auditoría de seguridad y cifrado táctico C5i"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">AES-256 E2EE</span>
        </button>

        {/* SOS Emergency Button: Compact on mobile */}
        <button
          id="btn-sos-trigger"
          type="button"
          onClick={onOpenSosModal}
          className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 active:from-rose-800 text-white font-mono font-bold text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-rose-500/40 shadow-md shadow-rose-950/50 flex items-center gap-1 cursor-pointer animate-pulse shrink-0"
          title="Botón de Pánico 10-33 Código Rojo"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>

        {/* Push Notification & Service Worker Toggle */}
        <button
          id="btn-header-push-toggle"
          type="button"
          onClick={() => setShowPushModal(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border font-mono text-[11px] sm:text-xs transition-all cursor-pointer ${
            pushPermission === 'granted'
              ? 'bg-slate-100 dark:bg-slate-950/70 hover:bg-slate-200 dark:hover:bg-slate-800 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 shadow-sm'
              : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
          }`}
          title="Notificaciones Push & Service Worker C5i (Segundo Plano)"
        >
          {pushPermission === 'granted' ? (
            <BellRing className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          )}
          <span className="hidden md:inline font-semibold">Push C5i</span>
        </button>

        {/* Theme Toggle (System / Light / Dark) */}
        <ThemeToggle variant="dropdown" />

        {/* Tactical User & Tools Menu Toggle */}
        <div className="relative" ref={menuRef}>
          <button
            id="btn-header-menu-toggle"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg border transition-all cursor-pointer ${
              isMenuOpen
                ? 'bg-slate-200 dark:bg-slate-800 border-sky-500/50 text-slate-900 dark:text-white'
                : 'bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            title="Opciones, volumen y perfil"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.name || 'Usuario'}
                className="w-6 h-6 rounded-md object-cover border border-slate-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                {(user?.name || user?.callsign || 'U').charAt(0)}
              </div>
            )}
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>

          {/* Minimalist Dropdown Sheet / Popover */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-3 text-slate-800 dark:text-slate-200">
              {/* User Profile Overview */}
              {user && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-sm">
                    {(user?.name || user?.callsign || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name || user.callsign || 'Usuario C5i'}</div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono flex items-center gap-1">
                      <span>{user.callsign || 'OFICIAL-C5i'}</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">En línea</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Slider Control */}
              <div className="p-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Volumen Altavoz</span>
                  <span className="text-sky-600 dark:text-sky-400">{isMuted ? 'Silenciado' : `${Math.round(volume * 100)}%`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-dropdown-mute"
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    )}
                  </button>
                  <input
                    id="slider-dropdown-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      if (isMuted) setIsMuted(false);
                      setVolume(parseFloat(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              {/* Quick Actions List */}
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowSecurityModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Escudo C5i (Seguridad Táctica)</span>
                </button>

                <button
                  id="btn-dropdown-simulate-audio"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    simulateIncomingTransmission();
                  }}
                  disabled={isTransmitting || isReceiving}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  <RadioTower className="w-4 h-4 text-sky-400" />
                  <span>Simular Audio Entrante</span>
                </button>

                <button
                  id="btn-dropdown-api-settings"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenApiSettings();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Servidor PHP & BD MySQL</span>
                </button>

                <button
                  id="btn-dropdown-push-settings"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowPushModal(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-sky-400 hover:text-sky-300 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <BellRing className="w-4 h-4 text-sky-400" />
                    <span>Notificaciones Push C5i</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono">
                    {pushPermission === 'granted' ? 'Activo' : 'Permiso'}
                  </span>
                </button>

                <button
                  id="btn-dropdown-expo-project"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowExpoModal(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#691c32]/30 text-[#eb527c] hover:text-[#f47298] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-[#eb527c]" />
                    <span>App React Native / Expo Go</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#691c32]/50 text-white font-mono">
                    iOS/Android
                  </span>
                </button>

                <div className="h-[1px] bg-slate-800 my-1" />

                <button
                  id="btn-dropdown-logout"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-rose-950/40 text-rose-400 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tactical Security Audit Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0b1424] border border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Blindaje de Seguridad C5i</h3>
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cifrado Militar & Backend Blindado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 1. Tránsito */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <Lock className="w-4 h-4" />
                  <span>1. Cifrado en el Tránsito (Transport Layer)</span>
                </div>
                <div className="text-slate-300 space-y-1 font-mono text-[11px] pl-6">
                  <div>• Protocolo: <strong className="text-emerald-400">HTTPS / TLS 1.3 Estricto Forzado</strong></div>
                  <div>• Certificados: <strong className="text-emerald-400">SSL/TLS Validados (CA Oficial / Let’s Encrypt)</strong></div>
                  <div>• Redirección: <strong className="text-emerald-400">HTTP → HTTPS (301 Permanent + CSP upgrade)</strong></div>
                  <div>• Cabeceras: <strong className="text-emerald-400">HSTS (max-age 2 años, includeSubDomains, preload)</strong></div>
                  <div>• Mitigación: <strong className="text-slate-300">X-Content-Type-Options: nosniff + SAMEORIGIN</strong></div>
                </div>
              </div>

              {/* 2. Ingreso */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                  <span>2. Seguridad en el Ingreso (Autenticación)</span>
                </div>
                <div className="text-slate-300 space-y-1 font-mono text-[11px] pl-6">
                  <div>• Hashing de Claves: <strong className="text-emerald-400">PBKDF2-SHA512 (100k rondas) + Salt 256-bit</strong></div>
                  <div>• Anti-Fuerza Bruta: <strong className="text-emerald-400">Rate Limiter (Bloqueo a 5 fallos / 15 min)</strong></div>
                  <div>• Tokens: <strong className="text-emerald-400">JWT Tácticos HMAC-SHA256 con turno operacional</strong></div>
                  <div>• Comparación: <strong className="text-emerald-400">timingSafeEqual (sin filtración de tiempo)</strong></div>
                </div>
              </div>

              {/* 3. Comunicaciones */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-400">
                  <Fingerprint className="w-4 h-4" />
                  <span>3. Cifrado E2EE en Comunicaciones (PTT y Chat)</span>
                </div>
                <div className="text-slate-300 space-y-1 font-mono text-[11px] pl-6">
                  <div>• Cifrado Simétrico: <strong className="text-emerald-400">AES-256-GCM (128-bit Auth Tag)</strong></div>
                  <div>• Integridad: <strong className="text-emerald-400">Firma HMAC-SHA256 por ráfaga</strong></div>
                  <div>• Anti-Repetición: <strong className="text-emerald-400">Ventana temporal 15s + Nonce único</strong></div>
                </div>
              </div>

              {/* 4. Base de Datos Blindada */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Database className="w-4 h-4" />
                  <span>4. Base de Datos Blindada (walkiet_db MySQL / MariaDB)</span>
                </div>
                <div className="text-slate-300 space-y-1 font-mono text-[11px] pl-6">
                  <div>• Motor y Reposo: <strong className="text-emerald-400">InnoDB TDE (Transparent Data Encryption)</strong></div>
                  <div>• Salteo Criptográfico: <strong className="text-emerald-400">Salt individual 256-bit por usuario</strong></div>
                  <div>• Anti-Inyección SQL: <strong className="text-emerald-400">Prepared Statements forzados (PDO)</strong></div>
                  <div>• Auditoría Forense: <strong className="text-emerald-400">security_audit_log inmutable</strong></div>
                  <div>• Caché Anti-Replay: <strong className="text-emerald-400">anti_replay_nonces (ENGINE=MEMORY)</strong></div>
                </div>
              </div>

              {/* 5. Notificaciones Push en Segundo Plano */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <BellRing className="w-4 h-4" />
                  <span>5. Notificaciones Push & Alertas en Segundo Plano</span>
                </div>
                <div className="text-slate-300 space-y-1 font-mono text-[11px] pl-6">
                  <div>• Motor de Ejecución: <strong className="text-emerald-400">Service Worker (sw.js) en hilo aislado</strong></div>
                  <div>• Alertas en Bloqueo: <strong className="text-emerald-400">Vibración táctica + requireInteraction</strong></div>
                  <div>• Acciones Rápidas: <strong className="text-emerald-400">Abrir Radio / Enterado</strong></div>
                  <div>• Despacho Central: <strong className="text-emerald-400">Broadcast Push multi-unidad vía backend</strong></div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Entendido, Blindaje Activo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification & Service Worker Modal */}
      <PushNotificationModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        currentCallsign={user?.callsign}
      />

      {/* Expo / React Native Project Modal */}
      <ExpoProjectModal
        isOpen={showExpoModal}
        onClose={() => setShowExpoModal(false)}
      />
    </header>
  );
};
