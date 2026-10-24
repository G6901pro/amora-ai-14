import React, { useState } from 'react';
import {
  MessageCircle,
  Compass,
  Image as ImageIcon,
  User,
  Heart,
} from 'lucide-react';
import { CompanionProvider, useCompanion } from './context/CompanionContext';
import { ChatScreen } from './screens/ChatScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { MomentsScreen } from './screens/MomentsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DailyCheckInDialog } from './components/DailyCheckInDialog';
import { CheckInHistorySheet } from './components/CheckInHistorySheet';
import { GiftShopDialog } from './components/GiftShopDialog';
import { GiftCelebrationOverlay } from './components/GiftCelebrationOverlay';
import { CharacterMemorySheet } from './components/CharacterMemorySheet';
import { ChatSessionsSheet } from './components/ChatSessionsSheet';
import { VipSubscriptionDialog } from './components/VipSubscriptionDialog';
import { RelationshipStateDialog } from './components/RelationshipStateDialog';

type Tab = 'chat' | 'discovery' | 'moments' | 'profile';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('chat');
  const [showCheckInHistory, setShowCheckInHistory] = useState(false);

  const {
    showGiftDialog,
    showCheckInDialog,
    showSessionsSheet,
    showMemorySheet,
    showVipDialog,
    showRelationshipDialog,
    setShowCheckInDialog,
    setShowMemorySheet,
    setShowSessionsSheet,
    setShowVipDialog,
    setShowRelationshipDialog,
  } = useCompanion();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#100C1C] select-none font-sans">
      {/* Active Screen Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentTab === 'chat' && (
          <ChatScreen onNavigateToDiscover={() => setCurrentTab('discovery')} />
        )}
        {currentTab === 'discovery' && (
          <DiscoveryScreen onNavigateToChat={() => setCurrentTab('chat')} />
        )}
        {currentTab === 'moments' && (
          <MomentsScreen onNavigateToChat={() => setCurrentTab('chat')} />
        )}
        {currentTab === 'profile' && (
          <ProfileScreen
            onOpenCheckIn={() => setShowCheckInDialog(true)}
            onOpenCheckInHistory={() => setShowCheckInHistory(true)}
            onOpenMemories={() => setShowMemorySheet(true)}
            onOpenSessions={() => setShowSessionsSheet(true)}
            onOpenVip={() => setShowVipDialog(true)}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="shrink-0 h-16 bg-[#19132B] border-t border-[#332752] flex items-center justify-around px-2 z-20 shadow-2xl">
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            currentTab === 'chat'
              ? 'text-rose-400 font-bold'
              : 'text-[#988EA6] hover:text-[#CBC2D6]'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {currentTab === 'chat' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />
            )}
          </div>
          <span className="text-[11px] mt-1">Chat</span>
        </button>

        <button
          onClick={() => setCurrentTab('discovery')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            currentTab === 'discovery'
              ? 'text-rose-400 font-bold'
              : 'text-[#988EA6] hover:text-[#CBC2D6]'
          }`}
        >
          <div className="relative">
            <Compass className="w-5 h-5" />
            {currentTab === 'discovery' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />
            )}
          </div>
          <span className="text-[11px] mt-1">Discover</span>
        </button>

        <button
          onClick={() => setCurrentTab('moments')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            currentTab === 'moments'
              ? 'text-rose-400 font-bold'
              : 'text-[#988EA6] hover:text-[#CBC2D6]'
          }`}
        >
          <div className="relative">
            <ImageIcon className="w-5 h-5" />
            {currentTab === 'moments' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />
            )}
          </div>
          <span className="text-[11px] mt-1">Moments</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            currentTab === 'profile'
              ? 'text-rose-400 font-bold'
              : 'text-[#988EA6] hover:text-[#CBC2D6]'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5" />
            {currentTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400" />
            )}
          </div>
          <span className="text-[11px] mt-1">Profile</span>
        </button>
      </nav>

      {/* Modals & Overlays */}
      {showGiftDialog && <GiftShopDialog />}
      <GiftCelebrationOverlay />
      {showCheckInDialog && (
        <DailyCheckInDialog
          onOpenHistory={() => setShowCheckInHistory(true)}
        />
      )}
      {showCheckInHistory && (
        <CheckInHistorySheet
          onClose={() => setShowCheckInHistory(false)}
          onOpenCheckIn={() => setShowCheckInDialog(true)}
        />
      )}
      {showSessionsSheet && <ChatSessionsSheet />}
      {showMemorySheet && <CharacterMemorySheet />}
      {showVipDialog && <VipSubscriptionDialog />}
      {showRelationshipDialog && (
        <RelationshipStateDialog onClose={() => setShowRelationshipDialog(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <CompanionProvider>
      <AppContent />
    </CompanionProvider>
  );
}
