import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { voiceNavigator } from '../utils/voiceNavigator';

export const VoiceSpeechFloatingHUD: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [activeLang, setActiveLang] = useState('fr');

  useEffect(() => {
    const handleVoiceSpeaking = (e: Event) => {
      const customEv = e as CustomEvent<{ text: string; isSpeaking: boolean; lang?: string }>;
      if (customEv.detail) {
        setIsSpeaking(Boolean(customEv.detail.isSpeaking));
        if (customEv.detail.text) {
          setSpokenText(customEv.detail.text);
        }
        if (customEv.detail.lang) {
          setActiveLang(customEv.detail.lang);
        }
      }
    };

    window.addEventListener('bradci-voice-speaking', handleVoiceSpeaking);
    return () => {
      window.removeEventListener('bradci-voice-speaking', handleVoiceSpeaking);
    };
  }, []);

  if (!isSpeaking || !spokenText) return null;

  return (
    <div 
      id="voice-speech-floating-hud"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto select-none"
    >
      <div className="bg-[#0B1021]/95 backdrop-blur-md border border-[#F97316]/50 shadow-2xl shadow-orange-950/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
        {/* Animated Sound Wave Bars */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F97316]/20 to-[#38BDF8]/20 border border-[#F97316]/40 flex items-center justify-center gap-0.5 shrink-0 px-1">
          <span className="w-1 h-3 bg-[#F97316] rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-1 h-5 bg-[#38BDF8] rounded-full animate-bounce [animation-delay:0.25s]" />
          <span className="w-1 h-4 bg-[#F97316] rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1 h-2 bg-[#38BDF8] rounded-full animate-bounce [animation-delay:0.35s]" />
        </div>

        {/* Text details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-wider uppercase text-[#F97316] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {activeLang === 'en' ? 'Voice Guidance Active' : 'Assistance Vocale Active'}
            </span>
          </div>
          <p className="text-xs font-semibold text-white truncate mt-0.5">
            {spokenText}
          </p>
        </div>

        {/* Stop button */}
        <button
          type="button"
          onClick={() => {
            voiceNavigator.stop();
            setIsSpeaking(false);
          }}
          title={activeLang === 'en' ? "Stop speech" : "Arrêter la voix"}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <VolumeX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
