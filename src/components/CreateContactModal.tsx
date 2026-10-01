import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  Camera,
  Phone,
  Mail,
  Shield,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { Contact } from '../types';
import { createCustomContactApi } from '../api/radioApi';

export interface CountryCode {
  name: string;
  code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
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

export interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contact: Contact) => void;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onContactCreated,
}) => {
  const { user } = useAuth();
  const { refreshContacts } = useRadio();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [email, setEmail] = useState('');
  const [callsign, setCallsign] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

    setIsSubmitting(true);
    setFormError('');

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
      resetForm();
      onContactCreated?.(newContact);
      onClose();
    } catch (err: any) {
      setFormError('Error al guardar el contacto. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#131923] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100 animate-scaleUp">
        {/* Modal Top Bar with Circular Buttons */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
            Nuevo Contacto
          </h3>

          <button
            type="button"
            onClick={() => handleCreateContact()}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white flex items-center justify-center font-bold shadow-md shadow-[#691c32]/20 transition-all cursor-pointer disabled:opacity-50"
            title="Guardar Contacto"
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleCreateContact} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Photo Upload Avatar Circle */}
          <div className="flex flex-col items-center justify-center py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group"
              title="Toca para seleccionar o tomar foto"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#8a1a36] dark:border-[#eb527c] shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border-2 border-[#8a1a36]/40 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] font-bold text-2xl shadow-sm group-hover:border-[#eb527c] transition-colors">
                  {firstName.trim() ? (
                    firstName.trim().charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="w-9 h-9 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
              )}
              {/* Camera Icon Badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#691c32] hover:bg-[#8a1a36] text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-medium text-[#8a1a36] dark:text-[#eb527c] hover:underline cursor-pointer"
              >
                {avatarUrl ? 'Cambiar foto' : 'Agregar foto (opcional)'}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-slate-400 text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-[11px] text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    Quitar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group 1: Names */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60">
            <div className="px-4 py-3">
              <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Nombre(s) *</label>
              <input
                id="input-contact-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Juan Carlos"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="px-4 py-3">
              <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Apellidos (Opcional)</label>
              <input
                id="input-contact-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Perez Hernandez"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Group 2: Phone with Selectable Country LADA Code */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden relative">
            <div
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900/60 cursor-pointer transition-colors"
            >
              <span className="font-mono">País / Región</span>
              <div className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
                <span className="text-[#8a1a36] dark:text-[#eb527c] font-mono text-[11px]">({selectedCountry.code})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {showCountryDropdown && (
              <div className="max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50 shadow-inner">
                {COUNTRY_CODES.map((country) => (
                  <button
                    key={`${country.name}-${country.code}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country);
                      setShowCountryDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      selectedCountry.name === country.name
                        ? 'bg-[#691c32]/10 dark:bg-[#691c32]/30 text-[#8a1a36] dark:text-[#eb527c] font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{country.code}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="px-4 py-3 flex items-center gap-3">
              <div className="text-xs font-mono text-[#8a1a36] dark:text-[#eb527c] font-bold bg-[#691c32]/10 dark:bg-[#691c32]/25 border border-[#691c32]/30 dark:border-[#8a1a36]/40 px-2 py-1 rounded-lg shrink-0">
                {selectedCountry.code}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Número de Teléfono</label>
                <input
                  id="input-contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="771 123 4567"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
              </div>
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Group 3: Email & Callsign */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Correo Electrónico (Opcional)</label>
                <input
                  id="input-contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@c5i.gob.mx"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
              </div>
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-0.5">Indicativo de Radio (Callsign) (Opcional)</label>
                <input
                  id="input-contact-callsign"
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="Ej. PATRULLA-302 o ALFA-01"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#691c32] hover:bg-[#8a1a36] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-white stroke-[2.5]" />
              <span className="text-white">{isSubmitting ? 'Guardando...' : 'Registrar Contacto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
