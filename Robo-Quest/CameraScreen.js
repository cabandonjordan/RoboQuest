import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Linking, Animated, Modal, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useLayoutEffect } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color constants (inline theme)
const colors = {
  background: '#0D0F18',
  text: '#FFFFFF',
  primary: '#00BFFF',
  secondary: '#FF4500',
  lightGray: '#BFBFBF',
  success: '#00FF00',
  warning: '#FF4500',
  darkCard: '#1A1C2A',
  gradientStart: '#1E3A5F',
  gradientEnd: '#0D0F18',
};

const fonts = {
  heading: 'System',
  body: 'System',
};

function CameraScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [isScanning, setIsScanning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [cameraMode, setCameraMode] = useState('single'); // 'single' or 'batch'
  const cameraRef = useRef(null);

  

  // Animation values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const reticleGlowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cornerAnims = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;

  // Start animations
  useEffect(() => {
    
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Reticle glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(reticleGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(reticleGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Pulse animation for scan button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Corner animations (sequential)
    const cornerSequence = Animated.stagger(
      200,
      cornerAnims.map((anim) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: false,
            }),
          ])
        )
      )
    );
    cornerSequence.start();
    

    return () => {
      setPhoto(null);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Only intercept if we're not already navigating to Home
      if (navigation.isFocused() && e.data.action.type !== 'RESET') {
        e.preventDefault();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const reticleGlowColor = reticleGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 191, 255, 0.3)', 'rgba(0, 191, 255, 0.8)'],
  });

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={colors.primary} style={{ opacity: 0.5 }} />
        <Text style={styles.promptText}>Camera access is required</Text>
        <Text style={styles.permissionSubtitle}>
          RoboQuest needs your permission to use the camera for discovering objects.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={cameraPermission.canAskAgain ? requestCameraPermission : Linking.openSettings}
        >
          <Text style={styles.permissionButtonText}>
            {cameraPermission.canAskAgain ? 'Grant Permission' : 'Open Settings'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isScanning) {
      return;
    }

    setIsScanning(true);

    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (capturedPhoto) {
        setPhoto(capturedPhoto);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const pickImage = async () => {
    try {
      if (!mediaPermission?.granted) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant access to your photo library to select images.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const retakePicture = () => {
    setPhoto(null);
  };

  const confirmPhoto = async () => {
    if (!photo) return;

    // Navigate to ResultScreen with the image URI
    // ResultScreen will handle the object detection and saving
    navigation.navigate('Result', { imageUri: photo.uri, cameraMode });
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const handleHelp = () => {
    setShowHelpModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {!photo && (
        <>
          <View style={styles.cameraContainer}>
            <View style={styles.controlsTop}>
              {/* Camera flip on LEFT */}
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={toggleCameraFacing}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-reverse-outline" size={22} color={colors.text} />
              </TouchableOpacity>

                {/* Mode Selector in CENTER */}
                <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    cameraMode === 'single' && styles.modeButtonActive
                  ]}
                  onPress={() => setCameraMode('single')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="scan" 
                    size={16} 
                    color={cameraMode === 'single' ? colors.background : colors.lightGray} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    cameraMode === 'single' && styles.modeButtonTextActive
                  ]}>
                    Single
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    cameraMode === 'batch' && styles.modeButtonActive
                  ]}
                  onPress={() => setCameraMode('batch')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="grid-outline" 
                    size={16} 
                    color={cameraMode === 'batch' ? colors.background : colors.lightGray} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    cameraMode === 'batch' && styles.modeButtonTextActive
                  ]}>
                    Batch
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Flash on RIGHT */}
              <TouchableOpacity
                style={[styles.controlButton, flash === 'on' && styles.controlButtonActive]}
                onPress={toggleFlash}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={flash === 'on' ? "flash" : "flash-off"}
                  size={22}
                  color={flash === 'on' ? colors.background : colors.text}
                />
              </TouchableOpacity>
            </View>

            {isFocused && (
              <CameraView
                style={styles.camera}
                ref={cameraRef}
                facing={facing}
                enableTorch={flash === 'on'}
              />
            )}

            {/* Enhanced reticle with animations */}
            <Animated.View
              style={[
                styles.reticle,
                {
                  shadowColor: reticleGlowColor,
                  shadowOpacity: 1,
                  shadowRadius: 20,
                }
              ]}
            >
              {/* Animated corners */}
              {cornerAnims.map((anim, index) => {
                const cornerColor = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.primary, colors.secondary],
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.corner,
                      index === 0 && styles.topLeft,
                      index === 1 && styles.topRight,
                      index === 2 && styles.bottomLeft,
                      index === 3 && styles.bottomRight,
                      { borderColor: cornerColor }
                    ]}
                  />
                );
              })}

              {/* Scanning line animation */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    top: '45%',
                    transform: [{ translateY: scanLineTranslateY }]
                  }
                ]}
              />

              {/* Center crosshair */}
              <View style={styles.crosshair}>
                <View style={styles.crosshairHorizontal} />
                <View style={styles.crosshairVertical} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.bottomBar}>
            {/* Quick actions */}
            <View style={styles.quickActions}>
              {/* Gallery button */}
              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="images-outline" size={22} color={colors.lightGray} />
                </View>
              </TouchableOpacity>

              {/* Enhanced scan button with pulse animation */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                  onPress={takePicture}
                  disabled={isScanning}
                  activeOpacity={0.8}
                >
                  <View style={styles.scanButtonInner}>
                    {isScanning ? (
                      <ActivityIndicator color={colors.background} size="small" />
                    ) : (
                      <>
                        <Ionicons name="scan" size={36} color={colors.background} />
                        <View style={styles.scanButtonRing} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Help button */}
              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={handleHelp}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="help-circle-outline" size={22} color={colors.lightGray} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Modal */}
          <Modal
            visible={showHelpModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowHelpModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Scanning Tips</Text>
                  <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                    <Ionicons name="close" size={28} color="#666666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="sunny-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.tipTitle}>Bright Environment</Text>
                    <Text style={styles.tipDescription}>
                      Position your subject in a brightly lit space. Sunlight provides optimal conditions for capturing clear details.
                    </Text>
                  </View>

                  <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="hand-left-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.tipTitle}>Stable Position</Text>
                    <Text style={styles.tipDescription}>
                      Maintain a firm grip and minimize movement while capturing. Motion blur can reduce the quality of object identification.
                    </Text>
                  </View>

                  <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="expand-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.tipTitle}>Position Your Subject</Text>
                    <Text style={styles.tipDescription}>
                      Place the item you want to identify near the center of your viewfinder. Aim to have it occupy a significant portion of the screen.
                    </Text>
                  </View>

                  <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="eye-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.tipTitle}>Unobstructed View</Text>
                    <Text style={styles.tipDescription}>
                      Ensure nothing blocks or partially covers your target item. A clean, direct line of sight improves detection results.
                    </Text>
                  </View>

                  <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="navigate-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.tipTitle}>Experiment with Perspective</Text>
                    <Text style={styles.tipDescription}>
                      If the first attempt doesn't work, adjust your position or move closer. Different viewpoints can reveal better results.
                    </Text>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowHelpModal(false)}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      {photo && (
        <>
          <View style={styles.cameraContainer}>
            <Image source={{ uri: photo.uri }} style={styles.cameraPreview} resizeMode="cover" />
          </View>
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={retakePicture}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={confirmPhoto}>
              <Text style={styles.primaryButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 20,
  },
  permissionSubtitle: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    color: colors.background,
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  topBar: {
    padding: 20,
    paddingBottom: 15,
    gap: 16,
  },
  headerContent: {
    gap: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mainTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontFamily: fonts.heading,
    fontSize: 9,
    color: colors.success,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  promptText: {
    color: colors.lightGray,
    fontSize: 15,
    textAlign: 'left',
    fontFamily: fonts.body,
    lineHeight: 22,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 191, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.15)',
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.lightGray,
    letterSpacing: 0.3,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  camera: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(13, 15, 24, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 191, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 15, 24, 0.85)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 191, 255, 0.25)',
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.lightGray,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.background,
  },
  reticle: {
    position: 'absolute',
    width: 250,
    height: 250,
    top: '45%',
    left: '50%',
    marginTop: -125,
    marginLeft: -125,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  crosshairVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  bottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 50,
    marginTop: 5,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.darkCard,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 191, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  scanButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  scanButtonRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.background,
    opacity: 0.3,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  scanInstruction: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanSubInstruction: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    opacity: 0.7,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
  },
  tipCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  tipDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.background,
  },
});

export default CameraScreen;