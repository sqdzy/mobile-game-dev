import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import audioService, { SoundType } from '../services/AudioService';

interface AudioContextType {
  isEnabled: boolean;
  isReady: boolean;
  masterVolume: number;
  setEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => Promise<void>;
  play: (type: SoundType) => Promise<void>;
  playMatch: (matchSize: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabledState] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(1.0);

  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      try {
        await audioService.initialize();
        if (mounted) {
          setIsReady(audioService.isReady());
        }
      } catch (error) {
        console.error('[AudioProvider] Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      mounted = false;
    };
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    audioService.setEnabled(enabled);
  }, []);

  const setMasterVolume = useCallback(async (volume: number) => {
    setMasterVolumeState(volume);
    await audioService.setMasterVolume(volume);
  }, []);

  const play = useCallback(async (type: SoundType) => {
    await audioService.play(type);
  }, []);

  const playMatch = useCallback(async (matchSize: number) => {
    await audioService.playMatch(matchSize);
  }, []);

  const value: AudioContextType = {
    isEnabled,
    isReady,
    masterVolume,
    setEnabled,
    setMasterVolume,
    play,
    playMatch,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;
