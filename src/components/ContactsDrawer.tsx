import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Radio,
  Shield,
  Mail,
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Trash2,
  Check,
  PhoneOff,
  Camera,
  User as UserIcon,
  X,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { Contact, User } from '../types';
import { createCustomContactApi, updateContactApi, deleteContactApi } from '../api/radioApi';
import { soundEngine } from '../utils/audioEffects';
import { CreateContactModal } from './CreateContactModal';

interface ContactsDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  isInline?: boolean;
  onSelectContactDirect?: (c: Contact) => void;
  onOpenChatWithContact?: (c: Contact) => void;
  onOpenSosModal?: () => void;
}

interface CountryCode {
  name: string;
  code: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { name: 'México', code: '+52', flag: '🇲🇽' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { name: 'Canadá', code: '+1', flag: '🇨🇦' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Perú', code: '+51', flag: '🇵🇪' },
  { name: 'España', code: '+34', flag: '🇪🇸' },
  { name: 'Brasil', code: '+55', flag: '🇧🇷' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { name: 'Panamá', code: '+507', flag: '🇵🇦' },
  { name: 'Rep. Dominicana', code: '+1-809', flag: '🇩🇴' },
];

export const ContactsDrawer: React.FC<ContactsDrawerProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  onSelectContactDirect,
  onOpenChatWithContact,
  onOpenSosModal,
}) => {
  const { user } = useAuth();
  const { contacts, activeContact, setActiveContact, setMode, refreshContacts } = useRadio();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Selected contact for detailed iOS-style profile view
  const [selectedDetailContact, setSelectedDetailContact] = useState<Contact | null>(null);

  // Edit contact modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCallsign, setEditCallsign] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editError, setEditError] = useState('');
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Call state (voice or video)
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    status: 'calling' | 'connected';
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // New Contact Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [email, setEmail] = useState('');
  const [callsign, setCallsign] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  if (!isOpen && !isInline) return null;

  // Keep selectedDetailContact in sync with updated contacts list
  const currentDetailContact = selectedDetailContact
    ? contacts.find((c) => c.id === selectedDetailContact.id) || selectedDetailContact
    : null;

  const filteredContacts = contacts.filter((c) => {
    const name = c.contact_user?.name || c.alias || '';
    const phoneNum = c.contact_user?.phone_number || '';
    const callsignVal = c.contact_user?.callsign || '';
    const emailVal = c.contact_user?.correo || '';
    const search = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(search) ||
      phoneNum.toLowerCase().includes(search) ||
      callsignVal.toLowerCase().includes(search) ||
      emailVal.toLowerCase().includes(search)
    );
  });

  const handleSelectContactForPTT = (c: Contact) => {
    setActiveContact(c);
    setMode('direct');
    if (onSelectContactDirect) {
      onSelectContactDirect(c);
    }
  };

  const handleOpenChat = (c: Contact) => {
    setActiveContact(c);
    setMode('direct');
    if (onOpenChatWithContact) {
      onOpenChatWithContact(c);
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
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

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setSelectedCountry(COUNTRY_CODES[0]);
    setShowCountryDropdown(false);
    setEmail('');
    setCallsign('');
    setAvatarUrl('');
    setFormError('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!firstName.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setFormError('Ingresa al menos un número telefónico o correo electrónico.');
      return;
    }

    try {
      const fullPhone = phone.trim()
        ? `${selectedCountry.code} ${phone.trim()}`
        : `${selectedCountry.code} 771${Math.floor(1000000 + Math.random() * 9000000)}`;

      const newContact = await createCustomContactApi(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        email: email.trim(),
        callsign: callsign.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });

      await refreshContacts();
      setShowAddModal(false);
      resetForm();
      // Automatically open the detail view of the new contact
      setSelectedDetailContact(newContact);
    } catch (err) {
      setFormError('Error al guardar el contacto. Intenta de nuevo.');
    }
  };

