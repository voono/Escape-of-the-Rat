import React, { useState, useEffect } from 'react';
import { Shield, Eye, FileText, Briefcase, RefreshCw, XCircle, ArrowRight, AlertTriangle, Users, Check, Lock, Mic, Info, HelpCircle, X } from 'lucide-react';

// --- Helper Functions ---
const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ROLES = {
  RAT: 'دیکتاتور',
  DEVOTEE: 'فدایی',
  GUARD: 'گارد جاویدان'
};

const ITEMS = {
  passport: { id: 'passport', name: 'پاسپورت', icon: <Briefcase className="w-12 h-12 text-amber-500" />, desc: 'تیم دیکتاتور برای برد به تمام این پاسپورت‌ها نیاز دارد.' },
  intel: { id: 'intel', name: 'سند محرمانه', icon: <FileText className="w-12 h-12 text-sky-400" />, desc: 'در فاز سوم، یک دیتای اطلاعاتی مهم به شما می‌دهد.' },
  bug: { id: 'bug', name: 'میکروفون مخفی', icon: <Mic className="w-12 h-12 text-emerald-500" />, desc: 'هر کس اول بازی این را داشته باشد، در فاز آخر می‌فهمد میکروفون الان دست چه کسی است.' }
};

// --- Main App Component ---
export default function App() {
  const [gameState, setGameState] = useState('setup'); 
  const [playerNames, setPlayerNames] = useState(['', '', '', '', '']); // Removed default names
  const [players, setPlayers] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]); 
  const [turnIndex, setTurnIndex] = useState(0);
  const [requiredPassports, setRequiredPassports] = useState(0);
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState(null);
  const [arrestedId, setArrestedId] = useState('');
  const [intelFact, setIntelFact] = useState('');
  const [bugOriginalOwner, setBugOriginalOwner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // Setup Initial Game (Roles)
  const startGame = () => {
    const validNames = playerNames.filter(n => n.trim() !== '');
    const count = validNames.length;
    let ratCount = 1;
    let devoteeCount = count >= 9 ? 3 : count >= 7 ? 2 : 1;
    let guardCount = count - ratCount - devoteeCount;
    let passportsNeeded = ratCount + devoteeCount; 

    setRequiredPassports(passportsNeeded);

    let rolesArray = [
      ...Array(ratCount).fill(ROLES.RAT),
      ...Array(devoteeCount).fill(ROLES.DEVOTEE),
      ...Array(guardCount).fill(ROLES.GUARD)
    ];
    rolesArray = shuffle(rolesArray);

    const initialPlayers = validNames.map((name, index) => ({
      id: index,
      name: name,
      role: rolesArray[index],
      item: null
    }));

    setPlayers(initialPlayers);
    setRound(1);
    startRound(initialPlayers, passportsNeeded, 1);
  };

  // Start a new Round
  const startRound = (currentPlayers, passportsCount, roundNum) => {
    const intelsCount = currentPlayers.length - passportsCount - 1; 
    
    let deck = [
      ...Array(passportsCount).fill(ITEMS.passport.id),
      ITEMS.bug.id, 
      ...Array(Math.max(0, intelsCount)).fill(ITEMS.intel.id)
    ];
    deck = shuffle(deck);

    const updatedPlayers = currentPlayers.map(p => ({
      ...p,
      item: deck.pop()
    }));

    const bugOwner = updatedPlayers.find(p => p.item === ITEMS.bug.id);
    setBugOriginalOwner(bugOwner ? bugOwner.id : null);

    const order = shuffle(updatedPlayers.map(p => p.id));

    setPlayers(updatedPlayers);
    setTurnOrder(order);
    setTurnIndex(0);
    setRound(roundNum);
    setGameState('roundStart');
  };

  const currentPlayerId = turnOrder[turnIndex];
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  // Transition Helpers
  const nextTurnPhase1 = () => {
    if (turnIndex + 1 < turnOrder.length) {
      setTurnIndex(turnIndex + 1);
      setGameState('passPhone_1');
    } else {
      setGameState('phase1_discuss');
    }
  };

  const nextTurnPhase2 = () => {
    if (turnIndex + 1 < turnOrder.length) {
      setTurnIndex(turnIndex + 1);
      setGameState('passPhone_2');
    } else {
      checkDictatorWin();
    }
  };

  const nextTurnPhase3 = () => {
    if (turnIndex + 1 < turnOrder.length) {
      setTurnIndex(turnIndex + 1);
      setGameState('passPhone_3');
    } else {
      setGameState('voting');
    }
  };

  const handleSwap = (targetId) => {
    const newPlayers = [...players];
    const currIdx = newPlayers.findIndex(p => p.id === currentPlayerId);
    const targIdx = newPlayers.findIndex(p => p.id === targetId);

    const tempItem = newPlayers[currIdx].item;
    newPlayers[currIdx].item = newPlayers[targIdx].item;
    newPlayers[targIdx].item = tempItem;

    setPlayers(newPlayers);
    nextTurnPhase2();
  };

  const checkDictatorWin = () => {
    const dictTeamWithPassports = players.filter(p => 
      (p.role === ROLES.RAT || p.role === ROLES.DEVOTEE) && p.item === ITEMS.passport.id
    ).length;

    if (dictTeamWithPassports === requiredPassports) {
      setWinner({ 
        team: 'rat', 
        reason: `تیم دیکتاتور در این دست موفق شد تمام ${requiredPassports} پاسپورت را بین افراد خودش جمع‌آوری کند و با موفقیت فرار کرد!` 
      });
      setGameState('gameOver');
    } else {
      setTurnIndex(0);
      setGameState('passPhone_3');
    }
  };

  const generateIntelFact = (viewerId) => {
    const others = players.filter(p => p.id !== viewerId);
    const shuffledOthers = shuffle(others);
    const p1 = shuffledOthers[0];
    const p2 = shuffledOthers[1];

    const facts = [];
    if (p1 && p2) {
      const p1Team = (p1.role === ROLES.RAT || p1.role === ROLES.DEVOTEE) ? 'rat' : 'guard';
      const p2Team = (p2.role === ROLES.RAT || p2.role === ROLES.DEVOTEE) ? 'rat' : 'guard';
      facts.push(`${p1.name} و ${p2.name} در ${p1Team === p2Team ? 'یک جبهه' : 'جبهه‌های مخالف'} هستند.`);
    }

    facts.push(`${p1.name} قطعاً دیکتاتور نیست.`);
    const ratHasPassport = players.find(p => p.role === ROLES.RAT)?.item === ITEMS.passport.id;
    facts.push(`دیکتاتور در پایان این دور، پاسپورت ${ratHasPassport ? 'در دست دارد' : 'در دست ندارد'}.`);
    const guardsWithPassport = players.filter(p => p.role === ROLES.GUARD && p.item === ITEMS.passport.id).length;
    facts.push(guardsWithPassport > 0 ? `حداقل یک پاسپورت دست گارد جاویدان است.` : `هیچ پاسپورتی دست گارد جاویدان نیست.`);

    return facts[Math.floor(Math.random() * facts.length)];
  };

  const revealPhase3Item = () => {
    let messages = [];
    if (currentPlayerId === bugOriginalOwner) {
      const currentBugHolder = players.find(p => p.item === ITEMS.bug.id);
      if (currentBugHolder) {
        messages.push(`🎙️ سیگنال: میکروفون الان در دست «${currentBugHolder.name}» است.`);
      }
    }

    if (currentPlayer.item === ITEMS.intel.id) {
      messages.push(`📄 سند: ${generateIntelFact(currentPlayerId)}`);
    } else if (currentPlayer.item === ITEMS.bug.id && currentPlayerId !== bugOriginalOwner) {
      messages.push(`شما میکروفون را دارید. صاحب آن می‌داند میکروفون کجاست!`);
    }

    setIntelFact(messages.join('\n\n'));
    setGameState('phase3_intel');
  };

  const concludeVoting = () => {
    if (arrestedId !== '') {
      const arrestedPlayer = players.find(p => p.id === parseInt(arrestedId));
      if (arrestedPlayer.role === ROLES.RAT) {
        setWinner({ 
          team: 'guard', 
          reason: `گارد موفق شد دیکتاتور (${arrestedPlayer.name}) را دستگیر کند!` 
        });
        setGameState('gameOver');
        return;
      } else {
        alert(`اشتباه! ${arrestedPlayer.name} دیکتاتور نبود.`);
      }
    }
    setArrestedId('');
    startRound(players, requiredPassports, round + 1);
  };

  const ratPlayer = players.find(p => p.role === ROLES.RAT);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col items-center py-6 px-4 dir-rtl" dir="rtl">
      <div className="max-w-md w-full relative">
        
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto relative">
              <button onClick={() => setShowHelp(false)} className="absolute top-4 left-4 p-2 text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-black text-rose-500 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> راهنمای بازی
              </h3>
              <div className="space-y-4 text-sm text-zinc-300 leading-relaxed text-right">
                <p><strong>هدف تیم دیکتاتور:</strong> جمع‌آوری تمامی پاسپورت‌ها بین دیکتاتور و فداییان در پایان فاز معاوضه.</p>
                <p><strong>هدف تیم گارد:</strong> جلوگیری از فرار دیکتاتور با نگه داشتن حداقل یک پاسپورت یا دستگیری دیکتاتور در فاز رای‌گیری.</p>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-white/5">
                  <h4 className="font-bold text-white mb-1">مراحل هر دور:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>مشاهده آیتم‌ها (هویت و آیتم تصادفی)</li>
                    <li>دیپلماسی و گفتگو (بلوف آزاد!)</li>
                    <li>فاز معاوضه (اجباری یا اختیاری)</li>
                    <li>فاز اطلاعاتی (بررسی اسناد و میکروفون)</li>
                    <li>رای‌گیری (در صورت عدم فرار دیکتاتور)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        {['passPhone_1', 'passPhone_2', 'passPhone_3', 'gameOver'].indexOf(gameState) === -1 && (
          <div className="flex justify-between items-center mb-6 px-2">
            <h1 className="text-lg font-black text-rose-500 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              فرار موش‌ها
            </h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHelp(true)} className="p-2 bg-zinc-900 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              {gameState !== 'setup' && (
                <div className="flex gap-2 text-xs font-bold text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-full border border-white/10">
                  <span>روز {round}</span>
                  <span className="text-amber-400">{requiredPassports} پاسپورت</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 p-6 min-h-[480px] flex flex-col">
          
          {/* STATE: SETUP */}
          {gameState === 'setup' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">ثبت نام بازیکنان</h2>
                <p className="text-xs text-zinc-500">نام بازیکنان را وارد کنید (حداقل ۵ نفر).</p>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto px-1">
                {playerNames.map((name, i) => (
                  <div key={i} className="flex gap-2 group relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[i] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-all text-sm"
                      placeholder={`نام بازیکن ${i + 1}`}
                    />
                    {playerNames.length > 5 && (
                      <button onClick={() => setPlayerNames(playerNames.filter((_, idx) => idx !== i))} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-rose-400">
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {playerNames.length < 12 && (
                <button onClick={() => setPlayerNames([...playerNames, ''])} className="w-full py-3 text-xs font-bold text-zinc-500 hover:text-white border border-dashed border-white/10 rounded-2xl transition-all">
                  + بازیکن جدید
                </button>
              )}
              <button 
                onClick={startGame}
                disabled={playerNames.filter(n => n.trim() !== '').length < 5}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                شروع عملیات
              </button>
            </div>
          )}

          {/* STATE: ROUND START */}
          {gameState === 'roundStart' && (
            <div className="text-center py-8 space-y-8 animate-in zoom-in-95 duration-500 my-auto">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <Briefcase className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-3xl font-black text-white">روز {round}</h2>
              <div className="bg-zinc-950 p-5 rounded-3xl border border-white/5 text-zinc-300 text-sm leading-relaxed space-y-2">
                <p>در این دور آیتم‌های زیر پخش شده است:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                   <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold border border-amber-500/20">
                     {requiredPassports} پاسپورت
                   </span>
                   <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-500/20">
                     ۱ میکروفون
                   </span>
                   <span className="bg-sky-500/20 text-sky-500 px-3 py-1 rounded-lg text-xs font-bold border border-sky-500/20">
                     {players.length - requiredPassports - 1} سند محرمانه
                   </span>
                </div>
              </div>
              <button onClick={() => setGameState('passPhone_1')} className="w-full py-5 bg-white text-zinc-950 rounded-[1.5rem] font-black text-lg shadow-xl active:scale-95 transition-all">
                مشاهده آیتم‌ها
              </button>
            </div>
          )}

          {/* STATE: PASS PHONE */}
          {(gameState.startsWith('passPhone_')) && currentPlayer && (
            <div className="text-center py-16 space-y-8 animate-in slide-in-from-right-8 duration-300 my-auto">
              <Users className="w-16 h-16 mx-auto text-zinc-700" />
              <div className="space-y-4">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">نوبت بازیکن:</p>
                <h2 className="text-5xl font-black text-white">{currentPlayer.name}</h2>
              </div>
              <button 
                onClick={() => {
                  if(gameState === 'passPhone_1') setGameState('phase1_view');
                  if(gameState === 'passPhone_2') setGameState('phase2_action');
                  if(gameState === 'passPhone_3') revealPhase3Item();
                }}
                className="mt-12 px-8 py-5 bg-white text-zinc-950 rounded-[1.5rem] font-black text-xl w-full active:scale-95 transition-all shadow-2xl"
              >
                من {currentPlayer.name} هستم
              </button>
            </div>
          )}

          {/* PHASE 1: VIEW ITEM */}
          {gameState === 'phase1_view' && currentPlayer && (
            <div className="space-y-6 animate-in fade-in duration-300 text-center my-auto">
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                <div className="text-zinc-500 text-xs font-bold mb-1">هویت شما</div>
                <div className={`text-xl font-black ${currentPlayer.role === ROLES.GUARD ? 'text-sky-400' : 'text-rose-500'}`}>
                  {currentPlayer.role}
                </div>
                {currentPlayer.role === ROLES.DEVOTEE && ratPlayer && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-500 text-xs font-bold">نام دیکتاتور: {ratPlayer.name}</span>
                  </div>
                )}
              </div>

              <div className="bg-zinc-800/50 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <div className="flex justify-center mb-4 animate-bounce">
                  {ITEMS[currentPlayer.item]?.icon}
                </div>
                <h4 className="text-3xl font-black text-white">{ITEMS[currentPlayer.item]?.name}</h4>
                <p className="text-zinc-500 text-[10px] mt-2 leading-relaxed px-4">{ITEMS[currentPlayer.item]?.desc}</p>
              </div>

              <button onClick={nextTurnPhase1} className="w-full py-5 bg-zinc-100 text-zinc-900 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-lg">
                تایید
              </button>
            </div>
          )}

          {/* PHASE 1: DISCUSSION */}
          {gameState === 'phase1_discuss' && (
            <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500 my-auto">
              <AlertTriangle className="w-16 h-16 mx-auto text-amber-500" />
              <h2 className="text-3xl font-black text-white leading-tight">فاز دیپلماسی</h2>
              <p className="text-zinc-400 text-sm leading-relaxed px-4">
                همه بازیکنان آیتم‌های خود را دیدند. حالا در مورد آیتم‌هایتان صحبت کنید. مواظب باشید، ممکن است قبل از نوبت شما در فاز بعد، کسی آیتم‌تان را بدزدد!
              </p>
              <button onClick={() => { setTurnIndex(0); setGameState('passPhone_2'); }} className="w-full py-5 bg-rose-600 text-white font-black text-xl rounded-3xl shadow-xl shadow-rose-950/20 active:scale-95 transition-all">
                شروع فاز معاوضه
              </button>
            </div>
          )}

          {/* PHASE 2: ACTION */}
          {gameState === 'phase2_action' && currentPlayer && (
            <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full">
              <div className="text-center mb-2">
                <h3 className="text-white font-black text-2xl">معاوضه آیتم</h3>
                <p className="text-zinc-500 text-xs mt-1">یک بازیکن را برای تعویض انتخاب کنید یا نگه دارید.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto px-1">
                {players.filter(p => p.id !== currentPlayerId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSwap(p.id)}
                    className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl text-white font-bold border border-white/5 active:bg-sky-600 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5 opacity-30" />
                    <span className="text-sm">{p.name}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => nextTurnPhase2()}
                className="w-full py-5 mt-4 bg-zinc-950 text-zinc-400 border border-white/10 rounded-2xl font-black active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" /> نگه داشتن آیتم
              </button>
            </div>
          )}

          {/* PHASE 3: INTEL REVEAL */}
          {gameState === 'phase3_intel' && currentPlayer && (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-300 py-6 my-auto">
              <div className="bg-zinc-800/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-900 px-4 py-1 rounded-full border border-white/10 text-[10px] font-black text-zinc-500 uppercase tracking-widest">آیتم فعلی</div>
                <div className="flex justify-center mb-4">{ITEMS[currentPlayer.item]?.icon}</div>
                <h4 className="text-4xl font-black text-white">{ITEMS[currentPlayer.item]?.name}</h4>
              </div>
              {intelFact ? (
                <div className="animate-in slide-in-from-bottom-4 delay-200">
                  <div className="p-6 bg-zinc-950 border border-sky-500/20 rounded-3xl shadow-inner text-right">
                    <p className="text-base font-bold text-sky-200 leading-relaxed whitespace-pre-line">{intelFact}</p>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 text-xs italic">اطلاعات خاصی برای شما در این سند وجود ندارد.</p>
              )}
              <button onClick={nextTurnPhase3} className="w-full py-5 bg-white text-zinc-950 rounded-[1.5rem] font-black text-xl active:scale-95 transition-all shadow-2xl">
                پایان نوبت
              </button>
            </div>
          )}

          {/* STATE: VOTING */}
          {gameState === 'voting' && (
            <div className="text-center space-y-6 py-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto border border-sky-500/20">
                <Shield className="w-8 h-8 text-sky-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">رأی‌گیری دستگیری</h2>
                <p className="text-zinc-500 text-xs px-8 leading-relaxed">دیکتاتور فرار نکرد! گارد فرصت دارد یک نفر را دستگیر کند.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1 text-right">
                   <button 
                     onClick={() => setArrestedId('')} 
                     className={`py-4 px-2 rounded-2xl border font-black text-sm transition-all ${arrestedId === '' ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-950 border-white/5 text-zinc-600'}`}
                   >
                     رد شدن (آزادی)
                   </button>
                   {players.map(p => (
                     <button 
                       key={p.id}
                       onClick={() => setArrestedId(p.id.toString())} 
                       className={`py-4 px-2 rounded-2xl border font-black text-sm transition-all ${arrestedId === p.id.toString() ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-900/40' : 'bg-zinc-950 border-white/5 text-zinc-500 hover:bg-zinc-900'}`}
                     >
                       {p.name}
                     </button>
                   ))}
              </div>
              <button onClick={concludeVoting} className="w-full py-5 bg-white text-zinc-950 rounded-[1.5rem] font-black text-lg active:scale-95 transition-all">
                ثبت دستگیری
              </button>
            </div>
          )}

          {/* STATE: GAME OVER */}
          {gameState === 'gameOver' && winner && (
            <div className="text-center space-y-8 py-4 animate-in zoom-in-95 duration-500 my-auto">
              <h2 className={`text-4xl font-black tracking-tighter ${winner.team === 'guard' ? 'text-sky-400' : 'text-rose-500'}`}>
                {winner.team === 'guard' ? 'پیروزی گارد!' : 'دیکتاتور فرار کرد!'}
              </h2>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 text-sm text-zinc-400 leading-relaxed italic">
                {winner.reason}
              </div>
              <div className="text-right bg-zinc-950/40 rounded-3xl p-5 border border-white/5">
                <div className="text-[10px] font-black text-zinc-600 uppercase mb-4 tracking-widest text-center">لیست نهایی هویت‌ها</div>
                <div className="space-y-2">
                  {players.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-900/50 text-sm border border-white/5">
                      <span className="text-zinc-300 font-bold">{p.name}</span>
                      <span className={`font-black ${p.role === ROLES.RAT ? 'text-rose-500' : p.role === ROLES.DEVOTEE ? 'text-amber-500' : 'text-sky-400'}`}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setGameState('setup')} className="w-full py-5 bg-zinc-800 text-white rounded-2xl font-black text-lg hover:bg-zinc-700 transition-all">
                شروع مجدد
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}