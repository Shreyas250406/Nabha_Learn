import { Volume2, VolumeX } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { useTranslation } from 'react-i18next';

interface TTSButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TTSButton = ({ text, className = '', size = 'sm' }: TTSButtonProps) => {
  const { speak, stop, isSpeaking, isSupported } = useTTS();
  const { t } = useTranslation();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={isSpeaking ? t('tts.stop') : t('tts.play')}
      aria-label={isSpeaking ? t('tts.stop') : t('tts.play')}
    >
      {isSpeaking ? (
        <VolumeX className={`text-red-500 ${sizeClasses[size]}`} />
      ) : (
        <Volume2 className={`text-blue-500 ${sizeClasses[size]}`} />
      )}
    </button>
  );
};
