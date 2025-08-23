import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import AutoSwapperService, { SwapQuote, SwapParams } from '@/services/AutoSwapperService';
import StorageService from '@/services/StorageService';
import StarkNetWalletService from '@/services/StarkNetWalletService';
import TokenSelector from '@/components/TokenSelector';

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
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [supportedTokens, setSupportedTokens] = useState<Token[]>([]);

  useEffect(() => {
    initializeSwap();
  }, []);

  const initializeSwap = async () => {
    try {
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
      const ethToken = tokens.find(t => t.symbol === 'ETH');
      const strkToken = tokens.find(t => t.symbol === 'STRK');
      
      if (ethToken) setFromToken(ethToken);
      if (strkToken) setToToken(strkToken);

    } catch (error) {
      console.error('Failed to initialize swap:', error);
    }
  };

  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('');
      setQuote(null);
      return;
    }

    setIsLoading(true);
    try {
      const swapParams: SwapParams = {
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: fromAmount,
        slippage: 50 // 0.5% slippage
      };

      const newQuote = await AutoSwapperService.getSwapQuote(swapParams);
      setQuote(newQuote);
      setToAmount(newQuote.toAmount);
    } catch (error) {
      console.error('Failed to get quote:', error);
      Alert.alert('Error', 'Failed to get swap quote. Please try again.');
      setToAmount('');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !walletData || !quote) {
      Alert.alert('Error', 'Please complete all swap details');
      return;
    }

    setIsSwapping(true);
    try {
      const swapParams: SwapParams = {
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: fromAmount,
        slippage: 50
      };

      const result = await AutoSwapperService.executeSwap(walletData, swapParams);
      
      if (result.success) {
        Alert.alert(
          'Swap Successful!',
          `Swapped ${fromAmount} ${fromToken.symbol} for ${result.amountOut} ${toToken.symbol}\n\nTransaction: ${result.transactionHash}`,
          [{ text: 'OK', onPress: () => {
            setFromAmount('');
            setToAmount('');
            setQuote(null);
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
    setQuote(null);
  };

  const isSwapReady = fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && walletData && !isLoading;
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
                setQuote(null);
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
                // Debounce quote fetching
                setTimeout(() => getQuote(), 500);
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
                  setTimeout(() => getQuote(), 500);
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
                setToAmount('');
                setQuote(null);
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
            {isLoading ? (
              <ActivityIndicator size="small" color={SparkColors.gold} />
            ) : (
              <ThemedText style={styles.amount}>{toAmount || '0.0'}</ThemedText>
            )}
          </View>
        </View>

        {quote && (
          <View style={styles.quoteCard}>
            <ThemedText style={styles.quoteTitle}>Swap Details</ThemedText>
            <View style={styles.quoteRow}>
              <ThemedText style={styles.quoteLabel}>Rate</ThemedText>
              <ThemedText style={styles.quoteValue}>
                1 {fromToken?.symbol} = {(parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(6)} {toToken?.symbol}
              </ThemedText>
            </View>
            <View style={styles.quoteRow}>
              <ThemedText style={styles.quoteLabel}>Price Impact</ThemedText>
              <ThemedText style={[styles.quoteValue, { color: quote.priceImpact > 5 ? SparkColors.red : SparkColors.green }]}>
                {quote.priceImpact.toFixed(2)}%
              </ThemedText>
            </View>
            <View style={styles.quoteRow}>
              <ThemedText style={styles.quoteLabel}>Minimum Received</ThemedText>
              <ThemedText style={styles.quoteValue}>{quote.minimumReceived} {toToken?.symbol}</ThemedText>
            </View>
          </View>
        )}

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
});
