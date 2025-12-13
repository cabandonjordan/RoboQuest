import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { Asset } from 'expo-asset';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen({ onFinish }) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade in the UI
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Start Infinite Rotation for the Cogwheel
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000, // 3 seconds per full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Start Subtle Pulsing for the Cogwheel
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const imageAssets = [
        // Background
        require('./assets/background/NewLoadingBg.png'),
        
        // Use the settings icon as our "Cogwheel"
        require('./assets/icons/settings.png'),
        
        // Other Essential Icons
        require('./assets/icons/battle.png'),
        require('./assets/icons/camera.png'),
        require('./assets/icons/collection.png'),
        require('./assets/icons/journal.png'),
        require('./assets/icons/loadout.png'),
        
        // Battle assets
        require('./assets/battle/enemy.png'),
        require('./assets/battle/player.png'),
      ];
      
      const totalAssets = imageAssets.length;
      let loadedAssets = 0;

      for (const image of imageAssets) {
        await Asset.fromModule(image).downloadAsync();
        
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        
        setLoadingProgress(Math.round(progress));
        
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 150, 
          useNativeDriver: false,
        }).start();
        
        // Artificial delay to maintain original screen time
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      if (onFinish) {
        onFinish();
      }
    } catch (error) {
      console.warn('Error loading assets:', error);
      if (onFinish) {
        onFinish();
      }
    }
  };

  // Interpolations
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background */}
      <Image 
        source={require('./assets/background/NewLoadingBg.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Dark Overlay for "Badass" Contrast */}
      <View style={styles.overlay} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Central Rotating Gear */}
        <View style={styles.gearContainer}>
          <Animated.Image 
            source={require('./assets/loadingscreen/LoadingCircle.png')}
            style={[
              styles.gear,
              {
                transform: [
                  { rotate: spin },
                  { scale: pulseAnim }
                ]
              }
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Tech-Style Loading Bar & Text */}
        <View style={styles.bottomContainer}>
          <Text style={styles.statusText}>INITIALIZING SYSTEMS...</Text>
          
          <View style={styles.track}>
            <Animated.View 
              style={[
                styles.fill,
                { width: progressWidth }
              ]}
            />
          </View>
          
          <Text style={styles.percentage}>{loadingProgress}%</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    // Darker overlay for a sleeker, "badass" look
    backgroundColor: 'rgba(0, 0, 0, 0.45)', 
  },
  content: {
    flex: 1,
    padding: 20,
    zIndex: 10,
  },
  gearContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    // Increased margin to push gear lower
    marginTop: 100, 
  },
  gear: {
    width: 170, // Made smaller (was 200)
    height: 170,
    tintColor: '#00FFFF', 
    shadowColor: "#00FFFF", 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  bottomContainer: {
    height: 150, 
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // Increased padding to push the loading bar higher up
    paddingBottom: 80, 
  },
  statusText: {
    color: '#00FFF', // Signature orange
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 15,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 174, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  track: {
    width: '85%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    backgroundColor: '#00FFFF',
    borderRadius: 3,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], 
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});