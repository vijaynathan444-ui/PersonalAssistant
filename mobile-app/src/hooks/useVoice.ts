import {useCallback, useEffect} from 'react';
import {useAppStore} from '../store/useAppStore';
import voiceService from '../services/VoiceService';

export function useVoice() {
  const {
    isListening,
    isSpeaking,
    voiceEnabled,
    setIsListening,
    setIsSpeaking,
    setVoiceEnabled,
  } = useAppStore();

  useEffect(() => {
    voiceService.onTTSStart(() => setIsSpeaking(true));
    voiceService.onTTSDone(() => setIsSpeaking(false));
    voiceService.onTTSError(() => setIsSpeaking(false));

    return () => {
      voiceService.removeAllListeners();
    };
  }, [setIsSpeaking]);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled) return;
      try {
        await voiceService.speak(text);
      } catch (error) {
        console.error('TTS failed:', error);
        setIsSpeaking(false);
      }
    },
    [voiceEnabled, setIsSpeaking],
  );

  const stopSpeaking = useCallback(async () => {
    try {
      await voiceService.stopSpeaking();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop speaking failed:', error);
    }
  }, [setIsSpeaking]);

  const requestPermission = useCallback(async () => {
    return await voiceService.requestMicrophonePermission();
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(!voiceEnabled);
  }, [voiceEnabled, setVoiceEnabled]);

  return {
    isListening,
    isSpeaking,
    voiceEnabled,
    speak,
    stopSpeaking,
    requestPermission,
    toggleVoice,
    setIsListening,
  };
}
