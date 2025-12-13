import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import BackgroundMusicManager from './services/BackgroundMusicManager';
import { useAudio } from './contexts/AudioContext';
// Added Firebase imports for Logout and Database operations
import { 
    auth, 
    signOut, 
    updateProfile, 
    db, 
    doc, 
    getDoc, 
    setDoc, 
    deleteDoc, 
    updateDoc 
} from './database/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function BlueButton({ children, style, onPress }) {
  const { playButtonSound } = useAudio();
  
  const handlePress = () => {
    playButtonSound();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity style={[styles.blueButton, style]} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.blueButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}

function SettingsScreen() {
  const navigation = useNavigation();
  const { 
    musicEnabled, 
    setMusicEnabled, 
    sfxEnabled, 
    setSfxEnabled, 
    musicVolume, 
    setMusicVolume, 
    sfxVolume, 
    setSfxVolume,
    playButtonSound
  } = useAudio();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // --- New State for Name Change ---
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const isInitialMount = useRef(true);

  // Control background music playback based on musicEnabled state
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (musicEnabled) {
      BackgroundMusicManager.playMusic();
    } else {
      BackgroundMusicManager.pauseMusic();
    }
  }, [musicEnabled]);

  // Update background music volume when slider changes
  useEffect(() => {
    BackgroundMusicManager.setVolume(musicVolume);
  }, [musicVolume]);

  const handleClose = () => {
    playButtonSound();
    navigation.goBack();
  };

  const handleAudioPress = () => {
    setShowAudioModal(true);
  };

  const handleCloseAudioModal = () => {
    playButtonSound();
    setShowAudioModal(false);
  };

  // Terms of Service handlers
  const handleTosPress = () => {
    playButtonSound();
    setShowTosModal(true);
  };

  const handleCloseTosModal = () => {
    playButtonSound();
    setShowTosModal(false);
  };

  // Privacy Policy handlers
  const handlePrivacyPress = () => {
    playButtonSound();
    setShowPrivacyModal(true);
  };

  const handleClosePrivacyModal = () => {
    playButtonSound();
    setShowPrivacyModal(false);
  };

  // Credits handlers
  const handleCreditsPress = () => {
    playButtonSound();
    setShowCreditsModal(true);
  };

  const handleCloseCreditsModal = () => {
    playButtonSound();
    setShowCreditsModal(false);
  };

  // Replaces handleDeletePress
  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  // Replaces handleCloseDeleteModal
  const handleCloseLogoutModal = () => {
    playButtonSound();
    setShowLogoutModal(false);
  };

  // Replaces handleConfirmDelete
  const handleConfirmLogout = async () => {
    playButtonSound();
    try {
        await signOut(auth);
        setShowLogoutModal(false);
        // Navigate back to LoginScreen and reset history so user can't go back
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
        });
    } catch (error) {
        console.error("Error logging out: ", error);
        setShowLogoutModal(false);
    }
  };

  // --- Change Name Logic ---
  const handleChangeNamePress = () => {
    playButtonSound();
    if (auth.currentUser) {
        setNewName(auth.currentUser.displayName || '');
    }
    setShowNameModal(true);
  };

  const handleCloseNameModal = () => {
    playButtonSound();
    setShowNameModal(false);
    setIsUpdatingName(false);
  };

  // Helper to move a document from one ID to another
  const migrateCollection = async (collectionName, oldId, newId) => {
      try {
          const oldDocRef = doc(db, collectionName, oldId);
          const newDocRef = doc(db, collectionName, newId);
          
          const oldDocSnap = await getDoc(oldDocRef);
          
          if (oldDocSnap.exists()) {
              const data = oldDocSnap.data();
              // Save to new ID
              await setDoc(newDocRef, data);
              // Delete old ID
              await deleteDoc(oldDocRef);
              console.log(`Migrated ${collectionName}: ${oldId} -> ${newId}`);
          }
      } catch (error) {
          console.error(`Error migrating ${collectionName}:`, error);
      }
  };

  const handleSaveName = async () => {
      playButtonSound();
      if (newName.trim().length === 0) {
          Alert.alert("Invalid Name", "Please enter a valid name.");
          return;
      }
      
      setIsUpdatingName(true);

      try {
          const user = auth.currentUser;
          if (user) {
              const oldName = user.displayName;
              const nameToUpdate = newName.trim();

              // 1. Update Firebase Auth Profile
              await updateProfile(user, {
                  displayName: nameToUpdate
              });

              // 2. Update Roboquest-Users (Field Update)
              const userDocRef = doc(db, 'Roboquest-Users', user.uid);
              try {
                  const userSnap = await getDoc(userDocRef);
                  if (userSnap.exists()) {
                      await updateDoc(userDocRef, { username: nameToUpdate });
                  } else {
                      await setDoc(userDocRef, { username: nameToUpdate, email: user.email });
                  }
              } catch (e) {
                  console.log("Error updating user doc:", e);
              }

              // 3. Migrate Collections that rely on Username as the Document ID
              if (oldName && oldName !== nameToUpdate) {
                  // A. Migrate Unlocked Parts
                  // Pattern: Collection 'Roboquest-UnlockedParts', DocID: username
                  await migrateCollection('Roboquest-UnlockedParts', oldName, nameToUpdate);

                  // B. Migrate Boss Stats
                  // Pattern: Collection 'Roboquest-Boss', DocID: username-Roboquest-Boss
                  await migrateCollection(
                      'Roboquest-Boss', 
                      `${oldName}-Roboquest-Boss`, 
                      `${nameToUpdate}-Roboquest-Boss`
                  );
                  
                  // Add any other collections here if they use username as ID
              }

              Alert.alert("Success", "Name updated successfully!");
              setShowNameModal(false);
          }
      } catch (error) {
          console.error("Error updating name:", error);
          Alert.alert("Error", "Could not update name. Please try again.");
      } finally {
          setIsUpdatingName(false);
      }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Settings</Text>

        <View style={styles.modalContent}>

          <View style={styles.gridRow}>
            <BlueButton style={styles.gridItem} onPress={handleAudioPress}>Audio</BlueButton>
            <View style={[styles.blueButton, styles.gridItem, styles.disabledButton]}>
              <Text style={[styles.blueButtonText, styles.disabledButtonText]}>English</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <BlueButton style={styles.gridItem} onPress={handleChangeNamePress}>Change Name</BlueButton>
            {/* Updated button to Log Out */}
            <TouchableOpacity style={[styles.blueButton, styles.gridItem, styles.logoutButton]} onPress={() => { playButtonSound(); handleLogoutPress(); }} activeOpacity={0.8}>
              <Text style={styles.blueButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <View style={styles.gridRowSmall}>
            <BlueButton style={styles.helpItem} onPress={handleTosPress}>Terms of Service</BlueButton>
            <BlueButton style={styles.helpItem} onPress={handlePrivacyPress}>Privacy Policy</BlueButton>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.grayButton} onPress={handleCreditsPress}><Text style={styles.grayText}>Credits</Text></TouchableOpacity>
          </View>
          
        </View>
      </View>

      {/* Audio Settings Modal */}
      {showAudioModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.audioModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseAudioModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.audioModalTitle}>Audio Settings</Text>

            <View style={styles.audioContent}>
              {/* Music Toggle */}
              <View style={styles.audioSection}>
                <Text style={styles.audioLabel}>Music</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, musicEnabled && styles.toggleButtonOn]}
                  onPress={() => { playButtonSound(); setMusicEnabled(!musicEnabled); }}
                >
                  <Text style={styles.toggleText}>{musicEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>

              {/* SFX Toggle */}
              <View style={styles.audioSection}>
                <Text style={styles.audioLabel}>SFX</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, sfxEnabled && styles.toggleButtonOn]}
                  onPress={() => { playButtonSound(); setSfxEnabled(!sfxEnabled); }}
                >
                  <Text style={styles.toggleText}>{sfxEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>

              {/* Music Volume */}
              <View style={styles.volumeSection}>
                <Text style={styles.volumeLabel}>Music Volume</Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={musicVolume}
                    onValueChange={(value) => {
                      setMusicVolume(value);
                      // Automatically toggle Music on/off based on volume
                      if (value === 0) {
                        setMusicEnabled(false);
                      } else if (!musicEnabled) {
                        setMusicEnabled(true);
                      }
                    }}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#a8b8c8"
                    thumbTintColor="#2e7d32"
                  />
                </View>
              </View>

              {/* SFX Volume */}
              <View style={styles.volumeSection}>
                <Text style={styles.volumeLabel}>SFX Volume</Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={sfxVolume}
                    onValueChange={(value) => {
                      setSfxVolume(value);
                      // Automatically toggle SFX on/off based on volume
                      if (value === 0) {
                        setSfxEnabled(false);
                      } else if (!sfxEnabled) {
                        setSfxEnabled(true);
                      }
                    }}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#a8b8c8"
                    thumbTintColor="#2e7d32"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Terms of Service Modal */}
      {showTosModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.policyModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseTosModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.policyModalTitle}>Terms of Service</Text>

            <ScrollView style={styles.policyScrollView} contentContainerStyle={styles.policyContent}>
              <Text style={styles.policyText}>
