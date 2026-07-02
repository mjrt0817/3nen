import React, { useState, useEffect } from 'react';
import { StudentState, LearningLog, Card, Badge } from './types';
import { DEFAULT_CARDS, DEFAULT_BADGES } from './data';
import ArithmeticGame from './components/ArithmeticGame';
import KanjiGame from './components/KanjiGame';
import GachaView from './components/GachaView';
import AlbumView from './components/AlbumView';
import ParentsDashboard from './components/ParentsDashboard';
import { 
  BookOpen, 
  Sparkles, 
  Coins, 
  Flame, 
  Award, 
  Lock, 
  Trophy, 
  Grid3X3, 
  Settings, 
  ShieldCheck,
  ChevronRight,
  Heart,
  Calendar,
  Undo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase imports
import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default initial state
const INITIAL_STATE: StudentState = {
  coins: 50, // Start with some pocket coins so they can try Gacha immediately!
  unlockedCardIds: ['n1'], // pre-unlock one card
  customCards: [],
  learningLogs: [],
  currentStreak: 1,
  longestStreak: 1,
  lastStudyDate: null,
  unlockedBadgeIds: [],
};

export default function App() {
  const [state, setState] = useState<StudentState>(() => {
    const saved = localStorage.getItem('study_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'study' | 'gacha' | 'album' | 'badges' | 'parents'>('study');
  const [activeDrill, setActiveDrill] = useState<'none' | 'math' | 'kanji'>('none');
  const [newBadgeUnlocked, setNewBadgeUnlocked] = useState<Badge | null>(null);

  // Firebase User Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // 1. Auth State & Firestore Sync Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const cloudData = userDocSnap.data() as StudentState;
            // Merge local storage and cloud states to ensure no progress is lost
            setState(prev => {
              const merged: StudentState = {
                coins: Math.max(prev.coins, cloudData.coins || 0),
                unlockedCardIds: Array.from(new Set([...prev.unlockedCardIds, ...(cloudData.unlockedCardIds || [])])),
                customCards: [
                  ...prev.customCards,
                  ...(cloudData.customCards || []).filter(c1 => !prev.customCards.some(c2 => c2.id === c1.id))
                ],
                learningLogs: [
                  ...prev.learningLogs,
                  ...(cloudData.learningLogs || []).filter(l1 => !prev.learningLogs.some(l2 => l2.id === l1.id))
                ].sort((a, b) => b.timestamp - a.timestamp),
                currentStreak: Math.max(prev.currentStreak, cloudData.currentStreak || 0),
                longestStreak: Math.max(prev.longestStreak, cloudData.longestStreak || 0),
                lastStudyDate: prev.lastStudyDate || cloudData.lastStudyDate || null,
                unlockedBadgeIds: Array.from(new Set([...prev.unlockedBadgeIds, ...(cloudData.unlockedBadgeIds || [])])),
                childName: cloudData.childName || prev.childName,
              };
              return merged;
            });
          } else {
            // Create initial record in Firestore with local state
            await setDoc(userDocRef, state);
          }
        } catch (e) {
          console.error("Firestore sync error on auth change:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync state to localstorage or firestore whenever it changes
  useEffect(() => {
    if (isSyncing) return;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, state).catch(e => console.error("Firestore write error:", e));
    } else {
      localStorage.setItem('study_app_state', JSON.stringify(state));
    }
  }, [state, user, isSyncing]);

  // Google Login / Logout handlers
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("ログインに失敗しました。もういちど試してください。");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("ログアウトしますか？データはクラウドに保存されています。")) {
      try {
        await signOut(auth);
        setUser(null);
        const saved = localStorage.getItem('study_app_state');
        if (saved) {
          try {
            setState(JSON.parse(saved));
          } catch (e) {
            setState(INITIAL_STATE);
          }
        } else {
          setState(INITIAL_STATE);
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setState(prev => ({ ...prev, childName: tempName.trim() }));
    }
    setIsEditingName(false);
  };

  // Check and unlock badges automatically based on criteria
  useEffect(() => {
    const checkBadgeUnlocks = () => {
      const logsCount = state.learningLogs.length;
      const streak = state.currentStreak;
      const cardsCount = state.unlockedCardIds.length;
      const newlyUnlockedIds: string[] = [...state.unlockedBadgeIds];
      let freshlyUnlockedBadge: Badge | null = null;

      DEFAULT_BADGES.forEach(badge => {
        if (state.unlockedBadgeIds.includes(badge.id)) return;

        let shouldUnlock = false;
        if (badge.id === 'badge_1' && logsCount > 0) {
          shouldUnlock = true;
        } else if (badge.id === 'badge_2' && streak >= 3) {
          shouldUnlock = true;
        } else if (badge.id === 'badge_3' && streak >= 5) {
          shouldUnlock = true;
        } else if (badge.id === 'badge_4' && streak >= 7) {
          shouldUnlock = true;
        } else if (badge.id === 'badge_5' && cardsCount >= 5) {
          shouldUnlock = true;
        }

        if (shouldUnlock) {
          newlyUnlockedIds.push(badge.id);
          freshlyUnlockedBadge = badge;
        }
      });

      if (freshlyUnlockedBadge) {
        setState(prev => ({
          ...prev,
          unlockedBadgeIds: newlyUnlockedIds
        }));
        setNewBadgeUnlocked(freshlyUnlockedBadge);
      }
    };

    if (state.learningLogs.length > 0 || state.unlockedCardIds.length > 1) {
      checkBadgeUnlocks();
    }
  }, [state.learningLogs, state.currentStreak, state.unlockedCardIds, state.unlockedBadgeIds]);

  // Weekend greeting logic helper
  const getMotivationalGreeting = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      return {
        text: '🎉 週末もお勉強をがんばるなんて、本当に素晴らしいね！この調子でカードを集めよう！',
        isWeekend: true
      };
    }
    return {
      text: '✨ 今日もコツコツ勉強して、キラキラのトレーディングカードをゲットしよう！',
      isWeekend: false
    };
  };

  const greeting = getMotivationalGreeting();

  // Streak update function when completing a daily drill
  const updateStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDate = state.lastStudyDate;

    if (lastDate === todayStr) {
      // Already studied today, keep streak the same
      return;
    }

    let newStreak = state.currentStreak;
    if (lastDate === null) {
      newStreak = 1;
    } else {
      const last = new Date(lastDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // broken streak, reset
      }
    }

    setState(prev => ({
      ...prev,
      lastStudyDate: todayStr,
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak)
    }));
  };

  // Callback when math or kanji drill completes
  const handleDrillComplete = (newLogs: Omit<LearningLog, 'id' | 'timestamp'>[]) => {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0];

    const logsWithMetadata: LearningLog[] = newLogs.map((log, idx) => ({
      ...log,
      id: `log_${timestamp}_${idx}`,
      date: dateStr,
      timestamp: timestamp,
    }));

    // Calculate sum of coins earned
    const totalCoinsEarned = logsWithMetadata.reduce((sum, log) => sum + log.coinsEarned, 0);

    setState(prev => ({
      ...prev,
      learningLogs: [ ...logsWithMetadata, ...prev.learningLogs ], // newest first
      coins: prev.coins + totalCoinsEarned
    }));

    updateStreak();
    setActiveDrill('none');
  };

  // Triggered when Gacha pulls a card successfully
  const handleDrawCard = (card: Card, cost: number) => {
    setState(prev => {
      const isAlreadyUnlocked = prev.unlockedCardIds.includes(card.id);
      return {
        ...prev,
        coins: Math.max(0, prev.coins - cost),
        unlockedCardIds: isAlreadyUnlocked ? prev.unlockedCardIds : [...prev.unlockedCardIds, card.id]
      };
    });
  };

  const handleAddCustomCard = (newCard: Card) => {
    setState(prev => ({
      ...prev,
      customCards: [...prev.customCards, newCard]
    }));
  };

  const handleDeleteCustomCard = (cardId: string) => {
    setState(prev => ({
      ...prev,
      customCards: prev.customCards.filter(c => c.id !== cardId),
      unlockedCardIds: prev.unlockedCardIds.filter(id => id !== cardId)
    }));
  };

  const handleClearLogs = () => {
    setState(prev => ({ ...prev, learningLogs: [] }));
  };

  const handleResetCards = () => {
    setState(prev => ({ ...prev, unlockedCardIds: [] }));
  };

  const handleResetCoins = () => {
    setState(prev => ({ ...prev, coins: 0 }));
  };

  const handleAddCoinsTest = () => {
    setState(prev => ({ ...prev, coins: prev.coins + 100 }));
  };

  const handleChangeGachaRates = (rates: any) => {
    setState(prev => ({ ...prev, gachaRates: rates }));
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="text-blue-500" size={32} />;
      case 'Flame': return <Flame className="text-orange-500" size={32} />;
      case 'Award': return <Award className="text-amber-500 animate-bounce" size={32} />;
      case 'Trophy': return <Trophy className="text-yellow-500" size={32} />;
      default: return <Grid3X3 className="text-emerald-500" size={32} />;
    }
  };

  return (
    <div id="app-root" className="flex flex-col md:flex-row h-screen w-full bg-[#F0F4F8] text-[#2D3748] font-sans overflow-hidden">
      
      {/* 1. Sleek Navigation Sidebar */}
      <nav className="w-full md:w-24 bg-[#4A90E2] flex flex-row md:flex-col items-center justify-between md:justify-start py-3 md:py-8 px-4 md:px-0 gap-6 md:gap-10 shadow-lg shrink-0 z-30">
        
        {/* App Logo Emblem */}
        <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-inner cursor-pointer" onClick={() => setActiveTab('study')}>
          <div className="w-6 h-6 md:w-8 md:h-8 bg-[#4A90E2] rounded-full flex items-center justify-center font-black text-white text-[10px] md:text-sm">
            小3
          </div>
        </div>

        {/* Action Tabs Menu */}
        <div className="flex flex-row md:flex-col gap-4 md:gap-8 overflow-x-auto no-scrollbar">
          
          {/* Tab 1: Drills */}
          <button
            id="tab-study"
            onClick={() => { setActiveTab('study'); setActiveDrill('none'); }}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'study' ? 'opacity-100 text-white' : 'opacity-60 text-white hover:opacity-100'
            }`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activeTab === 'study' ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className="text-lg">📝</span>
            </div>
            <span className="text-[9px] font-black">べんきょう</span>
          </button>

          {/* Tab 2: Gacha */}
          <button
            id="tab-gacha"
            onClick={() => setActiveTab('gacha')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'gacha' ? 'opacity-100 text-white' : 'opacity-60 text-white hover:opacity-100'
            }`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activeTab === 'gacha' ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className="text-lg">🎰</span>
            </div>
            <span className="text-[9px] font-black">ガチャ</span>
          </button>

          {/* Tab 3: Encyclopedia/Album */}
          <button
            id="tab-album"
            onClick={() => setActiveTab('album')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'album' ? 'opacity-100 text-white' : 'opacity-60 text-white hover:opacity-100'
            }`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activeTab === 'album' ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className="text-lg">📖</span>
            </div>
            <span className="text-[9px] font-black">ずかん</span>
          </button>

          {/* Tab 4: Badges */}
          <button
            id="tab-badges"
            onClick={() => setActiveTab('badges')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'badges' ? 'opacity-100 text-white' : 'opacity-60 text-white hover:opacity-100'
            }`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activeTab === 'badges' ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className="text-lg">🏆</span>
            </div>
            <span className="text-[9px] font-black">バッジ</span>
          </button>

          {/* Tab 5: Parents Portal */}
          <button
            id="tab-parents"
            onClick={() => setActiveTab('parents')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'parents' ? 'opacity-100 text-white' : 'opacity-60 text-white hover:opacity-100'
            }`}
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activeTab === 'parents' ? 'bg-white/20' : 'bg-white/10'}`}>
              <span className="text-lg">⚙️</span>
            </div>
            <span className="text-[9px] font-black">おやへ</span>
          </button>

        </div>

        {/* Subtle decorative placeholder */}
        <div className="hidden md:block flex-1"></div>

      </nav>

      {/* 2. Main Content Stage */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
        
        {/* Dynamic Interactive Header */}
        <header className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-3xl shadow-xs border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700] rounded-full border-4 border-white shadow-xs overflow-hidden flex items-center justify-center text-2xl sm:text-3xl select-none">
              {user && user.photoURL ? (
                <img src={user.photoURL} alt="user avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                "🦁"
              )}
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="border-2 border-indigo-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 max-w-[150px]"
                    placeholder="おなまえ"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <h1 className="text-lg sm:text-2xl font-black text-[#1A365D] flex items-center gap-2">
                  こんにちは、{state.childName || (user ? user.displayName : null) || 'ゆうたくん'}！
                  <button
                    onClick={() => {
                      setTempName(state.childName || (user ? user.displayName : null) || 'ゆうたくん');
                      setIsEditingName(true);
                    }}
                    className="text-slate-300 hover:text-indigo-400 transition-colors p-1 rounded-full hover:bg-indigo-50 cursor-pointer"
                    title="なまえをかえる"
                  >
                    ✏️
                  </button>
                </h1>
              )}
              <p className={`text-xs sm:text-sm font-bold ${greeting.isWeekend ? 'text-indigo-600 animate-pulse' : 'text-[#718096]'}`}>
                {greeting.text}
              </p>
              {user && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] text-emerald-600 font-extrabold">☁️ クラウド同期中</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Wallet Indicators */}
            <div className="flex gap-2 flex-1 lg:flex-none">
              {/* Coins indicator */}
              <div className="flex-1 lg:flex-none bg-[#FFFBEB] px-4 py-1.5 rounded-2xl border-2 border-[#FEF3C7] flex items-center justify-center gap-1.5 shadow-2xs">
                <span className="text-base">🪙</span>
                <span className="text-lg font-black text-[#D97706] font-mono">{state.coins}</span>
                <span className="text-[10px] font-black text-[#D97706]">まい</span>
              </div>
              {/* Streak indicator */}
              <div className="flex-1 lg:flex-none bg-[#F0FFF4] px-4 py-1.5 rounded-2xl border-2 border-[#C6F6D5] flex items-center justify-center gap-1.5 shadow-2xs">
                <span className="text-base">🔥</span>
                <span className="text-lg font-black text-[#38A169] font-mono">{state.currentStreak}日連続</span>
              </div>
            </div>

            {/* Google Authentication Action Button */}
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                ログアウト
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>おうちの人ログイン</span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Sub-route Views based on active tab */}
        <div className="flex-1 min-h-0">
          
          {/* STUDY TAB */}
          {activeTab === 'study' && (
            <div className="h-full flex flex-col gap-6">
              
              {activeDrill === 'none' ? (
                /* Primary Drill Selector Home Card */
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-white flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                      <span className="text-blue-500">●</span> 
                      <span>きょうのトレーニング</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-lg">小学3年生向け</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
                    
                    {/* Math Card selector */}
                    <div 
                      id="btn-start-math"
                      onClick={() => setActiveDrill('math')}
                      className="bg-[#EBF8FF] rounded-3xl p-6 border-b-8 border-[#BEE3F8] relative overflow-hidden group cursor-pointer hover:bg-[#D6EFFF] transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div className="relative z-10 flex flex-col gap-2">
                        <span className="self-start text-[10px] font-black text-blue-600 bg-white px-2.5 py-1 rounded-md shadow-2xs">
                          さんすう
                        </span>
                        <h3 className="text-xl font-black text-blue-950 mt-2">
                          わり算・かけ算筆算ドリル
                        </h3>
                        <p className="text-xs text-blue-700/85 font-semibold">
                          3年生でならう「わり算」や「筆算」を楽しくとこう！
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          1回クリア：＋5コイン 🪙
                        </span>
                        <span className="text-xs font-black text-blue-900 flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-xl shadow-3xs">
                          <span>スタート</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                      <span className="absolute -right-4 -bottom-6 text-[110px] opacity-10 select-none group-hover:scale-110 transition-transform">➕</span>
                    </div>

                    {/* Kanji Card selector */}
                    <div 
                      id="btn-start-kanji"
                      onClick={() => setActiveDrill('kanji')}
                      className="bg-[#F0FFF4] rounded-3xl p-6 border-b-8 border-[#C6F6D5] relative overflow-hidden group cursor-pointer hover:bg-[#DCFCE7] transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div className="relative z-10 flex flex-col gap-2">
                        <span className="self-start text-[10px] font-black text-green-600 bg-white px-2.5 py-1 rounded-md shadow-2xs">
                          かんじ
                        </span>
                        <h3 className="text-xl font-black text-green-950 mt-2">
                          タブペンで漢字書きとりドリル
                        </h3>
                        <p className="text-xs text-green-700/85 font-semibold">
                          手書きでなぞって書こう！AIが自動で採点してくれるよ！
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          1回クリア：＋10コイン 🪙
                        </span>
                        <span className="text-xs font-black text-green-900 flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-xl shadow-3xs">
                          <span>スタート</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                      <span className="absolute -right-4 -bottom-6 text-[110px] opacity-10 select-none group-hover:scale-110 transition-transform">✍️</span>
                    </div>

                  </div>

                  {/* Weakness shortcut overlay */}
                  {state.learningLogs.length > 5 && (
                    <div className="mt-6 p-4 bg-[#FFF5F5] rounded-2xl border-b-4 border-[#FED7D7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                          <h4 className="text-xs font-black text-red-900">苦手をやっつけよう！</h4>
                          <p className="text-[10px] text-red-700/80 font-bold">自動分析でおうちの人が苦手な問題を教えてくれるよ！「おやへ」を見てみよう！</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('parents')} 
                        className="text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded-xl shadow-2xs hover:bg-red-600"
                      >
                        苦手分析をみる
                      </button>
                    </div>
                  )}

                </div>
              ) : activeDrill === 'math' ? (
                /* Active math game component */
                <ArithmeticGame
                  onComplete={handleDrillComplete}
                  onAddCoins={(c) => setState(prev => ({ ...prev, coins: prev.coins + c }))}
                />
              ) : (
                /* Active kanji writing canvas component */
                <KanjiGame
                  onComplete={handleDrillComplete}
                  onAddCoins={(c) => setState(prev => ({ ...prev, coins: prev.coins + c }))}
                />
              )}

            </div>
          )}

          {/* GACHA TAB */}
          {activeTab === 'gacha' && (
            <GachaView
              coins={state.coins}
              unlockedCardIds={state.unlockedCardIds}
              customCards={state.customCards}
              gachaRates={state.gachaRates}
              onDrawCard={handleDrawCard}
              onNavigateToAlbum={() => setActiveTab('album')}
            />
          )}

          {/* ALBUM TAB */}
          {activeTab === 'album' && (
            <AlbumView
              unlockedCardIds={state.unlockedCardIds}
              customCards={state.customCards}
            />
          )}

          {/* BADGES TAB */}
          {activeTab === 'badges' && (
            <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border-4 border-[#4A90E2]/20 p-6 shadow-xs">
              <h2 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                <span>🏆 獲得したアチーブメントバッジ 🏆</span>
              </h2>
              <p className="text-xs text-slate-500 mb-6 font-bold">
                毎日勉強をがんばったり、カードをたくさん集めると特別なバッジがもらえるよ！
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {DEFAULT_BADGES.map(badge => {
                  const isUnlocked = state.unlockedBadgeIds.includes(badge.id);

                  return (
                    <div 
                      key={badge.id}
                      className={`p-4 border-2 rounded-2xl flex items-center gap-4 transition-all ${
                        isUnlocked 
                          ? 'border-yellow-200 bg-yellow-50/10' 
                          : 'border-slate-100 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        isUnlocked ? 'bg-white border-yellow-300 shadow-xs' : 'bg-slate-200 border-slate-300'
                      }`}>
                        {isUnlocked ? renderBadgeIcon(badge.iconName) : <Lock className="text-slate-400" size={20} />}
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-800">
                          {badge.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                          {badge.description}
                        </p>
                        <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 ${
                          isUnlocked ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isUnlocked ? 'クリア！' : '未達成'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PARENTS PORTAL TAB */}
          {activeTab === 'parents' && (
            <ParentsDashboard
              learningLogs={state.learningLogs}
              customCards={state.customCards}
              unlockedCardIds={state.unlockedCardIds}
              currentStreak={state.currentStreak}
              gachaRates={state.gachaRates}
              onAddCustomCard={handleAddCustomCard}
              onDeleteCustomCard={handleDeleteCustomCard}
              onClearLogs={handleClearLogs}
              onResetCards={handleResetCards}
              onResetCoins={handleResetCoins}
              onAddCoinsTest={handleAddCoinsTest}
              onChangeGachaRates={handleChangeGachaRates}
            />
          )}

        </div>

      </main>

      {/* 4. Overlay Dialogue: Badge Unlocked Animation Notification */}
      <AnimatePresence>
        {newBadgeUnlocked && (
          <motion.div 
            id="badge-alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-white max-w-sm w-full rounded-3xl border-4 border-yellow-400 p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="absolute top-2 left-2 text-yellow-400 opacity-60 animate-bounce">✨</div>
              <div className="absolute bottom-2 right-2 text-yellow-400 opacity-60 animate-bounce">✨</div>

              <Award className="text-yellow-500 fill-yellow-200 mx-auto mb-3 animate-spin" size={64} />
              
              <h3 className="text-lg font-black text-[#1A365D] mb-1">
                バッジをゲットしたよ！！
              </h3>
              <p className="text-xs text-slate-500 font-bold mb-4">
                がんばるキミに、特別な勲章をおくります！
              </p>

              <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 mb-6">
                <span className="text-xs font-black text-yellow-800 block mb-1">
                  🏆 {newBadgeUnlocked.name}
                </span>
                <span className="text-[10px] text-slate-600 font-bold">
                  {newBadgeUnlocked.description}
                </span>
              </div>

              <button
                id="btn-close-badge-popup"
                onClick={() => setNewBadgeUnlocked(null)}
                className="w-full py-2.5 bg-yellow-500 text-white font-black text-xs rounded-xl shadow hover:bg-yellow-600 transition-colors"
              >
                ありがとう！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
