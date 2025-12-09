import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, ScrollView, ImageBackground } from "react-native";
import { auth, db, doc, getDoc, onAuthStateChanged } from './database/firebase';

const BATTLE = {
  enemy: require("./assets/battle/enemy.png"),
  background: require("./assets/background/BattleBGday.png"),
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

const DEFAULT_LOADOUT = {
  Chassis: 'ChassisGeneralis',
  Engines: 'EngineGeneralis',
  Wheels: 'WheelsGeneralis',
  Weapon: 'WeaponGeneralis'
};

// Attack stats from spreadsheet
const ATTACK_STATS = {
  WeaponGeneralis: {
    name: 'Twin Anti-Air Guns',
    attacks: [
      { name: 'Burst Fire', damage: { min: 40, max: 60 } },
      { name: 'Suppressive Fire', damage: { min: 50, max: 70 } }
    ]
  },
  WeaponInnovare: {
    name: 'Missile Launcher Arrays',
    attacks: [
      { name: 'Offensive Launch', damage: { min: 65, max: 85 } },
      { name: 'Counter-Measure Launch', damage: { min: 60, max: 80 } }
    ]
  },
  WeaponCreativia: {
    name: 'Laser Spread',
    attacks: [
      { name: 'Laser Blast', damage: { min: 50, max: 70 } },
      { name: 'Overdrive Cascade', damage: { min: 85, max: 115 } }
    ]
  },
  ChassisGeneralis: { hp: 650 },
  ChassisInnovare: { hp: 750 },
  ChassisCreativia: { hp: 500 },
};

function BattleScreen() {
  const [loadout, setLoadout] = useState(DEFAULT_LOADOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [playerHP, setPlayerHP] = useState(650);
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerMaxHP, setPlayerMaxHP] = useState(650);
  const [enemyMaxHP, setEnemyMaxHP] = useState(100);
  const [battleLog, setBattleLog] = useState(['Battle Started!']);
  const [isAttacking, setIsAttacking] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerName, setPlayerName] = useState('Player');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userName = user.displayName || user.email;
        setPlayerName(userName);
        try {
          const docRef = doc(db, 'Roboquest-Loadout', userName);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.presets && data.presets.Default) {
              setLoadout(data.presets.Default);
              initializeBattle(data.presets.Default);
            } else {
              initializeBattle(DEFAULT_LOADOUT);
            }
          } else {
            initializeBattle(DEFAULT_LOADOUT);
          }
        } catch (error) {
          console.log("Error loading loadout:", error);
          initializeBattle(DEFAULT_LOADOUT);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeBattle = (currentLoadout) => {
    const chassisStats = ATTACK_STATS[currentLoadout.Chassis] || ATTACK_STATS.ChassisGeneralis;
    const baseHP = chassisStats.hp || 650;
    setPlayerMaxHP(baseHP);
    setPlayerHP(baseHP);
    setEnemyMaxHP(100);
    setEnemyHP(100);
  };

  const calculateDamage = (damageRange) => {
    const { min, max } = damageRange;
    const baseVariation = Math.floor(Math.random() * (max - min + 1) + min);
    const variation = Math.floor(baseVariation * (0.85 + Math.random() * 0.3));
    return Math.max(5, variation);
  };

  const handleAttack = (attackIndex) => {
    if (isAttacking || battleEnded) return;
    setIsAttacking(true);

    const weaponStats = ATTACK_STATS[loadout.Weapon] || ATTACK_STATS.WeaponGeneralis;
    const attack = weaponStats.attacks[attackIndex];
    if (!attack) {
      setIsAttacking(false);
      return;
    }

    const playerDamage = calculateDamage(attack.damage);
    const newEnemyHP = Math.max(0, enemyHP - playerDamage);
    setEnemyHP(newEnemyHP);
    setBattleLog(prev => [...prev, `You used ${attack.name}! Dealt ${playerDamage} damage!`]);

    setTimeout(() => {
      if (newEnemyHP <= 0) {
        setBattleLog(prev => [...prev, "Enemy defeated!"]);
        setBattleEnded(true);
        setWinner('player');
        setIsAttacking(false);
        return;
      }

      const enemyAttack = weaponStats.attacks[Math.floor(Math.random() * 2)];
      const enemyDamage = calculateDamage(enemyAttack.damage);
      const newPlayerHP = Math.max(0, playerHP - enemyDamage);
      setPlayerHP(newPlayerHP);
      setBattleLog(prev => [...prev, `Enemy used ${enemyAttack.name}! Dealt ${enemyDamage} damage!`]);

      if (newPlayerHP <= 0) {
        setBattleLog(prev => [...prev, "You were defeated!"]);
        setBattleEnded(true);
        setWinner('enemy');
        setIsAttacking(false);
        return;
      }
      setIsAttacking(false);
    }, 600);
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
  const weaponStats = ATTACK_STATS[equippedWeapon] || ATTACK_STATS.WeaponGeneralis;
  const playerHPPercent = (playerHP / playerMaxHP) * 100;
  const enemyHPPercent = (enemyHP / enemyMaxHP) * 100;

  return (
    <ImageBackground source={BATTLE.background} style={styles.container} resizeMode="cover">
      <View style={styles.arenaContainer}>
        {/* ENEMY TOP RIGHT */}
        <View style={styles.enemyContainer}>
          <Text style={styles.enemyLabel}>Enemy</Text>
          <Image source={BATTLE.enemy} style={styles.enemyImg} />
          <View style={styles.healthBar}>
            <View style={[styles.healthFill, { width: `${Math.max(0, enemyHPPercent)}%`, backgroundColor: "#E74C3C" }]} />
          </View>
          <Text style={styles.healthText}>{Math.max(0, enemyHP)} / {enemyMaxHP}</Text>
        </View>

        {/* PLAYER BOTTOM LEFT */}
        <View style={styles.playerContainer}>
          <View style={styles.robotStage}>
            {equippedWheels && ASSETS.parts[equippedWheels] && (
              <Image 
                source={ASSETS.parts[equippedWheels]} 
                style={[styles.robotLayer, { zIndex: 30 }]} 
                resizeMode="contain" 
              />
            )}
            {equippedChassis && ASSETS.parts[equippedChassis] && (
              <Image 
                source={ASSETS.parts[equippedChassis]} 
                style={[styles.robotLayer, { zIndex: 10 }]} 
                resizeMode="contain" 
              />
            )}
            {equippedEngine && ASSETS.parts[equippedEngine] && (
              <Image 
                source={ASSETS.parts[equippedEngine]} 
                style={[styles.robotLayer, { zIndex: 20 }]} 
                resizeMode="contain" 
              />
            )}
            {equippedWeapon && ASSETS.parts[equippedWeapon] && (
              <Image 
                source={ASSETS.parts[equippedWeapon]} 
                style={[styles.robotLayer, { zIndex: 40, top: getWeaponOffset() }]} 
                resizeMode="contain" 
              />
            )}
          </View>
          <Text style={styles.playerLabel}>{playerName}</Text>
          <View style={styles.healthBar}>
            <View style={[styles.healthFill, { width: `${Math.max(0, playerHPPercent)}%`, backgroundColor: playerHP > 0 ? "#27AE60" : "#E74C3C" }]} />
          </View>
          <Text style={styles.healthText}>{Math.max(0, playerHP)} / {playerMaxHP}</Text>
        </View>

        {/* BATTLE RESULT OVERLAY */}
        {battleEnded && (
          <View style={styles.resultOverlay}>
            <View style={styles.resultBox}>
              <Text style={[styles.resultTitle, winner === 'player' ? styles.victoryText : styles.defeatText]}>
                {winner === 'player' ? 'VICTORY!' : 'DEFEAT!'}
              </Text>
              <Text style={styles.resultMessage}>
                {winner === 'player' ? 'You defeated the enemy!' : 'You were defeated...'}
              </Text>
              <TouchableOpacity style={styles.resultButton} onPress={() => {
                setBattleEnded(false);
                setWinner(null);
                setPlayerHP(playerMaxHP);
                setEnemyHP(enemyMaxHP);
                setBattleLog(['Battle Started!']);
              }}>
                <Text style={styles.resultButtonText}>Battle Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ATTACK BUTTONS - BOTTOM 4-BUTTON GRID */}
      <View style={styles.skillBox}>
        <View style={styles.skillRow}>
          <TouchableOpacity 
            style={[styles.skillButton, battleEnded || isAttacking ? styles.skillButtonDisabled : {}]}
            onPress={() => handleAttack(0)}
            disabled={battleEnded || isAttacking}
          >
            <Text style={styles.skillText}>Basic</Text>
            <Text style={styles.skillDamage}>{weaponStats.attacks[0]?.damage.min}-{weaponStats.attacks[0]?.damage.max}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.skillButton, battleEnded || isAttacking ? styles.skillButtonDisabled : {}]}
            onPress={() => handleAttack(1)}
            disabled={battleEnded || isAttacking}
          >
            <Text style={styles.skillText}>Skill 1</Text>
            <Text style={styles.skillDamage}>{weaponStats.attacks[1]?.damage.min}-{weaponStats.attacks[1]?.damage.max}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.skillRow}>
          <TouchableOpacity 
            style={[styles.skillButton, battleEnded || isAttacking ? styles.skillButtonDisabled : {}]}
            disabled={battleEnded || isAttacking}
          >
            <Text style={styles.skillText}>Skill 2</Text>
            <Text style={styles.skillDamage}>Coming Soon</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.skillButton, battleEnded || isAttacking ? styles.skillButtonDisabled : {}]}
            disabled={battleEnded || isAttacking}
          >
            <Text style={styles.skillText}>Skill 3</Text>
            <Text style={styles.skillDamage}>Coming Soon</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* MAIN BATTLE ARENA */
  arenaContainer: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  /* ENEMY TOP RIGHT */
  enemyContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },
  enemyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  enemyImg: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 6,
  },

  /* PLAYER BOTTOM LEFT */
  playerContainer: {
    position: 'absolute',
    bottom: 220,
    left: 20,
    alignItems: "center",
    zIndex: 10,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 4,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  robotStage: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  robotLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  /* HEALTH BARS */
  healthBar: {
    width: 130,
    height: 14,
    backgroundColor: "rgba(50, 50, 50, 0.8)",
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 3,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  healthFill: {
    height: "100%",
    backgroundColor: "#5CB85C",
  },
  healthText: {
    marginTop: 3,
    fontSize: 11,
    color: "#FFF",
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  /* BATTLE RESULT OVERLAY */
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  resultBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  resultTitle: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 12,
  },
  victoryText: {
    color: '#27AE60',
  },
  defeatText: {
    color: '#E74C3C',
  },
  resultMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    fontWeight: '600',
  },
  resultButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2980B9',
  },
  resultButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* SKILL BOX - BOTTOM 4-BUTTON GRID */
  skillBox: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 2,
    borderTopColor: "#B4B4B4",
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: 'absolute',
    bottom: 40,
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#B4B4B4",
  },

  skillNumberBox: {
    display: 'none',
  },
  skillNumberText: {
    display: 'none',
  },

  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  /* SKILL BUTTONS */
  skillButton: {
    flex: 1,
    backgroundColor: "#D8D8D8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  skillButtonDisabled: {
    backgroundColor: "#95A5A6",
    borderColor: '#7F8C8D',
    opacity: 0.6,
  },

  skillText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#333",
  },
  skillDamage: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
});

export default BattleScreen;
