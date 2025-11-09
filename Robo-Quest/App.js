// App.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import all screen components
import LoadingScreen from './LoadingScreen';
import TitleScreen from './LoginScreen';
import MainMenuScreen from './MainMenuScreen';
import SettingsScreen from './SettingsScreen'; 
import CollectionScreen from './CollectionScreen';
import JournalScreen from './JournalScreen';
import BattleScreen from './BattleScreen';
import CameraScreen from './CameraScreen';
import LoadoutScreen from './LoadoutScreen';
import ResultScreen from './ResultScreen';
import AnalyzeScreen from './AnalyzeScreen';

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

  // 🛠️ If in dev mode and DevScreen exists, show it
  if (DEV_MODE && DevScreen) {
    return <DevScreen />;
  }

  // Show loading screen while assets are loading
  if (isLoading) {
    return <LoadingScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        
        {/* Title Screen - First screen after loading */}
        <Stack.Screen 
          name="LoginScreen" 
          component={TitleScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* The main screen showing all the custom buttons. No header is needed here. */}
        <Stack.Screen 
          name="Home" 
          component={MainMenuScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* All destination screens. These will automatically have a header and back button (as seen in your Settings image) */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
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
  );
}

export default App;