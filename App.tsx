
import React, { useState, useEffect, useMemo } from 'react';
import { GeminiService } from './services/geminiService';
import { AppState, MnemonicResponse, Language, AppView, SavedMnemonic } from './types';
import { MnemonicCard } from './components/MnemonicCard';
import { VoiceMode } from './components/VoiceMode';
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { FeedbackModal } from './components/FeedbackModal';
import AboutSection from './components/AboutSection';
import { Profile } from './components/Profile';
import { supabase, uploadBase64 } from './services/supabase';
import { Auth } from './components/Auth';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';

const gemini = new GeminiService();

const TRANSLATIONS: Record<Language, any> = {
  [Language.UZBEK]: {
    title: "MnemoniX",
    subtitle: "Har bir so'zda bitta hikoya bor.",
    desc: "Ingliz so'zlarini mnemonika orqali oson o'rganing.",
    searchPlaceholder: "Masalan: 'Ambitious' yoki 'Relinquish'",
    inputPlaceholder: "So'zni kiriting...",
    btnAnalyze: "Tahlil",
    btnLive: "Ovozli Yordamchi",
    navHome: "Asosiy",
    navDashboard: "Dashboard",
    navFlashcards: "Flash-kartalar",
    navProfile: "Profil",
    loadingMsg: "Usta siz uchun eng qiziqarli hikoyani o'ylamoqda...",
    errorMsg: "Kechirasiz, xatolik yuz berdi.",
    quotaError: "Limit tugadi. Iltimos, bir ozdan keyin qayta urinib ko'ring.",
    dictationStart: "Gapiring...",
    dictationError: "Eshita olmadim.",
    feedbackBtn: "Takliflar",
    howItWorksTitle: "Qanday ishlaydi?",
    howItWorksStep1: "So'zni kiriting",
    howItWorksStep1Desc: "O'rganmoqchi bo'lgan inglizcha so'zni yozing.",
    howItWorksStep2: "Hikoyani ko'ring",
    howItWorksStep2Desc: "AI siz uchun maxsus mnemonik hikoya va rasm yaratadi.",
    howItWorksStep3: "Eslab qoling",
    howItWorksStep3Desc: "Vizualizatsiya orqali so'zni bir umrga eslab qoling.",
    howItWorksMethodTitle: "MnemoniX Metodi",
    howItWorksMethodDesc: "Bizning miyamiz mavhum ro'yxatlarni emas, balki hikoyalar va tasvirlarni eslab qolish uchun yaratilgan. Yorqin, qiziqarli va ba'zan g'alati assotsiatsiyalar yaratish orqali biz 'unutish egri chizig'ini' chetlab o'tamiz va ma'lumotni to'g'ridan-to'g'ri uzoq muddatli xotiraga o'tkazamiz.",
  },
  [Language.KAZAKH]: {
    title: "MnemoniX",
    subtitle: "Әр сөзде бір хикая бар.",
    desc: "Ағылшын сөздерін мнемоника арқылы оңай үйреніңіз.",
    searchPlaceholder: "Мысалы: 'Ambitious' немесе 'Relinquish'",
    inputPlaceholder: "Сөзді енгізіңіз...",
    btnAnalyze: "Талдау",
    btnLive: "Дауыстық Көмекші",
    navHome: "Басты",
    navDashboard: "Dashboard",
    navFlashcards: "Флэш-карталар",
    navProfile: "Профиль",
    loadingMsg: "Шебер сіз үшін ең қызықты хикаяны ойластыруда...",
    errorMsg: "Кешіріңіз, қате кетті.",
    quotaError: "Лимит таусылды. Біраздан кейін қайталап көріңіз.",
    dictationStart: "Сөйлеңіз...",
    dictationError: "Ести алмадым.",
    feedbackBtn: "Ұсыныстар",
    howItWorksTitle: "Бұл қалай жұмыс істейді?",
    howItWorksStep1: "Сөзді енгізіңіз",
    howItWorksStep1Desc: "Үйренгіңіз келетін ағылшын сөзін жазыңыз.",
    howItWorksStep2: "Хикаяны көріңіз",
    howItWorksStep2Desc: "AI сіз үшін арнайы мнемоникалық хикая мен сурет жасайды.",
    howItWorksStep3: "Есте сақтаңыз",
    howItWorksStep3Desc: "Визуализация арқылы сөзді мәңгілікке есте сақтаңыз.",
    howItWorksMethodTitle: "MnemoniX әдісі",
    howItWorksMethodDesc: "Біздің миымыз дерексіз тізімдерді емес, хикаялар мен бейнелерді есте сақтауға арналған. Жарқын, қызықты және кейде оғаш ассоциациялар құру арқылы біз 'ұмыту қисығын' айналып өтіп, ақпаратты тікелей ұзақ мерзімді жадыға өткіземіз.",
  },
  [Language.TAJIK]: {
    title: "MnemoniX",
    subtitle: "Дар ҳар як калима як қисса ҳаст.",
    desc: "Калимаҳои англисиро бо ёрии мнемоника осон омӯзед.",
    searchPlaceholder: "Масалан: 'Ambitious' ё 'Relinquish'",
    inputPlaceholder: "Калимаро ворид кунед...",
    btnAnalyze: "Таҳлил",
    btnLive: "Ёрдамчии Овозӣ",
    navHome: "Асосӣ",
    navDashboard: "Dashboard",
    navFlashcards: "Флэш-кортҳо",
    navProfile: "Профил",
    loadingMsg: "Устод барои шумо қиссаи ҷолибтаринро фикр мекунад...",
    errorMsg: "Бубахшед, хатогӣ рӯй дод.",
    quotaError: "Маҳдудияти квота. Лутфан каме дертар кӯшиш кунед.",
    dictationStart: "Гӯед...",
    dictationError: "Нашунидам.",
    feedbackBtn: "Пешниҳодҳо",
    howItWorksTitle: "Чӣ тавр кор мекунад?",
    howItWorksStep1: "Калимаро ворид кунед",
    howItWorksStep1Desc: "Калимаи англисиеро, ки мехоҳед омӯзед, нависед.",
    howItWorksStep2: "Қиссаро бинед",
    howItWorksStep2Desc: "AI барои шумо қиссаи мнемоникӣ ва расми махсус месозад.",
    howItWorksStep3: "Дар хотир гиред",
    howItWorksStep3Desc: "Бо ёрии визуализатсия калимаро барои ҳамеша дар хотир нигоҳ доред.",
    howItWorksMethodTitle: "Методи MnemoniX",
    howItWorksMethodDesc: "Мағзи мо барои дар хотир нигоҳ доштани рӯйхатҳои абстрактӣ не, балки қиссаҳо ва тасвирҳо сохта шудааст. Бо сохтани ассотсиатсияҳои равшан, ҷолиб ва баъзан аҷиб, мо 'хати фаромӯширо' давр мезанем ва маълумотро мустақиман ба хотираи дарозмуддат интиқол медиҳем.",
  },
  [Language.KYRGYZ]: {
    title: "MnemoniX",
    subtitle: "Ар бир сөздө бир окуя бар.",
    desc: "Англис сөздөрүн мнемоника аркылуу оңай үйренүңүз.",
    searchPlaceholder: "Мисалы: 'Ambitious' же 'Relinquish'",
    inputPlaceholder: "Сөздү киргизиңиз...",
    btnAnalyze: "Талдоо",
    btnLive: "Үн Жардамчысы",
    navHome: "Башкы",
    navDashboard: "Dashboard",
    navFlashcards: "Флэш-карталар",
    navProfile: "Профиль",
    loadingMsg: "Устат сиз үчүн эң кызыктуу окуяны ойлоп жатат...",
    errorMsg: "Кечиресиз, ката кетти.",
    quotaError: "Лимит бүттү. Бир аздан кийин кайра аракет кылыңыз.",
    dictationStart: "Сүйлөңүз...",
    dictationError: "Уга алган жокмун.",
    feedbackBtn: "Сунуштар",
    howItWorksTitle: "Кандай иштейт?",
    howItWorksStep1: "Сөздү киргизиңиз",
    howItWorksStep1Desc: "Үйрөнгүңүз келген англис сөзүн жазыңыз.",
    howItWorksStep2: "Окуяны көрүңүз",
    howItWorksStep2Desc: "AI сиз үчүн атайын мнемоникалык окуя жана сүрөт жаратат.",
    howItWorksStep3: "Эстеп калыңыз",
    howItWorksStep3Desc: "Визуализация аркылы сөздү өмүр бою эстеп калыңыз.",
    howItWorksMethodTitle: "MnemoniX методу",
    howItWorksMethodDesc: "Биздин мээбиз абстракттуу тизмелерди эмес, окуяларды жана образдарды эстеп калууга ылайыкташкан. Жаркын, кызыктуу жана кээде таң калыштуу ассоциацияларды түзүү менен биз 'унутуу ийри сызыгын' айланып өтүп, маалыматты түздөн-түз узак мөөнөттүү эс тутумга өткөрөбүз.",
  },
  [Language.RUSSIAN]: {
    title: "MnemoniX",
    subtitle: "В каждом слове есть история.",
    desc: "Учите английские слова легко с помощью мнемоники.",
    searchPlaceholder: "Например: 'Ambitious' или 'Relinquish'",
    inputPlaceholder: "Введите слово...",
    btnAnalyze: "Анализ",
    btnLive: "Голосовой Помощник",
    navHome: "Главная",
    navDashboard: "Дашборд",
    navFlashcards: "Флэш-карты",
    navProfile: "Профиль",
    loadingMsg: "Мастер придумывает для вас самую интересную историю...",
    errorMsg: "Извините, произошла ошибка.",
    quotaError: "Лимит исчерпан. Пожалуйста, попробуйте позже.",
    dictationStart: "Говорите...",
    dictationError: "Не удалось распознать.",
    feedbackBtn: "Предложения",
    howItWorksTitle: "Как это работает?",
    howItWorksStep1: "Введите слово",
    howItWorksStep1Desc: "Напишите английское слово, которое хотите выучить.",
    howItWorksStep2: "Посмотрите историю",
    howItWorksStep2Desc: "AI создаст для вас уникальную мнемоническую историю и образ.",
    howItWorksStep3: "Запомните",
    howItWorksStep3Desc: "С помощью визуализации запомните слово навсегда.",
    howItWorksMethodTitle: "Метод MnemoniX",
    howItWorksMethodDesc: "Наш мозг устроен так, чтобы запоминать истории и образы, а не абстрактные списки. Создавая яркие, забавные, а иногда и странные ассоциации, мы обходим 'кривую забывания' и переносим информацию напрямую в долгосрочную память.",
  },
  [Language.TURKMEN]: {
    title: "MnemoniX",
    subtitle: "Her sözde bir hekaýa bar.",
    desc: "Iňlis sözlerini mnemonika arkaly aňsat öwreniň.",
    searchPlaceholder: "Meselem: 'Ambitious' ýa-da 'Relinquish'",
    inputPlaceholder: "Sözi giriziň...",
    btnAnalyze: "Analiz",
    btnLive: "Sesli Kömekçi",
    navHome: "Baş sahypa",
    navDashboard: "Dashboard",
    navFlashcards: "Fleş-kartlar",
    navProfile: "Profil",
    loadingMsg: "Ussat siz üçin iň gyzykly hekaýany oýlanýar...",
    errorMsg: "Bagyşlaň, ýalňyşlyk ýüze çykdy.",
    quotaError: "Limit gutardy. Haýyş edýäris, birneme soňra gaýtadan synanyşyň.",
    dictationStart: "Gepleň...",
    dictationError: "Eşidip bilmedim.",
    feedbackBtn: "Teklipler",
    howItWorksTitle: "Bu nähili işleýär?",
    howItWorksStep1: "Sözi giriziň",
    howItWorksStep1Desc: "Öwrenmek isleýän iňlis söziňizi ýazyň.",
    howItWorksStep2: "Hekaýany görüň",
    howItWorksStep2Desc: "AI size ýörite mnemonik hekaýa we surat döreder.",
    howItWorksStep3: "Ýatda saklaň",
    howItWorksStep3Desc: "Wizuallaşdyrmak arkaly sözi ebedilik ýatda saklaň.",
    howItWorksMethodTitle: "MnemoniX usuly",
    howItWorksMethodDesc: "Biziň beýnimiz abstrakt sanawlary däl-de, hekaýalary we şekilleri ýatda saklamak üçin döredilendir. Açyk, gyzykly we käwagt geň assosiasiýalary döretmek bilen, biz 'ýatdan çykarmak egriligini' aýlanyp geçýäris we maglumaty göni uzak mehletli ýatda saklaýarys.",
  },
};

