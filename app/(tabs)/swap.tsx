import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import AutoSwapperService, { SwapParams } from '@/services/AutoSwapperService';
import StorageService from '@/services/StorageService';
import StarkNetWalletService from '@/services/StarkNetWalletService';
import TokenSelector from '@/components/TokenSelector';
import NetworkConfigService from '@/services/NetworkConfigService';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue: string;
}

export default function SwapScreen() {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [supportedTokens, setSupportedTokens] = useState<Token[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string>('mainnet');

  useEffect(() => {
    initializeSwap();
  }, []);

  const initializeSwap = async () => {
    try {
      // Initialize network service and get current network
      await NetworkConfigService.initialize();
      const network = NetworkConfigService.getCurrentNetwork();
      setCurrentNetwork(network);

      // Load wallet data
      const wallet = await StorageService.getWalletData();
      setWalletData(wallet);

      // Get supported tokens and fetch their balances
      const rawTokens = AutoSwapperService.getSupportedTokens();
      let tokens = rawTokens.map(token => ({
        ...token,
        balance: '0',
        balanceFormatted: '0.000000',
        usdValue: '0.00'
      }));

      // Fetch actual token balances if wallet is available
      if (wallet?.address) {
        try {
          const tokenBalances = await StarkNetWalletService.getTokenBalances(wallet.address);
          tokens = tokens.map(token => {
            const balance = tokenBalances.find(b => b.symbol === token.symbol);
            return balance ? {
              ...token,
              balance: balance.balance,
              balanceFormatted: balance.balanceFormatted,
              usdValue: balance.usdValue || '0.00'
            } : token;
          });
        } catch (error) {
          console.error('Failed to fetch token balances:', error);
        }
      }

      setSupportedTokens(tokens);

      // Set default tokens
      const strkToken = tokens.find(t => t.symbol === 'STRK');
      const ethToken = tokens.find(t => t.symbol === 'ETH');
      
      if (ethToken) setFromToken(ethToken);
      if (strkToken) setToToken(strkToken);

    } catch (error) {
      console.error('Failed to initialize swap:', error);
    }
  };


  const executeSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !walletData) {
      Alert.alert('Error', 'Please complete all swap details');
      return;
    }

    setIsSwapping(true);
    try {
      const swapParams: SwapParams = {
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: fromAmount,
        version: "0x3"
      };

      const result = await AutoSwapperService.executeSwap(walletData, swapParams);
      
      if (result.success) {
        Alert.alert(
          'Swap Successful!',
          `Swapped ${fromAmount} ${fromToken.symbol}\n\nTransaction: ${result.transactionHash}`,
          [{ text: 'OK', onPress: () => {
            setFromAmount('');
            setToAmount('');
          }}]
        );
      } else {
        Alert.alert('Swap Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Swap execution failed:', error);
      Alert.alert('Error', 'Failed to execute swap. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const isSwapReady = fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && walletData;
  
  // Show testnet message if on Sepolia
  if (currentNetwork === 'sepolia') {
    return (
      <LinearGradient
        colors={[SparkColors.black, SparkColors.darkBrown]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.testnetContainer}>
          <ThemedText type="title" style={styles.title}>Swap Tokens</ThemedText>
          <View style={styles.testnetMessage}>
            <ThemedText style={styles.testnetTitle}>⚠️ Swap Not Available</ThemedText>
            <ThemedText style={styles.testnetText}>
              Token swapping is not available on testnet. Please switch to mainnet to use the swap feature.
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Swap Tokens</ThemedText>
          <ThemedText style={styles.subtitle}>Exchange your tokens instantly</ThemedText>
        </View>

        <View style={styles.swapCard}>
          <ThemedText style={styles.cardTitle}>From</ThemedText>
          
          {/* Token Selector - Full Width */}
          <View style={styles.fullWidthTokenSelector}>
            <TokenSelector
              selectedToken={fromToken}
              tokens={supportedTokens.filter(token => token.address !== toToken?.address)}
              onTokenSelect={(token: Token) => {
                setFromToken(token);
                setFromAmount('');
                setToAmount('');
              }}
              placeholder="Select token"
            />
          </View>
          
          {/* Balance Display */}
          <ThemedText style={styles.balanceText}>
            Balance: {fromToken?.balanceFormatted || '0.000000'} {fromToken?.symbol}
          </ThemedText>
          
          {/* Amount Input with Max Button */}
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={fromAmount}
              onChangeText={(text) => {
                setFromAmount(text);
              }}
              placeholder="0.0"
              placeholderTextColor={SparkColors.darkGray}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.maxButton}
              onPress={() => {
                if (fromToken?.balanceFormatted) {
                  setFromAmount(fromToken.balanceFormatted);
                }
              }}
            >
              <ThemedText style={styles.maxButtonText}>Max</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.swapArrow} onPress={swapTokens}>
          <ThemedText style={styles.arrowText}>⇅</ThemedText>
        </TouchableOpacity>

        <View style={styles.swapCard}>
          <ThemedText style={styles.cardTitle}>To</ThemedText>
          
          {/* Token Selector - Full Width */}
          <View style={styles.fullWidthTokenSelector}>
            <TokenSelector
              selectedToken={toToken}
              tokens={supportedTokens.filter(token => token.address !== fromToken?.address)}
              onTokenSelect={(token: Token) => {
                setToToken(token);
              }}
              placeholder="Select token"
            />
          </View>
          
          {/* Balance Display */}
          <ThemedText style={styles.balanceText}>
            Balance: {toToken?.balanceFormatted || '0.000000'} {toToken?.symbol}
          </ThemedText>
          
          {/* Amount Display */}
          <View style={styles.toAmountContainer}>
            <ThemedText style={styles.amount}>{toAmount || '0.0'}</ThemedText>
          </View>
        </View>


        <TouchableOpacity 
          style={[
            styles.swapButton, 
            { opacity: isSwapReady ? 1 : 0.5 },
            isSwapping && styles.swapButtonLoading
          ]}
          onPress={executeSwap}
          disabled={!isSwapReady || isSwapping}
        >
          {isSwapping ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={SparkColors.black} />
              <ThemedText style={[styles.swapButtonText, { marginLeft: 8 }]}>Swapping...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.swapButtonText}>
              {!walletData ? 'Connect Wallet' : !isSwapReady ? 'Enter Amount' : 'Swap Tokens'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    color: SparkColors.white,
    marginBottom: 8,
  },
  subtitle: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  swapCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  cardTitle: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 12,
  },
  tokenSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balance: {
    color: SparkColors.darkGray,
    fontSize: 12,
  },
  fullWidthTokenSelector: {
    marginBottom: 4,
  },
  balanceText: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SparkColors.brown,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  maxButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginLeft: 12,
  },
  maxButtonText: {
    color: SparkColors.black,
    fontSize: 14,
    fontWeight: '600',
  },
  swapArrow: {
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 12,
  },
  arrowText: {
    color: SparkColors.gold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  swapButton: {
    backgroundColor: SparkColors.darkGold,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  swapButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  toAmountContainer: {
    alignItems: 'flex-end',
    minHeight: 22,
    justifyContent: 'center',
  },
  quoteCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  quoteTitle: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    color: SparkColors.lightGray,
    fontSize: 14,
  },
  quoteValue: {
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  swapButtonLoading: {
    backgroundColor: SparkColors.brown,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenSelectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tokenSelectorContainer: {
    flex: 1,
  },
  testnetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  testnetMessage: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    alignItems: 'center',
  },
  testnetTitle: {
    color: SparkColors.gold,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  testnetText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
