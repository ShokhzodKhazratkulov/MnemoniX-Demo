
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Language } from '../types';

interface Props {
  onClose: () => void;
  targetLanguage: Language;
}

// Manual encoding/decoding functions as per guidelines
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
    console.error("Base64 decode error in VoiceMode:", e);
    return new Uint8Array(0);
  }
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer | null> {
  if (data.length === 0) return null;
  
  // Ensure buffer length is multiple of 2
  const bufferToUse = data.byteLength % 2 === 0 ? data.buffer : data.buffer.slice(0, data.byteLength - 1);
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
    console.error("VoiceMode: Audio buffer creation failed:", e);
    return null;
  }
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const VoiceMode: React.FC<Props> = ({ onClose, targetLanguage }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Ulanmoqda...");
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let sessionPromise: Promise<any>;

    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputAudioContext;
        
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

        sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus("Tayyor! Gapiring...");
              setIsActive(true);
              
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                  setTranscriptions(prev => [...prev.slice(-4), `Usta: ${message.serverContent.outputTranscription.text}`]);
              } else if (message.serverContent?.inputTranscription) {
                  setTranscriptions(prev => [...prev.slice(-4), `Siz: ${message.serverContent.inputTranscription.text}`]);
              }

              const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64EncodedAudioString && audioContextRef.current) {
                const decodedData = decode(base64EncodedAudioString);
                const audioBuffer = await decodeAudioData(
                  decodedData,
                  audioContextRef.current,
                  24000,
                  1,
                );
                
                if (audioBuffer) {
                  const source = audioContextRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContextRef.current.destination);
                  
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                  
                  sourcesRef.current.add(source);
                  source.onended = () => sourcesRef.current.delete(source);
                }
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (err) => {
                console.error('Session error:', err);
                setStatus("Xatolik yuz berdi.");
            },
            onclose: () => setIsActive(false),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `Siz professional "Mnemonika va Ingliz tili ustozi"siz. Foydalanuvchi bilan ovozli muloqot qiling. So'zlarni eslab qolish uchun kulgili tasavvurlar va ${targetLanguage} tilidagi o'xshashliklar keltiring. DIQQAT: Faqat ${targetLanguage} tilida gapiring.`,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          }
        });

      } catch (err) {
        console.error('Initialization error:', err);
        setStatus("Mikrofonni yoqib bo'lmadi.");
      }
    };

    startSession();
    
    return () => { 
      if (sessionPromise) {
        sessionPromise.then(s => s.close());
      }
    };
  }, [targetLanguage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <div className={`w-32 h-32 rounded-full bg-indigo-500/30 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
             <div className={`w-24 h-24 rounded-full bg-indigo-400 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Live Mnemonika</h2>
          <p className="text-indigo-200">{status}</p>
        </div>

        <div className="w-full bg-black/20 rounded-2xl p-4 min-h-[150px] text-left space-y-2 text-sm text-gray-300">
           {transcriptions.map((t, i) => <p key={i}>{t}</p>)}
        </div>

        <button 
          onClick={onClose}
          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-all"
        >
          Yakunlash
        </button>
      </div>
    </div>
  );
};