  const handleOpenEdit = () => {
    if (!currentDetailContact) return;
    const rawName = currentDetailContact.contact_user?.name || currentDetailContact.alias || '';
    const parts = rawName.split(' ');
    setEditFirstName(parts[0] || '');
    setEditLastName(parts.slice(1).join(' ') || '');
    setEditPhone(currentDetailContact.contact_user?.phone_number || '');
    setEditEmail(currentDetailContact.contact_user?.correo || '');
    setEditCallsign(currentDetailContact.contact_user?.callsign || '');
    setEditAvatarUrl(currentDetailContact.contact_user?.avatar_url || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentDetailContact) return;

    if (!editFirstName.trim()) {
      setEditError('El nombre es obligatorio.');
      return;
    }

    try {
      const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
      await updateContactApi(currentDetailContact.id, {
        name: fullName,
        alias: fullName,
        phone_number: editPhone.trim(),
        correo: editEmail.trim(),
        callsign: editCallsign.trim() || undefined,
        avatar_url: editAvatarUrl || undefined,
      });

      await refreshContacts();
      setShowEditModal(false);
    } catch (err) {
      setEditError('Error al actualizar el contacto.');
    }
  };

  const handleDeleteContact = async () => {
    if (!currentDetailContact) return;
    if (window.confirm('¿Estás seguro de eliminar este contacto de tu agenda?')) {
      await deleteContactApi(currentDetailContact.id);
      await refreshContacts();
      setShowEditModal(false);
      setSelectedDetailContact(null);
    }
  };

