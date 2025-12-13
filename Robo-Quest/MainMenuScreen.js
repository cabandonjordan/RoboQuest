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
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, getDoc, onAuthStateChanged, updateDoc, setDoc, onSnapshot, writeBatch } from './database/firebase';

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
const HEADER_COLOR = '#2A2A2A';
const SUCCESS_GREEN = '#00CC66';
const GOLD_COIN = '#FFD700';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// RESPONSIVE FUNCTIONS
const responsiveScale = (size) => {
    const baseWidth = 375;
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    
    if (SCREEN_WIDTH < 350) {
        return Math.round(size * scaleFactor * 0.9);
    }
    if (SCREEN_WIDTH > 414) {
        return Math.round(size * scaleFactor * 1.05);
    }
    return Math.round(size * scaleFactor);
};

const responsiveFont = (size) => {
    const baseWidth = 375;
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    
    if (SCREEN_WIDTH < 350) {
        return Math.round(size * scaleFactor * 0.85);
    }
    if (SCREEN_WIDTH > 414) {
        return Math.round(size * scaleFactor * 1.1);
    }
    return Math.round(size * scaleFactor);
};

const responsiveSpacing = (size) => {
    const baseWidth = 375;
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    
    if (SCREEN_WIDTH < 350) {
        return Math.round(size * scaleFactor * 0.9);
    }
    if (SCREEN_WIDTH > 414) {
        return Math.round(size * scaleFactor * 1.05);
    }
    return Math.round(size * scaleFactor);
};

const scaleSize = (size) => {
    return responsiveScale(size);
};

