import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Animated, ScrollView, Dimensions, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectObjectsInImage, analyzeSelectedObject, detectAndAnalyzeMainObject } from './aifunctions/gemini';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color constants (white theme)
const colors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  primary: '#00BFFF',
  secondary: '#FF4500',
  lightGray: '#666666',
  success: '#00AA00',
  warning: '#FF4500',
  cardBackground: '#F5F5F5',
  border: '#E0E0E0',
};

const fonts = {
  heading: 'System',
  body: 'System',
};

function ResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri, cameraMode = 'batch' } = route.params || {};

  const [isDetecting, setIsDetecting] = useState(true);
  const [error, setError] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [analyzingObject, setAnalyzingObject] = useState(null);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);

  // Animation refs
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Start animations
  useEffect(() => {
    // Progress bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
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

    // Rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Particle animations
    particleAnims.forEach((particle, index) => {
      const angle = (index / particleAnims.length) * Math.PI * 2;
      const distance = 60;

      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: Math.cos(angle) * distance,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.sin(angle) * distance,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });

    // Detection
    const performDetection = async () => {
      if (!imageUri) {
        setError('No image provided. Please try again.');
        setIsDetecting(false);
        return;
      }

      const delay = (ms) => new Promise(res => setTimeout(res, ms));

      try {
        // Single mode: use optimized function that detects and analyzes in one call
        if (cameraMode === 'single') {
          const [result] = await Promise.all([
            detectAndAnalyzeMainObject(imageUri),
            delay(1500) // Minimum display time for UX
          ]);

          if (result.error) {
            setError(result.error);
            setIsDetecting(false);
            return;
          }

          // Single mode returns object (singular) and sceneContext
          if (result.object) {
            // Show auto-analyzing state
            setIsAutoAnalyzing(true);

            // Save to journal
            try {
              const journalEntry = {
                id: Date.now().toString(),
                uri: imageUri,
                timestamp: Date.now(),
                selectedObject: result.object.name,
                description: result.object.name,
                funFact: result.object.funFact,
                the_science_in_action: result.object.the_science_in_action,
                category: result.object.category,
                confidence: result.object.confidence,
              };

              const existingEntriesJson = await AsyncStorage.getItem('journalPhotos');
              const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

              const existingIndex = existingEntries.findIndex(entry => entry.uri === imageUri);
              
              if (existingIndex >= 0) {
                existingEntries[existingIndex] = {
                  ...existingEntries[existingIndex],
                  ...journalEntry,
                  id: existingEntries[existingIndex].id,
                };
              } else {
                existingEntries.unshift(journalEntry);
              }

              await AsyncStorage.setItem('journalPhotos', JSON.stringify(existingEntries));
              console.log('✓ Saved journal entry (single mode)');
            } catch (journalError) {
              console.error('❌ Error saving journal entry:', journalError);
            }

            // Convert single object format to match AnalyzeScreen expectations
            const analysisResult = {
              objectName: result.object.name,
              confidence: result.object.confidence,
              category: result.object.category,
              funFact: result.object.funFact,
              the_science_in_action: result.object.the_science_in_action,
            };

            // Navigate directly to AnalyzeScreen with pre-analyzed result
            navigation.navigate('Analyze', {
              imageUri,
              detectedObjects: [result.object], // Convert to array for compatibility
              sceneContext: result.sceneContext,
              preAnalyzedResult: analysisResult,
              selectedObjectName: result.object.name,
            });
          } else {
            setError('No main object detected in the image. Please try again with a clearer photo.');
            setIsDetecting(false);
          }
          return;
        }

        // Batch mode: use standard detection (detects multiple objects)
        const [result] = await Promise.all([
          detectObjectsInImage(imageUri),
          delay(1500) // Minimum display time for UX
        ]);

        if (result.error) {
          setError(result.error);
        } else if (result.objects && result.objects.length > 0) {
          // Store detection results in AsyncStorage
          try {
            const detectionData = {
              imageUri,
              objects: result.objects,
              sceneContext: result.sceneContext,
              timestamp: new Date().toISOString(),
              id: Date.now().toString(),
            };

            // Get existing detections
            const existingDetectionsJson = await AsyncStorage.getItem('detectionResults');
            const existingDetections = existingDetectionsJson ? JSON.parse(existingDetectionsJson) : [];

            // Add new detection to beginning
            existingDetections.unshift(detectionData);

            // Save back to storage
            await AsyncStorage.setItem('detectionResults', JSON.stringify(existingDetections));

            console.log(`✓ Saved detection with ${result.objects.length} objects`);

            if (result.sceneContext) {
              console.log(`📍 Scene: ${result.sceneContext.location}`);
            }

            // Also save photo to journal (without analysis yet - will be updated when analysis completes)
            try {
              const journalEntry = {
                id: Date.now().toString(),
                uri: imageUri,
                timestamp: Date.now(),
                // Analysis fields will be added later in AnalyzeScreen
              };

              const existingEntriesJson = await AsyncStorage.getItem('journalPhotos');
              const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

              // Check if this image already exists
              const existingIndex = existingEntries.findIndex(entry => entry.uri === imageUri);
              
              if (existingIndex < 0) {
                // Add new entry (only if it doesn't exist)
                existingEntries.unshift(journalEntry);
                await AsyncStorage.setItem('journalPhotos', JSON.stringify(existingEntries));
                console.log('✓ Saved photo to journal');
              }
            } catch (journalError) {
              console.error('❌ Error saving photo to journal:', journalError);
              // Don't block the flow if journal save fails
            }

            setDetectionResult(result);
          } catch (storageError) {
            console.error('❌ Error saving detection:', storageError);
            setError('Failed to save detection results. Please try again.');
          }
        } else {
          setError('No objects detected in the image. Please try again with a clearer photo.');
        }
      } catch (detectionError) {
        console.error('❌ Error during detection:', detectionError);
        setError(`Detection failed: ${detectionError.message || 'Unknown error'}`);
      } finally {
        setIsDetecting(false);
      }
    };

    performDetection();
  }, [imageUri]);

  const progressWidth = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleRetake = () => {
    navigation.goBack();
  };

  // Error State
  if (error && !isDetecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="alert-circle-outline" size={100} color={colors.warning} />
          </Animated.View>
          <Text style={styles.errorTitle}>Detection Failed</Text>
          <Text style={styles.errorText}>{error}</Text>

          <View style={styles.errorSuggestions}>
            <Text style={styles.suggestionTitle}>Try these solutions:</Text>
            <View style={styles.suggestionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.suggestionText}>Ensure good lighting</Text>
            </View>
            <View style={styles.suggestionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.suggestionText}>Focus on clear objects</Text>
            </View>
            <View style={styles.suggestionItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.suggestionText}>Avoid blurry photos</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name="camera-outline" size={24} color={colors.background} />
            <Text style={styles.retakeButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Auto-analyzing state (single mode)
  if (isAutoAnalyzing && detectionResult && !isDetecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.particleContainer}>
              {particleAnims.map((particle, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      transform: [
                        { translateX: particle.x },
                        { translateY: particle.y },
                        { scale: particle.scale },
                      ],
                      opacity: particle.opacity,
                    },
                  ]}
                />
              ))}

              <Animated.View style={[styles.scanIconContainer, { transform: [{ rotate: spin }] }]}>
                <View style={styles.scanIconInner}>
                  <Ionicons name="analytics" size={70} color={colors.primary} />
                </View>
                <View style={styles.scanIconRing} />
              </Animated.View>
            </View>

            <View style={styles.statusTextContainer}>
              <Text style={styles.statusText}>Analyzing Main Object</Text>
              <Text style={styles.subStatusText}>Getting detailed information...</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Success State - Show Results (batch mode only)
  if (detectionResult && !isDetecting && cameraMode === 'batch') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>

          <ScrollView 
            style={styles.resultsContainer}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.successHeader}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.successTitle}>
                Found {detectionResult.objects.length} Object{detectionResult.objects.length > 1 ? 's' : ''}
              </Text>
            </View>

            {detectionResult.sceneContext && (
              <View style={styles.sceneContextCard}>
                <Text style={styles.sceneContextTitle}>📍 Scene Context</Text>
                <Text style={styles.sceneContextLocation}>{detectionResult.sceneContext.location}</Text>
                <Text style={styles.sceneContextDescription}>{detectionResult.sceneContext.description}</Text>
                {detectionResult.sceneContext.relatedConcepts && detectionResult.sceneContext.relatedConcepts.length > 0 && (
                  <View style={styles.conceptsContainer}>
                    <Text style={styles.conceptsLabel}>Related Concepts:</Text>
                    <View style={styles.conceptsList}>
                      {detectionResult.sceneContext.relatedConcepts.map((concept, index) => (
                        <View key={index} style={styles.conceptTag}>
                          <Text style={styles.conceptText}>{concept}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.analyzeAllButton}
              onPress={() => {
                navigation.navigate('Analyze', {
                  imageUri,
                  detectedObjects: detectionResult.objects,
                  sceneContext: detectionResult.sceneContext,
                });
              }}
            >
              <Ionicons name="analytics-outline" size={20} color={colors.background} />
              <Text style={styles.analyzeAllButtonText}>Analyze Objects</Text>
            </TouchableOpacity>

            <View style={styles.objectsList}>
              <Text style={styles.objectsListTitle}>Detected Objects:</Text>
              {detectionResult.objects.map((obj, index) => (
                <TouchableOpacity
                  key={obj.id || index}
                  style={styles.objectCard}
                  onPress={async () => {
                    if (analyzingObject === obj.id) return;
                    
                    setAnalyzingObject(obj.id);
                    try {
                      const boundingBox = obj.boundingBox || {
                        x: 25,
                        y: 25,
                        width: 50,
                        height: 50,
                      };

                      const result = await analyzeSelectedObject(
                        imageUri,
                        obj.name,
                        boundingBox,
                        detectionResult.sceneContext
                      );

                      if (result.error) {
                        Alert.alert('Analysis Error', result.error);
                        setAnalyzingObject(null);
                        return;
                      }

                      // Navigate to AnalyzeScreen with the analysis result
                      navigation.navigate('Analyze', {
                        imageUri,
                        detectedObjects: detectionResult.objects,
                        sceneContext: detectionResult.sceneContext,
                        preAnalyzedResult: result,
                        selectedObjectName: obj.name,
                      });
                    } catch (error) {
                      console.error('Error analyzing object:', error);
                      Alert.alert('Error', 'Failed to analyze object. Please try again.');
                    } finally {
                      setAnalyzingObject(null);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={analyzingObject === obj.id}
                >
                  <View style={styles.objectHeader}>
                    <Text style={styles.objectName}>{obj.name}</Text>
                    {obj.category && (
                      <View style={[styles.categoryBadge, styles[`category${obj.category}`]]}>
                        <Text style={styles.categoryText}>{obj.category}</Text>
                      </View>
                    )}
                  </View>
                  {obj.confidence && (
                    <Text style={styles.objectConfidence}>Confidence: {obj.confidence}%</Text>
                  )}
                  <View style={styles.analyzeHint}>
                    {analyzingObject === obj.id ? (
                      <>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.analyzeHintText}>Analyzing...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} />
                        <Text style={styles.analyzeHintText}>Tap to analyze</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={handleRetake}>
              <Ionicons name="arrow-back" size={24} color={colors.background} />
              <Text style={styles.backButtonText}>Back to Camera</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Loading State
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.particleContainer}>
            {particleAnims.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    transform: [
                      { translateX: particle.x },
                      { translateY: particle.y },
                      { scale: particle.scale },
                    ],
                    opacity: particle.opacity,
                  },
                ]}
              />
            ))}

            <Animated.View style={[styles.scanIconContainer, { transform: [{ rotate: spin }] }]}>
              <View style={styles.scanIconInner}>
                <Ionicons name="settings" size={70} color={colors.primary} />
              </View>
              <View style={styles.scanIconRing} />
            </Animated.View>
          </View>

          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>Analyzing Image</Text>
            <Text style={styles.subStatusText}>Detecting objects with AI vision</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            <View style={styles.progressDots}>
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  imageContainer: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 24,
    marginBottom: 20,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 24,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
    width: '100%',
  },
  particleContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  scanIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIconInner: {
    zIndex: 2,
  },
  scanIconRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(0, 191, 255, 0.3)',
    borderStyle: 'dashed',
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  statusTextContainer: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statusText: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subStatusText: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 14,
    opacity: 0.8,
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: 3,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  errorTitle: {
    fontFamily: fonts.heading,
    color: colors.warning,
    fontSize: 28,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  errorSuggestions: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionTitle: {
    fontFamily: fonts.heading,
    color: colors.primary,
    fontSize: 16,
    marginBottom: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  suggestionText: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 14,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: colors.primary,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retakeButtonText: {
    fontFamily: fonts.heading,
    color: colors.background,
    fontSize: 18,
  },
  resultsContainer: {
    width: '100%',
    flex: 1,
  },
  resultsContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  successTitle: {
    fontFamily: fonts.heading,
    color: colors.success,
    fontSize: 24,
  },
  sceneContextCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sceneContextTitle: {
    fontFamily: fonts.heading,
    color: colors.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  sceneContextLocation: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 14,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  sceneContextDescription: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  conceptsContainer: {
    marginTop: 10,
  },
  conceptsLabel: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 12,
    marginBottom: 8,
  },
  conceptsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conceptTag: {
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.25)',
  },
  conceptText: {
    fontFamily: fonts.body,
    color: colors.primary,
    fontSize: 11,
  },
  analyzeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: colors.secondary,
    marginBottom: 20,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeAllButtonText: {
    fontFamily: fonts.heading,
    color: colors.background,
    fontSize: 16,
  },
  objectsList: {
    marginBottom: 20,
  },
  objectsListTitle: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 18,
    marginBottom: 12,
  },
  objectCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  analyzeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  analyzeHintText: {
    fontFamily: fonts.body,
    color: colors.primary,
    fontSize: 12,
  },
  objectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  objectName: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryInnovare: {
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.3)',
  },
  categoryGeneralis: {
    backgroundColor: 'rgba(191, 191, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(191, 191, 191, 0.3)',
  },
  categoryCreativia: {
    backgroundColor: 'rgba(255, 69, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  categoryText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 11,
  },
  objectConfidence: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: colors.primary,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    fontFamily: fonts.heading,
    color: colors.background,
    fontSize: 18,
  },
});

export default ResultScreen;

