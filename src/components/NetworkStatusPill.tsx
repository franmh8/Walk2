import React from 'react';
import {
  Wifi,
  WifiOff,
  SignalMedium,
  Smartphone,
  Globe,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

interface NetworkStatusPillProps {
  compact?: boolean;
  className?: string;
}

export const NetworkStatusPill: React.FC<NetworkStatusPillProps> = ({ compact = false, className = '' }) => {
  const {
    color,
    statusLabel,
    statusDescription,
    connectionType,
    pendingOutboxCount,
  } = useNetwork();

  // Visual classes based on dynamic color state
  const pillColorClasses = (() => {
    switch (color) {
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-sm';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 shadow-sm';
      case 'red':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 shadow-sm';
    }
  })();

  const renderIcon = () => {
    if (color === 'red') {
      return <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
    if (color === 'amber') {
      return <SignalMedium className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
    if (connectionType === 'cellular') {
      return <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (connectionType === 'ethernet') {
      return <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
  };

  return (
    <div
      id="network-status-indicator"
      title={statusDescription}
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md select-none transition-all ${pillColorClasses} ${className}`}
    >
      {renderIcon()}

      <span className="text-xs font-semibold tracking-wide whitespace-nowrap font-sans">
        {statusLabel}
      </span>

      {/* Small badge if there are offline pending messages in local outbox */}
      {pendingOutboxCount > 0 && (
        <span
          className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-200/80 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 rounded-full border border-amber-400/50"
          title={`${pendingOutboxCount} mensajes pendientes por enviar al recuperar la red`}
        >
          {pendingOutboxCount} en cola
        </span>
      )}
    </div>
  );
};
