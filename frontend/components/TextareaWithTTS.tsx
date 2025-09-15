import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { TTSButton } from './TTSButton';
import { useTranslation } from 'react-i18next';

interface TextareaWithTTSProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  rows?: number;
  className?: string;
  label?: string;
  ttsText?: string; // Text to read aloud for the textarea field
}

export const TextareaWithTTS: React.FC<TextareaWithTTSProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  className = '',
  label,
  ttsText
}) => {
  const { i18n } = useTranslation();
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset the "played once" flag when language changes
  useEffect(() => {
    setHasPlayedOnce(false);
  }, [i18n.language]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleTTSClick = () => {
    // For non-English languages, only allow TTS once
    if (i18n.language !== 'en' && hasPlayedOnce) {
      return;
    }
    
    if (i18n.language !== 'en') {
      setHasPlayedOnce(true);
    }
  };

  // Get the text to speak - prioritize ttsText, then label, then placeholder
  const textToSpeak = ttsText || label || placeholder;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div onClick={handleTTSClick}>
            <TTSButton 
              text={textToSpeak} 
              size="sm"
              className={i18n.language !== 'en' && hasPlayedOnce ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </div>
        </div>
      )}
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${className} ${!label ? 'pr-20' : ''}`}
        />
        
        {!label && (
          <div className="absolute right-2 top-2 flex gap-1" onClick={handleTTSClick}>
            <TTSButton 
              text={textToSpeak} 
              size="sm"
              className={i18n.language !== 'en' && hasPlayedOnce ? 'opacity-50 cursor-not-allowed' : ''}
            />
            <TTSButton 
              text={placeholder} 
              size="sm"
              className={`${i18n.language !== 'en' && hasPlayedOnce ? 'opacity-50 cursor-not-allowed' : ''} bg-blue-50 hover:bg-blue-100`}
            />
          </div>
        )}
        

      </div>
    </div>
  );
};
