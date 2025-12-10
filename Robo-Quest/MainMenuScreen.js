import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView, 
    Image, 
    Text, 
    Animated, 
    Dimensions, 
    ImageBackground,
    Easing,
    StatusBar
} from 'react-native'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db, doc, getDoc, onAuthStateChanged } from './database/firebase';

// Color Used are in Hex and Rgba formats
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
const HEADER_COLOR = '#2A2A2A'; // Gray color for header


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scaleSize = (size) => {
    const scaleFactor = SCREEN_WIDTH / 375; 
    return Math.round(size * scaleFactor);
};

const scaleFont = (size) => {
    const scaleFactor = SCREEN_WIDTH / 375;
    return Math.round(size * scaleFactor);
};

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
    main_menubg: require('./assets/background/MainMenubgOff.png'), 
    main_menubg_on: require('./assets/background/MainMenubg.png'),
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

const SparkAnimation = ({ 
    isActive = false, 
    size = 30, 
    color = LIGHT_BLUE, 
    count = 6, 
    duration = 800,
    style = {},
    position = 'center' // 'center', 'top', 'back', 'left', 'right'
}) => {
    const animValues = useRef([]);
    const scales = useRef([]);
    const rotations = useRef([]);
    const opacities = useRef([]);

    useEffect(() => {
        animValues.current = Array(count).fill(0).map(() => new Animated.Value(0));
        scales.current = Array(count).fill(0).map(() => new Animated.Value(0.5));
        rotations.current = Array(count).fill(0).map(() => new Animated.Value(0));
        opacities.current = Array(count).fill(0).map(() => new Animated.Value(0));
    }, [count]);

    useEffect(() => {
        if (isActive) {
            startAnimation();
        }
    }, [isActive]);

    const startAnimation = () => {
        animValues.current.forEach(anim => anim.setValue(0));
        scales.current.forEach(scale => scale.setValue(0.5));
        rotations.current.forEach(rotation => rotation.setValue(0));
        opacities.current.forEach(opacity => opacity.setValue(0));

        const animations = animValues.current.map((anim, index) => {
            const delay = index * (duration / count / 3);
            
            return Animated.parallel([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: duration,
                    delay,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(scales.current[index], {
                        toValue: 1,
                        duration: duration * 0.3,
                        delay,
                        easing: Easing.out(Easing.back(1.2)),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scales.current[index], {
                        toValue: 0.2,
                        duration: duration * 0.7,
                        delay: delay + duration * 0.3,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(rotations.current[index], {
                    toValue: 1,
                    duration: duration * 1.5,
                    delay,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(opacities.current[index], {
                        toValue: 1,
                        duration: duration * 0.2,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacities.current[index], {
                        toValue: 0,
                        duration: duration * 0.8,
                        delay: delay + duration * 0.2,
                        useNativeDriver: true,
                    }),
                ]),
            ]);
        });

        Animated.parallel(animations).start();
    };

    const getSparkPosition = (index) => {
        const angle = (index / count) * Math.PI * 2;
        let radius = size * 1.2;
        switch(position) {
            case 'top':
                const topAngle = (index / count) * Math.PI; 
                const topRadius = size * 1.5;
                return {
                    left: topRadius * Math.cos(topAngle),
                    top: -topRadius * 0.8, 
                };
            case 'back':
                const backRadius = size * 1.8;
                return {
                    left: backRadius * Math.cos(angle),
                    top: backRadius * Math.sin(angle) * 0.5, 
                };
            case 'left':
                const leftAngle = (index / count) * Math.PI * 1.5; 
                return {
                    left: -size * 1.5,
                    top: size * Math.sin(leftAngle) * 0.8,
                };
            case 'right':
                const rightAngle = (index / count) * Math.PI * 1.5; 
                return {
                    left: size * 1.5,
                    top: size * Math.sin(rightAngle) * 0.8,
                };
            default: 
                return {
                    left: radius * Math.cos(angle),
                    top: radius * Math.sin(angle),
                };
        }
    };

    const renderSparks = () => {
        return animValues.current.map((anim, index) => {
            const positionData = getSparkPosition(index);
            
            const translateX = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, positionData.left],
            });
            
            const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, positionData.top],
            });
            
            const scale = scales.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
            });
            
            const rotate = rotations.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '720deg'],
            });

            const opacity = opacities.current[index];

            return (
                <Animated.View
                    key={index}
                    style={[
                        styles.sparkElement,
                        {
                            backgroundColor: color,
                            opacity: opacity,
                            width: size / 4,
                            height: size / 4,
                            borderRadius: size / 8,
                            transform: [
                                { translateX },
                                { translateY },
                                { scale },
                                { rotate },
                            ],
                        },
                    ]}
                />
            );
        });
    };

    return (
        <View style={[styles.sparkContainer, { width: size * 3, height: size * 3 }, style]}>
            {renderSparks()}
            {isActive && (
                <Animated.View
                    style={[
                        styles.centerGlow,
                        {
                            backgroundColor: color,
                            width: size * 0.8,
                            height: size * 0.8,
                            borderRadius: size * 0.4,
                            opacity: opacities.current[0] || 0,
                        },
                    ]}
                />
            )}
        </View>
    );
};

