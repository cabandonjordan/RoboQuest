// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import all screen components
import TitleScreen from './TitleScreen';
import MainMenuScreen from './MainMenuScreen'; // The screen with all the buttons
import SettingsScreen from './SettingsScreen'; 
import CollectionScreen from './CollectionScreen';
import JournalScreen from './JournalScreen';
import BattleScreen from './BattleScreen';
import CameraScreen from './CameraScreen';
import LoadoutScreen from './LoadoutScreen';
import ResultScreen from './ResultScreen';
import AnalyzeScreen from './AnalyzeScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;