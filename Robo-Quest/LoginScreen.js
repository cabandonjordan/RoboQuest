import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Dimensions,
  Animated,
  Modal, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, signInWithEmailAndPassword } from './database/firebase';

const { width, height } = Dimensions.get('window');

const TitleScreen = () => {
  const navigation = useNavigation();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animation Values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Fade in UI
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. Infinite Rotation for Cogwheel
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000, 
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Pulse Breathing Effect for Gear
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Attention Pulse for Button
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartGame = () => {
    setShowLogin(true);
  };

  const handleProfilePress = () => {
    setShowLogin(true);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      setShowLogin(false);
      navigation.navigate('Home'); 
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/wrong-password') {
        alert('Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        alert('No account found with this email.');
      } else {
        alert('Login Failed: ' + error.message);
      }
    }
  };

  // Interpolate rotation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <Image 
        source={require('./assets/background/NewLoadingBg.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Dark Overlay for "Badass" Contrast */}
      <View style={styles.overlay} />

      {/* Profile Icon - Top Right */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={handleProfilePress}
      >
        <Ionicons name="person" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Centered Cogwheel Animation */}
        <View style={styles.gearContainer}>
          <Animated.Image 
            source={require('./assets/icons/settings.png')}
            style={[
              styles.gear,
              {
                transform: [
                  { rotate: spin },
                  { scale: pulseAnim }
                ]
              }
            ]}
            resizeMode="contain"
          />
          {/* Inner "Core" Glow */}
          <View style={styles.coreGlow} />
        </View>

        {/* Tap to Play Button - Highly Visible */}
        <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handleStartGame}
            activeOpacity={0.8}
          >
            <Text style={styles.playButtonText}>TAP TO START</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>

      {/* Login Modal */}
      <Modal
        visible={showLogin}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogin(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLogin(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.glassCard}>
                <View style={styles.headerContainer}>
                  <Ionicons name="log-in-outline" size={40} color="#4b5563" style={{ marginBottom: 10 }} />
                  <Text style={styles.modalTitle}>Welcome Back</Text>
                  <Text style={styles.subtitle}>Sign in to continue your quest!</Text>
                </View>

                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                       <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Remember Me Checkbox */}
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkboxWrapper}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Remember me</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.continueButtonText}>
                      {loading ? "LOGGING IN..." : "LOG IN"}
                    </Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Sign Up Button */}
                  <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setShowLogin(false);
                        navigation.navigate('Signup');
                      }}
                    >
                      <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark tint for UI pop
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)', 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gearContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 40, 
  },
  gear: {
    width: 150, // Reduced from 250 for a cleaner look
    height: 150,
    tintColor: '#FFFFFF',
    shadowColor: "#FFAE00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  coreGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 174, 0, 0.4)',
    shadowColor: "#FFAE00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    zIndex: -1,
  },
  playButton: {
    width: width * 0.75, // Slightly wider
    paddingVertical: 20,
    backgroundColor: '#FFAE00', // Solid Orange background for Max Visibility
    borderRadius: 30,
    marginBottom: 80,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFAE00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000000', // Black text on Orange for high contrast
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  
  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  glassCard: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingVertical: 35,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 15,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default TitleScreen;