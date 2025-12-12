import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Modal, 
    Pressable, 
    Image, 
    ScrollView, 
    TextInput, 
    Alert, 
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    Animated,
    Easing
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db, doc, setDoc, getDoc, onAuthStateChanged, collection, query, where, getDocs } from './database/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleSize = (size) => {
    const scaleFactor = SCREEN_WIDTH / 375; 
    return Math.round(size * scaleFactor);
};

const scaleFont = (size) => {
    const scaleFactor = SCREEN_WIDTH / 375;
    return Math.round(size * scaleFactor);
};

const GRAY_PALETTE = {
    DARK_GRAY: '#1a1a1a',
    MEDIUM_DARK_GRAY: '#2d2d2d',
    MEDIUM_GRAY: '#3d3d3d',
    LIGHT_DARK_GRAY: '#4d4d4d',
    ACCENT_GRAY: '#5d5d5d',
    LIGHT_GRAY: '#6d6d6d',
    VERY_LIGHT_GRAY: '#8d8d8d',
    OFF_WHITE: '#f5f5f5',
    WHITE: '#ffffff',
    BLUE_ACCENT: '#007AFF',
    GREEN_ACCENT: '#34C759',
    GOLD: '#FFD700',
    ORANGE: '#FFA500',
};

const COLORS = {
    BACKGROUND: GRAY_PALETTE.DARK_GRAY,
    CARD_BG: GRAY_PALETTE.MEDIUM_DARK_GRAY,
    TEXT_PRIMARY: GRAY_PALETTE.OFF_WHITE,
    TEXT_SECONDARY: GRAY_PALETTE.VERY_LIGHT_GRAY,
    TEXT_MUTED: GRAY_PALETTE.LIGHT_GRAY,
    BORDER: GRAY_PALETTE.MEDIUM_GRAY,
    ACCENT: GRAY_PALETTE.ACCENT_GRAY,
    BUTTON_BG: GRAY_PALETTE.LIGHT_DARK_GRAY,
    SELECTED_BORDER: GRAY_PALETTE.BLUE_ACCENT,
    LOCKED: GRAY_PALETTE.LIGHT_GRAY,
    PRIMARY: GRAY_PALETTE.BLUE_ACCENT,
    EQUIP_GREEN: GRAY_PALETTE.GREEN_ACCENT,
    SPARK_GOLD: GRAY_PALETTE.GOLD,
    SPARK_ORANGE: GRAY_PALETTE.ORANGE,
    WHITE: GRAY_PALETTE.WHITE,
};

const ASSETS = {
    icons: {
        leftArrow: require('./assets/icons/left-arrow.png'),
        rightArrow: require('./assets/icons/right-arrow.png'),
        padlock: require('./assets/icons/padlock.png'),
    },
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
    },
    backgrounds: {
        loadout: require('./assets/background/Loadoutbg.png'),
    }
};

const PART_LISTS = {
    Weapon: ['WeaponGeneralis', 'WeaponInnovare', 'WeaponCreativia'],
    Chassis: ['ChassisGeneralis', 'ChassisInnovare', 'ChassisCreativia'],
    Wheels: ['WheelsGeneralis', 'WheelsInnovare', 'WheelsCreativia'],
    Engines: ['EngineGeneralis', 'EngineInnovare', 'EngineCreativia'],
};

const DROPDOWN_OPTIONS = {
    PartBox: ['All', 'Wheels', 'Engines', 'Chassis', 'Weapon'],
    TypeBox: ['All', 'Creativia', 'Generalis', 'Innovare'],
};

const DEFAULT_LOADOUT = {
    Chassis: 'ChassisGeneralis',
    Engines: 'EngineGeneralis',
    Wheels: 'WheelsGeneralis',
    Weapon: 'WeaponGeneralis'
};

const DEFAULT_UNLOCKED_PARTS = {
    Weapon: ['WeaponGeneralis'],
    Chassis: ['ChassisGeneralis'],
    Wheels: ['WheelsGeneralis'],
    Engines: ['EngineGeneralis'],
};

