
import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript }) => {
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (SpeechRecognition) {
      const instance = new SpeechRecognition();
      instance.continuous = false;
      instance.lang = 'vi-VN';
      instance.interimResults = false;

      instance.onstart = () => setIsListening(true);
      instance.onend = () => setIsListening(false);
      instance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };
      instance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            alert('Không nhận dạng được giọng nói. Vui lòng thử lại và nói rõ hơn gần micro.');
        } else if (event.error === 'not-allowed') {
            alert('Bạn đã từ chối quyền truy cập micro. Vui lòng cho phép truy cập micro trong cài đặt trình duyệt để sử dụng tính năng này.');
        } else {
            alert(`Đã xảy ra lỗi khi nhận dạng giọng nói: ${event.error}. Vui lòng thử lại.`);
        }
        setIsListening(false);
      };
      setRecognition(instance);
      setIsAvailable(true);
    } else {
      setIsAvailable(false);
    }
  }, [onTranscript]);

  const handleToggleListen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };
  
  if (!isAvailable) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggleListen}
      className={`p-1 rounded-full transition-colors focus:outline-none ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
      aria-label={isListening ? 'Dừng ghi âm' : 'Nhập liệu bằng giọng nói'}
    >
      <MicrophoneIcon className="h-5 w-5" />
    </button>
  );
};
