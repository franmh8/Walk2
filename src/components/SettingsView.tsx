import React, { useState } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Bell,
  Mic,
  Volume2,
  Vibrate,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

interface SettingsViewProps {
  onBack: () => void;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
}> = ({ checked, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { themeMode, setThemeMode } = useTheme();
  const {
    settings,
    updateSetting,
    resetToDefaults,
    testSound,
    testPushNotification,
    requestPushPermission,
    hasPushPermission,
  } = useSettings();

  const [notificationTesting, setNotificationTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTestNotification = async () => {
    setNotificationTesting(true);
    try {
      await testPushNotification();
      showToast('Notificación enviada con éxito');
    } catch {
      showToast('No se pudo enviar la notificación');
    } finally {
      setNotificationTesting(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    if (res === 'granted') {
      showToast('Permiso de notificaciones concedido');
    } else {
      showToast('Permiso denegado en el navegador');
    }
  };

  const handleReset = () => {
    resetToDefaults();
    showToast('Ajustes restablecidos');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#070c16] text-slate-900 dark:text-slate-100 min-h-0 relative select-none overflow-y-auto transition-colors duration-200">
      
      {/* Toast de confirmación flotante */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-sky-600 text-white text-xs font-semibold shadow-xl shadow-sky-950/40 animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra Superior con botón Volver */}
      <div className="p-4 sm:p-5 md:p-6 flex items-center justify-between shrink-0 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto w-full border-b border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
            Configuración
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ajustes esenciales de la aplicación
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-medium transition-colors cursor-pointer"
          title="Restablecer valores predeterminados"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Restablecer</span>
        </button>
      </div>

      {/* Contenido Principal con las configuraciones esenciales */}
      <div className="flex-1 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto w-full px-4 sm:px-6 pt-5 pb-16 flex flex-col gap-5">
        
        {/* 1. SECCIÓN: TEMA VISUAL */}
        <div className="bg-white dark:bg-[#101826] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold tracking-tight">Tema de la Aplicación</h2>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Claro */}
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-500'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs font-semibold">Claro</span>
            </button>

            {/* Oscuro */}
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-500'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs font-semibold">Oscuro</span>
            </button>

            {/* Sistema */}
            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-500'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs font-semibold">Sistema</span>
            </button>
          </div>
        </div>

        {/* 2. SECCIÓN: NOTIFICACIONES */}
        <div className="bg-white dark:bg-[#101826] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Bell className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-bold tracking-tight">Notificaciones</h2>
            </div>
            
            {!hasPushPermission && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Permitir en navegador
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Notificaciones Push */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Notificaciones en segundo plano
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recibir alertas y mensajes aún con la app minimizada
                </span>
              </div>
              <div className="flex items-center gap-2">
                {settings.pushNotifications && (
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={notificationTesting}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    title="Probar notificación"
                  >
                    <Play className="w-3 h-3" />
                    <span className="hidden sm:inline">Probar</span>
                  </button>
                )}
                <ToggleSwitch
                  id="toggle-push"
                  checked={settings.pushNotifications}
                  onChange={(val) => updateSetting('pushNotifications', val)}
                />
              </div>
            </div>

            {/* Sonidos de Mensajes */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Sonidos de Mensajes
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aviso sonoro al recibir un nuevo mensaje en el canal
                </span>
              </div>
              <ToggleSwitch
                id="toggle-msg-sounds"
                checked={settings.channelMessageSounds}
                onChange={(val) => updateSetting('channelMessageSounds', val)}
              />
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN: COMPORTAMIENTO RADIO PTT */}
        <div className="bg-white dark:bg-[#101826] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Mic className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold tracking-tight">Comportamiento Radio PTT</h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Modo PTT */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Modo de activación del botón PTT
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.pttMode === 'hold'
                    ? 'Mantén presionado el botón central para hablar'
                    : 'Un toque para hablar, otro toque para cortar'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => updateSetting('pttMode', 'hold')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    settings.pttMode === 'hold'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mantener
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('pttMode', 'toggle')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    settings.pttMode === 'toggle'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Alternar
                </button>
              </div>
            </div>

            {/* Roger Beep */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Tono Roger Beep
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pitido de radio característico al terminar tu transmisión
                </span>
              </div>
              <div className="flex items-center gap-2">
                {settings.rogerBeep && (
                  <button
                    type="button"
                    onClick={() => testSound('roger')}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    title="Escuchar tono"
                  >
                    <Volume2 className="w-3 h-3 text-sky-500" />
                    <span className="hidden sm:inline">Escuchar</span>
                  </button>
                )}
                <ToggleSwitch
                  id="toggle-roger"
                  checked={settings.rogerBeep}
                  onChange={(val) => updateSetting('rogerBeep', val)}
                />
              </div>
            </div>

            {/* Vibración táctil */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 block">
                  Vibración háptica
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Respuesta táctil al pulsar y soltar el botón de radio
                </span>
              </div>
              <ToggleSwitch
                id="toggle-vibration"
                checked={settings.vibrationOnPtt}
                onChange={(val) => updateSetting('vibrationOnPtt', val)}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
