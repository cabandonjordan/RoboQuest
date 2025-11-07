import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  // Platform import removed as it was only used for the header
} from 'react-native';
import Slider from '@react-native-community/slider'; // Requires installing '@react-native-community/slider'

function SettingsScreen() {
  // State for Audio Sliders
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [soundFxVolume, setSoundFxVolume] = useState(0.5);

  // State for Miscellaneous Switches
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(false);

  // handleBack function removed

  const handleResetAccount = () => {
    console.log('Account reset initiated...');
    // In a real app, you might show a confirmation modal here
  };

  // Helper component for horizontal line divider
  const Divider = () => <View style={styles.divider} />;

  // Component to simulate the simple text input look from the image
  const LabeledValue = ({ label, value }) => (
    <View style={styles.labeledRow}>
      <Text style={styles.labelText}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* The simulated top bar and header/back button components 
        have been removed to avoid duplication with a navigation stack. 
      */}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* =======================
          Profile Section
        ======================= */}
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.profileContent}>
          <LabeledValue label="Username:" value="MortLover325" />
          <LabeledValue label="Email:" value="mort.more@gmail.com" />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetAccount}>
          <Text style={styles.resetButtonText}>Reset Account</Text>
        </TouchableOpacity>

        <Divider />

        {/* =======================
          Audio Section
        ======================= */}
        <Text style={styles.sectionTitle}>Audio</Text>

        {/* Music Slider */}
        <View style={styles.sliderGroup}>
          <Text style={styles.sliderLabel}>Music</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#777"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#fff"
            value={musicVolume}
            onValueChange={setMusicVolume}
          />
        </View>

        {/* Sound FX Slider */}
        <View style={styles.sliderGroup}>
          <Text style={styles.sliderLabel}>Sound FX</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#777"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#fff"
            value={soundFxVolume}
            onValueChange={setSoundFxVolume}
          />
        </View>

        <Divider />

        {/* =======================
          Miscellaneous Section
        ======================= */}
        <Text style={styles.sectionTitle}>Miscellaneous</Text>

        {/* Notifications Switch */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Notifications</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setNotificationsEnabled}
            value={notificationsEnabled}
          />
        </View>

        {/* Vibrations Switch */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Vibrations</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={vibrationsEnabled ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setVibrationsEnabled}
            value={vibrationsEnabled}
          />
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background for the main content area
  },
  // topBar, topBarTitle, header, backButton, and backIcon styles have been removed
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30, // Keep some padding at the top for visual spacing
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'normal',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  // --- Profile Styles ---
  profileContent: {
    marginBottom: 30,
  },
  labeledRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  labelText: {
    fontSize: 14,
    color: '#555',
  },
  valueContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: '60%',
    marginTop: 5,
  },
  valueText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  resetButton: {
    alignSelf: 'center',
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 30,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#333',
  },
  // --- Divider Style ---
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 40,
  },
  // --- Audio Styles ---
  sliderGroup: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
    // Note: The slider thumb is styled via props (thumbTintColor) to match the white circle.
  },
  // --- Miscellaneous Styles ---
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  switchText: {
    fontSize: 18,
    color: '#555',
  },
});

export default SettingsScreen;