// Action Panel Button Component
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

// Camera Screen Button Component
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

// Quest List Component
const QuestList = ({ show, slideAnim, questIconLayout }) => {
    if (!show || !questIconLayout) return null; 

    const topPosition = questIconLayout.y + questIconLayout.height + scaleSize(5); 
    const questListWidth = SCREEN_WIDTH * 0.90;
    const questListOffset = (SCREEN_WIDTH / 2) - (questListWidth / 2);
    
    const animatedStyle = {
        transform: [{
            translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-questListWidth, questListOffset - scaleSize(20)], 
            }),
        }],
        top: topPosition,
        left: 0, 
    };

    const QUESTS = ["• Defeat Stage 1", "• Defeat Stage 2", "• Defeat Stage 3"];

    return (
        <Animated.View style={[questListStyles.container, animatedStyle, { width: questListWidth }]}>
            {QUESTS.map((quest, index) => (
                <View key={index} style={questListStyles.item}>
                    <Text style={questListStyles.text}>{quest}</Text> 
                </View>
            ))}
        </Animated.View>
    );
};

const SimpleTopIconButton = ({ iconSource, onPress, isQuest = false, isActive = false, refProp = null }) => {
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

// Robot Preview Component
const RobotPreview = ({ loadout }) => {
    const [showSpark, setShowSpark] = useState(false);
    const [sparkPosition, setSparkPosition] = useState('top');
    
    const getWeaponOffset = () => {
        const weapon = loadout?.Weapon;
        const chassis = loadout?.Chassis;

        if (!chassis || !weapon) return 0;

        if (chassis === "ChassisInnovare") {
            if (weapon === "WeaponCreativia") return scaleSize(13);
            if (weapon === "WeaponGeneralis") return scaleSize(8);
            if (weapon === "WeaponInnovare") return 0;
        }

        if (chassis === "ChassisGeneralis") {
            if (weapon === "WeaponCreativia") return scaleSize(6);
            if (weapon === "WeaponGeneralis") return 0;
            if (weapon === "WeaponInnovare") return scaleSize(-6);
        }
    
        if (chassis === "ChassisCreativia") {
            if (weapon === "WeaponCreativia") return 0;
            if (weapon === "WeaponGeneralis") return scaleSize(-5);
            if (weapon === "WeaponInnovare") return scaleSize(-11);
        }

        return 0;
    };

    const handleRobotTap = () => {
        const positions = ['top', 'center', 'back', 'left', 'right'];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        setSparkPosition(randomPosition);
        setShowSpark(true);
        setTimeout(() => {
            setShowSpark(false);
        }, 800);
    };

    const equippedWeapon = loadout?.Weapon;
    const equippedChassis = loadout?.Chassis;
    const equippedEngine = loadout?.Engines;
    const equippedWheels = loadout?.Wheels;

    if (!loadout || (!equippedWeapon && !equippedChassis && !equippedEngine && !equippedWheels)) {
        return (
            <TouchableOpacity 
                style={styles.robotPreviewContainer} 
                onPress={handleRobotTap}
                activeOpacity={1}
            >
                <View style={styles.robotStage}>
                    <Text style={{ color: LIGHT_BLUE, fontSize: scaleFont(16), textAlign: 'center' }}>
                        No robot configured
                    </Text>
                    <Text style={{ color: LIGHT_GREY, fontSize: scaleFont(12), textAlign: 'center', marginTop: scaleSize(10) }}>
                        Go to Loadout to customize your robot
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    const robotSize = {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8
    };
    const getSparkStyle = (position) => {
        const robotCenterX = robotSize.width / 2;
        const robotCenterY = robotSize.height / 2;
        
        switch(position) {
            case 'top':
                return {
                    position: 'absolute',
                    top: -robotSize.height * 0.15,
                    left: robotCenterX - 45,
                };
            case 'back':
                return {
                    position: 'absolute',
                    top: robotCenterY - 30,
                    left: robotSize.width * 0.15,
                };
            case 'center':
                return {
                    position: 'absolute',
                    top: robotCenterY - 45,
                    left: robotCenterX - 45,
                };
            case 'left':
                return {
                    position: 'absolute',
                    top: robotCenterY - 45,
                    left: -45,
                };
            case 'right':
                return {
                    position: 'absolute',
                    top: robotCenterY - 45,
                    left: robotSize.width - 45,
                };
            default:
                return {
                    position: 'absolute',
                    top: robotCenterY - 45,
                    left: robotCenterX - 45,
                };
        }
    };

    return (
        <TouchableOpacity 
            style={styles.robotPreviewContainer} 
            onPress={handleRobotTap}
            activeOpacity={1}
        >
            <View style={[styles.robotStage, { width: robotSize.width, height: robotSize.height }]}>
                {equippedWheels && (
                    <Image 
                        source={ASSETS.parts[equippedWheels]} 
                        style={[styles.robotLayer, { zIndex: 10 }]} 
                        resizeMode="contain" 
                    />
                )}

                {equippedChassis && (
                    <Image 
                        source={ASSETS.parts[equippedChassis]} 
                        style={[styles.robotLayer, { zIndex: 10 }]} 
                        resizeMode="contain" 
                    />
                )}

                {equippedEngine && (
                    <Image 
                        source={ASSETS.parts[equippedEngine]} 
                        style={[styles.robotLayer, { zIndex: 20 }]} 
                        resizeMode="contain" 
                    />
                )}
                
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
                
                {showSpark && (
                    <View style={getSparkStyle(sparkPosition)} pointerEvents="none">
                        <SparkAnimation 
                            isActive={showSpark}
                            size={35}
                            color={LIGHT_BLUE}
                            count={8}
                            duration={800}
                            position={sparkPosition}
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Blinking Light Animation Component
const BlinkingLightAnimation = ({ isVisible }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [currentBg, setCurrentBg] = useState(ICONS.main_menubg);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isVisible) {
            const doubleBlinkSequence = () => {
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200, 
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentBg(ICONS.main_menubg_on);
                    
                    setTimeout(() => {
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 100, 
                            useNativeDriver: true,
                        }).start(() => {
                            setCurrentBg(ICONS.main_menubg);
                            setTimeout(() => {
                                Animated.timing(fadeAnim, {
                                    toValue: 1,
                                    duration: 200, 
                                    useNativeDriver: true,
                                }).start(() => {
                                    setCurrentBg(ICONS.main_menubg_on);
                                    
                                    setTimeout(() => {
                                        Animated.timing(fadeAnim, {
                                            toValue: 0,
                                            duration: 100,  
                                            useNativeDriver: true,
                                        }).start(() => {
                                            setCurrentBg(ICONS.main_menubg);
                                        });
                                    }, 300);    
                                });
                            }, 150); 
                        });
                    }, 300);    
                });
            };

            doubleBlinkSequence();
            intervalRef.current = setInterval(doubleBlinkSequence, 3000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else {
            setCurrentBg(ICONS.main_menubg);
            fadeAnim.setValue(0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [isVisible, fadeAnim]);

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFillObject,
                {
                    opacity: fadeAnim,
                }
            ]}
        >
            <ImageBackground 
                source={currentBg}
                style={styles.background}
                resizeMode="cover"
            />
        </Animated.View>
    );
};

// Gray Header Component
const GrayHeader = ({ onQuestPress, onShopPress, onSettingsPress, showQuestList, questIconRef }) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerIconsContainer}>
                <View style={styles.headerLeft}>
                    <SimpleTopIconButton 
                        iconSource={ICONS.quest}
                        onPress={onQuestPress}
                        isQuest={true}
                        isActive={showQuestList}
                        refProp={questIconRef}
                    />
                </View>
                <View style={styles.headerRight}>
                    <SimpleTopIconButton 
                        iconSource={ICONS.shop}
                        onPress={onShopPress}
                    />
                    <View style={styles.iconSpacer} />
                    <SimpleTopIconButton 
                        iconSource={ICONS.settings}
                        onPress={onSettingsPress}
                    />
                </View>
            </View>
        </View>
    );
};

