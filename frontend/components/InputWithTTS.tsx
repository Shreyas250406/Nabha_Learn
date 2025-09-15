import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { TTSButton } from './TTSButton';
import { useTranslation } from 'react-i18next';

interface InputWithTTSProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  label?: string;
  ttsText?: string; // Text to read aloud for the input field
}

export const InputWithTTS: React.FC<InputWithTTSProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
  className = '',
  label,
  ttsText
}) => {
  const { i18n } = useTranslation();
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the "played once" flag when language changes
  useEffect(() => {
    setHasPlayedOnce(false);
  }, [i18n.language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Handle OTP input - only allow numbers
    if (type === 'text' && maxLength === 6) {
      newValue = newValue.replace(/\D/g, '');
    }
    
    onChange(newValue);
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
        <Input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`${className} ${maxLength === 6 ? 'text-center text-lg tracking-widest' : ''} ${!label ? 'pr-20' : ''}`}
        />
        
        {!label && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1" onClick={handleTTSClick}>
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
