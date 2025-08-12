import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';

export default function ActivitiesScreen() {
  const activities = [
    {
      id: '1',
      type: 'received',
      title: 'Received ETH',
      subtitle: 'From 0x1234...5678',
      amount: '+0.1 ETH',
      value: '$200.00',
      date: '2 hours ago',
      icon: '↓',
      color: '#4CAF50',
    },
    {
      id: '2',
      type: 'sent',
      title: 'Sent USDC',
      subtitle: 'To 0x9876...4321',
      amount: '-50 USDC',
      value: '$50.00',
      date: '1 day ago',
      icon: '↑',
      color: '#F44336',
    },
    {
      id: '3',
      type: 'swap',
      title: 'Swapped ETH → STRK',
      subtitle: '0.05 ETH for 10 STRK',
      amount: '10 STRK',
      value: '$20.00',
      date: '2 days ago',
      icon: '↔',
      color: SparkColors.gold,
    },
    {
      id: '4',
      type: 'utility',
      title: 'Electricity Bill',
      subtitle: 'Account: 123456789',
      amount: '-0.02 ETH',
      value: '$40.00',
      date: '3 days ago',
      icon: '⚡',
      color: '#FF9800',
    },
    {
      id: '5',
      type: 'received',
      title: 'Received STRK',
      subtitle: 'From 0xabcd...efgh',
      amount: '+25 STRK',
      value: '$50.00',
      date: '1 week ago',
      icon: '↓',
      color: '#4CAF50',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'received':
        return '↓';
      case 'sent':
        return '↑';
      case 'swap':
        return '↔';
      case 'utility':
        return '⚡';
      default:
        return '•';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'received':
        return '#4CAF50';
      case 'sent':
        return '#F44336';
      case 'swap':
        return SparkColors.gold;
      case 'utility':
        return '#FF9800';
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Activities</ThemedText>
          <ThemedText style={styles.subtitle}>Your transaction history</ThemedText>
        </View>

        <View style={styles.filters}>
          <TouchableOpacity style={[styles.filterButton, styles.filterActive]}>
            <ThemedText style={styles.filterText}>All</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText style={styles.filterText}>Received</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText style={styles.filterText}>Sent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText style={styles.filterText}>Swaps</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {activities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityCard}>
              <View style={styles.activityLeft}>
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) }]}>
                  <ThemedText style={styles.activityIconText}>{getActivityIcon(activity.type)}</ThemedText>
                </View>
                <View style={styles.activityInfo}>
                  <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                  <ThemedText style={styles.activitySubtitle}>{activity.subtitle}</ThemedText>
                  <ThemedText style={styles.activityDate}>{activity.date}</ThemedText>
                </View>
              </View>
              <View style={styles.activityRight}>
                <ThemedText style={[styles.activityAmount, { color: getActivityColor(activity.type) }]}>
                  {activity.amount}
                </ThemedText>
                <ThemedText style={styles.activityValue}>{activity.value}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.loadMore}>
          <TouchableOpacity style={styles.loadMoreButton}>
            <ThemedText style={styles.loadMoreText}>Load More</ThemedText>
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
});
