import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    return () => {
      setPhoto(null);
    };
  }, []);

  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionMessage}>
          Allow camera access to capture or upload photos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      setPhoto(capturedPhoto);
    } catch (error) {
      console.error(error);
      Alert.alert('Capture Failed', 'Unable to take a photo right now.');
    }
  };

  const pickImage = async () => {
    if (!mediaPermission?.granted) {
      const permissionResult = await requestMediaPermission();
      if (!permissionResult?.granted) {
        Alert.alert('Permission Needed', 'We need access to your photo library.');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'Unable to open your photo library.');
    }
  };

  const retakePicture = () => {
    setPhoto(null);
  };

  const confirmPhoto = () => {
    Alert.alert('Photo Ready', 'Navigate to your results screen here.');
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const clampZoom = (value) => {
    return Math.min(Math.max(value, 0), 1);
  };

  const adjustZoom = (delta) => {
    setZoom((prev) => {
      const next = clampZoom(prev + delta);
      return Number(next.toFixed(3));
    });
  };

  const handleZoomSlider = (value) => {
    setZoom(clampZoom(value));
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.cameraPreview} resizeMode="cover" />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.cameraPreview}
            facing={facing}
            zoom={zoom}
            enableZoomGesture
          />
        )}
      </View>

      {photo ? (
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={retakePicture}>
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={confirmPhoto}>
            <Text style={styles.primaryButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={() => adjustZoom(-0.1)}>
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.zoomSliderWrapper}>
              <Slider
                style={styles.zoomSlider}
                value={zoom}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FFFFFF"
                onValueChange={handleZoomSlider}
              />
              <Text style={styles.zoomLabel}>{`${Math.round(zoom * 100)}%`}</Text>
            </View>
            <TouchableOpacity style={styles.zoomButton} onPress={() => adjustZoom(0.1)}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  zoomButton: {
    padding: 8,
  },
  zoomSliderWrapper: {
    flex: 1,
    marginHorizontal: 16,
  },
  zoomSlider: {
    width: '100%',
  },
  zoomLabel: {
    marginTop: 4,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  iconButton: {
    padding: 12,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#4C8BFF',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    color: '#BFBFBF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4C8BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;