import React, { useState } from 'react';
import {
  X,
  Search,
  UserPlus,
  User as UserIcon,
  Phone,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { Contact } from '../types';

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onOpenCreateContact: () => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSelectContact,
  onOpenCreateContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    const name = (c.contact_user?.name || c.alias || '').toLowerCase();
    const callsign = (c.contact_user?.callsign || '').toLowerCase();
    const phone = (c.contact_user?.phone_number || '').toLowerCase();
    return name.includes(term) || callsign.includes(term) || phone.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#131923] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#691c32]/10 dark:bg-[#691c32]/25 border border-[#691c32]/30 dark:border-[#8a1a36]/40 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Nueva Conversación
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona un contacto para chatear
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Nuevo Contacto */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateContact();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#691c32] hover:bg-[#8a1a36] active:bg-[#541224] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span className="text-white">+ Registrar Nuevo Contacto</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, indicativo o teléfono..."
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 min-h-[220px]">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                <UserIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {contacts.length === 0 ? 'Sin contactos registrados' : 'No se encontraron contactos'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                {contacts.length === 0
                  ? 'Agrega a tu primer oficial o contacto para iniciar una conversación encriptada.'
                  : 'Prueba con otro término de búsqueda.'}
              </p>
              {contacts.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateContact();
                  }}
                  className="mt-3.5 px-3 py-1.5 rounded-lg bg-[#691c32] hover:bg-[#8a1a36] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  + Agregar Contacto
                </button>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const displayName = contact.contact_user?.name || contact.alias || 'Contacto C5i';
              const callsign = contact.contact_user?.callsign;
              const phone = contact.contact_user?.phone_number;
              const avatar = contact.contact_user?.avatar_url;
              const isOnline = contact.contact_user?.status === 'online';

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onSelectContact(contact)}
                  className="w-full text-left p-3 sm:px-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm">
                      {avatar ? (
                        <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    {/* Status dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#131923] ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </h4>
                      {callsign && (
                        <span className="text-[10px] font-mono text-[#8a1a36] dark:text-[#eb527c] font-bold shrink-0">
                          {callsign}
                        </span>
                      )}
                    </div>
                    {phone && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>{phone}</span>
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
