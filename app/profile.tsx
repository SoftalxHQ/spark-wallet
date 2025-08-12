import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';

export default function ProfileScreen() {
  const profileSections = [
    {
      title: 'Account',
      items: [
        { name: 'Wallet Address', value: '0x1234...5678', icon: '🔗' },
        { name: 'Email', value: 'user@example.com', icon: '📧' },
        { name: 'Network', value: 'StarkNet Mainnet', icon: '🌐' },
      ]
    },
    {
      title: 'Security',
      items: [
        { name: 'Change Password', icon: '🔒' },
        { name: 'Two-Factor Authentication', icon: '🔐' },
        { name: 'Biometric Login', icon: '👆' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Currency', value: 'USD', icon: '💵' },
        { name: 'Language', value: 'English', icon: '🌍' },
        { name: 'Notifications', icon: '🔔' },
      ]
    }
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
          <View style={styles.profileAvatar}>
            <ThemedText style={styles.avatarText}>👤</ThemedText>
          </View>
          <ThemedText type="title" style={styles.userName}>John Doe</ThemedText>
          <ThemedText style={styles.userEmail}>user@example.com</ThemedText>
        </View>

        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity key={itemIndex} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <ThemedText style={styles.settingIcon}>{item.icon}</ThemedText>
                    <View style={styles.settingInfo}>
                      <ThemedText style={styles.settingName}>{item.name}</ThemedText>
                      {item.value && (
                        <ThemedText style={styles.settingValue}>{item.value}</ThemedText>
                      )}
                    </View>
                  </View>
                  <ThemedText style={styles.settingArrow}>›</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SparkColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    color: SparkColors.white,
    marginBottom: 4,
  },
  userEmail: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: SparkColors.white,
    marginBottom: 12,
    fontSize: 18,
  },
  sectionContent: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    color: SparkColors.white,
    fontSize: 16,
    marginBottom: 2,
  },
  settingValue: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  settingArrow: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
