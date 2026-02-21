
import React, { useState, useMemo } from 'react';
import { SavedMnemonic, Language } from '../types';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onDelete: (id: string) => void;
}

const DASH_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Faoliyat", stats: "O'rganish statistikasi", total: "Jami o'rganilgan", range: "Sana oralig'i", noData: "Ma'lumot topilmadi", from: "Dan", to: "Gacha" },
  [Language.KAZAKH]: { title: "Белсенділік", stats: "Оқу статистикасы", total: "Жалпы үйренілген", range: "Күн ауқымы", noData: "Мәлімет табылмады", from: "Бастап", to: "Дейін" },
  [Language.TAJIK]: { title: "Фаолият", stats: "Омори омӯзиш", total: "Ҳамагӣ омӯхташуда", range: "Диапазони сана", noData: "Маълумот ёфт нашуд", from: "Аз", to: "То" },
  [Language.KYRGYZ]: { title: "Активдүүлүк", stats: "Окуу статистикасы", total: "Жалпы үйрөнүлгөн", range: "Күн аралыгы", noData: "Маалымат табылган жок", from: "Дан", to: "Чейин" },
  [Language.RUSSIAN]: { title: "Активность", stats: "Статистика обучения", total: "Всего выучено", range: "Диапазон дат", noData: "Данных не найдено", from: "С", to: "По" },
  [Language.TURKMEN]: { title: "Işjeňlik", stats: "Öwreniş statistikasy", total: "Jemi öwrenilen", range: "Sene aralygy", noData: "Maglumat tapylmady", from: "Başlap", to: "Çenli" },
};

export const Dashboard: React.FC<Props> = ({ savedMnemonics, language, onDelete }) => {
  const t = DASH_T[language];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredData = useMemo(() => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="space-y-1 sm:space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{t.stats}</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider ml-1">{t.from}</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
              className="date-input block w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-black dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" 
            />
          </div>
          <div className="flex-1 md:flex-none space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider ml-1">{t.to}</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
              className="date-input block w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-black dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-indigo-600 text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center items-center md:items-start">
          <span className="text-4xl sm:text-5xl font-black mb-1">{filteredData.length}</span>
          <span className="text-indigo-100 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">{t.total}</span>
        </div>
        
        <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {filteredData.length === 0 ? (
              <div className="w-full text-center py-6 sm:py-10">
                <p className="text-gray-400 dark:text-gray-600 italic text-sm">{t.noData}</p>
              </div>
            ) : (
              filteredData.map(m => (
                <div key={m.id} className="group relative">
                  <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-default">
                    {m.word}
                  </div>
                  <button 
                    onClick={() => onDelete(m.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredData.map(m => (
          <div key={m.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <img src={m.imageUrl} alt={m.word} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-3 right-3 sm:top-4 right-4 px-2 sm:px-3 py-1 bg-white/95 dark:bg-slate-900/95 text-black dark:text-white rounded-lg text-[9px] sm:text-[10px] font-black shadow-md border border-indigo-100 dark:border-slate-700">
                {new Date(m.timestamp).toLocaleDateString()}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <h4 className="font-black text-indigo-600 dark:text-indigo-400 text-xl sm:text-2xl tracking-tight">{m.word}</h4>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-300 dark:text-gray-600">{m.language}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-2 text-sm sm:text-base">{m.data.meaning}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
};