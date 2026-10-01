import React from 'react';
import {
  X,
  Users,
  Radio,
  Shield,
  Circle,
  Plus,
} from 'lucide-react';
import { User, Channel, Contact } from '../types';

interface ChannelMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  currentUser: User | null;
  contacts: Contact[];
  onOpenChannels?: () => void;
  onOpenContacts?: () => void;
}

export const ChannelMembersModal: React.FC<ChannelMembersModalProps> = ({
  isOpen,
  onClose,
  channel,
  currentUser,
  contacts,
  onOpenChannels,
  onOpenContacts,
}) => {
  if (!isOpen) return null;

  // Build the list of active members inside this channel
  // 1. Current user (owner/operator)
  // 2. Any contacts in the user's phonebook that belong to or are connected to the channel
  const membersList: Array<{
    id: string;
    name: string;
    callsign: string;
    role: string;
    unit?: string;
    status: 'online' | 'offline' | 'transmitting';
    isMe: boolean;
  }> = [];

  if (currentUser) {
    membersList.push({
      id: currentUser.id,
      name: `${currentUser.name} (Tú)`,
      callsign: currentUser.callsign || 'OPERADOR-1',
      role: channel && String(channel.created_by) === String(currentUser.id) ? 'Creador / Administrador' : 'Operador',
      unit: currentUser.unit || 'Sector Táctico C5i',
      status: 'online',
      isMe: true,
    });
  }

  // Add contacts associated with the user
  contacts.forEach((contact) => {
    const contactUser = contact.contact_user;
    const name = contact.alias || contactUser?.name || 'Oficial C5i';
    const callsign = contactUser?.callsign || `C5-${contact.id.slice(-3).toUpperCase()}`;
    const unit = contactUser?.unit || 'Unidad Operativa';
    const status = contactUser?.status || 'online';

    // Evitar duplicar a sí mismo si estuviera en contactos
    if (currentUser && (contact.contact_user_id === currentUser.id || contact.user_id === contactUser?.id && contactUser?.id === currentUser.id)) {
      return;
    }

    membersList.push({
      id: contact.id,
      name,
      callsign,
      role: 'Oficial Conectado',
      unit,
      status,
      isMe: false,
    });
  });

  return (
    <div
      id="channel-members-floating-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn transition-colors duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-800 dark:text-slate-100 animate-scaleUp transition-colors duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0c121e]/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#691c32]/10 border border-[#8a1a36]/25 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {channel ? channel.name : 'Canal Táctico'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                <span>{membersList.length} {membersList.length === 1 ? 'usuario activo' : 'usuarios activos'}</span>
                <span>•</span>
                <span className="capitalize">{channel?.category || 'General'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-members-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
          {membersList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay usuarios en este canal en este momento.
            </div>
          ) : (
            membersList.map((member) => (
              <div
                key={member.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  member.isMe
                    ? 'bg-[#691c32]/5 dark:bg-[#200911]/50 border-[#eb527c]/40 dark:border-[#8a1a36]/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0c121e]/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#101726] ${
                        member.status === 'transmitting'
                          ? 'bg-rose-500 animate-pulse'
                          : member.status === 'online'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      title={member.status}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.name}
                      </span>
                      {member.isMe && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#691c32] text-[9px] font-bold text-white tracking-wider">
                          TÚ
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="text-[#8a1a36] dark:text-[#eb527c] font-semibold">{member.callsign}</span>
                      <span>•</span>
                      <span className="truncate">{member.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {member.role}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0c121e] flex items-center justify-between gap-2">
          {onOpenContacts && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenContacts();
              }}
              className="text-xs font-semibold text-[#8a1a36] dark:text-[#eb527c] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gestionar Contactos</span>
            </button>
          )}

          <button
            type="button"
            id="btn-close-members-modal-action"
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
