// Import crypto polyfill FIRST - must be before any starknet imports
import '../../polyfills';

import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SparkColors } from '@/constants/Colors';
import WalletQRCode from '../../components/WalletQRCode';
import StarkNetWalletService, { TokenBalance } from '../../services/StarkNetWalletService';
import StorageService from '../../services/StorageService';

export default function HomeScreen() {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalUsdBalance, setTotalUsdBalance] = useState('0.00 USD');
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
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
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [accounts, setAccounts] = useState([{
    id: '1',
    name: 'Carrot',
    address: '0x0057...316C',
    balance: '$0.00',
    isActive: true
  }]);
  const [selectedNetwork] = useState('Sepolia');
  
  // Token icons mapping - using actual images
  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'STRK': return require('@/assets/images/strk.png');
      case 'ETH': return require('@/assets/images/eth.png');
      case 'USDC': return require('@/assets/images/usdc.png');
      case 'USDT': return require('@/assets/images/usdt.png');
      default: return require('@/assets/images/strk.png');
    }
  };

  // Default tokens to always display
  const defaultTokens = [
    {
      symbol: 'STRK',
      name: 'StarkNet Token',
      address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      decimals: 18,
      balance: '0',
      balanceFormatted: '0.000000',
      usdValue: '0.00'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      decimals: 18,
      balance: '0',
      balanceFormatted: '0.000000',
      usdValue: '0.00'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080',
      decimals: 6,
      balance: '0',
      balanceFormatted: '0.000000',
      usdValue: '0.00'
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x02ab8758891e84b968ff11361789070c6b1af2df618d6d2f4a78b0757573c6eb',
      decimals: 6,
      balance: '0',
      balanceFormatted: '0.000000',
      usdValue: '0.00'
    }
  ];

  // Get tokens to display (real balances or defaults)
  const tokensToDisplay = tokenBalances.length > 0 ? tokenBalances : defaultTokens;
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
      
      // Debug storage state
      const storageInfo = await StorageService.getStorageInfo();
      console.log('Storage info:', storageInfo);
      
      // Load wallet data
      const walletData = await StorageService.getWalletData();
      console.log('Raw wallet data from storage:', walletData);
      setWalletData(walletData);
      
      if (walletData) {
        console.log('=== WALLET DEBUG INFO ===');
        console.log('Loading balances for wallet address:', walletData.address);
        console.log('Full wallet data:', walletData);
        
        // Skip deployment check during balance loading - only check when sending tokens
        
        // Fetch token balances
        const balances = await StarkNetWalletService.getTokenBalances(walletData.address);
        console.log('Fetched balances:', balances);
        
        // Set the token balances from the app's wallet
        setTokenBalances(balances);
        
        // Calculate total USD balance from all tokens
        const totalUsdBalance = balances.reduce((sum, token) => {
          return sum + parseFloat(token.usdValue || '0');
        }, 0);
        setTotalUsdBalance(`$${totalUsdBalance.toFixed(2)}`);
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
    const firstToken = tokensToDisplay.length > 0 ? tokensToDisplay[0] : null;
    setSendSelectedToken(firstToken);
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
      setSendAmount(sendSelectedToken.balanceFormatted);
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
    } else if (sendSelectedToken && Number(sendAmount) > parseFloat(sendSelectedToken.balanceFormatted)) {
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
    
    try {
      // Get real gas estimation from StarkNet
      const gasEstimate = await StarkNetWalletService.estimateTransferGas(
        walletData.address,
        sendSelectedToken.address,
        recipientAddress,
        sendAmount,
        sendSelectedToken.decimals
      );
      
      console.log('Gas estimate result:', gasEstimate);
      setEstimatedGasFee(gasEstimate);
      setIsEstimatingGas(false);
      setGasEstimated(true);
    } catch (error) {
      console.error('Error estimating gas:', error);
      setIsEstimatingGas(false);
      alert('Failed to estimate gas fee. Please try again.');
    }
  };

  const handleConfirmSend = async () => {
    if (!walletData || !sendSelectedToken) {
      alert('Wallet data or token not available');
      return;
    }

    setIsSendingTransaction(true);
    
    try {
      console.log('=== SENDING TOKEN FROM UI ===');
      console.log('Wallet:', walletData.address);
      console.log('Token:', sendSelectedToken.address);
      console.log('Recipient:', recipientAddress);
      console.log('Amount:', sendAmount);
      console.log('Decimals:', sendSelectedToken.decimals);
      
      const result = await StarkNetWalletService.sendToken(
        walletData,
        recipientAddress,
        sendSelectedToken.address,
        sendAmount,
        sendSelectedToken.decimals
      );
      
      if (result.success) {
        console.log('Transaction successful:', result.transactionHash);
        setIsSendingTransaction(false);
        setShowSendModal(false);
        setTransactionHash(result.transactionHash || '');
        setShowSuccessModal(true);
        
        // Reset form
        setRecipientAddress('');
        setSendAmount('');
        setGasEstimated(false);
        
        // Refresh balances
        await loadWalletData();
      } else {
        console.error('Transaction failed:', result.error);
        setIsSendingTransaction(false);
        alert(`Transaction failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      setIsSendingTransaction(false);
      alert('Failed to send transaction. Please try again.');
    }
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

  const handleViewTransaction = async () => {
    if (transactionHash) {
      const voyagerUrl = `https://sepolia.voyager.online/tx/${transactionHash}`;
      console.log('Opening Voyager:', voyagerUrl);
      try {
        await Linking.openURL(voyagerUrl);
      } catch (error) {
        console.error('Failed to open URL:', error);
        // Fallback: copy URL to clipboard
        copyToClipboard(voyagerUrl);
      }
    }
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
          
          {tokensToDisplay.map((token) => (
            <TouchableOpacity 
              key={token.symbol} 
              style={styles.tokenCard}
              onPress={() => handleTokenPress(token)}
            >
              <View style={styles.tokenInfo}>
                <View style={styles.tokenIcon}>
                  <Image 
                    source={getTokenIcon(token.symbol)} 
                    style={styles.tokenIconImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.tokenDetails}>
                  <ThemedText style={styles.tokenName}>{token.name}</ThemedText>
                  <ThemedText style={styles.tokenSymbol}>{token.symbol}</ThemedText>
                </View>
              </View>
              <View style={styles.tokenBalance}>
                <ThemedText style={styles.tokenAmount}>{token.balanceFormatted}</ThemedText>
                <ThemedText style={styles.tokenValue}>${token.usdValue}</ThemedText>
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
                {/* QR Code Section - At Top */}
                <View style={styles.qrSection}>
                  <ThemedText style={styles.qrLabel}>Receive {selectedToken.symbol}</ThemedText>
                  <WalletQRCode 
                    walletAddress={walletData?.address || ''}
                    size={180}
                    showAddress={false}
                    showCopyButton={false}
                    logoSource={getTokenIcon(selectedToken.symbol)}
                  />
                </View>
                
                {/* Token Name and Symbol - One Line */}
                <View style={styles.tokenModalHeader}>
                  <ThemedText type="title" style={styles.tokenModalName}>
                    {selectedToken.name} ({selectedToken.symbol})
                  </ThemedText>
                </View>
                
                {/* Wallet Address with Copy Icon */}
                <View style={styles.tokenAddressSection}>
                  <ThemedText style={styles.tokenAddressText}>
                    {walletData?.address ? 
                        `${walletData.address.slice(0, 10)}...${walletData.address.slice(-8)}` : 
                        'Loading...'
                      }
                  </ThemedText>
                  <TouchableOpacity 
                    onPress={() => walletData?.address && copyToClipboard(walletData.address)}
                  >
                    <IconSymbol size={20} name="creditcard.fill" color={SparkColors.lightGray} />
                  </TouchableOpacity>
                </View>
                
                {/* Token Value */}
                <View style={styles.tokenModalBalance}>
                  <ThemedText style={styles.tokenModalAmount}>
                    {selectedToken.balanceFormatted} {selectedToken.symbol}
                  </ThemedText>
                </View>
                
                {/* Token Price */}
                <View style={styles.tokenModalPrice}>
                  <ThemedText style={styles.tokenModalValue}>${selectedToken.usdValue}</ThemedText>
                </View>
                
                {/* Send Button - At Bottom */}
                <TouchableOpacity 
                  style={styles.sendTokenButton}
                  onPress={() => {
                    setShowTokenModal(false);
                    setSendSelectedToken(selectedToken);
                    setShowSendModal(true);
                  }}
                >
                  <ThemedText style={styles.sendTokenButtonText}>Send {selectedToken.symbol}</ThemedText>
                </TouchableOpacity>
                
               
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
                <View style={styles.tokenSelectorContainer}>
                  <TouchableOpacity 
                    style={styles.tokenSelector}
                    onPress={() => setShowTokenDropdown(!showTokenDropdown)}
                  >
                    <View style={styles.tokenSelectorContent}>
                      <View style={styles.tokenSelectorIcon}>
                        <Image 
                          source={getTokenIcon(sendSelectedToken.symbol)} 
                          style={styles.tokenSelectorIconImage}
                          resizeMode="contain"
                        />
                      </View>
                      <ThemedText style={styles.tokenSelectorText}>{sendSelectedToken.symbol}</ThemedText>
                      <IconSymbol size={16} name="chevron.right" color={SparkColors.lightGray} style={styles.chevronDown} />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Token Dropdown */}
                  {showTokenDropdown && (
                    <View style={styles.tokenDropdown}>
                      {tokensToDisplay.map((token, index) => (
                        <TouchableOpacity 
                          key={index}
                          style={[
                            styles.tokenDropdownItem,
                            sendSelectedToken.symbol === token.symbol && styles.selectedTokenItem
                          ]}
                          onPress={() => {
                            setSendSelectedToken(token);
                            setShowTokenDropdown(false);
                            setSendAmount(''); // Clear amount when token changes
                          }}
                        >
                          <View style={styles.tokenDropdownContent}>
                            <View style={styles.tokenDropdownIcon}>
                              <Image 
                                source={getTokenIcon(token.symbol)} 
                                style={styles.tokenDropdownIconImage}
                                resizeMode="contain"
                              />
                            </View>
                            <View style={styles.tokenDropdownInfo}>
                              <ThemedText style={styles.tokenDropdownSymbol}>{token.symbol}</ThemedText>
                              <ThemedText style={styles.tokenDropdownBalance}>{parseFloat(token.balanceFormatted).toFixed(4)}</ThemedText>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

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
                  {sendSelectedToken.symbol} Balance: {parseFloat(sendSelectedToken.balanceFormatted).toFixed(4)} (${sendSelectedToken.usdValue})
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
                      <Image 
                        source={getTokenIcon('STRK')} 
                        style={styles.gasFeeTokenImage}
                        resizeMode="contain"
                      />
                    </View>
                    <ThemedText style={styles.gasFeeText}>STRK</ThemedText>
                  </View>
                </View>

                {/* Gas Fee Estimate */}
                {gasEstimated && (
                  <View style={styles.gasEstimateContainer}>
                    <ThemedText style={styles.gasEstimateLabel}>Estimated Gas Fee</ThemedText>
                    <ThemedText style={styles.gasEstimateAmount}>{estimatedGasFee} STRK</ThemedText>
                  </View>
                )}

                {/* Continue/Send Button */}
                <TouchableOpacity 
                  style={[styles.continueButton, gasEstimated && styles.sendButton]} 
                  onPress={gasEstimated ? handleConfirmSend : handleContinuePress}
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
  tokenSelectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SparkColors.brown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenSelectorIconImage: {
    width: 20,
    height: 20,
  },
  gasFeeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SparkColors.brown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gasFeeTokenImage: {
    width: 18,
    height: 18,
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
  tokenIconImage: {
    width: 32,
    height: 32,
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
    marginBottom: 10,
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
  tokenModalIconImage: {
    width: 64,
    height: 64,
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
    marginBottom: 10,
    marginTop: 10,
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
  gasFeeText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '400',
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
  // Token Dropdown Styles
  tokenSelectorContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  tokenDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    zIndex: 1000,
    maxHeight: 150,
  },
  tokenDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  selectedTokenItem: {
    backgroundColor: SparkColors.brown,
  },
  tokenDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenDropdownIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SparkColors.brown,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenDropdownIconImage: {
    width: 20,
    height: 20,
  },
  tokenDropdownInfo: {
    flex: 1,
  },
  tokenDropdownSymbol: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tokenDropdownBalance: {
    color: SparkColors.lightGray,
    fontSize: 14,
  },
  // Send Token Button Styles
  sendTokenButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  sendTokenButtonText: {
    color: SparkColors.black,
    fontSize: 18,
    fontWeight: '600',
  },
  // QR Code Styles
  qrSection: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  qrLabel: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: SparkColors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrPlaceholder: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  qrTokenLogo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SparkColors.lightGray,
  },
  qrTokenLogoImage: {
    width: 32,
    height: 32,
  },
  // Token Modal Price Section
  tokenModalPrice: {
    alignItems: 'center',
    marginVertical: 0,
  },
  // Token Address Section
  tokenAddressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  tokenAddressText: {
    color: SparkColors.lightGray,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
});
