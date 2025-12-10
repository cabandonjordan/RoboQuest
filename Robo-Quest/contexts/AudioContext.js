import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load audio settings from storage on mount
  useEffect(() => {
    loadAudioSettings();
  }, []);

  // Save audio settings whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveAudioSettings();
    }
  }, [musicEnabled, sfxEnabled, musicVolume, sfxVolume, isLoaded]);

  const loadAudioSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('audioSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setMusicEnabled(parsed.musicEnabled ?? true);
        setSfxEnabled(parsed.sfxEnabled ?? true);
        setMusicVolume(parsed.musicVolume ?? 0.7);
        setSfxVolume(parsed.sfxVolume ?? 0.5);
      }
    } catch (error) {
      console.log('Error loading audio settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveAudioSettings = async () => {
    try {
      const settings = {
        musicEnabled,
        sfxEnabled,
        musicVolume,
        sfxVolume,
      };
      await AsyncStorage.setItem('audioSettings', JSON.stringify(settings));
    } catch (error) {
      console.log('Error saving audio settings:', error);
    }
  };

  const playButtonSound = async () => {
    if (!sfxEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/music/button_sfx.mp3')
      );
      await sound.setVolumeAsync(sfxVolume);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing button sound:', error);
    }
  };

  const value = {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    playButtonSound,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
