import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useTTS = () => {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Wait for voices to be loaded
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      switch (i18n.language) {
        case 'hi':
          // Try multiple Hindi voice patterns
          selectedVoice = voices.find(voice => 
            voice.lang === 'hi-IN' || 
            voice.lang === 'hi' ||
            voice.name.toLowerCase().includes('hindi') ||
            voice.name.toLowerCase().includes('हिंदी')
          );
          utterance.lang = 'hi-IN';
          break;
        case 'pa':
          selectedVoice = voices.find(voice => 
            voice.lang === 'pa-IN' ||
            voice.lang === 'pa' ||
            voice.name.toLowerCase().includes('punjabi') ||
            voice.name.toLowerCase().includes('ਪੰਜਾਬੀ')
          );
          utterance.lang = 'pa-IN';
          break;
        default:
          selectedVoice = voices.find(voice => 
            voice.lang === 'en-US' || 
            (voice.lang.includes('en') && voice.lang.includes('US'))
          );
          utterance.lang = 'en-US';
          break;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('TTS Error:', event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Check if voices are already loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [isSupported, i18n.language]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported
  };
};
