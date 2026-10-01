import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { syncOfflineOutboxApi } from '../api/chatApi';
import { soundEngine } from '../utils/audioEffects';

export type NetworkStatus = 'online' | 'unstable' | 'offline';
export type SimulationMode = 'auto' | 'online' | 'unstable' | 'offline';

export type NetworkConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown' | 'offline';

export interface NetworkTelemetry {
  status: NetworkStatus;
  statusLabel: string;
  statusDescription: string;
  color: 'green' | 'amber' | 'red';
  ping: number; // in milliseconds
  downlink: number; // in Mbps
  effectiveType: string; // '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'offline'
  connectionType: NetworkConnectionType; // 'wifi' | 'cellular' | 'ethernet' | etc.
  pendingOutboxCount: number;
  simulationMode: SimulationMode;
  lastSyncTime: string | null;
  syncNotification: { text: string; count: number; timestamp: number } | null;
}

interface NetworkContextType extends NetworkTelemetry {
  setSimulationMode: (mode: SimulationMode) => void;
  triggerManualSync: () => Promise<number>;
  clearSyncNotification: () => void;
  refreshOutboxCount: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simulation setting stored in localStorage
  const [simulationMode, setSimulationModeState] = useState<SimulationMode>(() => {
    const saved = localStorage.getItem('c5i_network_simulation');
    if (saved === 'online' || saved === 'unstable' || saved === 'offline') {
      return saved as SimulationMode;
    }
    return 'auto';
  });

  // Measured network state
  const [realIsOnline, setRealIsOnline] = useState<boolean>(() => navigator.onLine);
  const [ping, setPing] = useState<number>(38);
  const [downlink, setDownlink] = useState<number>(12.5);
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [connectionType, setConnectionType] = useState<NetworkConnectionType>(() => {
    if (!navigator.onLine) return 'offline';
    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (navConn?.type) {
      if (navConn.type === 'wifi') return 'wifi';
      if (navConn.type === 'cellular') return 'cellular';
      if (navConn.type === 'ethernet') return 'ethernet';
      if (navConn.type === 'bluetooth') return 'bluetooth';
    }
    return 'wifi';
  });

  // Outbox pending items count
  const [pendingOutboxCount, setPendingOutboxCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<{
    text: string;
    count: number;
    timestamp: number;
  } | null>(null);

  // Previous status tracker for transition detection
  const prevStatusRef = useRef<NetworkStatus>('online');

  // Refresh outbox items count
  const refreshOutboxCount = useCallback(() => {
    try {
      const outboxSaved = localStorage.getItem('c5i_offline_outbox');
      if (outboxSaved) {
        const parsed = JSON.parse(outboxSaved);
        setPendingOutboxCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setPendingOutboxCount(0);
      }
    } catch {
      setPendingOutboxCount(0);
    }
  }, []);

  // Update outbox count periodically and on window focus
  useEffect(() => {
    refreshOutboxCount();
    const interval = setInterval(refreshOutboxCount, 1500);
    window.addEventListener('focus', refreshOutboxCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshOutboxCount);
    };
  }, [refreshOutboxCount]);

  // Read Network Information API if available
  const updateNetworkInfo = useCallback(() => {
    if (!navigator.onLine) {
      setRealIsOnline(false);
      setConnectionType('offline');
      return;
    }

    setRealIsOnline(true);
    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (navConn) {
      if (navConn.type) {
        if (navConn.type === 'wifi') setConnectionType('wifi');
        else if (navConn.type === 'cellular') setConnectionType('cellular');
        else if (navConn.type === 'ethernet') setConnectionType('ethernet');
        else if (navConn.type === 'bluetooth') setConnectionType('bluetooth');
      } else if (navConn.effectiveType) {
        // En navegadores móviles modernos como Chrome en Android/iOS:
        // si effectiveType es '4g'/'3g'/'2g' y no reporta wifi, suele ser conexión celular/móvil
        if (navConn.effectiveType === '4g' || navConn.effectiveType === '3g' || navConn.effectiveType === '2g') {
          // Si está en dispositivo táctil móvil asumimos datos celulares si no es wifi
          const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          if (isMobileDevice) {
            setConnectionType('cellular');
          } else {
            setConnectionType('wifi');
          }
        }
      }

      if (navConn.effectiveType) {
        setEffectiveType(navConn.effectiveType);
      }
      if (navConn.rtt) {
        setPing(navConn.rtt);
      }
      if (navConn.downlink) {
        setDownlink(navConn.downlink);
      }
    } else {
      setConnectionType('wifi');
    }
  }, []);