RoboQuest Terms of Service{"\n"}
Effective Date: January 1, 2026{"\n\n"}

1. Acceptance of Terms{"\n"}
Welcome to RoboQuest! These Terms of Service ("Terms") govern your access to and use of the RoboQuest mobile game application (the "App").{"\n\n"}

By clicking "I Agree" or by accessing or using the App, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the App.{"\n\n"}

2. Eligibility and Access{"\n"}
Age Restriction: You must be at least 13 years old to create an account and play RoboQuest. If you are under 16, you must have parental or legal guardian permission to use the App.{"\n\n"}

Access Revocation: We reserve the right to refuse service, terminate accounts, and restrict access to the App at our sole discretion, without notice, for any reason, including, but not limited to, breach of these Terms.{"\n\n"}

3. App Mechanics and License{"\n"}
A. Limited License{"\n"}
We grant you a limited, non-exclusive, non-transferable, and revocable license to install and use the App for your personal, non-commercial entertainment purposes only, subject to these Terms.{"\n\n"}

B. Camera Feature and Image Use{"\n"}
The App uses your device's camera to allow you to capture images to find and collect in-game items (robot parts and coins).{"\n\n"}

Image Processing: You acknowledge that images captured through the App are processed for the sole purpose of identifying and crediting the corresponding in-game item.{"\n\n"}

