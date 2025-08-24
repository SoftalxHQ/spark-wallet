import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import NetworkConfigService, { NetworkType } from '@/services/NetworkConfigService';
import StorageService from '@/services/StorageService';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import AppLockScreen from '@/components/AppLockScreen';
import NetworkSelector from '@/components/NetworkSelector';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import BiometricModal from '@/components/BiometricModal';
import RecoveryPhraseModal from '@/components/RecoveryPhraseModal';

export default function ProfileScreen() {
  const [, setCurrentNetwork] = useState<NetworkType>('mainnet');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [walletAddress, setWalletAddress] = useState('0x1234...5678');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [activeWallet, setActiveWallet] = useState<any>(null);
  const [showPrivateKeyLock, setShowPrivateKeyLock] = useState(false);
  const [showRecoveryPhraseLock, setShowRecoveryPhraseLock] = useState(false);
  const [showRecoveryPhraseModal, setShowRecoveryPhraseModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load current network
      const network = NetworkConfigService.getCurrentNetwork();
      setCurrentNetwork(network);
      
      // Load user data
      const userData = await StorageService.getUserData();
      if (userData?.email) {
        setUserEmail(userData.email);
      }
      
      // Load active wallet
      const wallet = await StorageService.getActiveWallet();
      if (wallet) {
        setActiveWallet(wallet);
        // Format wallet address for display
        const formattedAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
        setWalletAddress(formattedAddress);
      }

      // Check biometric status
      const isBiometricEnabled = await StorageService.isBiometricEnabled();
      setBiometricEnabled(isBiometricEnabled);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleNetworkChange = async (network: NetworkType) => {
    setCurrentNetwork(network);
    
    // Switch network using NetworkConfigService (this will handle service updates)
    await NetworkConfigService.switchNetwork(network);
    
    // Force app reload to refetch all data with new network
    router.replace('/(tabs)');
  };


  const handleWalletAddressPress = () => {
    setShowWalletModal(true);
  };

  const handleExportPrivateKey = () => {
    console.log('Export private key button pressed');
    setShowPrivateKeyLock(true);
  };

  const handlePrivateKeyUnlock = () => {
    setShowPrivateKeyLock(false);
    
    if (activeWallet?.privateKey) {
      Alert.alert(
        'Private Key',
        `${activeWallet.privateKey}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              Clipboard.setString(activeWallet.privateKey);
              Alert.alert('Success', 'Private key copied to clipboard');
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'No private key available');
    }
  };

  const handleShowRecoveryPhrase = () => {
    setShowRecoveryPhraseLock(true);
  };

  const handleRecoveryPhraseUnlock = () => {
    setShowRecoveryPhraseLock(false);
    
    if (activeWallet?.mnemonic) {
      setShowRecoveryPhraseModal(true);
    } else {
      Alert.alert('Error', 'No recovery phrase available');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const isValid = await StorageService.validateUserPassword(currentPassword);
      if (isValid) {
        await StorageService.saveUserPassword(newPassword);
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePasswordModal(false);
      } else {
        Alert.alert('Error', 'Current password is incorrect');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleEnableBiometric = async () => {
    try {
      // Enable biometric authentication
      await StorageService.setBiometricEnabled(true);
      setBiometricEnabled(true);
      Alert.alert('Success', 'Biometric login enabled successfully');
      setShowBiometricModal(false);
    } catch (error) {
      console.error('Error enabling biometric:', error);
      Alert.alert('Error', 'Failed to enable biometric login. Please try again.');
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Login',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.setBiometricEnabled(false);
              setBiometricEnabled(false);
              Alert.alert('Success', 'Biometric login disabled');
            } catch (error) {
              console.error('Error disabling biometric:', error);
              Alert.alert('Error', 'Failed to disable biometric login');
            }
          }
        }
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        { name: 'Wallet Address', value: walletAddress, icon: '🔗', onPress: handleWalletAddressPress },
        { name: 'Email', value: userEmail, icon: '📧', onPress: undefined },
      ]
    },
    {
      title: 'Security',
      items: [
        { name: 'Change Password', icon: '🔒', onPress: () => setShowChangePasswordModal(true), value: undefined },
        { 
          name: biometricEnabled ? 'Disable Biometric Login' : 'Biometric Login', 
          icon: '👆', 
          onPress: biometricEnabled ? handleDisableBiometric : () => setShowBiometricModal(true), 
          value: undefined 
        },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Currency', value: 'USD', icon: '💵', onPress: undefined },
        { name: 'Language', value: 'English', icon: '🌍', onPress: undefined },
        { name: 'Notifications', icon: '🔔', onPress: undefined },
      ]
    }
  ];

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        

        <View style={styles.header}>
          <View style={styles.profileAvatar}>
            <ThemedText style={styles.avatarText}>👤</ThemedText>
          </View>
          <ThemedText type="title" style={styles.userName}>John Doe</ThemedText>
          <ThemedText style={styles.userEmail}>user@example.com</ThemedText>
        </View>

        {/* Network Selector Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Network</ThemedText>
          <NetworkSelector onNetworkChange={handleNetworkChange} />
        </View>

        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex} 
                  style={styles.settingItem}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <ThemedText style={styles.settingIcon}>{item.icon}</ThemedText>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.settingName}>{item.name}</ThemedText>
                      {item.value && (
                        <ThemedText style={styles.settingValue}>{item.value}</ThemedText>
                      )}
                    </View>
                  </View>
                  <ThemedText style={styles.settingArrow}>›</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        

        <TouchableOpacity style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Wallet Details Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="title" style={styles.modalTitle}>Wallet Details</ThemedText>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowWalletModal(false)}
            >
              <IconSymbol name="chevron.left" size={24} color={SparkColors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Wallet Address */}
            <View style={styles.walletDetailItem}>
              <ThemedText style={styles.walletDetailLabel}>Wallet Address</ThemedText>
              <TouchableOpacity 
                style={styles.walletDetailValue}
                onPress={() => {
                  if (activeWallet?.address) {
                    Clipboard.setString(activeWallet.address);
                    Alert.alert('Copied', 'Wallet address copied to clipboard');
                  }
                }}
              >
                <ThemedText style={styles.walletDetailText}>
                  {activeWallet?.address || 'N/A'}
                </ThemedText>
                <IconSymbol name="creditcard.fill" size={16} color={SparkColors.gold} />
              </TouchableOpacity>
            </View>

          {/* Export Private Key */}
          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={handleExportPrivateKey}
          >
            <View style={styles.walletActionContent}>
              <IconSymbol name="shield.fill" size={20} color={SparkColors.gold} />
              <ThemedText style={styles.walletActionText}>Export Private Key</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color={SparkColors.lightGray} />
          </TouchableOpacity>

          {/* Recovery Phrase */}
          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={handleShowRecoveryPhrase}
          >
            <View style={styles.walletActionContent}>
              <IconSymbol name="lightbulb.fill" size={20} color={SparkColors.gold} />
              <ThemedText style={styles.walletActionText}>Recovery Phrase</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color={SparkColors.lightGray} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>

    {/* Private Key Lock Screen */}
    {showPrivateKeyLock && (
      <Modal
        visible={showPrivateKeyLock}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPrivateKeyLock(false)}
      >
        <AppLockScreen onUnlock={handlePrivateKeyUnlock} />
      </Modal>
    )}

    {/* Recovery Phrase Lock Screen */}
    {showRecoveryPhraseLock && (
      <Modal
        visible={showRecoveryPhraseLock}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowRecoveryPhraseLock(false)}
      >
        <AppLockScreen onUnlock={handleRecoveryPhraseUnlock} />
      </Modal>
    )}

    {/* Change Password Modal */}
    <ChangePasswordModal
      visible={showChangePasswordModal}
      onClose={() => setShowChangePasswordModal(false)}
      onChangePassword={handleChangePassword}
    />

    {/* Biometric Modal */}
    <BiometricModal
      visible={showBiometricModal}
      onClose={() => setShowBiometricModal(false)}
      onEnableBiometric={handleEnableBiometric}
    />

    {/* Recovery Phrase Modal */}
    <RecoveryPhraseModal
      visible={showRecoveryPhraseModal}
      onClose={() => setShowRecoveryPhraseModal(false)}
      mnemonic={activeWallet?.mnemonic || ''}
    />
  </LinearGradient>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    color: SparkColors.white,
    marginBottom: 4,
  },
  userEmail: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: SparkColors.white,
    marginBottom: 12,
    fontSize: 18,
  },
  sectionContent: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    color: SparkColors.white,
    fontSize: 16,
    marginBottom: 2,
  },
  settingValue: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  settingArrow: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  modalTitle: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  walletDetailItem: {
    marginBottom: 24,
  },
  walletDetailLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  walletDetailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  walletDetailText: {
    color: SparkColors.white,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 12,
  },
  walletActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  walletActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletActionText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
