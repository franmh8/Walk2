import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Video,
  VideoOff,
  MapPin,
  AlertTriangle,
  Radio,
  Download,
  Search,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Play,
  Pause,
  X,
  Plus,
  Maximize2,
  Users,
  MessageSquare,
  BookOpen,
  User as UserIcon,
  FileText,
  Navigation,
  ExternalLink,
  ChevronLeft,
  Phone,
  PhoneOff,
  PhoneCall,
  SquarePen,
  MoreVertical,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, Channel, Contact } from '../types';
import { soundEngine } from '../utils/audioEffects';
import { getAllStoredChatMessages } from '../api/chatApi';
import { ContactInfoModal } from './ContactInfoModal';
import { NewConversationModal } from './NewConversationModal';
import { CreateContactModal } from './CreateContactModal';

interface WhatsAppChatProps {
  onSwitchToRadio: () => void;
  onOpenChannels: () => void;
  onOpenContacts: () => void;
  onOpenProfile: () => void;
  onOpenSosModal?: () => void;
  initialMobileView?: 'list' | 'room';
}

type ChatFilterTab = 'all' | 'groups' | 'direct';

interface ConversationItem {
  id: string;
  type: 'channel' | 'direct';
  title: string;
  subtitle: string;
  avatarUrl?: string;
  callsign?: string;
  isOnline?: boolean;
  memberCount?: number;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  rawChannel?: Channel;
  rawContact?: Contact;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  onSwitchToRadio,
  onOpenChannels,
  onOpenContacts,
  onOpenProfile,
  onOpenSosModal,
  initialMobileView = 'list',
}) => {
  const { user } = useAuth();
  const {
    mode,
    setMode,
    activeChannel,
    setActiveChannel,
    activeContact,
    setActiveContact,
    channels,
    contacts,
  } = useRadio();

  const {
    messages,
    isOfflineMode,
    toggleOfflineMode,
    pendingOfflineCount,
    sendTextMessage,
    sendAudioMessage,
    sendLocationMessage,
    sendMediaMessage,
    sendEmergencyAlert,
    syncPendingMessages,
    exportChatBackup,
    clearChatHistory,
  } = useChat();

  // Mobile navigation state: show list of all conversations by default
  const [mobileView, setMobileView] = useState<'list' | 'room'>(initialMobileView);

  // Active selected conversation ID (null when no chat is open or when user presses Esc)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  useEffect(() => {
    setMobileView(initialMobileView);
    if (initialMobileView === 'list') {
      setSelectedConvId(null);
    }
  }, [initialMobileView]);

  // Filter and search state for the chats list
  const [activeFilterTab, setActiveFilterTab] = useState<ChatFilterTab>('all');
  const [inboxSearchQuery, setInboxSearchQuery] = useState('');

  // Modals for new chat and create contact
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);

  // Conversation search and attach menu
  const [inputText, setInputText] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; caption?: string } | null>(null);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);

  // Keyboard Escape listener: closes active chat, modals, and shows WhatsApp welcome screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateContactOpen) {
          setIsCreateContactOpen(false);
          return;
        }
        if (isNewConversationOpen) {
          setIsNewConversationOpen(false);
          return;
        }
        if (lightboxMedia) {
          setLightboxMedia(null);
          return;
        }
        if (showContactInfoModal) {
          setShowContactInfoModal(false);
          return;
        }
        if (showAttachMenu) {
          setShowAttachMenu(false);
          return;
        }
        if (showChatSearch) {
          setShowChatSearch(false);
          setChatSearchQuery('');
          return;
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setSelectedConvId(null);
        setMobileView('list');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia, showContactInfoModal, showAttachMenu, showChatSearch, isNewConversationOpen, isCreateContactOpen]);

  // Active call modal state
  const [activeCall, setActiveCall] = useState<{
    type: 'video' | 'audio';
    status: 'calling' | 'connected';
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);

  // Call duration counter
  useEffect(() => {
    let timer: any;
    if (activeCall?.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  const handleStartCall = (type: 'video' | 'audio') => {
    soundEngine.playPttStart();
    setActiveCall({
      type,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isVideoOff: false,
    });

    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
      soundEngine.playRogerBeep();
    }, 1500);
  };

  const handleEndCall = () => {
    soundEngine.playRogerBeep();
    setActiveCall(null);
  };

  // Audio recording state for voice notes
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Playing audio notes
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaUploadType, setMediaUploadType] = useState<'image' | 'video'>('image');

  // Scroll to bottom immediately on chat switch or when new messages arrive
  const scrollToBottom = (smooth = false) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(false), 60);
    return () => clearTimeout(timer);
  }, [mode, activeChannel?.id, activeContact?.contact_user_id, mobileView]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Load all stored messages from local storage to calculate recent previews
  const [allDbMessages, setAllDbMessages] = useState<ChatMessage[]>(() => getAllStoredChatMessages());

  useEffect(() => {
    setAllDbMessages(getAllStoredChatMessages());
  }, [messages]);

  // Build the list of all conversations (Channels + Contacts)
  const conversationList: ConversationItem[] = useMemo(() => {
    const list: ConversationItem[] = [];

    // 1. Add Channels
    channels.forEach((ch) => {
      const channelMsgs = allDbMessages.filter((m) => m.channel_id === ch.id);
      const lastMsg = channelMsgs[channelMsgs.length - 1];

      list.push({
        id: ch.id,
        type: 'channel',
        title: ch.name,
        subtitle: `${ch.member_count || 5} miembros en frecuencia`,
        memberCount: ch.member_count,
        lastMessage: lastMsg,
        rawChannel: ch,
      });
    });

    // 2. Add Direct Contacts
    contacts.forEach((ct) => {
      const contactMsgs = allDbMessages.filter(
        (m) =>
          !m.channel_id &&
          ((String(m.sender_id) === String(user?.id) && String(m.receiver_id) === String(ct.contact_user_id)) ||
           (String(m.sender_id) === String(ct.contact_user_id) && String(m.receiver_id) === String(user?.id)))
      );
      const lastMsg = contactMsgs[contactMsgs.length - 1];

      list.push({
        id: ct.contact_user_id,
        type: 'direct',
        title: ct.alias || ct.contact_user?.name || 'Contacto C5i',
        subtitle: ct.contact_user?.unit || ct.contact_user?.role || 'Enlace Directo 1-a-1',
        avatarUrl: ct.contact_user?.avatar_url,
        callsign: ct.contact_user?.callsign,
        isOnline: ct.contact_user?.status === 'online',
        lastMessage: lastMsg,
        rawContact: ct,
      });
    });

    // Sort by latest message date descending
    return list.sort((a, b) => {
      const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [channels, contacts, allDbMessages]);

  // Filter conversations based on tab and search
  const filteredConversations = useMemo(() => {
    return conversationList.filter((conv) => {
      // Filter by tab
      if (activeFilterTab === 'groups' && conv.type !== 'channel') return false;
      if (activeFilterTab === 'direct' && conv.type !== 'direct') return false;

      // Filter by search text
      if (inboxSearchQuery.trim()) {
        const q = inboxSearchQuery.toLowerCase();
        const matchesTitle = conv.title.toLowerCase().includes(q);
        const matchesCallsign = conv.callsign?.toLowerCase().includes(q);
        const matchesLastMsg = conv.lastMessage?.content.toLowerCase().includes(q);
        return matchesTitle || matchesCallsign || matchesLastMsg;
      }

      return true;
    });
  }, [conversationList, activeFilterTab, inboxSearchQuery]);

  // Select a conversation from the list
  const handleSelectConversation = (conv: ConversationItem) => {
    setSelectedConvId(conv.id);
    if (conv.type === 'channel' && conv.rawChannel) {
      setMode('channel');
      setActiveChannel(conv.rawChannel);
    } else if (conv.type === 'direct' && conv.rawContact) {
      setMode('direct');
      setActiveContact(conv.rawContact);
    }
    setMobileView('room');
  };

  // Start direct chat with a contact from modal
  const handleStartChatWithContact = (contact: Contact) => {
    const existingConv = conversationList.find(
      (c) => c.type === 'direct' && c.id === contact.contact_user_id
    );
    if (existingConv) {
      handleSelectConversation(existingConv);
    } else {
      setSelectedConvId(contact.contact_user_id);
      setMode('direct');
      setActiveContact(contact);
      setMobileView('room');
    }
    setIsNewConversationOpen(false);
  };

  // Target info for active conversation
  const targetName =
    mode === 'channel'
      ? activeChannel?.name || 'Canal General C5i'
      : activeContact?.alias || activeContact?.contact_user?.name || 'Oficial C5i';

  const targetSubtitle =
    mode === 'channel'
      ? `${activeChannel?.member_count || 14} unidades conectadas • Canal Táctico`
      : `${activeContact?.contact_user?.callsign || 'RADIO-1A1'} • ${activeContact?.contact_user?.unit || 'Enlace Directo'}`;

  // Filter messages by search query inside current chat room
  const displayedMessages = messages.filter((m) => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    return (
      (m.content || '').toLowerCase().includes(q) ||
      (m.sender_name || '').toLowerCase().includes(q) ||
      (m.sender_callsign && m.sender_callsign.toLowerCase().includes(q))
    );
  });

  // Handle send text
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await sendTextMessage(inputText);
    setInputText('');
  };

  // Start voice note recording
  const handleStartVoiceRecord = async () => {
    if (isRecordingVoice) return;
    soundEngine.playPttStart();
    setIsRecordingVoice(true);
    setRecordingSeconds(0);

    const startTime = Date.now();
    recordIntervalRef.current = setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 200);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) {
            audioChunksRef.current.push(ev.data);
          }
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.warn('Microphone permission unavailable, using virtual voice note:', err);
    }
  };

  // Stop voice note and send
  const handleStopVoiceRecord = async (cancel: boolean = false) => {
    if (!isRecordingVoice) return;
    setIsRecordingVoice(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    if (!cancel) {
      soundEngine.playRogerBeep();
      const duration = Math.max(1, recordingSeconds);
      const audioBlob =
        audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
          : new Blob([], { type: 'audio/webm' });

      await sendAudioMessage(audioBlob, duration);
    }
  };

  // Play audio voice note
  const handleTogglePlayAudio = (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (msg.media_url) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(msg.media_url);
      audioPlayerRef.current = audio;
      setPlayingAudioId(msg.id);

      audio.onended = () => {
        setPlayingAudioId(null);
      };
      audio.play().catch(() => setPlayingAudioId(null));
    } else {
      setPlayingAudioId(msg.id);
      soundEngine.playIncomingChirp();
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(
          `Nota de voz de ${msg.sender_name}. Duración ${msg.duration_seconds || 4} segundos.`
        );
        utter.lang = 'es-MX';
        utter.onend = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utter);
      } else {
        setTimeout(() => setPlayingAudioId(null), 3000);
      }
    }
  };

  // Handle file picker selection
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || mediaUploadType === 'video';
    const isImage = file.type.startsWith('image/') || mediaUploadType === 'image';

    if (isImage) {
      sendMediaMessage(file, 'image', `Foto de evidencia: ${file.name}`);
    } else if (isVideo) {
      sendMediaMessage(file, 'video', `Video de reporte táctico: ${file.name}`);
    }
    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Format message snippet with icon
  const renderMessageSnippet = (msg?: ChatMessage) => {
    if (!msg) return <span className="italic text-slate-500">Sin mensajes recientes</span>;

    if (msg.type === 'audio') {
      return (
        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
          <Mic className="w-3.5 h-3.5 text-[#8a1a36] dark:text-[#eb527c] shrink-0" />
          <span>Nota de voz ({msg.duration_seconds || 4}s)</span>
        </span>
      );
    }
    if (msg.type === 'image') {
      return (
        <span className="flex items-center gap-1 text-slate-300">
          <ImageIcon className="w-3.5 h-3.5 text-[#eb527c] shrink-0" />
          <span>Foto de evidencia</span>
        </span>
      );
    }
    if (msg.type === 'video') {
      return (
        <span className="flex items-center gap-1 text-slate-300">
          <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Video reporte</span>
        </span>
      );
    }
    if (msg.type === 'location') {
      return (
        <span className="flex items-center gap-1 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Ubicación GPS</span>
        </span>
      );
    }
    if (msg.is_emergency || msg.type === 'emergency') {
      return (
        <span className="flex items-center gap-1 text-rose-300 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
          <span className="truncate">{msg.content}</span>
        </span>
      );
    }
    return <span className="truncate">{msg.content}</span>;
  };

  // Format message timestamp
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return timeStr.slice(11, 16) || timeStr;
    }
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#070c16] text-slate-900 dark:text-slate-100 relative overflow-hidden select-none transition-colors duration-200">
      {/* DUAL PANE CONTAINER: WhatsApp Web Split Screen on Desktop, Single View on Mobile */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative z-10">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: WHATSAPP CHATS INBOX LIST (Visible on Desktop OR when mobileView === 'list') */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#070c16] border-r border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-200 ${
            mobileView === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Top Inbox Header */}
          <div className="bg-white/90 dark:bg-[#070c16]/90 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#691c32]/10 dark:bg-[#691c32]/25 border border-[#691c32]/30 dark:border-[#8a1a36]/40 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Chat</h2>
            </div>

            {/* Quick Actions: SOS emergency button & New conversation */}
            <div className="flex items-center gap-2">
              {/* Emergency SOS in Inbox */}
              {onOpenSosModal && (
                <button
                  id="btn-chat-inbox-sos"
                  type="button"
                  onClick={onOpenSosModal}
                  className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/90 dark:to-red-900/90 border border-rose-500/60 dark:border-rose-600/60 text-white dark:text-rose-200 text-xs font-bold hover:from-rose-500 hover:to-red-600 dark:hover:bg-rose-900 transition-all cursor-pointer shadow-md dark:shadow-lg shadow-rose-600/20 dark:shadow-rose-950/50 active:scale-95 animate-pulse flex items-center justify-center gap-1"
                  title="Alerta de Emergencia SOS"
                >
                  <AlertTriangle className="w-4 h-4 text-white dark:text-rose-400 fill-white/20 dark:fill-rose-500/20" />
                  <span className="hidden sm:inline">SOS</span>
                </button>
              )}

              {/* Start New Conversation Button */}
              <button
                type="button"
                onClick={() => setIsNewConversationOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#8a1a36] dark:hover:text-[#eb527c] hover:border-[#691c32]/40 rounded-full transition-all flex items-center justify-center shadow-sm active:scale-95 cursor-pointer"
                title="Nueva conversación"
              >
                <SquarePen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 bg-slate-100/50 dark:bg-[#070c16]/80 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={inboxSearchQuery}
                onChange={(e) => setInboxSearchQuery(e.target.value)}
                placeholder="Buscar chats o mensajes..."
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none"
              />
              {inboxSearchQuery && (
                <button
                  type="button"
                  onClick={() => setInboxSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs: Todos | Grupos | Directos */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setActiveFilterTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'all'
                    ? 'bg-[#691c32] hover:bg-[#8a1a36] text-white shadow-sm shadow-[#691c32]/20 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Todos ({conversationList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterTab('groups')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'groups'
                    ? 'bg-[#691c32] hover:bg-[#8a1a36] text-white shadow-sm shadow-[#691c32]/20 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Grupos ({channels.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterTab('direct')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'direct'
                    ? 'bg-[#691c32] hover:bg-[#8a1a36] text-white shadow-sm shadow-[#691c32]/20 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Directos ({contacts.length})
              </button>
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-slate-800/50 scrollbar-thin">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {conversationList.length === 0 ? 'Sin conversaciones todavía' : 'No se encontraron conversaciones'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                  {conversationList.length === 0
                    ? 'Crea un grupo para comenzar a chatear.'
                    : 'Prueba con otra búsqueda o cambia de pestaña.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConvId !== null && selectedConvId === conv.id;

                return (
                  <div
                    key={`${conv.type}-${conv.id}`}
                    onClick={() => handleSelectConversation(conv)}
                    className={`flex items-center gap-3 p-3 sm:px-3.5 sm:py-3 transition-colors cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#691c32]/5 dark:bg-[#691c32]/20 border-l-4 border-[#8a1a36] dark:border-[#eb527c]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.type === 'channel' ? (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/60 dark:to-slate-900 border border-[#691c32]/30 dark:border-[#8a1a36]/30 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] shadow-sm">
                          <Radio className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm">
                          {conv.avatarUrl ? (
                            <img src={conv.avatarUrl} alt={conv.title} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      )}

                      {/* Online dot for direct contacts */}
                      {conv.type === 'direct' && (
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#0d1624] ${
                            conv.isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {conv.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                          {formatTime(conv.lastMessage?.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="truncate text-[11px] leading-snug flex-1">
                          {renderMessageSnippet(conv.lastMessage)}
                        </div>

                        {/* Tag Badge */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                            conv.type === 'channel'
                              ? 'bg-[#691c32]/5 dark:bg-[#290812]/80 text-[#691c32] dark:text-[#eb527c] border border-sky-200 dark:border-sky-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {conv.type === 'channel' ? 'CANAL' : '1A1'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT ROOM OR WHATSAPP EMPTY STATE */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col bg-slate-50 dark:bg-[#070c16] h-full min-h-0 relative overflow-hidden transition-colors duration-200 ${
            mobileView === 'room' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!selectedConvId ? (
            /* C5I WALKIE MINIMAL EMPTY STATE: ONLY LOGO AND NAME */
            <div className="flex-1 flex flex-col justify-center items-center h-full min-h-0 p-6 text-center bg-slate-50 dark:bg-[#070c16] select-none animate-fadeIn">
              <div className="flex flex-col items-center justify-center">
                {/* Official C5i Walkiet Logo */}
                <div className="mb-4">
                  <img
                    src="/c5i-logo.svg"
                    alt="C5i Walkiet"
                    className="w-28 h-24 object-contain filter drop-shadow-md"
                  />
                </div>

                {/* App Title */}
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  C5i Walkiet
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Sistema de Radiocomunicación Táctica
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div className="bg-white/90 dark:bg-[#070c16]/90 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 backdrop-blur-md relative z-20 shadow-sm shrink-0">
                {/* Left Target Info + Back Arrow (Mobile & Desktop) */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* Back / Deselect to Chats List Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConvId(null);
                      setMobileView('list');
                    }}
                    className="p-1.5 -ml-1 text-slate-400 hover:text-[#8a1a36] dark:hover:text-[#eb527c] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 font-bold text-xs transition-colors shrink-0"
                    title="Cerrar chat (Esc)"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#8a1a36] dark:text-[#eb527c]" />
                    <span className="hidden sm:inline text-[11px] font-mono font-normal text-slate-400">Esc</span>
                  </button>

                  {/* Contact / Channel Profile Picture */}
                  <div
                    onClick={() => setShowContactInfoModal(true)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] font-bold text-sm cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-[#8a1a36]/40 transition-all shrink-0 shadow-sm"
                    title="Ver información del contacto o canal"
                  >
                    {mode === 'channel' ? (
                      <div className="w-full h-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/80 dark:to-slate-900 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c]">
                        <Radio className="w-5 h-5" />
                      </div>
                    ) : activeContact?.contact_user?.avatar_url ? (
                      <img
                        src={activeContact.contact_user.avatar_url}
                        alt={targetName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#691c32]/10 dark:bg-[#691c32]/25 text-[#8a1a36] dark:text-[#eb527c] flex items-center justify-center font-bold">
                        {(targetName || 'C').charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Contact Name & Subtitle (Clickable to view info) */}
                  <div
                    onClick={() => setShowContactInfoModal(true)}
                    className="min-w-0 flex-1 cursor-pointer group"
                    title="Ver información"
                  >
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight group-hover:text-[#8a1a36] dark:group-hover:text-[#eb527c] transition-colors">
                      {targetName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {mode === 'direct'
                        ? (activeContact?.contact_user?.is_online ? 'en línea' : 'desconectado')
                        : targetSubtitle}
                    </p>
                  </div>
                </div>

            {/* Right Header Actions: SOS, Video Call, Voice Call */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-slate-600 dark:text-slate-300">
              {onOpenSosModal && (
                <button
                  id="btn-chat-room-sos"
                  type="button"
                  onClick={onOpenSosModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/90 dark:to-red-900/90 border border-rose-500/60 dark:border-rose-600/60 text-white dark:text-rose-200 text-xs font-bold hover:from-rose-500 hover:to-red-600 dark:hover:bg-rose-900 transition-all cursor-pointer shadow-md dark:shadow-lg shadow-rose-600/20 dark:shadow-rose-950/50 active:scale-95 animate-pulse"
                  title="Alerta de Emergencia SOS"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-white dark:text-rose-400 fill-white/20 dark:fill-rose-500/20" />
                  <span>SOS</span>
                </button>
              )}

              {/* Video Call */}
              <button
                type="button"
                onClick={() => handleStartCall('video')}
                className="p-2 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
                title="Videollamada"
              >
                <Video className="w-5 h-5" />
              </button>

              {/* Voice Call */}
              <button
                type="button"
                onClick={() => handleStartCall('audio')}
                className="p-2 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
                title="Llamada de voz"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* OFFLINE STATUS BANNER */}
          {(isOfflineMode || pendingOfflineCount > 0) && (
            <div className="bg-amber-950/90 border-b border-amber-700/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-10 animate-fadeIn shrink-0">
              <div className="flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isOfflineMode
                    ? 'Modo sin conexión: Mensajes en cola local.'
                    : `${pendingOfflineCount} mensaje(s) pendientes de sincronizar.`}
                </span>
              </div>

              <button
                type="button"
                onClick={syncPendingMessages}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
              >
                Sincronizar ({pendingOfflineCount})
              </button>
            </div>
          )}

          {/* CHAT MESSAGES SCROLL AREA */}
          <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 z-10 scrollbar-thin">

            {displayedMessages.map((msg) => {
              const isMe = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Sender Name & Callsign (if group and not me) */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1 ml-1">
                      <span className="font-bold text-[#eb527c]">{msg.sender_name}</span>
                      {msg.sender_callsign && (
                        <span className="text-[10px] text-slate-500">[{msg.sender_callsign}]</span>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-3 max-w-[85%] sm:max-w-[70%] shadow-md transition-all ${
                      msg.is_emergency
                        ? 'bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-500 dark:border-rose-600 text-rose-900 dark:text-rose-100 shadow-rose-900/20 animate-pulse'
                        : isMe
                        ? 'bg-[#691c32] text-white dark:bg-gradient-to-br dark:from-[#691c32] dark:to-[#4d1222] dark:border dark:border-[#8a1a36]/60 dark:text-slate-100 rounded-tr-none'
                        : 'bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {/* 1. EMERGENCY ALERT TYPE */}
                    {msg.is_emergency && (
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-rose-800 text-rose-300 text-xs font-mono font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                        <span>ALERTA DE EMERGENCIA C5i (10-33)</span>
                      </div>
                    )}

                    {/* 2. TEXT TYPE */}
                    {msg.type === 'text' && (
                      <div className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {/* 3. AUDIO / VOICE NOTE TYPE */}
                    {msg.type === 'audio' && (
                      <div className="space-y-2 min-w-[200px] sm:min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayAudio(msg)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                              playingAudioId === msg.id
                                ? 'bg-rose-500 text-white animate-pulse'
                                : isMe
                                ? 'bg-[#eb527c] text-white'
                                : 'bg-[#691c32] text-white'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Simulated Audio Waveform */}
                          <div className="flex-1 flex items-center gap-0.5 h-7 px-2 bg-slate-950/60 rounded-xl">
                            {Array.from({ length: 18 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  playingAudioId === msg.id
                                    ? 'bg-sky-400 animate-pulse'
                                    : isMe
                                    ? 'bg-[#eb527c]'
                                    : 'bg-slate-600'
                                }`}
                                style={{
                                  height: `${Math.max(25, (Math.sin(i * 0.7) * 35 + 50))}%`,
                                }}
                              />
                            ))}
                          </div>

                          <span className="text-[11px] font-mono text-slate-300 font-semibold">
                            00:{((msg.duration_seconds || 4)).toString().padStart(2, '0')}s
                          </span>
                        </div>

                        {msg.content && (
                          <p className="text-[11px] text-slate-300 italic opacity-80">{msg.content}</p>
                        )}
                      </div>
                    )}

                    {/* 4. LOCATION CARD TYPE */}
                    {msg.type === 'location' && msg.location_data && (
                      <div className="space-y-2 min-w-[220px] sm:min-w-[260px]">
                        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group">
                          {/* Interactive map static preview */}
                          <div className="h-32 bg-slate-800 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 animate-bounce relative z-10">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div className="text-xs font-mono font-bold text-white mt-1 relative z-10">
                              {msg.location_data.latitude.toFixed(4)}, {msg.location_data.longitude.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono relative z-10 text-center truncate max-w-[220px]">
                              Pachuca de Soto, Hidalgo
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-900 border-t border-slate-800">
                            <div className="text-xs font-semibold text-white mb-0.5">
                              {msg.location_data.address || 'Ubicación GPS'}
                            </div>
                            <a
                              href={msg.location_data.map_url || `https://www.google.com/maps?q=${msg.location_data.latitude},${msg.location_data.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#eb527c] hover:text-[#f47293] font-mono font-bold flex items-center gap-1 mt-1.5 transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Abrir en Google Maps</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          </div>
                        </div>

                        {msg.content && msg.content !== msg.location_data.address && (
                          <div className="text-xs text-slate-200">{msg.content}</div>
                        )}
                      </div>
                    )}

                    {/* 5. IMAGE EVIDENCE TYPE */}
                    {msg.type === 'image' && msg.media_url && (
                      <div className="space-y-1.5 min-w-[200px]">
                        <div
                          onClick={() => setLightboxMedia({ url: msg.media_url!, type: 'image', caption: msg.content })}
                          className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group cursor-pointer"
                        >
                          <img
                            src={msg.media_url}
                            alt="Evidencia"
                            className="w-full max-h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1 bg-slate-900/90 text-white rounded-lg text-xs font-mono flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> Ver completa
                            </span>
                          </div>
                        </div>

                        {msg.content && (
                          <div className="text-xs text-slate-200 mt-1">{msg.content}</div>
                        )}
                      </div>
                    )}

                    {/* 6. VIDEO REPORT TYPE */}
                    {msg.type === 'video' && msg.media_url && (
                      <div className="space-y-1.5 min-w-[220px]">
                        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          <video
                            src={msg.media_url}
                            controls
                            className="w-full max-h-64 object-cover bg-black"
                          />
                        </div>
                        {msg.content && (
                          <div className="text-xs text-slate-200 mt-1">{msg.content}</div>
                        )}
                      </div>
                    )}

                    {/* Message Timestamp & Delivery Status Icon */}
                    <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-mono text-slate-400">
                      <span>{(msg.created_at || '').slice(11, 16) || 'Ahora'}</span>

                      {isMe && (
                        <span>
                          {msg.status === 'offline_queued' || msg.is_offline_pending ? (
                            <span title="Pendiente en cola fuera de línea" className="text-amber-400">
                              <Clock className="w-3 h-3 inline" />
                            </span>
                          ) : msg.status === 'sent' ? (
                            <span title="Enviado" className="text-slate-400">
                              <Check className="w-3 h-3 inline" />
                            </span>
                          ) : (
                            <span title="Entregado y recibido" className="text-emerald-400">
                              <CheckCheck className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedMessages.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-2.5">
                  <MessageSquare className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin mensajes en esta conversación
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Escribe un mensaje de texto o presiona el botón de micrófono para enviar la primera nota de voz.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT ATTACHMENT POPOVER */}
          {showAttachMenu && (
            <div className="absolute bottom-16 left-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-30 animate-fadeIn grid grid-cols-2 gap-1.5 w-64">
              <button
                type="button"
                onClick={() => {
                  sendLocationMessage();
                  setShowAttachMenu(false);
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-[#8a1a36]/50 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <MapPin className="w-4 h-4 text-[#8a1a36] dark:text-[#eb527c]" />
                <div>
                  <div className="font-bold text-white">Ubicación GPS</div>
                  <div className="text-[9px] text-slate-400 font-mono">Posición C5i</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaUploadType('image');
                  fileInputRef.current?.click();
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-[#8a1a36]/40 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <ImageIcon className="w-4 h-4 text-[#eb527c]" />
                <div>
                  <div className="font-bold text-white">Foto Evidencia</div>
                  <div className="text-[9px] text-slate-400 font-mono">Imagen / Cámara</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaUploadType('video');
                  fileInputRef.current?.click();
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-[#8a1a36]/40 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <Video className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-white">Video Reporte</div>
                  <div className="text-[9px] text-slate-400 font-mono">CCTV / Grabación</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sendEmergencyAlert('Código Rojo solicitado por unidad', 'Sector Central Pachuca');
                  setShowAttachMenu(false);
                }}
                className="p-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-bold text-rose-200">Alerta 10-33</div>
                  <div className="text-[9px] text-rose-300/80 font-mono">Prioridad 1</div>
                </div>
              </button>
            </div>
          )}

          {/* Hidden File Input for Image/Video Picking */}
          <input
            ref={fileInputRef}
            type="file"
            accept={mediaUploadType === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFilePicked}
            className="hidden"
          />

          {/* CHAT INPUT BAR */}
          <div className="bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 z-20 backdrop-blur-md shrink-0">
            {/* When actively recording a voice note */}
            {isRecordingVoice ? (
              <div className="flex items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-600/80 rounded-2xl p-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white">
                    <Mic className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-800 dark:text-rose-200">
                    GRABANDO NOTA DE VOZ: 00:{recordingSeconds.toString().padStart(2, '0')}s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStopVoiceRecord(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-300 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStopVoiceRecord(false)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Audio</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Message Input Bar */
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                {/* Attachment Button */}
                <button
                  id="btn-chat-attach"
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Adjuntar ubicación, foto o video"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Message Input Field */}
                <div className="flex-1 relative flex items-center">
                  <input
                    id="input-chat-text"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe un mensaje de radio..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8a1a36] dark:focus:border-[#eb527c] focus:ring-1 focus:ring-[#8a1a36]/20"
                  />
                </div>

                {/* Send or Voice Record Button */}
                {inputText.trim() ? (
                  <button
                    id="btn-chat-send"
                    type="submit"
                    className="p-3 bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white rounded-xl shadow-lg shadow-[#691c32]/20 transition-all cursor-pointer"
                    title="Enviar mensaje"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    id="btn-chat-record-audio"
                    type="button"
                    onClick={handleStartVoiceRecord}
                    className="p-3 bg-slate-100 hover:bg-[#691c32] hover:text-white active:bg-[#541224] border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-[#8a1a36] dark:text-[#eb527c] rounded-xl shadow-md transition-all cursor-pointer"
                    title="Grabar nota de voz policial"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            )}
          </div>
        </>
      )}
    </div>
  </div>

      {/* LIGHTBOX MODAL FOR IMAGES / VIDEOS */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-[#eb527c]">
                EVIDENCIA VISUAL C5i HIDALGO
              </span>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center max-h-[70vh] overflow-hidden rounded-xl bg-black">
              {lightboxMedia.type === 'image' ? (
                <img
                  src={lightboxMedia.url}
                  alt="Visualización ampliada"
                  className="max-h-[68vh] max-w-full object-contain"
                />
              ) : (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-h-[68vh] max-w-full"
                />
              )}
            </div>

            {lightboxMedia.caption && (
              <div className="pt-3 text-xs text-slate-300 font-mono">
                {lightboxMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE CALL MODAL (VOICE & VIDEO) */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Ambient pulse background */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#691c32]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg bg-slate-800 flex items-center justify-center text-2xl font-bold text-emerald-400">
                {activeContact?.contact_user?.avatar_url ? (
                  <img
                    src={activeContact.contact_user.avatar_url}
                    alt={targetName}
                    className="w-full h-full object-cover"
                  />
                ) : mode === 'channel' ? (
                  <Radio className="w-10 h-10 text-[#eb527c]" />
                ) : (
                  (targetName || 'C').charAt(0)
                )}
              </div>
              {activeCall.status === 'calling' && (
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
              )}
            </div>

            {/* Contact Name */}
            <h3 className="text-lg font-bold text-white mb-1">{targetName}</h3>
            <p className="text-xs font-mono text-slate-400 mb-4">
              {activeCall.status === 'calling' ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <PhoneCall className="w-3.5 h-3.5" /> Llamando...
                </span>
              ) : (
                <span className="text-slate-300">
                  {activeCall.type === 'video' ? 'Videollamada encriptada' : 'Llamada de voz'} •{' '}
                  {Math.floor(activeCall.duration / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(activeCall.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </p>

            {/* Video preview dummy screen if video call is active */}
            {activeCall.type === 'video' && activeCall.status === 'connected' && (
              <div className="w-full h-32 bg-slate-950 rounded-2xl border border-slate-800 mb-5 relative overflow-hidden flex items-center justify-center">
                {activeCall.isVideoOff ? (
                  <span className="text-xs text-slate-500 font-mono">Cámara desactivada</span>
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-[11px] font-mono text-emerald-400/80">Canal de video HD activo</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-2">
              {/* Mute Mic */}
              <button
                type="button"
                onClick={() => setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))}
                className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                  activeCall.isMuted
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title={activeCall.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition-all transform active:scale-95 cursor-pointer"
                title="Finalizar llamada"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Toggle Video if video call */}
              {activeCall.type === 'video' && (
                <button
                  type="button"
                  onClick={() => setActiveCall((prev) => (prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null))}
                  className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                    activeCall.isVideoOff
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title={activeCall.isVideoOff ? 'Activar cámara' : 'Apagar cámara'}
                >
                  {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP STYLE CONTACT / CHANNEL INFO MODAL */}
      <ContactInfoModal
        isOpen={showContactInfoModal}
        onClose={() => setShowContactInfoModal(false)}
        mode={mode}
        activeContact={activeContact}
        activeChannel={activeChannel}
        messages={messages}
        onStartCall={handleStartCall}
        onSearchInChat={() => setShowChatSearch(true)}
      />

      {/* NEW CONVERSATION DIRECT CONTACT MODAL */}
      <NewConversationModal
        isOpen={isNewConversationOpen}
        onClose={() => setIsNewConversationOpen(false)}
        contacts={contacts}
        onSelectContact={(contact) => {
          handleStartChatWithContact(contact);
        }}
        onOpenCreateContact={() => {
          setIsNewConversationOpen(false);
          setIsCreateContactOpen(true);
        }}
      />

      {/* CREATE NEW CONTACT MODAL */}
      <CreateContactModal
        isOpen={isCreateContactOpen}
        onClose={() => setIsCreateContactOpen(false)}
        onContactCreated={(newContact) => {
          handleStartChatWithContact(newContact);
        }}
      />
    </div>
  );
};
