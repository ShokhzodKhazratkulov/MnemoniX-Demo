
import React, { useEffect, useState, useRef } from 'react';
import { MnemonicResponse } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
  data: MnemonicResponse;
  imageUrl: string;
}

const gemini = new GeminiService();

// Helper functions for raw PCM audio decoding
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
  
  // Ensure the buffer length is a multiple of 2 for Int16Array
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
    console.error("Error creating audio buffer:", e);
    return null;
  }
}

export const MnemonicCard: React.FC<Props> = ({ data, imageUrl }) => {
  const [timer, setTimer] = useState(5);
  const [showContent, setShowContent] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setShowContent(true);
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setTimer(count);
      if (count === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      // Use the pre-translated content for TTS to support all languages
      const ttsText = `${data.word}. ${data.meaning}. ${data.imagination}. ${data.connectorSentence}`;
      const base64Audio = await gemini.generateTTS(ttsText);

      if (!base64Audio) {
        throw new Error("No audio data received from API");
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(
        decodedData,
        audioContextRef.current,
        24000,
        1
      );

      if (!audioBuffer) {
        throw new Error("Failed to decode audio buffer (empty or invalid data)");
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback error:", error);
      alert("Audio playback failed. Please try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-4xl mx-auto space-y-8`}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-6xl font-black text-indigo-600 tracking-tight">{data.word}</h1>
          <button 
            onClick={handlePlayAudio}
            disabled={isAudioLoading}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } disabled:bg-gray-300`}
            title="Listen to mnemonic"
          >
            {isAudioLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
            ) : isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xl text-gray-500 font-mono">[{data.transcription}] — {data.meaning}</p>
        <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
          {data.morphology}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Image Display */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <img src={imageUrl || 'https://picsum.photos/600/600'} alt="Mnemonic" className="w-full h-auto" />
            {timer > 0 && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-6 text-center">
                <p className="text-2xl font-bold mb-4">Tasvirni diqqat bilan kuzating!</p>
                <div className="w-16 h-16 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin mb-4"></div>
                <p className="text-5xl font-black">{timer}</p>
              </div>
            )}
          </div>
        </div>

        {/* Textual Mnemonics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-indigo-500">
            <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2">Tasavvur</h3>
            <p className="text-gray-800 text-lg leading-relaxed">{data.imagination}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-orange-400">
            <h3 className="text-orange-600 font-bold uppercase text-xs tracking-widest mb-2">O'xshashlik</h3>
            <p className="text-gray-800 text-lg leading-relaxed font-medium">💡 {data.phoneticLink}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl text-white">
            <h3 className="text-indigo-200 font-bold uppercase text-xs tracking-widest mb-2">Bog'lam</h3>
            <p className="text-xl font-semibold italic">"{data.connectorSentence}"</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
             <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-3">Misollar</h3>
             <ul className="space-y-3">
               {data.examples.map((ex, idx) => (
                 <li key={idx} className="flex items-start gap-3">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span className="text-gray-700 italic">{ex}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