const scaleFont = (size) => {
    return responsiveFont(size);
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
    checkmark: require('./assets/icons/checkmark.png'),
    coin: require('./assets/icons/coin.png'),
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

// Quest Types
const QUEST_TYPES = {
    DEFEAT_BOSS: 'defeat_boss',
    OBTAIN_PARTS: 'obtain_parts',
    OPEN_LEGENDARY_CHEST: 'open_legendary_chest',
    TAKE_PICTURE: 'take_picture',
    ACQUIRE_PARTS: 'acquire_parts',
    WIN_BATTLES: 'win_battles',
    COLLECT_COINS: 'collect_coins'
};

// Initial Quest Data
const INITIAL_QUESTS = [
    {
        id: 'quest_1_' + Date.now(),
        type: QUEST_TYPES.DEFEAT_BOSS,
        title: "Defeat Your First Boss",
        description: "Successfully defeat any boss in battle mode",
        reward: 100,
        rewardType: 'scrap_coins',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 1,
        createdAt: new Date().toISOString()
    },
    {
        id: 'quest_2_' + Date.now(),
        type: QUEST_TYPES.OBTAIN_PARTS,
        title: "Collect Robot Parts",
        description: "Acquire 3 new robot parts from battles or shop",
        reward: 50,
        rewardType: 'scrap_coins',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 3,
        createdAt: new Date().toISOString()
    },
    {
        id: 'quest_3_' + Date.now(),
        type: QUEST_TYPES.WIN_BATTLES,
        title: "Prove Your Skills",
        description: "Win 5 battles in battle mode",
        reward: 150,
        rewardType: 'scrap_coins',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 5,
        createdAt: new Date().toISOString()
    }
];

// Add a pool of available quests to draw from
const QUEST_POOL = [
    {
        type: QUEST_TYPES.DEFEAT_BOSS,
        title: "Boss Slayer",
        description: "Defeat a boss in battle mode",
        reward: 100,
        rewardType: 'scrap_coins',
        target: 1
    },
    {
        type: QUEST_TYPES.OBTAIN_PARTS,
        title: "Parts Collector",
        description: "Acquire 3 new robot parts",
        reward: 50,
        rewardType: 'scrap_coins',
        target: 3
    },
    {
        type: QUEST_TYPES.OPEN_LEGENDARY_CHEST,
        title: "Treasure Hunter",
        description: "Open a legendary chest in shop",
        reward: 200,
        rewardType: 'scrap_coins',
        target: 1
    },
    {
        type: QUEST_TYPES.TAKE_PICTURE,
        title: "Photographer",
        description: "Use camera mode to take a picture",
        reward: 30,
        rewardType: 'scrap_coins',
        target: 1
    },
    {
        type: QUEST_TYPES.ACQUIRE_PARTS,
        title: "Master Collector",
        description: "Acquire 1 of each part type (Chassis, Engine, Weapon, Wheels)",
        reward: 150,
        rewardType: 'scrap_coins',
        target: 4
    },
    {
        type: QUEST_TYPES.WIN_BATTLES,
        title: "Battle Veteran",
        description: "Win 5 battles in battle mode",
        reward: 150,
        rewardType: 'scrap_coins',
        target: 5
    },
    {
        type: QUEST_TYPES.COLLECT_COINS,
        title: "Coin Collector",
        description: "Collect 500 scrap coins",
        reward: 100,
        rewardType: 'scrap_coins',
        target: 500
    }
];

// Helper function to generate a new random quest
const generateNewQuest = () => {
    const randomQuest = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
    return {
        ...randomQuest,
        id: 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        createdAt: new Date().toISOString()
    };
};

// SparkAnimation Component
const SparkAnimation = ({ 
    isActive = false, 
    size = 30, 
    color = LIGHT_BLUE, 
    count = 6, 
    duration = 800,
    style = {},
    position = 'center'
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
        let radius = scaleSize(size) * 1.2;
        switch(position) {
            case 'top':
                const topAngle = (index / count) * Math.PI;
                const topRadius = scaleSize(size) * 1.5;
                return {
                    left: topRadius * Math.cos(topAngle),
                    top: -topRadius * 0.8,
                };
            case 'back':
                const backRadius = scaleSize(size) * 1.8;
                return {
                    left: backRadius * Math.cos(angle),
                    top: backRadius * Math.sin(angle) * 0.5,
                };
            case 'left':
                const leftAngle = (index / count) * Math.PI * 1.5;
                return {
                    left: -scaleSize(size) * 1.5,
                    top: scaleSize(size) * Math.sin(leftAngle) * 0.8,
                };
            case 'right':
                const rightAngle = (index / count) * Math.PI * 1.5;
                return {
                    left: scaleSize(size) * 1.5,
                    top: scaleSize(size) * Math.sin(rightAngle) * 0.8,
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
                            width: scaleSize(size / 4),
                            height: scaleSize(size / 4),
                            borderRadius: scaleSize(size / 8),
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

    const responsiveSize = scaleSize(size);
    
    return (
        <View style={[styles.sparkContainer, { 
            width: responsiveSize * 3, 
            height: responsiveSize * 3 
        }, style]}>
            {renderSparks()}
            {isActive && (
                <Animated.View
                    style={[
                        styles.centerGlow,
                        {
                            backgroundColor: color,
                            width: responsiveSize * 0.8,
                            height: responsiveSize * 0.8,
                            borderRadius: responsiveSize * 0.4,
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

// Debug function to log quest state
const logQuestState = (quest, action) => {
    console.log(`Quest ${action}:`, {
        id: quest.id,
        title: quest.title,
        isCompleted: quest.isCompleted,
        isClaimed: quest.isClaimed,
        progress: quest.progress,
        target: quest.target
    });
};

// Quest Item Component
const QuestItem = ({ quest, onClaim, userScrapCoins, isClaiming }) => {
    const isCompleted = quest.isCompleted && !quest.isClaimed;
    const isDisabled = quest.isClaimed || isClaiming || !isCompleted;
    const progressPercentage = (quest.progress / quest.target) * 100;
    const progressText = quest.type === QUEST_TYPES.DEFEAT_BOSS 
        ? "Defeat a boss in battle mode"
        : quest.description;
    
    const handleClaimPress = () => {
        if (!isDisabled) {
            onClaim(quest);
        } else {
            if (quest.isClaimed) {
                Alert.alert("Already Claimed", "You've already claimed the reward for this quest.");
            } else if (!quest.isCompleted) {
                Alert.alert("Not Completed", "Complete the quest requirements first.");
            }
        }
    };
    
    return (
        <View style={questListStyles.questItem}>
            <View style={questListStyles.questHeader}>
                <Text style={questListStyles.questTitle}>{quest.title}</Text>
                <View style={questListStyles.rewardContainer}>
                    <Image source={ICONS.coin} style={questListStyles.coinIcon} />
                    <Text style={questListStyles.rewardText}>+{quest.reward}</Text>
                </View>
            </View>
            
            <Text style={questListStyles.questDescription}>{progressText}</Text>
            
            <View style={questListStyles.progressContainer}>
                <View style={questListStyles.progressBar}>
                    <View 
                        style={[
                            questListStyles.progressFill,
                            { width: `${Math.min(progressPercentage, 100)}%` }
                        ]} 
                    />
                </View>
                <Text style={questListStyles.progressText}>
                    {quest.progress}/{quest.target}
                </Text>
            </View>
            
            {isCompleted ? (
                <TouchableOpacity 
                    style={[
                        questListStyles.claimButton,
                        isDisabled && questListStyles.claimButtonDisabled
                    ]}
                    onPress={handleClaimPress}
                    activeOpacity={isDisabled ? 1 : 0.8}
                    disabled={isDisabled}
                >
                    {isClaiming ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : quest.isClaimed ? (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={questListStyles.claimText}>CLAIMED</Text>
                        </>
                    ) : (
                        <>
                            <Image source={ICONS.checkmark} style={questListStyles.claimIcon} />
                            <Text style={questListStyles.claimText}>CLAIM {quest.reward} COINS</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : quest.isClaimed ? (
                <View style={questListStyles.claimedButton}>
                    <Ionicons name="checkmark-circle" size={16} color={SUCCESS_GREEN} />
                    <Text style={questListStyles.claimedText}>REWARD CLAIMED</Text>
                </View>
            ) : (
                <View style={questListStyles.incompleteButton}>
                    <Text style={questListStyles.incompleteText}>IN PROGRESS</Text>
                </View>
            )}
        </View>
    );
};

// Quest List Component
const QuestList = ({ 
    show, 
    slideAnim, 
    questIconLayout, 
    quests, 
    onClaimQuest,
    userScrapCoins,
    onClose,
    claimingQuestId
}) => {
    if (!show || !questIconLayout) return null; 

    const topPosition = questIconLayout.y + questIconLayout.height + responsiveSpacing(5);
    const questListWidth = SCREEN_WIDTH * 0.90;
    const questListOffset = (SCREEN_WIDTH / 2) - (questListWidth / 2);
    
    const animatedStyle = {
        transform: [{
            translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-questListWidth, questListOffset - responsiveSpacing(20)],
            }),
        }],
        top: topPosition,
        left: 0,
    };

    const activeQuests = quests.filter(q => !q.isClaimed);
    const completedQuests = quests.filter(q => q.isCompleted && !q.isClaimed);

    return (
        <Animated.View style={[questListStyles.container, animatedStyle, { width: questListWidth }]}>
            <TouchableOpacity 
                style={questListStyles.closeButton}
                onPress={onClose}
            >
                <Text style={questListStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={questListStyles.header}>
                <Text style={questListStyles.headerTitle}>QUESTS</Text>
                <View style={questListStyles.coinDisplay}>
                    <Image source={ICONS.coin} style={questListStyles.headerCoinIcon} />
                    <Text style={questListStyles.coinAmount}>{userScrapCoins}</Text>
                </View>
            </View>
            
            {completedQuests.length > 0 && (
                <View style={questListStyles.notificationBanner}>
                    <Text style={questListStyles.notificationText}>
                        {completedQuests.length} quest{completedQuests.length > 1 ? 's' : ''} ready to claim!
                    </Text>
                </View>
            )}
            
            {activeQuests.length > 0 ? (
                activeQuests.map((quest) => (
                    <QuestItem 
                        key={quest.id}
                        quest={quest}
                        onClaim={onClaimQuest}
                        userScrapCoins={userScrapCoins}
                        isClaiming={claimingQuestId === quest.id}
                    />
                ))
            ) : (
                <View style={questListStyles.noQuestsContainer}>
                    <Text style={questListStyles.noQuestsText}>No active quests</Text>
                    <Text style={questListStyles.noQuestsSubText}>Complete more activities to unlock new quests</Text>
                </View>
            )}
        </Animated.View>
    );
};

const SimpleTopIconButton = ({ iconSource, onPress, isQuest = false, isActive = false, refProp = null, notificationCount = 0 }) => {
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
            {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{notificationCount}</Text>
                </View>
            )}
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
            if (weapon === "WeaponCreativia") return responsiveSpacing(13);
            if (weapon === "WeaponGeneralis") return responsiveSpacing(8);
            if (weapon === "WeaponInnovare") return 0;
        }

        if (chassis === "ChassisGeneralis") {
            if (weapon === "WeaponCreativia") return responsiveSpacing(6);
            if (weapon === "WeaponGeneralis") return 0;
            if (weapon === "WeaponInnovare") return responsiveSpacing(-6);
        }
    
        if (chassis === "ChassisCreativia") {
            if (weapon === "WeaponCreativia") return 0;
            if (weapon === "WeaponGeneralis") return responsiveSpacing(-5);
            if (weapon === "WeaponInnovare") return responsiveSpacing(-11);
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
                    <Text style={{ color: LIGHT_BLUE, fontSize: responsiveFont(16), textAlign: 'center' }}>
                        No robot configured
                    </Text>
                    <Text style={{ color: LIGHT_GREY, fontSize: responsiveFont(12), textAlign: 'center', marginTop: responsiveSpacing(10) }}>
                        Go to Loadout to customize your robot
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    const robotWidth = SCREEN_WIDTH * (SCREEN_WIDTH < 350 ? 0.75 : SCREEN_WIDTH > 414 ? 0.85 : 0.8);
    const robotHeight = robotWidth;
    
    const getSparkStyle = (position) => {
        const robotCenterX = robotWidth / 2;
        const robotCenterY = robotHeight / 2;
        
        switch(position) {
            case 'top':
                return {
                    position: 'absolute',
                    top: -robotHeight * 0.15,
                    left: robotCenterX - responsiveSpacing(45),
                };
            case 'back':
                return {
                    position: 'absolute',
                    top: robotCenterY - responsiveSpacing(30),
                    left: robotWidth * 0.15,
                };
            case 'center':
                return {
                    position: 'absolute',
                    top: robotCenterY - responsiveSpacing(45),
                    left: robotCenterX - responsiveSpacing(45),
                };
            case 'left':
                return {
                    position: 'absolute',
                    top: robotCenterY - responsiveSpacing(45),
                    left: -responsiveSpacing(45),
                };
            case 'right':
                return {
                    position: 'absolute',
                    top: robotCenterY - responsiveSpacing(45),
                    left: robotWidth - responsiveSpacing(45),
                };
            default:
                return {
                    position: 'absolute',
                    top: robotCenterY - responsiveSpacing(45),
                    left: robotCenterX - responsiveSpacing(45),
                };
        }
    };

    return (
        <TouchableOpacity 
            style={styles.robotPreviewContainer} 
            onPress={handleRobotTap}
            activeOpacity={1}
        >
            <View style={[styles.robotStage, { width: robotWidth, height: robotHeight }]}>
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
const GrayHeader = ({ onQuestPress, onShopPress, onSettingsPress, showQuestList, questIconRef, notificationCount = 0 }) => {
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
                        notificationCount={notificationCount}
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

// Helper function to calculate total boss wins
const calculateTotalBossWins = (bossData) => {
    if (!bossData) return 0;
    
    let totalWins = 0;
    Object.values(bossData).forEach((bossStats) => {
        if (bossStats && typeof bossStats === 'object') {
            totalWins += bossStats.wins || 0;
        }
    });
    return totalWins;
};

// Helper function to generate boss wins signature
const generateBossWinsSignature = (bossData) => {
    if (!bossData) return '';
    
    const winsArray = [];
    Object.entries(bossData).forEach(([bossName, bossStats]) => {
        if (bossStats && typeof bossStats === 'object') {
            winsArray.push(`${bossName}:${bossStats.wins || 0}`);
        }
    });
    winsArray.sort();
    return winsArray.join('|');
};

// Main Menu Screen Component
function MainMenuScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [showQuestList, setShowQuestList] = useState(false);
    const [currentLoadout, setCurrentLoadout] = useState(DEFAULT_LOADOUT);
    const [currentUser, setCurrentUser] = useState(null);
    const [userScrapCoins, setUserScrapCoins] = useState(0);
    const [quests, setQuests] = useState(INITIAL_QUESTS);
    const [isLoading, setIsLoading] = useState(true);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const questIconRef = useRef(null);
    const [questIconLayout, setQuestIconLayout] = useState(null);
    const [claimingQuestId, setClaimingQuestId] = useState(null);
    
    // Track boss defeat counts
    const [totalBossWins, setTotalBossWins] = useState(0);
    const [bossWinsSignature, setBossWinsSignature] = useState('');
    const addNewQuestIfNeeded = async (currentQuests) => {
        const activeQuests = currentQuests.filter(q => !q.isClaimed);
        
        // If we have less than 3 active quests, add a new one
        if (activeQuests.length < 3) {
            const newQuest = generateNewQuest();
            const updatedQuests = [...currentQuests, newQuest];
            
            try {
                if (currentUser) {
                    const questsRef = doc(db, 'Roboquest-Quests', currentUser.uid);
                    await updateDoc(questsRef, {
                        quests: updatedQuests,
                        lastUpdated: new Date().toISOString()
                    });
                }
                
                return updatedQuests;
            } catch (error) {
                console.log("Error adding new quest:", error);
                return currentQuests;
            }
        }
        
        return currentQuests;
    };

    // Function to check and update photo quest from Roboquest-Journal-Entry
    const checkAndUpdatePhotoQuest = async (userId, currentQuests) => {
        try {
            // Load journal entry data
            const journalRef = doc(db, 'Roboquest-Journal-Entry', userId);
            const journalSnap = await getDoc(journalRef);
            
            if (!journalSnap.exists()) {
                return currentQuests;
            }
            
            const journalData = journalSnap.data();
            const entries = journalData.entries || [];
            const hasAnyPhotos = entries.length > 0;
            
            // Update quests based on photo status
            const updatedQuests = currentQuests.map(quest => {
                if (quest.type === QUEST_TYPES.TAKE_PICTURE && !quest.isCompleted && !quest.isClaimed) {
                    if (hasAnyPhotos) {
                        console.log("Photos detected in journal, updating take picture quest");
                        return {
                            ...quest,
                            progress: 1,
                            isCompleted: true,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
                return quest;
            });
            
            return updatedQuests;
            
        } catch (error) {
            console.log("Error checking photo quest:", error);
            return currentQuests;
        }
    };

    // Function to check and update boss quests 
    const checkAndUpdateBossQuests = async (userId, currentQuests, previousSignature = '') => {
        try {
            const user = currentUser || auth.currentUser;
            if (!user) return { 
                updatedQuests: currentQuests, 
                bossData: null, 
                newSignature: previousSignature 
            };
            
            const userName = user.displayName || user.email?.split('@')[0] || 'Player';
            const docId = `${userName}-Roboquest-Boss`;
            const bossRef = doc(db, 'Roboquest-Boss', docId);
            const bossSnap = await getDoc(bossRef);
            
            if (!bossSnap.exists()) {
                console.log("No boss data found");
                return { 
                    updatedQuests: currentQuests, 
                    bossData: null, 
                    newSignature: '' 
                };
            }
            
            const currentBossData = bossSnap.data();
            const currentSignature = generateBossWinsSignature(currentBossData);
            const currentTotalWins = calculateTotalBossWins(currentBossData);
            
            console.log("Current boss signature:", currentSignature);
            console.log("Previous boss signature:", previousSignature);
            console.log("Current total wins:", currentTotalWins);
            
            // Update quests if boss wins changed (increased)
            const updatedQuests = currentQuests.map(quest => {
                if (quest.type === QUEST_TYPES.DEFEAT_BOSS && !quest.isClaimed) {
                    const signatureChanged = currentSignature !== previousSignature;
                    const hasAnyWins = currentTotalWins > 0;
                    
                    if (signatureChanged && hasAnyWins && !quest.isCompleted) {
                        console.log("Boss wins increased, marking quest as complete");
                        return {
                            ...quest,
                            progress: 1,
                            isCompleted: true,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
                return quest;
            });
            
            return { 
                updatedQuests, 
                bossData: currentBossData, 
                newSignature: currentSignature 
            };
            
        } catch (error) {
            console.log("Error checking boss quests:", error);
            return { 
                updatedQuests: currentQuests, 
                bossData: null, 
                newSignature: previousSignature 
            };
        }
    };

    // Modified loadUserData function
    const loadUserData = async (user) => {
        try {
            const userId = user.uid;
            
            // Load scrap coins
            const scrapRef = doc(db, 'Roboquest-Scraps', userId);
            const scrapSnap = await getDoc(scrapRef);
            if (scrapSnap.exists()) {
                const scrapData = scrapSnap.data();
                setUserScrapCoins(scrapData.coins || 0);
            } else {
                await setDoc(scrapRef, { coins: 0 });
                setUserScrapCoins(0);
            }

            // Load quests
            const questsRef = doc(db, 'Roboquest-Quests', userId);
            const questsSnap = await getDoc(questsRef);
            
            let loadedQuests = [];
            
            if (questsSnap.exists()) {
                const questsData = questsSnap.data();
                loadedQuests = (questsData.quests || []).filter(q => !q.isClaimed);
                
                // Check boss defeat status
                const { 
                    updatedQuests: bossUpdatedQuests, 
                    bossData, 
                    newSignature 
                } = await checkAndUpdateBossQuests(userId, loadedQuests, bossWinsSignature);
                
                // Check journal for take picture quest
                const photoUpdatedQuests = await checkAndUpdatePhotoQuest(userId, bossUpdatedQuests);
                
                // Ensure we have at least 3 quests
                let finalQuests = photoUpdatedQuests;
                if (finalQuests.length < 3) {
                    finalQuests = await addNewQuestIfNeeded(finalQuests);
                }
                
                // Update quests in Firestore if they changed
                if (JSON.stringify(finalQuests) !== JSON.stringify(questsData.quests)) {
                    await updateDoc(questsRef, {
                        quests: finalQuests,
                        lastUpdated: new Date().toISOString()
                    });
                }
                
                setQuests(finalQuests);
                if (bossData) {
                    setTotalBossWins(calculateTotalBossWins(bossData));
                }
                setBossWinsSignature(newSignature);
            } else {
                // Initialize with 3 quests for new user
                let initialQuests = INITIAL_QUESTS;
                
                // Check boss defeat status
                const { 
                    updatedQuests: bossUpdatedQuests, 
                    bossData, 
                    newSignature 
                } = await checkAndUpdateBossQuests(userId, initialQuests, '');
                
                // Check journal for take picture quest
                const photoUpdatedQuests = await checkAndUpdatePhotoQuest(userId, bossUpdatedQuests);
                
                await setDoc(questsRef, { 
                    quests: photoUpdatedQuests,
                    lastUpdated: new Date().toISOString()
                });
                
                setQuests(photoUpdatedQuests);
                if (bossData) {
                    setTotalBossWins(calculateTotalBossWins(bossData));
                }
                setBossWinsSignature(newSignature);
            }

        } catch (error) {
            console.log("Error loading user data:", error);
            // Initialize with default quests if error
            setQuests(INITIAL_QUESTS);
        }
    };

    // Update quest progress
    const updateQuestProgress = async (questType, increment = 1) => {
        if (!currentUser) return false;
        
        try {
            const userId = currentUser.uid;
            const questsRef = doc(db, 'Roboquest-Quests', userId);
            const questsSnap = await getDoc(questsRef);
            
            if (questsSnap.exists()) {
                const questsData = questsSnap.data();
                const updatedQuests = questsData.quests.map(quest => {
                    if (quest.type === questType && !quest.isClaimed) {
                        if (quest.type === QUEST_TYPES.DEFEAT_BOSS) {
                            return quest;
                        }
                        
                        const newProgress = Math.min(quest.progress + increment, quest.target);
                        const isNowCompleted = newProgress >= quest.target;
                        
                        return {
                            ...quest,
                            progress: newProgress,
                            isCompleted: isNowCompleted,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                    return quest;
                });
                
                await updateDoc(questsRef, {
                    quests: updatedQuests,
                    lastUpdated: new Date().toISOString()
                });
                
                setQuests(updatedQuests);
                return true;
            }
        } catch (error) {
            console.log("Error updating quest progress:", error);
        }
        return false;
    };

    // Modified claimQuestReward function to delete quest after claiming
    const claimQuestReward = async (quest) => {
        logQuestState(quest, "Claim Attempt");
        if (claimingQuestId === quest.id) {
            console.log("Already claiming this quest:", quest.id);
            return;
        }
        if (!currentUser || !quest.isCompleted || quest.isClaimed) {
            console.log("Cannot claim quest:", {
                hasUser: !!currentUser,
                isCompleted: quest.isCompleted,
                isClaimed: quest.isClaimed,
                questId: quest.id
            });
            Alert.alert("Cannot Claim", "This quest has already been claimed or is not yet completed.");
            return;
        }
        
        setClaimingQuestId(quest.id);
        
        try {
            const userId = currentUser.uid;
            const batch = writeBatch(db);
            
            // Update scrap coins
            const scrapRef = doc(db, 'Roboquest-Scraps', userId);
            const scrapSnap = await getDoc(scrapRef);
            const currentCoins = scrapSnap.exists() ? (scrapSnap.data().coins || 0) : 0;
            const newCoins = currentCoins + quest.reward;
            batch.update(scrapRef, { coins: newCoins });
            
            // Update quests - mark as claimed (we'll filter it out instead of deleting from DB)
            const questsRef = doc(db, 'Roboquest-Quests', userId);
            const questsSnap = await getDoc(questsRef);
            
            if (questsSnap.exists()) {
                const questsData = questsSnap.data();
                
                // Mark quest as claimed
                const updatedQuests = questsData.quests.map(q => {
                    if (q.id === quest.id) {
                        return {
                            ...q,
                            isClaimed: true,
                            claimedAt: new Date().toISOString(),
                            claimedUserId: userId
                        };
                    }
                    return q;
                });
                
                // Filter out claimed quests from display
                const displayQuests = updatedQuests.filter(q => !q.isClaimed);
                
                // Add new quest if needed
                const finalQuests = await addNewQuestIfNeeded(displayQuests);
                
                batch.update(questsRef, { 
                    quests: finalQuests,
                    lastUpdated: new Date().toISOString()
                });
                
                await batch.commit();
                
                // Update local state with filtered quests (claimed ones removed)
                setQuests(finalQuests);
                setUserScrapCoins(newCoins);
                setClaimingQuestId(null);
                
                Alert.alert(
                    "🎉 Quest Completed!",
                    `You received ${quest.reward} scrap coins!\n\nNew balance: ${newCoins} coins\n\nA new quest has been added!`,
                    [{ text: "Awesome!" }]
                );
            } else {
                throw new Error("Quests document not found");
            }
            
        } catch (error) {
            console.log("Error claiming quest reward:", error);
            Alert.alert("Error", "Failed to claim reward. Please try again.");
            setClaimingQuestId(null);
        }
    };

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

    // Real-time listener for boss updates - ONLY updates when boss wins increase
    useEffect(() => {
        if (!currentUser) return;
        
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Player';
        const docId = `${userName}-Roboquest-Boss`;
        
        // Listen for boss data updates
        const bossRef = doc(db, 'Roboquest-Boss', docId);
        const unsubscribe = onSnapshot(bossRef, async (docSnap) => {
            if (docSnap.exists()) {
                const currentBossData = docSnap.data();
                const currentSignature = generateBossWinsSignature(currentBossData);
                const currentTotalWins = calculateTotalBossWins(currentBossData);
                
                console.log("=== Real-time Boss Update ===");
                console.log("Current signature:", currentSignature);
                console.log("Previous signature:", bossWinsSignature);
                console.log("Current total wins:", currentTotalWins);
                console.log("Previous total wins:", totalBossWins);
                
                // Only proceed if signature changed (boss wins changed)
                if (currentSignature !== bossWinsSignature) {
                    const winsIncreased = currentTotalWins > totalBossWins;
                    
                    console.log("Wins increased?", winsIncreased);
                    
                    if (winsIncreased) {
                        console.log("BOSS WINS INCREASED! Updating quest...");
                        
                        setQuests(prevQuests => {
                            const updatedQuests = prevQuests.map(quest => {
                                if (quest.type === QUEST_TYPES.DEFEAT_BOSS && !quest.isCompleted && !quest.isClaimed) {
                                    console.log("Marking boss quest as complete");
                                    return {
                                        ...quest,
                                        progress: 1,
                                        isCompleted: true,
                                        lastUpdated: new Date().toISOString()
                                    };
                                }
                                return quest;
                            });
                            
                            if (JSON.stringify(updatedQuests) !== JSON.stringify(prevQuests)) {
                                const questsRef = doc(db, 'Roboquest-Quests', currentUser.uid);
                                updateDoc(questsRef, {
                                    quests: updatedQuests,
                                    lastUpdated: new Date().toISOString()
                                }).catch(error => {
                                    console.log("Error updating quests in Firestore:", error);
                                });
                            }
                            
                            return updatedQuests;
                        });
                    }
                    
                    setTotalBossWins(currentTotalWins);
                    setBossWinsSignature(currentSignature);
                }
            } else {
                console.log("No boss document exists yet");
                setTotalBossWins(0);
                setBossWinsSignature('');
            }
        });
        
        return () => unsubscribe();
    }, [currentUser, bossWinsSignature, totalBossWins]);

    // Real-time listener for journal entries
    useEffect(() => {
        if (!currentUser) return;
        
        const journalRef = doc(db, 'Roboquest-Journal-Entry', currentUser.uid);
        const unsubscribe = onSnapshot(journalRef, (docSnap) => {
            if (docSnap.exists()) {
                const journalData = docSnap.data();
                const entries = journalData.entries || [];
                const hasAnyEntries = entries.length > 0;
                
                if (hasAnyEntries) {
                    setQuests(prevQuests => {
                        const updatedQuests = prevQuests.map(quest => {
                            if (quest.type === QUEST_TYPES.TAKE_PICTURE && !quest.isCompleted && !quest.isClaimed) {
                                console.log("Entries detected in journal, updating take picture quest");
                                return {
                                    ...quest,
                                    progress: 1,
                                    isCompleted: true,
                                    lastUpdated: new Date().toISOString()
                                };
                            }
                            return quest;
                        });
                        
                        if (JSON.stringify(updatedQuests) !== JSON.stringify(prevQuests)) {
                            const questsRef = doc(db, 'Roboquest-Quests', currentUser.uid);
                            updateDoc(questsRef, {
                                quests: updatedQuests,
                                lastUpdated: new Date().toISOString()
                            }).catch(error => {
                                console.log("Error updating quests in Firestore:", error);
                            });
                        }
                        
                        return updatedQuests;
                    });
                }
            }
        });
        
        return () => unsubscribe();
    }, [currentUser]);

    // Debug function to check boss data
    const debugBossData = async () => {
        if (!currentUser) return;
        
        try {
            const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Player';
            const docId = `${userName}-Roboquest-Boss`;
            const bossRef = doc(db, 'Roboquest-Boss', docId);
            const bossSnap = await getDoc(bossRef);
            
            console.log("=== DEBUG BOSS DATA ===");
            console.log("Document ID:", docId);
            console.log("Exists:", bossSnap.exists());
            
            if (bossSnap.exists()) {
                const data = bossSnap.data();
                console.log("Full data:", JSON.stringify(data, null, 2));
                
                let totalWins = 0;
                Object.entries(data).forEach(([bossName, bossStats]) => {
                    console.log(`${bossName}:`, bossStats);
                    if (bossStats && typeof bossStats === 'object') {
                        totalWins += bossStats.wins || 0;
                    }
                });
                console.log("Total wins:", totalWins);
            }
            console.log("======================");
        } catch (error) {
            console.log("Debug error:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadCurrentLoadout(user);
                await loadUserData(user);
                await debugBossData();
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isFocused && currentUser) {
            loadCurrentLoadout(currentUser);
            loadUserData(currentUser);
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

    const closeQuestList = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowQuestList(false);
        });
    };

    // Calculate notification count (unclaimed completed quests)
    const notificationCount = quests.filter(q => q.isCompleted && !q.isClaimed).length;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={LIGHT_BLUE} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={HEADER_COLOR} />
            
            <QuestList 
                show={showQuestList} 
                slideAnim={slideAnim} 
                questIconLayout={questIconLayout}
                quests={quests}
                onClaimQuest={claimQuestReward}
                userScrapCoins={userScrapCoins}
                onClose={closeQuestList}
                claimingQuestId={claimingQuestId}
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
                    notificationCount={notificationCount}
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
        borderRadius: responsiveScale(12),
        padding: responsiveScale(15),
        paddingTop: responsiveScale(40),
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveScale(4) },
        shadowOpacity: 0.8,
        shadowRadius: responsiveScale(8),
        elevation: 20,
        maxHeight: SCREEN_HEIGHT * 0.9,
        borderWidth: 2,
        borderColor: LIGHT_BLUE,
    },
    closeButton: {
        position: 'absolute',
        top: responsiveScale(10),
        right: responsiveScale(10),
        width: responsiveScale(30),
        height: responsiveScale(30),
        borderRadius: responsiveScale(15),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
    },
    closeButtonText: {
        color: LIGHT_GREY,
        fontSize: responsiveFont(18),
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveScale(15),
        paddingBottom: responsiveScale(10),
        borderBottomWidth: 1,
        borderBottomColor: ACCENT_GREY,
    },
    headerTitle: {
        color: LIGHT_BLUE,
        fontSize: responsiveFont(18),
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    coinDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: responsiveScale(10),
        paddingVertical: responsiveScale(5),
        borderRadius: responsiveScale(20),
        borderWidth: 1,
        borderColor: GOLD_COIN,
    },
    headerCoinIcon: {
        width: responsiveScale(20),
        height: responsiveScale(20),
        marginRight: responsiveScale(5),
        tintColor: GOLD_COIN,
    },
    coinAmount: {
        color: GOLD_COIN,
        fontSize: responsiveFont(16),
        fontWeight: 'bold',
    },
    notificationBanner: {
        backgroundColor: 'rgba(0, 204, 102, 0.2)',
        padding: responsiveScale(10),
        borderRadius: responsiveScale(8),
        marginBottom: responsiveScale(15),
        borderWidth: 1,
        borderColor: SUCCESS_GREEN,
    },
    notificationText: {
        color: SUCCESS_GREEN,
        fontSize: responsiveFont(14),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    questItem: {
        backgroundColor: DARK_ACCENT_GREY,
        borderRadius: responsiveScale(10),
        padding: responsiveScale(15),
        marginBottom: responsiveScale(10),
        borderWidth: 1,
        borderColor: ACCENT_GREY,
    },
    questHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveScale(8),
    },
    questTitle: {
        color: LIGHT_BLUE,
        fontSize: responsiveFont(16),
        fontWeight: 'bold',
        flex: 1,
    },
    rewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: responsiveScale(8),
        paddingVertical: responsiveScale(4),
        borderRadius: responsiveScale(15),
        borderWidth: 1,
        borderColor: GOLD_COIN,
    },
    coinIcon: {
        width: responsiveScale(16),
        height: responsiveScale(16),
        marginRight: responsiveScale(4),
        tintColor: GOLD_COIN,
    },
    rewardText: {
        color: GOLD_COIN,
        fontSize: responsiveFont(14),
        fontWeight: 'bold',
    },
    questDescription: {
        color: LIGHT_GREY,
        fontSize: responsiveFont(12),
        marginBottom: responsiveScale(12),
        lineHeight: responsiveFont(16),
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveScale(12),
    },
    progressBar: {
        flex: 1,
        height: responsiveScale(8),
        backgroundColor: ACCENT_GREY,
        borderRadius: responsiveScale(4),
        overflow: 'hidden',
        marginRight: responsiveScale(10),
    },
    progressFill: {
        height: '100%',
        backgroundColor: LIGHT_BLUE,
        borderRadius: responsiveScale(4),
    },
    progressText: {
        color: LIGHT_GREY,
        fontSize: responsiveFont(12),
        fontWeight: 'bold',
        minWidth: responsiveScale(40),
    },
    claimButton: {
        backgroundColor: SUCCESS_GREEN,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveScale(12),
        borderRadius: responsiveScale(8),
        borderWidth: 1,
        borderColor: '#00AA55',
        gap: responsiveScale(8),
    },
    claimButtonDisabled: {
        backgroundColor: '#888888',
        borderColor: '#666666',
    },
    claimIcon: {
        width: responsiveScale(16),
        height: responsiveScale(16),
        tintColor: '#FFFFFF',
    },
    claimText: {
        color: '#FFFFFF',
        fontSize: responsiveFont(14),
        fontWeight: 'bold',
    },
    incompleteButton: {
        backgroundColor: ACCENT_GREY,
        paddingVertical: responsiveScale(12),
        borderRadius: responsiveScale(8),
        alignItems: 'center',
    },
    incompleteText: {
        color: LIGHT_GREY,
        fontSize: responsiveFont(14),
        fontWeight: 'bold',
    },
    claimedButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: responsiveScale(12),
        borderRadius: responsiveScale(8),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: SUCCESS_GREEN,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: responsiveScale(8),
    },
    claimedText: {
        color: SUCCESS_GREEN,
        fontSize: responsiveFont(14),
        fontWeight: 'bold',
    },
    noQuestsContainer: {
        backgroundColor: DARK_ACCENT_GREY,
        borderRadius: responsiveScale(10),
        padding: responsiveScale(30),
        alignItems: 'center',
        marginBottom: responsiveScale(10),
    },
    noQuestsText: {
        color: LIGHT_BLUE,
        fontSize: responsiveFont(16),
        fontWeight: 'bold',
        marginBottom: responsiveScale(5),
    },
    noQuestsSubText: {
        color: LIGHT_GREY,
        fontSize: responsiveFont(12),
        textAlign: 'center',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: HEADER_COLOR,
        gap: responsiveScale(16),
    },
    loadingText: {
        color: LIGHT_BLUE,
        fontSize: responsiveFont(18),
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        paddingVertical: responsiveScale(-1),
        marginTop: responsiveSpacing(80),
    },
    
    // Gray Header Styles 
    headerContainer: {
        position: 'absolute',
        top: responsiveSpacing(10),
        left: 0,
        right: 0,
        height: responsiveSpacing(90),
        backgroundColor: HEADER_COLOR,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveScale(2) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveScale(3),
        elevation: 5,
        borderRadius: responsiveScale(10),
        paddingHorizontal: responsiveSpacing(15),
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
        position: 'relative',
    },
    headerRight: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    iconSpacer: {
        width: responsiveSpacing(15),
    },
    
    // Notification badge
    notificationBadge: {
        position: 'absolute',
        top: -responsiveScale(5),
        right: -responsiveScale(5),
        backgroundColor: '#FF3B30',
        borderRadius: responsiveScale(10),
        minWidth: responsiveScale(18),
        height: responsiveScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsiveScale(4),
        borderWidth: 2,
        borderColor: HEADER_COLOR,
        zIndex: 10,
    },
    notificationText: {
        color: '#FFFFFF',
        fontSize: responsiveFont(10),
        fontWeight: 'bold',
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
        width: responsiveScale(50),
        height: responsiveScale(50),
        borderRadius: responsiveScale(25),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: responsiveScale(2),
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveScale(2) },
        shadowOpacity: 0.2,
        shadowRadius: responsiveScale(3),
        position: 'relative',
    },
    topIconButtonActive: {
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        borderColor: LIGHT_BLUE,
    },
    topIconImage: {
        width: responsiveScale(26),
        height: responsiveScale(26),
        tintColor: LIGHT_BLUE,
    },
    
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: responsiveScale(-30),
        zIndex: 1,
    },
    
    robotPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: responsiveScale(-80),
        zIndex: 1,
        position: 'relative',
    },
    robotStage: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        maxWidth: responsiveScale(350),
        maxHeight: responsiveScale(350),
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
        marginBottom: responsiveScale(1),
        paddingHorizontal: responsiveScale(.1),
        zIndex: 10,
    },
    bottomActionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '110%',
        alignSelf: 'center',
        marginBottom: responsiveScale(90),
        paddingHorizontal: responsiveScale(.1),
        zIndex: 10,
    },
    actionButton: {
        width: SCREEN_WIDTH * 0.30,
        height: responsiveScale(35),
        borderRadius: responsiveScale(20),
        backgroundColor: Transparent_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        width: responsiveScale(25),
        height: responsiveScale(25),
        tintColor: LIGHT_BLUE,
        marginBottom: responsiveScale(3),
    },
    actionLabel: {
        fontSize: responsiveFont(8),
        fontWeight: 'bold',
        color: LIGHT_BLUE,
        textAlign: 'center',
    },
    
    // Camera Button Styles
    cameraButtonOuterContainer: {
        alignItems: 'center',
        marginBottom: responsiveScale(-6),
        marginTop: responsiveScale(10),
        zIndex: 10,
    },
    cameraButton: {
        width: SCREEN_WIDTH * 0.3,
        height: responsiveScale(55),
        backgroundColor: Transparent_BG,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    cameraIcon: {
        width: responsiveScale(35),
        height: responsiveScale(35),
        tintColor: LIGHT_BLUE,
        marginBottom: responsiveScale(1),
        zIndex: 10,
    },
    cameraLabel: {
        fontSize: responsiveFont(9),
        fontWeight: 'bold',
        color: LIGHT_BLUE,
        zIndex: 10,
    },
    
    // Camera Accents (Line Borders)
    cameraAccentTopRight: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: responsiveScale(20),
        height: responsiveScale(20),
        backgroundColor: Transparent_BG,
        borderBottomWidth: responsiveScale(3),
        borderLeftWidth: responsiveScale(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentBottomLeft: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: responsiveScale(20),
        height: responsiveScale(20),
        backgroundColor: Transparent_BG,
        borderTopWidth: responsiveScale(3),
        borderRightWidth: responsiveScale(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentTopLeft: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: responsiveScale(20),
        height: responsiveScale(20),
        backgroundColor: Transparent_BG,
        borderBottomWidth: responsiveScale(3),
        borderRightWidth: responsiveScale(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
    cameraAccentBottomRight: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: responsiveScale(20),
        height: responsiveScale(20),
        backgroundColor: Transparent_BG,
        borderTopWidth: responsiveScale(3),
        borderLeftWidth: responsiveScale(3),
        borderColor: Indent_Color,
        zIndex: 1,
    },
});

export default MainMenuScreen;