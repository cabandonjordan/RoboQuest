import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, ImageBackground, Animated, Alert, Dimensions, Easing } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from './database/firebase';

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
      { name: 'Burst Fire', damage: { min: 40, max: 60 }, cost: 3 },
      { name: 'Suppressive Fire', damage: { min: 80, max: 100 }, cost: 5 }
    ]
  },
  WeaponInnovare: {
    name: 'Missile Launcher Arrays',
    attacks: [
      { name: 'Offensive Launch', damage: { min: 65, max: 85 }, cost: 3 },
      { name: 'Counter-Measure', damage: { min: 60, max: 80 }, cost: 5 }
    ]
  },
  WeaponCreativia: {
    name: 'Laser Spread',
    attacks: [
      { name: 'Laser Blast', damage: { min: 50, max: 70 }, cost: 3 },
      { name: 'Overdrive Cascade', damage: { min: 150, max: 180 }, cost: 11 }
    ]
  }
};

const ENGINE_STATS = {
    EngineGeneralis: { regen: 4 },
    EngineInnovare: { regen: 6 },
    EngineCreativia: { regen: 8 },
};

const CHASSIS_STATS = {
    ChassisGeneralis: { hp: 650 },
    ChassisInnovare: { hp: 750 },
    ChassisCreativia: { hp: 500 },
};

const ENEMY_DATA = [
    { name: "Baby Alien", hp: 800, baseDmg: 50, image: require("./assets/battle/enemies/EnemySmall.png") },
    { name: "Middle Alien", hp: 1000, baseDmg: 80, image: require("./assets/battle/enemies/EnemyMedium.png") },
    { name: "Big Mama", hp: 1400, baseDmg: 120, image: require("./assets/battle/enemies/EnemyLarge.png") }
];

const unlockPartForUser = async (userId, partName) => {
    try {
        const userDocRef = doc(db, 'Roboquest-Collection', userId);
        const userDoc = await getDoc(userDocRef);
        let parts = [];
        if (userDoc.exists()) {
            parts = userDoc.data().parts || [];
        }
        
        if (!parts.includes(partName)) {
            parts.push(partName);
            await setDoc(userDocRef, { parts }, { merge: true });
            return true; 
        }
        return false;
    } catch (error) {
        console.error('Error unlocking part:', error);
        return false;
    }
};

