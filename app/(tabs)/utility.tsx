import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';

export default function UtilityScreen() {
  const utilities = [
    { name: 'Electricity', icon: '⚡', color: SparkColors.gold },
    { name: 'Airtime', icon: '📱', color: '#4CAF50' },
    { name: 'Data', icon: '📶', color: '#2196F3' },
    { name: 'Cable TV', icon: '📺', color: '#9C27B0' },
  ];

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Utility Payments</ThemedText>
          <ThemedText style={styles.subtitle}>Pay your bills with crypto</ThemedText>
        </View>

        <View style={styles.utilitiesGrid}>
          {utilities.map((utility, index) => (
            <TouchableOpacity key={index} style={styles.utilityCard}>
              <View style={[styles.utilityIcon, { backgroundColor: utility.color }]}>
                <ThemedText style={styles.utilityIconText}>{utility.icon}</ThemedText>
              </View>
              <ThemedText style={styles.utilityName}>{utility.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentPayments}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Payments</ThemedText>
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No recent payments</ThemedText>
            <ThemedText style={styles.emptySubtext}>Your payment history will appear here</ThemedText>
          </View>
        </View>

        <View style={styles.quickActions}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
          <TouchableOpacity style={styles.actionCard}>
            <ThemedText style={styles.actionTitle}>Add Payment Method</ThemedText>
            <ThemedText style={styles.actionSubtitle}>Connect your utility accounts</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <ThemedText style={styles.actionTitle}>Payment History</ThemedText>
            <ThemedText style={styles.actionSubtitle}>View all your transactions</ThemedText>
          </TouchableOpacity>
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
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  utilityCard: {
    width: '48%',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  utilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  utilityIconText: {
    fontSize: 24,
    color: SparkColors.black,
  },
  utilityName: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentPayments: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: SparkColors.white,
    marginBottom: 16,
    fontSize: 20,
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
  quickActions: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  actionTitle: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
});
