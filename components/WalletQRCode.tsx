import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface WalletQRCodeProps {
  walletAddress: string;
  size?: number;
  showAddress?: boolean;
  showCopyButton?: boolean;
  logoSource?: any;
}

export default function WalletQRCode({ 
  walletAddress, 
  size = 200, 
  showAddress = true, 
  showCopyButton = true,
  logoSource
}: WalletQRCodeProps) {
  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={walletAddress}
          size={size}
          color={SparkColors.black}
          backgroundColor={SparkColors.white}
          logo={logoSource || require('../assets/images/logo.png')}
          logoSize={size * 0.15}
          logoBackgroundColor={SparkColors.white}
          logoMargin={2}
          logoBorderRadius={8}
        />
      </View>
      
      {showAddress && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>{formatAddress(walletAddress)}</Text>
            {showCopyButton && (
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={handleCopyAddress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="chevron.right" size={16} color={SparkColors.gold} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: SparkColors.white,
    borderRadius: 16,
    shadowColor: SparkColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  addressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 14,
    color: SparkColors.darkGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SparkColors.darkBrown,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  addressText: {
    fontSize: 16,
    color: SparkColors.white,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
});
