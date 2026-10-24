import React from 'react';
import {
  X,
  Heart,
  Sparkles,
  MessageCircle,
  Star,
  MapPin,
  Briefcase,
  ShieldCheck,
  Flame,
  User,
  Check,
} from 'lucide-react';
import { GirlfriendProfile } from '../types';
import { useCompanion } from '../context/CompanionContext';

interface Props {
  profile: GirlfriendProfile;
  onClose: () => void;
  onSelectCompanion: () => void;
}

export const CharacterBioDialog: React.FC<Props> = ({
  profile,
  onClose,
  onSelectCompanion,
}) => {
  const { isFavoriteCompanion, toggleFavoriteCompanion } = useCompanion();
  const isFav = isFavoriteCompanion(profile.id);

  const getBoundaryBadge = () => {
    switch (profile.boundaryLevel) {
      case 'reserved':
        return {
          label: 'Reserved (Slow-Burn Romance)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          desc: 'Prefers deep emotional connection and gradual trust building before intimacy.',
        };
      case 'open_flirty':
        return {
          label: 'Open & Passionate Flirt',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          desc: 'Enjoys playful teasing, bold romance, and consensual adult conversations.',
        };
      case 'moderate':
      default:
        return {
          label: 'Balanced & Gentle Romance',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          desc: 'Warm, open-minded, and attentive to mutual comfort and respect.',
        };
    }
  };

  const boundary = getBoundaryBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#19132B] border border-[#332752] shadow-2xl text-white overflow-hidden">
        {/* Top Cover / Avatar Image */}
        <div className="relative h-64 w-full shrink-0">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#19132B] via-[#19132B]/40 to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favorite toggle */}
          <button
            onClick={() => toggleFavoriteCompanion(profile.id)}
            className="absolute left-4 top-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>

          {/* Name & Title */}
          <div className="absolute bottom-3 left-4 right-4 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-bold text-[#F7F2FA]">
                {profile.name}
              </h3>
              <span className="text-sm font-semibold text-rose-300">
                ({profile.banglaName})
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md font-mono font-medium">
                {profile.age} yrs • Adult
              </span>
              {profile.isVipExclusive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/90 font-bold text-black flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-current" /> VIP
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#CBC2D6]">
              {profile.profession && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-rose-400" />
                  {profile.profession}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {profile.location}
                </span>
              )}
            </div>

            <p className="text-xs text-rose-200/90 font-medium">
              {profile.tagline}
            </p>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Appearance Card */}
          {profile.appearance && (
            <div className="p-3.5 rounded-2xl bg-[#241C3B]/60 border border-white/5 space-y-1">
              <h4 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Appearance & Portrait Description</span>
              </h4>
              <p className="text-[#F7F2FA] leading-relaxed">
                {profile.appearance}
              </p>
            </div>
          )}

          {/* Bio */}
          <div>
            <h4 className="text-[11px] font-bold text-[#CBC2D6] uppercase tracking-wider mb-1">
              About Her
            </h4>
            <p className="text-[#F7F2FA] leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Romantic Pacing & Boundaries */}
          <div className="p-3.5 rounded-2xl bg-[#140F24] border border-[#332752] space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#CBC2D6] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Romantic Boundaries & Consent Style</span>
              </h4>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${boundary.color}`}>
                {boundary.label}
              </span>
            </div>
            <p className="text-[#CBC2D6] text-[11px] leading-relaxed">
              {boundary.desc}
            </p>

            {profile.romanticPreferences && (
              <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                <div className="text-[#CBC2D6]">
                  <strong className="text-white">Intimacy & Comfort: </strong>
                  {profile.romanticPreferences.intimacyBoundaries}
                </div>
                <div className="text-[#CBC2D6]">
                  <strong className="text-white">Love Language: </strong>
                  {profile.romanticPreferences.loveLanguage}
                </div>
                <div className="text-[#CBC2D6]">
                  <strong className="text-white">Adult & Sexual Health Openness: </strong>
                  {profile.romanticPreferences.sexualHealthOpenness}
                </div>
              </div>
            )}
          </div>

          {/* Interests */}
          <div>
            <h4 className="text-[11px] font-bold text-[#CBC2D6] uppercase tracking-wider mb-2">
              Interests & Passions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-xl bg-[#241C3B] text-rose-200 border border-white/5"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Relationship Style */}
          <div>
            <h4 className="text-[11px] font-bold text-[#CBC2D6] uppercase tracking-wider mb-1">
              Chemistry & Conversation Dynamic
            </h4>
            <p className="text-[#CBC2D6] leading-relaxed">
              {profile.relationshipStyle}
            </p>
          </div>

          {/* Adult Roleplay & Safety Notice */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[10px] text-[#988EA6] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Explicitly age 21+ adult fictional character. Supports consensual romantic roleplay and adult sexual health education. Zero tolerance for underage content.
            </span>
          </div>

          {/* Portrait attribution & fictional disclaimer */}
          <div className="text-[10px] text-[#988EA6]/70 text-center px-1">
            Portrait photography licensed via Pexels. Depicts an aesthetic visual representation of a fictional persona; persons pictured do not endorse Amora.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 flex gap-3 shrink-0 bg-[#140F24]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#241C3B] hover:bg-[#332752] text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelectCompanion();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Select & Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
