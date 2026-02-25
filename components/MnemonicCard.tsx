
import React, { useEffect, useState, useRef } from 'react';
import { MnemonicResponse, Language } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
  data: MnemonicResponse;
  imageUrl: string;
  language: Language;
}

const gemini = new GeminiService();

function decode(base64: string) {
  if (!base64) return new Uint8Array(0);
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode error:", e);
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer | null> {
  if (data.length === 0) return null;
  // Ensure the buffer length is multiple of 2 (16-bit PCM)
  const byteLength = data.byteLength;
  const bufferToUse = byteLength % 2 === 0 ? data.buffer : data.buffer.slice(0, byteLength - 1);
  const dataInt16 = new Int16Array(bufferToUse);
  const frameCount = dataInt16.length / numChannels;
  
  if (frameCount <= 0) return null;
  
  try {
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  } catch (e) {
    console.error("Error creating audio buffer:", e);
    return null;
  }
}

export const MnemonicCard: React.FC<Props> = ({ data, imageUrl, language }) => {
  const [timer, setTimer] = useState(5);
  const [showContent, setShowContent] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWordPlaying, setIsWordPlaying] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const wordSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const wordBufferCache = useRef<AudioBuffer | null>(null);
  const fullBufferCache = useRef<AudioBuffer | null>(null);

  const safeData = {
    word: data?.word || 'English Word',
    transcription: data?.transcription || '...',
    meaning: data?.meaning || 'Translation',
    morphology: data?.morphology || '...',
    imagination: data?.imagination || '...',
    phoneticLink: data?.phoneticLink || '...',
    connectorSentence: data?.connectorSentence || '...',
    examples: Array.isArray(data?.examples) ? data.examples : [],
    synonyms: Array.isArray(data?.synonyms) ? data.synonyms : [],
    audioUrl: data?.audioUrl
  };

  useEffect(() => {
    setShowContent(true);
    setTimer(5);
    setAudioError(null);
    
    // Clear caches when word changes
    wordBufferCache.current = null;
    fullBufferCache.current = null;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      setIsPlaying(false);
      return;
    }

    setAudioError(null);
    setIsAudioLoading(true);
    try {
      let audioBuffer: AudioBuffer | null = fullBufferCache.current;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (!audioBuffer) {
        if (safeData.audioUrl) {
          // Fetch from Supabase Storage
          const response = await fetch(safeData.audioUrl);
          if (!response.ok) throw new Error("Failed to fetch audio file");
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          audioBuffer = await decodeAudioData(uint8Array, audioContextRef.current, 24000, 1);
        } else {
          // Generate on the fly (fallback for old data)
          const synonymsText = safeData.synonyms.length > 0 ? `. Synonyms: ${safeData.synonyms.join(', ')}.` : '';
          const examplesText = safeData.examples.length > 0 ? `. Examples: ${safeData.examples.join('. ')}.` : '';
          const ttsText = `${safeData.word}. ${safeData.meaning}. ${safeData.imagination}. Phonetic Link: ${safeData.phoneticLink}. ${safeData.connectorSentence}${synonymsText}${examplesText}`;
          
          const base64Audio = await gemini.generateTTS(ttsText, language);

          if (!base64Audio) {
            throw new Error("No audio data received from API");
          }

          const decodedData = decode(base64Audio);
          audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
        }
        fullBufferCache.current = audioBuffer;
      }

      if (!audioBuffer) {
        throw new Error("Failed to decode audio buffer");
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (error: any) {
      console.error("Audio Playback Error:", error);
      const message = error?.message || String(error);
      const isQuota = message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota');
      setAudioError(isQuota ? "Daily audio limit reached. Please try again later." : "Could not play audio. Please check your connection.");
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setAudioError(null), 5000);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handlePlayWordOnly = async () => {
    if (isWordPlaying) {
      if (wordSourceRef.current) {
        try { wordSourceRef.current.stop(); } catch (e) {}
      }
      setIsWordPlaying(false);
      return;
    }

    setAudioError(null);
    setIsWordLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      let audioBuffer = wordBufferCache.current;

      if (!audioBuffer) {
        const base64Audio = await gemini.generateTTS(safeData.word, language);

        if (!base64Audio) {
          throw new Error("No audio data received from API");
        }

        const decodedData = decode(base64Audio);
        audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
        wordBufferCache.current = audioBuffer;
      }

      if (!audioBuffer) {
        throw new Error("Failed to decode audio buffer");
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsWordPlaying(false);
      
      wordSourceRef.current = source;
      source.start(0);
      setIsWordPlaying(true);
    } catch (error: any) {
      console.error("Word Audio Playback Error:", error);
      const message = error?.message || String(error);
      const isQuota = message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota');
      setAudioError(isQuota ? "Daily audio limit reached. Please try again later." : "Could not play audio. Please check your connection.");
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setAudioError(null), 5000);
    } finally {
      setIsWordLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4`}>
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-indigo-600 tracking-tight break-all">{safeData.word}</h1>
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:bg-gray-300 relative shrink-0`}
              title="Listen to pronunciation"
            >
              {isAudioLoading ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white/30 border-t-white animate-spin rounded-full" /> 
              ) : isPlaying ? (
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4l10 8-10 8z" />
                </svg>
              )}
            </button>
          </div>
          {audioError && <p className="text-xs font-bold text-red-500 animate-bounce">{audioError}</p>}
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={handlePlayWordOnly}
            disabled={isWordLoading}
            className={`p-2 rounded-full transition-all ${
              isWordPlaying ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'text-indigo-500 hover:bg-indigo-50'
            } disabled:opacity-50 shrink-0`}
            title="Listen to word only"
          >
            {isWordLoading ? (
              <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 animate-spin rounded-full" />
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 font-mono break-words">
            [{safeData.transcription}] — {safeData.meaning}
          </p>
        </div>
        <div className="inline-block px-4 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-semibold">{safeData.morphology}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        <div className="space-y-6 sm:space-y-8">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800">
            <img 
              src={imageUrl || 'https://placehold.co/600x600?text=Imagining...'} 
              alt={safeData.word} 
              className="w-full h-auto object-cover min-h-[250px] sm:min-h-[300px]" 
            />
            {timer > 0 && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 sm:p-6 text-center z-20 animate-fadeIn">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-6">
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      className="stroke-white/10 fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      className="stroke-indigo-500 fill-none transition-all duration-1000 ease-linear"
                      strokeWidth="8"
                      strokeDasharray="283%"
                      strokeDashoffset={`${((5 - timer) / 5) * 283}%`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-4xl sm:text-5xl font-black tabular-nums">{timer}</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Sec</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-w-[200px]">
                  <p className="text-base sm:text-lg font-bold leading-tight">Visualize the scene</p>
                  <p className="text-xs opacity-60 leading-relaxed">Close your eyes and make the image vivid in your mind...</p>
                </div>

                <button 
                  onClick={() => setTimer(0)}
                  className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-black tracking-widest uppercase transition-all active:scale-95"
                >
                  Skip
                </button>
              </div>
            )}
          </div>

          {/* Desktop only Synonyms: Moved below image to reduce scrolling */}
          {safeData.synonyms.length > 0 && (
            <div className="hidden lg:block bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-l-8 border-emerald-400 transition-transform hover:scale-[1.02]">
              <h3 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-1 sm:mb-2 opacity-60">Synonyms</h3>
              <div className="flex flex-wrap gap-2">
                {safeData.synonyms.map((syn, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-l-8 border-indigo-500 transition-transform hover:scale-[1.02]">
            <h3 className="text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-1 sm:mb-2 opacity-60">Imagination (Visual)</h3>
            <p className="text-gray-800 dark:text-gray-200 text-base sm:text-lg leading-relaxed">{safeData.imagination}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-l-8 border-orange-400 transition-transform hover:scale-[1.02]">
            <h3 className="text-orange-600 dark:text-orange-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-1 sm:mb-2 opacity-60">Phonetic Link (Sound)</h3>
            <p className="text-gray-800 dark:text-gray-200 text-base sm:text-lg font-medium italic">{safeData.phoneticLink}</p>
          </div>
          <div className="bg-indigo-600 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl text-white transition-transform hover:scale-[1.02]">
             <h3 className="text-indigo-200 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-1 sm:mb-2 opacity-80">Mnemonic Key</h3>
            <p className="text-lg sm:text-xl font-semibold italic">"{safeData.connectorSentence}"</p>
          </div>
          {/* Mobile/Tablet only Synonyms: Keep original position for smaller screens */}
          {safeData.synonyms.length > 0 && (
            <div className="lg:hidden bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border-l-8 border-emerald-400 transition-transform hover:scale-[1.02]">
              <h3 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-1 sm:mb-2 opacity-60">Synonyms</h3>
              <div className="flex flex-wrap gap-2">
                {safeData.synonyms.map((syn, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-gray-100 dark:bg-slate-800 p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700">
             <h3 className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest mb-3 sm:mb-4">Examples</h3>
             <ul className="space-y-2 sm:space-y-3">
               {safeData.examples.map((ex, idx) => (
                 <li key={idx} className="text-gray-700 dark:text-gray-300 italic flex gap-2 sm:gap-3 text-sm sm:text-base">
                   <span className="text-indigo-400 font-bold shrink-0">•</span>
                   {ex}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};