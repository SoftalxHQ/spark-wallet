import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import WalletQRCode from './WalletQRCode';

interface WalletSuccessModalProps {
  visible: boolean;
  walletAddress: string;
  onClose: () => void;
}

export default function WalletSuccessModal({ visible, walletAddress, onClose }: WalletSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[SparkColors.black, SparkColors.darkBrown]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <IconSymbol name="bolt.circle.fill" size={64} color={SparkColors.gold} />
            </View>
            <Text style={styles.title}>Wallet Created Successfully!</Text>
            <Text style={styles.subtitle}>
              Your StarkNet smart wallet is ready to use. Save this QR code to easily share your wallet address.
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <WalletQRCode 
              walletAddress={walletAddress}
              size={240}
              showAddress={true}
              showCopyButton={true}
            />
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <IconSymbol name="shield.fill" size={24} color={SparkColors.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Secure & Private</Text>
                <Text style={styles.infoDescription}>Your private keys are encrypted and stored securely on your device</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <IconSymbol name="bolt.fill" size={24} color={SparkColors.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>StarkNet Ready</Text>
                <Text style={styles.infoDescription}>Deploy-on-first-transfer pattern - your wallet deploys automatically when funded</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <IconSymbol name="creditcard.fill" size={24} color={SparkColors.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Easy Sharing</Text>
                <Text style={styles.infoDescription}>Use the QR code above to receive payments from other wallets</Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueButtonText}>Continue to Wallet</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SparkColors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: SparkColors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  infoSection: {
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SparkColors.white,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: SparkColors.darkGray,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: SparkColors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SparkColors.black,
  },
});