  const handleCellularCall = (rawPhone: string) => {
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // -------------------------------------------------------------
  // DETAIL PROFILE VIEW (Exact match to Beto🐣.png)
  // -------------------------------------------------------------
  if (currentDetailContact) {
    const contactUser = currentDetailContact.contact_user;
    const displayName = currentDetailContact.alias || contactUser?.name || 'Contacto C5i';
    const displayPhone = contactUser?.phone_number || 'Sin número registrado';
    const displayEmail = contactUser?.correo || 'Sin correo registrado';
    const displayCallsign = contactUser?.callsign || 'RADIO-104';

    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-gradient-to-b dark:from-[#102035] dark:via-[#0b1424] dark:to-[#070c16] text-slate-900 dark:text-slate-100 overflow-y-auto animate-fadeIn relative transition-colors duration-200">
        {/* Top Navigation Bar: Back arrow on left, SOS & Edit on right */}
        <div className="p-3.5 sm:p-5 md:p-6 flex items-center justify-between shrink-0 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
          <button
            type="button"
            onClick={() => setSelectedDetailContact(null)}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            title="Regresar a contactos"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 -ml-0.5" />
          </button>

          <div className="flex items-center gap-2">
            {onOpenSosModal && (
              <button
                type="button"
                onClick={onOpenSosModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/90 dark:to-red-900/90 border border-rose-500/60 dark:border-rose-600/60 text-white dark:text-rose-200 text-xs font-bold hover:from-rose-500 hover:to-red-600 dark:hover:bg-rose-900 transition-all cursor-pointer shadow-md active:scale-95 animate-pulse"
                title="Llamada de Emergencia / Transmitir Alerta SOS"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-white dark:text-rose-400 fill-white/20 dark:fill-rose-500/20" />
                <span>SOS</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white font-semibold text-xs sm:text-sm md:text-base transition-all cursor-pointer shadow-sm"
            >
              <span className="text-white">Editar</span>
            </button>
          </div>
        </div>

        {/* Hero Section: Avatar, Name, and Single-line Callsign */}
        <div className="flex flex-col items-center justify-center px-4 pt-1 md:pt-4 pb-4 md:pb-6">
          <div className="relative mb-3 md:mb-4 group">
            {contactUser?.avatar_url ? (
              <img
                src={contactUser.avatar_url}
                alt={displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover border-3 sm:border-4 md:border-5 border-[#eb527c]/40 shadow-xl dark:shadow-2xl shadow-[#691c32]/10 dark:shadow-[#290812]/80 transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300 dark:from-[#691c32]/30 dark:via-slate-800 dark:to-slate-900 border-3 sm:border-4 md:border-5 border-[#eb527c]/40 flex items-center justify-center text-[#691c32] dark:text-[#eb527c] font-bold text-4xl sm:text-5xl md:text-6xl shadow-xl dark:shadow-2xl shadow-[#691c32]/10 dark:shadow-[#290812]/80">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-center px-4">
            <span>{displayName}</span>
          </h1>

          {/* Callsign badge only */}
          <div className="flex items-center justify-center mt-1.5 md:mt-2 px-3 max-w-full">
            <span className="text-[10px] sm:text-xs md:text-sm font-mono text-[#691c32] dark:text-[#eb527c] bg-[#691c32]/10 dark:bg-[#290812]/90 border border-sky-200 dark:border-sky-800/70 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full font-bold whitespace-nowrap shrink-0 tracking-wide shadow-sm">
              {displayCallsign}
            </span>
          </div>
        </div>

        {/* 4 Action Buttons Bar */}
        <div className="flex items-center justify-center gap-3.5 sm:gap-5 md:gap-7 my-3 sm:my-4 md:my-6 px-4">
          {/* 1. Mensaje */}
          <button
            type="button"
            onClick={() => handleOpenChat(currentDetailContact)}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
            title="Enviar mensaje en Chat"
          >
            <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>

          {/* 2. Llamada de voz por red celular */}
          <button
            type="button"
            onClick={() => handleCellularCall(displayPhone)}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
            title="Llamar por red celular"
          >
            <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>

          {/* 3. Videollamada */}
          <button
            type="button"
            onClick={() => handleStartCall('video')}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
            title="Videollamada"
          >
            <Video className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>

          {/* 4. Correo */}
          <button
            type="button"
            onClick={() => {
              if (contactUser?.correo) {
                window.location.href = `mailto:${contactUser.correo}`;
              } else {
                handleCopy(displayName, 'correo');
              }
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
            title="Enviar correo"
          >
            <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>

        {/* Stacked Details Cards: Expansive and comfortable on laptop */}
        <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-8 md:px-12 space-y-2.5 sm:space-y-3.5 md:space-y-4 pb-12">
          {/* Card 1: Móvil / Red Celular */}
          <div
            onClick={() => handleCellularCall(displayPhone)}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-[#142032]/80 hover:bg-slate-50 dark:hover:bg-[#18263c] border border-slate-200 dark:border-sky-900/40 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div>
              <div className="text-[10px] sm:text-[11px] md:text-xs font-mono text-[#8a1a36] dark:text-[#eb527c]/80">móvil (red celular)</div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 dark:text-white mt-0.5 md:mt-1">
                {displayPhone}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(displayPhone, 'teléfono');
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Copiar número"
              >
                {copiedField === 'teléfono' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-[#691c32]/10 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] group-hover:bg-[#691c32] group-hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Correo Institucional */}
          <div
            onClick={() => {
              if (contactUser?.correo) {
                window.location.href = `mailto:${contactUser.correo}`;
              } else {
                handleCopy(displayEmail, 'correo');
              }
            }}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-[#142032]/80 hover:bg-slate-50 dark:hover:bg-[#18263c] border border-slate-200 dark:border-sky-900/40 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div className="min-w-0 pr-3">
              <div className="text-[10px] sm:text-[11px] md:text-xs font-mono text-[#8a1a36] dark:text-[#eb527c]/80">correo institucional</div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 dark:text-white mt-0.5 md:mt-1 truncate">
                {displayEmail}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-[#691c32]/10 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] group-hover:bg-[#691c32] group-hover:text-white transition-colors shrink-0">
              {copiedField === 'correo' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
            </div>
          </div>

          {/* Card 3: Indicativo de Radio (Callsign) */}
          <div
            onClick={() => handleCopy(displayCallsign, 'indicativo')}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-[#142032]/80 hover:bg-slate-50 dark:hover:bg-[#18263c] border border-slate-200 dark:border-sky-900/40 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div>
              <div className="text-[10px] sm:text-[11px] md:text-xs font-mono text-[#8a1a36] dark:text-[#eb527c]/80">indicativo de radio (callsign)</div>
              <div className="text-xs sm:text-sm md:text-base font-mono font-bold text-[#691c32] dark:text-[#f47293] mt-0.5 md:mt-1">
                {displayCallsign}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-[#691c32]/10 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] group-hover:bg-[#691c32] group-hover:text-white transition-colors">
              {copiedField === 'indicativo' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
            </div>
          </div>

          {/* Card 4: Walkie C5i / PTT Directo */}
          <div
            onClick={() => handleSelectContactForPTT(currentDetailContact)}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-r from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 dark:from-sky-950/60 dark:to-[#142032]/80 dark:hover:from-sky-900/70 border border-[#691c32]/30 dark:border-[#8a1a36]/40 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div>
              <div className="text-[10px] sm:text-[11px] md:text-xs font-mono text-[#691c32] dark:text-[#eb527c] font-semibold">Walkie C5i • Frecuencia Táctica</div>
              <div className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white mt-0.5 md:mt-1 flex items-center gap-2">
                <span>Canal Directo 1-a-1</span>
                <span className="text-[9px] sm:text-[10px] md:text-xs font-mono px-2 py-0.5 md:px-2.5 md:py-1 rounded-md bg-[#691c32] text-white font-bold shadow-sm">
                  Transmitir
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-[#691c32] flex items-center justify-center text-white font-bold shadow-md shadow-[#691c32]/30">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        {/* INTERACTIVE CALL MODAL (VOICE OR VIDEO) */}
        {activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
            <div className="bg-[#101826] border border-[#8a1a36]/30 rounded-3xl w-full max-w-sm p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden animate-scaleUp">
              {/* Background gradient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#691c32]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Call Type Badge */}
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#290812] border border-sky-800 text-[#f47293] mb-6 uppercase tracking-wider flex items-center gap-1.5">
                {activeCall.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                <span>{activeCall.type === 'video' ? 'Videollamada C5i' : 'Llamada de Voz PTT'}</span>
              </span>

              {/* Video preview container or Avatar */}
              {activeCall.type === 'video' ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-slate-900 border-2 border-[#8a1a36]/40 overflow-hidden relative mb-5 shadow-2xl flex items-center justify-center">
                  {activeCall.isVideoOff ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                      <VideoOff className="w-10 h-10" />
                      <span className="text-xs font-mono">Cámara desactivada</span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative bg-slate-800">
                      {contactUser?.avatar_url ? (
                        <img
                          src={contactUser.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sky-900/40 via-slate-900 to-slate-950 flex items-center justify-center text-[#eb527c] font-bold text-6xl">
                          {displayName.charAt(0)}
                        </div>
                      )}
                      {/* Video HUD Simulation */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE 1080p</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative mb-6">
                  {contactUser?.avatar_url ? (
                    <img
                      src={contactUser.avatar_url}
                      alt={displayName}
                      className="w-28 h-28 rounded-full object-cover border-4 border-[#eb527c] shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#290812] border-4 border-[#eb527c] flex items-center justify-center text-[#f47293] font-bold text-4xl shadow-xl">
                      {displayName.charAt(0)}
                    </div>
                  )}
                  {activeCall.status === 'calling' && (
                    <span className="absolute inset-0 rounded-full border-2 border-[#eb527c] animate-ping opacity-60 pointer-events-none" />
                  )}
                </div>
              )}

              {/* Contact Name & Status */}
              <h3 className="text-xl font-bold text-white mb-1">{displayName}</h3>
              <p className="text-xs font-mono text-[#eb527c] mb-6">
                {activeCall.status === 'calling' ? 'Conectando con la unidad...' : formatDuration(activeCall.duration)}
              </p>

              {/* In-Call Controls */}
              <div className="flex items-center justify-center gap-4">
                {/* Mute Mic Toggle */}
                <button
                  type="button"
                  onClick={() => setActiveCall((p) => p ? { ...p, isMuted: !p.isMuted } : null)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    activeCall.isMuted ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={activeCall.isMuted ? 'Activar micrófono' : 'Silenciar'}
                >
                  {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Video Toggle (if video call) */}
                {activeCall.type === 'video' && (
                  <button
                    type="button"
                    onClick={() => setActiveCall((p) => p ? { ...p, isVideoOff: !p.isVideoOff } : null)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      activeCall.isVideoOff ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={activeCall.isVideoOff ? 'Activar cámara' : 'Apagar cámara'}
                  >
                    {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
                  title="Finalizar llamada"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT CONTACT MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#131923] border border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scaleUp">
              {/* Modal Top Bar with Circular Native Buttons */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Editar Contacto
                </h3>
                <button
                  type="button"
                  onClick={() => handleSaveEdit()}
                  className="w-8 h-8 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center font-bold shadow-md shadow-[#691c32]/20 transition-all cursor-pointer"
                  title="Guardar Cambios"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium">
                    {editError}
                  </div>
                )}

                {/* Edit Photo Avatar Picker */}
                <div className="flex flex-col items-center justify-center py-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditPhotoSelect}
                  />
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="relative cursor-pointer group"
                    title="Toca para cambiar foto"
                  >
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#eb527c]/80 shadow-lg shadow-[#290812]/60"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-[#8a1a36]/40 flex items-center justify-center text-[#eb527c] font-bold text-2xl shadow-lg shadow-[#290812]/50 group-hover:border-[#eb527c] transition-colors">
                        {editFirstName.trim() ? editFirstName.trim().charAt(0).toUpperCase() : <UserIcon className="w-9 h-9 text-slate-500" />}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#691c32] hover:bg-[#8a1a36] text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-[11px] font-medium text-[#eb527c] hover:text-[#f47293] cursor-pointer"
                    >
                      {editAvatarUrl ? 'Cambiar foto' : 'Subir foto (opcional)'}
                    </button>
                    {editAvatarUrl && (
                      <>
                        <span className="text-slate-600 text-xs">•</span>
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Names */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                  <div className="px-4 py-3">
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Nombre(s) *</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Apellidos</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
                  <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Número de Teléfono</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Email & Callsign */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                  <div className="px-4 py-3">
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Correo Electrónico</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Indicativo de Radio (Callsign)</label>
                    <input
                      type="text"
                      value={editCallsign}
                      onChange={(e) => setEditCallsign(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    className="w-full py-2.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Contacto</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // CONTACTS LIST VIEW
  // -------------------------------------------------------------
  const drawerContent = (
    <div
      className={
        isInline
          ? 'w-full bg-slate-50 dark:bg-[#0b1320] h-full flex flex-col text-slate-900 dark:text-slate-100 min-h-0 relative transition-colors duration-200'
          : 'w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 animate-slideLeft transition-colors duration-200'
      }
    >
      {/* Header */}
      <div className="px-3.5 py-3 sm:p-5 sm:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-slate-950/70 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#691c32]/10 border border-[#8a1a36]/30 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] shrink-0">
            <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate whitespace-nowrap">
              <span className="sm:hidden">Contactos</span>
              <span className="hidden sm:inline">Unidades & Contactos</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Agrega compañeros con su numero telefonico para llamamadas directas y comunicacion
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenSosModal && (
            <button
              id="btn-contacts-sos"
              type="button"
              onClick={onOpenSosModal}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 dark:from-rose-950/90 dark:to-red-900/90 border border-rose-500/60 dark:border-rose-600/60 text-white dark:text-rose-200 text-xs font-bold hover:from-rose-500 hover:to-red-600 dark:hover:bg-rose-900 transition-all cursor-pointer shadow-sm active:scale-95 animate-pulse flex items-center justify-center gap-1 shrink-0"
              title="Llamada de Emergencia / Transmitir Alerta SOS"
            >
              <AlertTriangle className="w-4 h-4 text-white dark:text-rose-400 fill-white/20 dark:fill-rose-500/20" />
              <span className="hidden sm:inline">SOS</span>
            </button>
          )}

          {/* Quick Action: Icon on mobile, full text on desktop */}
          <button
            id="btn-desktop-add-contact"
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            title="Agregar Contacto"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span className="hidden sm:inline text-white">Agregar Contacto</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 shrink-0">
        <div className="relative flex items-center max-w-md">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            id="input-search-contacts"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, indicativo, teléfono o correo..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8a1a36]"
          />
        </div>
      </div>

      {/* Contacts List Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:px-8 space-y-3 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredContacts.map((ct) => {
            const contactUser = ct.contact_user;
            const isCurrent = activeContact?.id === ct.id;

            return (
              <div
                key={ct.id}
                onClick={() => setSelectedDetailContact(ct)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#691c32]/5 dark:bg-[#290812]/60 border-[#eb527c] dark:border-[#8a1a36]/80 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {contactUser?.avatar_url ? (
                      <img
                        src={contactUser.avatar_url}
                        alt={contactUser.name}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[#8a1a36] dark:text-[#eb527c] text-xs sm:text-sm">
                        {(contactUser?.name || ct.alias || 'U').charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
                        {ct.alias || contactUser?.name || 'Oficial C5i'}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] md:text-xs text-[#8a1a36] dark:text-[#eb527c] font-mono font-medium truncate whitespace-nowrap">
                      {contactUser?.callsign || contactUser?.phone_number || 'RADIO-104'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectContactForPTT(ct);
                  }}
                  className="w-8 h-8 sm:w-auto sm:px-3.5 sm:py-1.5 bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white text-xs sm:text-sm font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  title="Activar frecuencia PTT directa"
                >
                  <Radio className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline text-white">PTT</span>
                </button>
              </div>
            );
          })}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#691c32]/10 border border-[#8a1a36]/20 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] mb-3">
              <Users className="w-7 h-7 opacity-80" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 max-w-sm text-center">
              Agrega compañeros con su numero telefonico para llamamadas directas y comunicacion
            </p>
          </div>
        )}
      </div>

      {/* MODERN NATIVE-STYLE "NEW CONTACT" MODAL */}
      <CreateContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onContactCreated={(c) => setSelectedDetailContact(c)}
      />
    </div>
  );

  if (isInline) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-100 dark:bg-[#0b1320] overflow-hidden transition-colors duration-200">
        {drawerContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {drawerContent}
    </div>
  );
};
