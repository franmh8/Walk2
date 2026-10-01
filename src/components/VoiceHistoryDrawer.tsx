import React from 'react';
import {
  X,
  Activity,
  Play,
  Pause,
  Clock,
  Radio,
  User,
  AlertTriangle,
  Download,
  Volume2,
  Trash2,
} from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { VoiceMessage } from '../types';

interface VoiceHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceHistoryDrawer: React.FC<VoiceHistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { voiceMessages, playRecordedMessage, currentlyPlayingId, activeChannel, mode } = useRadio();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 animate-slideLeft transition-colors duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Bitácora de Transmisiones</h2>
          </div>
          <button
            id="btn-close-history-drawer"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {voiceMessages.map((msg) => {
            const isPlaying = currentlyPlayingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border transition-all ${
                  msg.is_emergency
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600/80 shadow-md shadow-rose-500/10 dark:shadow-rose-950'
                    : isPlaying
                    ? 'bg-[#691c32]/5 dark:bg-slate-800/90 border-[#691c32]/30 dark:border-[#8a1a36]/80 shadow-md shadow-[#691c32]/10 dark:shadow-[#290812]'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        msg.is_emergency
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-[#691c32]/10 dark:bg-slate-800 text-[#691c32] dark:text-[#eb527c] border border-sky-200 dark:border-slate-700'
                      }`}
                    >
                      {msg.is_emergency ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        (msg.sender_name || 'C').charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        {msg.sender_name || 'Oficial C5i'}
                      </div>
                      <div className="text-[10px] text-[#8a1a36] dark:text-[#eb527c] font-mono">
                        {msg.sender_callsign || 'RADIO-C5I'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {msg.created_at || 'Reciente'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      00:{msg.duration_seconds.toString().padStart(2, '0')}s
                    </span>
                  </div>
                </div>

                {/* Playback bar & Waveform simulation */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-1 h-6 px-2 bg-slate-100 dark:bg-slate-950/80 rounded-lg">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          isPlaying
                            ? 'bg-[#691c32] dark:bg-sky-400 animate-pulse'
                            : msg.is_emergency
                            ? 'bg-rose-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{
                          height: `${Math.max(20, (Math.sin(i * 0.5) * 40 + 50))}%`,
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => playRecordedMessage(msg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : msg.is_emergency
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-[#691c32] hover:bg-[#8a1a36] text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Reproducir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {voiceMessages.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-mono">
              No hay transmisiones grabadas en esta frecuencia. Presiona PTT para transmitir la primera.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
