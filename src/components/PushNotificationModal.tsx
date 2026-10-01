import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  BellOff,
  ShieldAlert,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Smartphone,
} from 'lucide-react';
import { pushNotificationService } from '../services/pushNotificationService';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCallsign?: string;
  activeChannelName?: string;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  currentCallsign = 'PATRULLA-302',
  activeChannelName = 'Canal General C5i',
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(pushNotificationService.getPermission());
      setIsSubscribed(pushNotificationService.getIsSubscribed());
      pushNotificationService.initServiceWorker();
    }

    const unsubscribe = pushNotificationService.onStatusChange((status, sub) => {
      setPermission(status);
      setIsSubscribed(sub);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Countdown timer for delayed background test
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      // Trigger background alert
      pushNotificationService.showLocalBackgroundNotification({
        title: '🚨 ALERTA DE SEGUNDO PLANO C5i',
        body: `Notificación táctica prioritaria recibida en segundo plano para ${currentCallsign}.`,
        priority: 'emergency',
        callsign: currentCallsign,
      });
      setActionMessage('¡Notificación enviada a través del Service Worker!');
      setIsTesting(false);
    }

    return () => clearTimeout(timer);
  }, [countdown, currentCallsign]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await pushNotificationService.requestPermission();
    setPermission(pushNotificationService.getPermission());
    if (granted) {
      setActionMessage('Permiso concedido. Notificaciones Push y Service Worker activos.');
    } else {
      setActionMessage('Permiso denegado por el navegador.');
    }
  };

  const handleImmediateTest = async (type: 'normal' | 'emergency') => {
    setIsTesting(true);
    setActionMessage(null);

    const isEmergency = type === 'emergency';
    const payload = {
      title: isEmergency ? '🚨 CÓDIGO ROJO • ALERTA C5i' : `📻 RÁFAGA PTT EN ${activeChannelName.toUpperCase()}`,
      body: isEmergency
        ? `¡Prioridad táctica inmediata! Incidente crítico reportado por ${currentCallsign}. Atienda de inmediato.`
        : `Unidad ${currentCallsign} transmitiendo audio en vivo en frecuencia asignada.`,
      priority: type,
      callsign: currentCallsign,
      channelId: 'c-1',
    };

    await pushNotificationService.broadcastPushAlert(payload);

    setIsTesting(false);
    setActionMessage(
      isEmergency
        ? 'Alerta de Código Rojo emitida al Service Worker y a la central.'
        : 'Notificación de radio PTT enviada exitosamente.'
    );
  };

  const handleDelayedBackgroundTest = () => {
    setActionMessage('Minimiza esta ventana o cambia de pestaña. La alerta sonará en 5 segundos...');
    setIsTesting(true);
    setCountdown(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn transition-colors duration-200">
      <div className="bg-white dark:bg-[#0b1321] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col p-6 space-y-5 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Notificaciones Push & Service Worker C5i
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alertas operativas garantizadas incluso con la app en segundo plano
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">ESTADO DEL SERVICE WORKER:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">sw.js Registrado</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">PERMISO DE NOTIFICACIÓN:</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                permission === 'granted'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                  : permission === 'denied'
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
              }`}
            >
              {permission === 'granted'
                ? 'AUTORIZADO'
                : permission === 'denied'
                ? 'BLOQUEADO'
                : 'PENDIENTE DE PERMISO'}
            </span>
          </div>

          {permission !== 'granted' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Activar Notificaciones Push Ahora</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Status Feedback */}
        {actionMessage && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-500/40 rounded-xl text-sky-800 dark:text-sky-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 text-[11px] leading-relaxed">{actionMessage}</div>
          </div>
        )}

        {/* Test Controls */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Pruebas de Notificación Táctica en Segundo Plano</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Delayed Background Test */}
            <button
              type="button"
              disabled={isTesting}
              onClick={handleDelayedBackgroundTest}
              className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                  Prueba Segundo Plano
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {countdown !== null
                  ? `Minimiza ahora: enviando en ${countdown}s...`
                  : 'Dispara alerta con 5 segundos de retraso para probar con app minimizada.'}
              </p>
            </button>

            {/* Emergency Code Red Push */}
            <button
              type="button"
              disabled={isTesting}
              onClick={() => handleImmediateTest('emergency')}
              className="p-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700 rounded-2xl text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                  🚨 Alerta Código Rojo
                </span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Notificación prioritaria con patrón de vibración continuo y sonido de emergencia.
              </p>
            </button>
          </div>

          {/* Normal Radio Push */}
          <button
            type="button"
            disabled={isTesting}
            onClick={() => handleImmediateTest('normal')}
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Notificación Push de Ráfaga PTT
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Simula la recepción de transmisión de voz en frecuencia táctica
                </div>
              </div>
            </div>
            <Send className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Architecture details */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Las alertas son procesadas por el <strong>Service Worker (sw.js)</strong> en el hilo independiente del navegador. Al pulsar sobre la notificación emergente, el sistema enfoca automáticamente la consola del radio y sintoniza el canal del incidente.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
