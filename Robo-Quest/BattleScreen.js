import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    SafeAreaView, 
    ImageBackground, 
    Animated, 
    Alert, 
    Dimensions, 
    Easing 
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from './database/firebase';
import { Audio } from 'expo-av'; // Import Audio directly

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- ASSETS ---
const BATTLE_ASSETS = {
    backgrounds: [
        require("./assets/background/BattleBGday.png"),
        require("./assets/background/BattleBGsunset.png"),
        require("./assets/background/BattleBGnight.png"),
    ],
    enemies: [
        require("./assets/battle/enemies/EnemySmall.png"),
        require("./assets/battle/enemies/EnemyMedium.png"),
        require("./assets/battle/enemies/EnemyLarge.png"),
    ],
    playerAttacks: {
        WeaponGeneralis: require("./assets/battle/player_attacks/GeneralisAtt.gif"),
        WeaponInnovare: require("./assets/battle/player_attacks/InnovareAtt.gif"),
        WeaponCreativia: require("./assets/battle/player_attacks/CreativiaAtt.gif"),
    },
    enemyAttack: require("./assets/battle/enemy_attacks/AlienGenericAtt.gif"),
    specialEffects: {
        Heal: require('./assets/battle/specialeffects/Heal.png'),
        Shield: require('./assets/battle/specialeffects/Shield.png'),
        Block: require('./assets/battle/specialeffects/Block.png'),
        Dodge: require('./assets/battle/specialeffects/Dodge.png'),
        Power: require('./assets/battle/specialeffects/Power.png'),
    },
    loadingBg: require("./assets/background/NewLoadingBg.png"),
    cogwheel: require("./assets/icons/settings.png"),
    // Boss Music Mapping directly here
    music: [
        require("./assets/music/FirstBoss.mp3"),  // Level 0
        require("./assets/music/SecondBoss.mp3"), // Level 1
        require("./assets/music/FinalBoss.mp3"),  // Level 2
    ]
};

const ASSETS = {
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

const PART_CATEGORIES = [
    'WeaponCreativia', 'WeaponGeneralis', 'WeaponInnovare',
    'ChassisCreativia', 'ChassisGeneralis', 'ChassisInnovare',
    'EngineCreativia', 'EngineGeneralis', 'EngineInnovare',
    'WheelsCreativia', 'WheelsGeneralis', 'WheelsInnovare'
];

const DEFAULT_LOADOUT = {
  Chassis: 'ChassisGeneralis',
  Engines: 'EngineGeneralis',
  Wheels: 'WheelsGeneralis',
  Weapon: 'WeaponGeneralis'
};

// --- STATS CONFIGURATION ---
const WEAPON_STATS = {
  WeaponGeneralis: {
    name: 'Twin Anti-Air Guns',
    attacks: [
      { name: 'Burst Fire', damage: { min: 45, max: 55 }, cost: 3, type: 'attack', icon: 'flash' },
      { name: 'Suppressive Fire', damage: { min: 90, max: 110 }, cost: 5, type: 'attack', icon: 'flame' }
    ]
  },
  WeaponInnovare: {
    name: 'Missile Launcher Arrays',
    attacks: [
      { name: 'Offensive Launch', damage: { min: 65, max: 75 }, cost: 3, type: 'attack', icon: 'rocket' },
      { name: 'Counter-Measure', damage: { min: 0, max: 0 }, cost: 5, type: 'shield', effectValue: 150, icon: 'shield' }
    ]
  },
  WeaponCreativia: {
    name: 'Laser Spread',
    attacks: [
      { name: 'Laser Blast', damage: { min: 45, max: 55 }, cost: 3, type: 'attack', icon: 'sunny' },
      { name: 'Overdrive Cascade', damage: { min: 170, max: 190 }, cost: 11, type: 'attack', icon: 'nuclear' }
    ]
  }
};

// UPDATED ENGINE STATS (Regen: 3, 5, 7)
const ENGINE_STATS = {
    EngineGeneralis: { regen: 3 }, 
    EngineInnovare: { regen: 5 },  
    EngineCreativia: { regen: 7 }, 
};

// UPDATED CHASSIS STATS (Creativia HP: 1000)
const CHASSIS_STATS = {
    ChassisGeneralis: { hp: 650 },
    ChassisInnovare: { hp: 750 },
    ChassisCreativia: { hp: 1000 }, 
};

// UPDATED ENEMY DATA (Higher Damage for challenge)
const ENEMY_DATA = [
    { name: "Baby Alien", hp: 800, baseDmg: 65, image: require("./assets/battle/enemies/EnemySmall.png") },   // increased from 50
    { name: "Middle Alien", hp: 1000, baseDmg: 110, image: require("./assets/battle/enemies/EnemyMedium.png") }, // increased from 80
    { name: "Big Mama", hp: 1400, baseDmg: 160, image: require("./assets/battle/enemies/EnemyLarge.png") }      // increased from 120
];

// Special Effect Component
const SpecialEffectOverlay = ({ effect, visible, target }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            fadeAnim.setValue(1);
            scaleAnim.setValue(0.5);
            translateY.setValue(0);

            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 400,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true
                }),
                Animated.timing(translateY, {
                    toValue: -60,
                    duration: 1000,
                    useNativeDriver: true
                }),
                Animated.sequence([
                    Animated.delay(600),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true
                    })
                ])
            ]).start();
        }
    }, [visible]);

    if (!visible || !effect) return null;

    const positionStyle = target === 'player' 
        ? { bottom: 180, left: 80 } 
        : { top: 120, right: 80 };

    return (
        <Animated.View style={[
            styles.specialEffectContainer, 
            positionStyle,
            { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: translateY }]
            }
        ]}>
            <Image 
                source={BATTLE_ASSETS.specialEffects[effect]} 
                style={styles.specialEffectImage} 
                resizeMode="contain" 
            />
        </Animated.View>
    );
};

