import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from "react-native";
import { auth, db, doc, getDoc, onAuthStateChanged } from './database/firebase';

const BATTLE = {
  enemy: require("./assets/battle/enemy.png"),
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

function BattleScreen() {
  const [loadout, setLoadout] = useState(DEFAULT_LOADOUT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userName = user.displayName || user.email;
        try {
          const docRef = doc(db, 'Roboquest-Loadout', userName);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.presets && data.presets.Default) {
              setLoadout(data.presets.Default);
            }
          }
        } catch (error) {
          console.log("Error loading loadout:", error);
        }
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

  return (
    <SafeAreaView style={styles.container}>

      {/* ENEMY (Top Right) */}
      <View style={styles.enemyContainer}>
        <Image source={BATTLE.enemy} style={styles.enemyImg} />
        <View style={styles.healthBar}>
          <View style={[styles.healthFill, { width: "80%", backgroundColor: "#D9534F" }]} />
        </View>
        <Text style={styles.healthLabel}>Enemy</Text>
      </View>

      {/* PLAYER (Bottom Left above skills) - Using equipped loadout */}
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
        <View style={styles.healthBar}>
          <View style={[styles.healthFill, { width: "90%" }]} />
        </View>
        <Text style={styles.healthLabel}>Player</Text>
      </View>

      {/* SKILL BOX */}
      <View style={styles.skillBox}>
        <View style={styles.skillRow}>
          <TouchableOpacity style={styles.skillButton}>
            <Text style={styles.skillText}>Basic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skillButton}>
            <Text style={styles.skillText}>Skill 1</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.skillRow}>
          <TouchableOpacity style={styles.skillButton}>
            <Text style={styles.skillText}>Skill 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skillButton}>
            <Text style={styles.skillText}>Skill 3</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEFEF",
  },

  /* ENEMY TOP RIGHT */
  enemyContainer: {
    alignItems: "center",
    position: "absolute",
    top: 50,
    right: 25,
  },
  enemyImg: {
    width: 135,
    height: 135,
    resizeMode: "contain",
    marginBottom: 6,
  },

  /* PLAYER BOTTOM LEFT, ABOVE SKILLS */
  playerContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 240,
    left: 25,
  },
  robotStage: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  robotLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  playerImg: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 6,
  },

  /* HEALTH BARS */
  healthBar: {
    width: 130,
    height: 12,
    backgroundColor: "#CFCFCF",
    borderRadius: 6,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    backgroundColor: "#5CB85C",
  },
  healthLabel: {
    marginTop: 3,
    fontSize: 13,
    color: "#444",
  },

  /* SKILL BOX (LIFTED ABOVE BOTTOM BAR) */
  skillBox: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#B4B4B4",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 22,
    backgroundColor: "#FAFAFA",
  },

  skillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  /* SKILL BUTTONS (Smaller to avoid collision) */
  skillButton: {
    backgroundColor: "#D8D8D8",
    width: 115,   
    height: 48,  
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },

  skillText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
});

export default BattleScreen;
