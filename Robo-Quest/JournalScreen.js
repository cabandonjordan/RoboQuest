import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

function JournalScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([]);

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

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} resizeMode="cover" />
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
});

export default JournalScreen;