No Ownership: You do not acquire any ownership rights to the robot parts, coins, or any other virtual items collected through the App. These items are solely digital content licensed to you by us.{"\n\n"}

4. Virtual Items and Currency{"\n"}
RoboQuest may include virtual currency ("Coins") and virtual items ("Robot Parts").{"\n\n"}

License, Not Purchase: You acknowledge that these virtual items and currency are a limited license right governed by these Terms and are not redeemable for any sum of money or monetary value from us.{"\n\n"}

No Transfer: Virtual items and currency cannot be sold, transferred, or exchanged for real money, goods, or services outside of the App. Any attempt to do so is a violation of these Terms.{"\n\n"}

Forfeiture: All virtual items, Coins, and Robot Parts are forfeited if your account is terminated or suspended for any reason.{"\n\n"}

5. In-App Purchases (IAPs){"\n"}
The App may offer products and services for purchase within the App ("In-App Purchases").{"\n\n"}

Payment: All purchases are handled by the platform provider (e.g., Apple App Store, Google Play Store). You agree to pay all fees and applicable taxes incurred by you or anyone using an account registered to you.{"\n\n"}

Refund Policy: All In-App Purchases are final and non-refundable, except as required by applicable law or as specifically permitted by the platform provider's refund policies.{"\n\n"}

6. User Conduct and Restrictions{"\n"}
You agree that you will not, under any circumstances:{"\n\n"}

Cheat/Exploit: Use, or encourage others to use, any unauthorized third-party software, bots, or exploit to modify the App or interfere with the game experience.{"\n\n"}

Harassment: Harass, abuse, or engage in offensive behavior against other users or our employees.{"\n\n"}

Fraud: Use the App for any illegal or fraudulent activities.{"\n\n"}

Image Misuse: Use the camera feature to capture illegal or harmful content, or content that violates the privacy or publicity rights of others.{"\n\n"}

Reverse Engineer: Attempt to decipher, decompile, or reverse engineer any software comprising or in any way making up a part of the App.{"\n\n"}

