
import React, { useState, useMemo, useEffect } from 'react';
import { SavedMnemonic, Language } from '../types';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
}

const FLASH_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Flash-kartalar", range: "Davrni tanlang", empty: "Hali hech narsa o'rganilmagan", start: "Boshlash", next: "Keyingisi", prev: "Oldingisi", finish: "Tugatish", from: "Boshlanish sanasi", to: "Tugash sanasi", hint: "Kartani aylantirish uchun bosing" },
  [Language.KAZAKH]: { title: "Флэш-карталар", range: "Кезеңді таңдаңыз", empty: "Әлі ештеңе үйренілмеген", start: "Бастау", next: "Келесі", prev: "Алдыңғы", finish: "Аяқтау", from: "Басталу күні", to: "Аяқталу күні", hint: "Картаны айналдыру үшін басыңыз" },
  [Language.TAJIK]: { title: "Флэш-кортҳо", range: "Давраро интихоб кунед", empty: "Ҳанӯз чизе омӯхта نشدهаст", start: "Оғоз", next: "Оянда", prev: "Пешина", finish: "Анҷом", from: "Таърихи оғоз", to: "Таърихи анҷом", hint: "Барои чаппа кардани корт пахш кунед" },
  [Language.KYRGYZ]: { title: "Флэш-карталар", range: "Мөөнөттү тандаңыз", empty: "Азырынча эч нерсе үйрөнүлө элек", start: "Баштоо", next: "Кийинки", prev: "Мурунку", finish: "Бүтүрүү", from: "Баштоо күнү", to: "Аяктоо күнү", hint: "Картаны которуу үчүн басыңыз" },
  [Language.RUSSIAN]: { title: "Флэш-карты", range: "Выберите период", empty: "Еще ничего не выучено", start: "Начать", next: "Далее", prev: "Назад", finish: "Завершить", from: "Дата начала", to: "Дата окончания", hint: "Нажмите, чтобы перевернуть" },
};

export const Flashcards: React.FC<Props> = ({ savedMnemonics, language }) => {
  const t = FLASH_T[language];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Reset flip state when moving to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (savedMnemonics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="text-8xl float-anim">📭</div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-gray-800">{t.empty}</p>
          <p className="text-gray-400">Siz o'rgangan so'zlar avtomatik tarzda shu yerda paydo bo'ladi.</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto animate-fadeIn mt-12">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center space-y-10">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t.title}</h2>
            <p className="text-gray-500 font-medium">{t.range}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-left space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-300 ml-4">{t.from}</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="date-input w-full px-8 py-5 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-500 font-black text-black transition-all" />
            </div>
            <div className="text-left space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-300 ml-4">{t.to}</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="date-input w-full px-8 py-5 bg-gray-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-500 font-black text-black transition-all" />
            </div>
          </div>
          <button 
            disabled={filtered.length === 0}
            onClick={() => setIsStarted(true)}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 transform"
          >
            {t.start} <span className="opacity-50 ml-2">({filtered.length})</span>
          </button>
        </div>
      </div>
    );
  }

  const current = filtered[currentIndex];

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fadeIn mt-4">
      <div className="text-center">
         <p className="text-sm font-bold text-gray-400 animate-pulse">{t.hint}</p>
      </div>
      
      <div 
        className="relative aspect-[4/5] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
            <img src={current.imageUrl} className="w-full h-full object-cover" alt="Flashcard Front" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-10">
              <h3 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{current.word}</h3>
              <p className="text-white/70 font-mono mt-2">[{current.data.transcription}]</p>
            </div>
            
            <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-xl text-black text-[10px] font-black tracking-widest border border-indigo-100 shadow-xl">
              {new Date(current.timestamp).toLocaleDateString()}
            </div>

            <div className="absolute top-8 right-8 bg-indigo-600/80 backdrop-blur-xl px-5 py-2 rounded-full text-white text-xs font-black tracking-widest border border-white/20">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-[3rem] p-10 flex flex-col justify-center text-center shadow-2xl border-8 border-indigo-500 overflow-y-auto">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Word</span>
                <h3 className="text-5xl font-black text-white tracking-tighter">{current.word}</h3>
              </div>
              
              <div className="space-y-2">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Meaning</span>
                <p className="text-white font-black text-3xl">{current.data.meaning}</p>
              </div>

              <div className="space-y-3 bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/10">
                <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Imagination</span>
                <p className="text-white/90 text-lg italic leading-relaxed">{current.data.imagination}</p>
              </div>

              <div className="space-y-2">
                 <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Mnemonic Link</span>
                 <p className="text-indigo-100 font-bold">{current.data.phoneticLink}</p>
              </div>
            </div>

            <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-xl px-5 py-2 rounded-full text-white text-xs font-black tracking-widest border border-white/10">
              {currentIndex + 1} / {filtered.length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-6">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="flex-1 py-5 bg-white text-gray-400 hover:text-indigo-600 rounded-3xl font-black shadow-sm border border-gray-100 transition-all disabled:opacity-30 disabled:hover:text-gray-400 active:scale-95"
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
          className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-xl"
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
        .date-input {
          color-scheme: light;
        }
      `}</style>
    </div>
  );
};