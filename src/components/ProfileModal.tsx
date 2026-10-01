import React, { useState, useRef } from 'react';
import {
  ChevronRight,
  LogOut,
  Camera,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SettingsView } from './SettingsView';

interface ProfileModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onOpenApiSettings?: () => void;
  onOpenSosModal?: () => void;
  isInline?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
}) => {
  const { user, logout, updateUserProfile, deleteAccount } = useAuth();
  const { themeMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sub-view: 'profile' | 'settings'
  const [currentView, setCurrentView] = useState<'profile' | 'settings'>('profile');

  // Quick edit modal state for individual fields (Nombre, Indicativo, etc.)
  const [editingField, setEditingField] = useState<'name' | 'callsign' | 'unit' | 'correo' | null>(null);
  const [editValue, setEditValue] = useState('');

  // Delete account confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen && !isInline) return null;

  if (currentView === 'settings') {
    const settingsContent = <SettingsView onBack={() => setCurrentView('profile')} />;
    if (isInline) {
      return settingsContent;
    }
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
        {settingsContent}
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    await deleteAccount(user.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUserProfile({ avatar_url: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenFieldEdit = (field: 'name' | 'callsign' | 'unit' | 'correo') => {
    if (!user) return;
    setEditingField(field);
    if (field === 'name') setEditValue(user.name || '');
    if (field === 'callsign') setEditValue(user.callsign || '');
    if (field === 'unit') setEditValue(user.unit || '');
    if (field === 'correo') setEditValue(user.correo || '');
  };

  const handleSaveFieldEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingField || !user) return;

    if (editingField === 'name') {
      updateUserProfile({ name: editValue.trim() || user.name });
    } else if (editingField === 'callsign') {
      updateUserProfile({ callsign: editValue.trim() || user.callsign });
    } else if (editingField === 'unit') {
      updateUserProfile({ unit: editValue.trim() || user.unit });
    } else if (editingField === 'correo') {
      updateUserProfile({ correo: editValue.trim() });
    }

    setEditingField(null);
  };

  const getFieldTitle = (field: 'name' | 'unit' | 'correo') => {
    switch (field) {
      case 'name':
        return 'Nombre';
      case 'unit':
        return 'Unidad / Sector';
      case 'correo':
        return 'Correo institucional';
    }
  };

  const content = (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#070c16] text-slate-900 dark:text-slate-100 min-h-0 relative select-none overflow-y-auto transition-colors duration-200">
      {/* Top Header: Only "Perfil" centered, without back button */}
      <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center shrink-0 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
        <h1 className="text-base sm:text-lg md:text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
          Perfil
        </h1>
      </div>

      {/* Main Profile Body: Generous width and comfortable scaling on laptop */}
      <div className="flex-1 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-8 md:px-12 pt-1 md:pt-4 pb-14 flex flex-col items-center">
        {/* Hidden File Input for Mobile Camera / Gallery / Laptop */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Hero Avatar Section */}
        <div className="flex flex-col items-center justify-center mb-6 md:mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer group"
            title="Toca para cambiar foto"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover border-3 sm:border-4 md:border-5 border-[#8a1a36]/40 shadow-xl dark:shadow-2xl shadow-sky-900/20 dark:shadow-[#290812]/80 transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-[#691c32]/20 via-slate-200 to-slate-300 dark:via-slate-800 dark:to-slate-900 border-3 sm:border-4 md:border-5 border-[#eb527c]/40 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] font-bold text-5xl sm:text-6xl md:text-7xl shadow-xl dark:shadow-2xl shadow-sky-900/20 dark:shadow-[#290812]/80 group-hover:border-[#8a1a36] transition-colors">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Camera Badge */}
            <div className="absolute bottom-1 right-1 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-[#691c32] hover:bg-[#8a1a36] text-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
              <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
            </div>
          </div>

          {/* Name Only */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-3 md:mt-4 text-center tracking-tight">
            {user?.name || 'Oficial C5i'}
          </h2>
        </div>

        {/* Grouped iOS-style Settings Card: Expansive and comfortable on laptop */}
        <div className="w-full bg-white dark:bg-[#111927] border border-slate-200 dark:border-slate-800/80 rounded-3xl md:rounded-[2rem] overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60 shadow-md dark:shadow-2xl mb-6 md:mb-8 transition-colors">
          {/* 1. Nombre */}
          <div
            onClick={() => handleOpenFieldEdit('name')}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
          >
            <span className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
              Nombre
            </span>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-xs md:max-w-md lg:max-w-lg group-hover:text-slate-800 dark:group-hover:text-slate-300">
                {user?.name || 'Oficial C5i'}
              </span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 shrink-0" />
            </div>
          </div>

          {/* 2. Rol Operativo */}
          <div className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 flex items-center justify-between">
            <span className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
              Rol
            </span>
            <span className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400">
              {user?.role || 'Oficial Operativo'}
            </span>
          </div>

          {/* 3. Unidad / Sector */}
          <div
            onClick={() => handleOpenFieldEdit('unit')}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
          >
            <span className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
              Unidad / Sector
            </span>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-xs md:max-w-md lg:max-w-lg group-hover:text-slate-800 dark:group-hover:text-slate-300">
                {user?.unit || 'Sector Central C5i'}
              </span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 shrink-0" />
            </div>
          </div>

          {/* 4. Número de teléfono */}
          <div className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 flex items-center justify-between">
            <span className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
              Número de teléfono
            </span>
            <span className="text-xs sm:text-sm md:text-base font-mono text-slate-600 dark:text-slate-300">
              {user?.phone_number || '+52 771 000 0000'}
            </span>
          </div>

          {/* 5. Correo institucional */}
          <div
            onClick={() => handleOpenFieldEdit('correo')}
            className="p-3.5 sm:p-4.5 md:p-5 lg:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
          >
            <span className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
              Correo institucional
            </span>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-xs md:max-w-md lg:max-w-lg group-hover:text-slate-800 dark:group-hover:text-slate-300">
                {user?.correo || 'No registrado'}
              </span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* NUEVA OPCIÓN: CONFIGURACIÓN Y AJUSTES */}
        <div className="w-full bg-white dark:bg-[#111927] border border-slate-200 dark:border-slate-800/80 rounded-3xl md:rounded-[2rem] overflow-hidden shadow-md dark:shadow-2xl mb-6 md:mb-8 transition-colors">
          <button
            id="btn-profile-settings"
            type="button"
            onClick={() => setCurrentView('settings')}
            className="w-full p-4 sm:p-5 md:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#691c32]/10 dark:bg-[#691c32]/20 border border-[#8a1a36]/30 flex items-center justify-center text-[#8a1a36] dark:text-[#eb527c] group-hover:scale-105 transition-transform shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#8a1a36] dark:group-hover:text-[#eb527c] transition-colors">
                    Configuración y Ajustes
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  Tema (Claro / Oscuro / Sistema), notificaciones, audio PTT y seguridad
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex text-xs font-mono px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {themeMode === 'system' ? 'Tema: Sistema' : themeMode === 'light' ? 'Tema: Claro' : 'Tema: Oscuro'}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>

        {/* Logout Button: Roomy on laptop */}
        <button
          id="btn-profile-logout"
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full py-3.5 sm:py-4 md:py-4.5 px-6 rounded-2xl md:rounded-3xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md dark:shadow-lg"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
          <span>Cerrar sesión</span>
        </button>

        {/* Delete Account Button: At the very end of profile */}
        <button
          id="btn-profile-delete-account"
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full mt-3 py-3 sm:py-3.5 px-6 rounded-2xl md:rounded-3xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>Eliminar cuenta</span>
        </button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121926] border border-rose-900/60 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 text-slate-100 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar tu cuenta?</h3>
                <p className="text-[11px] text-rose-400 font-mono">Acción irreversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción eliminará de forma permanente tu perfil, indicativo táctico (<strong className="text-white">{user?.callsign}</strong>), credenciales y registros de radio en el C5i de Hidalgo.
            </p>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Edit Modal (allows user to update their name, callsign, or email directly) */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121926] border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-white">
                Editar {getFieldTitle(editingField)}
              </h3>
              <button
                type="button"
                onClick={handleSaveFieldEdit}
                className="w-8 h-8 rounded-full bg-[#691c32] hover:bg-[#8a1a36] text-slate-950 flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
                title="Guardar"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldEdit} className="p-5">
              <label className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                {getFieldTitle(editingField)}
              </label>
              <input
                type={editingField === 'correo' ? 'email' : 'text'}
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#eb527c]"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {content}
    </div>
  );
};
