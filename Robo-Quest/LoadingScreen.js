import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Asset } from 'expo-asset';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen({ onFinish }) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressAnim = new Animated.Value(0);
  const robotAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate robot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(robotAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(robotAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      // List all your assets to preload
      const imageAssets = [
        // Loading screen assets
        require('./assets/loadingscreen/New_Clouds.png'),
        require('./assets/loadingscreen/ROBOQUEST.png'),
        require('./assets/loadingscreen/SplashRobot.png'),
        
        // Icon assets
        require('./assets/icons/battle.png'),
        require('./assets/icons/camera.png'),
        require('./assets/icons/collection.png'),
        require('./assets/icons/journal.png'),
        require('./assets/icons/loadout.png'),
        require('./assets/icons/settings.png'),
        
        // Battle assets
        require('./assets/battle/enemy.png'),
        require('./assets/battle/player.png'),
      ];

      const totalAssets = imageAssets.length;
      let loadedAssets = 0;

      // Cache images one by one to track progress
      for (const image of imageAssets) {
        await Asset.fromModule(image).downloadAsync();
        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        setLoadingProgress(Math.round(progress));

        // Animate progress bar
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }

      // Optional: Add a small delay before transitioning
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call the onFinish callback to transition to main app
      if (onFinish) {
        onFinish();
      }
    } catch (error) {
      console.warn('Error loading assets:', error);
      // Even if there's an error, proceed to the app
      if (onFinish) {
        onFinish();
      }
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <Image 
        source={require('./assets/loadingscreen/New_Clouds.png')} 
        style={styles.background}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require('./assets/loadingscreen/ROBOQUEST.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* Animated Robot */}
        <Animated.View 
          style={[
            styles.robotContainer,
            {
              transform: [{ translateY: robotAnim }],
            },
          ]}
        >
          <Image 
            source={require('./assets/loadingscreen/SplashRobot.png')} 
            style={styles.robot}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Loading Text */}
        <Text style={styles.loadingText}>LOADING...</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { width: progressWidth },
              ]}
            />
          </View>
        </View>
        
        {/* Percentage */}
        <Text style={styles.percentageText}>{loadingProgress}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: width * 0.8,
    height: 100,
    marginBottom: 30,
  },
  robotContainer: {
    marginBottom: 60,
  },
  robot: {
    width: 200,
    height: 250,
  },
  loadingText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  progressBarContainer: {
    width: width * 0.7,
    marginBottom: 15,
  },
  progressBarBackground: {
    width: '100%',
    height: 26,
    backgroundColor: '#000000',
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFAE00',
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
});
