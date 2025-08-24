import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import NetworkConfigService, { NetworkType } from '@/services/NetworkConfigService';

interface NetworkSelectorProps {
  onNetworkChange?: (network: NetworkType) => void;
}

export default function NetworkSelector({ onNetworkChange }: NetworkSelectorProps) {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('mainnet');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load current network on component mount
    const network = NetworkConfigService.getCurrentNetwork();
    setCurrentNetwork(network);
  }, []);

  const handleNetworkSwitch = async (network: NetworkType) => {
    if (network === currentNetwork) {
      setShowModal(false);
      return;
    }

    setIsLoading(true);
    try {
      await NetworkConfigService.switchNetwork(network);
      setCurrentNetwork(network);
      setShowModal(false);
      
      // Notify parent component
      onNetworkChange?.(network);
      
      // Network switched successfully - no alert needed
    } catch {
      Alert.alert(
        'Network Switch Failed',
        'Failed to switch network. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const networks = NetworkConfigService.getAvailableNetworks();
  const currentConfig = NetworkConfigService.getCurrentConfig();

  return (
    <View>
      <TouchableOpacity 
        style={styles.selectorButton} 
        onPress={() => setShowModal(true)}
        disabled={isLoading}
      >
        <View style={styles.networkInfo}>
          <View style={[styles.networkDot, { 
            backgroundColor: currentNetwork === 'mainnet' ? '#00D4AA' : '#FFB800' 
          }]} />
          <ThemedText style={styles.networkName}>
            {currentConfig.displayName}
          </ThemedText>
        </View>
        <ThemedText style={styles.arrow}>›</ThemedText>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Network</ThemedText>
            
            {networks.map((network) => (
              <TouchableOpacity
                key={network.value}
                style={[
                  styles.networkOption,
                  currentNetwork === network.value && styles.selectedNetwork
                ]}
                onPress={() => handleNetworkSwitch(network.value)}
                disabled={isLoading}
              >
                <View style={styles.networkOptionContent}>
                  <View style={[styles.networkDot, { 
                    backgroundColor: network.value === 'mainnet' ? '#00D4AA' : '#FFB800' 
                  }]} />
                  <ThemedText style={[
                    styles.networkOptionText,
                    currentNetwork === network.value && styles.selectedNetworkText
                  ]}>
                    {network.label}
                  </ThemedText>
                </View>
                {currentNetwork === network.value && (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  networkName: {
    color: SparkColors.white,
    fontSize: 16,
  },
  arrow: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  modalTitle: {
    color: SparkColors.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: SparkColors.black,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  selectedNetwork: {
    backgroundColor: SparkColors.brown,
    borderColor: SparkColors.gold,
  },
  networkOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkOptionText: {
    color: SparkColors.white,
    fontSize: 16,
  },
  selectedNetworkText: {
    color: SparkColors.gold,
    fontWeight: 'bold',
  },
  checkmark: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: SparkColors.black,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  cancelText: {
    color: SparkColors.white,
    fontSize: 16,
  },
});
