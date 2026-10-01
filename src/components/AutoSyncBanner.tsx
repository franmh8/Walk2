import React from 'react';
import { Wifi, CheckCircle2, X, CloudUpload } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

export const AutoSyncBanner: React.FC = () => {
  const { syncNotification, clearSyncNotification } = useNetwork();

  if (!syncNotification) return null;

  return (
    <div
      id="auto-sync-notification-banner"
      className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-3 px-4 py-2 bg-emerald-50 dark:bg-[#08201a] border border-emerald-300 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200 rounded-full shadow-lg shadow-emerald-500/10 dark:shadow-emerald-950/80 backdrop-blur-md animate-slide-down transition-colors"
    >
      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div className="flex items-center space-x-2 text-xs font-semibold">
        <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{syncNotification.text}</span>
      </div>
      <button
        type="button"
        id="dismiss-sync-banner-btn"
        onClick={clearSyncNotification}
        className="p-1 text-emerald-600/70 hover:text-emerald-950 dark:text-emerald-400/70 dark:hover:text-white rounded-full hover:bg-emerald-200/50 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
