import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';

export default function HomeScreen() {
  const walletAddress = "0x1234...5678";
  const totalBalance = "$1,234.56";
  const ethBalance = "0.5 ETH";
  const strkBalance = "100 STRK";
  const usdcBalance = "500 USDC";

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.walletInfo}>
            <ThemedText style={styles.welcomeText}>Welcome back</ThemedText>
            <ThemedText style={styles.walletAddress}>{walletAddress}</ThemedText>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <ThemedText style={styles.profileButtonText}>👤</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
          <ThemedText type="title" style={styles.balanceAmount}>{totalBalance}</ThemedText>
          <View style={styles.balanceBreakdown}>
            <ThemedText style={styles.balanceSubtext}>{ethBalance}</ThemedText>
            <ThemedText style={styles.balanceSubtext}>•</ThemedText>
            <ThemedText style={styles.balanceSubtext}>{strkBalance}</ThemedText>
            <ThemedText style={styles.balanceSubtext}>•</ThemedText>
            <ThemedText style={styles.balanceSubtext}>{usdcBalance}</ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <ThemedText style={styles.actionIconText}>↑</ThemedText>
            </View>
            <ThemedText style={styles.actionText}>Send</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <ThemedText style={styles.actionIconText}>↓</ThemedText>
            </View>
            <ThemedText style={styles.actionText}>Receive</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <ThemedText style={styles.actionIconText}>↔</ThemedText>
            </View>
            <ThemedText style={styles.actionText}>Swap</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <ThemedText style={styles.actionIconText}>⚡</ThemedText>
            </View>
            <ThemedText style={styles.actionText}>Utilities</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Token Balances */}
        <View style={styles.tokensSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Your Tokens</ThemedText>
          
          <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <ThemedText style={styles.tokenIconText}>Ξ</ThemedText>
              </View>
              <View style={styles.tokenDetails}>
                <ThemedText style={styles.tokenName}>Ethereum</ThemedText>
                <ThemedText style={styles.tokenSymbol}>ETH</ThemedText>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <ThemedText style={styles.tokenAmount}>0.5</ThemedText>
              <ThemedText style={styles.tokenValue}>$1,000.00</ThemedText>
            </View>
          </View>

          <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <ThemedText style={styles.tokenIconText}>⚡</ThemedText>
              </View>
              <View style={styles.tokenDetails}>
                <ThemedText style={styles.tokenName}>Starknet Token</ThemedText>
                <ThemedText style={styles.tokenSymbol}>STRK</ThemedText>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <ThemedText style={styles.tokenAmount}>100</ThemedText>
              <ThemedText style={styles.tokenValue}>$200.00</ThemedText>
            </View>
          </View>

          <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <ThemedText style={styles.tokenIconText}>💵</ThemedText>
              </View>
              <View style={styles.tokenDetails}>
                <ThemedText style={styles.tokenName}>USD Coin</ThemedText>
                <ThemedText style={styles.tokenSymbol}>USDC</ThemedText>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <ThemedText style={styles.tokenAmount}>500</ThemedText>
              <ThemedText style={styles.tokenValue}>$500.00</ThemedText>
            </View>
          </View>
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
    marginTop: 60,
    marginBottom: 32,
  },
  walletInfo: {
    flex: 1,
  },
  welcomeText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginBottom: 4,
  },
  walletAddress: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: '600',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SparkColors.darkBrown,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  profileButtonText: {
    fontSize: 20,
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
    marginBottom: 12,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceSubtext: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
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
});
