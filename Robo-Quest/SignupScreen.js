import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  updateProfile,
  setDoc,
  doc
} from './database/firebase'; // your firebase.js

const SignupScreen = () => {
  const navigation = useNavigation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !pass || !confirmPass) {
      alert('Please fill out all fields.');
      return;
    }

    if (pass !== confirmPass) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Create account with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

      // 2️⃣ Update display name
      await updateProfile(userCredential.user, { displayName: username });

      // 3️⃣ Store user info in Firestore
      await setDoc(doc(db, 'RoboQuest-Users', userCredential.user.uid), {
        username: username,
        email: email,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
      });

      alert('Account created successfully!');

      // 4️⃣ Navigate back to Login modal
      navigation.goBack();

    } catch (error) {
      alert(`Signup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username (In-Game Name)"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPass}
          onChangeText={setConfirmPass}
        />

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backToLogin}>Back to Login</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    elevation: 10,
    shadowColor: '#000',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111827',
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 14,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  signUpButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  backToLogin: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '600',
  }
});

export default SignupScreen;
