import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, doc, getDoc, onAuthStateChanged } from './database/firebase';

// Part images mapping (matching LoadoutScreen.js)
const PART_IMAGES = {
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
};

// Part categories
const PART_CATEGORIES = {
  Chassis: ['ChassisCreativia', 'ChassisGeneralis', 'ChassisInnovare'],
  Engine: ['EngineCreativia', 'EngineGeneralis', 'EngineInnovare'],
  Weapon: ['WeaponCreativia', 'WeaponGeneralis', 'WeaponInnovare'],
  Wheels: ['WheelsCreativia', 'WheelsGeneralis', 'WheelsInnovare'],
};

const colors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  primary: '#00BFFF',
  secondary: '#FF4500',
  lightGray: '#666666',
  cardBackground: '#F5F5F5',
  border: '#E0E0E0',
};

const fonts = {
  heading: 'System',
  body: 'System',
};

function CollectionScreen() {
  const navigation = useNavigation();
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Load parts from Firebase
  const loadParts = async (user) => {
    if (!user) {
      setParts([]);
      setIsLoading(false);
      return;
    }

    try {
      const userId = user.uid;
      const userDocRef = doc(db, 'Roboquest-Collection', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userParts = data.parts || [];
        setParts(userParts);
      } else {
        setParts([]);
      }
    } catch (error) {
      console.error('❌ Error loading parts:', error);
      setParts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for auth state changes and load parts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      loadParts(user);
    });

    return () => unsubscribe();
  }, []);

  // Reload parts when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadParts(currentUser);
      }
    }, [currentUser])
  );

  // Organize parts by category
  const organizePartsByCategory = () => {
    const organized = {
      Chassis: [],
      Engine: [],
      Weapon: [],
      Wheels: [],
    };

    parts.forEach((partName) => {
      if (PART_CATEGORIES.Chassis.includes(partName)) {
        organized.Chassis.push(partName);
      } else if (PART_CATEGORIES.Engine.includes(partName)) {
        organized.Engine.push(partName);
      } else if (PART_CATEGORIES.Weapon.includes(partName)) {
        organized.Weapon.push(partName);
      } else if (PART_CATEGORIES.Wheels.includes(partName)) {
        organized.Wheels.push(partName);
      }
    });

    return organized;
  };

  const organizedParts = organizePartsByCategory();

  // Render a category section
  const renderCategorySection = (categoryName, categoryParts) => {
    return (
      <View key={categoryName} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {categoryParts.length === 0 ? (
          <View style={styles.emptyCategoryContainer}>
            <Text style={styles.emptyCategoryText}>No {categoryName.toLowerCase()} parts unlocked yet</Text>
          </View>
        ) : (
          <View style={styles.partsGrid}>
            {categoryParts.map((partName) => (
              <View key={partName} style={styles.partCard}>
                <Image
                  source={PART_IMAGES[partName]}
                  style={[
                    styles.partImage,
                    partName.startsWith('Engine') && styles.partImageLarge
                  ]}
                  resizeMode="contain"
                />
                <Text style={styles.partName}>{partName}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading collection...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalParts = parts.length;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parts Collection</Text>
        {totalParts > 0 && (
          <Text style={styles.headerSubtitle}>{totalParts} {totalParts === 1 ? 'part' : 'parts'} collected</Text>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {renderCategorySection('Chassis', organizedParts.Chassis)}
        {renderCategorySection('Engine', organizedParts.Engine)}
        {renderCategorySection('Weapon', organizedParts.Weapon)}
        {renderCategorySection('Wheels', organizedParts.Wheels)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.lightGray,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyCategoryContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyCategoryText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  partCard: {
    width: '47%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  partImageLarge: {
    width: 160,
    height: 160,
  },
  partName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CollectionScreen;