function BattleScreen() {
  const navigation = useNavigation();
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [loadout, setLoadout] = useState(DEFAULT_LOADOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const [playerHP, setPlayerHP] = useState(650);
  const [playerMaxHP, setPlayerMaxHP] = useState(650);
  const [playerShield, setPlayerShield] = useState(0);
  const [playerEN, setPlayerEN] = useState(10); 
  const [playerMaxEN, setPlayerMaxEN] = useState(20); 
  
  // Refs to track state inside timeouts
  const playerShieldRef = useRef(playerShield);
  const playerHPRef = useRef(playerHP);
  
  const [enemyHP, setEnemyHP] = useState(800);
  const [enemyMaxHP, setEnemyMaxHP] = useState(800);
  
  const [battleLog, setBattleLog] = useState(['Battle Started!']);
  const [isAttacking, setIsAttacking] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerName, setPlayerName] = useState('Player');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [enemyLevel, setEnemyLevel] = useState(0); 
  const [currentBg, setCurrentBg] = useState(BATTLE_ASSETS.backgrounds[0]);
  
  // Audio State
  const [sound, setSound] = useState();

  // Animation States
  const [playerAnimVisible, setPlayerAnimVisible] = useState(false);
  const [enemyAnimVisible, setEnemyAnimVisible] = useState(false);

  // Bar Animations
  const playerHPAnim = useRef(new Animated.Value(100)).current;
  const enemyHPAnim = useRef(new Animated.Value(100)).current;
  const playerShieldAnim = useRef(new Animated.Value(0)).current;
  const playerENAnim = useRef(new Animated.Value(50)).current;

  // Cogwheel Animation Ref
  const spinValue = useRef(new Animated.Value(0)).current;

  // Special Effects States
  const [playerEffect, setPlayerEffect] = useState({ type: null, visible: false });
  const [enemyEffect, setEnemyEffect] = useState({ type: null, visible: false });

  const [battleRank, setBattleRank] = useState('B');
  const [rewards, setRewards] = useState({ 
    coins: 0, 
    part: null, 
    isDuplicate: false, 
    conversionAmount: 0 
  });

  // Cleanup sound on unmount
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Cogwheel loop animation
  useEffect(() => {
    if (isLoading || isExiting) {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();
    }
  }, [isLoading, isExiting]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Sync Refs with State
  useEffect(() => {
    playerShieldRef.current = playerShield;
  }, [playerShield]);

  useEffect(() => {
    playerHPRef.current = playerHP;
  }, [playerHP]);

  useEffect(() => {
    const randomBgIndex = Math.floor(Math.random() * BATTLE_ASSETS.backgrounds.length);
    setCurrentBg(BATTLE_ASSETS.backgrounds[randomBgIndex]);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userName = user.displayName || user.email;
        setPlayerName(userName);
        try {
          const docRef = doc(db, 'Roboquest-Loadout', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.presets && data.presets.Default) {
              setLoadout(data.presets.Default);
              initializeBattle(data.presets.Default, 0); 
            } else {
              initializeBattle(DEFAULT_LOADOUT, 0);
            }
          } else {
            initializeBattle(DEFAULT_LOADOUT, 0);
          }
        } catch (error) {
          console.log("Error loading loadout:", error);
          initializeBattle(DEFAULT_LOADOUT, 0);
        }
      }
      
      // Simulate a small delay for the loading screen effect
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    });

    return () => unsubscribe();
  }, []);

  // Animate Bars
  useEffect(() => {
    Animated.timing(playerHPAnim, {
        toValue: (playerHP / playerMaxHP) * 100,
        duration: 500,
        useNativeDriver: false,
    }).start();
  }, [playerHP, playerMaxHP]);

  useEffect(() => {
    Animated.timing(enemyHPAnim, {
        toValue: (enemyHP / enemyMaxHP) * 100,
        duration: 500,
        useNativeDriver: false,
    }).start();
  }, [enemyHP, enemyMaxHP]);

  useEffect(() => {
    // Shield animation logic
    Animated.timing(playerShieldAnim, {
        toValue: (Math.min(playerShield, playerMaxHP) / playerMaxHP) * 100,
        duration: 300,
        useNativeDriver: false,
    }).start();
  }, [playerShield, playerMaxHP]);

  useEffect(() => {
    Animated.timing(playerENAnim, {
        toValue: (playerEN / playerMaxEN) * 100,
        duration: 500,
        useNativeDriver: false,
    }).start();
  }, [playerEN, playerMaxEN]);

  // --- MUSIC LOGIC ---
  const playBossMusic = async (level) => {
      try {
          // Unload any existing sound first
          if (sound) {
              await sound.unloadAsync();
          }

          // Determine music track based on level (safe modulo in case levels go > 2)
          const trackIndex = level % BATTLE_ASSETS.music.length;
          const source = BATTLE_ASSETS.music[trackIndex];

          const { sound: newSound } = await Audio.Sound.createAsync(
              source,
              { isLooping: true, volume: 0.4 }
          );
          setSound(newSound);
          await newSound.playAsync();
      } catch (error) {
          console.log("Error playing boss music:", error);
      }
  };

  const stopMusic = async () => {
      if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
      }
  };

  const initializeBattle = (currentLoadout, level) => {
    const chassis = CHASSIS_STATS[currentLoadout.Chassis] || CHASSIS_STATS.ChassisGeneralis;
    setPlayerMaxHP(chassis.hp);
    setPlayerHP(chassis.hp);
    setPlayerShield(0);
    setPlayerEN(20); // EN starts at MAX (20)
    
    const currentEnemy = ENEMY_DATA[level] || ENEMY_DATA[0];
    setEnemyMaxHP(currentEnemy.hp);
    setEnemyHP(currentEnemy.hp);
    setEnemyLevel(level);
    
    // Trigger the music for this specific level
    playBossMusic(level);

    setBattleLog([`Battle Started against ${currentEnemy.name}!`]);
  };

  const triggerEffect = (target, type) => {
      if (target === 'player') {
          setPlayerEffect({ type: null, visible: false });
          setTimeout(() => setPlayerEffect({ type, visible: true }), 50);
      } else {
          setEnemyEffect({ type: null, visible: false });
          setTimeout(() => setEnemyEffect({ type, visible: true }), 50);
      }
  };

  const updateBattleStats = async (result, droppedPart = null) => {
      if (!currentUser) return;
      try {
          const docId = `${playerName}-Roboquest-Boss`;
          const statsRef = doc(db, 'Roboquest-Boss', docId);
          const statsSnap = await getDoc(statsRef);
          
          const currentBossName = ENEMY_DATA[enemyLevel].name;
          let allData = statsSnap.exists() ? statsSnap.data() : {};
          let bossData = allData[currentBossName] || { wins: 0, defeats: 0, drops: [] };

          if (result === 'win') {
              bossData.wins = (bossData.wins || 0) + 1;
              if (droppedPart) {
                  const currentDrops = bossData.drops || [];
                  currentDrops.push(droppedPart);
                  bossData.drops = currentDrops;
              }
          } else {
              bossData.defeats = (bossData.defeats || 0) + 1;
          }
          bossData.lastEncounter = new Date().toISOString();

          await setDoc(statsRef, { [currentBossName]: bossData }, { merge: true });
      } catch (e) {
          console.error("Error updating battle stats:", e);
      }
  };

  const calculateDamage = (damageRange) => {
    const { min, max } = damageRange;
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const handleAction = (actionType, actionIndex) => {
    if (isAttacking || battleEnded) return;
    setIsAttacking(true);

    // --- PLAYER TURN ---
    if (actionType === 'attack') {
        const weaponStats = WEAPON_STATS[loadout.Weapon] || WEAPON_STATS.WeaponGeneralis;
        const attack = weaponStats.attacks[actionIndex];
        
        if (playerEN < attack.cost) {
            Alert.alert("Low Energy", "Not enough Energy to use this skill!");
            setIsAttacking(false);
            return;
        }

        setPlayerEN(prev => Math.max(0, prev - attack.cost));
        setBattleLog(prev => [...prev, `Player used ${attack.name}`]);

        // CHECK FOR SHIELD SKILL
        if (attack.type === 'shield') {
            const maxShield = Math.floor(playerMaxHP * 0.5); // Cap shield at 50% of max HP to prevent "overpowered" stacking
            const newShield = Math.min(playerShield + attack.effectValue, maxShield);
            
            setPlayerShield(newShield);
            setBattleLog(prev => [...prev, `-> Shield boosted to ${newShield}`]);
            triggerEffect('player', 'Shield');
            finishPlayerTurn(0); 
            return;
        }

        const hitRoll = Math.random();
        let finalDamage = 0;
        
        setPlayerAnimVisible(true);
        setTimeout(() => setPlayerAnimVisible(false), 600);

        if (hitRoll < 0.15) { 
            triggerEffect('enemy', 'Dodge');
            setBattleLog(prev => [...prev, "-> Enemy dodged the attack!"]);
        } else if (hitRoll < 0.25) {
             finalDamage = Math.floor(calculateDamage(attack.damage) * 0.5);
             triggerEffect('enemy', 'Block');
             setBattleLog(prev => [...prev, `-> Enemy blocked! (${finalDamage} dmg)`]);
        } else {
            finalDamage = calculateDamage(attack.damage);
            if (Math.random() < 0.2) {
                finalDamage = Math.floor(finalDamage * 1.5);
                triggerEffect('player', 'Power');
                setBattleLog(prev => [...prev, `-> CRITICAL HIT! (${finalDamage} dmg)`]);
            } else {
                setBattleLog(prev => [...prev, `-> Dealt ${finalDamage} damage`]);
            }
        }

        finishPlayerTurn(finalDamage);

    } else if (actionType === 'repair') {
        const repairCost = 15;
        if (playerEN < repairCost) {
            Alert.alert("Low Energy", "Need 15 EN to Repair!");
            setIsAttacking(false);
            return;
        }
        
        const healAmount = 150;
        setPlayerEN(prev => prev - repairCost);
        setPlayerHP(prev => Math.min(playerMaxHP, prev + healAmount));
        
        setBattleLog(prev => [...prev, `Player used Repair`]);
        setBattleLog(prev => [...prev, `-> Restored ${healAmount} HP`]);
        triggerEffect('player', 'Heal');
        finishPlayerTurn(0);
    }
  };

  const finishPlayerTurn = (damageDealt) => {
      // Apply Damage to Enemy
      if (damageDealt > 0) {
          const newEnemyHP = Math.max(0, enemyHP - damageDealt);
          setEnemyHP(newEnemyHP);
          if (newEnemyHP <= 0) {
            setBattleLog(prev => [...prev, "Enemy Defeated!"]);
            generateRewards().then(() => {
                setBattleEnded(true);
                setWinner('player');
                setIsAttacking(false);
            });
            return;
          }
      }

      // --- ENEMY TURN ---
      setTimeout(() => {
          const currentEnemy = ENEMY_DATA[enemyLevel];
          setBattleLog(prev => [...prev, `${currentEnemy.name} attacks!`]);
          setEnemyAnimVisible(true);

          setTimeout(() => {
              setEnemyAnimVisible(false);
              
              // Use Ref for live Shield value inside timeout
              let currentShield = playerShieldRef.current;
              
              const hitRoll = Math.random();
              let incomingDamage = Math.floor(currentEnemy.baseDmg * (0.8 + Math.random() * 0.4));
              
              if (hitRoll < 0.15) {
                  triggerEffect('player', 'Dodge');
                  setBattleLog(prev => [...prev, "-> You dodged!"]);
                  incomingDamage = 0;
              } else if (hitRoll < 0.25) {
                  incomingDamage = Math.floor(incomingDamage * 0.4);
                  triggerEffect('player', 'Block');
                  setBattleLog(prev => [...prev, `-> Blocked! took ${incomingDamage} dmg`]);
                  
                  // Shield logic for blocked damage
                  if (currentShield > 0 && incomingDamage > 0) {
                      const reduction = Math.min(currentShield, incomingDamage);
                      setPlayerShield(prev => prev - reduction);
                      currentShield -= reduction; // Update local ref for calculation
                      incomingDamage -= reduction;
                      
                      setBattleLog(prev => [...prev, `-> Shield blocked ${reduction} dmg`]);
                      triggerEffect('player', 'Shield');
                  }
              } else {
                  // Direct hit SHIELD LOGIC
                  if (currentShield > 0) {
                      triggerEffect('player', 'Shield');
                      const damageToShield = Math.min(currentShield, incomingDamage);
                      
                      // Immediately update shield state for "live reduce" effect
                      setPlayerShield(prev => Math.max(0, prev - damageToShield));
                      
                      const remainingDamage = incomingDamage - damageToShield;
                      
                      if (damageToShield > 0) {
                          setBattleLog(prev => [...prev, `-> Shield absorbed ${damageToShield} damage!`]);
                      }
                      
                      if (remainingDamage > 0) {
                           setBattleLog(prev => [...prev, `-> Shield broken!`]);
                      }
                      
                      incomingDamage = remainingDamage;
                  }
              }

              if (incomingDamage > 0) {
                setPlayerHP(prev => Math.max(0, prev - incomingDamage));
                setBattleLog(prev => [...prev, `-> Took ${incomingDamage} HP damage`]);
              }

              const engine = ENGINE_STATS[loadout.Engines] || ENGINE_STATS.EngineGeneralis;
              const regenAmount = engine.regen || 4; 
              setPlayerEN(prev => Math.min(playerMaxEN, prev + regenAmount));
              
              // Check Defeat using Ref to be safe
              if (playerHPRef.current - incomingDamage <= 0) {
                  setBattleLog(prev => [...prev, "System Failure..."]);
                  setBattleEnded(true);
                  setWinner('enemy');
                  updateBattleStats('defeat'); 
              }
              
              setIsAttacking(false);

          }, 600);
      }, 1000);
  };

  const generateRewards = async () => {
    const hpPercentage = (playerHP / playerMaxHP) * 100;
    let rank = 'C';
    if (hpPercentage >= 90) rank = 'S';
    else if (hpPercentage >= 70) rank = 'A+';
    else if (hpPercentage >= 50) rank = 'A';
    else if (hpPercentage >= 30) rank = 'B';
    
    setBattleRank(rank);
    let coinsCalculated = Math.floor(Math.random() * 100) + 50;
    
    let droppedPartName = null;
    let isDuplicate = false;
    const conversionAmount = 100;

    if (Math.random() < 0.4) {
        const randomPartIndex = Math.floor(Math.random() * PART_CATEGORIES.length);
        droppedPartName = PART_CATEGORIES[randomPartIndex];
    }

    if (currentUser) {
        try {
            if (droppedPartName) {
                const userCollectionRef = doc(db, 'Roboquest-Collection', currentUser.uid);
                const collectionSnap = await getDoc(userCollectionRef);
                let currentParts = [];
                
                if (collectionSnap.exists()) {
                    currentParts = collectionSnap.data().parts || [];
                }

                if (currentParts.includes(droppedPartName)) {
                    // Duplicate found
                    isDuplicate = true;
                    coinsCalculated += conversionAmount; // Add bonus coins for duplicate
                    console.log(`Duplicate part ${droppedPartName} converted to ${conversionAmount} coins`);
                } else {
                    // New part
                    currentParts.push(droppedPartName);
                    await setDoc(userCollectionRef, { parts: currentParts }, { merge: true });
                }
            }

            // Update coins (field: coins in Roboquest-Scraps)
            const scrapRef = doc(db, 'Roboquest-Scraps', currentUser.uid);
            const scrapSnap = await getDoc(scrapRef);
            let currentCoins = 0;
            if (scrapSnap.exists()) {
                currentCoins = scrapSnap.data().coins || 0;
            }
            await setDoc(scrapRef, { coins: currentCoins + coinsCalculated }, { merge: true });
            
            await updateBattleStats('win', isDuplicate ? null : droppedPartName);

        } catch (error) {
            console.error("Error saving rewards:", error);
        }
    }
    
    setRewards({ 
        coins: coinsCalculated, 
        part: droppedPartName, 
        isDuplicate, 
        conversionAmount 
    });
  };

  const handleExitTransition = () => {
    setIsExiting(true);
    stopMusic(); // Stop music when exiting to menu
    setTimeout(() => {
        navigation.navigate('Home');
    }, 2000); 
  };

  const handleSurrender = () => {
      // If battle is already ended, the back button acts as a normal exit to menu
      if (battleEnded) {
          handleExitTransition();
          return;
      }
      
      Alert.alert(
          "Retreat from Battle?",
          "Retreating now will result in a DEFEAT.",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Retreat", 
                  style: "destructive", 
                  onPress: () => {
                      setPlayerHP(0); 
                      setBattleEnded(true);
                      setWinner('enemy');
                      setBattleLog(prev => [...prev, "Player retreated!"]);
                      updateBattleStats('defeat');
                  } 
              }
          ]
      );
  };

  const handleReturnToMenu = () => {
    handleExitTransition();
  };

  const handleNextBattle = () => {
      setBattleEnded(false);
      setWinner(null);
      // Logic for next level index
      const nextLevel = (enemyLevel + 1) % 3;
      const randomBgIndex = Math.floor(Math.random() * BATTLE_ASSETS.backgrounds.length);
      setCurrentBg(BATTLE_ASSETS.backgrounds[randomBgIndex]);
      initializeBattle(loadout, nextLevel);
  };

  const handleRestart = () => {
    setBattleEnded(false);
    setWinner(null);
    initializeBattle(loadout, enemyLevel); 
  };

  const getWeaponOffset = () => {
    const weapon = loadout.Weapon;
    const chassis = loadout.Chassis;
    if (!chassis || !weapon) return 0;
    if (chassis === "ChassisInnovare") {
      if (weapon === "WeaponCreativia") return 8;
      if (weapon === "WeaponGeneralis") return 5;
      if (weapon === "WeaponInnovare") return 0;
    }
    if (chassis === "ChassisGeneralis") {
      if (weapon === "WeaponCreativia") return 4;
      if (weapon === "WeaponGeneralis") return 0;
      if (weapon === "WeaponInnovare") return -4;
    }
    if (chassis === "ChassisCreativia") {
      if (weapon === "WeaponCreativia") return 0;
      if (weapon === "WeaponGeneralis") return -3;
      if (weapon === "WeaponInnovare") return -7;
    }
    return 0;
  };

  // UPDATED LOADING VIEW WITH COGWHEEL ANIMATION & CENTERED TEXT
  if (isLoading || isExiting) {
    return (
      <ImageBackground 
        source={BATTLE_ASSETS.loadingBg} 
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Animated.Image 
                source={BATTLE_ASSETS.cogwheel} 
                style={{ 
                    transform: [{ rotate: spin }], 
                    width: 80, 
                    height: 80, 
                    tintColor: '#FFFFFF' 
                }} 
                resizeMode="contain"
            />
            <Text style={styles.loadingText}>
                {isExiting ? "RETURNING TO BASE..." : "LOADING BATTLE..."}
            </Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const equippedWeapon = loadout.Weapon;
  const equippedChassis = loadout.Chassis;
  const equippedEngine = loadout.Engines;
  const equippedWheels = loadout.Wheels;
  
  const weaponStats = WEAPON_STATS[equippedWeapon] || WEAPON_STATS.WeaponGeneralis;
  const currentEnemy = ENEMY_DATA[enemyLevel];
  const playerAttackGif = BATTLE_ASSETS.playerAttacks[equippedWeapon] || BATTLE_ASSETS.playerAttacks.WeaponGeneralis;

  return (
    <ImageBackground source={currentBg} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.topOverlay}>
        <TouchableOpacity style={styles.surrenderButton} onPress={handleSurrender}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.surrenderText}>Retreat</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.arenaContainer}>
        
        {/* --- ENEMY --- */}
        <View style={styles.enemyContainer}>
          <SpecialEffectOverlay effect={enemyEffect.type} visible={enemyEffect.visible} target="enemy" />
          
          <Text style={styles.enemyLabel}>{currentEnemy.name} (Lvl {enemyLevel + 1})</Text>
          <View style={styles.spriteWrapper}>
            <Image 
                source={currentEnemy.image} 
                style={[styles.enemyImg, enemyLevel === 2 && { width: 180, height: 180 }]} 
            />
            {playerAnimVisible && (
                <Image 
                    source={playerAttackGif} 
                    style={[
                        styles.attackEffect,
                        equippedWeapon === 'WeaponInnovare' && styles.innovareAttackEffect,
                        equippedWeapon === 'WeaponCreativia' && styles.creativiaAttackEffect
                    ]} 
                    resizeMode="contain" 
                />
            )}
          </View>
          <View style={styles.healthBar}>
            <Animated.View style={[styles.healthFill, { 
                width: enemyHPAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                }), 
                backgroundColor: "#E74C3C" 
            }]} />
            <Text style={styles.barTextOverlay}>{Math.max(0, enemyHP)} / {enemyMaxHP}</Text>
          </View>
        </View>

        {/* --- PLAYER --- */}
        <View style={styles.playerContainer}>
           <SpecialEffectOverlay effect={playerEffect.type} visible={playerEffect.visible} target="player" />

          <View style={styles.robotStage}>
            {equippedWheels && ASSETS.parts[equippedWheels] && (
              <Image source={ASSETS.parts[equippedWheels]} style={[styles.robotLayer, { zIndex: 30 }]} resizeMode="contain" />
            )}
            {equippedChassis && ASSETS.parts[equippedChassis] && (
              <Image source={ASSETS.parts[equippedChassis]} style={[styles.robotLayer, { zIndex: 10 }]} resizeMode="contain" />
            )}
            {equippedEngine && ASSETS.parts[equippedEngine] && (
              <Image source={ASSETS.parts[equippedEngine]} style={[styles.robotLayer, { zIndex: 20 }]} resizeMode="contain" />
            )}
            {equippedWeapon && ASSETS.parts[equippedWeapon] && (
              <Image source={ASSETS.parts[equippedWeapon]} style={[styles.robotLayer, { zIndex: 40, top: getWeaponOffset() }]} resizeMode="contain" />
            )}
            
            {enemyAnimVisible && (
                <Image source={BATTLE_ASSETS.enemyAttack} style={styles.attackEffect} resizeMode="contain" />
            )}
            
             <View style={styles.statsOverlay}>
                <Text style={styles.playerLabel}>{playerName}</Text>
                
                {/* Shield Bar Overlay */}
                {playerShield > 0 && (
                    <View style={[styles.healthBar, { position: 'absolute', bottom: 22, height: 6, width: 140, backgroundColor: 'transparent', borderWidth: 0, zIndex: 5 }]}>
                         <Animated.View style={[styles.healthFill, { 
                             width: playerShieldAnim.interpolate({
                                 inputRange: [0, 100],
                                 outputRange: ['0%', '100%']
                             }), 
                             backgroundColor: "#3498db", 
                             opacity: 0.8,
                             borderRadius: 4
                         }]} />
                     </View>
                )}

                {/* Health Bar */}
                <View style={styles.healthBar}>
                    <Animated.View style={[styles.healthFill, { 
                        width: playerHPAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        }), 
                        backgroundColor: "#27AE60" 
                    }]} />
                    <Text style={styles.barTextOverlay}>{Math.max(0, playerHP)} / {playerMaxHP} {playerShield > 0 ? `(+${playerShield})` : ''}</Text>
                </View>
                
                {/* Energy Bar */}
                <View style={[styles.healthBar, { borderColor: 'rgba(0,191,255,0.5)', marginTop: 4 }]}>
                    <Animated.View style={[styles.healthFill, { 
                        width: playerENAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        }), 
                        backgroundColor: "#00BFFF" 
                    }]} />
                    <Text style={styles.barTextOverlay}>{playerEN} / {playerMaxEN} EN</Text>
                </View>
             </View>
          </View>
        </View>

        {/* --- VICTORY MODAL --- */}
        {battleEnded && (
          <View style={styles.resultOverlay}>
            <View style={styles.victoryCard}>
                <Text style={styles.victoryTitle}>{winner === 'player' ? 'VICTORY!' : 'DEFEATED'}</Text>
                
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{winner === 'player' ? battleRank : 'F'}</Text>
                </View>

                {winner === 'player' && (
                    <View style={styles.rewardsContainer}>
                        <Text style={styles.rewardsTitle}>Rewards Found:</Text>
                        <View style={styles.rewardItem}>
                            <Text style={styles.rewardText}>🪙 {rewards.coins} Scrap Coins</Text>
                        </View>
                        {rewards.part ? (
                             <View style={styles.rewardItem}>
                                {rewards.isDuplicate ? (
                                    <View style={{alignItems: 'center'}}>
                                        <Text style={[styles.rewardText, {color: '#FFA500', fontSize: 14}]}>
                                            ♻️ Duplicate Part Found:
                                        </Text>
                                        <Text style={[styles.rewardText, {fontSize: 12}]}>
                                            {rewards.part}
                                        </Text>
                                        <Text style={[styles.noPartText, {marginTop: 2}]}>
                                            Converted to {rewards.conversionAmount} Scraps
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.rewardText}>🔧 Unlocked: {rewards.part}</Text>
                                )}
                             </View>
                        ) : (
                            <Text style={styles.noPartText}>No parts found this time.</Text>
                        )}
                    </View>
                )}

                <View style={styles.modalButtonContainer}>
                    {winner === 'player' ? (
                        <>
                            <TouchableOpacity style={styles.rematchButton} onPress={handleRestart}>
                                <Text style={styles.rematchText}>REMATCH</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.okButton} onPress={handleNextBattle}>
                                <Text style={styles.buttonText}>NEXT</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.rematchButton} onPress={handleRestart}>
                                <Text style={styles.rematchText}>RETRY</Text>
                            </TouchableOpacity>
                             <TouchableOpacity style={styles.okButton} onPress={handleReturnToMenu}>
                                <Text style={styles.buttonText}>EXIT</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
          </View>
        )}
      </View>

      {/* --- ATTACK BUTTONS (BEAUTIFIED) --- */}
      <View style={styles.skillBox}>
        <View style={styles.skillRow}>
          {/* Attack 1 */}
          <TouchableOpacity 
            style={[
                styles.skillButton, 
                (battleEnded || isAttacking || playerEN < weaponStats.attacks[0].cost) ? styles.skillButtonDisabled : {}
            ]}
            onPress={() => handleAction('attack', 0)}
            disabled={battleEnded || isAttacking}
          >
            <View style={styles.skillIconContainer}>
                <Ionicons name={weaponStats.attacks[0].icon || 'flash'} size={20} color="#333" />
            </View>
            <View style={styles.skillInfo}>
                <Text style={styles.skillText}>{weaponStats.attacks[0]?.name}</Text>
                <Text style={styles.skillDamage}>{weaponStats.attacks[0]?.damage.min}-{weaponStats.attacks[0]?.damage.max} DMG</Text>
            </View>
            <View style={styles.costBadge}>
                <Text style={styles.costText}>{weaponStats.attacks[0]?.cost}</Text>
            </View>
          </TouchableOpacity>

          {/* Attack 2 */}
          <TouchableOpacity 
            style={[
                styles.skillButton, 
                (battleEnded || isAttacking || playerEN < weaponStats.attacks[1].cost) ? styles.skillButtonDisabled : {}
            ]}
            onPress={() => handleAction('attack', 1)}
            disabled={battleEnded || isAttacking}
          >
            <View style={styles.skillIconContainer}>
                <Ionicons name={weaponStats.attacks[1].icon || 'flame'} size={20} color="#333" />
            </View>
            <View style={styles.skillInfo}>
                <Text style={styles.skillText}>{weaponStats.attacks[1]?.name}</Text>
                {weaponStats.attacks[1]?.type === 'shield' ? (
                    <Text style={[styles.skillDamage, {color: '#3498db'}]}>Shield +{weaponStats.attacks[1]?.effectValue}</Text>
                ) : (
                    <Text style={styles.skillDamage}>{weaponStats.attacks[1]?.damage.min}-{weaponStats.attacks[1]?.damage.max} DMG</Text>
                )}
            </View>
            <View style={styles.costBadge}>
                <Text style={styles.costText}>{weaponStats.attacks[1]?.cost}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.skillRow}>
          {/* Ultimate (Locked) */}
          <TouchableOpacity style={[styles.skillButton, styles.skillButtonDisabled]} disabled={true}>
            <View style={styles.skillIconContainer}>
                <Ionicons name="star" size={20} color="#666" />
            </View>
            <View style={styles.skillInfo}>
                <Text style={styles.skillText}>Ultimate</Text>
                <Text style={styles.skillDamage}>Locked</Text>
            </View>
            <View style={[styles.costBadge, {backgroundColor: '#777'}]}>
                <Ionicons name="lock-closed" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Repair */}
          <TouchableOpacity 
             style={[
                 styles.skillButton, 
                 styles.repairButton,
                 (battleEnded || isAttacking || playerEN < 15) ? styles.skillButtonDisabled : {}
             ]} 
             onPress={() => handleAction('repair')}
             disabled={battleEnded || isAttacking}
          >
             <View style={styles.skillIconContainer}>
                <Ionicons name="medkit" size={20} color="#27AE60" />
            </View>
            <View style={styles.skillInfo}>
                <Text style={styles.skillText}>Repair</Text>
                <Text style={[styles.skillDamage, {color: '#27AE60'}]}>Heal +150</Text>
            </View>
            <View style={[styles.costBadge, {backgroundColor: '#27AE60'}]}>
                <Text style={styles.costText}>15</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1 
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20, // Smaller font for better fit
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textAlign: 'center', // Centered text
    paddingHorizontal: 20, // Padding to prevent cutting off on sides
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  topOverlay: {
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 20, 
      paddingHorizontal: 20, 
      paddingTop: 10,
  },
  surrenderButton: {
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      paddingVertical: 8, 
      paddingHorizontal: 12, 
      borderRadius: 20, 
      alignSelf: 'flex-start', 
      marginTop: 35,
  },
  surrenderText: { 
      color: '#FFF', 
      fontWeight: 'bold', 
      marginLeft: 4, 
      fontSize: 14 
  },
  arenaContainer: { 
      flex: 1, 
      position: 'relative', 
      paddingHorizontal: 12, 
      paddingVertical: 16 
  },
  spriteWrapper: { 
      position: 'relative', 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  attackEffect: {
      position: 'absolute', 
      width: 300, 
      height: 300, 
      top: 60, 
      right: 5, 
      zIndex: 99, 
      transform: [{ rotate: '10deg' }],
  },
  innovareAttackEffect: { 
      position: 'absolute',
      width: 340, 
      height: 340,
      top: 35,     
      right: -10,
      zIndex: 99, 
  },
  creativiaAttackEffect: { 
      position: 'absolute',
      width: 340, 
      height: 340,
      top: 35,     
      right: -10,
      zIndex: 99,
      transform: [{ rotate: '15deg' }],
  },
  specialEffectContainer: {
      position: 'absolute', 
      zIndex: 150,
  },
  specialEffectImage: { 
      width: 120, 
      height: 120 
  },

  /* ENTITIES */
  enemyContainer: { 
      position: 'absolute', 
      top: 80, 
      right: 20, 
      alignItems: "center", 
      zIndex: 10 
  },
  enemyLabel: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      color: '#FF3B30', 
      marginBottom: 4, 
      textShadowColor: 'rgba(0, 0, 0, 0.8)', 
      textShadowOffset: { width: 1, height: 1 }, 
      textShadowRadius: 3 
  },
  enemyImg: { 
      width: 160, 
      height: 160, 
      resizeMode: "contain", 
      marginBottom: 6 
  },

  playerContainer: { 
      position: 'absolute', 
      bottom: 240, 
      left: 20, 
      alignItems: "center", 
      zIndex: 10 
  },
  playerLabel: { 
      fontSize: 14, 
      fontWeight: 'bold', 
      color: '#34C759', 
      marginBottom: 2, 
      textShadowColor: 'rgba(0, 0, 0, 0.8)', 
      textShadowOffset: { width: 1, height: 1 }, 
      textShadowRadius: 3 
  },
  robotStage: { 
      width: 240, 
      height: 240, 
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'relative' 
  },
  robotLayer: { 
      position: 'absolute', 
      width: '100%', 
      height: '100%' 
  },
  statsOverlay: { 
      position: 'absolute', 
      bottom: -70, 
      width: '100%', 
      alignItems: 'center', 
      zIndex: 100 
  },

  healthBar: { 
      width: 140, 
      height: 18, 
      backgroundColor: "rgba(50, 50, 50, 0.8)", 
      borderRadius: 8, 
      overflow: "hidden", 
      marginBottom: 6, 
      borderWidth: 1, 
      borderColor: "rgba(255, 255, 255, 0.3)",
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'relative'
  },
  healthFill: { 
      position: 'absolute', 
      left: 0, 
      top: 0, 
      bottom: 0 
  },
  barTextOverlay: {
      fontSize: 11, 
      color: '#FFF', 
      fontWeight: 'bold', 
      zIndex: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.9)', 
      textShadowOffset: { width: 1, height: 1 }, 
      textShadowRadius: 2,
  },
  
  resultOverlay: {
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 100,
  },
  victoryCard: {
      width: '85%', 
      backgroundColor: '#5A4C45', 
      borderRadius: 16, 
      padding: 20, 
      alignItems: 'center', 
      borderWidth: 4, 
      borderColor: '#3E3430',
  },
  victoryTitle: { 
      fontSize: 42, 
      fontWeight: '900', 
      color: '#FFD700', 
      textShadowColor: '#000', 
      textShadowOffset: {width: 2, height: 2}, 
      textShadowRadius: 5, 
      marginBottom: 10, 
      fontStyle: 'italic' 
  },
  rankContainer: { 
      marginBottom: 20 
  },
  rankText: { 
      fontSize: 80, 
      fontWeight: '900', 
      color: '#FFD700', 
      textShadowColor: 'rgba(255, 100, 0, 0.8)', 
      textShadowOffset: {width: 0, height: 0}, 
      textShadowRadius: 20 
  },
  rewardsContainer: {
      marginTop: 15, 
      marginBottom: 15, 
      width: '100%', 
      alignItems: 'center', 
      backgroundColor: 'rgba(0,0,0,0.2)', 
      padding: 10, 
      borderRadius: 8,
  },
  rewardsTitle: { 
      color: '#FFF', 
      fontWeight: 'bold', 
      marginBottom: 5 
  },
  rewardItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 5 
  },
  rewardText: { 
      color: '#81F7D8', 
      fontWeight: 'bold', 
      fontSize: 16 
  },
  noPartText: { 
      color: '#AAA', 
      fontSize: 12, 
      fontStyle: 'italic' 
  },
  modalButtonContainer: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      width: '100%', 
      marginTop: 10, 
      gap: 10,
  },
  rematchButton: { 
      flex: 1, 
      backgroundColor: '#444', 
      paddingVertical: 12, 
      borderRadius: 20, 
      borderWidth: 2, 
      borderColor: '#FFD700', 
      alignItems: 'center' 
  },
  rematchText: { 
      fontWeight: 'bold', 
      color: '#FFFFFF', 
      fontSize: 16 
  },
  okButton: { 
      flex: 1, 
      backgroundColor: '#F4C542', 
      paddingVertical: 12, 
      borderRadius: 20, 
      borderWidth: 2, 
      borderColor: '#FFF', 
      alignItems: 'center' 
  },
  buttonText: { 
      fontWeight: 'bold', 
      color: '#3E3430', 
      fontSize: 16 
  },

  skillBox: {
      backgroundColor: "rgba(240, 240, 240, 0.95)", 
      borderTopWidth: 2, 
      borderTopColor: "#00BFFF",
      paddingVertical: 12, 
      paddingHorizontal: 12, 
      position: 'absolute', 
      bottom: 20, 
      left: 10, 
      right: 10,
      borderRadius: 20, 
      borderWidth: 2, 
      borderColor: "#DDD", 
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
  },
  skillRow: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      gap: 10, 
      marginBottom: 8 
  },
  skillButton: { 
      flex: 1, 
      backgroundColor: "#FFFFFF", 
      borderRadius: 14, 
      borderWidth: 1, 
      borderColor: '#DDD', 
      justifyContent: "space-between", 
      alignItems: "center", 
      flexDirection: 'row',
      paddingVertical: 8, 
      paddingHorizontal: 10, 
      height: 55,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  repairButton: {
      borderColor: '#27AE60',
      backgroundColor: '#F0FFF4'
  },
  skillButtonDisabled: { 
      backgroundColor: "#E0E0E0", 
      borderColor: '#999', 
      opacity: 0.6 
  },
  skillIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
  },
  skillInfo: {
      flex: 1,
      justifyContent: 'center',
  },
  skillText: { 
      fontWeight: "800", 
      fontSize: 12, 
      color: "#333",
      marginBottom: 2
  }, 
  skillDamage: { 
      fontSize: 9, 
      color: "#666", 
      fontWeight: '600'
  },
  costBadge: { 
      backgroundColor: "#007AFF", 
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      minWidth: 22,
      alignItems: 'center',
      justifyContent: 'center'
  },
  costText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: 'bold'
  }
});

export default BattleScreen;