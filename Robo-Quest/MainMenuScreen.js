import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Image, Text, Animated, Dimensions, ImageBackground } from 'react-native'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db, doc, getDoc, onAuthStateChanged } from './database/firebase';

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

// Icons and Parts
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

const ASSETS = {
    parts: {
        ChassisCreativia: require('./assets/parts/chassis/ChassisCreativia.png'),
        ChassisGeneralis: require('./assets/parts/chassis/ChassisGeneralis.png'),
        ChassisInnovare: require('./assets/parts/chassis/ChassisInnovare.png'),
        EngineCreativia: require('./assets/parts/engines/EngineCreativia.png'),
        EngineGeneralis: require('./assets/parts/engines/EngineGeneralis.png'),
        EngineInnovare: require('./assets/parts/engines/EngineInnovare.png'),
        WeaponCreativia: require('./assets/parts/weapons/WeaponCreativia.png'),
        WeaponGeneralis: require('./assets/parts/weapons/WeaponGeneralis.png'),
        WeaponInnovare: require('./assets/parts/weapons/WeaponInnovare.png'),
        WheelsCreativia: require('./assets/parts/wheels/WheelsCreativia.png'),
        WheelsGeneralis: require('./assets/parts/wheels/WheelsGeneralis.png'),
        WheelsInnovare: require('./assets/parts/wheels/WheelsInnovare.png'),
    }
};

