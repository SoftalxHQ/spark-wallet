import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import StorageService from '@/services/StorageService';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export default function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await StorageService.validateUserPassword(password);
      if (isValid) {
        await StorageService.setAppLocked(false);
        onUnlock();
      } else {
        Alert.alert('Error', 'Incorrect password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error validating password:', error);
      Alert.alert('Error', 'Failed to validate password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <IconSymbol name="shield.fill" size={48} color={SparkColors.black} />
          </View>
          <ThemedText type="title" style={styles.title}>App Locked</ThemedText>
          <ThemedText style={styles.subtitle}>Enter your password to continue</ThemedText>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Password"
            placeholderTextColor={SparkColors.darkGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
            onSubmitEditing={handleUnlock}
            editable={!isLoading}
          />
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, isLoading && styles.disabledButton]}
          onPress={handleUnlock}
          disabled={isLoading}
        >
          <ThemedText style={styles.unlockButtonText}>
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: SparkColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: SparkColors.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: SparkColors.lightGray,
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  passwordInput: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: SparkColors.white,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  unlockButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
