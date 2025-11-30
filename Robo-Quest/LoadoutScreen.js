import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Pressable, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db, doc, setDoc, getDoc, onAuthStateChanged } from './database/firebase';

const COLORS = {
    ACCENT_GREY: '#5B676D',
    LIGHT_GREY: '#AAA9AD',
    DARK_GREY_TEXT: '#1F262A',
    ICON_TINT: '#848689',
    WHITE: '#FFFFFF',
    SELECTED_BORDER: '#007AFF',
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

const PartAppearanceItem = ({ label, isEquipped, onEquip }) => {
    const imageSource = ASSETS.parts[label];
    if (!imageSource) return null;

    return (
        <TouchableOpacity 
            style={styles.partItem} 
            onPress={() => onEquip(label)}
            activeOpacity={0.7}
        >
            <View style={[styles.imageContainer, isEquipped && styles.equippedContainer]}>
                <Image 
                    source={imageSource}
                    style={styles.partImage}
                    resizeMode="contain"
                />
            </View>
            <Text style={[styles.partLabel, isEquipped && styles.equippedText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const CategorySection = ({ title, parts, currentLoadout, onEquip }) => {
    const isPartEquipped = (partName) => {
        return Object.values(currentLoadout).includes(partName);
    };

    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <View style={styles.partRow}>
                {parts.map((partName) => (
                    <PartAppearanceItem 
                        key={partName} 
                        label={partName} 
                        isEquipped={isPartEquipped(partName)}
                        onEquip={() => onEquip(title, partName)}
                    />
                ))}
            </View>
        </View>
    );
};

const DEFAULT_LOADOUT = {
    Chassis: 'ChassisGeneralis',
    Engines: 'EngineGeneralis',
    Wheels: 'WheelsGeneralis',
    Weapon: 'WeaponGeneralis'
};

function LoadoutScreen() {
    const navigation = useNavigation();
    
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
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

    // Load presets from Firebase on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const userName = user.displayName || user.email;
                try {
                    const docRef = doc(db, 'Roboquest-Loadout', userName);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.presets && typeof data.presets === 'object') {
                            const loadedPresets = {
                                Default: data.presets.Default || { ...DEFAULT_LOADOUT },
                                ...data.presets
                            };
                            setPresets(loadedPresets);
                            setLoadout(loadedPresets.Default || { ...DEFAULT_LOADOUT });
                        }
                    }
                } catch (error) {
                    console.log("Error loading presets:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

    const handleEquip = (category, partName) => {
        console.log(`Equipping ${partName} to ${category}`);
        
        const isAlreadyEquipped = loadout[category] === partName;
        const newLoadout = {
            ...loadout,
            [category]: isAlreadyEquipped ? null : partName
        };
        
        setLoadout(newLoadout);
        
        // Auto-save to selected preset (including Default)
        if (selectedPreset) {
            const newPresets = {
                ...presets,
                [selectedPreset]: newLoadout
            };
            setPresets(newPresets);
            savePresetsToFirebase(newPresets);
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

    // Show loading screen while fetching data
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 10 }}>Loading...</Text>
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

            <View style={{ padding: 10, backgroundColor: '#000000', margin: 0, borderRadius: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Equip Info:</Text>
                <Text style={{ fontSize: 10 }}>Selected Preset: {selectedPreset}</Text>
                <Text style={{ fontSize: 10 }}>Preset Input: "{presetNameInput}"</Text>
                <Text style={{ fontSize: 10 }}>Loadout: {JSON.stringify(loadout)}</Text>
                <Text style={{ fontSize: 10 }}>Preset Count: {Object.keys(presets).length}</Text>
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
                    />
                ))}
            </ScrollView>
            
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
    safeArea: { flex: 1, backgroundColor: COLORS.WHITE },
    header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10, height: 50 },
    settingsIcon: { width: 30, height: 30, tintColor: COLORS.ACCENT_GREY, resizeMode: 'contain' },
    robotDisplayArea: { alignItems: 'center', flex: 0.45, justifyContent: 'center', },
    robotStage: {
        width: 400,
        height: 400,
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
    robotPlaceholder: { fontSize: 16,},
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: COLORS.DARK_GREY_TEXT, 
        marginBottom: 5 
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
    filterRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 15, backgroundColor: COLORS.LIGHT_GREY, marginBottom: 5, marginTop: 10 },
    filterBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: COLORS.ACCENT_GREY, minWidth: 90, alignItems: 'center' },
    filterText: { fontSize: 13, fontWeight: '600', color: 'white' },
    partsArea: { flex: 1, paddingHorizontal: 20 },
    categorySection: { marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
    categoryTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.ACCENT_GREY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    partRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
    partItem: { alignItems: 'center', width: 110, marginBottom: 15 },
    imageContainer: {
        width: 100, height: 100, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: 8,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.LIGHT_GREY,
    },
    equippedContainer: {
        borderColor: COLORS.SELECTED_BORDER,
        borderWidth: 2,
        backgroundColor: '#E3F2FD',
    },
    partImage: { width: '85%', height: '85%' },
    partLabel: { fontSize: 12, fontWeight: '600', color: COLORS.DARK_GREY_TEXT, textAlign: 'center' },
    equippedText: { color: COLORS.SELECTED_BORDER, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    dropdownContainer: { position: 'absolute', width: 140, backgroundColor: 'white', borderRadius: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, paddingVertical: 5 },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    dropdownText: { fontSize: 14, color: COLORS.DARK_GREY_TEXT },
});

export default LoadoutScreen;
