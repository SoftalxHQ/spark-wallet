import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from './ui/IconSymbol';
import { SparkColors } from '../constants/Colors';

interface UtilityPaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  paymentDetails: {
    utilityType: string;
    provider: string;
    amount: number;
    accountNumber: string;
    transactionHash: string;
    token?: string;
    customerName?: string;
    tokenValue?: string;
    units?: string;
  };
}

export default function UtilityPaymentSuccessModal({ 
  visible, 
  onClose, 
  paymentDetails 
}: UtilityPaymentSuccessModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity': return '⚡';
      case 'airtime': return '📱';
      case 'data': return '📶';
      case 'tv': return '📺';
      default: return '💳';
    }
  };

  const getUtilityColor = (type: string) => {
    switch (type) {
      case 'electricity': return SparkColors.gold;
      case 'airtime': return '#4CAF50';
      case 'data': return '#2196F3';
      case 'tv': return '#9C27B0';
      default: return SparkColors.gold;
    }
  };

  const formatUtilityType = (type: string) => {
    switch (type) {
      case 'electricity': return 'Electricity';
      case 'airtime': return 'Airtime';
      case 'data': return 'Data Bundle';
      case 'tv': return 'Cable TV';
      default: return 'Utility';
    }
  };

  const formatAccountNumber = (type: string, accountNumber: string) => {
    switch (type) {
      case 'electricity': return `Meter: ${accountNumber}`;
      case 'airtime':
      case 'data': return `Phone: ${accountNumber}`;
      case 'tv': return `Smartcard: ${accountNumber}`;
      default: return `Account: ${accountNumber}`;
    }
  };

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
        <View style={styles.receiptContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.successIcon, { backgroundColor: getUtilityColor(paymentDetails.utilityType) }]}>
              <Text style={styles.utilityIconText}>{getUtilityIcon(paymentDetails.utilityType)}</Text>
            </View>
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>
              Your {formatUtilityType(paymentDetails.utilityType).toLowerCase()} payment has been processed successfully
            </Text>
          </View>

          {/* Payment Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{formatUtilityType(paymentDetails.utilityType)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Provider</Text>
              <Text style={styles.detailValue}>{paymentDetails.provider}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                ₦{paymentDetails.amount.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account</Text>
              <Text style={styles.detailValue}>
                {formatAccountNumber(paymentDetails.utilityType, paymentDetails.accountNumber)}
              </Text>
            </View>

            {paymentDetails.customerName && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{paymentDetails.customerName}</Text>
              </View>
            )}

            {paymentDetails.token && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Token</Text>
                <Text style={[styles.detailValue, styles.tokenText]}>{paymentDetails.token}</Text>
              </View>
            )}

            {paymentDetails.units && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Units</Text>
                <Text style={styles.detailValue}>{paymentDetails.units} kWh</Text>
              </View>
            )}
          </View>

          {/* Transaction Hash */}
          <View style={styles.transactionSection}>
            <View style={styles.transactionHeader}>
              <IconSymbol name="creditcard.fill" size={20} color={SparkColors.gold} />
              <Text style={styles.transactionTitle}>Transaction Details</Text>
            </View>
            <View style={styles.transactionHashContainer}>
              <Text style={styles.transactionHashLabel}>Transaction Hash:</Text>
              <Text style={styles.transactionHash} numberOfLines={2}>
                {paymentDetails.transactionHash}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewOnExplorerButton}
              onPress={async () => {
                const explorerUrl = `https://sepolia.voyager.online/tx/${paymentDetails.transactionHash}`;
                try {
                  await Linking.openURL(explorerUrl);
                } catch (error) {
                  console.error('Failed to open URL:', error);
                }
              }}
            >
              <IconSymbol name="chevron.right" size={16} color={SparkColors.black} />
              <Text style={styles.viewOnExplorerText}>View on Explorer</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <IconSymbol name="bolt.circle.fill" size={24} color="#4CAF50" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Payment Confirmed</Text>
                <Text style={styles.infoDescription}>
                  Your payment has been processed on the StarkNet blockchain
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <IconSymbol name="clock.circle.fill" size={24} color={SparkColors.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Processing Time</Text>
                <Text style={styles.infoDescription}>
                  {paymentDetails.utilityType === 'electricity' 
                    ? 'Tokens will be sent to your meter within 5-10 minutes'
                    : paymentDetails.utilityType === 'airtime' || paymentDetails.utilityType === 'data'
                    ? 'Credit will be applied to your phone within 2-5 minutes'
                    : 'Subscription will be activated within 10-15 minutes'
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <IconSymbol name="shield.fill" size={24} color={SparkColors.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Secure Transaction</Text>
                <Text style={styles.infoDescription}>
                  Payment processed securely using StarkNet smart contracts
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.secondaryButton, isSharing && styles.disabledButton]} 
              disabled={isSharing}
              onPress={async () => {
                if (isSharing) return;
                
                setIsSharing(true);
                try {
                  // Share formatted text receipt
                  const formatUtilityType = (type: string) => {
                    switch (type) {
                      case 'electricity': return 'Electricity';
                      case 'airtime': return 'Airtime';
                      case 'data': return 'Data';
                      case 'tv': return 'TV Subscription';
                      default: return type.charAt(0).toUpperCase() + type.slice(1);
                    }
                  };

                  let receiptText = `🧾 SPARK WALLET RECEIPT\n\n`;
                  receiptText += `💡 Service: ${formatUtilityType(paymentDetails.utilityType)}\n`;
                  receiptText += `🏢 Provider: ${paymentDetails.provider}\n`;
                  receiptText += `💰 Amount: ₦${paymentDetails.amount.toLocaleString()}\n`;
                  receiptText += `📱 Account: ${paymentDetails.accountNumber}\n`;
                  
                  if (paymentDetails.customerName) {
                    receiptText += `👤 Customer: ${paymentDetails.customerName}\n`;
                  }
                  
                  if (paymentDetails.token) {
                    receiptText += `🔑 Token: ${paymentDetails.token}\n`;
                  }
                  
                  if (paymentDetails.units) {
                    receiptText += `⚡ Units: ${paymentDetails.units}\n`;
                  }
                  
                  receiptText += `\n🔗 Transaction Hash:\n${paymentDetails.transactionHash}\n`;
                  receiptText += `\n🌐 View on Explorer:\nhttps://sepolia.voyager.online/tx/${paymentDetails.transactionHash}\n`;
                  receiptText += `\n✅ Powered by Spark Wallet on StarkNet`;

                  await Share.share({
                    message: receiptText,
                    title: 'Payment Receipt - Spark Wallet'
                  });
                } catch (shareError) {
                  console.error('Share error:', shareError);
                } finally {
                  setIsSharing(false);
                }
              }}>
              <IconSymbol name="paperplane.fill" size={16} color={SparkColors.white} />
              <Text style={styles.secondaryButtonText}>Share Receipt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  utilityIconText: {
    fontSize: 32,
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
  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    color: SparkColors.darkGray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: SparkColors.white,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  amountText: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenText: {
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  transactionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SparkColors.white,
    marginLeft: 8,
  },
  transactionHashContainer: {
    marginBottom: 16,
  },
  transactionHashLabel: {
    fontSize: 12,
    color: SparkColors.darkGray,
    marginBottom: 4,
  },
  transactionHash: {
    fontSize: 12,
    color: SparkColors.white,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
  },
  viewOnExplorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SparkColors.gold,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewOnExplorerText: {
    fontSize: 14,
    fontWeight: '600',
    color: SparkColors.black,
    marginLeft: 6,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SparkColors.white,
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: SparkColors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SparkColors.black,
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
