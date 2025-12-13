import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Alert,
  Modal,
  Image
} from "react-native";
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged, updateDoc } from './database/firebase';

// Preload chest images for better performance
const CHEST_IMAGES = {
  common: require('./assets/shop/Common2_Chest.png'),
  rare: require('./assets/shop/Rare1_Chest_Chest.png'),
  legendary: require('./assets/shop/Legendary_Chest_Closed.png'),
};

const COIN_IMAGE = require('./assets/icons/coin.png');

// Part images mapping
const PART_IMAGES = {
  'WeaponInnovare': require('./assets/parts/weapons/WeaponInnovare.png'),
  'WeaponCreativia': require('./assets/parts/weapons/WeaponCreativia.png'),
  'WeaponGeneralis': require('./assets/parts/weapons/WeaponGeneralis.png'),
  'ChassisInnovare': require('./assets/parts/chassis/ChassisInnovare.png'),
  'ChassisCreativia': require('./assets/parts/chassis/ChassisCreativia.png'),
  'ChassisGeneralis': require('./assets/parts/chassis/ChassisGeneralis.png'),
  'WheelsInnovare': require('./assets/parts/wheels/WheelsInnovare.png'),
  'WheelsCreativia': require('./assets/parts/wheels/WheelsCreativia.png'),
  'WheelsGeneralis': require('./assets/parts/wheels/WheelsGeneralis.png'),
  'EngineInnovare': require('./assets/parts/engines/EngineInnovare.png'),
  'EngineCreativia': require('./assets/parts/engines/EngineCreativia.png'),
  'EngineGeneralis': require('./assets/parts/engines/EngineGeneralis.png'),
};

// List of all possible parts (Innovare and Creativia only)
const POSSIBLE_PARTS = [
  'WeaponInnovare', 'WeaponCreativia',
  'ChassisInnovare', 'ChassisCreativia',
  'WheelsInnovare', 'WheelsCreativia',
  'EngineInnovare', 'EngineCreativia'
];

// Quest Types (same as in main menu)
const QUEST_TYPES = {
  DEFEAT_BOSS: 'defeat_boss',
  OBTAIN_PARTS: 'obtain_parts',
  OPEN_LEGENDARY_CHEST: 'open_legendary_chest',
  TAKE_PICTURE: 'take_picture',
  ACQUIRE_PARTS: 'acquire_parts'
};

