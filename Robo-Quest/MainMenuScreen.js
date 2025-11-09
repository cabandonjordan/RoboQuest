import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Image, Text, Animated, Dimensions, ImageBackground } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';

const ACCENT_GREY = '#5B676D'; 
const LIGHT_GREY = '#AAA9AD';  
const DARK_GREY_TEXT = '#1F262A'; 
const ICON_TINT_GREY = '#848689'; 
const PANEL_DARK_BG = '#2A3439'; 

const ICONS = {
    settings: require('./assets/icons/settings.png'),
    main_robot: require('./assets/icons/robot.png'),
    quest: require('./assets/icons/quest.png'), 
    shop: require('./assets/icons/shop.png'),
    battle: require('./assets/icons/battle.png'),
    loadout: require('./assets/icons/loadout.png'),
    camera: require('./assets/icons/camera.png'),
    collection: require('./assets/icons/collection.png'), 
    journal: require('./assets/icons/journal.png'), 
};

const RobotDisplay = ({ navigation, presetLabel }) => (
    <View style={styles.robotDisplayContainer}>
        <Image
            source={ICONS.main_robot}
            style={styles.robotImage}
            resizeMode="contain"
        />
        <View style={styles.presetControls}>
            <TouchableOpacity>
                <Text style={styles.arrowIcon}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.presetLabelContainer}>
                <Text style={styles.presetLabel}>{presetLabel}</Text>
            </View>
            <TouchableOpacity>
                <Text style={styles.arrowIcon}>{'>'}</Text> 
            </TouchableOpacity>
        </View>
    </View>
);

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height; 
const FLOATING_ICON_TOP_PADDING = 10; 

function MainMenuScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.floatingIconsLayer}>
        <TouchableOpacity 
          style={styles.questIconContainer}
          onPress={() => {}} 
          activeOpacity={1} 
        >
          <Image 
              source={ICONS.quest} 
              style={styles.floatingIcon} 
              resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.topRightIcons}>
            <TouchableOpacity 
                style={styles.shopIconContainer} 
                onPress={() => navigation.navigate('Shop')}
            >
                <Image 
                    source={ICONS.shop} 
                    style={styles.floatingIcon} 
                    resizeMode="contain"
                />
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.settingsIconContainer} 
                onPress={() => navigation.navigate('Settings')}
            >
                <Image 
                    source={ICONS.settings} 
                    style={styles.floatingIcon} 
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.contentContainer}> 
        <RobotDisplay navigation={navigation} presetLabel="Preset 1" />

        <View style={styles.bottomPanel}>
            <View style={styles.systemInfoRow}>
                <Text style={styles.systemActiveText}>• SYSTEM ACTIVE</Text>
            </View>
            
            <View style={styles.bottomButtonsGrid}>
                
                <View style={styles.buttonRow2}>
                    <TouchableOpacity style={styles.buttonRow2Item} onPress={() => navigation.navigate('Battle')}>
                        <Image source={ICONS.battle} style={styles.bottomButtonIcon} resizeMode="contain" />
                        <Text style={styles.bottomButtonText}>BATTLE MODE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow2Item} onPress={() => navigation.navigate('Loadout')}>
                        <Image source={ICONS.loadout} style={styles.bottomButtonIcon} resizeMode="contain" />
                        <Text style={styles.bottomButtonText}>WORKSHOP LOADOUT</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonRow3}>
                    <TouchableOpacity style={styles.buttonRow3Item} onPress={() => navigation.navigate('Collection')}>
                        <Image source={ICONS.collection} style={styles.bottomButtonIcon} resizeMode="contain" />
                        <Text style={styles.bottomButtonText}>COLLECTION</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow3Item} onPress={() => navigation.navigate('Camera')}>
                        <Image source={ICONS.camera} style={styles.bottomButtonIcon} resizeMode="contain" />
                        <Text style={styles.bottomButtonText}>CAMERA MODE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow3Item} onPress={() => navigation.navigate('Journal')}>
                        <Image source={ICONS.journal} style={styles.bottomButtonIcon} resizeMode="contain" />
                        <Text style={styles.bottomButtonText}>JOURNAL</Text>
                    </TouchableOpacity>
                </View>

            </View>

            <Text style={styles.allSystemsText}>• ALL SYSTEMS OPERATIONAL</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_GREY,
  },
  contentContainer: {
      flex: 1,
      paddingTop: 60, 
  },
  floatingIconsLayer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: FLOATING_ICON_TOP_PADDING, 
    height: 60,
    position: 'absolute', 
    width: '100%',
    zIndex: 10,
  },
  floatingIcon: {
    width: 50, 
    height: 50,
    tintColor: ACCENT_GREY, 
  },
  questIconContainer: {
    padding: 5,
    marginTop: 10, 
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10, 
  },
  shopIconContainer: { 
    padding: 5,
  },
  settingsIconContainer: {
    padding: 5,
  },

  
  robotDisplayContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotImage: {
    width: 200, 
    height: 200,
    tintColor: ICON_TINT_GREY,
  },
  presetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 20,
  },
  arrowIcon: {
    fontSize: 24,
    color: ACCENT_GREY,
  },
  presetLabelContainer: {
    backgroundColor: ACCENT_GREY,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  presetLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  //BOTTOM PANEL
  bottomPanel: {
    backgroundColor: PANEL_DARK_BG,
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  systemActiveText: {
    fontSize: 14,
    color: LIGHT_GREY,
  },
  bottomButtonsGrid: {
    marginBottom: 20,
  },
  buttonRow2: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15, 
    gap: 15,
  },
  buttonRow2Item: {
    backgroundColor: ACCENT_GREY,
    width: '45%', 
    aspectRatio: 1.2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  buttonRow3: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10, 
  },
  buttonRow3Item: {
    backgroundColor: ACCENT_GREY,
    width: '30%', 
    aspectRatio: 1.2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  bottomButtonIcon: {
    width: 40,
    height: 40,
    tintColor: 'white',
    marginBottom: 5,
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  allSystemsText: {
    fontSize: 12,
    color: LIGHT_GREY,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default MainMenuScreen;