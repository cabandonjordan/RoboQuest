import React, { useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const TitleScreen = () => {
  const navigation = useNavigation();
  const [showLogin, setShowLogin] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  
  // Robot floating animation
  const robotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate robot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(robotAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(robotAnim, {
          toValue: 0,
          duration: 2000,
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

  const handleLogin = () => {
    console.log('Login credentials submitted.');
    console.log('Email:', email);
    console.log('Remember Me:', rememberMe);
    
    // Close modal
    setShowLogin(false);
    
    // Clear form
    setEmail('');
    setPassword('');
    
    // Navigate to Main Menu
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <Image 
        source={require('./assets/titlescreen/New_Clouds.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Profile Icon - Top Right */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={handleProfilePress}
      >
        <Image 
          source={require('./assets/titlescreen/profile.png')}
          style={styles.profileIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require('./assets/titlescreen/ROBOQUEST.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Robot */}
        <View style={styles.robotContainer}>
          <Animated.View
            style={[
              styles.robotAnimated,
              {
                transform: [{ translateY: robotAnim }],
              },
            ]}
          >
            <Image 
              source={require('./assets/titlescreen/titlescreen_Robot.png')}
              style={styles.robot}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Tap to Play Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={handleStartGame}
        >
          <Text style={styles.playButtonText}>TAP TO PLAY</Text>
        </TouchableOpacity>
      </View>

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
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>LOG IN</Text>

                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Email"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  {/* Remember Me Checkbox */}
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      {rememberMe && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Remember me</Text>
                    <Text style={styles.hintText}>
                      This can be changed in the settings.
                    </Text>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleLogin}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>

                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => console.log('Google Sign In')}
                >
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
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
    backgroundColor: '#87CEEB',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
  },
  profileButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFAE00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileIcon: {
    width: 30,
    height: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: width * 0.8,
    height: 100,
    marginTop: -50,
    marginBottom: 20,
  },
  robotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 400,
  },
  robotAnimated: {
    width: width * 0.7,
    height: 350,
  },
  robot: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    width: width * 0.6,
    paddingVertical: 16,
    backgroundColor: '#7BA8C0',
    borderRadius: 25,
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    backgroundColor: '#6b7280',
    borderRadius: 1,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'right',
    maxWidth: 150,
    marginLeft: 8,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#4b5563',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  separatorText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  googleButton: {
    width: '100%',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TitleScreen;
