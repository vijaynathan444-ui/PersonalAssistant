import {NativeModules, NativeEventEmitter, Platform, PermissionsAndroid} from 'react-native';

const {VoskModule} = NativeModules;

export type VoiceEventCallback = (text: string) => void;

class VoiceService {
  private eventEmitter: NativeEventEmitter;
  private isListening = false;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  constructor() {
    this.eventEmitter = new NativeEventEmitter(VoskModule);
  }

  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'LocalAI Assistant needs microphone access for voice input.',
        buttonPositive: 'Grant',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  async initializeVosk(modelPath: string): Promise<boolean> {
    return await VoskModule.initializeVosk(modelPath);
  }

  async speak(text: string): Promise<string> {
    if (!text || text.trim().length === 0) return '';
    return await VoskModule.speak(text);
  }

  async stopSpeaking(): Promise<boolean> {
    return await VoskModule.stopSpeaking();
  }

  async isTTSReady(): Promise<boolean> {
    return await VoskModule.isTTSReady();
  }

  onTTSStart(callback: (utteranceId: string) => void): void {
    const listener = this.eventEmitter.addListener('ttsStart', (event) => {
      callback(event.utteranceId);
    });
    this.listeners.set('ttsStart', listener.remove.bind(listener));
  }

  onTTSDone(callback: (utteranceId: string) => void): void {
    const listener = this.eventEmitter.addListener('ttsDone', (event) => {
      callback(event.utteranceId);
    });
    this.listeners.set('ttsDone', listener.remove.bind(listener));
  }

  onTTSError(callback: (utteranceId: string) => void): void {
    const listener = this.eventEmitter.addListener('ttsError', (event) => {
      callback(event.utteranceId);
    });
    this.listeners.set('ttsError', listener.remove.bind(listener));
  }

  removeAllListeners(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners.clear();
  }
}

export const voiceService = new VoiceService();
export default voiceService;