7. Intellectual Property Ownership{"\n"}
Our IP: All content within the App, including, but not limited to, graphics, code, designs, and all robot part designs, are owned by [Your Company Name] or its licensors and are protected by intellectual property laws.{"\n\n"}

Trademarks: The name "RoboQuest" and all related logos are trademarks of [Your Company Name]. You are not granted any right to use these trademarks without our prior written consent.{"\n\n"}

8. Termination{"\n"}
We may suspend or terminate your access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the App will immediately cease, and all virtual items associated with your account will be forfeited.{"\n\n"}

9. Disclaimer of Warranties{"\n"}
The App is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the App, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.{"\n\n"}

10. Limitation of Liability{"\n"}
To the maximum extent permitted by applicable law, in no event shall [Your Company Name] or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the App; (ii) any conduct or content of any third party on the App; or (iii) unauthorized access, use, or alteration of your transmissions or content.{"\n\n"}

11. Governing Law{"\n"}
These Terms shall be governed and construed in accordance with the laws of [Insert Governing Jurisdiction, e.g., the State of California], without regard to its conflict of law provisions.{"\n\n"}

12. Changes to Terms{"\n"}
We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least [e.g., 30 days'] notice before any new terms take effect. By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.
              </Text>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Credits Modal */}
      {showCreditsModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.creditsModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseCreditsModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.creditsModalTitle}> RoboQuest Development Team </Text>
            <Text style={styles.creditsSubtitle}>These individuals are the ones who brought RoboQuest to life.</Text>

            <ScrollView style={styles.creditsScrollView} contentContainerStyle={styles.creditsContent}>
              
              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Gillana, John Zachary N.</Text>
                  <View style={styles.leadBadge}>
                    <Text style={styles.leadBadgeText}>⭐ LEAD</Text>
                  </View>
                </View>
                <Text style={styles.creditRole}>Lead Developer</Text>
              </View>

              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Cabandon, Jordan A.</Text>
                </View>
                <Text style={styles.creditRole}>Backend & Game Logics</Text>
              </View>

              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Susan, Joshlee Rash D.</Text>
                </View>
                <Text style={styles.creditRole}>Front End Developer & System Logics</Text>
              </View>

              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Claudio, Karl Jovanne S.</Text>
                </View>
                <Text style={styles.creditRole}>Front End Developer, Sound Design & Music</Text>
              </View>

              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Suan, Noah Gabriel R.</Text>
                </View>
                <Text style={styles.creditRole}>UI/UX Design & Front End Developer</Text>
              </View>

              <View style={styles.creditCard}>
                <View style={styles.creditCardHeader}>
                  <Text style={styles.creditName}>Ologuin, James Andrew S.</Text>
                </View>
                <Text style={styles.creditRole}>Lead UI/UX Design</Text>
              </View>

              <View style={styles.creditsFooter}>
                <Text style={styles.creditsFooterText}>✨ Thank you for playing RoboQuest! ✨</Text>
              </View>

            </ScrollView>
          </View>
        </View>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.policyModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClosePrivacyModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.policyModalTitle}>Privacy Policy</Text>

            <ScrollView style={styles.policyScrollView} contentContainerStyle={styles.policyContent}>
              <Text style={styles.policyText}>
RoboQuest Privacy Policy Statement{"\n"}
Effective Date: January 1, 2026{"\n\n"}

1. Introduction{"\n"}
Welcome to RoboQuest! We are committed to protecting your privacy and providing a safe, enjoyable gaming experience. This Privacy Policy explains how it collects, uses, and discloses information from users of the RoboQuest mobile game application.{"\n\n"}

By using the App, you agree to the collection and use of information in accordance with this policy.{"\n\n"}

2. Information We Collect{"\n"}
We collect information based on how you interact with the App:{"\n\n"}

A. Images/Photos Taken via the App Camera{"\n"}
What we collect: When you use the App's camera feature to capture images for the purpose of collecting robot parts or coins, we process the image data.{"\n\n"}

How we use it: The image is processed locally on your device or on our secure servers only to determine if a collectible robot part or coin is present (e.g., via image recognition technology).{"\n\n"}

Storage and Retention: We do not permanently store the full, original photo/image taken for the collection feature. The photo is immediately discarded after the image analysis is complete and the part/coin is credited to your account.{"\n\n"}

