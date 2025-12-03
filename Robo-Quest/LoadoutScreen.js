import React, { useState, useEffect } from 'react';
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
    Dimensions 
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

const COLORS = {
    ACCENT_GREY: '#5B676D',
    LIGHT_GREY: '#AAA9AD',
    DARK_GREY_TEXT: '#1F262A',
    ICON_TINT: '#848689',
    WHITE: '#FFFFFF',
    SELECTED_BORDER: '#007AFF',
    LOCKED: '#888888',
    PRIMARY: '#4B7BEC',
    EQUIP_GREEN: '#34C759', 
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
    }
};

const PART_LISTS = {
    Weapon: ['WeaponCreativia', 'WeaponGeneralis', 'WeaponInnovare'],
    Chassis: ['ChassisCreativia', 'ChassisGeneralis', 'ChassisInnovare'],
    Wheels: ['WheelsCreativia', 'WheelsGeneralis', 'WheelsInnovare'],
    Engines: ['EngineCreativia', 'EngineGeneralis', 'EngineInnovare'],
};

const DROPDOWN_OPTIONS = {
    TierBox: ['Common', 'Rare', 'Legendary'],
    PartBox: ['All', 'Wheels', 'Engines', 'Chassis', 'Weapon'],
    TypeBox: ['Innovare', 'General', 'Creative', 'Engineer'],
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

const PartAppearanceItem = ({ label, isEquipped, onEquip, isUnlocked }) => {
    const imageSource = ASSETS.parts[label];
    if (!imageSource) return null;

    return (
        <TouchableOpacity 
            style={[styles.partItem, !isUnlocked && styles.lockedPartItem]} 
            onPress={() => isUnlocked && onEquip(label)}
            activeOpacity={isUnlocked ? 0.7 : 1}
            disabled={!isUnlocked}
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
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const CategorySection = ({ title, parts, currentLoadout, onEquip, unlockedParts }) => {
    const isPartEquipped = (partName) => {
        return Object.values(currentLoadout).includes(partName);
    };

    const unlockedCount = unlockedParts[title]?.length || 0;
    const totalCount = parts.length;

    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
                {title} 
                <Text style={styles.unlockCount}>
                    {' '}({unlockedCount}/{totalCount} unlocked)
                </Text>
            </Text>
            <View style={styles.partRow}>
                {parts.map((partName) => (
                    <PartAppearanceItem 
                        key={partName} 
                        label={partName} 
                        isEquipped={isPartEquipped(partName)}
                        isUnlocked={unlockedParts[title]?.includes(partName) || false}
                        onEquip={() => onEquip(title, partName)}
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
                {/* Preset Name - Made smaller */}
                <Text style={styles.presetName}>{selectedPreset}</Text>
                
                {/* Parts Count - Made smaller */}
                <Text style={styles.presetPartsCount}>{partsCount} part{partsCount !== 1 ? 's' : ''} equipped</Text>
                
                {/* Buttons Row - Made smaller - UPDATED with Equip button */}
                <View style={styles.presetActions}>
                    <TouchableOpacity 
                        style={styles.presetActionButton}
                        onPress={() => onRename(selectedPreset)}
                    >
                        <Text style={styles.presetActionText}>Rename</Text>
                    </TouchableOpacity>
                    
                    {/* NEW: Equip Button in the center */}
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
                
                {/* Dots Indicator - Made smaller */}
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
    
    const [selectedType, setSelectedType] = useState('Innovare');
    const [selectedTier, setSelectedTier] = useState('Rare');
    const [selectedPartFilter, setSelectedPartFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState(null); 

    const [loadout, setLoadout] = useState({ ...DEFAULT_LOADOUT }); 
    const [selectedPreset, setSelectedPreset] = useState("Default"); 

    const [presetNameInput, setPresetNameInput] = useState("");
    
    const [renameVisible, setRenameVisible] = useState(false);
    const [renameOldName, setRenameOldName] = useState("");
    const [renameInput, setRenameInput] = useState("");

    const [equippedPreset, setEquippedPreset] = useState("Default");

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

    const getWeaponOffset = () => {
        const weapon = loadout.Weapon;
        const chassis = loadout.Chassis;

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

    const deletePreset = (presetName) => {
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
                    onPress: () => {
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
                        
                        savePresetsToFirebase(updated, currentUser);
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
        if (key === 'TypeBox') setSelectedType(value);
        if (key === 'TierBox') setSelectedTier(value);
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
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ color: '#000', fontSize: scaleFont(16), marginTop: scaleSize(10) }}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            

            {/* Robot Display Area */}
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

            {/* Presets Section - Made smaller */}
            <View style={styles.presetsContainer}>
                <Text style={styles.sectionTitle}>Presets</Text>
                
                {/* New Preset Input */}
                <View style={{ flexDirection: "row", marginTop: scaleSize(5), marginBottom: scaleSize(5) }}>
                    <TextInput
                        value={presetNameInput}
                        onChangeText={setPresetNameInput}
                        placeholder="Enter preset name"
                        placeholderTextColor="#999"
                        style={{
                            flex: 1,
                            backgroundColor: "#fff",
                            borderRadius: scaleSize(8),
                            paddingHorizontal: scaleSize(10),
                            height: scaleSize(35),
                            borderWidth: 1,
                            borderColor: "#ccc",
                            fontSize: scaleFont(13),
                        }}
                    />

                    <TouchableOpacity
                        onPress={savePreset}
                        style={{
                            marginLeft: scaleSize(8),
                            backgroundColor: presetNameInput.trim() ? COLORS.PRIMARY : "#ccc",
                            paddingHorizontal: scaleSize(12),
                            borderRadius: scaleSize(8),
                            justifyContent: "center",
                            minWidth: scaleSize(50),
                            alignItems: 'center',
                            height: scaleSize(35),
                        }}
                        disabled={!presetNameInput.trim()}
                    >
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: scaleFont(13) }}>Save</Text>
                    </TouchableOpacity>
                </View>

                {/* Preset Navigation - Made smaller - UPDATED with onEquipPreset prop */}
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

            {/* Filter Row */}
            <View style={styles.filterRow}>
                <FilterBox label="Type" value={selectedType} onPress={() => setActiveDropdown('TypeBox')} />
                <FilterBox label="Tier" value={selectedTier} onPress={() => setActiveDropdown('TierBox')} />
                <FilterBox label="Part" value={selectedPartFilter} onPress={() => setActiveDropdown('PartBox')} />
            </View>

            {/* Parts Area */}
            <ScrollView style={styles.partsArea} contentContainerStyle={{ paddingBottom: scaleSize(40) }}>
                {categoriesToShow.map((category) => (
                    <CategorySection 
                        key={category} 
                        title={category} 
                        parts={PART_LISTS[category]}
                        currentLoadout={loadout}
                        onEquip={handleEquip}
                        unlockedParts={unlockedParts}
                    />
                ))}
            </ScrollView>
            
            {/* Rename Modal */}
            <Modal
                visible={renameVisible}
                transparent
                animationType="fade"
            >
                <Pressable style={{ 
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center"
                }} onPress={() => setRenameVisible(false)}>
                    <Pressable style={{
                        width: "80%",
                        backgroundColor: "#fff",
                        padding: scaleSize(20),
                        borderRadius: scaleSize(12)
                    }} onPress={(e) => e.stopPropagation()}> 

                        <Text style={{ fontSize: scaleFont(18), fontWeight: "bold" }}>
                            Rename Preset
                        </Text>

                        <TextInput
                            value={renameInput}
                            onChangeText={setRenameInput}
                            placeholder="New preset name"
                            style={{
                                marginTop: scaleSize(15),
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: scaleSize(8),
                                padding: scaleSize(10),
                                fontSize: scaleFont(16)
                            }}
                        />

                        <View style={{ flexDirection: "row", marginTop: scaleSize(20), justifyContent: "flex-end" }}>
                            <TouchableOpacity onPress={() => setRenameVisible(false)}>
                                <Text style={{ marginRight: scaleSize(20), fontSize: scaleFont(16) }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={confirmRename}>
                                <Text style={{ color: COLORS.PRIMARY, fontSize: scaleFont(16), fontWeight: "bold" }}>
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Dropdown Modals */}
            {activeDropdown === 'TypeBox' && (
                <DropdownModal
                    isVisible={true} 
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TypeBox} 
                    onSelect={(v) => handleSelectFilter('TypeBox', v)}
                    positionStyle={{top: scaleSize(125), left: scaleSize(20)}}
                />
            )}
            {activeDropdown === 'TierBox' && (
                <DropdownModal
                    isVisible={true} 
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TierBox} 
                    onSelect={(v) => handleSelectFilter('TierBox', v)}
                    positionStyle={{top: scaleSize(125), alignSelf: 'center'}}
                />
            )}
            {activeDropdown === 'PartBox' && (
                <DropdownModal
                    isVisible={true} 
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.PartBox} 
                    onSelect={(v) => handleSelectFilter('PartBox', v)}
                    positionStyle={{top: scaleSize(125), right: scaleSize(20)}}
                />
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.WHITE 
    },
    robotDisplayArea: { 
        alignItems: 'center', 
        flex: 0.4, 
        justifyContent: 'center',
        marginTop: scaleSize(20), 
    },
    robotStage: {
        width: SCREEN_WIDTH * 0.7,
        height: SCREEN_WIDTH * 0.7,
        maxWidth: scaleSize(350),
        maxHeight: scaleSize(350),
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
        fontSize: scaleFont(16),
        color: COLORS.DARK_GREY_TEXT,
        textAlign: 'center',
        paddingHorizontal: scaleSize(20),
    },
    sectionTitle: { 
        fontSize: scaleFont(16),    
        fontWeight: 'bold', 
        color: COLORS.DARK_GREY_TEXT, 
        marginBottom: scaleSize(3)  
    },
    unlockCount: {
        fontSize: scaleFont(11), 
        color: COLORS.LOCKED,
        fontWeight: 'normal',
    },
    presetsContainer: {
        width: '100%',
        marginTop: scaleSize(5), 
        paddingHorizontal: scaleSize(10),
    },
    presetNavigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: scaleSize(5), 
        backgroundColor: '#f8f9fa',
        borderRadius: scaleSize(8), 
        padding: scaleSize(10), 
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    navArrow: {
        width: scaleSize(32), 
        height: scaleSize(32), 
        borderRadius: scaleSize(16), 
        backgroundColor: COLORS.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scaleSize(1) }, 
        shadowOpacity: 0.1,
        shadowRadius: scaleSize(2), 
        elevation: 1, 
    },
    arrowIcon: {
        width: scaleSize(16), 
        height: scaleSize(16),  
        tintColor: COLORS.ACCENT_GREY,
    },
    presetDisplay: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: scaleSize(10), 
    },
    presetName: {
        fontSize: scaleFont(16), 
        fontWeight: 'bold',
        color: COLORS.DARK_GREY_TEXT,
        textAlign: 'center',
        marginBottom: scaleSize(3),     
    },
    presetPartsCount: {
        fontSize: scaleFont(12),    
        color: COLORS.ACCENT_GREY,
        marginBottom: scaleSize(6),     
    },
    presetActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: scaleSize(6), 
    },
    presetActionButton: {
        paddingHorizontal: scaleSize(8),    
        paddingVertical: scaleSize(4), 
        marginHorizontal: scaleSize(4), 
        borderRadius: scaleSize(4), 
        backgroundColor: '#e7f3ff',
        minWidth: scaleSize(60),        
    },
        
    equipButton: {
        backgroundColor: '#e6f7e9',     
    },
    equippedButton: {
        backgroundColor: '#d4f1d8',     
        borderWidth: 1,
        borderColor: COLORS.EQUIP_GREEN,
    },
    deleteButton: {
        backgroundColor: '#ffeaea',
    },
    presetActionText: {
        fontSize: scaleFont(11), 
        color: COLORS.PRIMARY,
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
        width: scaleSize(5), 
        height: scaleSize(5), 
        borderRadius: scaleSize(2.5), 
        backgroundColor: '#dee2e6',
        marginHorizontal: scaleSize(2), 
    },
    presetDotActive: {
        backgroundColor: COLORS.PRIMARY,
        width: scaleSize(6), 
        height: scaleSize(6), 
        borderRadius: scaleSize(3), 
    },
    equippedPresetDot: {
        backgroundColor: COLORS.EQUIP_GREEN,
        width: scaleSize(6), 
        height: scaleSize(6),
        borderRadius: scaleSize(3),
    },
    filterRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-evenly', 
        paddingVertical: scaleSize(12), 
        backgroundColor: COLORS.LIGHT_GREY, 
        marginBottom: scaleSize(5), 
        marginTop: scaleSize(5) 
    },
    filterBox: { 
        paddingHorizontal: scaleSize(10),   
        paddingVertical: scaleSize(5), 
        borderRadius: scaleSize(12), 
        backgroundColor: COLORS.ACCENT_GREY, 
        minWidth: scaleSize(80),    
        alignItems: 'center' 
    },
    filterText: { 
        fontSize: scaleFont(12), 
        fontWeight: '600', 
        color: 'white' 
    },
    partsArea: { 
        flex: 1, 
        paddingHorizontal: scaleSize(15) 
    },
    categorySection: { 
        marginTop: scaleSize(12), 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        paddingBottom: scaleSize(12) 
    },
    categoryTitle: { 
        fontSize: scaleFont(16), 
        fontWeight: 'bold', 
        color: COLORS.ACCENT_GREY, 
        marginBottom: scaleSize(8), 
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
        marginBottom: scaleSize(12) 
    },
    lockedPartItem: { 
        opacity: 0.7 
    },
    imageContainer: {
        width: SCREEN_WIDTH * 0.28,
        height: SCREEN_WIDTH * 0.28,
        backgroundColor: '#f9f9f9', 
        borderRadius: scaleSize(10), 
        marginBottom: scaleSize(6), 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: COLORS.LIGHT_GREY,
        overflow: 'hidden',
        position: 'relative',
    },
    lockedContainer: {
        backgroundColor: '#e0e0e0',
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
        width: scaleSize(35), 
        height: scaleSize(35), 
        tintColor: 'white',
        marginBottom: scaleSize(3), 
    },
    lockText: {
        color: 'white',
        fontSize: scaleFont(9),
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
        fontSize: scaleFont(11), 
        fontWeight: '600', 
        color: COLORS.DARK_GREY_TEXT, 
        textAlign: 'center' 
    },
    lockedText: { 
        color: COLORS.LOCKED 
    },
    equippedContainer: {
        borderColor: COLORS.SELECTED_BORDER,
        borderWidth: scaleSize(2),
        backgroundColor: '#E3F2FD',
    },
    equippedText: { 
        color: COLORS.SELECTED_BORDER, 
        fontWeight: '700' 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.2)' 
    },
    dropdownContainer: { 
        position: 'absolute', 
        width: scaleSize(140), 
        backgroundColor: 'white', 
        borderRadius: scaleSize(8), 
        elevation: 5, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: scaleSize(2) }, 
        shadowOpacity: 0.25, 
        shadowRadius: scaleSize(3.84), 
        paddingVertical: scaleSize(5) 
    },
    dropdownItem: { 
        paddingVertical: scaleSize(12), 
        paddingHorizontal: scaleSize(15), 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    dropdownText: { 
        fontSize: scaleFont(14), 
        color: COLORS.DARK_GREY_TEXT 
    },
});

export default LoadoutScreen;