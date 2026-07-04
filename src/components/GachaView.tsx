import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, RarityType, GachaRates } from '../types';
import { DEFAULT_CARDS } from '../data';
import { Coins, Sparkles, Trophy, Grid3X3, Image as ImageIcon } from 'lucide-react';

interface GachaViewProps {
  coins: number;
  unlockedCardIds: string[];
  customCards: Card[];
  gachaRates?: GachaRates;
  onDrawCard: (card: Card, cost: number) => void;
  onNavigateToAlbum: () => void;
}

// Utility to play synthetic sound effects using Web Audio API
const playSound = (type: 'lever' | 'capsule' | 'reveal' | 'rare' | 'super_rare') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'lever') {
      // Mechanical ratchet sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'capsule') {
      // Rolling bounce sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(250, now + 0.1);
      osc.frequency.setValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.15, now + 0.1);
      gain.gain.setValueAtTime(0.1, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'reveal') {
      // Normal chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'rare') {
      // Shiny brass fan fare
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.16); // E5
      osc.frequency.setValueAtTime(880, now + 0.24); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'super_rare') {
      // Magical high-pitched sparkles
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.error('Web Audio error:', e);
  }
};

export default function GachaView({ coins, unlockedCardIds, customCards, gachaRates, onDrawCard, onNavigateToAlbum }: GachaViewProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeCapsule, setActiveCapsule] = useState<RarityType | null>(null);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [revealedCard, setRevealedCard] = useState<Card | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const revealInProgressRef = useRef(false);

  // Pool all cards (including custom cards registered by parents)
  const getCardPool = (): Card[] => {
    return [...DEFAULT_CARDS, ...customCards];
  };

  const drawGacha = () => {
    const cost = 10;
    if (coins < cost) {
      setErrorMsg('コインが足りないよ！勉強してコインをためてね！');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const pool = getCardPool();
    if (pool.length === 0) return;

    playSound('lever');
    setIsSpinning(true);
    setRevealedCard(null);
    setActiveCapsule(null);
    setPendingCard(null);
    revealInProgressRef.current = false;

    // Pick a card based on custom or typical gacha weights:
    const rates = gachaRates || { UR: 2.5, SSR: 7.5, SR: 15, R: 25, N: 50 };
    const totalWeight = rates.UR + rates.SSR + rates.SR + rates.R + rates.N;
    
    // Normalize to 100 in case the parent set them differently
    const normalizedUR = (rates.UR / totalWeight) * 100;
    const normalizedSSR = (rates.SSR / totalWeight) * 100;
    const normalizedSR = (rates.SR / totalWeight) * 100;
    const normalizedR = (rates.R / totalWeight) * 100;

    const rand = Math.random() * 100;
    let targetRarity: RarityType = 'N';
    
    if (rand < normalizedUR) {
      targetRarity = 'UR';
    } else if (rand < normalizedUR + normalizedSSR) {
      targetRarity = 'SSR';
    } else if (rand < normalizedUR + normalizedSSR + normalizedSR) {
      targetRarity = 'SR';
    } else if (rand < normalizedUR + normalizedSSR + normalizedSR + normalizedR) {
      targetRarity = 'R';
    }

    // Filter available cards of selected rarity
    let cardsOfRarity = pool.filter(c => c.rarity === targetRarity);
    
    // Fallback if no cards of this rarity exist in active pool (e.g., custom cards only)
    if (cardsOfRarity.length === 0) {
      cardsOfRarity = pool;
    }

    const selectedCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
    // Keep the exact selected card until the capsule is opened.
    // Do not re-select later: card lists can change while the animation is running.
    setPendingCard(selectedCard);

    // Gacha sequences (mechanical spin -> capsule falls -> burst open)
    setTimeout(() => {
      playSound('capsule');
      setActiveCapsule(selectedCard.rarity);
      setIsSpinning(false);
    }, 1200);
  };

  const revealCard = () => {
    if (!activeCapsule || !pendingCard || revealInProgressRef.current) return;

    // Prevent double execution from rapid taps or event bubbling.
    revealInProgressRef.current = true;

    // Use the exact card that was selected when the lever was turned.
    // This prevents the album from unlocking a different card if cards are added/updated
    // while the capsule animation is waiting to be opened.
    const selectedCard = pendingCard;

    if (selectedCard.rarity === 'UR' || selectedCard.rarity === 'SSR') {
      playSound('super_rare');
    } else if (selectedCard.rarity === 'SR' || selectedCard.rarity === 'R') {
      playSound('rare');
    } else {
      playSound('reveal');
    }

    onDrawCard(selectedCard, 10);
    setRevealedCard(selectedCard);
    setActiveCapsule(null);
    setPendingCard(null);
  };

  const getRarityLabel = (rarity: RarityType) => {
    switch (rarity) {
      case 'N': return { text: 'ノーマル N', bg: 'bg-slate-100 text-slate-700', border: 'border-slate-300' };
      case 'R': return { text: 'レア R ⭐', bg: 'bg-amber-100 text-amber-800 font-bold', border: 'border-amber-400' };
      case 'SR': return { text: 'スーパーレア SR 🌟', bg: 'bg-indigo-100 text-indigo-800 font-extrabold', border: 'border-indigo-400' };
      case 'SSR': return { text: 'ダブルスーパーレア SSR 💎✨', bg: 'bg-rose-100 text-rose-800 font-black animate-pulse', border: 'border-rose-400' };
      case 'UR': return { text: 'ウルトラレア UR 👑🌌', bg: 'bg-purple-100 text-purple-900 font-black animate-bounce', border: 'border-purple-400' };
    }
  };

  const getRarityCardStyle = (rarity: RarityType) => {
    switch (rarity) {
      case 'N':
        return 'border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-md';
      case 'R':
        return 'border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50 shadow-lg ring-4 ring-amber-100';
      case 'SR':
        return 'border-indigo-400 bg-gradient-to-b from-indigo-50 to-purple-50 shadow-xl ring-4 ring-indigo-100';
      case 'SSR':
        return 'border-rose-500 bg-gradient-to-b from-pink-50 via-rose-50 to-indigo-50 shadow-2xl ring-4 ring-rose-200 animate-shimmer';
      case 'UR':
        return 'border-purple-600 bg-gradient-to-b from-purple-100 via-indigo-100 to-amber-100 shadow-2xl ring-4 ring-purple-300 animate-pulse';
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto bg-amber-50/40 p-6 rounded-3xl border-4 border-amber-200 shadow-sm relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-2 left-2 text-amber-200 pointer-events-none opacity-40">
        <Sparkles size={48} />
      </div>
      <div className="absolute bottom-2 right-2 text-amber-200 pointer-events-none opacity-40">
        <Sparkles size={48} />
      </div>

      {/* Top Bar with Coins */}
      <div className="flex w-full justify-between items-center mb-6 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-amber-100">
        <div className="flex items-center gap-2">
          <Coins className="text-amber-500 fill-amber-300 animate-bounce" size={24} />
          <span className="text-xs text-slate-500 font-bold">のこりコイン</span>
          <span className="text-xl font-black text-amber-600 font-mono">{coins}</span>
          <span className="text-xs text-slate-500 font-bold">まい</span>
        </div>
        <button
          id="btn-goto-album"
          onClick={onNavigateToAlbum}
          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          <Grid3X3 size={14} />
          <span>ずかんを見る</span>
        </button>
      </div>

      <h2 className="text-lg font-black text-amber-800 text-center mb-1">
        🌟 カードガチャマシーン 🌟
      </h2>
      <p className="text-xs text-amber-700 font-bold text-center mb-6">
        1回：10コイン でガチャをまわせるよ！
      </p>

      {/* Main Gacha Stage */}
      <div className="relative w-full h-[320px] flex items-center justify-center bg-white rounded-3xl border-2 border-amber-100 shadow-inner overflow-hidden mb-6">
        
        <AnimatePresence mode="wait">
          
          {/* 1. Normal/Idle or Spinning Machine */}
          {!activeCapsule && !revealedCard && (
            <motion.div
              key="machine"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Gacha Dome */}
              <div className="relative w-[180px] h-[180px] rounded-full border-4 border-slate-700 bg-blue-50/50 flex items-center justify-center overflow-hidden shadow-md">
                {/* Colored capsules inside */}
                <div className="absolute inset-0 p-4 grid grid-cols-4 gap-2 opacity-85">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-red-400 to-red-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-blue-400 to-blue-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-yellow-400 to-yellow-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-green-400 to-green-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-purple-400 to-purple-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-pink-400 to-pink-200 shadow border border-slate-400"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-t from-amber-400 to-amber-200 shadow border border-slate-400"></div>
                </div>

                {/* Spinning motion blur during active Gacha */}
                {isSpinning && (
                  <motion.div
                    className="absolute inset-0 bg-white/70 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.3, ease: 'linear' }}
                  >
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-amber-400"></div>
                  </motion.div>
                )}
                
                {/* Glass reflection */}
                <div className="absolute top-2 right-4 w-12 h-6 bg-white/25 rounded-full rotate-12"></div>
              </div>

              {/* Gacha Body */}
              <div className="w-[140px] h-[80px] bg-red-500 rounded-b-2xl border-x-4 border-b-4 border-slate-700 -mt-1 flex flex-col items-center justify-center relative shadow-md">
                {/* Spinning Wheel */}
                <motion.div
                  className="w-12 h-12 rounded-full bg-white border-2 border-slate-700 flex items-center justify-center cursor-pointer shadow"
                  animate={isSpinning ? { rotate: [0, 360, 720, 1080] } : {}}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  onClick={!isSpinning ? drawGacha : undefined}
                >
                  <div className="w-2 h-8 bg-slate-700 rounded-full"></div>
                </motion.div>
              </div>

              {/* Spin Trigger Button */}
              <button
                id="btn-spin-gacha"
                onClick={drawGacha}
                disabled={isSpinning}
                className="mt-4 px-6 py-2.5 bg-amber-500 text-white rounded-full font-black text-sm shadow hover:bg-amber-600 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 border-b-4 border-amber-700"
              >
                <span>レバーをまわす！</span>
              </button>
            </motion.div>
          )}

          {/* 2. Capsule Dropped, Click to Open */}
          {activeCapsule && (
            <motion.div
              key="capsule-fall"
              initial={{ y: -150, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1.2, opacity: 1, rotate: [0, 10, -10, 0] }}
              transition={{ type: 'spring', damping: 10 }}
              className="flex flex-col items-center cursor-pointer"
              onClick={revealCard}
            >
              <div className="text-center mb-4 text-xs font-bold text-slate-400">
                ガチャポンがでてきたよ！
              </div>
              
              {/* Capsule Visual based on rarity */}
              <motion.div
                className={`w-28 h-28 rounded-full border-4 border-slate-700 shadow-xl overflow-hidden relative flex flex-col`}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                {/* Top Half (Solid Color) */}
                <div className={`h-1/2 w-full ${
                  activeCapsule === 'UR' ? 'bg-purple-500' :
                  activeCapsule === 'SSR' ? 'bg-rose-500' :
                  activeCapsule === 'SR' ? 'bg-indigo-500' :
                  activeCapsule === 'R' ? 'bg-amber-500' : 'bg-slate-400'
                }`}></div>
                {/* Bottom Half (Transparent White) */}
                <div className="h-1/2 w-full bg-white/40 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 opacity-60"></div>
                </div>
                {/* Split line */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-0.5 h-1 bg-slate-700"></div>
              </motion.div>

              <button
                id="btn-open-capsule"
                onClick={(e) => {
                  e.stopPropagation();
                  revealCard();
                }}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full animate-bounce"
              >
                ✨ タップしてあける！ ✨
              </button>
            </motion.div>
          )}

          {/* 3. Card Revealed Details */}
          {revealedCard && (
            <motion.div
              key="card-reveal"
              initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 80 }}
              className="flex flex-col items-center w-full px-4"
            >
              {/* Trading Card Frame */}
              <div className={`w-[200px] h-auto border-4 rounded-2xl p-2.5 flex flex-col items-center relative overflow-hidden ${getRarityCardStyle(revealedCard.rarity)}`}>
                
                {/* Sparkle badge */}
                {revealedCard.rarity === 'UR' && (
                  <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-black py-1 px-2.5 rounded-bl-xl shadow rotate-12 z-10">
                    UR
                  </div>
                )}
                {revealedCard.rarity === 'SSR' && (
                  <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black py-1 px-2.5 rounded-bl-xl shadow rotate-12 z-10">
                    SSR
                  </div>
                )}
                {revealedCard.rarity === 'SR' && (
                  <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-black py-1 px-2.5 rounded-bl-xl shadow z-10">
                    SR
                  </div>
                )}
                {revealedCard.rarity === 'R' && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black py-1 px-2.5 rounded-bl-xl shadow z-10">
                    R
                  </div>
                )}
                {revealedCard.rarity === 'N' && (
                  <div className="absolute -top-1 -right-1 bg-slate-400 text-white text-[9px] font-black py-1 px-2.5 rounded-bl-xl shadow z-10">
                    N
                  </div>
                )}

                {/* Custom Card indicator */}
                {revealedCard.isCustom && (
                  <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold py-0.5 px-1.5 rounded z-10">
                    おうち作
                  </div>
                )}

                {/* Image */}
                <div className="w-full aspect-[63/88] bg-slate-100 rounded-xl overflow-hidden mb-2 shadow-inner border border-slate-200">
                  <img
                    src={revealedCard.imageUrl}
                    alt={revealedCard.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Name */}
                <h3 className="text-sm font-black text-slate-800 mb-1 text-center w-full truncate">
                  {revealedCard.name}
                </h3>

                {/* Rarity Label */}
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full mb-1.5 border ${getRarityLabel(revealedCard.rarity).bg} ${getRarityLabel(revealedCard.rarity).border}`}>
                  {getRarityLabel(revealedCard.rarity).text}
                </span>

                {/* Description */}
                <p className="text-[10px] text-slate-600 leading-tight text-center w-full px-1">
                  {revealedCard.description}
                </p>
              </div>

              {/* Repeat Button */}
              <button
                id="btn-close-reveal"
                onClick={() => { setRevealedCard(null); revealInProgressRef.current = false; }}
                className="mt-3 px-6 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-full hover:bg-slate-700 active:scale-95 transition-all"
              >
                もどる
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Error / Alert Messages */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs font-bold rounded-xl text-center w-full"
        >
          {errorMsg}
        </motion.div>
      )}

      {/* Info text */}
      <div className="text-[10px] text-slate-400 font-medium text-center">
        コインは、さんすうや漢字ドリルを解いたり、まいにち勉強するともらえるよ！
      </div>
    </div>
  );
}