const App: React.FC = () => {
  const [word, setWord] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.UZBEK);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mnemonicData, setMnemonicData] = useState<MnemonicResponse | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedMnemonics, setSavedMnemonics] = useState<SavedMnemonic[]>([]);
  const [isDictating, setIsDictating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const t = useMemo(() => TRANSLATIONS[selectedLanguage], [selectedLanguage]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('mnemonix_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mnemonix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mnemonix_theme', 'light');
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value as Language);
    setState(AppState.IDLE);
    setMnemonicData(null);
    setImageUrl('');
  };

  useEffect(() => {
    if (!user) {
      setSavedMnemonics([]);
      return;
    }

    const fetchUserWords = async () => {
      const { data, error } = await supabase
        .from('user_words')
        .select(`
          mnemonic_id,
          mnemonics_cache (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user words:", error);
        return;
      }

      const formatted: SavedMnemonic[] = data.map((item: any) => ({
        id: item.mnemonic_id,
        word: item.mnemonics_cache.word,
        data: {
          word: item.mnemonics_cache.word,
          transcription: item.mnemonics_cache.transcription,
          meaning: item.mnemonics_cache.meaning,
          morphology: item.mnemonics_cache.morphology,
          imagination: item.mnemonics_cache.imagination,
          phoneticLink: item.mnemonics_cache.phonetic_link,
          connectorSentence: item.mnemonics_cache.connector_sentence,
          examples: item.mnemonics_cache.examples,
          synonyms: item.mnemonics_cache.synonyms,
          imagePrompt: item.mnemonics_cache.image_prompt,
          audioUrl: item.mnemonics_cache.audio_url
        },
        imageUrl: item.mnemonics_cache.image_url,
        timestamp: new Date(item.mnemonics_cache.created_at).getTime(),
        language: item.mnemonics_cache.language as Language
      }));

      setSavedMnemonics(formatted);
    };

    fetchUserWords();
  }, [user]);

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsDictating(true);
    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setWord(transcript);
    };

    recognition.start();
  };

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || !user) return;

    const cleanWord = searchTerm.trim().toLowerCase();
    setState(AppState.LOADING);
    setErrorMessage('');
    
    try {
      // 1. Check Global Cache
      const { data: cachedMnemonic, error: cacheError } = await supabase
        .from('mnemonics_cache')
        .select('*')
        .eq('word', cleanWord)
        .eq('language', selectedLanguage)
        .single();

      let finalData: MnemonicResponse;
      let finalImageUrl: string;
      let finalAudioUrl: string | undefined;
      let mnemonicId: string;

      if (cachedMnemonic) {
        finalData = {
          word: cachedMnemonic.word,
          transcription: cachedMnemonic.transcription,
          meaning: cachedMnemonic.meaning,
          morphology: cachedMnemonic.morphology,
          imagination: cachedMnemonic.imagination,
          phoneticLink: cachedMnemonic.phonetic_link,
          connectorSentence: cachedMnemonic.connector_sentence,
          examples: cachedMnemonic.examples,
          synonyms: cachedMnemonic.synonyms,
          imagePrompt: cachedMnemonic.image_prompt,
          audioUrl: cachedMnemonic.audio_url
        };
        finalImageUrl = cachedMnemonic.image_url;
        finalAudioUrl = cachedMnemonic.audio_url;
        mnemonicId = cachedMnemonic.id;
      } else {
        // 2. Generate with AI
        const data = await gemini.getMnemonic(cleanWord, selectedLanguage);
        const imgBase64 = await gemini.generateImage(data.imagePrompt);
        
        // Generate TTS text
        const synonymsText = data.synonyms.length > 0 ? `. Synonyms: ${data.synonyms.join(', ')}.` : '';
        const ttsText = `${data.word}. ${data.meaning}. ${data.imagination}. ${data.connectorSentence}${synonymsText}`;
        const audioBase64 = await gemini.generateTTS(ttsText, selectedLanguage);

        // 3. Upload to Storage
        const timestamp = Date.now();
        const imgFileName = `${cleanWord}_${selectedLanguage}_${timestamp}.png`;
        const audioFileName = `${cleanWord}_${selectedLanguage}_${timestamp}.pcm`;
        
        const [publicImageUrl, publicAudioUrl] = await Promise.all([
          uploadBase64(imgBase64, 'mnemonics', `images/${imgFileName}`, 'image/png'),
          uploadBase64(audioBase64, 'mnemonics', `audio/${audioFileName}`, 'audio/pcm')
        ]);

        // 4. Save to Cache
        const { data: newCache, error: insertError } = await supabase
          .from('mnemonics_cache')
          .insert({
            word: cleanWord,
            language: selectedLanguage,
            transcription: data.transcription,
            meaning: data.meaning,
            morphology: data.morphology,
            imagination: data.imagination,
            phonetic_link: data.phoneticLink,
            connector_sentence: data.connectorSentence,
            examples: data.examples,
            synonyms: data.synonyms,
            image_prompt: data.imagePrompt,
            image_url: publicImageUrl,
            audio_url: publicAudioUrl
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        finalData = { ...data, audioUrl: publicAudioUrl };
        finalImageUrl = publicImageUrl;
        finalAudioUrl = publicAudioUrl;
        mnemonicId = newCache.id;
      }

      // 5. Save to User Progress
      await supabase
        .from('user_words')
        .upsert({
          user_id: user.id,
          mnemonic_id: mnemonicId,
          last_reviewed_at: new Date().toISOString()
        }, { onConflict: 'user_id,mnemonic_id' });

      setMnemonicData(finalData);
      setImageUrl(finalImageUrl);
      setState(AppState.RESULTS);
      setView(AppView.HOME);

      // Update local dashboard state
      const newEntry: SavedMnemonic = {
        id: mnemonicId,
        word: finalData.word,
        data: finalData,
        imageUrl: finalImageUrl,
        timestamp: Date.now(),
        language: selectedLanguage
      };
      
      if (!savedMnemonics.find(m => m.id === mnemonicId)) {
        setSavedMnemonics(prev => [newEntry, ...prev]);
      }

    } catch (error: any) {
      console.error(error);
      const message = error?.message || '';
      if (message.includes('429') || message.includes('quota')) {
        setErrorMessage(t.quotaError);
      } else {
        setErrorMessage(t.errorMsg);
      }
      setState(AppState.ERROR);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(word);
  };

  const languages = [
    { id: Language.UZBEK, label: '🇺🇿 O\'zbek' },
    { id: Language.KAZAKH, label: '🇰🇿 Kazakh' },
    { id: Language.TAJIK, label: '🇹🇯 Tajik' },
    { id: Language.KYRGYZ, label: '🇰🇬 Kyrgyz' },
    { id: Language.RUSSIAN, label: '🇷🇺 Russian' },
    { id: Language.TURKMEN, label: '🇹🇲 Türkmen' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView(AppView.HOME);
    setState(AppState.IDLE);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-gray-50'}`}>
        <header className="py-4 sm:py-6 flex items-center justify-between max-w-6xl mx-auto px-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
              M
            </div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">MnemoniX</h1>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>
        <Auth onSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 bg-[#fdfdff] dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">
      <header className="py-4 sm:py-6 flex flex-col gap-6 max-w-6xl mx-auto border-b border-gray-100 dark:border-slate-800 mb-8 w-full">
        {/* Top Row: Logo and Profile/Theme */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => setView(AppView.HOME)}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-transform group-hover:scale-110">
              M
            </div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(AppView.PROFILE)}
              className={`p-2 sm:p-2.5 rounded-full border transition-all shadow-sm ${view === AppView.PROFILE ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              title={t.navProfile || 'Profile'}
            >
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Bottom Row: Navigation and Language/Voice */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <nav className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: AppView.HOME, label: t.navHome },
              { id: AppView.DASHBOARD, label: t.navDashboard },
              { id: AppView.FLASHCARDS, label: t.navFlashcards }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  if (item.id !== AppView.HOME) setState(AppState.IDLE);
                }}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${view === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <select 
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full px-3 sm:px-4 py-2 font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer text-xs sm:text-sm"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>

          <button 
            onClick={() => setState(AppState.VOICE_MODE)}
            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-full text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
            aria-label="Open Voice Assistant"
          >
            <div className="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-white"></span>
            </div>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="hidden xl:inline">{t.btnLive}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {view === AppView.HOME && (
          <>
            <section className={`transition-all duration-700 transform ${state === AppState.IDLE ? 'mt-16 scale-100' : 'mt-0 scale-95'}`}>
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-8">
                  {state === AppState.IDLE && (
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight px-4 animate-fadeIn">
                      {t.subtitle.split(' ').map((w: string, i: number) => 
                        i === t.subtitle.split(' ').length - 1 
                        ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{w} </span> 
                        : w + ' '
                      )}
                    </h2>
                  )}

                  <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto px-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder={isDictating ? t.dictationStart : t.inputPlaceholder}
                        className={`w-full px-6 sm:px-8 py-5 sm:py-6 pr-32 sm:pr-44 rounded-[1.5rem] sm:rounded-[2rem] bg-white dark:bg-slate-900 border-2 transition-all outline-none text-lg sm:text-xl text-gray-900 dark:text-white shadow-xl placeholder:text-gray-400 dark:placeholder:text-gray-600 ${isDictating ? 'border-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-900/30' : 'border-gray-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5'}`}
                      />
                      
                      <div className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={startDictation}
                          className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all ${isDictating ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm'}`}
                          title="Voice Input"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>

                        <button 
                          type="submit"
                          disabled={state === AppState.LOADING}
                          className="px-4 sm:px-8 h-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        >
                          {state === AppState.LOADING ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <span className="hidden sm:inline">{t.btnAnalyze}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {state === AppState.IDLE && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-gray-400 dark:text-gray-500 text-sm sm:text-base font-medium italic">{t.searchPlaceholder}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg px-6">{t.desc}</p>
                    </div>
                  )}
                </div>

                {state === AppState.IDLE && (
                  <AboutSection t={t} />
                )}
              </div>
            </section>

            <div className="mt-12">
              {state === AppState.LOADING && (
                <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fadeIn">
                  <div className="relative w-32 h-32">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                    
                    {/* Rotating rings */}
                    <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-4 border-purple-100 dark:border-purple-900/30 rounded-full"></div>
                    <div className="absolute inset-4 border-4 border-t-purple-600 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
                    
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center transform rotate-12 animate-bounce">
                        <span className="text-indigo-600 font-black text-xl">M</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-gray-900 dark:text-white font-black text-xl animate-pulse">{t.loadingMsg}</p>
                  </div>

                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-full bg-indigo-600 animate-bounce [animation-delay:${i * 0.2}s]`}></div>
                    ))}
                  </div>
                </div>
              )}

              {state === AppState.RESULTS && mnemonicData && (
                <MnemonicCard data={mnemonicData} imageUrl={imageUrl} language={selectedLanguage} />
              )}

              {state === AppState.ERROR && (
                <div className="bg-red-50 p-10 rounded-3xl border border-red-100 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-900">{errorMessage}</h3>
                  <button onClick={() => setState(AppState.IDLE)} className="px-8 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg">Retry</button>
                </div>
              )}
            </div>
          </>
        )}

        {view === AppView.DASHBOARD && (
          <Dashboard 
            savedMnemonics={savedMnemonics} 
            language={selectedLanguage} 
            onDelete={(id) => setSavedMnemonics(prev => prev.filter(m => m.id !== id))}
          />
        )}

        {view === AppView.FLASHCARDS && (
          <Flashcards savedMnemonics={savedMnemonics} language={selectedLanguage} />
        )}

        {view === AppView.PROFILE && user && (
          <Profile 
            user={user} 
            totalWords={savedMnemonics.length} 
            onSignOut={handleSignOut} 
          />
        )}
      </main>

      {state === AppState.VOICE_MODE && (
        <VoiceMode 
          onClose={() => setState(AppState.IDLE)} 
          targetLanguage={selectedLanguage}
        />
      )}

      {/* Floating Feedback Button */}
      {view === AppView.HOME && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-6 left-6 z-40 px-5 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95 group"
        >
          <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t.feedbackBtn}</span>
        </button>
      )}

      {showFeedback && (
        <FeedbackModal 
          onClose={() => setShowFeedback(false)} 
          language={selectedLanguage} 
          receiverEmail="khazratkulovshokhzod@gmail.com"
        />
      )}
    </div>
  );
};

export default App;