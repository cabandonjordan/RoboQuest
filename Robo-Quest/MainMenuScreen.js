import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Image, Text, Animated, Dimensions, ImageBackground } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';

// Color Used in Hex and Rgba formats
const Indent_Color = '#06DFDE';
const LIGHT_BLUE = '#00FFFF'; 
const Transparent_BG = 'rgba(0, 0, 0, 0)'; 
const DARK_ACCENT_GREY = '#333333'; 
const LIGHT_GREY = '#aaa9ad81';  
const ACCENT_GREY = '#5B676D'; 
const PANEL_DARK_BG = '#2A3439'; 
const CIRCLE_BG_COLOR = 'rgba(255, 255, 255, 0.2)'; 
const ICON_SIZE = 30; 
const CONTAINER_SIZE = 45; 
const screenWidth = Dimensions.get('window').width;
const QUEST_LIST_WIDTH = screenWidth * 0.90; 
const QUEST_LIST_OFFSET = (screenWidth / 2) - (QUEST_LIST_WIDTH / 2); 

// Icons 
const ICONS = {
    settings: require('./assets/icons/settings.png'),
    shop: require('./assets/icons/shop.png'),
    quest: require('./assets/icons/quest.png'), 
    camera: require('./assets/icons/camera.png'), 
    battle: require('./assets/icons/battle.png'), 
    loadout: require('./assets/icons/loadout.png'), 
    collection: require('./assets/icons/collection.png'),
    journal: require('./assets/icons/journal.png'),       
    main_menubg: require('./assets/background/MainMenubg.png'), 
};

const baseIconStyle = {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: CONTAINER_SIZE / 2,
    backgroundColor: CIRCLE_BG_COLOR, 
    justifyContent: 'center',
    alignItems: 'center',
};

const ActionPanelButton = ({ iconSource, label, onPress }) => {
    return (
        <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onPress}
        >
            <Image 
                source={iconSource}
                style={styles.actionIcon}
                resizeMode="contain"
            />
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

const CameraScreenButton = ({ navigation }) => {
    return (
        <View style={styles.cameraButtonOuterContainer}>
            <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={() => {
                    navigation.navigate('Camera');
                }}
            >
                <View style={styles.cameraAccentTopRight} />
                <View style={styles.cameraAccentBottomLeft} />
                {/* NEW ACCENTS */}
                <View style={styles.cameraAccentTopLeft} />
                <View style={styles.cameraAccentBottomRight} />
                
                <Image 
                    source={ICONS.camera}
                    style={styles.cameraIcon}
                    resizeMode="contain"
                />
                <Text style={styles.cameraLabel}>CAMERA MODE</Text>
            </TouchableOpacity>
        </View>
    );
};

const QuestList = ({ show, slideAnim, questIconLayout }) => {
    if (!show || !questIconLayout) return null; 

    const topPosition = questIconLayout.y + questIconLayout.height + 5; 
    
    const animatedStyle = {
        transform: [{
            translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-QUEST_LIST_WIDTH, QUEST_LIST_OFFSET - 20], 
            }),
        }],
        top: topPosition,
        left: 0, 
    };

    const QUESTS = ["• Collect 5 Energy Cells", "• Defeat Boss Unit 3", "• Visit the Workshop"];

    return (
        <Animated.View style={[questListStyles.container, animatedStyle, { width: QUEST_LIST_WIDTH }]}>
            {QUESTS.map((quest, index) => (
                <View key={index} style={questListStyles.item}>
                    <Text style={questListStyles.text}>{quest}</Text> 
                </View>
            ))}
        </Animated.View>
    );
};