const PART_STATS = {
    WeaponCreativia: {
        name: 'Laser Spread',
        type: 'Weapon',
        brand: 'Creativia',
        stats: [
            '1. Laser Blast: Standard Attack. (50 dmg, cost 3 EN)',
            '2. Overdrive Cascade: (180 dmg, cost 11 EN)'
        ]
    },
    WeaponGeneralis: {
        name: 'Twin Anti-Air Guns',
        type: 'Weapon',
        brand: 'Generalis',
        stats: [
            '1. Burst Fire: Standard Attack. (50 dmg, cost 3 EN)',
            '2. Suppressive Fire: Higher Damage (100 dmg, cost 5 EN)'
        ]
    },
    WeaponInnovare: {
        name: 'Missile Launcher Arrays',
        type: 'Weapon',
        brand: 'Innovare',
        stats: [
            '1. Offensive Launch: Standard Attack. (70 dmg, cost 3 EN)',
            '2. Counter-Measure Launch: Negates next enemy projectile attack. cost 5 EN'
        ]
    },
    
    ChassisCreativia: {
        name: 'Creativia Chassis',
        type: 'Chassis',
        brand: 'Creativia',
        stats: [
            '1. Base HP: 500',
            '2. ATK Multiplier: 1.3×',
            'Ability - Invisibility Cloak: Grants 60% Miss Chance for enemies for 3 Turns',
            'Cost: 13 EN'
        ]
    },
    ChassisGeneralis: {
        name: 'Generalis Chassis',
        type: 'Chassis',
        brand: 'Generalis',
        stats: [
            '1. Base HP: 650',
            '2. ATK Multiplier: 1.0×',
            'Ability - System Overclock: Increases the robot\'s EN Regen by +5 for the next 3 turns',
            'Cost: 5 EN'
        ]
    },
    ChassisInnovare: {
        name: 'Innovare Chassis',
        type: 'Chassis',
        brand: 'Innovare',
        stats: [
            '1. Base HP: 750',
            '2. ATK Multiplier: 1.2×',
            'Ability - Shield Generation: Generates a temporary Shield equal to 30% Max HP',
            'Cost: 5 EN'
        ]
    },
    
    EngineCreativia: {
        name: 'Arc Reactor',
        type: 'Engine',
        brand: 'Creativia',
        stats: [
            '1. HP Multiplier: 0.9×',
            '2. EN Regen Adder: +8 Units'
        ]
    },
    EngineGeneralis: {
        name: 'V12 Engine',
        type: 'Engine',
        brand: 'Generalis',
        stats: [
            '1. HP Multiplier: 1.2×',
            '2. EN Regen Adder: +4 Units'
        ]
    },
    EngineInnovare: {
        name: 'Transformer/Tesla',
        type: 'Engine',
        brand: 'Innovare',
        stats: [
            '1. HP Multiplier: 1.0×',
            '2. EN Regen Adder: +6 Units'
        ]
    },
    
    WheelsCreativia: {
        name: 'Mech Legs',
        type: 'Wheels',
        brand: 'Creativia',
        stats: [
            '1. HP Multiplier: 1.3×',
            '2. EN Regen Adder: −1 Unit',
            'Passive: 90% chance to negate enemy "immobilize" (attack guarantee) debuff',
            'Heal Debuff: 5%'
        ]
    },
    WheelsGeneralis: {
        name: 'Normal Tires',
        type: 'Wheels',
        brand: 'Generalis',
        stats: [
            '1. HP Multiplier: 1.0×',
            '2. EN Regen Adder: +2 Units',
            'Passive: 10% chance to completely negate any damage taken from a Standard Attack',
            'Heal Debuff: none'
        ]
    },
    WheelsInnovare: {
        name: 'Tracks',
        type: 'Wheels',
        brand: 'Innovare',
        stats: [
            '1. HP Multiplier: 1.2×',
            '2. EN Regen Adder: +0 Units',
            'Passive: 50% chance to negate enemy "immobilize" (attack guarantee) debuff',
            'Heal Debuff: 2%'
        ]
    }
};

const SparkAnimation = ({ 
    isActive = false, 
    size = 40, 
    color = COLORS.SPARK_GOLD, 
    count = 8, 
    duration = 1000,
    style = {} 
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
        const radius = size * 1.2;
        
        return {
            left: radius * Math.cos(angle),
            top: radius * Math.sin(angle),
        };
    };

    const renderSparks = () => {
        return animValues.current.map((anim, index) => {
            const position = getSparkPosition(index);
            
            const translateX = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, position.left],
            });
            
            const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, position.top],
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
        <View style={[styles.sparkContainer, { width: size * 2.5, height: size * 2.5 }, style]}>
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

