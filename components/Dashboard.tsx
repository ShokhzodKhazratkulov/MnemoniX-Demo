
import React, { useMemo } from 'react';
import { supabase } from '../services/supabase';
import { SavedMnemonic, Language } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Props {
  savedMnemonics: SavedMnemonic[];
  language: Language;
  onDelete: (id: string) => void;
}

const DASH_T: Record<Language, any> = {
  [Language.UZBEK]: { 
    title: "Faoliyat", 
    stats: "O'rganish statistikasi", 
    total: "Jami O'rganilgan", 
    today: "Bugungi hisob", 
    average: "O'rtacha kunlik", 
    level: "So'zlar darajasi",
    graphTitle: "Oxirgi 7 kunlik progress",
    noData: "Ma'lumot topilmadi"
  },
  [Language.KAZAKH]: { 
    title: "Белсенділік", 
    stats: "Оқу статистикасы", 
    total: "Жалпы үйренілген", 
    today: "Бүгінгі есеп", 
    average: "Орташа күндік", 
    level: "Сөздер деңгейі",
    graphTitle: "Соңғы 7 күндік прогресс",
    noData: "Мәлімет табылмады"
  },
  [Language.TAJIK]: { 
    title: "Фаолият", 
    stats: "Омори омӯзиш", 
    total: "Ҳамагӣ омӯхташуда", 
    today: "Ҳисоби имрӯза", 
    average: "Миёнаи рӯзона", 
    level: "Сатҳи калимаҳо",
    graphTitle: "Пешрафти 7 рӯзи охир",
    noData: "Маълумот ёфт нашуд"
  },
  [Language.KYRGYZ]: { 
    title: "Активдүүлүк", 
    stats: "Окуу статистикасы", 
    total: "Жалпы үйрөнүлгөн", 
    today: "Бүгүнкү эсеп", 
    average: "Орточо күндүк", 
    level: "Сөздөрдүн деңгээли",
    graphTitle: "Акыркы 7 күндүк прогресс",
    noData: "Маалымат табылган жок"
  },
  [Language.RUSSIAN]: { 
    title: "Активность", 
    stats: "Статистика обучения", 
    total: "Всего выучено", 
    today: "Сегодня выучено", 
    average: "Среднее в день", 
    level: "Уровень слов",
    graphTitle: "Прогресс за последние 7 дней",
    noData: "Данных не найдено"
  },
  [Language.TURKMEN]: { 
    title: "Işjeňlik", 
    stats: "Öwreniş statistikasy", 
    total: "Jemi öwrenilen", 
    today: "Şu günki hasap", 
    average: "Ortaça gündelik", 
    level: "Sözleriň derejesi",
    graphTitle: "Soňky 7 günlük ösüş",
    noData: "Maglumat tapylmady"
  },
};

export const Dashboard: React.FC<Props> = ({ savedMnemonics, language }) => {
  const t = DASH_T[language];

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const todayCount = savedMnemonics.filter(m => {
      const d = new Date(m.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime();
    }).length;

    // Average daily calculation
    const uniqueDays = new Set(savedMnemonics.map(m => {
      const d = new Date(m.timestamp);
      return d.toDateString();
    })).size || 1;
    
    const averageDaily = (savedMnemonics.length / uniqueDays).toFixed(1);

    // Level distribution
    const levels = savedMnemonics.reduce((acc: Record<string, number>, m) => {
      const lvl = m.data.level || 'Intermediate';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});

    const topLevel = Object.entries(levels).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || 'Beginner';

    return {
      total: savedMnemonics.length,
      today: todayCount,
      average: averageDaily,
      topLevel
    };
  }, [savedMnemonics]);

  const [totalUsers, setTotalUsers] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { data, error } = await supabase
          .from('user_words')
          .select('user_id');
        
        if (data) {
          const uniqueUsers = new Set(data.map(item => item.user_id)).size;
          setTotalUsers(uniqueUsers);
        }
      } catch (e) {
        console.error("Error fetching user count:", e);
      }
    };
    fetchUserCount();
  }, []);

  const graphData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const count = savedMnemonics.filter(m => {
        const md = new Date(m.timestamp);
        md.setHours(0, 0, 0, 0);
        return md.getTime() === d.getTime();
      }).length;

      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' });
      data.push({ name: label, count });
    }
    return data;
  }, [savedMnemonics]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12 px-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t.stats}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-indigo-600 text-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-indigo-200 dark:shadow-none flex flex-col justify-center items-center text-center transform hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2">{stats.total}</span>
          <span className="text-indigo-100 font-bold uppercase text-[10px] sm:text-xs tracking-widest">{t.total}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transform hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2 text-gray-900 dark:text-white">{stats.today}</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-widest">{t.today}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transform hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2 text-gray-900 dark:text-white">{stats.average}</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-widest">{t.average}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transform hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-5xl font-black mb-1 sm:mb-2 text-gray-900 dark:text-white">{totalUsers}</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-widest">Active Learners</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transform hover:scale-105 transition-transform duration-300">
          <span className="text-lg sm:text-2xl font-black mb-1 sm:mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{stats.topLevel}</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-widest">{t.level}</span>
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">{t.graphTitle}</h3>
        <div className="h-[200px] sm:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600, textAnchor: 'start' }}
                domain={[0, 50]}
                ticks={[0, 10, 20, 30, 40, 50]}
                width={40}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#4f46e5', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#4f46e5" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCount)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
