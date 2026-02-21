
import React, { useState } from 'react';
import { Language } from '../types';

interface Props {
  onClose: () => void;
  language: Language;
  receiverEmail: string;
}

const FEEDBACK_T: Record<Language, any> = {
  [Language.UZBEK]: { title: "Fikr-mulohaza", desc: "Ilovani yaxshilash bo'yicha taklifingiz bormi? Bizga yozing!", labelName: "Ismingiz (ixtiyoriy)", labelMsg: "Sizning taklifingiz", btnSend: "Yuborish", btnCancel: "Bekor qilish", subject: "MnemoniX: Yaxshilash bo'yicha taklif" },
  [Language.KAZAKH]: { title: "Кері байланыс", desc: "Қолданбаны жақсарту бойынша ұсыныстарыңыз бар ма? Бізге жазыңыз!", labelName: "Атыңыз (міндетті емес)", labelMsg: "Сіздің ұсынысыңыз", btnSend: "Жіберу", btnCancel: "Бас тарту", subject: "MnemoniX: Жақсарту бойынша ұсыныс" },
  [Language.TAJIK]: { title: "Фикру мулоҳиза", desc: "Шумо барои такмил додани барнома пешниҳод доред? Ба мо нависед!", labelName: "Номи шумо (ихтиёрӣ)", labelMsg: "Пешниҳоди шумо", btnSend: "Фиристодан", btnCancel: "Бекор кардан", subject: "MnemoniX: Пешниҳод барои такмил" },
  [Language.KYRGYZ]: { title: "Пикир-пикир", desc: "Тиркемени жакшыртуу боюнча сунушуңуз барбы? Бизге жазыңыз!", labelName: "Атыңыз (милдеттүү эмес)", labelMsg: "Сиздин сунушуңуз", btnSend: "Жөнөтүү", btnCancel: "Жокко чыгаруу", subject: "MnemoniX: Жакшыртуу боюнча сунуш" },
  [Language.RUSSIAN]: { title: "Обратная связь", desc: "У вас есть предложения по улучшению приложения? Напишите нам!", labelName: "Ваше имя (необязательно)", labelMsg: "Ваше предложение", btnSend: "Отправить", btnCancel: "Отмена", subject: "MnemoniX: Предложение по улучшению" },
  [Language.TURKMEN]: { title: "Teswir", desc: "Programmany gowulandyrmak üçin teklipleriňiz barmy? Bize ýazyň!", labelName: "Adyňyz (islege görä)", labelMsg: "Siziň teklipleriňiz", btnSend: "Ugrat", btnCancel: "Ýatyr", subject: "MnemoniX: Gowulandyrmak üçin teklip" },
};

export const FeedbackModal: React.FC<Props> = ({ onClose, language, receiverEmail }) => {
  const t = FEEDBACK_T[language];
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const mailtoBody = encodeURIComponent(`Ism: ${name || 'Noma\'lum'}\n\nTaklif:\n${message}`);
    const mailtoUrl = `mailto:${receiverEmail}?subject=${encodeURIComponent(t.subject)}&body=${mailtoBody}`;
    
    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-slideUp border border-white/10 dark:border-slate-800">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t.desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4 tracking-widest">{t.labelName}</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-800 dark:text-gray-200 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4 tracking-widest">{t.labelMsg}</label>
            <textarea 
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-800 dark:text-gray-200 transition-all resize-none"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t.btnCancel}
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-colors active:scale-95"
            >
              {t.btnSend}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};