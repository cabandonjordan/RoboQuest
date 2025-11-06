import React from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Image, Text } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';

const ICONS = {
    collection: require('./assets/icons/collection.png'), 
    settings: require('./assets/icons/settings.png'),
    
    loadout: require('./assets/icons/loadout.png'),
    camera: require('./assets/icons/camera.png'),
    journal: require('./assets/icons/journal.png'),
    battle: require('./assets/icons/battle.png'),
};

const CustomCircleButton = ({ iconKey, onPress, size = 60, iconSize = 30, color = '#7C8808' }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[
        styles.circleButton, 
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color }
    ]}
  >
    <Image 
        source={ICONS[iconKey]} 
        style={{ width: iconSize, height: iconSize, tintColor: 'white' }} 
    />
  </TouchableOpacity>
);

function MainMenuScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <TouchableOpacity 
        style={styles.settingsIcon} 
        onPress={() => navigation.navigate('Settings')}
      >
        <Image 
            source={ICONS.settings} 
            style={{ width: 30, height: 30, tintColor: '#7C8808' }} 
        />
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        
        <View style={styles.row}>
          <CustomCircleButton 
            iconKey="collection" 
            onPress={() => navigation.navigate('Collection')} 
            size={50} 
            iconSize={25}
          /> 
          <View style={{ width: 120 }} /> 
          <CustomCircleButton 
            iconKey="loadout" 
            onPress={() => navigation.navigate('Loadout')} 
            size={50} 
            iconSize={25}
          />
        </View>

        <View style={styles.row}>
          <CustomCircleButton 
            iconKey="battle" 
            onPress={() => navigation.navigate('Battle')} 
            size={50} 
            iconSize={25}
          /> 
          <CustomCircleButton 
            iconKey="camera" 
            onPress={() => navigation.navigate('Camera')} 
            size={70} 
            iconSize={35}
            color="#A9A9A9" 
          />
          <CustomCircleButton 
            iconKey="journal" 
            onPress={() => navigation.navigate('Journal')} 
            size={50} 
            iconSize={25}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingsIcon: {
    position: 'absolute',
    top: 50, 
    right: 20,
    zIndex: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingBottom: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%', 
    marginVertical: 10,
  },
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MainMenuScreen;