const PartStatsModal = ({ isVisible, onClose, partData }) => {
    if (!partData) return null;

    const partInfo = PART_STATS[partData.partName] || {
        name: partData.partName,
        type: partData.category,
        brand: 'Unknown',
        stats: ['No stats available']
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.statsModalOverlay} onPress={onClose}>
                <Pressable style={styles.statsModalContainer} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.statsModalHeader}>
                        <Text style={styles.statsModalTitle}>{partInfo.name}</Text>
                        <Text style={styles.statsModalSubtitle}>
                            {partInfo.brand} • {partInfo.type}
                        </Text>
                    </View>
                    
                    <ScrollView style={styles.statsContent}>
                        {partInfo.stats.map((stat, index) => (
                            <View key={index} style={styles.statItem}>
                                <Text style={styles.statText}>{stat}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    
                    <View style={styles.statsModalFooter}>
                        <TouchableOpacity style={styles.statsCloseButton} onPress={onClose}>
                            <Text style={styles.statsCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const DropdownModal = ({ isVisible, onClose, options, onSelect, positionStyle }) => (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
            <View style={[styles.dropdownContainer, positionStyle]}>
                {options.map((option, index) => (
                    <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => onSelect(option)}>
                        <Text style={styles.dropdownText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Pressable>
    </Modal>
);

const FilterBox = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.filterBox} onPress={onPress}>
        <Text style={styles.filterText}>{label}: {value}</Text>
    </TouchableOpacity>
);

const PartAppearanceItem = ({ label, isEquipped, onEquip, isUnlocked, onLongPress }) => {
    const [showTapSpark, setShowTapSpark] = useState(false);
    const tapSparkOpacity = useRef(new Animated.Value(0)).current;
    const imageSource = ASSETS.parts[label];
    const partInfo = PART_STATS[label] || { name: label };
    const displayName = partInfo.name || label;
    
    const handlePress = () => {
        if (isUnlocked) {
            setShowTapSpark(true);
            Animated.sequence([
                Animated.timing(tapSparkOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(tapSparkOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowTapSpark(false);
            });
            
            onEquip(label);
        }
    };

    if (!imageSource) return null;

    return (
        <TouchableOpacity 
            style={[styles.partItem, !isUnlocked && styles.lockedPartItem]} 
            onPress={handlePress}
            onLongPress={() => isUnlocked && onLongPress && onLongPress(label)}
            activeOpacity={isUnlocked ? 0.7 : 1}
            disabled={!isUnlocked}
            delayLongPress={500}
        >
            <View style={[
                styles.imageContainer, 
                isEquipped && styles.equippedContainer,
                !isUnlocked && styles.lockedContainer
            ]}>
                <Image 
                    source={imageSource}
                    style={[styles.partImage, !isUnlocked && styles.lockedImage]}
                    resizeMode="contain"
                />
                {showTapSpark && (
                    <Animated.View style={[
                        styles.miniSparkContainer,
                        { opacity: tapSparkOpacity }
                    ]}>
                        <View style={[styles.miniSpark, { backgroundColor: isEquipped ? COLORS.EQUIP_GREEN : COLORS.SPARK_GOLD }]} />
                    </Animated.View>
                )}
                
                {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                        <Image 
                            source={ASSETS.icons.padlock}
                            style={styles.padlockIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.lockText}>LOCKED</Text>
                    </View>
                )}
            </View>
            <Text style={[
                styles.partLabel, 
                isEquipped && styles.equippedText,
                !isUnlocked && styles.lockedText
            ]}>
                {displayName}
            </Text>
        </TouchableOpacity>
    );
};

const CategorySection = ({ title, parts, currentLoadout, onEquip, unlockedParts, selectedType, onPartLongPress }) => {
    const isPartEquipped = (partName) => {
        return Object.values(currentLoadout).includes(partName);
    };

    const unlockedCount = unlockedParts[title]?.length || 0;
    const totalCount = parts.length;
    const filteredParts = parts.filter(partName => {
        if (selectedType === 'All') return true;
        return partName.includes(selectedType);
    });

    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
                {title} 
                <Text style={styles.unlockCount}>
                    {' '}({unlockedCount}/{totalCount} unlocked)
                </Text>
            </Text>
            <View style={styles.partRow}>
                {filteredParts.map((partName) => (
                    <PartAppearanceItem 
                        key={partName} 
                        label={partName} 
                        isEquipped={isPartEquipped(partName)}
                        isUnlocked={unlockedParts[title]?.includes(partName) || false}
                        onEquip={() => onEquip(title, partName)}
                        onLongPress={() => onPartLongPress(title, partName)}
                    />
                ))}
            </View>
        </View>
    );
};

const PresetNavigation = ({ 
    presets, 
    selectedPreset, 
    onSelectPreset,
    onRename,
    onDelete,
    onEquipPreset,
    equippedPreset 
}) => {
    const presetNames = Object.keys(presets);
    const currentIndex = presetNames.indexOf(selectedPreset);
    
    const goToPrevious = () => {
        if (currentIndex > 0) {
            onSelectPreset(presetNames[currentIndex - 1]);
        } else {
            onSelectPreset(presetNames[presetNames.length - 1]); 
        }
    };
    
    const goToNext = () => {
        if (currentIndex < presetNames.length - 1) {
            onSelectPreset(presetNames[currentIndex + 1]);
        } else {
            onSelectPreset(presetNames[0]); 
        }
    };

    const preset = presets[selectedPreset];
    const partsCount = preset ? Object.values(preset).filter(v => v).length : 0;  
    const isEquipped = selectedPreset === equippedPreset;

    return (
        <View style={styles.presetNavigationContainer}>
            <TouchableOpacity style={styles.navArrow} onPress={goToPrevious}>
                <Image 
                    source={ASSETS.icons.leftArrow}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>
            
            <View style={styles.presetDisplay}>
                <Text style={styles.presetName}>{selectedPreset}</Text>
                <Text style={styles.presetPartsCount}>{partsCount} part{partsCount !== 1 ? 's' : ''} equipped</Text>
                <View style={styles.presetActions}>
                    <TouchableOpacity 
                        style={styles.presetActionButton}
                        onPress={() => onRename(selectedPreset)}
                    >
                        <Text style={styles.presetActionText}>Rename</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.presetActionButton, 
                            styles.equipButton,
                            isEquipped && styles.equippedButton
                        ]}
                        onPress={() => onEquipPreset && onEquipPreset(selectedPreset)}
                    >
                        <Text style={[
                            styles.presetActionText, 
                            styles.equipText,
                            isEquipped && styles.equippedTextStyle
                        ]}>
                            {isEquipped ? 'Equipped' : 'Equip'}
                        </Text>
                    </TouchableOpacity>
                    
                    {selectedPreset !== "Default" && (
                        <TouchableOpacity 
                            style={[styles.presetActionButton, styles.deleteButton]}
                            onPress={() => onDelete(selectedPreset)}
                        >
                            <Text style={[styles.presetActionText, styles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.presetIndicator}>
                    {presetNames.map((name, index) => (
                        <View 
                            key={name} 
                            style={[
                                styles.presetDot,
                                name === selectedPreset && styles.presetDotActive,
                                name === equippedPreset && styles.equippedPresetDot     
                            ]}
                        />
                    ))}
                </View>
            </View>
            
            <TouchableOpacity style={styles.navArrow} onPress={goToNext}>
                <Image 
                    source={ASSETS.icons.rightArrow}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </View>
    );
};

function LoadoutScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unlockedParts, setUnlockedParts] = useState(DEFAULT_UNLOCKED_PARTS);
    const [presets, setPresets] = useState({
        Default: { ...DEFAULT_LOADOUT }
    });
    
    const [selectedType, setSelectedType] = useState('All');
    const [selectedPartFilter, setSelectedPartFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [loadout, setLoadout] = useState({ ...DEFAULT_LOADOUT }); 
    const [selectedPreset, setSelectedPreset] = useState("Default"); 
    const [presetNameInput, setPresetNameInput] = useState("");
    const [renameVisible, setRenameVisible] = useState(false);
    const [renameOldName, setRenameOldName] = useState("");
    const [renameInput, setRenameInput] = useState("");
    const [equippedPreset, setEquippedPreset] = useState("Default");
    const [showEquipSpark, setShowEquipSpark] = useState(false);
    const [showPresetSpark, setShowPresetSpark] = useState(false);
    const [showPartStats, setShowPartStats] = useState(false);
    const [selectedPartData, setSelectedPartData] = useState(null);
    
    const deletePresetFromFirebase = async (presetName, user) => {
        const userToUse = user || currentUser;
        if (!userToUse) return false;
        
        const userName = userToUse.uid;
        try {
            const docRef = doc(db, 'Roboquest-Loadout', userName);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const existingPresets = { ...(data.presets || {}) };
                
                // Remove the preset from the object
                delete existingPresets[presetName];
                
                let updatedEquippedPreset = data.equippedPreset || "Default";
                if (updatedEquippedPreset === presetName) {
                    updatedEquippedPreset = "Default";
                }
                
                let updatedSelectedPreset = data.selectedPreset || "Default";
                if (updatedSelectedPreset === presetName) {
                    updatedSelectedPreset = "Default";
                }
                
                // Overwrite the entire document to ensure preset is deleted
                await setDoc(docRef, { 
                    presets: existingPresets,
                    equippedPreset: updatedEquippedPreset,
                    selectedPreset: updatedSelectedPreset
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.log("Error deleting preset from Firebase:", error);
            return false;
        }
    };

    const loadUnlockedParts = async (user) => {
        if (!user) {
            setUnlockedParts(DEFAULT_UNLOCKED_PARTS);
            return;
        }
        
        const userId = user.uid;
        
        try {
            const collectionRef = collection(db, 'Roboquest-Collection');
            const q = query(collectionRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            let unlockedPartsArray = [];
            
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.parts && Array.isArray(data.parts)) {
                        unlockedPartsArray = [...unlockedPartsArray, ...data.parts];
                    }
                });
            }
            
            if (unlockedPartsArray.length === 0) {
                const docRef = doc(db, 'Roboquest-Collection', userId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    unlockedPartsArray = data.parts || [];
                }
            }
            
            if (unlockedPartsArray.length === 0 && user.email) {
                const emailDocRef = doc(db, 'Roboquest-Collection', user.email);
                const emailDocSnap = await getDoc(emailDocRef);
                
                if (emailDocSnap.exists()) {
                    const data = emailDocSnap.data();
                    unlockedPartsArray = data.parts || [];
                }
            }
            
            if (unlockedPartsArray.length === 0) {
                setUnlockedParts(DEFAULT_UNLOCKED_PARTS);
                return;
            }
            
            const organizedParts = {
                Weapon: [],
                Chassis: [],
                Wheels: [],
                Engines: []
            };
            
            unlockedPartsArray.forEach(partName => {
                if (partName.includes('Weapon')) {
                    organizedParts.Weapon.push(partName);
                } else if (partName.includes('Chassis')) {
                    organizedParts.Chassis.push(partName);
                } else if (partName.includes('Wheels')) {
                    organizedParts.Wheels.push(partName);
                } else if (partName.includes('Engine')) {
                    organizedParts.Engines.push(partName);
                }
            });
            
            const merged = { 
                Weapon: [...organizedParts.Weapon, 'WeaponGeneralis'],
                Chassis: [...organizedParts.Chassis, 'ChassisGeneralis'],
                Wheels: [...organizedParts.Wheels, 'WheelsGeneralis'],
                Engines: [...organizedParts.Engines, 'EngineGeneralis']
            };
            Object.keys(merged).forEach(category => {
                merged[category] = [...new Set(merged[category])];
            });
            
            setUnlockedParts(merged);
            
        } catch (error) {
            setUnlockedParts(DEFAULT_UNLOCKED_PARTS);
        }
    };

    const savePresetsToFirebase = async (presetsToSave, user) => {
        const userToUse = user || currentUser;
        if (!userToUse) return;
        
        const userName = userToUse.uid;
        try {
            const docRef = doc(db, 'Roboquest-Loadout', userName);
            await setDoc(docRef, { 
                presets: presetsToSave,
                selectedPreset: selectedPreset,
                equippedPreset: equippedPreset
            }, { merge: true });
        } catch (error) {
            console.log("Error saving presets:", error);
        }
    };

    const loadPresetsAndParts = async (user) => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        
        try {
            const presetsRef = doc(db, 'Roboquest-Loadout', user.uid);
            const presetsSnap = await getDoc(presetsRef);
            
            if (presetsSnap.exists()) {
                const data = presetsSnap.data();
                
                if (data.presets && typeof data.presets === 'object') {
                    const loadedPresets = {
                        Default: data.presets.Default || { ...DEFAULT_LOADOUT },
                        ...data.presets
                    };
                    setPresets(loadedPresets);
                    
                    if (data.selectedPreset && loadedPresets[data.selectedPreset]) {
                        setSelectedPreset(data.selectedPreset);
                        setLoadout({ ...loadedPresets[data.selectedPreset] });
                    } else if (selectedPreset && loadedPresets[selectedPreset]) {
                        setLoadout({ ...loadedPresets[selectedPreset] });
                    } else {
                        setSelectedPreset("Default");
                        setLoadout({ ...loadedPresets.Default || { ...DEFAULT_LOADOUT } });
                    }
                    
                    if (data.equippedPreset && loadedPresets[data.equippedPreset]) {
                        setEquippedPreset(data.equippedPreset);
                    } else {
                        setEquippedPreset("Default");
                    }
                }
            } else {
                setEquippedPreset("Default");
            }
            
            await loadUnlockedParts(user);
        } catch (error) {
            console.log("Error loading data:", error);
            setEquippedPreset("Default");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadPresetsAndParts(user);
            } else {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isFocused && currentUser) {
            loadPresetsAndParts(currentUser);
        }
    }, [isFocused, currentUser]);

    // Spark effect functions
    const triggerEquipSpark = () => {
        setShowEquipSpark(true);
        setTimeout(() => {
            setShowEquipSpark(false);
        }, 1000);
    };

    const triggerPresetSpark = () => {
        setShowPresetSpark(true);
        setTimeout(() => {
            setShowPresetSpark(false);
        }, 1000);
    };

    // Part long press handler
    const handlePartLongPress = (category, partName) => {
        if (!isPartUnlocked(partName)) {
            Alert.alert(
                "Part Locked 🔒",
                `"${partName}" is not unlocked yet.\n\nScan objects in the Camera to unlock new parts, then check your Collection.`,
                [
                    { text: "OK", style: "cancel" },
                    { text: "Go to Collection", onPress: () => navigation.navigate('Collection') }
                ]
            );
            return;
        }
        
        setSelectedPartData({
            partName,
            category
        });
        setShowPartStats(true);
    };

    const getWeaponOffset = () => {
        const weapon = loadout.Weapon;
        const chassis = loadout.Chassis;

        if (!chassis || !weapon) return 0;

        if (chassis === "ChassisInnovare") {
            if (weapon === "WeaponCreativia") return scaleSize(13);
            if (weapon === "WeaponGeneralis") return scaleSize(4);
            if (weapon === "WeaponInnovare") return scaleSize(-4);;
        }

        if (chassis === "ChassisGeneralis") {
            if (weapon === "WeaponCreativia") return scaleSize(4);
            if (weapon === "WeaponGeneralis") return scaleSize(-3);;
            if (weapon === "WeaponInnovare") return scaleSize(-11);
        }
    
        if (chassis === "ChassisCreativia") {
            if (weapon === "WeaponCreativia") return scaleSize(-2);
            if (weapon === "WeaponGeneralis") return scaleSize(-10);
            if (weapon === "WeaponInnovare") return scaleSize(-18);
        }

        return 0;
    };

    const isPartUnlocked = (partName) => {
        const category = partName.includes('Weapon') ? 'Weapon' : 
                        partName.includes('Chassis') ? 'Chassis' :
                        partName.includes('Wheels') ? 'Wheels' : 'Engines';
        
        return unlockedParts[category]?.includes(partName) || false;
    };

    const handleEquip = (category, partName) => {
        if (!isPartUnlocked(partName)) {
            Alert.alert(
                "Part Locked 🔒",
                `"${partName}" is not unlocked yet.\n\nScan objects in the Camera to unlock new parts, then check your Collection.`,
                [
                    { text: "OK", style: "cancel" },
                    { text: "Go to Collection", onPress: () => navigation.navigate('Collection') }
                ]
            );
            return;
        }
        
        const isAlreadyEquipped = loadout[category] === partName;
        const newLoadout = {
            ...loadout,
            [category]: isAlreadyEquipped ? null : partName
        };
        
        setLoadout(newLoadout);
        if (!isAlreadyEquipped) {
            triggerEquipSpark();
        }
        
        if (selectedPreset) {
            const newPresets = {
                ...presets,
                [selectedPreset]: newLoadout
            };
            setPresets(newPresets);
            savePresetsToFirebase(newPresets, currentUser);
        } else {
            setSelectedPreset(null);
        }
    };
    
    const applyPreset = (name) => {
        if (presets[name]) {
            setSelectedPreset(name);
            setLoadout({ ...presets[name] });
            savePresetsToFirebase(presets, currentUser);
        }
    };

    const handleEquipPreset = (presetName) => {
        if (!presets[presetName]) {
            Alert.alert("Error", "Preset not found.");
            return;
        }
        
        setEquippedPreset(presetName);
        setLoadout({ ...presets[presetName] });
        setSelectedPreset(presetName);
        
        // Trigger spark effect
        triggerPresetSpark();
        
        savePresetsToFirebase(presets, currentUser);
        
        Alert.alert(
            "Preset Equipped ✅", 
            `"${presetName}" has been equipped!\n\nThis preset will be displayed in the main menu.`,
            [
                { text: "OK", style: "default" }
            ]
        );
    };

    const savePreset = () => {
        const name = presetNameInput.trim();
        
        if (!name) {
            Alert.alert("Missing Name", "Please enter a preset name.");
            return;
        }
        
        const hasParts = loadout.Chassis || loadout.Engines || loadout.Wheels || loadout.Weapon;
        
        if (!hasParts) {
            Alert.alert("Cannot Save", "Equip at least one part before saving a preset.");
            return;
        }

        if (presets[name] && name !== selectedPreset) {
            Alert.alert(
                "Preset Exists", 
                `A preset named "${name}" already exists. Do you want to overwrite it?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Overwrite", 
                        style: "destructive",
                        onPress: () => {
                            const newPresets = {
                                ...presets,
                                [name]: { ...loadout }
                            };
                            setPresets(newPresets);
                            setSelectedPreset(name); 
                            setPresetNameInput("");
                            savePresetsToFirebase(newPresets, currentUser);
                            Alert.alert("Success", `Preset "${name}" saved!`);
                        }
                    }
                ]
            );
            return;
        }

        const newPresets = {
            ...presets,
            [name]: { ...loadout }
        };
        setPresets(newPresets);
        setSelectedPreset(name); 
        savePresetsToFirebase(newPresets, currentUser);

        setPresetNameInput("");
        Alert.alert("Success", `Preset "${name}" saved!`);
    };

    const deletePreset = async (presetName) => {
        if (presetName === "Default") {
            Alert.alert("Cannot Delete", "The Default preset cannot be deleted.");
            return;
        }

        Alert.alert(
            "Delete Preset",
            `Are you sure you want to delete the "${presetName}" preset?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Delete from Firebase first
                            const firebaseSuccess = await deletePresetFromFirebase(presetName, currentUser);
                            
                            if (!firebaseSuccess) {
                                Alert.alert("Error", "Failed to delete preset from database. Please try again.");
                                return;
                            }
                            
                            // Update local state
                            const updated = { ...presets };
                            delete updated[presetName];
                            setPresets(updated);
                            
                            if (selectedPreset === presetName) {
                                setSelectedPreset("Default");
                                setLoadout(updated.Default || { ...DEFAULT_LOADOUT });
                            }
                            
                            if (equippedPreset === presetName) {
                                setEquippedPreset("Default");
                            }
                            
                            Alert.alert("Success", `Preset "${presetName}" has been deleted.`);
                            
                        } catch (error) {
                            console.log("Error deleting preset:", error);
                            Alert.alert("Error", "An error occurred while deleting the preset. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleRenamePreset = (presetName) => {
        setRenameOldName(presetName);
        setRenameInput(presetName);
        setRenameVisible(true);
    };

    const confirmRename = () => {
        const newName = renameInput.trim();
        if (!newName) {
            Alert.alert("Missing Name", "Please enter a new preset name.");
            return;
        }

        if (presets[newName] && newName !== renameOldName) {
            Alert.alert("Name Exists", `A preset named "${newName}" already exists. Please choose a different name.`);
            return;
        }

        const updated = { ...presets };
        updated[newName] = updated[renameOldName];

        if (renameOldName !== "Default") {
            delete updated[renameOldName];
        }

        setPresets(updated);
        savePresetsToFirebase(updated, currentUser);

        if (selectedPreset === renameOldName) {
            setSelectedPreset(newName);
        }
        
        if (equippedPreset === renameOldName) {
            setEquippedPreset(newName);
        }

        setRenameVisible(false);
    };

    const handleSelectFilter = (key, value) => {
        if (key === 'TypeBox') {
            setSelectedType(value);
        }
        if (key === 'PartBox') setSelectedPartFilter(value);
        setActiveDropdown(null);
    };

    const categoriesToShow = selectedPartFilter === 'All' 
        ? Object.keys(PART_LISTS) 
        : [selectedPartFilter]; 
    
    const equippedWeapon = loadout.Weapon;
    const equippedChassis = loadout.Chassis;
    const equippedEngine = loadout.Engines;
    const equippedWheels = loadout.Wheels;

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: scaleFont(16), marginTop: scaleSize(10) }}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ImageBackground 
                source={ASSETS.backgrounds.loadout}
                style={styles.upperBackground}
                resizeMode="cover"
            >
                <View style={styles.lowerBackground} />
            </ImageBackground>
            
            <View style={styles.sparkOverlay} pointerEvents="none">
                {showEquipSpark && (
                    <SparkAnimation 
                        isActive={showEquipSpark}
                        size={45}
                        color={COLORS.SPARK_GOLD}
                        count={12}
                        duration={800}
                        style={{
                            position: 'absolute',
                            top: SCREEN_HEIGHT * 0.15,
                            left: SCREEN_WIDTH / 2 - 60,
                        }}
                    />
                )}
                
                {showPresetSpark && (
                    <SparkAnimation 
                        isActive={showPresetSpark}
                        size={35}
                        color={COLORS.EQUIP_GREEN}
                        count={10}
                        duration={600}
                        style={{
                            position: 'absolute',
                            top: SCREEN_HEIGHT * 0.42,
                            left: SCREEN_WIDTH / 2 - 45,
                        }}
                    />
                )}
            </View>

            <PartStatsModal
                isVisible={showPartStats}
                onClose={() => setShowPartStats(false)}
                partData={selectedPartData}
            />

            <View style={styles.robotDisplayArea}>
                <View style={styles.robotStage}>
                    {equippedWheels && (
                        <Image source={ASSETS.parts[equippedWheels]} style={[styles.robotLayer, { zIndex: 30 }]} resizeMode="contain" />
                    )}

                    {equippedChassis && (
                        <Image source={ASSETS.parts[equippedChassis]} style={[styles.robotLayer, { zIndex: 10 }]} resizeMode="contain" />
                    )}

                    {equippedEngine && (
                        <Image source={ASSETS.parts[equippedEngine]} style={[styles.robotLayer, { zIndex: 20 }]} resizeMode="contain" />
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
                        />
                    )}

                    {!loadout.Chassis && !loadout.Engines && !loadout.Wheels && !loadout.Weapon && (
                        <Text style={styles.robotPlaceholder}>[Tap parts below to Equip]</Text>
                    )}
                </View>
            </View>

            <View style={styles.presetsContainer}>
                <Text style={styles.sectionTitle}>Presets</Text>
                
                <View style={styles.presetInputContainer}>
                    <TextInput
                        value={presetNameInput}
                        onChangeText={setPresetNameInput}
                        placeholder="Enter preset name"
                        placeholderTextColor={COLORS.TEXT_MUTED}
                        style={styles.presetInput}
                    />

                    <TouchableOpacity
                        onPress={savePreset}
                        style={[
                            styles.saveButton,
                            !presetNameInput.trim() && styles.saveButtonDisabled
                        ]}
                        disabled={!presetNameInput.trim()}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <PresetNavigation 
                    presets={presets}
                    selectedPreset={selectedPreset}
                    onSelectPreset={applyPreset}
                    onRename={handleRenamePreset}
                    onDelete={deletePreset}
                    onEquipPreset={handleEquipPreset}
                    equippedPreset={equippedPreset} 
                />
            </View>

            <View style={styles.filterRow}>
                <FilterBox label="Type" value={selectedType} onPress={() => setActiveDropdown('TypeBox')} />
                <FilterBox label="Part" value={selectedPartFilter} onPress={() => setActiveDropdown('PartBox')} />
            </View>

            <ScrollView style={styles.partsScrollContainer} contentContainerStyle={styles.partsScrollContent}>
                <View style={styles.partsContainer}>
                    {categoriesToShow.map((category) => (
                        <CategorySection 
                            key={category} 
                            title={category} 
                            parts={PART_LISTS[category]}
                            currentLoadout={loadout}
                            onEquip={handleEquip}
                            unlockedParts={unlockedParts}
                            selectedType={selectedType}
                            onPartLongPress={handlePartLongPress}
                        />
                    ))}
                </View>
            </ScrollView>
            
            <Modal
                visible={renameVisible}
                transparent
                animationType="fade"
            >
                <Pressable style={styles.modalBackground} onPress={() => setRenameVisible(false)}>
                    <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}> 
                        <Text style={styles.modalTitle}>Rename Preset</Text>
                        <TextInput
                            value={renameInput}
                            onChangeText={setRenameInput}
                            placeholder="New preset name"
                            placeholderTextColor={COLORS.TEXT_MUTED}
                            style={styles.modalInput}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setRenameVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmRename}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {activeDropdown === 'TypeBox' && (
                <DropdownModal
                    isVisible={true} 
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TypeBox} 
                    onSelect={(v) => handleSelectFilter('TypeBox', v)}
                    positionStyle={{
                        top: scaleSize(320),
                        left: scaleSize(20),
                        zIndex: 1000,
                    }}
                />
            )}
            {activeDropdown === 'PartBox' && (
                <DropdownModal
                    isVisible={true} 
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.PartBox} 
                    onSelect={(v) => handleSelectFilter('PartBox', v)}
                    positionStyle={{
                        top: scaleSize(320),
                        right: scaleSize(20),
                        zIndex: 1000,
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.BACKGROUND,
    },
    upperBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '65%',
        zIndex: 0,
    },
    lowerBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: COLORS.BACKGROUND,
        zIndex: 1,
    },
    sparkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        pointerEvents: 'none',
    },
    sparkContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkElement: {
        position: 'absolute',
    },
    centerGlow: {
        position: 'absolute',
    },
    miniSparkContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    miniSpark: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        opacity: 0.7,
    },
    statsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scaleSize(20),
    },
    statsModalContainer: {
        width: '90%',
        maxWidth: scaleSize(400),
        backgroundColor: COLORS.CARD_BG,
        borderRadius: scaleSize(12),
        overflow: 'hidden',
        maxHeight: '70%',
    },
    statsModalHeader: {
        padding: scaleSize(15),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER,
        backgroundColor: COLORS.MEDIUM_DARK_GRAY,
    },
    statsModalTitle: {
        fontSize: scaleFont(18),
        fontWeight: 'bold',
        color: COLORS.TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: scaleSize(4),
    },
    statsModalSubtitle: {
        fontSize: scaleFont(12),
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: scaleSize(0.5),
    },
    statsContent: {
        maxHeight: SCREEN_HEIGHT * 0.4,
        padding: scaleSize(15),
    },
    statItem: {
        marginBottom: scaleSize(10),
        padding: scaleSize(8),
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: scaleSize(6),
        borderLeftWidth: scaleSize(3),
        borderLeftColor: COLORS.PRIMARY,
    },
    statText: {
        fontSize: scaleFont(12),
        color: COLORS.TEXT_PRIMARY,
        lineHeight: scaleFont(16),
    },
    statsModalFooter: {
        padding: scaleSize(15),
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER,
        backgroundColor: COLORS.MEDIUM_DARK_GRAY,
    },
    statsCloseButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingVertical: scaleSize(10),
        paddingHorizontal: scaleSize(20),
        borderRadius: scaleSize(6),
        alignSelf: 'center',
    },
    statsCloseButtonText: {
        color: COLORS.WHITE,
        fontSize: scaleFont(14),
        fontWeight: 'bold',
    },
    robotDisplayArea: { 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: scaleSize(10),
        paddingVertical: scaleSize(10),
        height: SCREEN_HEIGHT * 0.3, 
        zIndex: 2,
    },
    robotStage: {
        width: SCREEN_WIDTH * 0.9, 
        height: SCREEN_WIDTH * 0.9,
        maxWidth: scaleSize(400),
        maxHeight: scaleSize(500),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    robotLayer: {
        position: 'absolute',
        width: '90%',
        height: '90%',
    },
    weaponImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    robotPlaceholder: { 
        fontSize: scaleFont(14),
        color: COLORS.TEXT_PRIMARY,
        textAlign: 'center',
        paddingHorizontal: scaleSize(20),
    },
    sectionTitle: { 
        fontSize: scaleFont(18),
        fontWeight: 'bold', 
        color: COLORS.TEXT_PRIMARY, 
        marginBottom: scaleSize(8),
        textAlign: 'center',
    },
    unlockCount: {
        fontSize: scaleFont(10),
        color: COLORS.TEXT_MUTED,
        fontWeight: 'normal',
    },
    presetsContainer: {
        width: '95%',
        marginTop: scaleSize(30),
        paddingHorizontal: scaleSize(10),
        backgroundColor: COLORS.CARD_BG,
        marginHorizontal: scaleSize(10),
        borderRadius: scaleSize(8),
        padding: scaleSize(10),
        zIndex: 2,
    },
    presetInputContainer: {
        flexDirection: "row", 
        marginTop: scaleSize(5),
        marginBottom: scaleSize(5)
    },
    presetInput: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: scaleSize(6),
        paddingHorizontal: scaleSize(8),
        height: scaleSize(35),
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        fontSize: scaleFont(12),
        color: COLORS.TEXT_PRIMARY,
    },
    saveButton: {
        marginLeft: scaleSize(8),
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: scaleSize(12),
        borderRadius: scaleSize(6),
        justifyContent: "center",
        minWidth: scaleSize(50),
        alignItems: 'center',
        height: scaleSize(35),
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.ACCENT,
    },
    saveButtonText: {
        color: COLORS.WHITE, 
        fontWeight: "bold", 
        fontSize: scaleFont(12)
    },
    presetNavigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: scaleSize(6),
        padding: scaleSize(8),
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    navArrow: {
        width: scaleSize(28),
        height: scaleSize(28),
        borderRadius: scaleSize(14),
        backgroundColor: COLORS.BUTTON_BG,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    arrowIcon: {
        width: scaleSize(14), 
        height: scaleSize(14), 
        tintColor: COLORS.TEXT_PRIMARY,
    },
    presetDisplay: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: scaleSize(8),
    },
    presetName: {
        fontSize: scaleFont(14),
        fontWeight: 'bold',
        color: COLORS.TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: scaleSize(2),
    },
    presetPartsCount: {
        fontSize: scaleFont(10),
        color: COLORS.TEXT_SECONDARY,
        marginBottom: scaleSize(4),
    },
    presetActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: scaleSize(4),
    },
    presetActionButton: {
        paddingHorizontal: scaleSize(6),
        paddingVertical: scaleSize(3),
        marginHorizontal: scaleSize(3),
        borderRadius: scaleSize(3),
        backgroundColor: COLORS.BUTTON_BG,
        minWidth: scaleSize(50),
    },
    equipButton: {
        backgroundColor: COLORS.MEDIUM_GRAY,
    },
    equippedButton: {
        backgroundColor: COLORS.LIGHT_DARK_GRAY,
        borderWidth: 1,
        borderColor: COLORS.EQUIP_GREEN,
    },
    deleteButton: {
        backgroundColor: COLORS.MEDIUM_GRAY,
    },
    presetActionText: {
        fontSize: scaleFont(9),
        color: COLORS.TEXT_PRIMARY,
        fontWeight: '600',
        textAlign: 'center',
    },
    equipText: {
        color: COLORS.EQUIP_GREEN, 
    },
    equippedTextStyle: {
        color: '#2a9d4b', 
        fontWeight: '700',
    },
    deleteText: {
        color: '#ff3b30',
    },
    presetIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    presetDot: {
        width: scaleSize(4),
        height: scaleSize(4),
        borderRadius: scaleSize(2),
        backgroundColor: COLORS.BORDER,
        marginHorizontal: scaleSize(2),
    },
    presetDotActive: {
        backgroundColor: COLORS.PRIMARY,
        width: scaleSize(5),
        height: scaleSize(5),
        borderRadius: scaleSize(2.5),
    },
    equippedPresetDot: {
        backgroundColor: COLORS.EQUIP_GREEN,
        width: scaleSize(5),
        height: scaleSize(5),
        borderRadius: scaleSize(2.5),
    },
    filterRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-evenly', 
        paddingVertical: scaleSize(8),
        backgroundColor: COLORS.MEDIUM_DARK_GRAY,
        marginBottom: scaleSize(5), 
        marginTop: scaleSize(5),
        marginHorizontal: scaleSize(10),
        borderRadius: scaleSize(8),
        zIndex: 2,
    },
    filterBox: { 
        paddingHorizontal: scaleSize(8),
        paddingVertical: scaleSize(4),
        borderRadius: scaleSize(10),
        backgroundColor: COLORS.ACCENT,
        minWidth: scaleSize(70),
        alignItems: 'center' 
    },
    filterText: { 
        fontSize: scaleFont(10),
        fontWeight: '600', 
        color: COLORS.TEXT_PRIMARY 
    },
    partsScrollContainer: {
        flex: 1,
        zIndex: 2,
        marginTop: scaleSize(5),
    },
    partsScrollContent: {
        paddingBottom: scaleSize(40),
    },
    partsContainer: { 
        paddingHorizontal: scaleSize(10),
        backgroundColor: COLORS.CARD_BG,
        marginHorizontal: scaleSize(10),
        borderRadius: scaleSize(8),
        marginTop: scaleSize(5),
        padding: scaleSize(10),
    },
    categorySection: { 
        marginTop: scaleSize(10), 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.BORDER, 
        paddingBottom: scaleSize(10) 
    },
    categoryTitle: { 
        fontSize: scaleFont(14),
        fontWeight: 'bold', 
        color: COLORS.TEXT_PRIMARY, 
        marginBottom: scaleSize(6),
        textTransform: 'uppercase', 
        letterSpacing: scaleSize(0.5) 
    },
    partRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: scaleSize(5) 
    },
    partItem: { 
        alignItems: 'center', 
        width: SCREEN_WIDTH * 0.28,
        marginBottom: scaleSize(10) 
    },
    lockedPartItem: { 
        opacity: 0.7 
    },
    imageContainer: {
        width: SCREEN_WIDTH * 0.28,
        height: SCREEN_WIDTH * 0.28,
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: scaleSize(8),
        marginBottom: scaleSize(4),
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: COLORS.BORDER,
        overflow: 'hidden',
        position: 'relative',
    },
    lockedContainer: {
        backgroundColor: COLORS.MEDIUM_GRAY,
        borderColor: COLORS.LOCKED,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scaleSize(4), 
    },
    padlockIcon: {
        width: scaleSize(30),
        height: scaleSize(30),
        tintColor: COLORS.TEXT_PRIMARY,
        marginBottom: scaleSize(3), 
    },
    lockText: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: scaleFont(8),
        fontWeight: 'bold',
    },
    partImage: { 
        width: '100%', 
        height: '100%' 
    },
    lockedImage: { 
        opacity: 0.3 
    },
    partLabel: { 
        fontSize: scaleFont(10),
        fontWeight: '600', 
        color: COLORS.TEXT_PRIMARY, 
        textAlign: 'center' 
    },
    lockedText: { 
        color: COLORS.TEXT_MUTED 
    },
    equippedContainer: {
        borderColor: COLORS.SELECTED_BORDER,
        borderWidth: scaleSize(2),
        backgroundColor: COLORS.MEDIUM_DARK_GRAY,
    },
    equippedText: { 
        color: COLORS.SELECTED_BORDER, 
        fontWeight: '700' 
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainer: {
        width: "80%",
        backgroundColor: COLORS.CARD_BG,
        padding: scaleSize(20),
        borderRadius: scaleSize(12)
    },
    modalTitle: {
        fontSize: scaleFont(18), 
        fontWeight: "bold",
        color: COLORS.TEXT_PRIMARY,
        marginBottom: scaleSize(15),
    },
    modalInput: {
        marginTop: scaleSize(15),
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderRadius: scaleSize(8),
        padding: scaleSize(10),
        fontSize: scaleFont(16),
        color: COLORS.TEXT_PRIMARY,
        backgroundColor: COLORS.BACKGROUND,
    },
    modalButtons: {
        flexDirection: "row", 
        marginTop: scaleSize(20), 
        justifyContent: "flex-end" 
    },
    modalCancelText: {
        marginRight: scaleSize(20), 
        fontSize: scaleFont(16),
        color: COLORS.TEXT_SECONDARY,
    },
    modalSaveText: {
        color: COLORS.PRIMARY, 
        fontSize: scaleFont(16), 
        fontWeight: "bold" 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    dropdownContainer: { 
        position: 'absolute', 
        width: scaleSize(140), 
        backgroundColor: COLORS.CARD_BG,
        borderRadius: scaleSize(8), 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: scaleSize(4) }, 
        shadowOpacity: 0.3, 
        shadowRadius: scaleSize(5), 
        paddingVertical: scaleSize(5),
        zIndex: 1000,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    dropdownItem: { 
        paddingVertical: scaleSize(12), 
        paddingHorizontal: scaleSize(15), 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.BORDER 
    },
    dropdownText: { 
        fontSize: scaleFont(14), 
        color: COLORS.TEXT_PRIMARY 
    },
});

export default LoadoutScreen;