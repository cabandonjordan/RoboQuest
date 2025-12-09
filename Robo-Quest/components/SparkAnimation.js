import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';

const SparkAnimation = ({ isActive = false, size = 40, color = '#FFD700', count = 8, duration = 1000 }) => {
  const animValues = useRef([]);
  const scales = useRef([]);
  const rotations = useRef([]);

  // Initialize animations
  useEffect(() => {
    animValues.current = Array(count).fill(0).map(() => new Animated.Value(0));
    scales.current = Array(count).fill(0).map(() => new Animated.Value(0));
    rotations.current = Array(count).fill(0).map(() => new Animated.Value(0));
  }, [count]);

  // Start animation when isActive changes to true
  useEffect(() => {
    if (isActive) {
      startAnimation();
    }
  }, [isActive]);

  const startAnimation = () => {
    // Reset all animations
    animValues.current.forEach(anim => anim.setValue(0));
    scales.current.forEach(scale => scale.setValue(0));
    rotations.current.forEach(rotation => rotation.setValue(0));

    const animations = animValues.current.map((anim, index) => {
      const delay = index * (duration / count / 3);
      
      return Animated.parallel([
        // Move outward from center
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scales.current[index], {
            toValue: 1,
            duration: duration * 0.3,
            delay,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(scales.current[index], {
            toValue: 0,
            duration: duration * 0.7,
            delay: delay + duration * 0.3,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Rotate spark
        Animated.timing(rotations.current[index], {
          toValue: 1,
          duration: duration * 2,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  };

  const getSparkPosition = (index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = size * 1.5;
    
    return {
      left: radius * Math.cos(angle),
      top: radius * Math.sin(angle),
    };
  };

  // Create spark elements
  const renderSparks = () => {
    return animValues.current.map((anim, index) => {
      const position = getSparkPosition(index);
      
      // Interpolate position
      const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, position.left],
      });
      
      const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, position.top],
      });
      
      // Interpolate scale
      const scale = scales.current[index].interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });
      
      // Interpolate rotation
      const rotate = rotations.current[index].interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.spark,
            {
              backgroundColor: color,
              width: size / 3,
              height: size / 3,
              borderRadius: size / 6,
              transform: [
                { translateX },
                { translateY },
                { scale },
                { rotate },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width: size * 3, height: size * 3 }]}>
      {renderSparks()}
      {/* Center glow */}
      {isActive && (
        <Animated.View
          style={[
            styles.centerGlow,
            {
              backgroundColor: color,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spark: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    opacity: 0.7,
  },
});

export default SparkAnimation;