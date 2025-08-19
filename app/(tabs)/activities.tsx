import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { BlockScanTransaction, BlockScanTransactionService, PaginationState } from '@/services/BlockScanTransactionService';
import StorageService from '@/services/StorageService';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const blockScanTransactionService = new BlockScanTransactionService();

export default function ActivitiesScreen() {
  const [transactions, setTransactions] = useState<BlockScanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent' | 'swaps'>('all');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);


  const loadTransactions = useCallback(async (address: string, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setTransactions([]);
        setPagination(null);
      }
      
      const result = await blockScanTransactionService.getInitialTransactions(address);
      const enrichedTransactions = await enrichTransactionsWithUSD(result.transactions);
      
      setTransactions(enrichedTransactions);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  const loadWalletAndTransactions = useCallback(async () => {
    try {
      const walletData = await StorageService.getWalletData();
      if (walletData) {
        setWalletAddress(walletData.address);
        await loadTransactions(walletData.address);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  const loadMoreTransactions = useCallback(async () => {
    if (!walletAddress || !pagination || pagination.isComplete || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const result = await blockScanTransactionService.loadMoreTransactions(walletAddress, pagination);
      const enrichedTransactions = await enrichTransactionsWithUSD(result.transactions);
      
      setTransactions(prev => [...prev, ...enrichedTransactions]);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [walletAddress, pagination, loadingMore]);


  useEffect(() => {
    loadWalletAndTransactions();
  }, [loadWalletAndTransactions]);

  const enrichTransactionsWithUSD = async (transactions: BlockScanTransaction[]) => {
    // For block scan transactions, we don't have token info yet
    // This would need to be enhanced to parse calldata for token transfers
    return transactions.map(tx => ({
      ...tx,
      usdValue: '0.00'
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (walletAddress) {
      await loadTransactions(walletAddress, true);
    }
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'received') return tx.type === 'received';
    if (filter === 'sent') return tx.type === 'sent';
    if (filter === 'swaps') return tx.type === 'swapped';
    return false;
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  };

  const getTransactionTitle = (tx: BlockScanTransaction): string => {
    switch (tx.type) {
      case 'deployed':
        return 'Account Deployed';
      case 'sent':
        return `Sent ${tx.tokenSymbol || 'Token'}`;
      case 'received':
        return `Received ${tx.tokenSymbol || 'Token'}`;
      case 'swapped':
        return 'Token Swap';
      case 'contract_call':
        return 'Contract Interaction';
      default:
        return 'Transaction';
    }
  };

  const getTransactionSubtitle = (tx: BlockScanTransaction): string => {
    switch (tx.type) {
      case 'deployed':
        return `Account: ${formatAddress(tx.contractAddress || tx.senderAddress)}`;
      case 'sent':

      case 'received':
        return `From: ${formatAddress(tx.fromAddress || tx.senderAddress)}`;
      case 'swapped':
        return `Contract: ${formatAddress(tx.contractAddress || tx.senderAddress)}`;
      case 'contract_call':
        return `Contract: ${formatAddress(tx.contractAddress || tx.senderAddress)}`;
      default:
        return `Tx: ${formatAddress(tx.hash)}`;
    }
  };

  const getTransactionAmount = (tx: BlockScanTransaction): string => {
    if (tx.amount && tx.tokenSymbol) {
      const sign = tx.type === 'sent' ? '-' : tx.type === 'received' ? '+' : '';
      return `${sign}${tx.amount} ${tx.tokenSymbol}`;
    }
    return `#${tx.blockNumber}`;
  };

  const getBlockchainUrl = (txHash: string): string => {
    return `https://sepolia.voyager.online/tx/${txHash}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deployed':
        return '🚀';
      case 'sent':
        return '↗️';
      case 'received':
        return '↙️';
      case 'swapped':
        return '🔄';
      case 'contract_call':
        return '⚙️';
      default:
        return '•';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deployed':
        return '#4CAF50';
      case 'sent':
        return '#F44336';
      case 'received':
        return '#4CAF50';
      case 'swapped':
        return SparkColors.gold;
      case 'contract_call':
        return '#2196F3';
      default:
        return SparkColors.gold;
    }
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SparkColors.gold}
            colors={[SparkColors.gold]}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Activities</ThemedText>
          <ThemedText style={styles.subtitle}>Your transaction history</ThemedText>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterActive]}
            onPress={() => setFilter('all')}
          >
            <ThemedText style={styles.filterText}>All</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'received' && styles.filterActive]}
            onPress={() => setFilter('received')}
          >
            <ThemedText style={styles.filterText}>Received</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'sent' && styles.filterActive]}
            onPress={() => setFilter('sent')}
          >
            <ThemedText style={styles.filterText}>Sent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'swaps' && styles.filterActive]}
            onPress={() => setFilter('swaps')}
          >
            <ThemedText style={styles.filterText}>Swaps</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={SparkColors.gold} />
              <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyTitle}>No transactions found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Your transaction history will appear here'
                  : `No ${filter} transactions found`
                }
              </ThemedText>
            </View>
          ) : (
            filteredTransactions.map((tx) => {
              const title = getTransactionTitle(tx);
              const subtitle = getTransactionSubtitle(tx);
              const amount = getTransactionAmount(tx);
              const isExpanded = expandedCard === tx.hash;
              
              return (
                <View key={tx.hash}>
                  <TouchableOpacity 
                    style={[styles.activityCard, isExpanded && styles.activityCardExpanded]}
                    onPress={() => setExpandedCard(isExpanded ? null : tx.hash)}
                  >
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityIcon, { backgroundColor: getActivityColor(tx.type) }]}>
                        <ThemedText style={styles.activityIconText}>{getActivityIcon(tx.type)}</ThemedText>
                      </View>
                      <View style={styles.activityInfo}>
                        <ThemedText style={styles.activityTitle}>{title}</ThemedText>
                        <ThemedText style={styles.activitySubtitle}>{subtitle}</ThemedText>
                        <ThemedText style={styles.activityDate}>
                        {formatDate(tx.timestamp)} • v{tx.version}
                      </ThemedText>
                      </View>
                    </View>
                    <View style={styles.activityRight}>
                      <ThemedText style={[styles.activityAmount, { color: getActivityColor(tx.type) }]}>
                        {amount}
                      </ThemedText>
                      <ThemedText style={styles.activityValue}>
                        {tx.status === 'success' ? '✅' : tx.status === 'failed' ? '❌' : '⏳'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <TouchableOpacity 
                        style={styles.viewOnBlockchainButton}
                        onPress={async () => {
                          const url = getBlockchainUrl(tx.hash);
                          try {
                            await Linking.openURL(url);
                          } catch (error) {
                            console.error('Failed to open blockchain explorer:', error);
                          }
                        }}
                      >
                        <ThemedText style={styles.viewOnBlockchainText}>View on Blockchain 🔗</ThemedText>
                      </TouchableOpacity>
                      <View style={styles.transactionDetails}>
                        <ThemedText style={styles.detailLabel}>Hash:</ThemedText>
                        <ThemedText style={styles.detailValue}>{formatAddress(tx.hash)}</ThemedText>
                      </View>
                      <View style={styles.transactionDetails}>
                        <ThemedText style={styles.detailLabel}>Block:</ThemedText>
                        <ThemedText style={styles.detailValue}>#{tx.blockNumber}</ThemedText>
                      </View>
                      <View style={styles.transactionDetails}>
                        <ThemedText style={styles.detailLabel}>Version:</ThemedText>
                        <ThemedText style={styles.detailValue}>v{tx.version}</ThemedText>
                      </View>
                      {tx.nonce && (
                        <View style={styles.transactionDetails}>
                          <ThemedText style={styles.detailLabel}>Nonce:</ThemedText>
                          <ThemedText style={styles.detailValue}>{tx.nonce}</ThemedText>
                        </View>
                      )}
                      {tx.maxFee && (
                        <View style={styles.transactionDetails}>
                          <ThemedText style={styles.detailLabel}>Max Fee:</ThemedText>
                          <ThemedText style={styles.detailValue}>{(parseFloat(tx.maxFee) / 1e18).toFixed(6)} ETH</ThemedText>
                        </View>
                      )}
                      {tx.tokenAddress && (
                        <View style={styles.transactionDetails}>
                          <ThemedText style={styles.detailLabel}>Token:</ThemedText>
                          <ThemedText style={styles.detailValue}>{formatAddress(tx.tokenAddress)}</ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {!loading && filteredTransactions.length > 0 && pagination && !pagination.isComplete && (
          <View style={styles.loadMore}>
            <TouchableOpacity 
              style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
              onPress={loadMoreTransactions}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={SparkColors.black} />
              ) : (
                <ThemedText style={styles.loadMoreText}>Load More (6)</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {!loading && pagination && pagination.isComplete && filteredTransactions.length > 0 && (
          <View style={styles.endMessage}>
            <ThemedText style={styles.endMessageText}>No more transactions</ThemedText>
          </View>
        )}
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
    marginBottom: 24,
  },
  title: {
    color: SparkColors.white,
    marginBottom: 8,
  },
  subtitle: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  filterActive: {
    backgroundColor: SparkColors.gold,
    borderColor: SparkColors.gold,
  },
  filterText: {
    color: SparkColors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  activitiesList: {
    marginBottom: 24,
  },
  activityCard: {
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
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
    color: SparkColors.black,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activitySubtitle: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginBottom: 2,
  },
  activityDate: {
    color: SparkColors.darkGray,
    fontSize: 12,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  activityValue: {
    color: SparkColors.lightGray,
    fontSize: 14,
  },
  loadMore: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loadMoreButton: {
    backgroundColor: SparkColors.darkGold,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  loadMoreText: {
    color: SparkColors.black,
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  endMessage: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  endMessageText: {
    color: SparkColors.darkGray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  activityCardExpanded: {
    backgroundColor: SparkColors.brown,
    borderColor: SparkColors.gold,
  },
  expandedContent: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 8,
    padding: 16,
    marginTop: -8,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  viewOnBlockchainButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewOnBlockchainText: {
    color: SparkColors.black,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: SparkColors.lightGray,
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: SparkColors.white,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: SparkColors.lightGray,
    fontSize: 14,
    textAlign: 'center',
  },
});
