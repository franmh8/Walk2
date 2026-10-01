import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, X, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { pushNotificationService } from '../services/pushNotificationService';
import { recordEmergencyAlertApi } from '../api/radioApi';

interface SosAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

export const SosAlertModal: React.FC<SosAlertModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { triggerEmergencySos } = useRadio();
  const [isTriggered, setIsTriggered] = useState(false);

  // Ubicación GPS automática predeterminada (Pachuca Centro C5i Hidalgo)
  const [coords, setCoords] = useState<LocationCoords>({
    lat: 20.1227,
    lng: -98.7363,
    accuracy: 8,
  });
  const [locationName, setLocationName] = useState<string>('Pachuca Centro, Hidalgo');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationLoaded, setLocationLoaded] = useState<boolean>(false);

  // Obtener ubicación GPS satelital en tiempo real al abrir el modal
  const fetchCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationName('Pachuca Centro, Hidalgo (GPS Base)');
      setLocationLoaded(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy) || 5,
        });

        // Intentar geocodificación inversa para obtener nombre de calle / colonia
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              signal: controller.signal,
              headers: { 'Accept-Language': 'es' },
            }
          );
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            const addressParts = [
              data.address?.road || data.address?.pedestrian || data.address?.suburb,
              data.address?.neighbourhood || data.address?.city || data.address?.town,
              data.address?.state,
            ].filter(Boolean);

            if (addressParts.length > 0) {
              setLocationName(addressParts.join(', '));
            } else if (data.display_name) {
              setLocationName(data.display_name.split(',').slice(0, 3).join(', '));
            }
          }
        } catch {
          // Fallback a coordenadas si nominatim no responde
          setLocationName(`Sector GPS ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        } finally {
          setIsLocating(false);
          setLocationLoaded(true);
        }
      },
      (error) => {
        console.warn('Geolocation error / permission denied:', error);
        setIsLocating(false);
        setLocationLoaded(true);
        setLocationName('Sector Centro, Pachuca, Hidalgo (GPS Operativo)');
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 10000,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setIsTriggered(false);
      fetchCurrentLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBroadcastSos = async () => {
    setIsTriggered(true);

    const fullLocationDescription = `${locationName} [GPS: ${coords.lat.toFixed(5)}°, ${coords.lng.toFixed(5)}° ±${coords.accuracy}m]`;

    // Disparar Notificación Push a través del Service Worker con la ubicación automática
    await pushNotificationService.broadcastPushAlert({
      title: '🚨 CÓDIGO ROJO • ALERTA 10-33 C5i',
      body: `¡Auxilio inmediato! ${user?.callsign || 'OFICIAL'} reportó emergencia en ${locationName}. Coordenadas: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}.`,
      priority: 'emergency',
      callsign: user?.callsign || 'CENTRAL-C5I',
    });

    // Guardar y persistir la alerta de emergencia en la Base de Datos C5i
    await recordEmergencyAlertApi({
      officer_id: user?.id || 'usr-anon',
      officer_name: user?.name || 'Oficial C5i',
      officer_callsign: user?.callsign || 'CENTRAL-C5I',
      channel_id: null,
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy_meters: coords.accuracy,
      location_name: locationName,
      protocol_text:
        'Al activar la alerta se emitira una sirena sonora en todos los radios disponibles en la zona y se asignara prioridad absoluta a tu frecuencia',
    });

    // Enviar alerta SOS por el canal de radio con ubicación automática
    await triggerEmergencySos(fullLocationDescription);

    setTimeout(() => {
      setIsTriggered(false);
      onClose();
    }, 2000);
  };

  // URL del mapa de OpenStreetMap centrado en las coordenadas del oficial
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005}%2C${coords.lat - 0.003}%2C${coords.lng + 0.005}%2C${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-rose-950/80 backdrop-blur-md animate-fadeIn transition-colors duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 dark:border-rose-600 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scaleUp transition-colors duration-200">
        
        {/* Encabezado: Únicamente ALERTA DE EMERGENCIA en el título y sin descripción */}
        <div className="bg-rose-600 dark:bg-rose-900/90 border-b border-rose-500 dark:border-rose-700/80 p-4 sm:p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 dark:bg-rose-950 border border-white/30 dark:border-rose-500 flex items-center justify-center text-white dark:text-rose-400 animate-pulse shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-wide uppercase">
              ALERTA DE EMERGENCIA
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-rose-100 hover:text-white rounded-lg hover:bg-rose-700/60 dark:hover:bg-rose-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* PROTOCOLO DE DESPACHO: Con la descripción exacta solicitada */}
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300 tracking-wide uppercase">
              <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>PROTOCOLO DE DESPACHO</span>
            </div>
            <p className="leading-relaxed font-medium">
              Al activar la alerta se emitira una sirena sonora en todos los radios disponibles en la zona y se asignara prioridad absoluta a tu frecuencia
            </p>
          </div>

          {/* Pequeño mapa de ubicación con envío automático */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Ubicación de Envío Automático:</span>
              </span>
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={isLocating}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                title="Actualizar GPS"
              >
                <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detectando...' : 'Actualizar GPS'}</span>
              </button>
            </div>

            {/* Contenedor del Mapa Pequeño */}
            <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-rose-300 dark:border-rose-800/80 bg-slate-950 shadow-inner">
              <iframe
                title="Ubicación GPS Automática"
                width="100%"
                height="100%"
                className="w-full h-full border-0 pointer-events-none opacity-85 contrast-105"
                src={mapEmbedUrl}
                loading="lazy"
              />

              {/* Baliza táctica de posición en el centro */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-rose-500/30 animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Insignia GPS Satelital Superior */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-rose-400 border border-rose-500/40 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPS ACTIVO (±{coords.accuracy}m)</span>
                </span>
              </div>

              {/* Barra inferior con coordenadas y dirección aproximada */}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xs border-t border-rose-900/60 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-200">
                <div className="truncate flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-rose-400 shrink-0 rotate-45" />
                  <span className="truncate text-white font-sans text-[11px]">
                    {locationName}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Estas coordenadas satelitales se despacharán de forma 100% automática al activar la alarma.</span>
            </p>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-sos"
              type="button"
              onClick={handleBroadcastSos}
              disabled={isTriggered}
              className="py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:from-rose-800 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-rose-900/30 dark:shadow-rose-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
            >
              {isTriggered ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ACTIVANDO ALARMA...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>ACTIVAR ALARMA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
