
import React, { useState, useMemo, useEffect } from 'react';
import { SavedMnemonic, Language } from '../types';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
}

const FLASH_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Flash-kartalar", range: "Davrni tanlang", empty: "Hali hech narsa o'rganilmagan", start: "Boshlash", next: "Keyingisi", prev: "Oldingisi", finish: "Tugatish", from: "Boshlanish sanasi", to: "Tugash sanasi", hint: "Kartani aylantirish uchun bosing", shuffle: "Aralashtirish" },
  [Language.KAZAKH]: { title: "Флэш-карталар", range: "Кезеңді таңдаңыз", empty: "Әлі ештеңе үйренілмеген", start: "Бастау", next: "Келесі", prev: "Алдыңғы", finish: "Аяқтау", from: "Басталу күні", to: "Аяқталу күні", hint: "Картаны айналдыру үшін басыңыз", shuffle: "Араластыру" },
  [Language.TAJIK]: { title: "Флэш-кортҳо", range: "Давраро интихоб кунед", empty: "Ҳанӯз чизе омӯхта نشدهаст", start: "Оғоз", next: "Оянда", prev: "Пешина", finish: "Анҷом", from: "Таърихи оғоз", to: "Таърихи анҷом", hint: "Барои чаппа кардани корт пахш кунед", shuffle: "Омехта кардан" },
  [Language.KYRGYZ]: { title: "Флэш-карталар", range: "Мөөнөттү тандаңыз", empty: "Азырынча эч нерсе үйрөнүлө элек", start: "Баштоо", next: "Кийинки", prev: "Мурунку", finish: "Бүтүрүү", from: "Баштоо күнү", to: "Аяктоо күнү", hint: "Картаны которуу үчүн басыңыз", shuffle: "Аралаштыруу" },
  [Language.RUSSIAN]: { title: "Флэш-карты", range: "Выберите период", empty: "Еще ничего не выучено", start: "Начать", next: "Далее", prev: "Назад", finish: "Завершить", from: "Дата начала", to: "Дата окончания", hint: "Нажмите, чтобы перевернуть", shuffle: "Перемешать" },
  [Language.TURKMEN]: { title: "Fleş-kartlar", range: "Döwri saýlaň", empty: "Entek hiç zat öwrenilmedi", start: "Başlat", next: "Indiki", prev: "Öňki", finish: "Gutar", from: "Başlangyç senesi", to: "Tamatlanýan senesi", hint: "Karty aýlamak üçün basyň", shuffle: "Garyşdyr" },
};

