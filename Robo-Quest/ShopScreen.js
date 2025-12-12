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
  Modal
} from "react-native";
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from './database/firebase';

const POSSIBLE_PARTS = [
  'WeaponInnovare', 'WeaponCreativia',
  'ChassisInnovare', 'ChassisCreativia',
  'WheelsInnovare', 'WheelsCreativia',
  'EngineInnovare', 'EngineCreativia'
];

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

  const chestData = [
    { 
      type: "Common Chest", 
      price: 100, 
      id: "common",
      unownedPartProbability: 0.3, 
    },
    { 
      type: "RARE Chest", 
      price: 250, 
      id: "rare",
      unownedPartProbability: 0.6, 
    },
    { 
      type: "LEGENDARY Chest", 
      price: 750, 
      id: "legendary",
      unownedPartProbability: 0.9, 
    },
  ];

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
      
      const scrapRef = doc(db, 'Roboquest-Scrap', userId);
      const scrapSnap = await getDoc(scrapRef);
      if (scrapSnap.exists()) {
        const userCoins = scrapSnap.data().coins || 0;
        setScrapCoins(userCoins);
      } else {
        await setDoc(scrapRef, { coins: 0 });
        setScrapCoins(0);
      }

      const collectionRef = doc(db, 'Roboquest-Collection', userId);
      const collectionSnap = await getDoc(collectionRef);
      
      if (collectionSnap.exists()) {
        const data = collectionSnap.data();
        setUnlockedParts(data.parts || []);
      } else {
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
          onPress: () => {
            const newScrapCoins = scrapCoins - chest.price;
            setScrapCoins(newScrapCoins);
            setSelectedChest(chest);
            setClickCount(0);
            saveScrapCoins(newScrapCoins);
          }
        }
      ]
    );
  };

  const saveScrapCoins = async (coins) => {
    if (!currentUser) return;
    
    try {
      const scrapRef = doc(db, 'Roboquest-Scrap', currentUser.uid);
      await setDoc(scrapRef, { coins }, { merge: true });
    } catch (error) {
      console.log("Error saving scrap coins:", error);
    }
  };

  const getRandomPartWithProbability = (chestType) => {
    const chest = chestData.find(c => c.id === chestType);
    const probability = chest ? chest.unownedPartProbability : 0.3;
    const unownedParts = POSSIBLE_PARTS.filter(part => !unlockedParts.includes(part));
    const ownedParts = POSSIBLE_PARTS.filter(part => unlockedParts.includes(part));
    if (unownedParts.length === 0) {
      const randomIndex = Math.floor(Math.random() * ownedParts.length);
      return {
        part: ownedParts[randomIndex],
        wasUnowned: false
      };
    }
    
    if (ownedParts.length === 0) {
      const randomIndex = Math.floor(Math.random() * unownedParts.length);
      return {
        part: unownedParts[randomIndex],
        wasUnowned: true
      };
    }
    
    const random = Math.random();
    
    if (random < probability) {
      const randomIndex = Math.floor(Math.random() * unownedParts.length);
      return {
        part: unownedParts[randomIndex],
        wasUnowned: true
      };
    } else {
      const randomIndex = Math.floor(Math.random() * ownedParts.length);
      return {
        part: ownedParts[randomIndex],
        wasUnowned: false
      };
    }
  };

  const getRandomScrapAmount = () => {
    return Math.floor(Math.random() * 51) + 50;
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
      const { part, wasUnowned } = getRandomPartWithProbability(selectedChest.id);
      const userAlreadyHasPart = unlockedParts.includes(part);
      
      let scrapGained = 0;
      let rewardType = 'part';
      let rewardText = '';

      const isActuallyNew = wasUnowned && !userAlreadyHasPart;
      
      if (!isActuallyNew) {
        scrapGained = getRandomScrapAmount();
        rewardType = 'scrap';
        
        if (wasUnowned && userAlreadyHasPart) {
          rewardText = `You already have ${getPartDisplayName(part)}! Converted to ${scrapGained} scrap coins.`;
        } else {
          rewardText = `Duplicate ${getPartDisplayName(part)}! Converted to ${scrapGained} scrap coins.`;
        }
        
        const newTotalScrap = scrapCoins + scrapGained;
        setScrapCoins(newTotalScrap);
        await saveScrapCoins(newTotalScrap);
        
      } else {
        const updatedParts = [...unlockedParts, part];
        setUnlockedParts(updatedParts);
        rewardType = 'part';
        rewardText = `You got a new part: ${getPartDisplayName(part)}!`;
        
        await saveNewPart(part, updatedParts);
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
        setShowRewardModal(true);
        
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
      await updateLoadoutPresets();
    } catch (error) {
      console.log("Error saving new part:", error);
    }
  };

  const updateLoadoutPresets = async () => {
    if (!currentUser) return;
    
    try {
      const loadoutRef = doc(db, 'Roboquest-Loadout', currentUser.uid);
      const loadoutSnap = await getDoc(loadoutRef);
      
      if (loadoutSnap.exists()) {
        return;
      }
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
    Animated.timing(rewardScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowRewardModal(false);
      setSelectedChest(null);
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
    if (probability >= 0.9) return '#FFD700'; 
    if (probability >= 0.6) return '#4A90E2'; 
    return '#8B8B8B'; 
  };

  const getChestColor = (chestId) => {
    switch(chestId) {
      case 'legendary': return '#FFD700';
      case 'rare': return '#4A90E2';
      default: return '#8B8B8B';
    }
  };

  return (
    <View style={styles.wrapper}>
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
                <View style={[
                  styles.chestIcon,
                  { backgroundColor: chestColor, borderColor: chestColor }
                ]} />
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
          <Animated.View 
            style={[
              styles.chestIconLarge,
              { 
                backgroundColor: getChestColor(selectedChest.id),
                borderColor: getChestColor(selectedChest.id),
                transform: [{ scale: chestScale }] 
              }
            ]} 
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
                  styles.partIcon,
                  { 
                    backgroundColor: rewardResult.wasNew ? '#4A90E2' : '#FFD700',
                    borderColor: rewardResult.wasNew ? '#2A70C2' : '#FFA500'
                  }
                ]} />
                <Text style={styles.partName}>{getPartDisplayName(rewardResult.part)}</Text>
                <Text style={styles.partCategory}>{getPartCategory(rewardResult.part)}</Text>
                {rewardResult.wasNew && (
                  <Text style={styles.newBadge}>NEW!</Text>
                )}
              </View>
            ) : (
              <View style={styles.scrapReward}>
                <View style={styles.coinIconLarge} />
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
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 4,
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
    width: 150,
    height: 150,
    borderRadius: 20,
    borderWidth: 6,
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
  // Reward Styles
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
  partIcon: {
    width: 80,
    height: 80,
    borderRadius: 15,
    borderWidth: 3,
    marginBottom: 10,
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
    backgroundColor: '#FFD700',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFA500',
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