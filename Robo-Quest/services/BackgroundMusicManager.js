// BackgroundMusicManager.js
import { Audio } from 'expo-av';

class BackgroundMusicManager {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  async initializeMusic() {
    try {
      // Set audio mode to allow background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load the background music
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/music/background_music.mp3'),
        {
          isLooping: true,
          volume: 0.3, // Adjust volume as needed (0.0 to 1.0)
        }
      );

      this.sound = sound;
    } catch (error) {
      console.log('Error initializing background music:', error);
    }
  }

  async playMusic() {
    try {
      if (!this.sound) {
        await this.initializeMusic();
      }

      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
        this.isPaused = false;
      } else if (this.sound && this.isPaused) {
        await this.sound.playAsync();
        this.isPaused = false;
        this.isPlaying = true;
      }
    } catch (error) {
      console.log('Error playing background music:', error);
    }
  }

  async pauseMusic() {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        this.isPaused = true;
      }
    } catch (error) {
      console.log('Error pausing background music:', error);
    }
  }

  async stopMusic() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        this.isPlaying = false;
        this.isPaused = false;
      }
    } catch (error) {
      console.log('Error stopping background music:', error);
    }
  }

  async setVolume(volume) {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.log('Error setting volume:', error);
    }
  }

  async unloadMusic() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        this.isPaused = false;
      }
    } catch (error) {
      console.log('Error unloading background music:', error);
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

// Export a single instance to be used across the app
export default new BackgroundMusicManager();