const ShopScreen = () => {
  const [selectedChest, setSelectedChest] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [scrapCoins, setScrapCoins] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockedParts, setUnlockedParts] = useState([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardResult, setRewardResult] = useState({ type: '', part: '', scrapGained: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const chestScale = useRef(new Animated.Value(1)).current;
  const rewardScale = useRef(new Animated.Value(0)).current;

  // Chest data with different probabilities for unowned parts
  const chestData = [
    { 
      type: "COMMON CHEST", 
      price: 100, 
      id: "common",
      unownedPartProbability: 0.3, // 30% chance for unowned part
    },
    { 
      type: "RARE CHEST", 
      price: 250, 
      id: "rare",
      unownedPartProbability: 0.6, // 60% chance for unowned part
    },
    { 
      type: "LEGENDARY CHEST", 
      price: 750, 
      id: "legendary",
      unownedPartProbability: 0.9, // 90% chance for unowned part
    },
  ];

  // Load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadUserData(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (user) => {
    try {
      setIsLoading(true);
      const userId = user.uid;
      
      // Load scrap coins
      const scrapRef = doc(db, 'Roboquest-Scraps', userId);
      const scrapSnap = await getDoc(scrapRef);
      
      if (scrapSnap.exists()) {
        // User already has scrap coins document
        const userCoins = scrapSnap.data().coins || 0;
        setScrapCoins(userCoins);
      } else {
        // First time - initialize with 0 scrap coins
        await setDoc(scrapRef, { coins: 0 });
        setScrapCoins(0);
      }

      // Load unlocked parts from Collection
      const collectionRef = doc(db, 'Roboquest-Collection', userId);
      const collectionSnap = await getDoc(collectionRef);
      
      if (collectionSnap.exists()) {
        const data = collectionSnap.data();
        setUnlockedParts(data.parts || []);
      } else {
        // Initialize with default parts (WeaponGeneralis, ChassisGeneralis, WheelsGeneralis, EngineGeneralis)
        const defaultParts = ['WeaponGeneralis', 'ChassisGeneralis', 'WheelsGeneralis', 'EngineGeneralis'];
        await setDoc(collectionRef, { parts: defaultParts });
        setUnlockedParts(defaultParts);
      }

    } catch (error) {
      console.log("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChestPress = (chest) => {
    if (scrapCoins < chest.price) {
      Alert.alert(
        "Not Enough Scrap Coins",
        `You need ${chest.price} scrap coins to buy this chest.\nYou have: ${scrapCoins} scrap coins.`
      );
      return;
    }

    Alert.alert(
      `Buy ${chest.type}?`,
      `This will cost ${chest.price} scrap coins.\n\nUnowned part chance: ${Math.round(chest.unownedPartProbability * 100)}%\n\nYou will have ${scrapCoins - chest.price} scrap coins left.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Buy & Open", 
          style: "default",
          onPress: async () => {
            // Deduct coins
            const newScrapCoins = scrapCoins - chest.price;
            setScrapCoins(newScrapCoins);
            setSelectedChest(chest);
            setClickCount(0);
            
            // Save scrap coins to Firebase
            await saveScrapCoins(newScrapCoins);
            
            // Update quest for opening legendary chest
            if (chest.id === 'legendary') {
              await updateQuestProgress(QUEST_TYPES.OPEN_LEGENDARY_CHEST, 1);
            }
          }
        }
      ]
    );
  };

  const saveScrapCoins = async (coins) => {
    if (!currentUser) return;
    
    try {
      const scrapRef = doc(db, 'Roboquest-Scraps', currentUser.uid);
      await setDoc(scrapRef, { coins }, { merge: true });
    } catch (error) {
      console.log("Error saving scrap coins:", error);
    }
  };

  // Update quest progress function
  const updateQuestProgress = async (questType, increment = 1) => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser.uid;
      const questsRef = doc(db, 'Roboquest-Quests', userId);
      const questsSnap = await getDoc(questsRef);
      
      if (questsSnap.exists()) {
        const questsData = questsSnap.data();
        const updatedQuests = questsData.quests.map(quest => {
          if (quest.type === questType && !quest.isClaimed) {
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
        
        console.log(`Quest ${questType} updated successfully`);
      }
    } catch (error) {
      console.log("Error updating quest progress:", error);
    }
  };

  // Update part-related quests
  const updatePartQuests = async (newPart) => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser.uid;
      const questsRef = doc(db, 'Roboquest-Quests', userId);
      const questsSnap = await getDoc(questsRef);
      
      if (questsSnap.exists()) {
        const questsData = questsSnap.data();
        const updatedQuests = questsData.quests.map(quest => {
          // Update obtain_parts quest
          if (quest.type === QUEST_TYPES.OBTAIN_PARTS && !quest.isClaimed) {
            const newProgress = Math.min(quest.progress + 1, quest.target);
            const isNowCompleted = newProgress >= quest.target;
            
            return {
              ...quest,
              progress: newProgress,
              isCompleted: isNowCompleted,
              lastUpdated: new Date().toISOString()
            };
          }
          
          // Update acquire_parts quest
          if (quest.type === QUEST_TYPES.ACQUIRE_PARTS && !quest.isClaimed) {
            // For simplicity, increment by 1 when any new part is acquired
            // In a more complex system, you'd track specific part types
            const newProgress = Math.min(quest.progress + 1, quest.target);
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
        
        console.log("Part-related quests updated successfully");
      }
    } catch (error) {
      console.log("Error updating part quests:", error);
    }
  };

  const getRandomPartWithProbability = (chestType) => {
    // Get chest data based on type
    const chest = chestData.find(c => c.id === chestType);
    const probability = chest ? chest.unownedPartProbability : 0.3;
    
    // Get unowned parts
    const unownedParts = POSSIBLE_PARTS.filter(part => !unlockedParts.includes(part));
    
    // Get owned parts (for fallback)
    const ownedParts = POSSIBLE_PARTS.filter(part => unlockedParts.includes(part));
    
    // Check if there are unowned parts available
    if (unownedParts.length === 0) {
      // All parts are owned, return random owned part
      const randomIndex = Math.floor(Math.random() * ownedParts.length);
      return {
        part: ownedParts[randomIndex],
        wasUnowned: false
      };
    }
    
    // Check if there are owned parts available (for probability calculation)
    if (ownedParts.length === 0) {
      // No parts owned yet, always give unowned
      const randomIndex = Math.floor(Math.random() * unownedParts.length);
      return {
        part: unownedParts[randomIndex],
        wasUnowned: true
      };
    }
    
    // Use probability to decide if we should give an unowned part
    const random = Math.random();
    
    if (random < probability) {
      // Give unowned part
      const randomIndex = Math.floor(Math.random() * unownedParts.length);
      return {
        part: unownedParts[randomIndex],
        wasUnowned: true
      };
    } else {
      // Give owned part
      const randomIndex = Math.floor(Math.random() * ownedParts.length);
      return {
        part: ownedParts[randomIndex],
        wasUnowned: false
      };
    }
  };

  const getRandomScrapAmount = () => {
    return Math.floor(Math.random() * 51) + 50; // Random between 50-100
  };

  const handleOpenAnimation = async () => {
    if (clickCount < 2) {
      setClickCount(clickCount + 1);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]).start();

    } else {
      // Final tap - open chest and get reward
      const { part, wasUnowned } = getRandomPartWithProbability(selectedChest.id);
      const userAlreadyHasPart = unlockedParts.includes(part);
      
      let scrapGained = 0;
      let rewardType = 'part';
      let rewardText = '';

      // Check if part is actually new (double-check with wasUnowned flag)
      const isActuallyNew = wasUnowned && !userAlreadyHasPart;
      
      if (!isActuallyNew) {
        // Either it wasn't meant to be unowned or user already has it
        scrapGained = getRandomScrapAmount();
        rewardType = 'scrap';
        
        if (wasUnowned && userAlreadyHasPart) {
          rewardText = `You already have ${getPartDisplayName(part)}! Converted to ${scrapGained} scrap coins.`;
        } else {
          rewardText = `Duplicate ${getPartDisplayName(part)}! Converted to ${scrapGained} scrap coins.`;
        }
        
        // Add scrap coins
        const newTotalScrap = scrapCoins + scrapGained;
        setScrapCoins(newTotalScrap);
        await saveScrapCoins(newTotalScrap);
        
      } else {
        // New part!
        const updatedParts = [...unlockedParts, part];
        setUnlockedParts(updatedParts);
        rewardType = 'part';
        rewardText = `You got a new part: ${getPartDisplayName(part)}!`;
        
        // Save to Collection in Firebase
        await saveNewPart(part, updatedParts);
        
        // Update quests for obtaining new parts
        await updatePartQuests(part);
      }

      // Show reward animation
      setRewardResult({
        type: rewardType,
        part: part,
        scrapGained: scrapGained,
        text: rewardText,
        wasNew: isActuallyNew
      });
      
      // Chest opening animation
      Animated.sequence([
        Animated.timing(chestScale, {
          toValue: 1.5,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(chestScale, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Show reward modal
        setShowRewardModal(true);
        
        // Animate reward appearing
        Animated.spring(rewardScale, {
          toValue: 1,
          tension: 10,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const saveNewPart = async (newPart, updatedParts) => {
    if (!currentUser) return;
    
    try {
      const collectionRef = doc(db, 'Roboquest-Collection', currentUser.uid);
      await setDoc(collectionRef, { parts: updatedParts }, { merge: true });
      
      // Also update the Loadout presets if needed
      await updateLoadoutPresets();
    } catch (error) {
      console.log("Error saving new part:", error);
    }
  };

  const updateLoadoutPresets = async () => {
    if (!currentUser) return;
    
    try {
      // Load current loadout presets
      const loadoutRef = doc(db, 'Roboquest-Loadout', currentUser.uid);
      const loadoutSnap = await getDoc(loadoutRef);
      
      if (loadoutSnap.exists()) {
        // Presets already exist, no need to update
        return;
      }
      
      // Create default presets for new users
      const defaultPreset = {
        Default: {
          Chassis: 'ChassisGeneralis',
          Engines: 'EngineGeneralis',
          Wheels: 'WheelsGeneralis',
          Weapon: 'WeaponGeneralis'
        }
      };
      
      await setDoc(loadoutRef, { 
        presets: defaultPreset,
        equippedPreset: "Default",
        selectedPreset: "Default"
      });
      
    } catch (error) {
      console.log("Error updating loadout presets:", error);
    }
  };

  const handleCloseReward = () => {
    // Animate reward disappearing
    Animated.timing(rewardScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowRewardModal(false);
      setSelectedChest(null);
      
      // Reset animations
      chestScale.setValue(1);
      rewardScale.setValue(0);
    });
  };

  const getPartDisplayName = (partName) => {
    const partNames = {
      'WeaponInnovare': 'Missile Launcher Arrays',
      'WeaponCreativia': 'Laser Spread',
      'ChassisInnovare': 'Innovare Chassis',
      'ChassisCreativia': 'Creativia Chassis',
      'WheelsInnovare': 'Tracks',
      'WheelsCreativia': 'Mech Legs',
      'EngineInnovare': 'Transformer/Tesla Engine',
      'EngineCreativia': 'Arc Reactor Engine',
      'WeaponGeneralis': 'Twin Anti-Air Guns',
      'ChassisGeneralis': 'Generalis Chassis',
      'WheelsGeneralis': 'Normal Tires',
      'EngineGeneralis': 'V12 Engine'
    };
    
    return partNames[partName] || partName;
  };

  const getPartCategory = (partName) => {
    if (partName.includes('Weapon')) return 'Weapon';
    if (partName.includes('Chassis')) return 'Chassis';
    if (partName.includes('Wheels')) return 'Wheels';
    if (partName.includes('Engine')) return 'Engine';
    return 'Part';
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 0.9) return '#FFD700'; // Gold for 90%+
    if (probability >= 0.6) return '#4A90E2'; // Blue for 60%+
    return '#8B8B8B'; // Gray for 30%
  };

  const getChestColor = (chestId) => {
    switch(chestId) {
      case 'legendary': return '#FFD700';
      case 'rare': return '#4A90E2';
      default: return '#8B8B8B';
    }
  };

  const getChestImage = (chestId) => {
    return CHEST_IMAGES[chestId] || CHEST_IMAGES.common;
  };

  const getPartImage = (partName) => {
    return PART_IMAGES[partName] || PART_IMAGES['ChassisGeneralis'];
  };

  return (
    <View style={styles.wrapper}>
      {/* Scrap Coins Display */}
      <View style={styles.scrapContainer}>
        <View style={styles.coinIcon} />
        <Text style={styles.scrapText}>{scrapCoins} Scrap Coins</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !selectedChest ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Available Chests</Text>
          
          {chestData.map((chest, index) => {
            const probabilityColor = getProbabilityColor(chest.unownedPartProbability);
            const chestColor = getChestColor(chest.id);
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.card,
                  scrapCoins < chest.price && styles.disabledCard,
                  { borderColor: chestColor }
                ]} 
                onPress={() => handleChestPress(chest)}
                disabled={scrapCoins < chest.price}
              >
                <Image 
                  source={getChestImage(chest.id)}
                  style={styles.chestIcon}
                  resizeMode="contain"
                />
                <Text style={styles.chestTitle}>{chest.type}</Text>
                <Text style={styles.price}>{chest.price} Scrap Coins</Text>
                
                <View style={styles.probabilityContainer}>
                  <Text style={styles.probabilityLabel}>New Part Chance:</Text>
                  <Text style={[styles.probabilityValue, { color: probabilityColor }]}>
                    {Math.round(chest.unownedPartProbability * 100)}%
                  </Text>
                </View>
                
                {scrapCoins < chest.price && (
                  <Text style={styles.notEnoughText}>Not enough coins</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.centerChestContainer}>
          <Animated.Image 
            source={getChestImage(selectedChest.id)}
            style={[
              styles.chestIconLarge,
              { 
                transform: [{ scale: chestScale }] 
              }
            ]}
            resizeMode="contain"
          />
          
          <Text style={styles.openText}>
            Tap chest to open ({3 - clickCount} taps left)
          </Text>
          <Text style={styles.chestTypeText}>Opening: {selectedChest.type}</Text>
          <Text style={styles.probabilityText}>
            New part chance: {Math.round(selectedChest.unownedPartProbability * 100)}%
          </Text>

          <TouchableOpacity 
            style={styles.invisibleTouch} 
            onPress={handleOpenAnimation}
            activeOpacity={1}
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedChest(null)}
          >
            <Text style={styles.backButtonText}>Back to Shop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reward Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRewardModal}
        onRequestClose={handleCloseReward}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.rewardContainer,
              { transform: [{ scale: rewardScale }] }
            ]}
          >
            <Text style={styles.rewardTitle}>
              {rewardResult.type === 'part' ? '🎉 New Part Unlocked!' : '💰 Scrap Coins!'}
            </Text>
            
            {rewardResult.type === 'part' ? (
              <View style={styles.partReward}>
                <View style={[
                  styles.partIconContainer,
                  { 
                    borderColor: rewardResult.wasNew ? '#4A90E2' : '#FFD700'
                  }
                ]}>
                  <Image 
                    source={getPartImage(rewardResult.part)}
                    style={styles.partIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.partName}>{getPartDisplayName(rewardResult.part)}</Text>
                <Text style={styles.partCategory}>{getPartCategory(rewardResult.part)}</Text>
                {rewardResult.wasNew && (
                  <Text style={styles.newBadge}>NEW!</Text>
                )}
              </View>
            ) : (
              <View style={styles.scrapReward}>
                <Image 
                  source={COIN_IMAGE}
                  style={styles.coinIconLarge}
                  resizeMode="contain"
                />
                <Text style={styles.scrapAmount}>+{rewardResult.scrapGained}</Text>
                <Text style={styles.scrapLabel}>Scrap Coins</Text>
              </View>
            )}
            
            <Text style={styles.rewardDescription}>
              {rewardResult.text}
            </Text>
            
            <Text style={styles.collectionNote}>
              {rewardResult.type === 'part' 
                ? "Part added to Collection. Equip it in Loadout!"
                : "Scrap coins added to your balance. Use them to buy more chests!"}
            </Text>
            
            <TouchableOpacity 
              style={styles.closeRewardButton}
              onPress={handleCloseReward}
            >
              <Text style={styles.closeRewardText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scrapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  coinIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    marginRight: 10,
  },
  scrapText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#2d2d2d",
    paddingVertical: 25,
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 3,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledCard: {
    opacity: 0.5,
  },
  chestIcon: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  chestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: '#ffffff',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 10,
  },
  probabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  probabilityLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    marginRight: 5,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notEnoughText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 5,
  },
  centerChestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chestIconLarge: {
    width: 200,
    height: 200,
  },
  openText: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "bold",
    color: '#ffffff',
    textAlign: 'center',
  },
  chestTypeText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    fontWeight: '600',
  },
  probabilityText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 5,
    fontWeight: '600',
  },
  invisibleTouch: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#444',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Reward Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#444',
    width: '90%',
    maxWidth: 400,
  },
  rewardTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  partReward: {
    alignItems: 'center',
    marginBottom: 20,
  },
  partIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 15,
    borderWidth: 3,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  partIcon: {
    width: '100%',
    height: '100%',
  },
  partName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  partCategory: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 5,
  },
  newBadge: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scrapReward: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coinIconLarge: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  scrapAmount: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrapLabel: {
    color: '#aaaaaa',
    fontSize: 16,
  },
  rewardDescription: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  collectionNote: {
    color: '#4A90E2',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  closeRewardButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeRewardText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShopScreen;