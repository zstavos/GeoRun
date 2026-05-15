export const SOUNDS = {
  CLAIM: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  QUEST_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  UPGRADE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
};

class SoundManager {
  private static instance: SoundManager;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  private constructor() {}

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  play(soundUrl: string) {
    if (!this.enabled) return;

    let audio = this.audioCache.get(soundUrl);
    if (!audio) {
      audio = new Audio(soundUrl);
      this.audioCache.set(soundUrl, audio);
    }

    audio.currentTime = 0;
    audio.volume = 0.4;
    audio.play().catch(e => console.warn('Audio playback failed:', e));
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = SoundManager.getInstance();
