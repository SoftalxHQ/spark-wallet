import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import StorageService from '@/services/StorageService';
import * as LocalAuthentication from 'expo-local-authentication';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export default function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const checkBiometricStatus = async () => {
      try {
        const enabled = await StorageService.isBiometricEnabled();
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricEnabled(enabled && hasHardware && isEnrolled);
      } catch (error) {
        console.error('Error checking biometric status:', error);
      }
    };
    
    checkBiometricStatus();
  }, []);

  const handleBiometricUnlock = async () => {
    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your wallet',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await StorageService.setAppLocked(false);
        onUnlock();
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('Error with biometric unlock:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Biometric Button */}
        {biometricEnabled && (
          <TouchableOpacity
            style={[styles.biometricButton, isLoading && styles.disabledButton]}
            onPress={handleBiometricUnlock}
            disabled={isLoading}
          >
            <ThemedText style={styles.biometricButtonText}>
              👆 Use Biometric
            </ThemedText>
          </TouchableOpacity>
        )}

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
  biometricButton: {
    backgroundColor: SparkColors.brown,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  biometricButtonText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
