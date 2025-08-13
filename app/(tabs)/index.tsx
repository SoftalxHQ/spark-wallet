import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SparkColors } from '@/constants/Colors';
import StarkNetWalletService, { TokenBalance } from '../../services/StarkNetWalletService';
import StorageService from '../../services/StorageService';

export default function HomeScreen() {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalUsdBalance, setTotalUsdBalance] = useState('$0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletDeployed, setIsWalletDeployed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendSelectedToken, setSendSelectedToken] = useState<any>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [gasEstimated, setGasEstimated] = useState(false);
  const [estimatedGasFee, setEstimatedGasFee] = useState('0.0023');
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [accounts, setAccounts] = useState([{
    id: '1',
    name: 'Carrot',
    address: '0x0057...316C',
    balance: '$0.00',
    isActive: true
  }]);
  const [selectedNetwork, setSelectedNetwork] = useState('Sepolia');
  
  // Token data
  const tokens = [
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'Ξ',
      amount: '0.5',
      value: '$1,000.00',
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
    },
    {
      id: 'strk',
      name: 'Starknet Token',
      symbol: 'STRK',
      icon: '⚡',
      amount: '100',
      value: '$200.00',
      address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
    },
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: '💵',
      amount: '500',
      value: '$500.00',
      address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8'
    }
  ];
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  };

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      
      // Load wallet data
      const walletData = await StorageService.getWalletData();
      if (walletData) {
        
        // Check if wallet is deployed
        const deployed = await StarkNetWalletService.isWalletDeployed(walletData.address);
        setIsWalletDeployed(deployed);
        
        // Fetch token balances
        const balances = await StarkNetWalletService.getTokenBalances(walletData.address);
        setTokenBalances(balances);
        
        // Calculate total USD balance
        const totalUsd = balances.reduce((sum, token) => {
          return sum + parseFloat(token.usdValue || '0');
        }, 0);
        setTotalUsdBalance(`$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleTokenPress = (token: any) => {
    setSelectedToken(token);
    setShowTokenModal(true);
    setIsCopied(false); // Reset copied state when opening modal
  };

  const handleSendPress = () => {
    // Default to first token (ETH) for send modal
    setSendSelectedToken(tokens[0]);
    setShowSendModal(true);
    setRecipientAddress('');
    setSendAmount('');
    setGasEstimated(false);
    setIsEstimatingGas(false);
    setAddressError('');
    setAmountError('');
  };

  const handleSendTokenChange = (token: any) => {
    setSendSelectedToken(token);
  };

  const handleMaxPress = () => {
    if (sendSelectedToken) {
      setSendAmount(sendSelectedToken.balance.toString());
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Clear previous errors
    setAddressError('');
    setAmountError('');
    
    // Validate recipient address
    if (!recipientAddress.trim()) {
      setAddressError('Recipient address is required');
      isValid = false;
    } else if (recipientAddress.length < 10) {
      setAddressError('Please enter a valid address');
      isValid = false;
    }
    
    // Validate amount
    if (!sendAmount.trim()) {
      setAmountError('Amount is required');
      isValid = false;
    } else if (isNaN(Number(sendAmount)) || Number(sendAmount) <= 0) {
      setAmountError('Please enter a valid amount');
      isValid = false;
    } else if (sendSelectedToken && Number(sendAmount) > sendSelectedToken.balance) {
      setAmountError('Insufficient balance');
      isValid = false;
    }
    
    return isValid;
  };

  const handleContinuePress = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsEstimatingGas(true);
    // Simulate gas estimation
    setTimeout(() => {
      setEstimatedGasFee('0.0023');
      setGasEstimated(true);
      setIsEstimatingGas(false);
    }, 2000);
  };

  const handleSendTransaction = async () => {
    setIsSendingTransaction(true);
    
    // TODO: Implement actual send transaction logic
    console.log('Sending transaction:', {
      token: sendSelectedToken?.symbol,
      recipient: recipientAddress,
      amount: sendAmount,
      gasFee: estimatedGasFee
    });
    
    // Simulate transaction processing delay
    setTimeout(() => {
      // Simulate successful transaction with mock hash
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      setTransactionHash(mockTxHash);
      
      // Close send modal and show success modal
      setShowSendModal(false);
      setShowSuccessModal(true);
      setIsSendingTransaction(false);
      
      // Reset form state
      setRecipientAddress('');
      setSendAmount('');
      setGasEstimated(false);
      setEstimatedGasFee('0.0023');
      setAddressError('');
      setAmountError('');
    }, 2500); // 2.5 second delay
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Use Expo Clipboard API for React Native
      await Clipboard.setStringAsync(text);
      console.log('Copied to clipboard:', text);
      
      // Show copied feedback
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Still show feedback even if copy failed
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setTransactionHash('');
  };

  const handleViewTransaction = () => {
    // TODO: Open blockchain explorer with transaction hash
    console.log('Viewing transaction:', transactionHash);
    // For now, just copy the hash to clipboard
    copyToClipboard(transactionHash);
  };

  const formatTokenBalance = (balance: TokenBalance) => {
    return `${balance.balanceFormatted} ${balance.symbol}`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const handleDeployWallet = async () => {
    try {
      const walletData = await StorageService.getWalletData();
      if (walletData) {
        const result = await StarkNetWalletService.deployWallet(walletData);
        if (result.success) {
          setIsWalletDeployed(true);
          // Update wallet data with deployment info
          const updatedWalletData = {
            ...walletData,
            isDeployed: true,
            deploymentTxHash: result.transactionHash
          };
          await StorageService.saveWalletData(updatedWalletData);
        }
      }
    } catch (error) {
      console.error('Error deploying wallet:', error);
    }
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Fixed Header */}
      <View style={[styles.header, isScrolled && styles.headerScrolled]}>
        <TouchableOpacity style={styles.headerCapsule} onPress={() => setShowAccountModal(true)}>
          <View style={styles.capsuleIcon}>
            <ThemedText style={styles.capsuleIconText}>🥕</ThemedText>
          </View>
          <ThemedText style={styles.capsuleText}>
            <ThemedText style={styles.accountNameText}>
              {accounts.find(acc => acc.isActive)?.name || 'Royal Crab'}
            </ThemedText>
            <ThemedText style={styles.networkSeparator}> | </ThemedText>
            <ThemedText style={styles.networkText}>
              {selectedNetwork}
            </ThemedText>
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <IconSymbol size={20} name="person.circle.fill" color={SparkColors.lightGray} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[SparkColors.gold]}
          />
        }
      >
        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="large" color={SparkColors.gold} style={{ marginVertical: 10 }} />
          ) : (
            <ThemedText type="title" style={styles.balanceAmount}>{totalUsdBalance}</ThemedText>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
            <View style={styles.actionIcon}>
              <IconSymbol size={24} name="paperplane.fill" color={SparkColors.black} />
            </View>
            <ThemedText style={styles.actionText}>Send</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/swap')}>
            <View style={styles.actionIcon}>
              <IconSymbol size={24} name="arrow.left.arrow.right.circle.fill" color={SparkColors.black} />
            </View>
            <ThemedText style={styles.actionText}>Swap</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/utility')}>
            <View style={styles.actionIcon}>
              <IconSymbol size={24} name="bolt.circle.fill" color={SparkColors.black} />
            </View>
            <ThemedText style={styles.actionText}>Utility</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tokens */}
        <View style={styles.tokensSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Tokens</ThemedText>
          
          {tokens.map((token) => (
            <TouchableOpacity 
              key={token.id} 
              style={styles.tokenCard}
              onPress={() => handleTokenPress(token)}
            >
              <View style={styles.tokenInfo}>
                <View style={styles.tokenIcon}>
                  <ThemedText style={styles.tokenIconText}>{token.icon}</ThemedText>
                </View>
                <View style={styles.tokenDetails}>
                  <ThemedText style={styles.tokenName}>{token.name}</ThemedText>
                  <ThemedText style={styles.tokenSymbol}>{token.symbol}</ThemedText>
                </View>
              </View>
              <View style={styles.tokenBalance}>
                <ThemedText style={styles.tokenAmount}>{token.amount}</ThemedText>
                <ThemedText style={styles.tokenValue}>{token.value}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Transactions</ThemedText>
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Your transaction history will appear here</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Accounts</ThemedText>
            <TouchableOpacity 
              style={styles.closeButtonContainer}
              onPress={() => setShowAccountModal(false)}
            >
              <ThemedText style={styles.closeButton}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContentContainer}>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {accounts.map((account) => (
                <TouchableOpacity 
                  key={account.id} 
                  style={[styles.accountItem, account.isActive && styles.activeAccount]}
                  onPress={() => {
                    setAccounts(prev => prev.map(acc => ({
                      ...acc,
                      isActive: acc.id === account.id
                    })));
                    setShowAccountModal(false);
                  }}
                >
                  <View style={styles.modalAccountInfo}>
                    <View style={styles.modalAccountAvatar}>
                      <ThemedText style={styles.modalAccountAvatarText}>🥕</ThemedText>
                    </View>
                    <View style={styles.modalAccountDetails}>
                      <ThemedText style={styles.accountItemName}>{account.name}</ThemedText>
                      <ThemedText style={styles.accountAddress}>{account.address}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.accountBalance}>
                    <ThemedText style={styles.accountBalanceText}>{account.balance}</ThemedText>
                    {account.isActive && <View style={styles.activeIndicator} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.addAccountButton}>
              <View style={styles.addAccountIcon}>
                <ThemedText style={styles.addAccountIconText}>+</ThemedText>
              </View>
              <ThemedText style={styles.addAccountText}>Add Account</ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Token Modal */}
      <Modal
        visible={showTokenModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowTokenModal(false);
          setIsCopied(false);
        }}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>Token Details</ThemedText>
              <TouchableOpacity 
                style={styles.closeButtonContainer}
                onPress={() => {
                  setShowTokenModal(false);
                  setIsCopied(false);
                }}
              >
                <ThemedText style={styles.closeButton}>×</ThemedText>
              </TouchableOpacity>
            </View>
            
            {selectedToken && (
              <View style={styles.tokenModalContent}>
                <View style={styles.tokenModalHeader}>
                  <View style={styles.tokenModalIcon}>
                    <ThemedText style={styles.tokenModalIconText}>{selectedToken.icon}</ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.tokenModalName}>{selectedToken.name}</ThemedText>
                  <ThemedText style={styles.tokenModalSymbol}>{selectedToken.symbol}</ThemedText>
                </View>
                
                <View style={styles.tokenModalBalance}>
                  <ThemedText style={styles.tokenModalAmount}>{selectedToken.amount}</ThemedText>
                  <ThemedText style={styles.tokenModalValue}>{selectedToken.value}</ThemedText>
                </View>
                
                <View style={styles.tokenModalAddress}>
                  <ThemedText style={styles.tokenModalAddressLabel}>Contract Address</ThemedText>
                  <View style={styles.addressContainer}>
                    <ThemedText style={styles.tokenModalAddressText}>
                      {selectedToken.address.slice(0, 10)}...{selectedToken.address.slice(-8)}
                    </ThemedText>
                    <TouchableOpacity 
                      style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
                      onPress={() => copyToClipboard(selectedToken.address)}
                    >
                      <ThemedText style={styles.copyButtonText}>
                        {isCopied ? 'Copied' : 'Copy'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Modal>

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSendModal(false);
          setRecipientAddress('');
          setSendAmount('');
        }}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowSendModal(false);
                  setRecipientAddress('');
                  setSendAmount('');
                }}
              >
                <IconSymbol size={24} name="chevron.left" color={SparkColors.lightGray} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.modalTitle}>Transfer</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {sendSelectedToken && (
              <View style={styles.sendContent}>
                {/* Token Selector */}
                <TouchableOpacity style={styles.tokenSelector}>
                  <View style={styles.tokenSelectorContent}>
                    <View style={styles.tokenSelectorIcon}>
                      <ThemedText style={styles.tokenIcon}>{sendSelectedToken.icon}</ThemedText>
                    </View>
                    <ThemedText style={styles.tokenSelectorText}>{sendSelectedToken.symbol}</ThemedText>
                    <IconSymbol size={16} name="chevron.right" color={SparkColors.lightGray} style={styles.chevronDown} />
                  </View>
                </TouchableOpacity>

                {/* Recipient Address Input */}
                <View style={[styles.inputContainer, addressError && styles.inputError]}>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="To Address / SNS *"
                    placeholderTextColor={SparkColors.lightGray}
                    value={recipientAddress}
                    onChangeText={(text) => {
                      setRecipientAddress(text);
                      if (addressError) setAddressError('');
                    }}
                  />
                  <TouchableOpacity style={styles.pasteButton}>
                    <IconSymbol size={20} name="clock.circle.fill" color={SparkColors.lightGray} />
                  </TouchableOpacity>
                </View>
                {addressError ? (
                  <ThemedText style={styles.errorText}>{addressError}</ThemedText>
                ) : null}

                {/* Balance Display */}
                <ThemedText style={styles.balanceText}>
                  {sendSelectedToken.symbol} Balance: {sendSelectedToken.balance} (${sendSelectedToken.usdValue})
                </ThemedText>

                {/* Amount Input */}
                <View style={[styles.amountContainer, amountError && styles.inputError]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter Amount *"
                    placeholderTextColor={SparkColors.lightGray}
                    value={sendAmount}
                    onChangeText={(text) => {
                      setSendAmount(text);
                      if (amountError) setAmountError('');
                    }}
                    keyboardType="numeric"
                  />
                  <View style={styles.amountRight}>
                    <ThemedText style={styles.amountCurrency}>{sendSelectedToken.symbol}</ThemedText>
                    <TouchableOpacity style={styles.maxButton} onPress={handleMaxPress}>
                      <ThemedText style={styles.maxButtonText}>Max</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                {amountError ? (
                  <ThemedText style={styles.errorText}>{amountError}</ThemedText>
                ) : null}

                {/* USD Value */}
                <ThemedText style={styles.usdAmount}>$0.00</ThemedText>

                {/* Gas Fee */}
                <View style={styles.gasFeeContainer}>
                  <ThemedText style={styles.gasFeeLabel}>Pay Gas Fee with</ThemedText>
                  <View style={styles.gasFeeToken}>
                    <View style={styles.gasFeeIcon}>
                      <ThemedText style={styles.tokenIcon}>{sendSelectedToken.icon}</ThemedText>
                    </View>
                    <ThemedText style={styles.gasFeeText}>{sendSelectedToken.symbol}</ThemedText>
                  </View>
                </View>

                {/* Gas Fee Estimate */}
                {gasEstimated && (
                  <View style={styles.gasEstimateContainer}>
                    <ThemedText style={styles.gasEstimateLabel}>Estimated Gas Fee</ThemedText>
                    <ThemedText style={styles.gasEstimateAmount}>{estimatedGasFee} {sendSelectedToken.symbol}</ThemedText>
                  </View>
                )}

                {/* Continue/Send Button */}
                <TouchableOpacity 
                  style={[styles.continueButton, gasEstimated && styles.sendButton]} 
                  onPress={gasEstimated ? handleSendTransaction : handleContinuePress}
                  disabled={isEstimatingGas || isSendingTransaction}
                >
                  {isEstimatingGas ? (
                    <ThemedText style={styles.continueButtonText}>Estimating...</ThemedText>
                  ) : isSendingTransaction ? (
                    <ThemedText style={styles.continueButtonText}>Sending...</ThemedText>
                  ) : gasEstimated ? (
                    <View style={styles.sendButtonContent}>
                      <IconSymbol name="paperplane.fill" size={18} color={SparkColors.white} />
                      <ThemedText style={styles.continueButtonText}>Send</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSuccessModalClose}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
        >
          <View style={styles.successModalContent}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconCircle}>
                <ThemedText style={styles.successCheckmark}>✓</ThemedText>
              </View>
            </View>

            {/* Success Title */}
            <ThemedText style={styles.successTitle}>Transaction Successful!</ThemedText>
            
            {/* Transaction Hash */}
            <View style={styles.transactionHashContainer}>
              <ThemedText style={styles.transactionHashLabel}>Transaction Hash:</ThemedText>
              <ThemedText style={styles.transactionHash}>
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </ThemedText>
            </View>

            {/* View Transaction Link */}
            <TouchableOpacity 
              style={styles.viewTransactionButton}
              onPress={handleViewTransaction}
            >
              <ThemedText style={styles.viewTransactionText}>View Transaction →</ThemedText>
            </TouchableOpacity>

            {/* Return Home Button */}
            <TouchableOpacity 
              style={styles.returnHomeButton}
              onPress={handleSuccessModalClose}
            >
              <ThemedText style={styles.returnHomeButtonText}>Return Home</ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: SparkColors.black,
  },
  headerScrolled: {
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  headerCapsule: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  capsuleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  capsuleIconText: {
    fontSize: 12,
    color: SparkColors.black,
  },
  capsuleText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountNameText: {
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  networkSeparator: {
    color: SparkColors.lightGray,
    fontSize: 14,
    fontWeight: '300',
  },
  networkText: {
    color: SparkColors.lightGray,
    fontSize: 14,
    fontWeight: '300',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountButton: {
    padding: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.darkBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    color: SparkColors.lightGray,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 24,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  networkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SparkColors.green,
    marginRight: 4,
  },
  balanceCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  balanceLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: SparkColors.gold,
    fontSize: 36,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 80,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SparkColors.darkGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 20,
    color: SparkColors.black,
  },
  actionText: {
    color: SparkColors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  deployButton: {
    // Inherits from actionButton
  },
  deployIcon: {
    backgroundColor: SparkColors.green,
  },
  tokensSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: SparkColors.white,
    marginBottom: 16,
    fontSize: 20,
  },
  tokenCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 18,
    color: SparkColors.black,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenSymbol: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenValue: {
    color: SparkColors.gold,
    fontSize: 14,
  },
  transactionsSection: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    padding: 32,
  },
  emptyText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: SparkColors.darkGray,
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  modalTitle: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SparkColors.darkBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    color: SparkColors.lightGray,
    fontSize: 18,
    fontWeight: '300',
  },
  modalContentContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: SparkColors.darkBrown,
  },
  activeAccount: {
    backgroundColor: SparkColors.brown,
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  modalAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAccountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalAccountAvatarText: {
    fontSize: 20,
  },
  modalAccountDetails: {
    flex: 1,
  },
  accountItemName: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountAddress: {
    color: SparkColors.lightGray,
    fontSize: 12,
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SparkColors.green,
    marginTop: 4,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    backgroundColor: SparkColors.darkBrown,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    borderStyle: 'dashed',
  },
  addAccountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.brown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addAccountIconText: {
    color: SparkColors.gold,
    fontSize: 24,
    fontWeight: '300',
  },
  addAccountText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    fontWeight: '500',
  },
  // Token Modal Styles
  tokenModalContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  tokenModalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tokenModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SparkColors.darkBrown,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: SparkColors.brown,
  },
  tokenModalIconText: {
    fontSize: 40,
  },
  tokenModalName: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenModalSymbol: {
    color: SparkColors.lightGray,
    fontSize: 16,
    fontWeight: '400',
  },
  tokenModalBalance: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tokenModalAmount: {
    color: SparkColors.white,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  tokenModalValue: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: '500',
  },
  tokenModalAddress: {
    width: '100%',
    paddingHorizontal: 20,
  },
  tokenModalAddressLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  tokenModalAddressText: {
    color: SparkColors.white,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    backgroundColor: SparkColors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  copyButtonCopied: {
    backgroundColor: SparkColors.green,
  },
  copyButtonText: {
    color: SparkColors.black,
    fontSize: 12,
    fontWeight: '600',
  },
  // Send Modal Styles
  sendContent: {
    flex: 1,
    paddingTop: 20,
  },
  tokenSelector: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  tokenSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSelectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SparkColors.brown,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenSelectorText: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
  },
  inputContainer: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addressInput: {
    flex: 1,
    color: SparkColors.white,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  pasteButton: {
    padding: 8,
  },
  balanceText: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 20,
  },
  amountContainer: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  amountRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCurrency: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginRight: 12,
  },
  maxButton: {
    backgroundColor: SparkColors.brown,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  usdAmount: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginBottom: 40,
  },
  gasFeeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: SparkColors.brown,
  },
  gasFeeLabel: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  gasFeeToken: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gasFeeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SparkColors.brown,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  gasFeeText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  gasEstimateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  gasEstimateLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
  },
  gasEstimateAmount: {
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  sendButton: {
    backgroundColor: SparkColors.green,
  },
  continueButtonText: {
    color: SparkColors.black,
    fontSize: 18,
    fontWeight: '600',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  // Success Modal Styles
  successModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SparkColors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCheckmark: {
    color: SparkColors.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    color: SparkColors.white,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  transactionHashContainer: {
    backgroundColor: SparkColors.brown,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  transactionHashLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 8,
  },
  transactionHash: {
    color: SparkColors.white,
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  viewTransactionButton: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  viewTransactionText: {
    color: SparkColors.gold,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  returnHomeButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  returnHomeButtonText: {
    color: SparkColors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
