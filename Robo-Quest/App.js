// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LogBox } from 'react-native';
import BackgroundMusicManager from './services/BackgroundMusicManager';
import { AudioProvider } from './contexts/AudioContext';

// Import all screen components
import LoadingScreen from './LoadingScreen';
import TitleScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import MainMenuScreen from './MainMenuScreen';
import SettingsScreen from './SettingsScreen'; 
import CollectionScreen from './CollectionScreen';
import JournalScreen from './JournalScreen';
import BattleScreen from './BattleScreen';
import CameraScreen from './CameraScreen';
import LoadoutScreen from './LoadoutScreen';
import ResultScreen from './ResultScreen';
import AnalyzeScreen from './AnalyzeScreen';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);
// 🛠️ DEV MODE TOGGLE - Set to false for production
const DEV_MODE = false; // Change to true to enable dev screen selector
// Only import DevScreen if file exists (won't crash in production)
let DevScreen;
if (DEV_MODE) {
  try {
    DevScreen = require('./DevScreen').default;
  } catch (e) {
    console.log('DevScreen not found - continuing normally');
  }
}
import ShopScreen from './ShopScreen';
const Stack = createNativeStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('');
  const [previousScreen, setPreviousScreen] = useState('');

  // Initialize background music when app starts (after loading screen)
  useEffect(() => {
    // Only initialize and play music after loading is complete
    if (!isLoading) {
      BackgroundMusicManager.initializeMusic().then(() => {
        BackgroundMusicManager.playMusic();
      });
    }
    
    // Cleanup on unmount
    return () => {
      BackgroundMusicManager.unloadMusic();
    };
  }, [isLoading]);

  // Handle loading finish
  const handleLoadingFinish = () => {
    setIsLoading(false);
  };

  // 🛠️ If in dev mode and DevScreen exists, show it
  if (DEV_MODE && DevScreen) {
    return <DevScreen />;
  }

  // Show loading screen while assets are loading
  if (isLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} />;
  }

  return (
    <AudioProvider>
      <NavigationContainer
        onStateChange={(state) => {
          // Get current route name
          const route = state?.routes[state.index];
          const routeName = route?.name;
          
          if (routeName) {
            // Check if we're exiting Battle screen
            if (previousScreen === 'Battle' && routeName !== 'Battle') {
              // Restart music from the beginning when exiting Battle
              BackgroundMusicManager.restartMusic();
            } else if (routeName === 'Battle' || routeName === 'LoginScreen' || routeName === 'TitleScreen') {
              // Pause music on Battle screen and Login/Title screen
              BackgroundMusicManager.pauseMusic();
            } else {
              // Play music on all other screens
              BackgroundMusicManager.playMusic();
            }
            
            setPreviousScreen(currentScreen);
            setCurrentScreen(routeName);
          }
        }}
      >
      <Stack.Navigator initialRouteName="LoginScreen">
        
        {/* Title Screen - First screen after loading */}
        <Stack.Screen 
          name="LoginScreen" 
          component={TitleScreen} 
          options={{ headerShown: false }} 
        />

        {/* Signup Screen Modal */}
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* The main screen showing all the custom buttons. No header is needed here. */}
        <Stack.Screen 
          name="Home" 
          component={MainMenuScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* All destination screens. These will automatically have a header and back button (as seen in your Settings image) */}
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade'
          }} 
        />
        <Stack.Screen name="Collection" component={CollectionScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="Battle" component={BattleScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Loadout" component={LoadoutScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Analyze" component={AnalyzeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TitleScreen" component={TitleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Shop" component={ShopScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </AudioProvider>
  );
}

export default App;