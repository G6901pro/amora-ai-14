import React from 'react';
import {
  User,
  Heart,
  Brain,
  Calendar,
  MessageSquare,
  Crown,
  Sparkles,
  Settings,
  Languages,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { getRelationshipLevel } from '../data/catalog';

interface Props {
  onOpenCheckIn: () => void;
  onOpenCheckInHistory: () => void;
  onOpenMemories: () => void;
  onOpenSessions: () => void;
  onOpenVip: () => void;
}

export const ProfileScreen: React.FC<Props> = ({
  onOpenCheckIn,
  onOpenCheckInHistory,
  onOpenMemories,
  onOpenSessions,
  onOpenVip,
}) => {
  const {
    settings,
    currentProfile,
    memories,
    checkIns,
    sessions,
    updateSettings,
    setShowRelationshipDialog,
  } = useCompanion();

  const rel = getRelationshipLevel(settings.affectionPoints);

  return (
    <div className="flex flex-col h-full bg-[#100C1C] text-white overflow-y-auto">
      {/* Header */}
      <header className="shrink-0 p-4 bg-[#19132B]/80 backdrop-blur-md border-b border-[#332752] sticky top-0 z-10">
        <h2 className="text-lg font-bold text-[#F7F2FA]">My Profile & Romance Hub</h2>
        <p className="text-xs text-[#CBC2D6]">
          Manage your partner connection, emotional memories, and settings
        </p>
      </header>

      <div className="max-w-xl mx-auto w-full p-4 space-y-4">
        {/* User Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#19132B] to-[#241C3B] border border-[#332752] shadow-xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 p-0.5 shrink-0 shadow-lg shadow-rose-950/50">
            <div className="w-full h-full rounded-[14px] bg-[#100C1C] flex items-center justify-center">
              <User className="w-8 h-8 text-rose-300" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">
                {settings.userNickname || 'জান'}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {settings.subscriptionTier === 'VIP_PRO' ? 'VIP Partner' : 'Free Member'}
              </span>
            </div>
            <p className="text-xs text-[#CBC2D6] mt-0.5">
              Current Partner: <span className="text-rose-300 font-semibold">{currentProfile.name} ({currentProfile.banglaName})</span>
            </p>
          </div>
        </div>

        {/* Relationship Level Card */}
        <div className="p-4 rounded-3xl bg-[#19132B] border border-[#332752] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Relationship Progression</h4>
                <p className="text-[11px] text-rose-300 font-medium">
                  Level {rel.level} • {rel.stageName} ({rel.banglaStageName})
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRelationshipDialog(true)}
              className="text-xs px-2.5 py-1 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 text-rose-300 transition-colors"
            >
              Details
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] text-[#CBC2D6] mb-1">
              <span>{settings.affectionPoints} Affection pts</span>
              <span>{rel.nextLevelPoints} pts for next level</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#100C1C] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                style={{ width: `${rel.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Hub Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenCheckIn}
            className="p-4 rounded-2xl bg-[#19132B] hover:bg-[#241C3B] border border-[#332752] text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-white">Daily Check-In</div>
            <div className="text-[10px] text-[#CBC2D6] mt-0.5">Share mood & gratitude</div>
          </button>

          <button
            onClick={onOpenMemories}
            className="p-4 rounded-2xl bg-[#19132B] hover:bg-[#241C3B] border border-[#332752] text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Brain className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-white">Emotional Memories</div>
            <div className="text-[10px] text-[#CBC2D6] mt-0.5">{memories.length} facts saved</div>
          </button>

          <button
            onClick={onOpenSessions}
            className="p-4 rounded-2xl bg-[#19132B] hover:bg-[#241C3B] border border-[#332752] text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-white">Chat Sessions</div>
            <div className="text-[10px] text-[#CBC2D6] mt-0.5">{sessions.length} conversations</div>
          </button>

          <button
            onClick={onOpenVip}
            className="p-4 rounded-2xl bg-[#19132B] hover:bg-[#241C3B] border border-[#332752] text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Crown className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-white">VIP Club</div>
            <div className="text-[10px] text-[#CBC2D6] mt-0.5">Unlock VIP companions</div>
          </button>
        </div>

        {/* Preferences Section */}
        <div className="p-4 rounded-3xl bg-[#19132B] border border-[#332752] shadow-md space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-rose-300" />
            <span>Chat Preferences</span>
          </h4>

          {/* Nickname setting */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
            <span className="text-[#CBC2D6]">Nickname she calls you:</span>
            <input
              type="text"
              value={settings.userNickname}
              onChange={(e) => updateSettings({ userNickname: e.target.value })}
              className="bg-[#100C1C] border border-[#332752] rounded-lg px-2.5 py-1 text-xs text-white max-w-[120px] text-right focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Language preference */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
            <span className="text-[#CBC2D6]">Preferred Language:</span>
            <div className="flex items-center gap-1 bg-[#100C1C] p-0.5 rounded-lg border border-[#332752]">
              <button
                onClick={() => updateSettings({ languageMode: 'bn' })}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  settings.languageMode === 'bn' ? 'bg-rose-500 text-white' : 'text-[#CBC2D6]'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => updateSettings({ languageMode: 'en' })}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  settings.languageMode === 'en' ? 'bg-rose-500 text-white' : 'text-[#CBC2D6]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => updateSettings({ languageMode: 'both' })}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  settings.languageMode === 'both' ? 'bg-rose-500 text-white' : 'text-[#CBC2D6]'
                }`}
              >
                Both
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
