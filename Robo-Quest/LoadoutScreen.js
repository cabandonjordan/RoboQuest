import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Pressable } from 'react-native';

const DROPDOWN_OPTIONS = {

    TierBox: ['Common', 'Rare', 'Legendary'], 
    PartBox: ['Wheels', 'Engines', 'Chasis', 'Weapon'],
    TypeBox: ['General', 'Creative', 'Engineer'],
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

const FilterBox = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.filterBox} onPress={onPress}>
        <Text style={styles.filterText}>{label}: {value}</Text>
    </TouchableOpacity>
);

const PartAppearanceItem = ({ label }) => (
    <View style={styles.partItem}>
        <Text style={styles.partIcon}>🤖</Text>
        <Text style={styles.partLabel}>{label}</Text>
    </View>
);


function LoadoutScreen({ navigation }) {
    const [selectedType, setSelectedType] = useState('Innovare');
    const [selectedTier, setSelectedTier] = useState('Rare');
    const [selectedPart, setSelectedPart] = useState('Weapon');

    const [activeDropdown, setActiveDropdown] = useState(null); 

    const PartLists = {
        Weapon: ['IX23', 'IX24', 'IX28'],
        Chasis: ['GC12'],
        Wheels: ['CW10', 'IW10'],
        Engines: ['EN01', 'EN02'],
    };

    const handleSelect = (key, value) => {
        if (key === 'TypeBox') setSelectedType(value);
        if (key === 'TierBox') setSelectedTier(value);
        if (key === 'PartBox') setSelectedPart(value);
        setActiveDropdown(null);
    };

    const Presetlbl = "Preset 1";
    const RobotAppearance = <Text style={styles.robotPlaceholder}>[Robot Appearance Placeholder]</Text>;

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.headerIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.robotDisplayArea}>
                {RobotAppearance}
                <View style={styles.presetControls}>
                    <Text style={styles.arrowIcon}>{'<'}</Text> 
                    <Text style={styles.presetLabel}>{Presetlbl}</Text> 
                    <Text style={styles.arrowIcon}>{'>'}</Text> 
                </View>
            </View>
            
            <View style={styles.filterRow}>
                <FilterBox 
                    label="Type" 
                    value={selectedType} 
                    onPress={() => setActiveDropdown('TypeBox')} 
                />
                <FilterBox 
                    label="Tier" 
                    value={selectedTier} 
                    onPress={() => setActiveDropdown('TierBox')} 
                />
                <FilterBox 
                    label="Part" 
                    value={selectedPart} 
                    onPress={() => setActiveDropdown('PartBox')} 
                />
            </View>

            <View style={styles.partsArea}>
                <Text style={styles.sectionTitle}>Parts: {selectedPart}</Text>
                <View style={styles.partRow}>
                    {(PartLists[selectedPart] || []).map(name => 
                        <PartAppearanceItem key={name} label={name} />
                    )}
                </View>
            </View>

            
            {activeDropdown === 'TypeBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TypeBox}
                    onSelect={(value) => handleSelect('TypeBox', value)}
                    positionStyle={{top: 150, left: 50}} // Adjust position manually
                />
            )}
            
            {activeDropdown === 'TierBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.TierBox}
                    onSelect={(value) => handleSelect('TierBox', value)}
                    positionStyle={{top: 150, alignSelf: 'center'}} 
                />
            )}
            
        
            {activeDropdown === 'PartBox' && (
                <DropdownModal
                    isVisible={true}
                    onClose={() => setActiveDropdown(null)}
                    options={DROPDOWN_OPTIONS.PartBox}
                    onSelect={(value) => handleSelect('PartBox', value)}
                    positionStyle={{top: 150, right: 50}} 
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
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end', 
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
    },
    headerIcon: {
        fontSize: 30, 
        color: 'gray',
    },
    robotDisplayArea: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    robotPlaceholder: {
        fontSize: 18,
        color: '#888',
        marginBottom: 20,
    },
    presetControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    arrowIcon: {
        fontSize: 24,
        color: 'gray',
    },
    presetLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingVertical: 5,
        backgroundColor: '#ccc',
        borderRadius: 5,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterBox: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: '#ddd',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    partsArea: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        paddingHorizontal: 10,
    },
    partRow: {
        flexDirection: 'row',
        gap: 15,
        paddingVertical: 10,
    },
    partItem: {
        alignItems: 'center',
    },
    partIcon: {
        fontSize: 40, 
        color: 'gray',
    },
    partLabel: {
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
        justifyContent: 'flex-start', 
        alignItems: 'flex-start', 
    },
    dropdownContainer: {
        position: 'absolute',
        width: 150, 
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownText: {
        fontSize: 14,
        color: '#333',
    },
});

export default LoadoutScreen;