
import React, { useState, useCallback } from 'react';
import { GeminiService } from './services/geminiService';
import { AppState, MnemonicResponse, Language } from './types';
import { MnemonicCard } from './components/MnemonicCard';
import { VoiceMode } from './components/VoiceMode';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [word, setWord] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.UZBEK);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [mnemonicData, setMnemonicData] = useState<MnemonicResponse | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!word.trim()) return;

    setState(AppState.LOADING);
    setErrorMessage('');
    
    try {
      const data = await gemini.getMnemonic(word, selectedLanguage);
      setMnemonicData(data);
      const img = await gemini.generateImage(data.imagePrompt);
      setImageUrl(img);
      setState(AppState.RESULTS);
    } catch (error) {
      console.error(error);
      setErrorMessage("Kechirasiz, so'zni tahlil qilishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      setState(AppState.ERROR);
    }
  };

  const languages = [
    { id: Language.UZBEK, label: '🇺🇿 O\'zbek' },
    { id: Language.KAZAKH, label: '🇰🇿 Kazakh' },
    { id: Language.TAJIK, label: '🇹🇯 Tajik' },
    { id: Language.KYRGYZ, label: '🇰🇬 Kyrgyz' },
    { id: Language.RUSSIAN, label: '🇷🇺 Russian' },
  ];

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      {/* Header / Nav */}
      <header className="py-8 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">
            M
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">MnemoniX</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="appearance-none bg-white border border-gray-200 rounded-full px-6 py-2 pr-10 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <button 
            onClick={() => setState(AppState.VOICE_MODE)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            Live Mashg'ulot
          </button>
        </div>
      </header>

      {/* Main UI */}
      <main className="max-w-6xl mx-auto mt-8">
        
        {/* Search Bar */}
        <section className={`transition-all duration-500 ${state === AppState.IDLE ? 'mt-20 scale-110' : 'mt-0 scale-100'}`}>
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {state === AppState.IDLE && (
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                  Har bir so'zda bitta <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">hikoya bor.</span>
                </h2>
                <p className="text-gray-500 text-lg">Ingliz so'zlarini mnemonika orqali oson o'rganing.</p>
              </div>
            )}
            
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Masalan: 'Ambitious' yoki 'Relinquish'"
                className="w-full px-8 py-5 rounded-3xl bg-white border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-xl text-gray-900 shadow-xl transition-all placeholder:text-gray-400"
              />
              <button 
                type="submit"
                disabled={state === AppState.LOADING}
                className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                {state === AppState.LOADING ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Tahlil
              </button>
            </form>
          </div>
        </section>

        {/* Content Area */}
        <div className="mt-16">
          {state === AppState.LOADING && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 animate-spin rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-bold">...</div>
              </div>
              <p className="text-gray-500 animate-pulse font-medium">Usta siz uchun eng qiziqarli hikoyani o'ylamoqda...</p>
            </div>
          )}

          {state === AppState.RESULTS && mnemonicData && (
            <MnemonicCard data={mnemonicData} imageUrl={imageUrl} />
          )}

          {state === AppState.ERROR && (
            <div className="bg-red-50 p-10 rounded-3xl border border-red-100 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-900">Xatolik!</h3>
              <p className="text-red-700">{errorMessage}</p>
              <button onClick={() => setState(AppState.IDLE)} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold">Qaytadan urinish</button>
            </div>
          )}
        </div>
      </main>

      {/* Voice Mode Modal */}
      {state === AppState.VOICE_MODE && (
        <VoiceMode 
          onClose={() => setState(AppState.IDLE)} 
          targetLanguage={selectedLanguage}
        />
      )}

      {/* Footer Info */}
      {state === AppState.IDLE && (
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
           <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-50 space-y-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">🧠</div>
              <h4 className="font-bold">Mnemonika nima?</h4>
              <p className="text-sm text-gray-500">Miya quruq ma'lumotni emas, balki g'alati va yorqin tasavvurlarni yaxshi eslab qoladi. Biz shundan foydalanamiz.</p>
           </div>
           <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-50 space-y-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">🗣️</div>
              <h4 className="font-bold">Jonli Ustoz</h4>
              <p className="text-sm text-gray-500">Live rejimida xuddi ustoz bilan gaplashgandek ovozli savollar bering va talaffuzni mashq qiling.</p>
           </div>
           <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-50 space-y-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">🎨</div>
              <h4 className="font-bold">Vizual Bog'lam</h4>
              <p className="text-sm text-gray-500">Har bir so'z uchun AI tomonidan yaratilgan maxsus tasvir sizning xotirangizda muhrlanib qoladi.</p>
           </div>
        </section>
      )}

      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-white/50 backdrop-blur-md border-t border-gray-100 text-center text-gray-400 text-xs">
        &copy; 2024 MnemoniX. Sun'iy intellekt tomonidan yaratilgan ingliz tili mo'jizasi.
      </footer>
    </div>
  );
};

export default App;
