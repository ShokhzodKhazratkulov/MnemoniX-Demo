
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
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const safeData = {
    word: data?.word || 'English Word',
    transcription: data?.transcription || '...',
    meaning: data?.meaning || 'Translation',
    morphology: data?.morphology || '...',
    imagination: data?.imagination || '...',
    phoneticLink: data?.phoneticLink || '...',
    connectorSentence: data?.connectorSentence || '...',
    examples: Array.isArray(data?.examples) ? data.examples : []
  };

  useEffect(() => {
    setShowContent(true);
    setTimer(5);
    setAudioError(null);
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
      const ttsText = `${safeData.word}. ${safeData.meaning}. ${safeData.imagination}. ${safeData.connectorSentence}`;
      
      const base64Audio = await gemini.generateTTS(ttsText, language);

      if (!base64Audio) {
        throw new Error("No audio data received from API");
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);

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
      const isQuota = message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
      setAudioError(isQuota ? "Audio limit reached (429). Please wait." : "Audio error. Try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-4xl mx-auto space-y-8`}>
      <div className="text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-6xl font-black text-indigo-600 tracking-tight">{safeData.word}</h1>
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:bg-gray-300 relative`}
              title="Listen to pronunciation"
            >
              {isAudioLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : 
               isPlaying ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg> :
               <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>}
            </button>
          </div>
          {audioError && <p className="text-xs font-bold text-red-500 animate-bounce">{audioError}</p>}
        </div>
        <p className="text-xl text-gray-500 font-mono">[{safeData.transcription}] — {safeData.meaning}</p>
        <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">{safeData.morphology}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
          <img 
            src={imageUrl || 'https://placehold.co/600x600?text=Imagining...'} 
            alt={safeData.word} 
            className="w-full h-auto object-cover min-h-[300px]" 
          />
          {timer > 0 && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-6 text-center">
              <p className="text-lg font-bold mb-2">Visualize this for</p>
              <p className="text-6xl font-black">{timer}</p>
              <p className="mt-4 text-sm opacity-80">Close your eyes and see the scene...</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-indigo-500 transition-transform hover:scale-[1.02]">
            <h3 className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest mb-2 opacity-60">Imagination (Visual)</h3>
            <p className="text-gray-800 text-lg leading-relaxed">{safeData.imagination}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-orange-400 transition-transform hover:scale-[1.02]">
            <h3 className="text-orange-600 font-bold uppercase text-[10px] tracking-widest mb-2 opacity-60">Phonetic Link (Sound)</h3>
            <p className="text-gray-800 text-lg font-medium italic">{safeData.phoneticLink}</p>
          </div>
          <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl text-white transition-transform hover:scale-[1.02]">
             <h3 className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest mb-2 opacity-80">Mnemonic Key</h3>
            <p className="text-xl font-semibold italic">"{safeData.connectorSentence}"</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
             <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4">Examples</h3>
             <ul className="space-y-3">
               {safeData.examples.map((ex, idx) => (
                 <li key={idx} className="text-gray-700 italic flex gap-3">
                   <span className="text-indigo-400 font-bold">•</span>
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
