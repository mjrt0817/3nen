import React, { useState } from 'react';
import { Card, LearningLog, RarityType, GachaRates } from '../types';
import { Plus, Trash2, Pencil, Heart, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, BookOpen, Coins, Beaker } from 'lucide-react';

interface ParentsDashboardProps {
  learningLogs: LearningLog[];
  customCards: Card[];
  unlockedCardIds: string[];
  currentStreak: number;
  gachaRates?: GachaRates;
  onAddCustomCard: (card: Card) => void;
  onDeleteCustomCard: (cardId: string) => void;
  onUpdateCustomCard: (card: Card) => void;
  onClearLogs: () => void;
  onResetCards: () => void;
  onResetCoins: () => void;
  onAddCoinsTest: () => void;
  onChangeGachaRates: (rates: GachaRates) => void;
}

const CARD_TEMPLATES = [
  { name: 'しば犬おまわりさん 🐕', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&auto=format&fit=crop&q=80' },
  { name: 'レインボードラゴン 🐉', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&auto=format&fit=crop&q=80' },
  { name: 'おてつだいロボ 🤖', url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&auto=format&fit=crop&q=80' },
  { name: 'きらきらネコプリンセス 🐱', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80' },
  { name: 'ゴールド王冠 👑', url: 'https://images.unsplash.com/photo-1578269174936-2709b5a5e06e?w=1200&auto=format&fit=crop&q=80' },
];

export default function ParentsDashboard({
  learningLogs,
  customCards,
  unlockedCardIds,
  currentStreak,
  gachaRates,
  onAddCustomCard,
  onDeleteCustomCard,
  onUpdateCustomCard,
  onClearLogs,
  onResetCards,
  onResetCoins,
  onAddCoinsTest,
  onChangeGachaRates
}: ParentsDashboardProps) {
  
  // Passcode Lock State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Custom Card Form State
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardRarity, setCardRarity] = useState<RarityType>('N');
  const [imageUrlType, setImageUrlType] = useState<'template' | 'upload'>('template');
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(CARD_TEMPLATES[0].url);
  const [uploadedImageData, setUploadedImageData] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Stats calculation
  const totalDrills = learningLogs.length;
  const correctDrills = learningLogs.filter(log => log.isCorrect).length;
  const accuracyRate = totalDrills > 0 ? Math.round((correctDrills / totalDrills) * 100) : 0;
  
  const totalCoins = learningLogs.reduce((sum, log) => sum + log.coinsEarned, 0);
  const mathLogs = learningLogs.filter(log => log.subject === 'math');
  const kanjiLogs = learningLogs.filter(log => log.subject === 'kanji');

  // Weakness Analysis (苦手分析): Automatically extracts topics with accuracy < 75%
  const getWeakTopics = () => {
    const topicsMap: { [key: string]: { total: number; correct: number; subject: string } } = {};
    
    learningLogs.forEach(log => {
      const key = `${log.subject === 'math' ? '算数' : '漢字'}-${log.topicName}`;
      if (!topicsMap[key]) {
        topicsMap[key] = { total: 0, correct: 0, subject: log.subject };
      }
      topicsMap[key].total += 1;
      if (log.isCorrect) {
        topicsMap[key].correct += 1;
      }
    });

    const weakTopics: { name: string; accuracy: number; total: number; subject: string }[] = [];
    Object.keys(topicsMap).forEach(key => {
      const stats = topicsMap[key];
      const acc = Math.round((stats.correct / stats.total) * 100);
      if (acc < 75 && stats.total >= 1) { // flag as weak if accuracy < 75%
        weakTopics.push({
          name: key,
          accuracy: acc,
          total: stats.total,
          subject: stats.subject
        });
      }
    });

    return weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  };

  const weakTopics = getWeakTopics();

  // File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("画像ファイルは5MB以下にしてください。");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 1200; // Resize to max 1200px for ultra-sharp high resolution on tablets
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Save as clear high resolution JPEG (0.9 quality)
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
              setUploadedImageData(compressedDataUrl);
            } else {
              setUploadedImageData(reader.result as string);
            }
          };
          img.onerror = () => {
            setUploadedImageData(reader.result as string);
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding or updating card
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim() || !cardDesc.trim()) return;

    const finalUrl = imageUrlType === 'template' ? selectedTemplateUrl : (uploadedImageData || CARD_TEMPLATES[0].url);

    if (editingCard) {
      // Update existing card
      const updatedCard: Card = {
        ...editingCard,
        name: cardName,
        description: cardDesc,
        rarity: cardRarity,
        imageUrl: finalUrl,
        updatedAt: Date.now(),
      };
      onUpdateCustomCard(updatedCard);
      setEditingCard(null);
    } else {
      // Create new card
      const newCard: Card = {
        id: 'custom_' + Date.now(),
        name: cardName,
        description: cardDesc,
        rarity: cardRarity,
        imageUrl: finalUrl,
        isCustom: true,
        updatedAt: Date.now(),
      };
      onAddCustomCard(newCard);
    }
    
    // Clear form
    setCardName('');
    setCardDesc('');
    setUploadedImageData('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const startEditing = (card: Card) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardDesc(card.description);
    setCardRarity(card.rarity);
    // Check if image URL matches any template
    const isTemplate = CARD_TEMPLATES.some(tpl => tpl.url === card.imageUrl);
    if (isTemplate) {
      setImageUrlType('template');
      setSelectedTemplateUrl(card.imageUrl);
      setUploadedImageData('');
    } else {
      setImageUrlType('upload');
      setUploadedImageData(card.imageUrl);
      setSelectedTemplateUrl(CARD_TEMPLATES[0].url);
    }
  };

  const cancelEditing = () => {
    setEditingCard(null);
    setCardName('');
    setCardDesc('');
    setCardRarity('N');
    setImageUrlType('template');
    setSelectedTemplateUrl(CARD_TEMPLATES[0].url);
    setUploadedImageData('');
  };

  if (!isAuthenticated) {
    const handleKeypadPress = (num: string) => {
      setPasscodeError('');
      if (passcode.length < 4) {
        const nextPasscode = passcode + num;
        setPasscode(nextPasscode);
        
        // Auto check when length is 4
        if (nextPasscode === '6431') {
          setIsAuthenticated(true);
        } else if (nextPasscode.length === 4) {
          setTimeout(() => {
            setPasscodeError('パスワードがちがいます！');
            setPasscode('');
          }, 300);
        }
      }
    };

    const handleDelete = () => {
      setPasscode(prev => prev.slice(0, -1));
    };

    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border-4 border-indigo-200 p-8 shadow-sm flex flex-col items-center my-6">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-lg font-black text-slate-800 text-center mb-1">保護者（おうちの人）専用ページ</h2>
        <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
          この先は、お子さまの学習ログの確認や、ごほうびカードの登録ができる管理画面です。パスワード（4けた）を入力してください。
        </p>

        {/* Passcode indicators */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                passcode.length > idx
                  ? 'bg-indigo-600 border-indigo-600 scale-110'
                  : 'bg-white border-slate-300'
              }`}
            />
          ))}
        </div>

        {passcodeError && (
          <p className="text-xs font-bold text-red-500 mb-6 text-center animate-bounce">
            {passcodeError}
          </p>
        )}

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="w-16 h-16 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xl flex items-center justify-center border border-slate-100 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm flex items-center justify-center border border-red-100 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            消去
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="w-16 h-16 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xl flex items-center justify-center border border-slate-100 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            0
          </button>
          <div className="w-16 h-16" /> {/* empty space */}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">

      {/* Top Lock Button Bar */}
      <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="text-indigo-600" size={18} />
            <span>保護者ダッシュボード</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold">お子様の進捗状況と、ごほうびカードの管理</p>
        </div>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            setPasscode('');
          }}
          className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>🔒 画面をロック</span>
        </button>
      </div>
      
      {/* Overview stats panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Stat 1 */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-indigo-700 font-extrabold flex items-center gap-1">
            <BookOpen size={14} />
            <span>といたもんだい数</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-indigo-900 font-mono">{totalDrills}</span>
            <span className="text-xs font-bold text-indigo-700">問</span>
          </div>
          <p className="text-[10px] text-indigo-500 font-bold mt-1">
            算数: {mathLogs.length}問 / 漢字: {kanjiLogs.length}問
          </p>
        </div>

        {/* Stat 2 */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
            <CheckCircle2 className="text-emerald-500" size={14} />
            <span>平均正解率</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-900 font-mono">{accuracyRate}</span>
            <span className="text-xs font-bold text-emerald-700">%</span>
          </div>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">
            目標の80%まであと {Math.max(0, 80 - accuracyRate)}%！
          </p>
        </div>

        {/* Stat 3 */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-amber-700 font-extrabold flex items-center gap-1">
            <Sparkles className="text-amber-500" size={14} />
            <span>れんぞく学習日数</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-amber-900 font-mono">{currentStreak}</span>
            <span className="text-xs font-bold text-amber-700">日</span>
          </div>
          <p className="text-[10px] text-amber-500 font-bold mt-1">
            毎日こつこつがんばっています！
          </p>
        </div>

        {/* Stat 4 */}
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-rose-700 font-extrabold flex items-center gap-1">
            <Heart className="text-rose-500" size={14} />
            <span>登録カスタムカード</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-rose-900 font-mono">{customCards.length}</span>
            <span className="text-xs font-bold text-rose-700">枚</span>
          </div>
          <p className="text-[10px] text-rose-500 font-bold mt-1">
            お子様の学習を促す自作カード
          </p>
        </div>

      </div>

      {/* Weakness Analyzer Dashboard Panel */}
      <div className="bg-white rounded-3xl border-4 border-amber-200 p-6 shadow-xs">
        <h3 className="text-base font-black text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" />
          <span>🎯 自動苦手分析レポート（正解率75%未満の単元）</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          お子様が間違えやすい問題の傾向を自動で抽出しています。おうちで一緒に見直してあげてください。
        </p>

        {weakTopics.length > 0 ? (
          <div className="flex flex-col gap-3">
            {weakTopics.map((topic, idx) => (
              <div 
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl"
              >
                <div>
                  <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md mr-2 ${
                    topic.subject === 'math' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {topic.subject === 'math' ? '算数' : '漢字'}
                  </span>
                  <span className="text-sm font-black text-slate-800">{topic.name.split('-')[1]}</span>
                  <span className="text-xs text-slate-500 ml-2">（挑戦数: {topic.total}回）</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500">正解率: </span>
                    <span className="text-sm font-black text-amber-700">{topic.accuracy}%</span>
                  </div>
                  
                  {/* Progress gauge */}
                  <div className="w-[100px] h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500"
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-2xl">
            <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
            <p className="text-xs font-black text-slate-700">素晴らしいです！苦手な分野はまだ見つかっていません。</p>
            <p className="text-[10px] text-slate-400">問題を解くほど、より正確に分析されます。</p>
          </div>
        )}
      </div>

      {/* Parents Register Cards (親子コレクション機能) */}
      <div className="bg-white rounded-3xl border-4 border-rose-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Form Column */}
        <div>
          <h3 className="text-base font-black text-rose-800 mb-2 flex items-center gap-2">
            {editingCard ? <Pencil className="text-rose-500 animate-pulse" size={18} /> : <Plus className="text-rose-500 animate-pulse" size={18} />}
            <span>{editingCard ? '✏️ ごほうびカードを修正する' : '🎨 ごほうびカードを新規登録する'}</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {editingCard ? '登録したカードの内容（名前、説明、イラスト、レア度）を書き換えることができます。' : '「お風呂を洗ってくれた！」「テストで100点！」など、オリジナルのカードを作ってガチャに混ぜることができます。'}
          </p>

          <form onSubmit={handleSaveCard} className="flex flex-col gap-4">
            
            {/* Card Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">カードの名前</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="例: がんばりマスターレオ"
                maxLength={20}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">カードの説明文（褒め言葉など）</label>
              <textarea
                value={cardDesc}
                onChange={(e) => setCardDesc(e.target.value)}
                placeholder="例: まいにち宿題をがんばっている、きみの努力から生まれた特別なゴールドライオンだ！えらい！"
                maxLength={100}
                rows={3}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">レア度</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rarity"
                    value="N"
                    checked={cardRarity === 'N'}
                    onChange={() => setCardRarity('N')}
                  />
                  <span>N</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rarity"
                    value="R"
                    checked={cardRarity === 'R'}
                    onChange={() => setCardRarity('R')}
                  />
                  <span>R ⭐</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rarity"
                    value="SR"
                    checked={cardRarity === 'SR'}
                    onChange={() => setCardRarity('SR')}
                  />
                  <span>SR 🌟</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rarity"
                    value="SSR"
                    checked={cardRarity === 'SSR'}
                    onChange={() => setCardRarity('SSR')}
                  />
                  <span>SSR 💎</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rarity"
                    value="UR"
                    checked={cardRarity === 'UR'}
                    onChange={() => setCardRarity('UR')}
                  />
                  <span>UR 👑</span>
                </label>
              </div>
            </div>

            {/* Image Source Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">カードのイラスト</label>
              <div className="flex gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setImageUrlType('template')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold cursor-pointer transition-all ${
                    imageUrlType === 'template' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  テンプレートから選ぶ
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrlType('upload')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold cursor-pointer transition-all ${
                    imageUrlType === 'upload' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  画像をアップロードする
                </button>
              </div>

              {imageUrlType === 'template' ? (
                <select
                  value={selectedTemplateUrl}
                  onChange={(e) => setSelectedTemplateUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                >
                  {CARD_TEMPLATES.map((tpl, i) => (
                    <option key={i} value={tpl.url}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {uploadedImageData ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm mt-1">
                      <img
                        src={uploadedImageData}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold">画像をアップロードしてください。5MB以下の画像が使用できます。</p>
                  )}
                </div>
              )}
            </div>

            {formSuccess && (
              <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg text-center">
                {editingCard ? 'カードを修正したよ！' : 'カードを登録したよ！ガチャから出るようになります。'}
              </div>
            )}

            <div className="flex gap-2">
              {editingCard && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  キャンセル
                </button>
              )}
              <button
                id="btn-register-card"
                type="submit"
                className={`py-2 text-white font-black text-xs rounded-xl transition-colors shadow-sm cursor-pointer ${
                  editingCard ? 'flex-1 bg-indigo-600 hover:bg-indigo-700' : 'w-full bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {editingCard ? '変更を保存する' : 'カードを登録する！'}
              </button>
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="flex flex-col">
          <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5">
            <span>📋 登録ずみカスタムカード一覧</span>
            <span className="text-xs text-rose-600">({customCards.length}枚)</span>
          </h4>

          {customCards.length > 0 ? (
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
              {customCards.map((card) => (
                <div 
                  key={card.id}
                  className="flex items-center gap-3 p-3 border border-slate-100 bg-slate-50 rounded-xl"
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-slate-800 truncate">{card.name}</span>
                      <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                        {card.rarity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{card.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(card)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        editingCard?.id === card.id 
                          ? 'text-indigo-600 bg-indigo-50' 
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title="修正"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (editingCard?.id === card.id) {
                          cancelEditing();
                        }
                        onDeleteCustomCard(card.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <BookOpen size={32} className="opacity-40 mb-2" />
              <p className="text-xs font-bold">まだ自作のカードはありません。</p>
              <p className="text-[10px] mt-1">左のフォームから、お子様を褒めちぎる特別なカードを作ってみましょう！</p>
            </div>
          )}
        </div>

      </div>

      {/* Raw Learning Log (進捗の確認テーブル) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800">
              📈 がんばり学習履歴（学習ログ）
            </h3>
            <p className="text-xs text-slate-500">
              これまでお子様が回答した履歴の一覧です。
            </p>
          </div>
          {onClearLogs && learningLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>ログを消去</span>
            </button>
          )}
        </div>

        {learningLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2.5 px-2">日時</th>
                  <th className="py-2.5 px-2">教科</th>
                  <th className="py-2.5 px-2">問題</th>
                  <th className="py-2.5 px-2">回答</th>
                  <th className="py-2.5 px-2">判定</th>
                  <th className="py-2.5 px-2">点数</th>
                  <th className="py-2.5 px-2">獲得コイン</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learningLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2 text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-2 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.subject === 'math' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.subject === 'math' ? '算数' : '漢字'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-700 font-semibold truncate max-w-[150px]" title={log.questionText}>
                      {log.questionText}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-600">{log.userAnswer}</td>
                    <td className="py-2 px-2">
                      <span className={`font-black ${log.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                        {log.isCorrect ? '〇 正解' : '× 不正解'}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-bold text-slate-800">{log.score}点</td>
                    <td className="py-2 px-2 text-amber-600 font-bold font-mono">+{log.coinsEarned}c</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
            まだ学習履歴がありません。勉強をはじめましょう！
          </div>
        )}
      </div>

      {/* Test & Settings Panel */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-1 mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Beaker size={18} className="text-purple-600" />
            🔧 テスト機能・データリセット
          </h3>
          <p className="text-xs text-slate-500">
            図鑑やコインの初期化、テスト用のコイン追加、ガチャの確率設定などを行います。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Reset Controls */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-2">データリセット</h4>
            
            <button
              onClick={() => {
                if(window.confirm('学習記録をすべて消去しますか？（※コインや図鑑はそのままです）')) {
                  onClearLogs();
                }
              }}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>学習記録をリセット</span>
              <Trash2 size={14} />
            </button>

            <button
              onClick={() => {
                if(window.confirm('集めたカード（図鑑）をすべてリセットしますか？')) {
                  onResetCards();
                }
              }}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>図鑑（カード）をリセット</span>
              <Trash2 size={14} />
            </button>

            <button
              onClick={() => {
                if(window.confirm('コインを0枚にリセットしますか？')) {
                  onResetCoins();
                }
              }}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>コインをリセット</span>
              <Trash2 size={14} />
            </button>
          </div>

          {/* Test Tools */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-700 border-b border-slate-100 pb-2">テスト機能</h4>
            
            <button
              onClick={() => {
                if(window.confirm('テスト用にコインを100枚追加しますか？')) {
                  onAddCoinsTest();
                }
              }}
              className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all flex items-center justify-between cursor-pointer"
            >
              <span>コインを+100枚増やす</span>
              <Coins size={14} />
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-black text-slate-600">ガチャの出現率（％）</span>
              
              {['UR', 'SSR', 'SR', 'R', 'N'].map(r => {
                const rarity = r as RarityType;
                return (
                  <div key={rarity} className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="w-8">{rarity}</span>
                    <input 
                      type="number"
                      value={gachaRates?.[rarity] ?? (rarity === 'UR' ? 2.5 : rarity === 'SSR' ? 7.5 : rarity === 'SR' ? 15 : rarity === 'R' ? 25 : 50)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const current = gachaRates || { UR: 2.5, SSR: 7.5, SR: 15, R: 25, N: 50 };
                        onChangeGachaRates({ ...current, [rarity]: val });
                      }}
                      className="w-16 px-2 py-1 text-right border border-slate-300 rounded focus:border-indigo-400 focus:outline-none"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-slate-400 ml-1">%</span>
                  </div>
                )
              })}
              
              <div className="text-[10px] text-slate-400 font-bold mt-1 text-right">
                合計: {Object.values(gachaRates || { UR: 2.5, SSR: 7.5, SR: 15, R: 25, N: 50 }).reduce((a,b)=>a+b, 0).toFixed(1)}%
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