const DEFAULT_LOADOUT = {
    Chassis: 'ChassisGeneralis',
    Engines: 'EngineGeneralis',
    Wheels: 'WheelsGeneralis',
    Weapon: 'WeaponGeneralis'
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

// Robot Preview Component
const RobotPreview = ({ loadout }) => {
    const getWeaponOffset = () => {
        const weapon = loadout.Weapon;
        const chassis = loadout.Chassis;

        if (!chassis || !weapon) return 0;

        if (chassis === "ChassisInnovare") {
            if (weapon === "WeaponCreativia") return 13;
            if (weapon === "WeaponGeneralis") return 8;
            if (weapon === "WeaponInnovare") return 0;
        }

        if (chassis === "ChassisGeneralis") {
            if (weapon === "WeaponCreativia") return 6;
            if (weapon === "WeaponGeneralis") return 0;
            if (weapon === "WeaponInnovare") return -6;
        }
    
        if (chassis === "ChassisCreativia") {
            if (weapon === "WeaponCreativia") return 0;
            if (weapon === "WeaponGeneralis") return -5;
            if (weapon === "WeaponInnovare") return -11;
        }

        return 0;
    };

    const equippedWeapon = loadout.Weapon;
    const equippedChassis = loadout.Chassis;
    const equippedEngine = loadout.Engines;
    const equippedWheels = loadout.Wheels;

    return (
        <View style={styles.robotPreviewContainer}>
            <View style={styles.robotStage}>
                {/* Wheels */}
                {equippedWheels && (
                    <Image 
                        source={ASSETS.parts[equippedWheels]} 
                        style={[styles.robotLayer, { zIndex: 10 }]} 
                        resizeMode="contain" 
                    />
                )}

                {/* Chassis */}
                {equippedChassis && (
                    <Image 
                        source={ASSETS.parts[equippedChassis]} 
                        style={[styles.robotLayer, { zIndex: 10 }]} 
                        resizeMode="contain" 
                    />
                )}

                {/* Engine */}
                {equippedEngine && (
                    <Image 
                        source={ASSETS.parts[equippedEngine]} 
                        style={[styles.robotLayer, { zIndex: 20 }]} 
                        resizeMode="contain" 
                    />
                )}
                
                {/* Weapon */}
                {equippedWeapon && (
                    <Image 
                        source={ASSETS.parts[equippedWeapon]} 
                        style={[
                            styles.weaponImage,
                            { 
                                zIndex: 40,
                                top: getWeaponOffset()
                            } 
                        ]}
                        resizeMode="contain"
                    />
                )}
            </View>
        </View>
    );
};

// Top Icon Button Component
const TopIconButton = ({ iconSource, onPress, isQuest = false, isActive = false, refProp = null }) => {
    return (
        <TouchableOpacity 
            style={[
                styles.topIconButton,
                isActive && styles.topIconButtonActive
            ]} 
            onPress={onPress}
            ref={refProp}
            activeOpacity={0.7}
        >
            <Image 
                source={iconSource} 
                style={[
                    styles.topIconImage,
                    isQuest && isActive && { tintColor: LIGHT_BLUE }
                ]} 
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
};

function MainMenuScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [showQuestList, setShowQuestList] = useState(false);
    const [currentLoadout, setCurrentLoadout] = useState(DEFAULT_LOADOUT);
    const [currentUser, setCurrentUser] = useState(null);
    const slideAnim = useRef(new Animated.Value(0)).current; 
    const questIconRef = useRef(null);
    const [questIconLayout, setQuestIconLayout] = useState(null);

    // Load current loadout from Firebase
    const loadCurrentLoadout = async (user) => {
        try {
            const userName = user.displayName || user.email;
            const presetsRef = doc(db, 'Roboquest-Loadout', userName);
            const presetsSnap = await getDoc(presetsRef);
            
            if (presetsSnap.exists()) {
                const data = presetsSnap.data();
                if (data.presets && data.presets.Default) {
                    setCurrentLoadout(data.presets.Default);
                }
            }
        } catch (error) {
            console.log("Error loading loadout for main menu:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadCurrentLoadout(user);
            }
        });

        return () => unsubscribe();
    }, []);

    // Reload loadout when screen is focused
    useEffect(() => {
        if (isFocused && currentUser) {
            loadCurrentLoadout(currentUser);
        }
    }, [isFocused, currentUser]);

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
                
                {/* Top Navigation Bar - Fixed Positioning */}
                <View style={styles.topNavBar}>
                    <View style={styles.topNavLeft}>
                        <TopIconButton 
                            iconSource={ICONS.quest}
                            onPress={toggleQuestList}
                            isQuest={true}
                            isActive={showQuestList}
                            refProp={questIconRef}
                        />
                    </View>
                    
                    <View style={styles.topNavRight}>
                        <TopIconButton 
                            iconSource={ICONS.shop}
                            onPress={() => navigation.navigate('Shop')}
                        />
                        <TopIconButton 
                            iconSource={ICONS.settings}
                            onPress={() => navigation.navigate('Settings')}
                        />
                    </View>
                </View>
                
                {/* Robot Preview in Center */}
                <View style={styles.centerContent}>
                    <RobotPreview loadout={currentLoadout} />
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
        justifyContent: 'space-between',
        paddingVertical: 30,
    },
    
    // TOP NAVIGATION BAR - Clean Layout
    topNavBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slight background for contrast
        width: '100%',
    },
    topNavLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    topNavRight: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 20,
    },
    topIconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    topIconButtonActive: {
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        borderColor: LIGHT_BLUE,
    },
    topIconImage: {
        width: 24,
        height: 24,
        tintColor: LIGHT_BLUE,
    },
    
    // REMOVED OLD FLOATING ICONS STYLES
    floatingIconsLayer: {
        display: 'none',
    },
    topLeftIcons: {
        display: 'none',
    },
    floatingIcon: {
        display: 'none',
    },
    
    // Center Content for Robot
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30, // Pull robot up slightly
    },
    
    // Robot Preview Styles
    robotPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -30,
    },
    robotPreviewTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: LIGHT_BLUE,
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
    },
    robotStage: {
        width: 540, 
        height: 500,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    robotLayer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    weaponImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    
    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', 
        width: screenWidth * 1,
        alignSelf: 'center',
        marginBottom: 1,
    },
    bottomActionButtonsContainer: { 
        flexDirection: 'row',
        justifyContent: 'space-around', 
        width: screenWidth * 1.2,
        alignSelf: 'center',
        marginBottom: 105, 
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
        marginBottom: 1,
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