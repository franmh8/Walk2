import React, { useState } from 'react';
import {
  Mic,
  Users,
  MessageSquare,
  BookOpen,
  User as UserIcon,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { RadioProvider } from './context/RadioContext';
import { ChatProvider } from './context/ChatContext';
import { LoginScreen } from './components/LoginScreen';
import { RadioMainScreen } from './components/RadioMainScreen';
import { WhatsAppChat } from './components/WhatsAppChat';
import { ChannelsDrawer } from './components/ChannelsDrawer';
import { ContactsDrawer } from './components/ContactsDrawer';
import { VoiceHistoryDrawer } from './components/VoiceHistoryDrawer';
import { SosAlertModal } from './components/SosAlertModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ProfileModal } from './components/ProfileModal';
import { AutoSyncBanner } from './components/AutoSyncBanner';

type TabType = 'ptt' | 'grupos' | 'chat' | 'contactos' | 'perfil';

function MainAppContent() {
  const { user, loading } = useAuth();

  // Stable 5-Tab Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('ptt');
  const [chatTabKey, setChatTabKey] = useState(0);

  const handleOpenChat = () => {
    setChatTabKey((prev) => prev + 1);
    setActiveTab('chat');
  };

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Pre-filled login helpers (after password recovery or registration)
  const [prefilledIdentifier, setPrefilledIdentifier] = useState('');
  const [prefilledSuccessMessage, setPrefilledSuccessMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0c0f17] flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 font-mono text-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#691c32]/10 dark:bg-[#691c32]/20 border border-[#691c32]/30 dark:border-[#691c32]/40 flex items-center justify-center mb-3">
          <span className="w-5 h-5 border-2 border-[#8a1a36] dark:border-[#eb527c] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="tracking-widest uppercase">Iniciando Radio PTT C5i Hidalgo...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          onOpenApiSettings={() => setIsApiSettingsOpen(true)}
          prefilledIdentifier={prefilledIdentifier}
          prefilledSuccessMessage={prefilledSuccessMessage}
        />
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onRegisteredSuccess={(phone) => {
            setPrefilledIdentifier(phone);
            setPrefilledSuccessMessage('¡Registro y verificación telefónica completados con éxito! Puedes iniciar sesión.');
          }}
        />
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSuccess={(id, msg) => {
            setPrefilledIdentifier(id);
            setPrefilledSuccessMessage(msg);
          }}
        />
        <ApiSettingsModal
          isOpen={isApiSettingsOpen}
          onClose={() => setIsApiSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <NetworkProvider>
      <RadioProvider>
        <ChatProvider>
          <div className="h-screen max-h-screen bg-slate-50 dark:bg-[#070c16] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none overflow-hidden relative">
            {/* Global Auto-Sync Toast Banner */}
            <AutoSyncBanner />

            {/* Active View Container: Stays inside main flex layout without unmounting or moving the bottom menu */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              {activeTab === 'ptt' && (
                <RadioMainScreen
                  onOpenChannels={() => setActiveTab('grupos')}
                  onOpenContacts={() => setActiveTab('contactos')}
                  onOpenChat={handleOpenChat}
                  onOpenProfile={() => setActiveTab('perfil')}
                  onOpenSosModal={() => setIsSosModalOpen(true)}
                />
              )}

              {activeTab === 'grupos' && (
                <ChannelsDrawer
                  isInline={true}
                  onClose={() => setActiveTab('ptt')}
                  onOpenSosModal={() => setIsSosModalOpen(true)}
                />
              )}

              {activeTab === 'chat' && (
                <WhatsAppChat
                  key={`chat-tab-${chatTabKey}`}
                  initialMobileView="list"
                  onSwitchToRadio={() => setActiveTab('ptt')}
                  onOpenChannels={() => setActiveTab('grupos')}
                  onOpenContacts={() => setActiveTab('contactos')}
                  onOpenProfile={() => setActiveTab('perfil')}
                  onOpenSosModal={() => setIsSosModalOpen(true)}
                />
              )}

              {activeTab === 'contactos' && (
                <ContactsDrawer
                  isInline={true}
                  onClose={() => setActiveTab('ptt')}
                  onSelectContactDirect={() => setActiveTab('ptt')}
                  onOpenChatWithContact={() => setActiveTab('chat')}
                  onOpenSosModal={() => setIsSosModalOpen(true)}
                />
              )}

              {activeTab === 'perfil' && (
                <ProfileModal
                  isInline={true}
                  onClose={() => setActiveTab('ptt')}
                  onOpenApiSettings={() => setIsApiSettingsOpen(true)}
                  onOpenSosModal={() => setIsSosModalOpen(true)}
                />
              )}
            </div>

            {/* FIXED, STABLE BOTTOM NAVIGATION BAR */}
            <div className="w-full bg-white/95 dark:bg-[#070c16]/95 border-t border-slate-200 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 z-30 backdrop-blur-md shrink-0 shadow-lg">
              <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
                {/* 1. PTT */}
                <button
                  id="nav-tab-ptt"
                  type="button"
                  onClick={() => setActiveTab('ptt')}
                  className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                    activeTab === 'ptt'
                      ? 'text-[#8a1a36] dark:text-[#eb527c] font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <Mic className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${activeTab === 'ptt' ? 'text-[#8a1a36] dark:text-[#eb527c]' : ''}`} />
                  <span className="text-[11px] sm:text-xs font-semibold">PTT</span>
                </button>

                {/* 2. Grupos */}
                <button
                  id="nav-tab-grupos"
                  type="button"
                  onClick={() => setActiveTab('grupos')}
                  className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                    activeTab === 'grupos'
                      ? 'text-[#8a1a36] dark:text-[#eb527c] font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <Users className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${activeTab === 'grupos' ? 'text-[#8a1a36] dark:text-[#eb527c]' : ''}`} />
                  <span className="text-[11px] sm:text-xs font-semibold">Grupos</span>
                </button>

                {/* 3. Chat */}
                <button
                  id="nav-tab-chat"
                  type="button"
                  onClick={handleOpenChat}
                  className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                    activeTab === 'chat'
                      ? 'text-[#8a1a36] dark:text-[#eb527c] font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${activeTab === 'chat' ? 'text-[#8a1a36] dark:text-[#eb527c]' : ''}`} />
                  <span className="text-[11px] sm:text-xs font-semibold">Chat</span>
                </button>

                {/* 4. Contactos */}
                <button
                  id="nav-tab-contactos"
                  type="button"
                  onClick={() => setActiveTab('contactos')}
                  className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                    activeTab === 'contactos'
                      ? 'text-[#8a1a36] dark:text-[#eb527c] font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${activeTab === 'contactos' ? 'text-[#8a1a36] dark:text-[#eb527c]' : ''}`} />
                  <span className="text-[11px] sm:text-xs font-semibold">Contactos</span>
                </button>

                {/* 5. Perfil */}
                <button
                  id="nav-tab-perfil"
                  type="button"
                  onClick={() => setActiveTab('perfil')}
                  className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
                    activeTab === 'perfil'
                      ? 'text-[#8a1a36] dark:text-[#eb527c] font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <UserIcon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${activeTab === 'perfil' ? 'text-[#8a1a36] dark:text-[#eb527c]' : ''}`} />
                  <span className="text-[11px] sm:text-xs font-semibold">Perfil</span>
                </button>
              </div>
            </div>

            {/* Overlays / Modal Dialogs (Alerts & System configs only) */}
            <VoiceHistoryDrawer
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />

            <SosAlertModal
              isOpen={isSosModalOpen}
              onClose={() => setIsSosModalOpen(false)}
            />

            <ApiSettingsModal
              isOpen={isApiSettingsOpen}
              onClose={() => setIsApiSettingsOpen(false)}
            />

            <RegisterModal
              isOpen={isRegisterOpen}
              onClose={() => setIsRegisterOpen(false)}
            />

            <ForgotPasswordModal
              isOpen={isForgotPasswordOpen}
              onClose={() => setIsForgotPasswordOpen(false)}
              onSuccess={(id, msg) => {
                setPrefilledIdentifier(id);
                setPrefilledSuccessMessage(msg);
              }}
            />
          </div>
        </ChatProvider>
      </RadioProvider>
    </NetworkProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