function BattleScreen() {
  const navigation = useNavigation();
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [loadout, setLoadout] = useState(DEFAULT_LOADOUT);
  const [isLoading, setIsLoading] = useState(true);
  
  const [playerHP, setPlayerHP] = useState(650);
  const [playerMaxHP, setPlayerMaxHP] = useState(650);
  const [playerEN, setPlayerEN] = useState(10); 
  const [playerMaxEN, setPlayerMaxEN] = useState(20); 
  
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
  
  // Animation States
  const [playerAnimVisible, setPlayerAnimVisible] = useState(false);
  const [enemyAnimVisible, setEnemyAnimVisible] = useState(false);

  const [battleRank, setBattleRank] = useState('B');
  const [rewards, setRewards] = useState({ coins: 0, part: null });

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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeBattle = (currentLoadout, level) => {
    const chassis = CHASSIS_STATS[currentLoadout.Chassis] || CHASSIS_STATS.ChassisGeneralis;
    setPlayerMaxHP(chassis.hp);
    setPlayerHP(chassis.hp);
    setPlayerEN(10); 
    
    const currentEnemy = ENEMY_DATA[level] || ENEMY_DATA[0];
    setEnemyMaxHP(currentEnemy.hp);
    setEnemyHP(currentEnemy.hp);
    setEnemyLevel(level);
    
    setBattleLog([`Battle Started against ${currentEnemy.name}!`]);
  };

  const calculateDamage = (damageRange) => {
    const { min, max } = damageRange;
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const calculateEnemyDamage = (baseDmg) => {
    return Math.floor(baseDmg * (0.8 + Math.random() * 0.4));
  };

  const generateRewards = async () => {
      const hpPercentage = (playerHP / playerMaxHP) * 100;
      let rank = 'C';
      if (hpPercentage >= 90) rank = 'S';
      else if (hpPercentage >= 70) rank = 'A+';
      else if (hpPercentage >= 50) rank = 'A';
      else if (hpPercentage >= 30) rank = 'B';
      
      setBattleRank(rank);
      const coins = Math.floor(Math.random() * 100) + 50;
      
      let droppedPart = null;
      if (Math.random() < 0.4) {
          const randomPartIndex = Math.floor(Math.random() * PART_CATEGORIES.length);
          droppedPart = PART_CATEGORIES[randomPartIndex];
          if (currentUser) {
              await unlockPartForUser(currentUser.uid, droppedPart);
          }
      }
      setRewards({ coins, part: droppedPart });
  };

  const handleSurrender = () => {
      if (battleEnded) {
          navigation.goBack();
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
                  } 
              }
          ]
      );
  };

  const handleReturnToMenu = () => {
      navigation.navigate('Home');
  };

  const handleAttack = (attackIndex) => {
    if (isAttacking || battleEnded) return;

    const weaponStats = WEAPON_STATS[loadout.Weapon] || WEAPON_STATS.WeaponGeneralis;
    const attack = weaponStats.attacks[attackIndex];
    if (!attack) return;

    if (playerEN < attack.cost) {
        Alert.alert("Low Energy", "Not enough Skill Points to use this attack!");
        return;
    }

    setIsAttacking(true);
    setPlayerEN(prev => Math.max(0, prev - attack.cost));
    setBattleLog(prev => [...prev, `Used ${attack.name} (-${attack.cost} EN)`]);
    
    // Show Player Attack (Pop out at weapon, no projectile)
    setPlayerAnimVisible(true);

    setTimeout(() => {
        setPlayerAnimVisible(false);

        const playerDamage = calculateDamage(attack.damage);
        const newEnemyHP = Math.max(0, enemyHP - playerDamage);
        setEnemyHP(newEnemyHP);
        setBattleLog(prev => [...prev, `-> Dealt ${playerDamage} damage!`]);

        if (newEnemyHP <= 0) {
            setBattleLog(prev => [...prev, "Enemy defeated!"]);
            generateRewards().then(() => {
                setBattleEnded(true);
                setWinner('player');
                setIsAttacking(false);
            });
            return;
        }

        setTimeout(() => {
            const currentEnemy = ENEMY_DATA[enemyLevel];
            setBattleLog(prev => [...prev, `${currentEnemy.name} attacks!`]);
            setEnemyAnimVisible(true);

            setTimeout(() => {
                setEnemyAnimVisible(false);
                const enemyDamage = calculateEnemyDamage(currentEnemy.baseDmg);
                const newPlayerHP = Math.max(0, playerHP - enemyDamage);
                setPlayerHP(newPlayerHP);
                setBattleLog(prev => [...prev, `-> Took ${enemyDamage} damage!`]);

                const engine = ENGINE_STATS[loadout.Engines] || ENGINE_STATS.EngineGeneralis;
                const regenAmount = engine.regen || 4; 
                setPlayerEN(prev => Math.min(playerMaxEN, prev + regenAmount));
                setBattleLog(prev => [...prev, `System recharged +${regenAmount} EN`]);

                if (newPlayerHP <= 0) {
                    setBattleLog(prev => [...prev, "You were defeated!"]);
                    setBattleEnded(true);
                    setWinner('enemy');
                    setIsAttacking(false);
                    return;
                }
                setIsAttacking(false);
            }, 600); // Enemy attack duration
        }, 800);
    }, 600); // Player attack duration
  };

  const handleNextBattle = () => {
      setBattleEnded(false);
      setWinner(null);
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5CB85C" />
        <Text style={{ marginTop: 10, color: '#444' }}>Loading Battle...</Text>
      </SafeAreaView>
    );
  }

  const equippedWeapon = loadout.Weapon;
  const equippedChassis = loadout.Chassis;
  const equippedEngine = loadout.Engines;
  const equippedWheels = loadout.Wheels;
  
  const weaponStats = WEAPON_STATS[equippedWeapon] || WEAPON_STATS.WeaponGeneralis;
  const currentEnemy = ENEMY_DATA[enemyLevel];
  const playerAttackGif = BATTLE_ASSETS.playerAttacks[equippedWeapon] || BATTLE_ASSETS.playerAttacks.WeaponGeneralis;

  const playerHPPercent = (playerHP / playerMaxHP) * 100;
  const enemyHPPercent = (enemyHP / enemyMaxHP) * 100;
  const playerENPercent = (playerEN / playerMaxEN) * 100;

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
          <Text style={styles.enemyLabel}>{currentEnemy.name} (Lvl {enemyLevel + 1})</Text>
          <View style={styles.spriteWrapper}>
            <Image 
                source={currentEnemy.image} 
                style={[styles.enemyImg, enemyLevel === 2 && { width: 180, height: 180 }]} 
            />
            {playerAnimVisible && (
                <Image source={playerAttackGif} style={styles.attackEffect} resizeMode="contain" />
            )}
          </View>
          {/* Enemy HP Text Inside Bar */}
          <View style={styles.healthBar}>
            <View style={[styles.healthFill, { width: `${Math.max(0, enemyHPPercent)}%`, backgroundColor: "#E74C3C" }]} />
            <Text style={styles.barTextOverlay}>{Math.max(0, enemyHP)} / {enemyMaxHP}</Text>
          </View>
        </View>

        {/* --- PLAYER --- */}
        <View style={styles.playerContainer}>
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
            
            {/* Player Attack Animation - Pops out ON the weapon, rotated towards enemy */}
            {enemyAnimVisible && (
                <Image source={BATTLE_ASSETS.enemyAttack} style={styles.attackEffect} resizeMode="contain" />
            )}
            
             {/* Player HP & EN Bars - Overlayed closer to bot */}
             <View style={styles.statsOverlay}>
                <Text style={styles.playerLabel}>{playerName}</Text>
                
                {/* Health Bar */}
                <View style={styles.healthBar}>
                    <View style={[styles.healthFill, { width: `${Math.max(0, playerHPPercent)}%`, backgroundColor: "#27AE60" }]} />
                    <Text style={styles.barTextOverlay}>{Math.max(0, playerHP)} / {playerMaxHP} HP</Text>
                </View>
                
                {/* Energy Bar */}
                <View style={[styles.healthBar, { borderColor: 'rgba(0,191,255,0.5)', marginTop: 4 }]}>
                    <View style={[styles.healthFill, { width: `${Math.max(0, playerENPercent)}%`, backgroundColor: "#00BFFF" }]} />
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
                                <Text style={styles.rewardText}>🔧 Unlocked: {rewards.part}</Text>
                                <Image source={ASSETS.parts[rewards.part]} style={styles.rewardImage} resizeMode="contain"/>
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
                                <Text style={styles.buttonText}>REMATCH</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.okButton} onPress={handleNextBattle}>
                                <Text style={styles.buttonText}>NEXT</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.rematchButton} onPress={handleRestart}>
                                <Text style={styles.buttonText}>RETRY</Text>
                            </TouchableOpacity>
                             <TouchableOpacity style={styles.okButton} onPress={handleReturnToMenu}>
                                <Text style={styles.buttonText}>EXIT</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                 {winner === 'player' && (
                    <TouchableOpacity style={[styles.okButton, { marginTop: 10, backgroundColor: '#555', borderColor: '#777' }]} onPress={handleReturnToMenu}>
                        <Text style={[styles.buttonText, { color: '#FFF' }]}>RETURN TO BASE</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      </View>

      {/* --- ATTACK BUTTONS (Minimized) --- */}
      <View style={styles.skillBox}>
        <View style={styles.skillRow}>
          <TouchableOpacity 
            style={[
                styles.skillButton, 
                (battleEnded || isAttacking || playerEN < weaponStats.attacks[0].cost) ? styles.skillButtonDisabled : {}
            ]}
            onPress={() => handleAttack(0)}
            disabled={battleEnded || isAttacking || playerEN < weaponStats.attacks[0].cost}
          >
            <Text style={styles.skillText}>{weaponStats.attacks[0]?.name}</Text>
            <Text style={styles.skillDamage}>
                {weaponStats.attacks[0]?.damage.min}-{weaponStats.attacks[0]?.damage.max} DMG
            </Text>
            <Text style={styles.skillCost}>{weaponStats.attacks[0]?.cost} EN</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
                styles.skillButton, 
                (battleEnded || isAttacking || playerEN < weaponStats.attacks[1].cost) ? styles.skillButtonDisabled : {}
            ]}
            onPress={() => handleAttack(1)}
            disabled={battleEnded || isAttacking || playerEN < weaponStats.attacks[1].cost}
          >
            <Text style={styles.skillText}>{weaponStats.attacks[1]?.name}</Text>
            <Text style={styles.skillDamage}>
                {weaponStats.attacks[1]?.damage.min}-{weaponStats.attacks[1]?.damage.max} DMG
            </Text>
            <Text style={styles.skillCost}>{weaponStats.attacks[1]?.cost} EN</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillRow}>
          <TouchableOpacity style={[styles.skillButton, styles.skillButtonDisabled]} disabled={true}>
            <Text style={styles.skillText}>Ultimate</Text>
            <Text style={styles.skillDamage}>Locked</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.skillButton, styles.skillButtonDisabled]} disabled={true}>
            <Text style={styles.skillText}>Repair</Text>
            <Text style={styles.skillDamage}>Locked</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // SAFE AREA FOR TOP BUTTON
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
      fontSize: 14,
  },

  arenaContainer: { flex: 1, position: 'relative', paddingHorizontal: 12, paddingVertical: 16 },
  
  spriteWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  
  // ANIMATION STYLES - Rotated towards enemy (approx -45deg)
  attackEffect: {
    position: 'absolute',
    width: 300,   
    height: 300, 
    top: 60,    
    right: 5,    
    zIndex: 99,
    transform: [{ rotate: '10deg' }],
  },

  /* ENTITIES */
  enemyContainer: { position: 'absolute', top: 80, right: 20, alignItems: "center", zIndex: 10 },
  enemyLabel: { fontSize: 16, fontWeight: 'bold', color: '#FF3B30', marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  enemyImg: { width: 160, height: 160, resizeMode: "contain", marginBottom: 6 }, // Increased size

  // Updated Position: Lifted up considerably to 240
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
      width: 240, // Increased from 180
      height: 240, // Increased from 180
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'relative', 
      marginBottom: 0
  },
  robotLayer: { position: 'absolute', width: '100%', height: '100%' },

  // Stats Overlay (HP/EN) positioned further down from center
  statsOverlay: {
      position: 'absolute',
      bottom: -70, // Moved down to avoid overlapping wheels
      width: '100%',
      alignItems: 'center',
      zIndex: 100,
  },

  /* HEALTH BARS */
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
      bottom: 0,
      backgroundColor: "#5CB85C" 
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
  
  /* VICTORY MODAL */
  resultOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
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
    fontStyle: 'italic',
  },
  rankContainer: { marginBottom: 20 },
  rankText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 100, 0, 0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
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
  rewardsTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 5 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rewardText: { color: '#81F7D8', fontWeight: 'bold', fontSize: 16 },
  rewardImage: { width: 40, height: 40, marginLeft: 10 },
  noPartText: { color: '#AAA', fontSize: 12, fontStyle: 'italic' },
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
    alignItems: 'center',
  },
  okButton: {
    flex: 1,
    backgroundColor: '#F4C542',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
  },
  buttonText: { fontWeight: 'bold', color: '#3E3430', fontSize: 16 },

  /* SKILL BOX - MINIMIZED & RAISED */
  skillBox: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 2,
    borderTopColor: "#B4B4B4",
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'absolute',
    bottom: 40, 
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#B4B4B4",
    elevation: 5,
  },
  skillRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  skillButton: { 
      flex: 1, 
      backgroundColor: "#D8D8D8", 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: '#999', 
      justifyContent: "center", 
      alignItems: "center", 
      paddingVertical: 8,
      paddingHorizontal: 8,
      height: 50,
  },
  skillButtonDisabled: { backgroundColor: "#95A5A6", borderColor: '#7F8C8D', opacity: 0.6 },
  skillText: { fontWeight: "700", fontSize: 11, color: "#333" }, 
  skillDamage: { fontSize: 8, color: "#555", marginTop: 2 },
  skillCost: { fontSize: 9, color: "#007AFF", fontWeight: 'bold', marginTop: 1 },
});

export default BattleScreen;