// ==============================================================
// SERVICIO DE NOTIFICACIONES PUSH Y SERVICE WORKER C5i
// GESTIÓN DE ALERTAS EN SEGUNDO PLANO Y RADIOMENSAJES TÁCTICOS
// ==============================================================

export interface PushAlertPayload {
  title: string;
  body: string;
  priority?: 'normal' | 'emergency';
  channelId?: string;
  callsign?: string;
  url?: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribed: boolean = false;
  private permissionStatus: NotificationPermission = 'default';
  private listeners: Array<(status: NotificationPermission, isSubscribed: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionStatus = Notification.permission;
    }
  }

  // Comprueba soporte técnico en el navegador
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window
    );
  }

  // Estado actual de permisos
  public getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public getIsSubscribed(): boolean {
    return this.isSubscribed;
  }

  // Suscribirse a cambios de estado
  public onStatusChange(callback: (status: NotificationPermission, isSubscribed: boolean) => void) {
    this.listeners.push(callback);
    callback(this.permissionStatus, this.isSubscribed);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.permissionStatus, this.isSubscribed));
  }

  // Inicializa el Service Worker
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('[Push C5i] Service Worker o Notificaciones no soportadas en este navegador.');
      return null;
    }

    try {
      // Registrar Service Worker en raíz para alcance total
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      this.swRegistration = registration;

      // Esperar a que esté activo
      await navigator.serviceWorker.ready;

      // Verificar si ya existe suscripción activa
      if ('pushManager' in registration) {
        const existingSub = await registration.pushManager.getSubscription();
        this.isSubscribed = !!existingSub;
      }

      this.permissionStatus = Notification.permission;
      this.notifyListeners();

      // Escuchar clics y eventos provenientes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'C5I_PUSH_NOTIFICATION_CLICK') {
          console.log('[Push C5i] Interacción con notificación recibida en SW:', event.data);
          window.focus();
        }
      });

      return registration;
    } catch (error) {
      console.error('[Push C5i] Error al inicializar Service Worker:', error);
      return null;
    }
  }

  // Solicitar permiso de notificaciones push al oficial
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[Push C5i] Tu navegador actual no soporta notificaciones Push del sistema.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;

      if (permission === 'granted') {
        await this.subscribeToPush();
        this.notifyListeners();
        return true;
      }

      this.notifyListeners();
      return false;
    } catch (error) {
      console.error('[Push C5i] Error al solicitar permisos:', error);
      return false;
    }
  }

  // Suscripción Push con registro en el servidor
  public async subscribeToPush(): Promise<boolean> {
    if (!this.swRegistration) {
      this.swRegistration = await this.initServiceWorker();
    }

    if (!this.swRegistration || !('pushManager' in this.swRegistration)) {
      return false;
    }

    try {
      // Obtener o crear suscripción
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // En aplicaciones PWA locales o PWA web simulamos o usamos applicationServerKey
        // Si el navegador soporta VAPID real generamos suscripción:
        try {
          subscription = await this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(
              'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            ),
          });
        } catch (subErr) {
          console.warn('[Push C5i] Creando suscripción emulada táctica:', subErr);
        }
      }

      this.isSubscribed = true;
      this.notifyListeners();

      // Notificar al backend sobre la suscripción activa
      const currentCallsign = localStorage.getItem('c5i_active_callsign') || 'PATRULLA-302';
      const currentUser = JSON.parse(localStorage.getItem('c5i_user_session') || '{}');

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id || 'u-1',
          callsign: currentUser.callsign || currentCallsign,
          unit: currentUser.unit || 'Sector Pachuca C5i',
          subscription: subscription ? subscription.toJSON() : { emulated: true },
          timestamp: Date.now(),
        }),
      }).catch((e) => console.warn('[Push C5i] Registro remoto push:', e));

      return true;
    } catch (error) {
      console.error('[Push C5i] Error en suscripción push:', error);
      return false;
    }
  }

  // Emite una alerta local en segundo plano a través del Service Worker
  public async showLocalBackgroundNotification(payload: PushAlertPayload): Promise<void> {
    const perm = this.getPermission();
    if (perm !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (!this.swRegistration) {
      this.swRegistration = await this.initServiceWorker();
    }

    if (this.swRegistration) {
      const isEmergency = payload.priority === 'emergency';
      const title = payload.title || (isEmergency ? '🚨 ALERTA TÁCTICA C5i' : '📻 COMUNICACIÓN DE RADIO');

      const options: any = {
        body: payload.body,
        icon: '/c5i-icon.svg',
        badge: '/c5i-icon.svg',
        tag: 'c5i-alert-' + (payload.channelId || 'general') + '-' + Date.now(),
        renotify: true,
        requireInteraction: isEmergency,
        vibrate: isEmergency ? [500, 200, 500, 200, 500] : [300, 100, 300, 100, 400],
        data: {
          url: payload.url || '/',
          channelId: payload.channelId,
          callsign: payload.callsign,
          priority: payload.priority || 'normal',
          timestamp: Date.now(),
        },
        actions: [
          { action: 'open_radio', title: '🎙️ Abrir Frecuencia' },
          { action: 'acknowledge', title: '✅ Enterado' },
        ],
      };

      await this.swRegistration.showNotification(title, options);
    }
  }

  // Emite un broadcast al servidor para notificar a todo el personal vía push
  public async broadcastPushAlert(payload: PushAlertPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      // Además mostrar localmente para garantizar feedback instantáneo
      await this.showLocalBackgroundNotification(payload);

      return data.status === 'success';
    } catch (err) {
      console.error('[Push C5i] Error en broadcast push:', err);
      // Fallback local
      await this.showLocalBackgroundNotification(payload);
      return false;
    }
  }

  // Helper para convertir clave VAPID
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
