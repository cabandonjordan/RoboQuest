import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// --- GUNMETAL GREY COLOR PALETTE ---
const ACCENT_GREY = '#5B676D'; // Medium Gunmetal Grey for buttons
const LIGHT_GREY = '#AAA9AD';  // Lightest Gunmetal Grey for light backgrounds/borders (No longer used in header)
const DARK_GREY_TEXT = '#1F262A'; // Darkest Gunmetal Grey for text
const ICON_TINT_GREY = '#848689'; // Medium-light Grey for inactive/robot icon tint

// --- ASSET ICONS (Only keeping settings) ---
const ICONS = {
    settings: require('./assets/icons/settings.png'),
};

const DROPDOWN_OPTIONS = {
    TierBox: ['Common', 'Rare', 'Legendary'], 
    PartBox: ['Wheels', 'Engines', 'Chassis', 'Weapon'],
    TypeBox: ['Innovare', 'General', 'Creative', 'Engineer'],
};

const DropdownModal = ({ isVisible, onClose, options, onSelect, positionStyle }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={[styles.dropdownContainer, positionStyle]}>
                    {options.map((option, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.dropdownItem} 
                            onPress={() => onSelect(option)}
                        >
                            <Text style={styles.dropdownText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

// Updated FilterBox to use tag-like styling
const FilterBox = ({ value, onPress }) => (
    <TouchableOpacity style={styles.filterBox} onPress={onPress}>
        <Text style={styles.filterText}>{value}</Text>
    </TouchableOpacity>
);

// PartAppearanceItem reverted to use a generic icon (⚙️) and label
const PartAppearanceItem = ({ label }) => (
    <View style={styles.partItem}>
        <Text style={styles.partIcon}>⚙️</Text>
        <Text style={styles.partLabel}>{label}</Text>
    </View>
);


function LoadoutScreen() {
    const navigation = useNavigation();
    
    const [selectedType, setSelectedType] = useState('Innovare');
    const [selectedTier, setSelectedTier] = useState('Rare');
    const [selectedPart, setSelectedPart] = useState('Weapon');

    const [activeDropdown, setActiveDropdown] = useState(null); 

    const PartLists = {
        Weapon: ['IX23', 'IX24', 'IX28'],
        Chassis: ['GC12'],
        Wheels: ['CW10', 'IW10'],
        Engines: ['IE10', 'GE10', 'CE10'],
    };

    const handleSelect = (key, value) => {
        if (key === 'TypeBox') setSelectedType(value);
        if (key === 'TierBox') setSelectedTier(value);
        if (key === 'PartBox') setSelectedPart(value);
        setActiveDropdown(null);
    };

    const Presetlbl = "Preset 1";

    return (
        <SafeAreaView style={styles.safeArea}>
            
            {/* Header: Settings Icon Only */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Image 
                        source={ICONS.settings} 
                        style={styles.settingsIcon} 
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>

            {/* Robot Display Area */}
            <View style={styles.robotDisplayArea}>
                <Text style={styles.robotPlaceholder}>[Robot Icon Placeholder]</Text>
                
                <View style={styles.presetControls}>
                    <TouchableOpacity>
                        <Text style={styles.arrowIcon}>{'<'}</Text>
                    </TouchableOpacity>
                    <View style={styles.presetLabelContainer}>
                        <Text style={styles.presetLabel}>{Presetlbl}</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.arrowIcon}>{'>'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Filter Row */}
            <View style={styles.filterRow}>
                <FilterBox 
                    value={`Type: ${selectedType}`} 
                    onPress={() => setActiveDropdown('TypeBox')} 
                />
                <FilterBox 
                    value={`Tier: ${selectedTier}`} 
                    onPress={() => setActiveDropdown('TierBox')} 
                />
                <FilterBox 
                    value={`Part: ${selectedPart}`} 
                    onPress={() => setActiveDropdown('PartBox')} 
                />
            </View>

            {/* Parts List Area */}
            <View style={styles.partsArea}>
                <View style={styles.partRow}>
                    {(PartLists[selectedPart] || []).map(name => 
                        <PartAppearanceItem key={name} label={name} />
                    )}
                </View>
            </View>

            {/* Dropdown Modals (Positioning adjusted to align under filter boxes) */}
            
            {activeDropdown === 'TypeBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TypeBox}
                    onSelect={(value) => handleSelect('TypeBox', value)}
                    positionStyle={{top: 155, left: 30}}
                />
            )}
            
            {activeDropdown === 'TierBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TierBox}
                    onSelect={(value) => handleSelect('TierBox', value)}
                    positionStyle={{top: 155, left: '35%'}}
                />
            )}
            
            {activeDropdown === 'PartBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.PartBox}
                    onSelect={(value) => handleSelect('PartBox', value)}
                    positionStyle={{top: 155, right: 30}}
                />
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // --- HEADER ---
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
        // REMOVED gray background and border
        // backgroundColor: LIGHT_GREY,
        // borderBottomWidth: 1,
        // borderBottomColor: ACCENT_GREY,
    },
    settingsIcon: {
        width: 30,
        height: 30,
        tintColor: ACCENT_GREY,
    },
    // --- ROBOT DISPLAY ---
    robotDisplayArea: {
        alignItems: 'center',
        paddingVertical: 30,
        flex: 0.5,
        justifyContent: 'space-around',
    },
    robotPlaceholder: {
        fontSize: 18,
        color: ICON_TINT_GREY,
        marginBottom: 20,
    },
    presetControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 10,
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
    // --- FILTER ROW (TAGS) ---
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        backgroundColor: LIGHT_GREY,
        borderBottomWidth: 1,
        borderBottomColor: ICON_TINT_GREY,
    },
    filterBox: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: ACCENT_GREY,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    // --- PARTS AREA ---
    partsArea: {
        flex: 1,
        padding: 20,
    },
    partRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: ICON_TINT_GREY,
    },
    partItem: {
        alignItems: 'center',
        marginRight: 10,
    },
    // Reverted to text icon styling
    partIcon: {
        fontSize: 40,
        color: ICON_TINT_GREY,
        marginBottom: 5,
    },
    partLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: DARK_GREY_TEXT,
        marginTop: 5,
    },
    // --- DROPDOWN MODAL ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    },
    dropdownContainer: {
        position: 'absolute',
        width: 150, 
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: DARK_GREY_TEXT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GREY,
    },
    dropdownText: {
        fontSize: 14,
        color: DARK_GREY_TEXT,
    },
});

export default LoadoutScreen;