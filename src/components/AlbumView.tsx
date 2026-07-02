import React, { useState } from 'react';
import { Card, RarityType } from '../types';
import { DEFAULT_CARDS } from '../data';
import { Sparkles, HelpCircle, Lock, BookOpen, Flame, Trophy, Info } from 'lucide-react';

interface AlbumViewProps {
  unlockedCardIds: string[];
  customCards: Card[];
}

export default function AlbumView({ unlockedCardIds, customCards }: AlbumViewProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'custom'>('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const allCards = [...DEFAULT_CARDS, ...customCards];
  const unlockedCount = allCards.filter(c => unlockedCardIds.includes(c.id)).length;
  const totalCount = allCards.length;
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Filter list
  const filteredCards = allCards.filter(card => {
    const isUnlocked = unlockedCardIds.includes(card.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'custom') return card.isCustom === true;
    return true; // 'all'
  });

  const getRarityBadge = (rarity: RarityType) => {
    switch (rarity) {
      case 'N': return { text: 'ノーマル N', style: 'bg-slate-100 text-slate-700' };
      case 'R': return { text: 'レア R ⭐', style: 'bg-amber-100 text-amber-700 font-bold' };
      case 'SR': return { text: 'スーパーレア SR 🌟', style: 'bg-indigo-100 text-indigo-700 font-extrabold' };
      case 'SSR': return { text: 'ダブルスーパーレア SSR 💎✨', style: 'bg-rose-100 text-rose-700 font-black animate-pulse' };
      case 'UR': return { text: 'ウルトラレア UR 👑🌌', style: 'bg-purple-100 text-purple-700 font-black animate-bounce' };
    }
  };

  const getBorderColor = (rarity: RarityType, isUnlocked: boolean) => {
    if (!isUnlocked) return 'border-slate-200 bg-slate-100';
    switch (rarity) {
      case 'N': return 'border-slate-300 bg-white hover:border-slate-400';
      case 'R': return 'border-amber-400 bg-amber-50/20 hover:border-amber-500 hover:ring-2 hover:ring-amber-200';
      case 'SR': return 'border-indigo-400 bg-indigo-50/10 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-200';
      case 'SSR': return 'border-rose-400 bg-rose-50/10 hover:border-rose-500 hover:ring-4 hover:ring-rose-200';
      case 'UR': return 'border-purple-400 bg-purple-50/10 hover:border-purple-500 hover:ring-4 hover:ring-purple-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border-4 border-indigo-200 p-6 shadow-sm">
      
      {/* Header and Progress */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-indigo-50">
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-600" size={32} />
          <div>
            <h2 className="text-xl font-black text-slate-800">
              📖 カードコレクション図鑑 📖
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              勉強してガチャをまわし、カードをあつめよう！
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-[240px] bg-slate-100 p-3 rounded-2xl border border-indigo-50">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
            <span>あつめたマーク:</span>
            <span>{unlockedCount} / {totalCount}枚 ({completionRate}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          id="btn-filter-all"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          すべて ({totalCount})
        </button>
        <button
          id="btn-filter-unlocked"
          onClick={() => setFilter('unlocked')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            filter === 'unlocked'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          あつめたカード ({unlockedCount})
        </button>
        <button
          id="btn-filter-custom"
          onClick={() => setFilter('custom')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            filter === 'custom'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          おうちの人が作ったカード ({customCards.length})
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredCards.map((card) => {
          const isUnlocked = unlockedCardIds.includes(card.id);

          return (
            <div
              key={card.id}
              onClick={isUnlocked ? () => setSelectedCard(card) : undefined}
              className={`border-2 rounded-2xl p-2 flex flex-col items-center justify-between text-center transition-all h-full ${
                isUnlocked ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80'
              } ${getBorderColor(card.rarity, isUnlocked)}`}
            >
              {isUnlocked ? (
                /* Unlocked Card Preview */
                <>
                  {/* Image */}
                  <div className="w-full aspect-[63/88] rounded-xl overflow-hidden mb-2 bg-slate-100 relative">
                    {card.isCustom && (
                      <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        おうち
                      </span>
                    )}
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Name and Rarity */}
                  <div className="w-full">
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1 mb-1">
                      {card.name}
                    </h4>
                    <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${getRarityBadge(card.rarity).style}`}>
                      {getRarityBadge(card.rarity).text}
                    </span>
                  </div>
                </>
              ) : (
                /* Locked Silhouette */
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Lock size={20} />
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">
                    ？？？？
                  </div>
                  <span className="text-[8px] font-semibold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full">
                    ロック
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm font-bold">
            みつかるカードがないよ。がんばってガチャをまわそう！
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 cursor-zoom-out"
          onClick={() => setFullScreenImage(null)}
        >
          <img 
            src={fullScreenImage} 
            alt="Full screen view" 
            className="max-w-full max-h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Card Detail Dialog / Modal */}
      {selectedCard && (
        <div 
          id="card-detail-modal"
          className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-white max-w-sm w-full rounded-3xl border-4 border-indigo-400 p-6 shadow-2xl relative overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rarity sparkles */}
            {selectedCard.rarity !== 'N' && (
              <div className="absolute top-2 left-2 text-rose-400 animate-pulse">
                <Sparkles size={24} />
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center font-bold"
            >
              ×
            </button>

            {/* Custom label */}
            {selectedCard.isCustom && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3 shadow-xs">
                おうちの人オリジナルカード
              </span>
            )}

            {/* Large Image - Click to full screen */}
            <div 
              className="w-full aspect-[63/88] max-h-[50vh] rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200 shadow-inner cursor-zoom-in hover:opacity-90 transition-opacity"
              onClick={() => setFullScreenImage(selectedCard.imageUrl)}
              title="タップして拡大"
            >
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                className="w-full h-full object-contain bg-black/5"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Details */}
            <span className={`text-xs font-black px-3 py-1 rounded-full mb-2 ${getRarityBadge(selectedCard.rarity).style}`}>
              {getRarityBadge(selectedCard.rarity).text}
            </span>

            <h3 className="text-lg font-black text-slate-800 mb-3 text-center">
              {selectedCard.name}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed text-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 w-full mb-4 max-h-[100px] overflow-y-auto">
              {selectedCard.description}
            </p>

            <button
              onClick={() => setSelectedCard(null)}
              className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              とじる
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
