import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';

export default function SwapScreen() {
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
          <View style={styles.tokenSelector}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <ThemedText style={styles.tokenIconText}>Ξ</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.tokenName}>Ethereum</ThemedText>
                <ThemedText style={styles.tokenSymbol}>ETH</ThemedText>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={styles.amount}>0.0</ThemedText>
              <ThemedText style={styles.balance}>Balance: 0.5 ETH</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.swapArrow}>
          <ThemedText style={styles.arrowText}>↓</ThemedText>
        </View>

        <View style={styles.swapCard}>
          <ThemedText style={styles.cardTitle}>To</ThemedText>
          <View style={styles.tokenSelector}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <ThemedText style={styles.tokenIconText}>⚡</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.tokenName}>Starknet Token</ThemedText>
                <ThemedText style={styles.tokenSymbol}>STRK</ThemedText>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={styles.amount}>0.0</ThemedText>
              <ThemedText style={styles.balance}>Balance: 100 STRK</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.swapButton}>
          <ThemedText style={styles.swapButtonText}>Connect Wallet to Swap</ThemedText>
        </View>
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
  swapArrow: {
    alignItems: 'center',
    marginVertical: 8,
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
});
