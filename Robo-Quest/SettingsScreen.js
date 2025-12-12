import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import BackgroundMusicManager from './services/BackgroundMusicManager';
import { useAudio } from './contexts/AudioContext';
// Added Firebase imports for Logout
import { auth, signOut } from './database/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function BlueButton({ children, style, onPress }) {
  const { playButtonSound } = useAudio();
  
  const handlePress = () => {
    playButtonSound();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity style={[styles.blueButton, style]} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.blueButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}

function SettingsScreen() {
  const navigation = useNavigation();
  const { 
    musicEnabled, 
    setMusicEnabled, 
    sfxEnabled, 
    setSfxEnabled, 
    musicVolume, 
    setMusicVolume, 
    sfxVolume, 
    setSfxVolume,
    playButtonSound
  } = useAudio();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  // Changed from showDeleteModal to showLogoutModal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isInitialMount = useRef(true);

  // Control background music playback based on musicEnabled state
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (musicEnabled) {
      BackgroundMusicManager.playMusic();
    } else {
      BackgroundMusicManager.pauseMusic();
    }
  }, [musicEnabled]);

  // Update background music volume when slider changes
  useEffect(() => {
    BackgroundMusicManager.setVolume(musicVolume);
  }, [musicVolume]);

  const handleClose = () => {
    playButtonSound();
    navigation.goBack();
  };

  const handleAudioPress = () => {
    setShowAudioModal(true);
  };

  const handleCloseAudioModal = () => {
    playButtonSound();
    setShowAudioModal(false);
  };

  // Replaces handleDeletePress
  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  // Replaces handleCloseDeleteModal
  const handleCloseLogoutModal = () => {
    playButtonSound();
    setShowLogoutModal(false);
  };

  // Replaces handleConfirmDelete
  const handleConfirmLogout = async () => {
    playButtonSound();
    try {
        await signOut(auth);
        setShowLogoutModal(false);
        // Navigate back to LoginScreen and reset history so user can't go back
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
        });
    } catch (error) {
        console.error("Error logging out: ", error);
        setShowLogoutModal(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Settings</Text>

        <View style={styles.modalContent}>

          <View style={styles.gridRow}>
            <BlueButton style={styles.gridItem} onPress={handleAudioPress}>Audio</BlueButton>
            <BlueButton style={styles.gridItem}>English</BlueButton>
          </View>

          <View style={styles.gridRow}>
            <BlueButton style={styles.gridItem}>Change Name</BlueButton>
            {/* Updated button to Log Out */}
            <TouchableOpacity style={[styles.blueButton, styles.gridItem, styles.logoutButton]} onPress={() => { playButtonSound(); handleLogoutPress(); }} activeOpacity={0.8}>
              <Text style={styles.blueButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <View style={styles.gridRowSmall}>
            <BlueButton style={styles.helpItem}>Terms of Service</BlueButton>
            <BlueButton style={styles.helpItem}>Privacy Policy</BlueButton>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.grayButton} onPress={() => playButtonSound()}><Text style={styles.grayText}>Credits</Text></TouchableOpacity>
          </View>
          
        </View>
      </View>

      {/* Audio Settings Modal */}
      {showAudioModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.audioModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseAudioModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.audioModalTitle}>Audio Settings</Text>

            <View style={styles.audioContent}>
              {/* Music Toggle */}
              <View style={styles.audioSection}>
                <Text style={styles.audioLabel}>Music</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, musicEnabled && styles.toggleButtonOn]}
                  onPress={() => { playButtonSound(); setMusicEnabled(!musicEnabled); }}
                >
                  <Text style={styles.toggleText}>{musicEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>

              {/* SFX Toggle */}
              <View style={styles.audioSection}>
                <Text style={styles.audioLabel}>SFX</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, sfxEnabled && styles.toggleButtonOn]}
                  onPress={() => { playButtonSound(); setSfxEnabled(!sfxEnabled); }}
                >
                  <Text style={styles.toggleText}>{sfxEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>

              {/* Music Volume */}
              <View style={styles.volumeSection}>
                <Text style={styles.volumeLabel}>Music Volume</Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={musicVolume}
                    onValueChange={(value) => {
                      setMusicVolume(value);
                      // Automatically toggle Music on/off based on volume
                      if (value === 0) {
                        setMusicEnabled(false);
                      } else if (!musicEnabled) {
                        setMusicEnabled(true);
                      }
                    }}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#a8b8c8"
                    thumbTintColor="#2e7d32"
                  />
                </View>
              </View>

              {/* SFX Volume */}
              <View style={styles.volumeSection}>
                <Text style={styles.volumeLabel}>SFX Volume</Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={sfxVolume}
                    onValueChange={(value) => {
                      setSfxVolume(value);
                      // Automatically toggle SFX on/off based on volume
                      if (value === 0) {
                        setSfxEnabled(false);
                      } else if (!sfxEnabled) {
                        setSfxEnabled(true);
                      }
                    }}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#a8b8c8"
                    thumbTintColor="#2e7d32"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Log Out Confirmation Modal (Replaces Delete Modal) */}
      {showLogoutModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalHeader}>
              <Text style={styles.logoutModalTitle}>Log Out</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseLogoutModal}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoutContent}>
              <Text style={styles.logoutWarningText}>
                Are you sure you want to log out?
              </Text>
              <Text style={styles.logoutSubText}>
                You will be returned to the login screen.
              </Text>

              <View style={styles.logoutButtonsRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseLogoutModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmLogoutButton} onPress={handleConfirmLogout}>
                  <Text style={styles.confirmLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#f2f7fb',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#bfc9d6',
    overflow: 'hidden',
    paddingTop: 20,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 30,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    flex: 0.48,
    paddingVertical: 16,
  },
  blueButton: {
    backgroundColor: '#6b9ac4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  blueButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  helpItem: {
    flex: 0.48,
    paddingVertical: 12,
  },
  spacer: {
    height: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d6dee6',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  grayButton: {
    width: '48%',
    backgroundColor: '#9aa6b3',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  grayText: {
    color: '#fff',
    fontWeight: '700',
  },
  playerId: {
    marginTop: 12,
    textAlign: 'center',
    color: '#333',
    fontSize: 12,
  },
  // Audio Modal Styles
  audioModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  audioModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#3d4a56',
    padding: 20,
    paddingTop: 50,
  },
  audioModalTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  audioContent: {
    backgroundColor: '#d4dce4',
    borderRadius: 8,
    padding: 20,
  },
  audioSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  audioLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3e50',
  },
  toggleButton: {
    backgroundColor: '#8b9aa8',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#6a7987',
    minWidth: 120,
  },
  toggleButtonOn: {
    backgroundColor: '#4CAF50',
    borderColor: '#357a38',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  volumeSection: {
    marginBottom: 25,
  },
  volumeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  sliderContainer: {
    backgroundColor: '#a8b8c8',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#8a98a6',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Logout Button Style (formerly Delete Button)
  logoutButton: {
    backgroundColor: '#e74c3c', // Kept red as requested/common for logout
  },
  // Logout Confirmation Modal Styles (formerly Delete Modal)
  logoutModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 380,
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#3d4a56',
    padding: 20,
    paddingTop: 20,
  },
  logoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ff4444',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    backgroundColor: '#d4dce4',
    borderRadius: 8,
    padding: 20,
  },
  logoutWarningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  logoutSubText: {
    fontSize: 14,
    color: '#5a6c7d',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  logoutButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b9ac4',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#4a7a9e',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#c0392b',
  },
  confirmLogoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default SettingsScreen;