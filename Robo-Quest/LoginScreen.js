import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Modal, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TitleScreen = () => {
  const navigation = useNavigation();
  const [isStarting, setIsStarting] = React.useState(false);
  const [showLogin, setShowLogin] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleStartGame = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      setShowLogin(true);
    }, 300);
  };

  const handleLogin = () => {
    console.log('Login credentials submitted.');
    setShowLogin(false);
    // Navigate to main menu after login
    navigation.navigate('Home');
  };

  const glitchStyle = {
    fontFamily: 'DigitalGlitchDemo',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, glitchStyle]}>ROBOQUEST</Text>
          <Text style={[styles.subtitle, glitchStyle]}>PHOTO OPS</Text>
        </View>

        {/* Robot Figure Placeholder Area */}
        <View style={styles.robotContainer}>
          <View style={styles.robotPlaceholder}>
            <Text style={styles.robotText}>Robot Figure Placeholder</Text>
          </View>
        </View>

        {/* Start Game Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            isStarting && styles.startButtonPressed
          ]}
          onPress={handleStartGame}
          disabled={isStarting || showLogin}
        >
          <Text style={styles.startButtonText}>
            {isStarting ? '...' : 'Start Game'}
          </Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 32,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 48,
    color: '#000000',
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 36,
    color: '#000000',
    marginTop: 8,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  robotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 250,
  },
  robotPlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#f3f4f6',
    borderWidth: 4,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  robotText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    width: '80%',
    paddingVertical: 16,
    backgroundColor: '#4b5563',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 32,
  },
  startButtonPressed: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0,
    transform: [{ scale: 0.95 }],
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
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
