import React from 'react';
import { Heart, MessageCircle, Sparkles, Share2 } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { GIRLFRIEND_PROFILES } from '../data/catalog';

interface Props {
  onNavigateToChat: () => void;
}

export const MomentsScreen: React.FC<Props> = ({ onNavigateToChat }) => {
  const { moments, toggleLikeMoment, switchCompanion } = useCompanion();

  const handleChatWithCompanion = (companionId: string) => {
    switchCompanion(companionId);
    onNavigateToChat();
  };

  return (
    <div className="flex flex-col h-full bg-[#100C1C] text-white overflow-y-auto">
      {/* Header */}
      <header className="shrink-0 p-4 bg-[#19132B]/80 backdrop-blur-md border-b border-[#332752] sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F7F2FA] flex items-center gap-2">
            <span>Romantic Moments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-normal">
              Memories
            </span>
          </h2>
          <p className="text-xs text-[#CBC2D6]">
            Special shared memories and photo stories from your companions
          </p>
        </div>
      </header>

      {/* Moments Feed */}
      <div className="max-w-xl mx-auto w-full p-4 space-y-6">
        {moments.map((moment) => {
          const companion = GIRLFRIEND_PROFILES.find((p) => p.id === moment.companionId);
          return (
            <div
              key={moment.id}
              className="rounded-3xl bg-[#19132B] border border-[#332752] overflow-hidden shadow-xl"
            >
              {/* Creator Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-white/5">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => handleChatWithCompanion(moment.companionId)}
                >
                  <img
                    src={companion?.avatarUrl || '/assets/img_ananya_avatar.jpg'}
                    alt={companion?.name || 'Companion'}
                    className="w-10 h-10 rounded-full object-cover border border-rose-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">
                        {companion?.name || 'Amora Companion'}
                      </span>
                      <span className="text-xs text-rose-300 font-medium">
                        ({companion?.banglaName})
                      </span>
                    </div>
                    <span className="text-[11px] text-[#988EA6]">{moment.date}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleChatWithCompanion(moment.companionId)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#241C3B] hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </div>

              {/* Photo */}
              <div className="relative aspect-[4/3] w-full bg-black/40 overflow-hidden">
                <img
                  src={moment.imageUrl}
                  alt={moment.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content & Actions */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLikeMoment(moment.id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-transform active:scale-90 ${
                        moment.liked ? 'text-rose-500' : 'text-[#CBC2D6] hover:text-white'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${moment.liked ? 'fill-rose-500' : ''}`}
                      />
                      <span>{moment.likes}</span>
                    </button>
                  </div>
                  <span className="text-xs font-medium text-rose-300">
                    {moment.banglaTitle}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{moment.title}</h3>
                <p className="text-xs text-[#CBC2D6] leading-relaxed">{moment.caption}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
