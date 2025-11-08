import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from "react-native";

const BATTLE = {
  player: require("./assets/battle/player.png"),
  enemy: require("./assets/battle/enemy.png"),
};

function BattleScreen() {
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

      {/* PLAYER (Bottom Left above skills) */}
      <View style={styles.playerContainer}>
        <Image source={BATTLE.player} style={styles.playerImg} />
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
