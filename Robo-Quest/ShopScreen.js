import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";

const ShopScreen = () => {
  const [selectedChest, setSelectedChest] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const chestData = [
    { type: "Common Chest", price: "100 Scrap Coins" },
    { type: "RARE Chest", price: "250 Scrap Coins" },
    { type: "LEGENDARY Chest", price: "750 Scrap Coins" },
  ];

  const handleChestPress = (chest) => {
    setSelectedChest(chest);
    setClickCount(0);
  };

  const handleOpenAnimation = () => {
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
      alert(`${selectedChest.type} rewards revealed!`);
      setSelectedChest(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      {!selectedChest ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {chestData.map((chest, index) => (
            <TouchableOpacity key={index} style={styles.card} onPress={() => handleChestPress(chest)}>
              <View style={styles.chestIcon} />
              <Text style={styles.chestTitle}>{chest.type}</Text>
              <Text style={styles.price}>{chest.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centerChestContainer}>
          <Animated.View style={[styles.chestIconLarge, { transform: [{ scale: scaleAnim }] }]} />
          <Text style={styles.openText}>
            Tap chest to open ({3 - clickCount} taps left)
          </Text>

          {/* Full-screen press handler */}
          <TouchableOpacity style={styles.invisibleTouch} onPress={handleOpenAnimation} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#e3e3e3",
    paddingVertical: 20,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "gray",
    marginBottom: 20,
  },
  chestIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#b7b7b7",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "gray",
  },
  chestTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
  },
  centerChestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chestIconLarge: {
    width: 130,
    height: 130,
    backgroundColor: "#b7b7b7",
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "gray",
  },
  openText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
  },
  invisibleTouch: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default ShopScreen;
