import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color constants (white theme - matching AnalyzeScreen)
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

function JournalScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const speechRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
    }, [])
  );

  const loadPhotos = async () => {
    try {
      const photosJson = await AsyncStorage.getItem('journalPhotos');
      if (photosJson) {
        const parsedPhotos = JSON.parse(photosJson);
        setPhotos(parsedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const deletePhoto = async (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPhotos = photos.filter((photo) => photo.id !== photoId);
              await AsyncStorage.setItem('journalPhotos', JSON.stringify(updatedPhotos));
              setPhotos(updatedPhotos);
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePhotoPress = (item) => {
    // Only show modal if analysis data exists
    if (item.selectedObject || item.funFact || item.the_science_in_action) {
      setSelectedPhoto(item);
      setShowResultModal(true);
      setCurrentPage(0);
    }
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
    if (showResultModal && currentPage === 0 && selectedPhoto?.funFact && !isMuted) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        speakText(selectedPhoto.funFact);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResultModal, currentPage, selectedPhoto?.funFact, isMuted]);

  // Auto-play science in action when science page is shown
  useEffect(() => {
    if (showResultModal && currentPage === 1 && selectedPhoto?.the_science_in_action && !isMuted) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        speakText(selectedPhoto.the_science_in_action);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResultModal, currentPage, selectedPhoto?.the_science_in_action, isMuted]);

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
      if (currentPage === 0 && selectedPhoto?.funFact) {
        speakText(selectedPhoto.funFact);
      } else if (currentPage === 1 && selectedPhoto?.the_science_in_action) {
        speakText(selectedPhoto.the_science_in_action);
      }
    }
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoCard}>
      <TouchableOpacity 
        onPress={() => handlePhotoPress(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} resizeMode="cover" />
        {item.selectedObject && (
          <View style={styles.objectBadge}>
            <Ionicons name="cube" size={14} color={colors.primary} />
            <Text style={styles.objectBadgeText} numberOfLines={1}>
              {item.selectedObject}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.photoInfo}>
        <Text style={styles.photoDate}>{formatDate(item.timestamp)}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePhoto(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/*<Text style={styles.title}>Photo Journal</Text>*/}
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>Take or upload photos from the Camera screen</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* Result Modal - Similar to AnalyzeScreen */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>
                  {selectedPhoto?.selectedObject || 'Analysis'}
                </Text>
                {selectedPhoto?.category && (
                  <View style={[styles.categoryBadge, styles[`category${selectedPhoto.category}`]]}>
                    <Text style={styles.categoryText}>{selectedPhoto.category}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  // Stop any ongoing speech when closing modal
                  if (speechRef.current) {
                    Speech.stop();
                    speechRef.current = null;
                  }
                  setShowResultModal(false);
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
                        {selectedPhoto?.funFact || 'No fun fact available.'}
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
                        {selectedPhoto?.the_science_in_action || 'No science information available.'}
                      </Text>
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Page Indicators */}
            <View style={styles.pageIndicators}>
              <View style={[styles.pageIndicator, currentPage === 0 && styles.pageIndicatorActive]} />
              <View style={[styles.pageIndicator, currentPage === 1 && styles.pageIndicatorActive]} />
            </View>

            {/* Navigation Hints */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {currentPage === 0 ? 'Swipe right for Science →' : '← Swipe left for Fun Fact'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 16,
    color: '#000',
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  photoCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  objectBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  objectBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal styles (matching AnalyzeScreen)
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
});

export default JournalScreen;