Note: If we ever introduce a feature that requires storing user-uploaded photos (e.g., a sharing feature), we will update this policy and obtain your explicit consent beforehand.{"\n\n"}

B. Gameplay and Usage Data{"\n"}
What we collect: We automatically collect data about your use of the App, such as:{"\n\n"}

Your device identifier (IDFA or Android Advertising ID).{"\n\n"}

Your progress within the game (e.g., parts collected, coins earned, levels completed).{"\n\n"}

How long and how often you use the App and the features you interact with.{"\n\n"}

Crash reports and technical errors.{"\n\n"}

How we use it: To improve the game, troubleshoot technical issues, understand player behavior, and ensure fair gameplay.{"\n\n"}

C. Non-Personal Information{"\n"}
We may collect general, aggregated, and anonymized data that does not directly identify you. This includes statistics about the total number of parts collected globally or the most common devices used to play the game.{"\n\n"}

3. How We Use Your Information{"\n"}
We use the information we collect for the following purposes:{"\n\n"}

To operate the App: To manage your account, track your progress, and provide the core functionality of collecting robot parts and coins.{"\n\n"}

To improve and analyze the App: To understand user trends, fix bugs, and develop new features.{"\n\n"}

For advertising (if applicable): To display advertisements, either from us or third-party ad partners, and to measure the effectiveness of those ads. (See Section 5 regarding third-party service providers).{"\n\n"}

To comply with legal obligations: To meet legal requirements, respond to lawful requests, and enforce our terms of service.{"\n\n"}

4. Disclosure of Your Information{"\n"}
We do not sell your personal information. We only share information in the following limited circumstances:{"\n\n"}

Third-Party Service Providers: We use third-party companies and individuals to facilitate our App, such as those that provide analytics, hosting, advertising, and crash reporting services. These third parties have access to your information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.{"\n\n"}

Legal Requirements: We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to comply with a legal obligation, protect and defend the rights or property of [Your Company Name], or protect the safety of users of the App or the public.{"\n\n"}

Business Transfers: If [Your Company Name] is involved in a merger, acquisition, or asset sale, your information may be transferred as a business asset.{"\n\n"}

5. Third-Party Advertising and Analytics{"\n"}
RoboQuest may use third-party advertising networks and analytics providers. These providers may collect and use certain data about your usage of the App to serve contextual or targeted ads. We encourage you to review the privacy policies of our third-party partners.{"\n\n"}

6. Children's Privacy{"\n"}
RoboQuest is a general-audience game. If you are under the age of 13, you must have parental consent to use the App. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected Personal Data from a child under the age of 13 without verifiable parental consent, we will take steps to remove that information from our servers.{"\n\n"}

7. Security{"\n"}
The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.{"\n\n"}

