import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal, Alert, Clipboard } from 'react-native';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import NetworkSelector from '@/components/NetworkSelector';
import NetworkConfigService, { NetworkType } from '@/services/NetworkConfigService';
import StorageService from '@/services/StorageService';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('mainnet');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [walletAddress, setWalletAddress] = useState('0x1234...5678');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [activeWallet, setActiveWallet] = useState<any>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load current network
      const network = NetworkConfigService.getCurrentNetwork();
      setCurrentNetwork(network);

      // Load user email from storage
      const userData = await StorageService.getUserData();
      if (userData?.email) {
        setUserEmail(userData.email);
      }

      // Load active wallet address
      const wallet = await StorageService.getActiveWallet();
      if (wallet) {
        setActiveWallet(wallet);
        const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
        setWalletAddress(shortAddress);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleNetworkChange = async (network: NetworkType) => {
    setCurrentNetwork(network);
    
    // Switch network using NetworkConfigService (this will handle service updates)
    await NetworkConfigService.switchNetwork(network);
  };

  const handleWalletAddressPress = () => {
    setShowWalletModal(true);
  };

  const handleExportPrivateKey = () => {
    if (activeWallet?.privateKey) {
      Alert.alert(
        'Export Private Key',
        'Your private key will be copied to clipboard. Keep it secure!',
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
    }
  };

  const handleShowRecoveryPhrase = () => {
    Alert.alert(
      'Recovery Phrase',
      'Recovery phrase functionality will be implemented in the next phase.',
      [{ text: 'OK' }]
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
        { name: 'Change Password', icon: '🔒', onPress: undefined },
        { name: 'Two-Factor Authentication', icon: '🔐', onPress: undefined },
        { name: 'Biometric Login', icon: '👆', onPress: undefined },
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

          {/* Test App Lock */}
          <TouchableOpacity 
            style={styles.walletActionButton}
            onPress={async () => {
              await StorageService.setAppLocked(true);
              Alert.alert('Test', 'App locked manually - restart app to test unlock');
            }}
          >
            <View style={styles.walletActionContent}>
              <IconSymbol name="shield.fill" size={20} color={SparkColors.gold} />
              <ThemedText style={styles.walletActionText}>Test App Lock</ThemedText>
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
