import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';

export type SoundType = 
  | 'match3'      // Совпадение 3 элементов
  | 'match4'      // Совпадение 4 элементов  
  | 'match5'      // Совпадение 5+ элементов
  | 'combo'       
  | 'swap'        
  | 'invalidSwap' 
  | 'special'     
  | 'purchase'    
  | 'levelUp'     
  | 'gameOver'    
  | 'dragonBlast' 
  | 'coin';       

const FALLBACK_SOUND = require('../assets/audio/match3.mp3');

const tryRequire = (path: string): number => {
  try {
    return FALLBACK_SOUND;
  } catch {
    return FALLBACK_SOUND;
  }
};

const SOUND_ASSETS: Partial<Record<SoundType, number>> = {
  purchase: require('../assets/audio/purchase.mp3'),
  match3: require('../assets/audio/match3.mp3'),
  match4: require('../assets/audio/match4.mp3'),
  match5: require('../assets/audio/match5.mp3'),
  special: require('../assets/audio/special.mp3'),
  combo: require('../assets/audio/combo.mp3'),

};

const DEFAULT_VOLUMES: Record<SoundType, number> = {
  match3: 0.6,
  match4: 0.7,
  match5: 0.8,
  combo: 0.75,
  swap: 0.4,
  invalidSwap: 0.3,
  special: 0.8,
  purchase: 0.7,
  levelUp: 0.9,
  gameOver: 0.8,
  dragonBlast: 0.85,
  coin: 0.5,
};

class AudioService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isInitialized = false;
  private isEnabled = true;
  private masterVolume = 1.0;
  private loadingPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.loadingPromise) {
      await this.loadingPromise;
      return;
    }

    this.loadingPromise = this._doInitialize();
    await this.loadingPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      await this.preloadSounds();
      
      this.isInitialized = true;
      console.log('[AudioService] Initialized successfully');
    } catch (error) {
      console.error('[AudioService] Initialization failed:', error);
    }
  }
  private async preloadSounds(): Promise<void> {
    const loadPromises = Object.entries(SOUND_ASSETS).map(async ([type, asset]) => {
      if (!asset) return; // Пропускаем если звук не определен
      try {
        await this.loadSound(type as SoundType, asset);
      } catch (error) {
        console.warn(`[AudioService] Failed to load sound: ${type}`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  private async loadSound(type: SoundType, assetModule: number): Promise<void> {
    try {
      const asset = Asset.fromModule(assetModule);
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }

      const source = asset.localUri ? { uri: asset.localUri } : assetModule;
      const { sound } = await Audio.Sound.createAsync(source, {
        volume: DEFAULT_VOLUMES[type] * this.masterVolume,
        shouldPlay: false,
      });

      const oldSound = this.sounds.get(type);
      if (oldSound) {
        await oldSound.unloadAsync();
      }

      this.sounds.set(type, sound);
    } catch (error) {
      console.warn(`[AudioService] Error loading ${type}:`, error);
      throw error;
    }
  }

  async play(type: SoundType): Promise<void> {
    if (!this.isEnabled) return;

    if (!this.isInitialized) {
      await this.initialize();
    }

    const sound = this.sounds.get(type);
    if (!sound) {
      const fallbackSound = this.sounds.get('purchase');
      if (fallbackSound && type !== 'purchase') {
        try {
          const status = await fallbackSound.getStatusAsync();
          if (status.isLoaded) {
            if (status.positionMillis > 0) {
              await fallbackSound.setPositionAsync(0);
            }
            await fallbackSound.playAsync();
          }
        } catch (error) {
        }
      }
      return;
    }

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.positionMillis > 0) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`[AudioService] Error playing ${type}:`, error);
    }
  }

  async playMatch(matchSize: number): Promise<void> {
    if (matchSize >= 5) {
      await this.play('match5');
    } else if (matchSize === 4) {
      await this.play('match4');
    } else {
      await this.play('match3');
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  async setMasterVolume(volume: number): Promise<void> {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    const updatePromises = Array.from(this.sounds.entries()).map(async ([type, sound]) => {
      try {
        const baseVolume = DEFAULT_VOLUMES[type];
        await sound.setVolumeAsync(baseVolume * this.masterVolume);
      } catch (error) {
        console.warn(`[AudioService] Error setting volume for ${type}:`, error);
      }
    });

    await Promise.allSettled(updatePromises);
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  async dispose(): Promise<void> {
    const unloadPromises = Array.from(this.sounds.values()).map(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
      }
    });

    await Promise.allSettled(unloadPromises);
    this.sounds.clear();
    this.isInitialized = false;
    this.loadingPromise = null;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const audioService = new AudioService();
export default audioService;
