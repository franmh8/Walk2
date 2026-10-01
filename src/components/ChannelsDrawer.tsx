import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Trash2,
  LogIn,
  KeyRound,
} from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { Channel } from '../types';
import {
  createChannelApi,
  deleteChannelApi,
  getAllAvailableChannelsApi,
  joinChannelApi,
} from '../api/radioApi';

interface ChannelsDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  isInline?: boolean;
  onOpenSosModal?: () => void;
}

export const ChannelsDrawer: React.FC<ChannelsDrawerProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  onOpenSosModal,
}) => {
  const { user } = useAuth();
  const {
    channels,
    activeChannel,
    setActiveChannel,
    setMode,
    refreshChannels,
  } = useRadio();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([]);

  // PIN modal for private channel access
  const [pinModalChannel, setPinModalChannel] = useState<Channel | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // New channel state
  const [newChannelName, setNewChannelName] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [newCategory, setNewCategory] = useState('tactico');
  const [isCreating, setIsCreating] = useState(false);

  // Join channel state
  const [joinPinInput, setJoinPinInput] = useState('');
  const [selectedChannelToJoin, setSelectedChannelToJoin] = useState<Channel | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Load all available channels across the system for joining
  const loadAvailableChannels = async () => {
    const all = await getAllAvailableChannelsApi();
    setAvailableChannels(all);
  };

  useEffect(() => {
    loadAvailableChannels();
  }, [channels]);

  if (!isOpen && !isInline) return null;

  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = (ch.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'todos' ||
      (selectedCategory === 'privados' && ch.is_private) ||
      (selectedCategory === 'publicos' && !ch.is_private) ||
      ch.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSelectChannel = (ch: Channel) => {
    if (ch.is_private && ch.access_code) {
      setPinModalChannel(ch);
      setInputPin('');
      setPinError(null);
    } else {
      setActiveChannel(ch);
      setMode('channel');
      onClose();
    }
  };

  const handleVerifyPin = () => {
    if (!pinModalChannel) return;
    if (pinModalChannel.access_code === inputPin.trim()) {
      setActiveChannel(pinModalChannel);
      setMode('channel');
      setPinModalChannel(null);
      onClose();
    } else {
      setPinError('Código PIN de acceso táctico incorrecto.');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !user) return;

    setIsCreating(true);
    const created = await createChannelApi({
      name: newChannelName.trim(),
      is_private: newIsPrivate,
      access_code: newIsPrivate ? newAccessCode.trim() : undefined,
      category: newCategory,
      created_by: user.id,
    });

    await refreshChannels();
    await loadAvailableChannels();
    setIsCreating(false);
    setShowCreateModal(false);
    setActiveChannel(created);
    setMode('channel');
    onClose();
  };

  const handleJoinChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelToJoin || !user) return;

    setJoinError(null);
    setIsJoining(true);

    const res = await joinChannelApi(selectedChannelToJoin.id, user.id, joinPinInput);
    setIsJoining(false);

    if (res.success && res.channel) {
      await refreshChannels();
      setActiveChannel(res.channel);
      setMode('channel');
      setShowJoinModal(false);
      setSelectedChannelToJoin(null);
      setJoinPinInput('');
      onClose();
    } else {
      setJoinError(res.message || 'No fue posible unirse al canal.');
    }
  };

  const drawerContent = (
    <div
      className={
        isInline
          ? 'w-full bg-slate-50 dark:bg-[#070c16] h-full flex flex-col text-slate-900 dark:text-slate-100 min-h-0 relative transition-colors duration-200'
          : 'w-full max-w-md bg-slate-50 dark:bg-[#070c16] border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 animate-slideLeft transition-colors duration-200'
      }
    >
      {/* Header */}
      <div className="px-3.5 py-3 sm:p-5 sm:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-[#070c16]/90 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#691c32]/10 border border-[#8a1a36]/30 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] shrink-0">
            <Radio className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate whitespace-nowrap">
            <span className="sm:hidden">Canales</span>
            <span className="hidden sm:inline">Canales Tácticos C5i</span>
          </h2>
        </div>

        {/* Header Right Actions: SOS Emergency & Unirse/Crear Canales */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenSosModal && (
            <button
              id="btn-channels-sos"
              type="button"
              onClick={onOpenSosModal}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/90 dark:to-red-900/90 border border-rose-500/60 dark:border-rose-600/60 text-white dark:text-rose-200 text-xs font-bold hover:from-rose-500 hover:to-red-600 dark:hover:bg-rose-900 transition-all cursor-pointer shadow-sm active:scale-95 animate-pulse flex items-center justify-center gap-1 shrink-0"
              title="Llamada de Emergencia / Transmitir Alerta SOS"
            >
              <AlertTriangle className="w-4 h-4 text-white dark:text-rose-400 fill-white/20 dark:fill-rose-500/20" />
              <span className="hidden sm:inline">SOS</span>
            </button>
          )}

          {/* Unirse a Canal: Only icon on mobile, full text on laptop */}
          <button
            type="button"
            id="btn-open-join-channel"
            onClick={() => {
              loadAvailableChannels();
              setJoinError(null);
              setSelectedChannelToJoin(null);
              setJoinPinInput('');
              setShowJoinModal(true);
            }}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            title="Unirse a un canal existente con código o PIN"
          >
            <LogIn className="w-4 h-4 text-[#8a1a36] dark:text-[#eb527c]" />
            <span className="hidden sm:inline">Unirse a Canal</span>
          </button>

          {/* Botón Nuevo Canal: Only icon on mobile, full text on laptop */}
          <button
            type="button"
            id="btn-open-new-channel"
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] hover:via-[#9f2241] active:from-[#541224] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#691c32]/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            title="Crear Nuevo Canal"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Nuevo Canal</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 bg-slate-100/50 dark:bg-[#070c16]/80 shrink-0">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-search-channels"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar canal o frecuencia..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8a1a36]"
          />
        </div>

        {/* Filtrador con fondo guinda y letra BLANCA nítida al estar seleccionado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs sm:text-sm scrollbar-thin flex-1">
          {['todos', 'general', 'emergencia', 'tactico', 'vialidad', 'privados'].map((cat) => {
            const isCatSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl capitalize whitespace-nowrap text-xs sm:text-sm font-mono transition-all cursor-pointer ${
                  isCatSelected
                    ? 'bg-[#691c32] text-white font-bold shadow-md shadow-[#691c32]/30 border border-[#8a1a36]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
          {filteredChannels.map((ch) => {
            const isCurrent = activeChannel?.id === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#691c32]/5 dark:bg-[#290812]/60 border-[#eb527c] dark:border-[#8a1a36]/80 text-sky-950 dark:text-white shadow-md shadow-[#691c32]/10 dark:shadow-[#290812]/50'
                    : 'bg-white dark:bg-[#111927] hover:bg-slate-50 dark:hover:bg-[#162235] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                      isCurrent
                        ? 'bg-[#691c32] text-white border-[#8a1a36] font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#8a1a36] dark:text-[#eb527c]'
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{ch.name}</span>
                      {ch.is_private ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{ch.category || 'General'}</span>
                      <span>•</span>
                      <span>{ch.member_count || 1} unidades</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCurrent && (
                    <div className="flex items-center gap-1 text-xs text-[#8a1a36] dark:text-[#eb527c] font-mono font-bold shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">ACTIVO</span>
                    </div>
                  )}

                  {(!ch.created_by || ch.created_by === user?.id) && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Eliminar canal "${ch.name}"?`)) {
                          await deleteChannelApi(ch.id);
                          await refreshChannels();
                          if (activeChannel?.id === ch.id) {
                            setActiveChannel(null as any);
                          }
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar este canal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredChannels.length === 0 && (
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#691c32]/10 border border-[#8a1a36]/20 flex items-center justify-center text-[#8a1a36] mb-3">
              <Radio className="w-7 h-7 opacity-80" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              {channels.length === 0 ? 'No tienes canales creados todavía' : 'No se encontraron canales'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {channels.length === 0
                ? 'Crea tu propio canal o únete a uno existente en la red táctica C5i.'
                : 'Intenta con otro término de búsqueda o categoría.'}
            </p>
          </div>
        )}
      </div>

      {/* PIN verification modal for private channels */}
      {pinModalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn text-slate-800 dark:text-slate-100">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Canal Privado Encriptado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{pinModalChannel.name}</p>
            </div>

            {pinError && (
              <div className="p-2.5 mb-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {pinError}
              </div>
            )}

            <input
              id="input-channel-pin"
              type="password"
              maxLength={6}
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              placeholder="Ingresa PIN de 4 dígitos"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-slate-900 dark:text-white tracking-widest focus:outline-none focus:border-amber-500 mb-4"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPinModalChannel(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVerifyPin}
                className="py-2.5 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-[#691c32]/30"
              >
                Acceder al Canal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNIRSE A CANAL EXISTENTE */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn text-slate-800 dark:text-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#8a1a36] dark:text-[#eb527c] font-bold text-sm">
                <LogIn className="w-5 h-5" />
                <span>Unirse a Canal de Radiocomunicación</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false);
                  setSelectedChannelToJoin(null);
                  setJoinPinInput('');
                  setJoinError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {joinError && (
              <div className="p-2.5 mb-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{joinError}</span>
              </div>
            )}

            {!selectedChannelToJoin ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Selecciona uno de los canales creados en la red para unirte y comenzar a transmitir:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                  {availableChannels.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No hay canales disponibles en el sistema aún.
                    </div>
                  ) : (
                    availableChannels.map((c) => {
                      const alreadyJoined = channels.some((myC) => myC.id === c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (alreadyJoined) {
                              setActiveChannel(c);
                              setMode('channel');
                              setShowJoinModal(false);
                              onClose();
                            } else {
                              setSelectedChannelToJoin(c);
                              setJoinPinInput('');
                              setJoinError(null);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            alreadyJoined
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                              : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#8a1a36]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[#691c32]/10 border border-[#8a1a36]/20 flex items-center justify-center text-[#8a1a36] shrink-0">
                              <Radio className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {c.name}
                                </span>
                                {c.is_private ? (
                                  <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                ) : null}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                <span className="capitalize">{c.category || 'General'}</span> • {c.member_count || 1} miembros
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {alreadyJoined ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ya unido</span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#8a1a36] dark:text-[#eb527c] hover:underline">
                                Unirse →
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinChannelSubmit} className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#691c32]/10 border border-[#8a1a36]/20 flex items-center justify-center text-[#8a1a36] shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedChannelToJoin.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Categoría: <span className="capitalize">{selectedChannelToJoin.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                {selectedChannelToJoin.is_private ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Este canal es privado. Ingresa el código PIN de acceso:
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={joinPinInput}
                        onChange={(e) => setJoinPinInput(e.target.value)}
                        placeholder="PIN de 4 dígitos"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#8a1a36] font-mono tracking-widest"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Este canal es público y está abierto para todos los miembros operativos de la red C5i.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannelToJoin(null)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Volver a Lista
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining}
                    className="py-2.5 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-[#691c32]/30 flex items-center justify-center gap-1.5"
                  >
                    {isJoining ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Confirmar y Unirse</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create new channel modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#8a1a36] dark:text-[#eb527c] font-bold text-sm">
                <FolderPlus className="w-5 h-5" />
                <span>Nuevo Canal de Radiocomunicación</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Canal *
                </label>
                <input
                  id="input-new-channel-name"
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Ej. Operativo Huasteca Hidalguense"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8a1a36]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoría / Propósito
                </label>
                <select
                  id="select-new-channel-cat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#8a1a36]"
                >
                  <option value="general">General / Despacho Central</option>
                  <option value="emergencia">Emergencias 911</option>
                  <option value="tactico">Operaciones Especiales Tácticas</option>
                  <option value="vialidad">Vialidad y Tránsito</option>
                  <option value="inteligencia">Inteligencia y Monitoreo</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Canal Privado con PIN</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Requiere código para ingresar</div>
                </div>
                <input
                  type="checkbox"
                  checked={newIsPrivate}
                  onChange={(e) => setNewIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#8a1a36] cursor-pointer"
                />
              </div>

              {newIsPrivate && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código PIN de Acceso
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newAccessCode}
                    onChange={(e) => setNewAccessCode(e.target.value)}
                    placeholder="Ej. 7710"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8a1a36] font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="py-2.5 bg-gradient-to-r from-[#691c32] via-[#8a1a36] to-[#691c32] hover:from-[#7a1834] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-[#691c32]/30"
                >
                  {isCreating ? 'Creando...' : 'Crear Canal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#0b1320] overflow-hidden transition-colors duration-200">
        {drawerContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn transition-colors duration-200">
      {drawerContent}
    </div>
  );
};
