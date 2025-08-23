import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList, StyleSheet, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { SparkColors } from '@/constants/Colors';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue: string;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  placeholder?: string;
}

export default function TokenSelector({ selectedToken, tokens, onTokenSelect, placeholder = "Select Token" }: TokenSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Token icons mapping - using actual images like home page
  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'STRK': return require('@/assets/images/strk.png');
      case 'ETH': return require('@/assets/images/eth.png');
      case 'USDC': return require('@/assets/images/usdc.png');
      case 'USDT': return require('@/assets/images/usdt.png');
      default: return require('@/assets/images/strk.png');
    }
  };

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsModalVisible(false);
  };

  const renderTokenItem = ({ item }: { item: Token }) => (
    <TouchableOpacity
      style={styles.tokenItem}
      onPress={() => handleTokenSelect(item)}
    >
      <View style={styles.tokenItemLeft}>
        <View style={styles.tokenItemIcon}>
          <Image 
            source={getTokenIcon(item.symbol)} 
            style={styles.tokenItemIconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.tokenItemInfo}>
          <ThemedText style={styles.tokenItemSymbol}>{item.symbol}</ThemedText>
          <ThemedText style={styles.tokenItemName}>{item.name}</ThemedText>
        </View>
      </View>
      {item.balanceFormatted && (
        <ThemedText style={styles.tokenItemBalance}>{parseFloat(item.balanceFormatted).toFixed(4)}</ThemedText>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsModalVisible(true)}
      >
        {selectedToken ? (
          <View style={styles.selectedTokenContainer}>
            <View style={styles.selectedTokenIcon}>
              <Image 
                source={getTokenIcon(selectedToken.symbol)} 
                style={styles.selectedTokenIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.selectedTokenInfo}>
              <ThemedText style={styles.selectedTokenSymbol}>{selectedToken.symbol}</ThemedText>
              <ThemedText style={styles.selectedTokenName}>{selectedToken.name}</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>▼</ThemedText>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <ThemedText style={styles.placeholder}>{placeholder}</ThemedText>
            <ThemedText style={styles.chevron}>▼</ThemedText>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Token</ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={tokens}
              renderItem={renderTokenItem}
              keyExtractor={(item) => item.address}
              style={styles.tokenList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  selectedTokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedTokenIconImage: {
    width: 24,
    height: 24,
  },
  selectedTokenInfo: {
    flex: 1,
  },
  selectedTokenSymbol: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTokenName: {
    color: SparkColors.lightGray,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: SparkColors.lightGray,
    fontSize: 12,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: SparkColors.darkBrown,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SparkColors.brown,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  modalTitle: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SparkColors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenList: {
    paddingHorizontal: 20,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  tokenItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenItemIconImage: {
    width: 32,
    height: 32,
  },
  tokenItemInfo: {
    flex: 1,
  },
  tokenItemSymbol: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tokenItemName: {
    color: SparkColors.lightGray,
    fontSize: 14,
    marginTop: 2,
  },
  tokenItemBalance: {
    color: SparkColors.lightGray,
    fontSize: 14,
  },
});
