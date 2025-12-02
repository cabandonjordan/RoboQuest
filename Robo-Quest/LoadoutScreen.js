import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Pressable, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth, db, doc, setDoc, getDoc, onAuthStateChanged } from './database/firebase';

const COLORS = {
    ACCENT_GREY: '#5B676D',
    LIGHT_GREY: '#AAA9AD',
    DARK_GREY_TEXT: '#1F262A',
    ICON_TINT: '#848689',
    WHITE: '#FFFFFF',
    SELECTED_BORDER: '#007AFF',
    LOCKED: '#888888',
};

const ASSETS = {
    icons: {
        settings: require('./assets/icons/settings.png'),
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

    const isInnovare = label.includes('Innovare');
    const isCreativia = label.includes('Creativia');

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
                        <Text style={styles.lockText}>LOCKED</Text>
                        <Text style={styles.unlockHint}>
                            {isInnovare ? 'Scan Innovare object' : 
                             isCreativia ? 'Scan Creativia object' : 
                             'Scan General object'}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[
                styles.partLabel, 
                isEquipped && styles.equippedText,
                !isUnlocked && styles.lockedText
            ]}>
                {label}
                {!isUnlocked && " 🔒"}
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

    // Load unlocked parts from Firebase
    const loadUnlockedParts = async (user) => {
        const userName = user.displayName || user.email;
        try {
            const docRef = doc(db, 'Roboquest-UnlockedParts', userName);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.unlockedParts) {
                    const merged = { ...DEFAULT_UNLOCKED_PARTS };
                    Object.keys(data.unlockedParts).forEach(category => {
                        merged[category] = [...new Set([...merged[category], ...data.unlockedParts[category]])];
                    });
                    setUnlockedParts(merged);
                }
            }
        } catch (error) {
            console.log("Error loading unlocked parts:", error);
        }
    };

    // Load presets and unlocked parts from Firebase
    const loadPresetsAndParts = async (user) => {
        const userName = user.displayName || user.email;
        try {
            // Load presets
            const presetsRef = doc(db, 'Roboquest-Loadout', userName);
            const presetsSnap = await getDoc(presetsRef);
            
            if (presetsSnap.exists()) {
                const data = presetsSnap.data();
                if (data.presets && typeof data.presets === 'object') {
                    const loadedPresets = {
                        Default: data.presets.Default || { ...DEFAULT_LOADOUT },
                        ...data.presets
                    };
                    setPresets(loadedPresets);
                    
                    // IMPORTANT: Apply the currently selected preset
                    if (selectedPreset && loadedPresets[selectedPreset]) {
                        setLoadout({ ...loadedPresets[selectedPreset] });
                    } else {
                        // If selected preset doesn't exist, use Default
                        setSelectedPreset("Default");
                        setLoadout({ ...loadedPresets.Default || { ...DEFAULT_LOADOUT } });
                    }
                }
            }
            
            // Load unlocked parts
            await loadUnlockedParts(user);
        } catch (error) {
            console.log("Error loading data:", error);
        }
    };

    // Save unlocked parts to Firebase
    const saveUnlockedPartsToFirebase = async (partsToSave, user) => {
        const userToUse = user || currentUser;
        if (!userToUse) return;
        
        const userName = userToUse.displayName || userToUse.email;
        try {
            const docRef = doc(db, 'Roboquest-UnlockedParts', userName);
            await setDoc(docRef, { unlockedParts: partsToSave }, { merge: true });
        } catch (error) {
            console.log("Error saving unlocked parts:", error);
        }
    };

    // Save presets to Firebase
    const savePresetsToFirebase = async (presetsToSave, user) => {
        const userToUse = user || currentUser;
        if (!userToUse) return;
        
        const userName = userToUse.displayName || userToUse.email;
        try {
            const docRef = doc(db, 'Roboquest-Loadout', userName);
            await setDoc(docRef, { presets: presetsToSave }, { merge: true });
        } catch (error) {
            console.log("Error saving presets:", error);
        }
    };

    // Load data on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadPresetsAndParts(user);
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Reload when screen is focused
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

    // Check if a specific part is unlocked
    const isPartUnlocked = (partName) => {
        const category = partName.includes('Weapon') ? 'Weapon' : 
                        partName.includes('Chassis') ? 'Chassis' :
                        partName.includes('Wheels') ? 'Wheels' : 'Engines';
        
        return unlockedParts[category]?.includes(partName) || false;
    };

    const handleEquip = (category, partName) => {
        console.log(`Attempting to equip ${partName} to ${category}`);
        
        // Check if part is unlocked
        if (!isPartUnlocked(partName)) {
            Alert.alert(
                "Part Locked 🔒",
                "This part is locked. Use the camera to scan objects and unlock new parts!",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Go to Camera", onPress: () => navigation.navigate('Camera') }
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
        
        // When manually changing equipment, update the selected preset
        if (selectedPreset) {
            const newPresets = {
                ...presets,
                [selectedPreset]: newLoadout
            };
            setPresets(newPresets);
            savePresetsToFirebase(newPresets);
        } else {
            // If no preset is selected, clear selection
            setSelectedPreset(null);
        }
    };
    
    const applyPreset = (name) => {
        console.log(`Applying preset: ${name}`);
        if (presets[name]) {
            setSelectedPreset(name);
            setLoadout({ ...presets[name] });
        }
    };

    const savePreset = () => {
        console.log("=== SAVE PRESET TRIGGERED ===");
        console.log("Preset name input:", presetNameInput);
        console.log("Current loadout:", loadout);
        console.log("Selected preset:", selectedPreset);
        
        const name = presetNameInput.trim();
        
        if (!name) {
            Alert.alert("Missing Name", "Please enter a preset name.");
            return;
        }
        
        const hasParts = loadout.Chassis || loadout.Engines || loadout.Wheels || loadout.Weapon;
        console.log("Has parts equipped:", hasParts);
        
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
                            console.log("Overwriting preset:", name);
                            const newPresets = {
                                ...presets,
                                [name]: { ...loadout }
                            };
                            setPresets(newPresets);
                            savePresetsToFirebase(newPresets);
                            setSelectedPreset(name);
                            setPresetNameInput("");
                            Alert.alert("Success", `Preset "${name}" saved!`);
                        }
                    }
                ]
            );
            return;
        }

        console.log("Saving new preset:", name);
        const newPresets = {
            ...presets,
            [name]: { ...loadout }
        };
        console.log("New presets state:", newPresets);
        setPresets(newPresets);
        savePresetsToFirebase(newPresets);

        setSelectedPreset(name);
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
                        savePresetsToFirebase(updated);
                        
                        if (selectedPreset === presetName) {
                            setSelectedPreset("Default");
                            setLoadout(updated.Default || { ...DEFAULT_LOADOUT });
                        }
                    }
                }
            ]
        );
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
        savePresetsToFirebase(updated);

        if (selectedPreset === renameOldName) {
            setSelectedPreset(newName);
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
                <Text style={{ color: '#000', fontSize: 16, marginTop: 10 }}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Image source={ASSETS.icons.settings} style={styles.settingsIcon} />
                </TouchableOpacity>
            </View>

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
                
                <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <TextInput
                        value={presetNameInput}
                        onChangeText={setPresetNameInput}
                        placeholder="Enter preset name"
                        placeholderTextColor="#999"
                        style={{
                            flex: 1,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            height: 40,
                            borderWidth: 1,
                            borderColor: "#ccc",
                        }}
                    />

                    <TouchableOpacity
                        onPress={savePreset}
                        style={{
                            marginLeft: 10,
                            backgroundColor: presetNameInput.trim() ? "#4B7BEC" : "#ccc",
                            paddingHorizontal: 15,
                            borderRadius: 8,
                            justifyContent: "center",
                            minWidth: 60,
                            alignItems: 'center',
                        }}
                        disabled={!presetNameInput.trim()}
                    >
                        <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScrollView}>
                    {Object.keys(presets).map((presetName) => (
                        <View key={presetName} style={{ marginRight: 10, alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[
                                    styles.presetItem,
                                    selectedPreset === presetName && styles.presetItemSelected
                                ]}
                                onPress={() => applyPreset(presetName)} 
                            >
                                <Text style={[
                                    styles.presetText,
                                    selectedPreset === presetName && styles.presetTextSelected
                                ]}>
                                    {presetName} 
                                    ({Object.values(presets[presetName]).filter(v => v).length} parts)
                                </Text>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setRenameOldName(presetName);
                                        setRenameInput(presetName);
                                        setRenameVisible(true);
                                    }}
                                    style={{ marginRight: 10 }}
                                >
                                    <Text style={{ fontSize: 12, color: "#4B7BEC" }}>Rename</Text>
                                </TouchableOpacity>
                                
                                {presetName !== "Default" && (
                                    <TouchableOpacity
                                        onPress={() => deletePreset(presetName)}
                                    >
                                        <Text style={{ fontSize: 12, color: "#FF3B30" }}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.filterRow}>
                <FilterBox label="Type" value={selectedType} onPress={() => setActiveDropdown('TypeBox')} />
                <FilterBox label="Tier" value={selectedTier} onPress={() => setActiveDropdown('TierBox')} />
                <FilterBox label="Part" value={selectedPartFilter} onPress={() => setActiveDropdown('PartBox')} />
            </View>

            <ScrollView style={styles.partsArea} contentContainerStyle={{ paddingBottom: 40 }}>
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
            
            {/* RENAME MODAL */}
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
                        padding: 20,
                        borderRadius: 12
                    }} onPress={(e) => e.stopPropagation()}> 

                        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                            Rename Preset
                        </Text>

                        <TextInput
                            value={renameInput}
                            onChangeText={setRenameInput}
                            placeholder="New preset name"
                            style={{
                                marginTop: 15,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: 10
                            }}
                        />

                        <View style={{ flexDirection: "row", marginTop: 20, justifyContent: "flex-end" }}>
                            <TouchableOpacity onPress={() => setRenameVisible(false)}>
                                <Text style={{ marginRight: 20, fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={confirmRename}>
                                <Text style={{ color: "#4B7BEC", fontSize: 16, fontWeight: "bold" }}>
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* DROPDOWNS */}
            {activeDropdown === 'TypeBox' && (
                <DropdownModal
                    isVisible={true} onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TypeBox} onSelect={(v) => handleSelectFilter('TypeBox', v)}
                    positionStyle={{top: 155, left: 20}}
                />
            )}
            {activeDropdown === 'TierBox' && (
                <DropdownModal
                    isVisible={true} onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TierBox} onSelect={(v) => handleSelectFilter('TierBox', v)}
                    positionStyle={{top: 155, alignSelf: 'center'}}
                />
            )}
            {activeDropdown === 'PartBox' && (
                <DropdownModal
                    isVisible={true} onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.PartBox} onSelect={(v) => handleSelectFilter('PartBox', v)}
                    positionStyle={{top: 155, right: 20}}
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
    header: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        height: 40,
    },
    settingsIcon: { 
        width: 30, 
        height: 30, 
        tintColor: COLORS.ACCENT_GREY, 
        resizeMode: 'contain' 
    },
    robotDisplayArea: { 
        alignItems: 'center', 
        flex: 0.4, 
        justifyContent: 'center' 
    },
    robotStage: {
        width: 350,
        height: 350,
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
    robotPlaceholder: { 
        fontSize: 16 
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: COLORS.DARK_GREY_TEXT, 
        marginBottom: 5 
    },
    unlockCount: {
        fontSize: 12,
        color: COLORS.LOCKED,
        fontWeight: 'normal',
    },
    presetsContainer: {
        width: '100%',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    presetsScrollView: {
        marginTop: 10,
        paddingVertical: 10,
    },
    presetItem: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
    },
    presetItemSelected: {
        backgroundColor: '#4B7BEC',
    },
    presetText: {
        color: '#333',
        fontSize: 14,
    },
    presetTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    filterRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-evenly', 
        paddingVertical: 15, 
        backgroundColor: COLORS.LIGHT_GREY, 
        marginBottom: 5, 
        marginTop: 10 
    },
    filterBox: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 15, 
        backgroundColor: COLORS.ACCENT_GREY, 
        minWidth: 90, 
        alignItems: 'center' 
    },
    filterText: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: 'white' 
    },
    partsArea: { 
        flex: 1, 
        paddingHorizontal: 20 
    },
    categorySection: { 
        marginTop: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        paddingBottom: 15 
    },
    categoryTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: COLORS.ACCENT_GREY, 
        marginBottom: 10, 
        textTransform: 'uppercase', 
        letterSpacing: 1 
    },
    partRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: 10 
    },
    partItem: { 
        alignItems: 'center', 
        width: 110, 
        marginBottom: 15 
    },
    lockedPartItem: { 
        opacity: 0.7 
    },
    imageContainer: {
        width: 100, 
        height: 100, 
        backgroundColor: '#f9f9f9', 
        borderRadius: 12, 
        marginBottom: 8,
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
        padding: 5,
    },
    lockText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    unlockHint: {
        color: '#FFD700',
        fontSize: 8,
        textAlign: 'center',
    },
    partImage: { 
        width: '85%', 
        height: '85%' 
    },
    lockedImage: { 
        opacity: 0.3 
    },
    partLabel: { 
        fontSize: 12, 
        fontWeight: '600', 
        color: COLORS.DARK_GREY_TEXT, 
        textAlign: 'center' 
    },
    lockedText: { 
        color: COLORS.LOCKED 
    },
    equippedContainer: {
        borderColor: COLORS.SELECTED_BORDER,
        borderWidth: 2,
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
        width: 140, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        elevation: 5, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 3.84, 
        paddingVertical: 5 
    },
    dropdownItem: { 
        paddingVertical: 12, 
        paddingHorizontal: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    dropdownText: { 
        fontSize: 14, 
        color: COLORS.DARK_GREY_TEXT 
    },
});

export default LoadoutScreen;