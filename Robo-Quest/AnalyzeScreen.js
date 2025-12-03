import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert, ScrollView, Modal, Animated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { analyzeSelectedObject } from './aifunctions/gemini';
import { auth, db, doc, setDoc, getDoc, onAuthStateChanged } from './database/firebase';

// Color constants (white theme - matching ResultScreen.js)
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_CONTENT_HEIGHT = SCREEN_HEIGHT * 0.75; // 75% of screen height for full modal

// Part images mapping (matching LoadoutScreen.js)
const PART_IMAGES = {
  ChassisCreativia: require('./assets/parts/chassis/ChassisCreativia.png'),
  ChassisGeneralis: require('./assets/parts/chassis/ChassisGeneralis.png'),
  ChassisInnovare: require('./assets/parts/chassis/ChassisInnovare.png'),
  EngineCreativia: require('./assets/parts/engines/EngineCreativia.png'),
  EngineGeneralis: require('./assets/parts/engines/EngineGeneralis.png'),
  EngineInnovare: require('./assets/parts/engines/EngineInnovare.png'),
  WeaponCreativia: require('./assets/parts/weapons/WeaponCreativia.png'),
  WeaponGeneralis: require('./assets/parts/weapons/WeaponGeneralis.png'),
  WeaponInnovare: require('./assets/parts/weapons/WeaponInnovare.png'),
  WheelsCreativia: require('./assets/parts/wheels/WheelsCreativia.png'),
  WheelsGeneralis: require('./assets/parts/wheels/WheelsGeneralis.png'),
  WheelsInnovare: require('./assets/parts/wheels/WheelsInnovare.png'),
};

// Part types and categories
// Note: Part type names match LoadoutScreen.js naming convention
const PART_TYPES = ['Weapon', 'Chassis', 'Wheels', 'Engine'];
const PART_CATEGORIES = {
  'Innovare': 'Innovare',
  'Generalis': 'Generalis',
  'Creativia': 'Creativia',
};

// Function to get a random part based on category
function getRandomPartForCategory(category) {
  // Normalize category name (handle case variations)
  const normalizedCategory = category || 'Generalis';
  let categoryKey = 'Generalis';
  
  if (normalizedCategory.includes('Innovare') || normalizedCategory.includes('innovare')) {
    categoryKey = 'Innovare';
  } else if (normalizedCategory.includes('Creativia') || normalizedCategory.includes('creativia')) {
    categoryKey = 'Creativia';
  } else if (normalizedCategory.includes('Generalis') || normalizedCategory.includes('generalis')) {
    categoryKey = 'Generalis';
  }

  // Randomly select a part type
  const randomPartType = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
  
  // Construct part name (e.g., "WeaponInnovare", "ChassisCreativia", "EngineGeneralis")
  const partName = `${randomPartType}${categoryKey}`;
  
  return partName;
}