// Main Menu Screen Component
function MainMenuScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [showQuestList, setShowQuestList] = useState(false);
    const [currentLoadout, setCurrentLoadout] = useState(DEFAULT_LOADOUT);
    const [currentUser, setCurrentUser] = useState(null);
    const slideAnim = useRef(new Animated.Value(0)).current; 
    const questIconRef = useRef(null);
    const [questIconLayout, setQuestIconLayout] = useState(null);

    const loadCurrentLoadout = async (user) => {
        try {
            const userId = user.uid;
            const presetsRef = doc(db, 'Roboquest-Loadout', userId);
            const presetsSnap = await getDoc(presetsRef);
            
            if (presetsSnap.exists()) {
                const data = presetsSnap.data();
                
                if (data.presets && typeof data.presets === 'object') {
                    if (data.equippedPreset && data.presets[data.equippedPreset]) {
                        setCurrentLoadout(data.presets[data.equippedPreset]);
                    } 
                    else if (data.selectedPreset && data.presets[data.selectedPreset]) {
                        setCurrentLoadout(data.presets[data.selectedPreset]);
                    }
                    else if (data.presets.Default) {
                        setCurrentLoadout(data.presets.Default);
                    }
                    else if (Object.keys(data.presets).length > 0) {
                        const firstPresetName = Object.keys(data.presets)[0];
                        setCurrentLoadout(data.presets[firstPresetName]);
                    }
                    else {
                        setCurrentLoadout(DEFAULT_LOADOUT);
                    }
                } else {
                    setCurrentLoadout(DEFAULT_LOADOUT);
                }
            } else {
                setCurrentLoadout(DEFAULT_LOADOUT);
            }
            
        } catch (error) {
            console.log("Error loading loadout for main menu:", error);
            setCurrentLoadout(DEFAULT_LOADOUT);
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
            <StatusBar barStyle="light-content" backgroundColor={HEADER_COLOR} />
            
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
                <BlinkingLightAnimation isVisible={isFocused} />
                <GrayHeader 
                    onQuestPress={toggleQuestList}
                    onShopPress={() => navigation.navigate('Shop')}
                    onSettingsPress={() => navigation.navigate('Settings')}
                    showQuestList={showQuestList}
                    questIconRef={questIconRef}
                />
                
                <View style={styles.contentContainer}>
                    
                    <View style={styles.centerContent}>
                        <RobotPreview 
                            loadout={currentLoadout} 
                        />
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

                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}

const questListStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: PANEL_DARK_BG,
        borderRadius: scaleSize(8),
        padding: scaleSize(10),
        zIndex: 100, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleSize(2) },
        shadowOpacity: 0.5,
        shadowRadius: scaleSize(5),
        elevation: 10,
    },
    item: {
        paddingVertical: scaleSize(8),
        paddingHorizontal: scaleSize(5),
        borderBottomWidth: 1,
        borderBottomColor: ACCENT_GREY,
    },
    text: {
        color: LIGHT_GREY,
        fontSize: scaleFont(16),
        fontWeight: '600',
        textAlign: 'left',
    },
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: HEADER_COLOR,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        paddingVertical: scaleSize(-1),
        marginTop: scaleSize(80), 
    },
    
    // Gray Header Styles 
    headerContainer: {
        position: 'absolute',
        top: scaleSize(10), 
        left: 0,
        right: 0,
        height: scaleSize(90), 
        backgroundColor: HEADER_COLOR,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
        borderRadius: scaleSize(10), 
        paddingHorizontal: scaleSize(15), 
    },
    headerIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
    },
    headerLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    headerRight: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    iconSpacer: {
        width: scaleSize(15), 
    },
    
    sparkContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none', 
    },
    sparkElement: {
        position: 'absolute',
    },
    centerGlow: {
        position: 'absolute',
    },
    
    // TOP ICON BUTTON STYLES 
    topIconButton: {
        width: scaleSize(60), 
        height: scaleSize(60), 
        borderRadius: scaleSize(25),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleSize(2) },
        shadowOpacity: 0.2,
        shadowRadius: scaleSize(3),
    },
    topIconButtonActive: {
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        borderColor: LIGHT_BLUE,
    },
    topIconImage: {
        width: scaleSize(26), 
        height: scaleSize(26), 
        tintColor: LIGHT_BLUE,
    },
    
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: scaleSize(-30),
        zIndex: 1,
    },
    
    robotPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: scaleSize(-100),
        zIndex: 1,
        position: 'relative',
    },
    robotStage: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        maxWidth: scaleSize(350),
        maxHeight: scaleSize(350),
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
        width: '80%',
        alignSelf: 'center',
        marginBottom: scaleSize(1),
        paddingHorizontal: scaleSize(.1),
        zIndex: 10,
    },
    bottomActionButtonsContainer: { 
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '110%',
        alignSelf: 'center',
        marginBottom: scaleSize(90),
        paddingHorizontal: scaleSize(.1),
        zIndex: 10,
    },
    actionButton: {
        width: SCREEN_WIDTH * 0.30,
        height: scaleSize(35),
        borderRadius: scaleSize(20),
        backgroundColor: Transparent_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        width: scaleSize(30),
        height: scaleSize(30),
        tintColor: LIGHT_BLUE,
        marginBottom: scaleSize(3),
    },
    actionLabel: {
        fontSize: scaleFont(9),
        fontWeight: 'bold',
        color: LIGHT_BLUE,
        textAlign: 'center',
    },
    
    // Camera Button Styles
    cameraButtonOuterContainer: {
        alignItems: 'center',
        marginBottom: scaleSize(.2),
        marginTop: scaleSize(10),
        zIndex: 10,
    },
    cameraButton: {
        width: SCREEN_WIDTH * 0.3,
        height: scaleSize(55),
        backgroundColor: Transparent_BG,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    cameraIcon: {
        width: scaleSize(35),
        height: scaleSize(35),
        tintColor: LIGHT_BLUE,
        marginBottom: scaleSize(1),
        zIndex: 10,
    },
    cameraLabel: {
        fontSize: scaleFont(9),
        fontWeight: 'bold',
        color: LIGHT_BLUE,
        zIndex: 10,
    },
    
    // Camera Accents (Line Borders)
    cameraAccentTopRight: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: scaleSize(20),
        height: scaleSize(20),
        backgroundColor: Transparent_BG,
        borderBottomWidth: scaleSize(3),
        borderLeftWidth: scaleSize(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentBottomLeft: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: scaleSize(20),
        height: scaleSize(20),
        backgroundColor: Transparent_BG,
        borderTopWidth: scaleSize(3),
        borderRightWidth: scaleSize(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentTopLeft: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: scaleSize(20),
        height: scaleSize(20),
        backgroundColor: Transparent_BG,
        borderBottomWidth: scaleSize(3),
        borderRightWidth: scaleSize(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentBottomRight: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: scaleSize(20),
        height: scaleSize(20),
        backgroundColor: Transparent_BG,
        borderTopWidth: scaleSize(3),
        borderLeftWidth: scaleSize(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
});

export default MainMenuScreen;