  // Real-time ping latency check (heartbeat)
  const probeLatency = useCallback(async () => {
    if (!navigator.onLine) {
      setRealIsOnline(false);
      setPing(999);
      return;
    }

    const startTime = performance.now();
    try {
      // Lightweight cache-busted fetch to test real throughput/latency
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Probe current origin health or lightweight asset
      await fetch(`/?_probe=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const measured = Math.round(performance.now() - startTime);
      setRealIsOnline(true);
      setPing(Math.max(15, measured));
      updateNetworkInfo();
    } catch (err: any) {
      if (!navigator.onLine) {
        setRealIsOnline(false);
      } else {
        // High latency or timeout -> consider unstable
        setPing(420);
      }
    }
  }, [updateNetworkInfo]);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setRealIsOnline(true);
      probeLatency();
    };
    const handleOffline = () => {
      setRealIsOnline(false);
      setPing(999);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (navConn) {
      navConn.addEventListener('change', updateNetworkInfo);
    }

    // Run initial probe and periodic interval
    probeLatency();
    const interval = setInterval(probeLatency, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navConn) {
        navConn.removeEventListener('change', updateNetworkInfo);
      }
      clearInterval(interval);
    };
  }, [probeLatency, updateNetworkInfo]);

  // Compute calculated status based on real metrics or simulation
  const computedStatus: NetworkStatus = (() => {
    if (simulationMode === 'offline') return 'offline';
    if (simulationMode === 'unstable') return 'unstable';
    if (simulationMode === 'online') return 'online';

    // Automatic mode logic:
    if (!realIsOnline) return 'offline';

    // If ping is excessively high (>300ms) or connection type is slow 2g/3g
    if (ping > 320 || effectiveType === '2g' || effectiveType === 'slow-2g') {
      return 'unstable';
    }

    return 'online';
  })();

  // Synchronize pending messages function
  const triggerManualSync = useCallback(async (): Promise<number> => {
    try {
      const count = await syncOfflineOutboxApi();
      refreshOutboxCount();
      if (count > 0) {
        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeStr);
        setSyncNotification({
          text: `Red C5i activa: ${count} ${count === 1 ? 'mensaje transmitido' : 'mensajes transmitidos'} en automático.`,
          count,
          timestamp: Date.now(),
        });
        soundEngine.playReconnectedChirp();
      }
      return count;
    } catch (e) {
      console.warn('Sync error:', e);
      return 0;
    }
  }, [refreshOutboxCount]);

  // Auto-sync trigger when transitioning from offline/unstable to ONLINE
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = computedStatus;

    if (computedStatus === 'online' && (prevStatus === 'offline' || prevStatus === 'unstable')) {
      // Connection restored! Auto sync immediately
      triggerManualSync();
    } else if (computedStatus === 'offline' && prevStatus !== 'offline') {
      // Connection lost warning sound
      soundEngine.playConnectionLostWarning();
    }
  }, [computedStatus, triggerManualSync]);

  // Set simulation mode and persist
  const setSimulationMode = (mode: SimulationMode) => {
    setSimulationModeState(mode);
    if (mode === 'auto') {
      localStorage.removeItem('c5i_network_simulation');
      localStorage.removeItem('c5i_simulate_offline');
      probeLatency();
    } else {
      localStorage.setItem('c5i_network_simulation', mode);
      if (mode === 'offline') {
        localStorage.setItem('c5i_simulate_offline', 'true');
      } else {
        localStorage.removeItem('c5i_simulate_offline');
      }
    }
  };

  const clearSyncNotification = () => {
    setSyncNotification(null);
  };

  // Auto clear sync notification after 6 seconds
  useEffect(() => {
    if (syncNotification) {
      const timer = setTimeout(() => {
        setSyncNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [syncNotification]);

  // Labels and metadata for the current status
  const statusLabel = (() => {
    switch (computedStatus) {
      case 'online':
        if (connectionType === 'wifi') return 'Conectado (Wi-Fi)';
        if (connectionType === 'cellular') return 'Conectado (Datos Móviles)';
        if (connectionType === 'ethernet') return 'Conectado (Ethernet)';
        return 'Conectado';
      case 'unstable':
        return 'Señal Inestable';
      case 'offline':
        return pendingOutboxCount > 0 ? `Sin Red (${pendingOutboxCount} en cola)` : 'Sin Conexión';
    }
  })();

  const statusDescription = (() => {
    const connLabel = connectionType === 'wifi' ? 'Wi-Fi' : connectionType === 'cellular' ? 'Datos Móviles (4G/5G)' : 'Red C5i';
    switch (computedStatus) {
      case 'online':
        return `${connLabel} Estable • ${effectiveType.toUpperCase()} (${ping}ms, ${downlink} Mbps)`;
      case 'unstable':
        return `Conexión ${connLabel} Intermitente / Lenta (${ping}ms)`;
      case 'offline':
        return `Modo Offline • Encolado local activo (${pendingOutboxCount} mensajes)`;
    }
  })();

  const color: 'green' | 'amber' | 'red' = (() => {
    switch (computedStatus) {
      case 'online':
        return 'green';
      case 'unstable':
        return 'amber';
      case 'offline':
        return 'red';
    }
  })();

  return (
    <NetworkContext.Provider
      value={{
        status: computedStatus,
        statusLabel,
        statusDescription,
        color,
        ping: computedStatus === 'offline' ? 999 : ping,
        downlink: computedStatus === 'offline' ? 0 : downlink,
        effectiveType: computedStatus === 'offline' ? 'offline' : effectiveType,
        connectionType: computedStatus === 'offline' ? 'offline' : connectionType,
        pendingOutboxCount,
        simulationMode,
        lastSyncTime,
        syncNotification,
        setSimulationMode,
        triggerManualSync,
        clearSyncNotification,
        refreshOutboxCount,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