// Function to save part to user's collection in Firebase
async function savePartToCollection(partName, userId) {
  if (!userId || !partName) {
    console.log('Cannot save part: missing userId or partName');
    return false;
  }

  try {
    const userDocRef = doc(db, 'Roboquest-Collection', userId);
    const userDoc = await getDoc(userDocRef);
    
    let parts = [];
    if (userDoc.exists()) {
      const data = userDoc.data();
      parts = data.parts || [];
    }
    
    // Check if part already exists
    if (!parts.includes(partName)) {
      parts.push(partName);
      await setDoc(userDocRef, { parts }, { merge: true });
      console.log(`✓ Saved part "${partName}" to collection`);
      return true;
    } else {
      console.log(`Part "${partName}" already in collection`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving part to collection:', error);
    return false;
  }
}

export default function AnalyzeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri, detectedObjects, sceneContext, preAnalyzedResult, selectedObjectName } = route.params || {};

  const [selectedObject, setSelectedObject] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [showResultModal, setShowResultModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [awardedPart, setAwardedPart] = useState(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const speechRef = useRef(null);

  // If pre-analyzed result exists, show it immediately
  React.useEffect(() => {
    if (preAnalyzedResult) {
      // Helper function to clean text (remove emojis and markdown/HTML)
      const cleanText = (text) => {
        if (!text) return text;
        let cleaned = text;
        
        // Remove markdown formatting
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold **text**
        cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Italic *text*
        cleaned = cleaned.replace(/__(.*?)__/g, '$1'); // Bold __text__
        cleaned = cleaned.replace(/_(.*?)_/g, '$1'); // Italic _text_
        cleaned = cleaned.replace(/~~(.*?)~~/g, '$1'); // Strikethrough ~~text~~
        cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Inline code `text`
        cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Code blocks
        cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Headers # ## ###
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Links [text](url)
        cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ''); // Images ![alt](url)
        cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ''); // Bullet points
        cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ''); // Numbered lists
        
        // Remove HTML tags
        cleaned = cleaned.replace(/<[^>]+>/g, '');
        
        // Remove emojis and other unicode symbols
        cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{3030}-\u{303F}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '');
        
        // Clean up extra whitespace
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double
        cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single
        cleaned = cleaned.trim();
        
        return cleaned;
      };

      const safeResult = {
        objectName: String(preAnalyzedResult.objectName || selectedObjectName),
        confidence: Number(preAnalyzedResult.confidence || 85),
        category: String(preAnalyzedResult.category || 'General'),
        funFact: cleanText(String(preAnalyzedResult.funFact || 'No information available.')),
        the_science_in_action: cleanText(String(preAnalyzedResult.the_science_in_action || 'No information available.')),
      };

      setAnalysisResult(safeResult);
      setShowResultModal(true);
      setCurrentPage(0);

      // Award random part based on category
      (async () => {
        try {
          const category = safeResult.category;
          if (category) {
            const partName = getRandomPartForCategory(category);
            console.log(`🎁 Awarding part: ${partName} for category: ${category}`);
            
            // Store awarded part in state to display it
            setAwardedPart(partName);
            
            // Get current user
            const currentUser = auth.currentUser;
            if (currentUser) {
              const userId = currentUser.uid;
              const isNewPart = await savePartToCollection(partName, userId);
              
              if (isNewPart) {
                console.log(`✅ New part awarded: ${partName}`);
              }
            } else {
              console.log('No user logged in, part not saved');
            }
          }
        } catch (partError) {
          console.error('❌ Error awarding part:', partError);
          // Don't block the UI if part awarding fails
        }
      })();

      // Save to journal with analysis results
      (async () => {
        try {
          // Check if AsyncStorage is available
          if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
            console.error('AsyncStorage is not properly imported or available');
            return;
          }

          const journalEntry = {
            id: Date.now().toString(),
            uri: imageUri,
            timestamp: Date.now(),
            selectedObject: safeResult.objectName,
            description: safeResult.objectName, // Using object name as description
            funFact: safeResult.funFact,
            the_science_in_action: safeResult.the_science_in_action,
            category: safeResult.category,
            confidence: safeResult.confidence,
          };

          // Get existing journal entries
          const existingEntriesJson = await AsyncStorage.getItem('journalPhotos');
          const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

          // Check if this image already exists in journal
          const existingIndex = existingEntries.findIndex(entry => entry.uri === imageUri);
          
          if (existingIndex >= 0) {
            // Update existing entry with analysis results
            existingEntries[existingIndex] = {
              ...existingEntries[existingIndex],
              ...journalEntry,
              id: existingEntries[existingIndex].id, // Keep original ID
            };
          } else {
            // Add new entry
            existingEntries.unshift(journalEntry);
          }

          // Save back to storage
          await AsyncStorage.setItem('journalPhotos', JSON.stringify(existingEntries));
          console.log('✓ Saved journal entry with analysis results (from preAnalyzedResult)');
        } catch (storageError) {
          console.error('❌ Error saving journal entry:', storageError);
          // Don't show error to user, just log it
        }
      })();
    }
  }, [preAnalyzedResult, selectedObjectName, imageUri]);

  const handleImageLayout = (event) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setImageLayout({ width, height, x, y });
  };

  const handleBoxTap = (object) => {
    setSelectedObject(object);
  };

  const handleObjectConfirm = async () => {
    if (!selectedObject) return;

    setIsAnalyzing(true);
    setAwardedPart(null); // Reset awarded part when starting new analysis

    try {
      // Ensure boundingBox exists, create default if not
      const boundingBox = selectedObject.boundingBox || {
        x: 25,
        y: 25,
        width: 50,
        height: 50,
      };

      const result = await analyzeSelectedObject(
        imageUri,
        selectedObject.name,
        boundingBox,
        sceneContext
      );

      if (result.error) {
        Alert.alert('Analysis Error', result.error);
        setIsAnalyzing(false);
        return;
      }

      // Helper function to clean text (remove emojis and markdown/HTML)
      const cleanText = (text) => {
        if (!text) return text;
        let cleaned = text;
        
        // Remove markdown formatting
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold **text**
        cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Italic *text*
        cleaned = cleaned.replace(/__(.*?)__/g, '$1'); // Bold __text__
        cleaned = cleaned.replace(/_(.*?)_/g, '$1'); // Italic _text_
        cleaned = cleaned.replace(/~~(.*?)~~/g, '$1'); // Strikethrough ~~text~~
        cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // Inline code `text`
        cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Code blocks
        cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Headers # ## ###
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Links [text](url)
        cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ''); // Images ![alt](url)
        cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ''); // Bullet points
        cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ''); // Numbered lists
        
        // Remove HTML tags
        cleaned = cleaned.replace(/<[^>]+>/g, '');
        
        // Remove emojis and other unicode symbols
        cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{3030}-\u{303F}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '');
        
        // Clean up extra whitespace
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double
        cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single
        cleaned = cleaned.trim();
        
        return cleaned;
      };

      // Store result and show modal
      const safeResult = {
        objectName: String(result.objectName || selectedObject.name),
        confidence: Number(result.confidence || 85),
        category: String(result.category || 'General'),
        funFact: cleanText(String(result.funFact || 'No information available.')),
        the_science_in_action: cleanText(String(result.the_science_in_action || 'No information available.')),
      };

      setAnalysisResult(safeResult);
      setIsAnalyzing(false);
      console.log('📊 Analysis Result:', safeResult);
      setShowResultModal(true);
      setCurrentPage(0);

      // Award random part based on category
      try {
        const category = safeResult.category;
        if (category) {
          const partName = getRandomPartForCategory(category);
          console.log(`🎁 Awarding part: ${partName} for category: ${category}`);
          
          // Store awarded part in state to display it
          setAwardedPart(partName);
          
          // Get current user
          const currentUser = auth.currentUser;
          if (currentUser) {
            const userId = currentUser.uid;
            const isNewPart = await savePartToCollection(partName, userId);
            
            if (isNewPart) {
              // Show success message (optional - you can customize this)
              console.log(`✅ New part awarded: ${partName}`);
            }
          } else {
            console.log('No user logged in, part not saved');
          }
        }
      } catch (partError) {
        console.error('❌ Error awarding part:', partError);
        // Don't block the UI if part awarding fails
      }

      // Save to journal with analysis results
      try {
        // Check if AsyncStorage is available
        if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
          console.error('AsyncStorage is not properly imported or available');
          return;
        }

        const journalEntry = {
          id: Date.now().toString(),
          uri: imageUri,
          timestamp: Date.now(),
          selectedObject: safeResult.objectName,
          description: safeResult.objectName, // Using object name as description
          funFact: safeResult.funFact,
          the_science_in_action: safeResult.the_science_in_action,
          category: safeResult.category,
          confidence: safeResult.confidence,
        };

        // Get existing journal entries
        const existingEntriesJson = await AsyncStorage.getItem('journalPhotos');
        const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

        // Check if this image already exists in journal
        const existingIndex = existingEntries.findIndex(entry => entry.uri === imageUri);
        
        if (existingIndex >= 0) {
          // Update existing entry with analysis results
          existingEntries[existingIndex] = {
            ...existingEntries[existingIndex],
            ...journalEntry,
            id: existingEntries[existingIndex].id, // Keep original ID
          };
        } else {
          // Add new entry
          existingEntries.unshift(journalEntry);
        }

        // Save back to storage
        await AsyncStorage.setItem('journalPhotos', JSON.stringify(existingEntries));
        console.log('✓ Saved journal entry with analysis results');
      } catch (storageError) {
        console.error('❌ Error saving journal entry:', storageError);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('Error analyzing object:', error);
      Alert.alert('Error', 'Failed to analyze object. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    // Stop any ongoing speech when leaving
    if (speechRef.current) {
      Speech.stop();
      speechRef.current = null;
    }
    navigation.goBack();
  };

  // Function to speak text with natural assistant voice
  const speakText = (text) => {
    if (!text || text === 'No fun fact available.' || text === 'No science information available.' || isMuted) return;
    
    // Stop any ongoing speech
    if (speechRef.current) {
      Speech.stop();
    }

    // Clean text for speech (remove extra formatting)
    const cleanText = text.replace(/\n+/g, '. ').trim();
    
    // Configure voice to sound like a natural assistant
    const options = {
      language: 'en-US',
      pitch: 1.0, // Natural pitch for assistant-like sound
      rate: 0.9, // Natural speaking rate
      quality: Speech.VoiceQuality.Enhanced,
    };

    Speech.speak(cleanText, {
      ...options,
      onStart: () => {
        speechRef.current = true;
      },
      onDone: () => {
        speechRef.current = null;
      },
      onStopped: () => {
        speechRef.current = null;
      },
      onError: (error) => {
        console.error('Speech error:', error);
        speechRef.current = null;
      },
    });
  };

  // Auto-play fun fact when fun fact page is shown
  useEffect(() => {
    if (showResultModal && currentPage === 0 && analysisResult?.funFact && !isMuted) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        speakText(analysisResult.funFact);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResultModal, currentPage, analysisResult?.funFact, isMuted]);

  // Auto-play science in action when science page is shown
  useEffect(() => {
    if (showResultModal && currentPage === 1 && analysisResult?.the_science_in_action && !isMuted) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        speakText(analysisResult.the_science_in_action);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResultModal, currentPage, analysisResult?.the_science_in_action, isMuted]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!showResultModal && speechRef.current) {
      Speech.stop();
      speechRef.current = null;
    }
  }, [showResultModal]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      // Stop speech when muting
      if (speechRef.current) {
        Speech.stop();
        speechRef.current = null;
      }
    } else {
      // Resume speech when unmuting (if on fun fact or science page)
      if (currentPage === 0 && analysisResult?.funFact) {
        speakText(analysisResult.funFact);
      } else if (currentPage === 1 && analysisResult?.the_science_in_action) {
        speakText(analysisResult.the_science_in_action);
      }
    }
  };

  if (!detectedObjects || detectedObjects.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
          <Text style={styles.errorText}>No objects available for analysis</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleRetake}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} style={styles.backButtonHeader}>
          <Ionicons name="close" size={24} color={colors.lightGray} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select an Object</Text>
          <Text style={styles.headerSubtitle}>Tap any box, then confirm below</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Image with bounding boxes */}
      <View style={styles.imageSection}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
          onLayout={handleImageLayout}
        />

        {/* Render bounding boxes */}
        {imageLayout.width > 0 && detectedObjects.map((object, index) => {
          // Default bounding box if not provided
          const boundingBox = object.boundingBox || {
            x: 25 + (index * 10),
            y: 25 + (index * 10),
            width: 30,
            height: 30,
          };

          const boxLeft = (boundingBox.x / 100) * imageLayout.width;
          const boxTop = (boundingBox.y / 100) * imageLayout.height;
          const boxWidth = (boundingBox.width / 100) * imageLayout.width;
          const boxHeight = (boundingBox.height / 100) * imageLayout.height;

          const isSelected = selectedObject?.name === object.name;
          const boxColor = isSelected ? colors.secondary : colors.primary;

          return (
            <TouchableOpacity
              key={object.id || index}
              style={[
                styles.boundingBox,
                {
                  left: boxLeft,
                  top: boxTop,
                  width: boxWidth,
                  height: boxHeight,
                  borderColor: boxColor,
                  borderWidth: isSelected ? 4 : 3,
                }
              ]}
              onPress={() => !isAnalyzing && handleBoxTap(object)}
              disabled={isAnalyzing}
              activeOpacity={0.7}
            >
              {/* Label - positioned intelligently to avoid header overlap */}
              <View
                style={[
                  styles.label,
                  { backgroundColor: boxColor },
                  // If box is near top, put label inside/below
                  boxTop < 40 ? { top: 2, bottom: 'auto' } : { top: -26 }
                ]}
              >
                <Text style={styles.labelText} numberOfLines={1}>
                  {object.name}
                </Text>
              </View>

              {/* Confidence badge */}
              {object.confidence && (
                <View style={[styles.confidenceBadge, { backgroundColor: boxColor }]}>
                  <Text style={styles.confidenceText}>{object.confidence}%</Text>
                </View>
              )}

              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: boxColor }]} />

              {/* Selected indicator overlay */}
              {isSelected && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.secondary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.analyzingText}>
              Analyzing "{selectedObject?.name}"...
            </Text>
            <Text style={styles.analyzingSubtext}>
              Getting detailed information
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Found {detectedObjects.length} {detectedObjects.length === 1 ? 'object' : 'objects'}.
                {selectedObject ? ' Tap the button below to continue!' : ' Tap any box to select.'}
              </Text>
            </View>

            {/* Object list with full names */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.objectListScroll}
              contentContainerStyle={styles.objectList}
            >
              {detectedObjects.map((object, index) => {
                const isSelected = selectedObject?.name === object.name;
                return (
                  <TouchableOpacity
                    key={object.id || index}
                    style={[
                      styles.objectChip,
                      isSelected && styles.objectChipSelected
                    ]}
                    onPress={() => handleBoxTap(object)}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "cube-outline"}
                      size={18}
                      color={isSelected ? colors.secondary : colors.primary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected
                      ]}
                    >
                      {object.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Confirm button - only show when object is selected */}
            {selectedObject && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleObjectConfirm}
              >
                <Ionicons name="arrow-forward-circle" size={24} color={colors.background} />
                <Text style={styles.confirmButtonText}>
                  Learn About "{selectedObject.name}"
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Swipeable Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          // Stop any ongoing speech when leaving
          if (speechRef.current) {
            Speech.stop();
            speechRef.current = null;
          }
          setShowResultModal(false);
          setAwardedPart(null); // Reset awarded part when closing modal
          // Navigate back to Camera screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{analysisResult?.objectName || 'Analysis'}</Text>
                {analysisResult?.category && (
                  <View style={[styles.categoryBadge, styles[`category${analysisResult.category}`]]}>
                    <Text style={styles.categoryText}>{analysisResult.category}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  // Stop any ongoing speech when leaving
                  if (speechRef.current) {
                    Speech.stop();
                    speechRef.current = null;
                  }
                  setShowResultModal(false);
                  setAwardedPart(null); // Reset awarded part when closing modal
                  // Navigate back to Camera screen
                  navigation.navigate('Camera');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.lightGray} />
              </TouchableOpacity>
            </View>

            {/* Swipeable Content */}
            <View style={styles.modalScrollContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentPage(page);
                  // Stop any ongoing speech when switching pages
                  if (speechRef.current) {
                    Speech.stop();
                    speechRef.current = null;
                  }
                }}
                style={styles.modalHorizontalScroll}
              >
              {/* Fun Fact Page */}
              <View style={styles.modalPage}>
                <View style={styles.modalPageContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="sparkles" size={48} color={colors.secondary} />
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.modalPageTitle}>Fun Fact</Text>
                    <TouchableOpacity
                      onPress={toggleMute}
                      style={styles.muteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={isMuted ? "volume-mute" : "volume-high"} 
                        size={24} 
                        color={isMuted ? colors.lightGray : colors.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView 
                    style={styles.modalTextContainer}
                    contentContainerStyle={styles.modalTextContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.modalText}>
                      {analysisResult?.funFact || 'No fun fact available.'}
                    </Text>
                  </ScrollView>
                </View>
              </View>

              {/* Science in Action Page */}
              <View style={styles.modalPage}>
                <View style={styles.modalPageContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="flask" size={48} color={colors.primary} />
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.modalPageTitle}>Science in Action</Text>
                    <TouchableOpacity
                      onPress={toggleMute}
                      style={styles.muteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={isMuted ? "volume-mute" : "volume-high"} 
                        size={24} 
                        color={isMuted ? colors.lightGray : colors.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView 
                    style={styles.modalTextContainer}
                    contentContainerStyle={styles.modalTextContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.modalText}>
                      {analysisResult?.the_science_in_action || 'No science information available.'}
                    </Text>
                  </ScrollView>
                </View>
              </View>

              {/* Part Reward Page - Only show if part was awarded */}
              {awardedPart && PART_IMAGES[awardedPart] && (
                <View style={styles.modalPage}>
                  <View style={styles.modalPageContent}>
                    <View style={styles.modalIconContainer}>
                      <Ionicons name="gift" size={48} color={colors.secondary} />
                    </View>
                    <View style={styles.titleRow}>
                      <Text style={styles.modalPageTitle}>Part Unlocked!</Text>
                    </View>
                    <View style={styles.partRewardContent}>
                      <Image 
                        source={PART_IMAGES[awardedPart]} 
                        style={[
                          styles.partRewardImage,
                          awardedPart.startsWith('Engine') && styles.partRewardImageLarge
                        ]}
                        resizeMode="contain"
                      />
                      <Text style={styles.partRewardName}>{awardedPart}</Text>
                      <Text style={styles.partRewardSubtext}>
                        This part has been added to your collection!
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              </ScrollView>
            </View>

            {/* Page Indicators */}
            <View style={styles.pageIndicators}>
              <View style={[styles.pageIndicator, currentPage === 0 && styles.pageIndicatorActive]} />
              <View style={[styles.pageIndicator, currentPage === 1 && styles.pageIndicatorActive]} />
              {awardedPart && PART_IMAGES[awardedPart] && (
                <View style={[styles.pageIndicator, currentPage === 2 && styles.pageIndicatorActive]} />
              )}
            </View>

            {/* Navigation Hints */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {currentPage === 0 
                  ? 'Swipe right for Science →'
                  : currentPage === 1 
                  ? (awardedPart && PART_IMAGES[awardedPart]
                      ? 'Swipe right for Part Reward →'
                      : '← Swipe left for Fun Fact')
                  : '← Swipe left to go back'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  errorText: {
    fontFamily: fonts.heading,
    color: colors.lightGray,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 3,
    opacity: 0.8,
  },
  placeholder: {
    width: 36,
  },
  imageSection: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  boundingBox: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'visible',
  },
  label: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 5,
  },
  labelText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    color: colors.background,
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: -22,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 5,
  },
  confidenceText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.background,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 2,
  },
  bottomPanel: {
    backgroundColor: colors.background,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzingContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  analyzingText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  analyzingSubtext: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.lightGray,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBackground,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.lightGray,
    lineHeight: 18,
  },
  objectListScroll: {
    maxHeight: 45,
    marginBottom: 12,
  },
  objectList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  objectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  objectChipSelected: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  chipText: {
    fontFamily: fonts.heading,
    fontSize: 12,
    color: colors.primary,
  },
  chipTextSelected: {
    color: colors.secondary,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  confirmButtonText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.background,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: colors.primary,
    marginTop: 10,
  },
  backButtonText: {
    fontFamily: fonts.heading,
    color: colors.background,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '92%',
    borderTopWidth: 2,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
    flex: 1,
    width: '100%',
  },
  modalHorizontalScroll: {
    flex: 1,
  },
  modalPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    paddingVertical: 24,
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalPageContent: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    flex: 1,
    paddingTop: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  modalPageTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTextContainer: {
    width: '100%',
    flex: 1,
  },
  modalTextContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalText: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
    lineHeight: 28,
    textAlign: 'left',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  pageIndicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modalFooterText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.lightGray,
    opacity: 0.7,
    textAlign: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
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
    fontWeight: '600',
  },
  partRewardContent: {
    alignItems: 'center',
    gap: 16,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  partRewardImage: {
    width: 180,
    height: 180,
  },
  partRewardImageLarge: {
    width: 280,
    height: 280,
  },
  partRewardName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  partRewardSubtext: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 8,
  },
});

