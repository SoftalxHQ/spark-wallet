import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AppLockScreen from '@/components/AppLockScreen';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricModalProps {
  visible: boolean;
  onClose: () => void;
  onEnableBiometric: () => void;
}

export default function BiometricModal({ visible, onClose, onEnableBiometric }: BiometricModalProps) {
  const [showAppLock, setShowAppLock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableBiometric = async () => {
    // Check if biometric hardware is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }
    
    if (!isEnrolled) {
      Alert.alert('Not Set Up', 'Please set up biometric authentication in your device settings first');
      return;
    }
    
    // First require app lock authentication
    setShowAppLock(true);
  };

  const handleAppLockUnlock = async () => {
    setShowAppLock(false);
    setIsLoading(true);
    
    try {
      await onEnableBiometric();
      onClose();
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowAppLock(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={[SparkColors.black, SparkColors.darkBrown]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Biometric Login</ThemedText>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <IconSymbol name="chevron.left" size={24} color={SparkColors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.biometricIcon}>👆</ThemedText>
          </View>

          <ThemedText style={styles.description}>
            Enable biometric authentication to unlock your wallet using your fingerprint or face recognition.
          </ThemedText>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <ThemedText style={styles.checkIcon}>✓</ThemedText>
              <ThemedText style={styles.featureText}>Faster wallet access</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.checkIcon}>✓</ThemedText>
              <ThemedText style={styles.featureText}>Enhanced security</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.checkIcon}>✓</ThemedText>
              <ThemedText style={styles.featureText}>Password stored in secure enclave</ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.enableButton, isLoading && styles.enableButtonDisabled]}
            onPress={handleEnableBiometric}
            disabled={isLoading}
          >
            <ThemedText style={styles.enableButtonText}>
              {isLoading ? 'Enabling...' : 'Enable Biometric Login'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>

        {/* App Lock Screen for Authentication */}
        {showAppLock && (
          <Modal
            visible={showAppLock}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowAppLock(false)}
          >
            <AppLockScreen onUnlock={handleAppLockUnlock} />
          </Modal>
        )}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  title: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  biometricIcon: {
    fontSize: 80,
  },
  description: {
    color: SparkColors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    color: SparkColors.gold,
    fontSize: 18,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    color: SparkColors.white,
    fontSize: 16,
  },
  enableButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  enableButtonDisabled: {
    backgroundColor: SparkColors.brown,
  },
  enableButtonText: {
    color: SparkColors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
});
