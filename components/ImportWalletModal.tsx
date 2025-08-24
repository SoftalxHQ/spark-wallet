import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import StarkNetWalletService from '@/services/StarkNetWalletService';
import StorageService from '@/services/StorageService';

interface ImportWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onWalletImported: () => void;
}

export default function ImportWalletModal({ visible, onClose, onWalletImported }: ImportWalletModalProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImportWallet = async () => {
    if (!mnemonic.trim()) {
      Alert.alert('Error', 'Please enter your 12-word recovery phrase');
      return;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      Alert.alert('Error', 'Recovery phrase must contain exactly 12 words');
      return;
    }

    setIsLoading(true);
    try {
      // Create wallet from mnemonic
      const walletData = await StarkNetWalletService.createWalletFromMnemonic(mnemonic.trim());
      
      // Add wallet to storage (will be named Account1 if first wallet, or incremental number)
      await StorageService.addWallet(walletData);
      
      Alert.alert(
        'Success', 
        'Wallet imported successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setMnemonic('');
              onWalletImported();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error importing wallet:', error);
      Alert.alert(
        'Import Failed', 
        error instanceof Error ? error.message : 'Failed to import wallet. Please check your recovery phrase and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMnemonic('');
    onClose();
  };

  const handlePasteExample = () => {
    // Example mnemonic for testing (this would be from clipboard in real usage)
    const exampleMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    setMnemonic(exampleMnemonic);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={[SparkColors.black, SparkColors.darkBrown]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Import Wallet</ThemedText>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <IconSymbol name="chevron.left" size={24} color={SparkColors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.instructionContainer}>
            <ThemedText style={styles.instruction}>
              Enter your 12-word recovery phrase to restore your wallet
            </ThemedText>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Recovery Phrase</ThemedText>
            <TextInput
              style={styles.mnemonicInput}
              value={mnemonic}
              onChangeText={setMnemonic}
              placeholder="Enter your 12-word recovery phrase separated by spaces"
              placeholderTextColor={SparkColors.lightGray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePasteExample}
            >
              <ThemedText style={styles.pasteButtonText}>Paste Example</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.warningContainer}>
            <View style={styles.warningHeader}>
              <IconSymbol name="shield.fill" size={20} color={SparkColors.gold} />
              <ThemedText style={styles.warningTitle}>Security Notice</ThemedText>
            </View>
            <ThemedText style={styles.warningText}>
              • Never share your recovery phrase with anyone{'\n'}
              • Store it securely offline{'\n'}
              • Anyone with access to your recovery phrase can control your wallet{'\n'}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.importButton, isLoading && styles.importButtonDisabled]}
            onPress={handleImportWallet}
            disabled={isLoading}
          >
            <ThemedText style={styles.importButtonText}>
              {isLoading ? 'Importing...' : 'Import Wallet'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SparkColors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  title: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    marginBottom: 24,
  },
  instruction: {
    color: SparkColors.white,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: SparkColors.white,
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  mnemonicInput: {
    backgroundColor: SparkColors.darkBrown,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    borderRadius: 12,
    padding: 16,
    color: SparkColors.white,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pasteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: SparkColors.brown,
    borderRadius: 8,
  },
  pasteButtonText: {
    color: SparkColors.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    color: SparkColors.gold,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningText: {
    color: SparkColors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  importButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  importButtonDisabled: {
    backgroundColor: SparkColors.brown,
  },
  importButtonText: {
    color: SparkColors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