function MainMenuScreen() {
    const navigation = useNavigation();
    const [showQuestList, setShowQuestList] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current; 
    const questIconRef = useRef(null);
    const [questIconLayout, setQuestIconLayout] = useState(null);

    const captureQuestIconLayout = () => {
        questIconRef.current?.measure((fx, fy, width, height, px, py) => {
            setQuestIconLayout({ x: px, y: py, width, height });
        });
    };

    useEffect(() => {
        const timeout = setTimeout(captureQuestIconLayout, 200);
        return () => clearTimeout(timeout);
    }, []);

    const toggleQuestList = () => {
        if (!questIconLayout) {
            captureQuestIconLayout();
        }
        
        setShowQuestList(prev => {
            const nextState = !prev;
            Animated.timing(slideAnim, {
                toValue: nextState ? 1 : 0,
                duration: 300, 
                useNativeDriver: true,
            }).start();
            return nextState;
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <QuestList 
                show={showQuestList} 
                slideAnim={slideAnim} 
                questIconLayout={questIconLayout}
            />

            <ImageBackground 
                source={ICONS.main_menubg}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.floatingIconsLayer}>
                    
                    <TouchableOpacity 
                        style={baseIconStyle} 
                        onPress={toggleQuestList} 
                        activeOpacity={0.7} 
                        ref={questIconRef} 
                        onLayout={captureQuestIconLayout} 
                    >
                        <Image 
                            source={ICONS.quest} 
                            style={[styles.floatingIcon, { tintColor: showQuestList ? LIGHT_BLUE : DARK_ACCENT_GREY }]} 
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <View style={styles.topRightIcons}>
                        <TouchableOpacity 
                            style={baseIconStyle} 
                            onPress={() => navigation.navigate('Shop')}
                        >
                            <Image 
                                source={ICONS.shop} 
                                style={styles.floatingIcon} 
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={baseIconStyle} 
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
                
                <View style={styles.actionButtonsContainer}>
                    <ActionPanelButton 
                        iconSource={ICONS.battle} 
                        label="BATTLE MODE" 
                        onPress={() => navigation.navigate('Battle')} 
                    />
                    <ActionPanelButton 
                        iconSource={ICONS.loadout} 
                        label="WORKSHOP LOADOUT" 
                        onPress={() => navigation.navigate('Loadout')} 
                    />
                </View>
                <CameraScreenButton navigation={navigation} />
                <View style={styles.bottomActionButtonsContainer}>
                    <ActionPanelButton 
                        iconSource={ICONS.collection} 
                        label="PARTS COLLECTION" 
                        onPress={() => navigation.navigate('Collection')} 
                    />
                    <ActionPanelButton 
                        iconSource={ICONS.journal} 
                        label="JOURNAL LOG" 
                        onPress={() => navigation.navigate('Journal')} 
                    />
                </View>

            </ImageBackground>
        </SafeAreaView>
    );
}
const questListStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: PANEL_DARK_BG,
        borderRadius: 8,
        padding: 10,
        zIndex: 50, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    item: {
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: ACCENT_GREY,
    },
    text: {
        color: LIGHT_GREY,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
    },
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: LIGHT_GREY,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end', 
    },
    
    floatingIconsLayer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        position: 'absolute', 
        top: 0,
        paddingTop: 20, 
        width: '100%',
        zIndex: 10,
    },
    topLeftIcons: {
        width: 0, 
    },
    topRightIcons: {
        flexDirection: 'row',
        gap: 15,
    },
    floatingIcon: {
        width: ICON_SIZE, 
        height: ICON_SIZE,
        tintColor: DARK_ACCENT_GREY, 
    },
    
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', 
        width: screenWidth * 1,
        alignSelf: 'center',
    },
    bottomActionButtonsContainer: { 
        flexDirection: 'row',
        justifyContent: 'space-around', 
        width: screenWidth * 1.2,
        alignSelf: 'center',
        marginBottom: 95, 
    },
    actionButton: {
        width: screenWidth * 0.3, 
        height: 60, 
        borderRadius: 15, 
        backgroundColor: Transparent_BG, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        width: 30, 
        height: 30,
        tintColor: LIGHT_BLUE, 
        marginBottom: 3, 
    },
    actionLabel: {
        fontSize: 8, 
        fontWeight: 'bold',
        color: LIGHT_BLUE, 
    },
    
    // Camera Button Styles
    cameraButtonOuterContainer: {
        alignItems: 'center',
    },
    cameraButton: {
        width: screenWidth * 0.4,
        height: 50,        
        backgroundColor: Transparent_BG, 
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', 
        overflow: 'hidden', 
    },
    cameraIcon: {
        width: 35,  
        height: 35, 
        tintColor: LIGHT_BLUE, 
        marginBottom: 2, 
        zIndex: 10, 
    },
    cameraLabel: {
        fontSize: 8, 
        fontWeight: 'bold',
        color: LIGHT_BLUE, 
        zIndex: 10, 
    },
    
// Camera Accents (Line Borders)
    cameraAccentTopRight: {
        position: 'absolute',
        bottom: 0, 
        left: 0, 
        width: 20, 
        height: 20, 
        backgroundColor: Transparent_BG, 
        borderBottomWidth: 3, 
        borderLeftWidth: 3,   
        borderColor: Indent_Color, 
        zIndex: 1, 
    },
    cameraAccentBottomLeft: {
        position: 'absolute',
        top: 0,
        right: 0, 
        width: 20, 
        height: 20, 
        backgroundColor: Transparent_BG, 
        borderTopWidth: 3,  
        borderRightWidth: 3, 
        borderColor: Indent_Color, 
        zIndex: 1, 
    },
    cameraAccentTopLeft: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        backgroundColor: Transparent_BG,
        borderBottomWidth: 3,
        borderRightWidth: 3, 
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentBottomRight: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 20,
        height: 20,
        backgroundColor: Transparent_BG,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderColor: Indent_Color,
        zIndex: 1,
    },
});

export default MainMenuScreen;