export const Flashcards: React.FC<Props> = ({ savedMnemonics, language }) => {
  const t = FLASH_T[language];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const filtered = useMemo(() => {
    return savedMnemonics.filter(m => {
      const ts = new Date(m.timestamp);
      ts.setHours(0,0,0,0);
      const from = dateFrom ? new Date(dateFrom) : null;
      if (from) from.setHours(0,0,0,0);
      const to = dateTo ? new Date(dateTo) : null;
      if (to) to.setHours(23,59,59,999);

      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    });
  }, [savedMnemonics, dateFrom, dateTo]);

  const shuffle = () => {
    const indices = Array.from({ length: filtered.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
    setIsStarted(true);
  };

  const startNormal = () => {
    setShuffledIndices(Array.from({ length: filtered.length }, (_, i) => i));
    setCurrentIndex(0);
    setIsStarted(true);
  };

  const playAudio = (url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Audio play error:", e));
  };

  // Reset flip state when moving to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (savedMnemonics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="text-8xl float-anim">📭</div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-gray-800 dark:text-white">{t.empty}</p>
          <p className="text-gray-400 dark:text-gray-500">Siz o'rgangan so'zlar avtomatik tarzda shu yerda paydo bo'ladi.</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn mt-8 sm:mt-12 px-4">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center space-y-8 sm:space-y-10">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{t.range}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="text-left space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-300 dark:text-gray-600 ml-2 sm:ml-4">{t.from}</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="date-input w-full px-3 sm:px-8 py-3 sm:py-5 bg-gray-50 dark:bg-slate-800 border-2 border-transparent rounded-xl sm:rounded-3xl outline-none focus:border-indigo-500 font-black text-black dark:text-white transition-all text-xs sm:text-base" />
            </div>
            <div className="text-left space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-300 dark:text-gray-600 ml-2 sm:ml-4">{t.to}</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="date-input w-full px-3 sm:px-8 py-3 sm:py-5 bg-gray-50 dark:bg-slate-800 border-2 border-transparent rounded-xl sm:rounded-3xl outline-none focus:border-indigo-500 font-black text-black dark:text-white transition-all text-xs sm:text-base" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              disabled={filtered.length === 0}
              onClick={startNormal}
              className="w-full py-5 sm:py-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 text-white rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl shadow-2xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 transform"
            >
              {t.start} <span className="opacity-50 ml-2">({filtered.length})</span>
            </button>
          </div>
        </div>

        {dateFrom && dateTo && filtered.length > 0 && (
          <div className="mt-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 animate-fadeIn">
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {filtered.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-left group transition-all hover:bg-white dark:hover:bg-slate-800">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700">
                    <img src={m.imageUrl} alt={m.word} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 dark:text-white text-base sm:text-lg break-words">{m.word}</h4>
                    <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs leading-tight">[{m.data.transcription}]</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const current = filtered[shuffledIndices[currentIndex]];

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fadeIn mt-4">
      <div className="text-center">
         <p className="text-sm font-bold text-gray-400 dark:text-gray-600 animate-pulse">{t.hint}</p>
      </div>
      
      <div 
        className="relative aspect-[4/5] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border-4 sm:border-8 border-white dark:border-slate-800">
            <img src={current.imageUrl} className="w-full h-full object-cover" alt="Flashcard Front" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 md:p-10 pt-20">
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl break-all">{current.word}</h3>
              <p className="text-white/70 font-mono mt-1 sm:mt-2 break-words text-xs sm:text-base">[{current.data.transcription}]</p>
            </div>
            
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-black dark:text-white text-[8px] sm:text-[10px] font-black tracking-widest border border-indigo-100 dark:border-slate-700 shadow-xl">
              {new Date(current.timestamp).toLocaleDateString()}
            </div>

            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-indigo-600/80 backdrop-blur-xl px-3 sm:px-5 py-1 sm:py-2 rounded-full text-white text-[10px] sm:text-xs font-black tracking-widest border border-white/20">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-[2rem] sm:rounded-[3rem] pt-10 px-6 pb-6 md:pt-16 md:px-10 md:pb-10 flex flex-col justify-start text-center shadow-2xl border-4 sm:border-8 border-indigo-500 overflow-y-auto overflow-x-hidden">
            <div className="space-y-4 sm:space-y-8">
              <div className="space-y-1 sm:space-y-2">
                <span className="text-indigo-200 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Word</span>
                <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter break-all">{current.word}</h3>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <span className="text-indigo-200 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Meaning</span>
                <p className="text-white font-black text-xl sm:text-2xl md:text-3xl break-words">{current.data.meaning}</p>
              </div>

              <div className="space-y-2 sm:space-y-3 bg-white/10 rounded-2xl sm:rounded-3xl p-4 md:p-6 backdrop-blur-md border border-white/10">
                <span className="text-indigo-200 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Imagination</span>
                <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed break-words">{current.data.imagination}</p>
              </div>

              <div className="space-y-1 sm:space-y-2">
                 <span className="text-indigo-200 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Mnemonic Link</span>
                 <p className="text-indigo-100 font-bold break-words text-sm sm:text-base">{current.data.phoneticLink}</p>
              </div>
            </div>

            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/20 backdrop-blur-xl px-3 sm:px-5 py-1 sm:py-2 rounded-full text-white text-[10px] sm:text-xs font-black tracking-widest border border-white/10">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-3 sm:gap-4">
        <button 
          onClick={shuffle}
          className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl sm:rounded-3xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
          title={t.shuffle || 'Shuffle'}
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-4 sm:py-5 bg-white dark:bg-slate-900 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl sm:rounded-3xl font-black shadow-sm border border-gray-100 dark:border-slate-800 transition-all disabled:opacity-30 disabled:hover:text-gray-400 active:scale-95 text-sm sm:text-base"
          disabled={currentIndex === 0}
        >
          {t.prev}
        </button>
        <button 
          onClick={() => {
            if (currentIndex < filtered.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setIsStarted(false);
              setCurrentIndex(0);
            }
          }}
          className="flex-[2] py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-3xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-lg sm:text-xl"
        >
          {currentIndex === filtered.length - 1 ? t.finish : t.next}
        </button>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(0);
          cursor: pointer;
          opacity: 1;
        }
        .dark .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        .date-input {
          color-scheme: light;
        }
        .dark .date-input {
          color-scheme: dark;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.5);
        }
      `}</style>
    </div>
  );
};