8. Changes to This Privacy Policy{"\n"}
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy.
              </Text>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Change Name Modal */}
      {showNameModal && (
          <View style={styles.audioModalOverlay}>
              <View style={styles.logoutModalContainer}>
                  <View style={styles.logoutModalHeader}>
                      <Text style={[styles.logoutModalTitle, {color: '#fff'}]}>Change Name</Text>
                      <TouchableOpacity style={[styles.modalCloseButton, {backgroundColor: '#6b9ac4'}]} onPress={handleCloseNameModal}>
                          <Text style={styles.closeText}>✕</Text>
                      </TouchableOpacity>
                  </View>
                  
                  <View style={styles.logoutContent}>
                    {isUpdatingName ? (
                        <View style={{padding: 20, alignItems: 'center'}}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={[styles.logoutSubText, {marginTop: 10}]}>Updating all records...</Text>
                        </View>
                    ) : (
                        <>
                          <Text style={styles.logoutWarningText}>Enter your new display name:</Text>
                          <TextInput 
                              style={styles.nameInput}
                              value={newName}
                              onChangeText={setNewName}
                              placeholder="Player Name"
                              maxLength={15}
                          />
                          
                          <View style={styles.logoutButtonsRow}>
                              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseNameModal}>
                                  <Text style={styles.cancelButtonText}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                  style={[styles.confirmLogoutButton, {backgroundColor: '#4CAF50', borderColor: '#2e7d32'}]} 
                                  onPress={handleSaveName}
                              >
                                  <Text style={styles.confirmLogoutText}>Save</Text>
                              </TouchableOpacity>
                          </View>
                        </>
                    )}
                  </View>
              </View>
          </View>
      )}

      {/* Log Out Confirmation Modal (Replaces Delete Modal) */}
      {showLogoutModal && (
        <View style={styles.audioModalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalHeader}>
              <Text style={styles.logoutModalTitle}>Log Out</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseLogoutModal}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoutContent}>
              <Text style={styles.logoutWarningText}>
                Are you sure you want to log out?
              </Text>
              <Text style={styles.logoutSubText}>
                You will be returned to the login screen.
              </Text>

              <View style={styles.logoutButtonsRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseLogoutModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmLogoutButton} onPress={handleConfirmLogout}>
                  <Text style={styles.confirmLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#f2f7fb',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#bfc9d6',
    overflow: 'hidden',
    paddingTop: 20,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 30,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    flex: 0.48,
    paddingVertical: 16,
  },
  blueButton: {
    backgroundColor: '#6b9ac4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  blueButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  disabledButton: {
    backgroundColor: '#9aa6b3',
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#ddd',
  },
  helpItem: {
    flex: 0.48,
    paddingVertical: 12,
  },
  spacer: {
    height: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d6dee6',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  grayButton: {
    width: '48%',
    backgroundColor: '#9aa6b3',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  grayText: {
    color: '#fff',
    fontWeight: '700',
  },
  playerId: {
    marginTop: 12,
    textAlign: 'center',
    color: '#333',
    fontSize: 12,
  },
  // Audio Modal Styles
  audioModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  audioModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#3d4a56',
    padding: 20,
    paddingTop: 50,
  },
  audioModalTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  audioContent: {
    backgroundColor: '#d4dce4',
    borderRadius: 8,
    padding: 20,
  },
  audioSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  audioLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3e50',
  },
  toggleButton: {
    backgroundColor: '#8b9aa8',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#6a7987',
    minWidth: 120,
  },
  toggleButtonOn: {
    backgroundColor: '#4CAF50',
    borderColor: '#357a38',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  volumeSection: {
    marginBottom: 25,
  },
  volumeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  sliderContainer: {
    backgroundColor: '#a8b8c8',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#8a98a6',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Logout Button Style (formerly Delete Button)
  logoutButton: {
    backgroundColor: '#e74c3c', // Kept red as requested/common for logout
  },
  // Logout Confirmation Modal Styles (formerly Delete Modal)
  logoutModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 380,
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#3d4a56',
    padding: 20,
    paddingTop: 20,
  },
  logoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ff4444',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    backgroundColor: '#d4dce4',
    borderRadius: 8,
    padding: 20,
  },
  logoutWarningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  logoutSubText: {
    fontSize: 14,
    color: '#5a6c7d',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  logoutButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b9ac4',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#4a7a9e',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#c0392b',
  },
  confirmLogoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // New Styles for Input
  nameInput: {
      backgroundColor: '#FFF',
      borderRadius: 8,
      padding: 12,
      fontSize: 18,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: '#8a98a6',
      textAlign: 'center'
  },
  // Policy Modal Styles (Terms of Service & Privacy Policy)
  policyModalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#3d4a56',
    padding: 20,
    paddingTop: 50,
  },
  policyModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  policyScrollView: {
    flex: 1,
    backgroundColor: '#d4dce4',
    borderRadius: 8,
  },
  policyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2d3e50',
    textAlign: 'left',
  },
  // Credits Modal Styles
  creditsModalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: '#2d3e50',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#4a7a9e',
    padding: 20,
    paddingTop: 50,
  },
  creditsModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ffd700',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  creditsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#b8d4f1',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  creditsScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  creditsContent: {
    paddingBottom: 40,
  },
  creditCard: {
    backgroundColor: '#3d5a80',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6b9ac4',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  creditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  creditName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  creditRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98d8c8',
    lineHeight: 20,
  },
  leadBadge: {
    backgroundColor: '#ffd700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  leadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2d3e50',
  },
  creditsFooter: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  creditsFooterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffd700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default SettingsScreen;