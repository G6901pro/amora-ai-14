import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  MessageCircle,
  Star,
  Heart,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  Briefcase,
  MapPin,
  Flame,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { GirlfriendProfile } from '../types';
import { CharacterBioDialog } from '../components/CharacterBioDialog';

interface Props {
  onNavigateToChat: () => void;
}

export const DiscoveryScreen: React.FC<Props> = ({ onNavigateToChat }) => {
  const {
    profiles,
    sessions,
    selectOrOpenCharacter,
    isFavoriteCompanion,
    toggleFavoriteCompanion,
    setShowVipDialog,
    settings,
  } = useCompanion();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bioProfile, setBioProfile] = useState<GirlfriendProfile | null>(null);

  // Permanently ensure voice synthesis is disabled
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Voice is permanently disabled
      }
    }
  }, []);

  const categories = [
    { id: 'all', label: 'All Characters' },
    { id: 'warm_caring', label: 'Warm & Caring 🌸' },
    { id: 'playful_teasing', label: 'Playful & Witty 😉' },
    { id: 'confident_bold', label: 'Confident & Bold 🍷' },
    { id: 'shy_sweet', label: 'Shy & Sweet 🎀' },
    { id: 'calm_mature', label: 'Calm Sanctuary ☕' },
    { id: 'funny_spontaneous', label: 'Funny & Spontaneous 🎭' },
  ];

  // Set of companion IDs currently in user's chats
  const activeCompanionIdsInChats = useMemo(() => {
    return new Set(sessions.map((s) => s.companionId));
  }, [sessions]);

  // Filtered profiles based on query and category
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        profile.name.toLowerCase().includes(q) ||
        profile.banglaName.includes(q) ||
        profile.tagline.toLowerCase().includes(q) ||
        profile.bio.toLowerCase().includes(q) ||
        profile.interests.some((i) => i.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || profile.archetype === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [profiles, searchQuery, selectedCategory]);

  const handleChoose = (companionId: string) => {
    const target = profiles.find((p) => p.id === companionId);
    if (target?.isVipExclusive && settings.subscriptionTier !== 'VIP_PRO') {
      setShowVipDialog(true);
      return;
    }
    selectOrOpenCharacter(companionId);
    onNavigateToChat();
  };


  return (
    <div className="flex flex-col h-full bg-[#100C1C] text-white overflow-y-auto">
      {/* Sticky Header with Title & Search */}
      <header className="shrink-0 p-4 sm:p-6 bg-[#19132B]/90 backdrop-blur-md border-b border-[#332752] sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#F7F2FA] tracking-tight">
                Discover Companions
              </h1>
              <p className="text-xs text-[#CBC2D6]">
                Choose your ideal fictional AI girlfriend with rich personality & memory
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
            {profiles.length} Personalities Available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#988EA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters by name, traits, Bengali interests..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#100C1C] border border-[#332752] text-xs text-white placeholder-[#988EA6] focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#988EA6] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-950/40'
                  : 'bg-[#241C3B] text-[#CBC2D6] hover:text-white hover:bg-[#332752] border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Characters Grid */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6">
        {filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#19132B] border border-[#332752] flex items-center justify-center text-[#988EA6]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No characters found</h3>
            <p className="text-xs text-[#CBC2D6] max-w-xs">
              No character matches "{searchQuery}". Try searching for another trait or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProfiles.map((profile) => {
              const inChats = activeCompanionIdsInChats.has(profile.id);
              const isFav = isFavoriteCompanion(profile.id);

              return (
                <div
                  key={profile.id}
                  className="rounded-3xl bg-[#19132B] border border-[#332752] overflow-hidden shadow-xl hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-950/20 transition-all flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#19132B] via-transparent to-black/30" />

                    {/* Online status indicator */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-emerald-300 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online</span>
                    </div>

                    {/* Top right badges: Favorite & VIP */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {profile.isVipExclusive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black font-bold flex items-center gap-1 shadow-md">
                          <Star className="w-2.5 h-2.5 fill-current" /> VIP
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavoriteCompanion(profile.id)}
                        className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
                          }`}
                        />
                      </button>
                    </div>

                    {/* In-Chats badge */}
                    {inChats && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-bold shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>In Chats</span>
                      </div>
                    )}

                    {/* Bottom overlay: Name & Bangla Name */}
                    <div className="absolute bottom-3 left-3 right-16">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xl font-bold text-white drop-shadow-md">
                          {profile.name}
                        </h3>
                        <span className="text-sm font-semibold text-rose-300 drop-shadow">
                          ({profile.banglaName})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-mono">
                          {profile.age} yrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Profession & Location */}
                      <div className="flex items-center justify-between text-[10px] text-[#CBC2D6] mb-1">
                        <span className="flex items-center gap-1 font-medium truncate max-w-[65%]">
                          <Briefcase className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                          <span className="truncate">{profile.profession || 'Fictional AI Girlfriend'}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                          profile.boundaryLevel === 'reserved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : profile.boundaryLevel === 'open_flirty'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}>
                          {profile.boundaryLevel === 'reserved'
                            ? 'Slow-Burn'
                            : profile.boundaryLevel === 'open_flirty'
                            ? 'Open Romance'
                            : 'Gentle'}
                        </span>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs font-semibold text-rose-200/95 leading-snug">
                        {profile.tagline}
                      </p>

                      {/* Bio snippet */}
                      <p className="text-xs text-[#CBC2D6] leading-relaxed line-clamp-2 mt-1.5">
                        {profile.bio}
                      </p>

                      {/* Interests Tags */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {profile.interests.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-[#241C3B] text-rose-200/90 border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                        {profile.interests.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#241C3B] text-[#988EA6]">
                            +{profile.interests.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Character Signature Phrase */}
                      <div className="mt-3 p-2.5 rounded-2xl bg-[#100C1C]/60 border border-[#332752]">
                        <p className="text-[11px] text-[#CBC2D6] italic line-clamp-2">
                          "{profile.sampleVoicePhrase.replace(/[*_]/g, '')}"
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-white/5 flex gap-2">
                      <button
                        onClick={() => setBioProfile(profile)}
                        className="py-2.5 px-3 rounded-xl bg-[#241C3B] hover:bg-[#332752] text-xs font-semibold text-[#CBC2D6] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                        title="View Full Bio & Love Chemistry"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Bio</span>
                      </button>

                      <button
                        onClick={() => handleChoose(profile.id)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                          inChats
                            ? 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/40'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{inChats ? 'Open Conversation' : 'Choose & Chat'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Character Bio Modal */}
      {bioProfile && (
        <CharacterBioDialog
          profile={bioProfile}
          onClose={() => setBioProfile(null)}
          onSelectCompanion={() => {
            handleChoose(bioProfile.id);
            setBioProfile(null);
          }}
        />
      )}
    </div>
  );
};
