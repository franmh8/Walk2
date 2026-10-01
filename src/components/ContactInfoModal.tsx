import React, { useState } from 'react';
import {
  X,
  Info,
  Image as ImageIcon,
  Users,
  Phone,
  Video,
  Search,
  Bell,
  Radio,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Contact, Channel, ChatMessage } from '../types';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'channel' | 'direct';
  activeContact?: Contact | null;
  activeChannel?: Channel | null;
  messages: ChatMessage[];
  onStartCall: (type: 'video' | 'audio') => void;
  onSearchInChat?: () => void;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  mode,
  activeContact,
  activeChannel,
  messages,
  onStartCall,
  onSearchInChat,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'groups'>('info');
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen) return null;

  const isChannel = mode === 'channel';
  const name = isChannel
    ? activeChannel?.name || 'Canal de Radio'
    : activeContact?.alias || activeContact?.contact_user?.name || 'Contacto';

  const subtitle = isChannel
    ? `${activeChannel?.member_count || 8} miembros activos`
    : activeContact?.contact_user?.phone_number || activeContact?.contact_user?.callsign || activeContact?.contact_user?.unit || '+52 771 406 5278';

  const avatarUrl = !isChannel ? activeContact?.contact_user?.avatar_url : null;
  const isOnline = !isChannel && activeContact?.contact_user?.status === 'online';

  // Media items
  const mediaMessages = messages.filter(
    (m) => m.media_type === 'image' || m.media_type === 'video' || m.media_type === 'audio'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-fadeIn select-none transition-colors duration-200">
      {/* WhatsApp Mac/Web style window container */}
      <div
        className="bg-white dark:bg-[#1e242d] border border-slate-200 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full h-[540px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main 2-column layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR (Essential Tabs Only) */}
          <div className="w-48 sm:w-56 bg-slate-50 dark:bg-[#161c24] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 p-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white px-3 py-2 mb-2">
              {isChannel ? 'Canal' : 'Contacto'}
            </h3>

            <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-none">
              {/* Tab 1: Info */}
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-white dark:bg-slate-700/60 text-emerald-600 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Info className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                <span className="truncate">Info.</span>
              </button>

              {/* Tab 2: Media */}
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'media'
                    ? 'bg-white dark:bg-slate-700/60 text-sky-600 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0 text-sky-500 dark:text-sky-400" />
                <span className="truncate">Archivos y enlaces</span>
              </button>

              {/* Tab 3: Groups / Members */}
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'groups'
                    ? 'bg-white dark:bg-slate-700/60 text-indigo-600 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <span className="truncate">{isChannel ? 'Miembros' : 'Grupos en común'}</span>
              </button>
            </nav>
          </div>

          {/* RIGHT MAIN CONTENT PANEL */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1e242d] overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            {/* Header with Title & Close button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'info' && 'Info.'}
                {activeTab === 'media' && 'Archivos y enlaces'}
                {activeTab === 'groups' && (isChannel ? 'Miembros' : 'Grupos en común')}
              </h4>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB CONTENT: INFO */}
            {activeTab === 'info' && (
              <div className="flex flex-col items-center text-center space-y-5 animate-fadeIn">
                {/* Avatar with Status */}
                <div className="relative mt-2">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-800 flex items-center justify-center text-3xl font-bold text-emerald-400">
                    {isChannel ? (
                      <div className="w-full h-full bg-gradient-to-br from-sky-900 via-slate-800 to-slate-900 flex items-center justify-center text-sky-400">
                        <Radio className="w-12 h-12" />
                      </div>
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt={name || 'Contacto'} className="w-full h-full object-cover" />
                    ) : (
                      (name || 'C').charAt(0).toUpperCase()
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1e242d] rounded-full" />
                  )}
                </div>

                {/* Name & Phone / Subtitle */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{name}</h3>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                </div>

                {/* Primary Action Buttons (Llamar, Video, Buscar) */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                  {/* Call */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartCall('audio');
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#28313e] dark:hover:bg-[#323d4d] border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group cursor-pointer active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Llamar</span>
                  </button>

                  {/* Video */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartCall('video');
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#28313e] dark:hover:bg-[#323d4d] border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group cursor-pointer active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Video</span>
                  </button>

                  {/* Search */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSearchInChat) onSearchInChat();
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#28313e] dark:hover:bg-[#323d4d] border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group cursor-pointer active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                      <Search className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Buscar</span>
                  </button>
                </div>

                {/* Essential Options List Only */}
                <div className="w-full max-w-md bg-slate-50 dark:bg-[#28313e]/80 border border-slate-200 dark:border-slate-700/70 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700/60 text-left">
                  {/* Option: Silenciar */}
                  <div
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">Silenciar notificaciones</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{isMuted ? 'Sí' : 'No'}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  {/* Option: Archivos y enlaces */}
                  <div
                    onClick={() => setActiveTab('media')}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs sm:text-sm font-medium text-slate-200">Archivos y enlaces</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{mediaMessages.length}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Option: Grupos / Miembros */}
                  <div
                    onClick={() => setActiveTab('groups')}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs sm:text-sm font-medium text-slate-200">
                        {isChannel ? 'Miembros del canal' : 'Grupos en común'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEDIA */}
            {activeTab === 'media' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.length === 0 ? (
                    <div className="col-span-3 py-16 text-center text-slate-500 text-xs font-mono">
                      No hay archivos multimedia compartidos en este chat
                    </div>
                  ) : (
                    mediaMessages.map((m) => (
                      <div
                        key={m.id}
                        className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group cursor-pointer"
                      >
                        {m.media_type === 'image' && (
                          <img src={m.media_url} alt="Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                        {m.media_type === 'video' && (
                          <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-400">
                            <Video className="w-6 h-6" />
                          </div>
                        )}
                        {m.media_type === 'audio' && (
                          <div className="w-full h-full bg-slate-950 flex items-center justify-center text-emerald-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: GROUPS / MEMBERS */}
            {activeTab === 'groups' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3 bg-[#28313e] rounded-xl border border-slate-700/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-900/60 flex items-center justify-center text-sky-400 font-bold text-sm">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">Canal General C5i</h5>
                    <p className="text-[11px] text-slate-400 font-mono">Frecuencia Táctica Principal</p>
                  </div>
                </div>
                <div className="p-3 bg-[#28313e] rounded-xl border border-slate-700/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">Emergencias 911 Hidalgo</h5>
                    <p className="text-[11px] text-slate-400 font-mono">Despacho Central</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="bg-[#161c24] border-t border-slate-800 px-5 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
