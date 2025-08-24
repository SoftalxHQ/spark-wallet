import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { SparkColors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Clipboard from 'expo-clipboard';

interface RecoveryPhraseModalProps {
  visible: boolean;
  onClose: () => void;
  mnemonic: string;
}

export default function RecoveryPhraseModal({ visible, onClose, mnemonic }: RecoveryPhraseModalProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const words = mnemonic.split(' ');

  const handleRevealPhrase = () => {
    Alert.alert(
      'Security Warning',
      'Make sure you are in a private location. Anyone who sees your recovery phrase can access your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Understand', 
          onPress: () => setIsRevealed(true),
          style: 'default'
        }
      ]
    );
  };

  const handleCopyAll = async () => {
    try {
      await Clipboard.setStringAsync(mnemonic);
      Alert.alert('Copied', 'Recovery phrase copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy recovery phrase');
    }
  };

  const handleClose = () => {
    setIsRevealed(false);
    onClose();
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
          <ThemedText type="title" style={styles.title}>Recovery Phrase</ThemedText>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <IconSymbol name="chevron.left" size={24} color={SparkColors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!isRevealed ? (
            <View style={styles.hiddenContainer}>
              <View style={styles.warningContainer}>
                <IconSymbol name="shield.fill" size={48} color={SparkColors.gold} />
                <ThemedText style={styles.warningTitle}>Your Recovery Phrase</ThemedText>
                <ThemedText style={styles.warningText}>
                  This 12-word phrase is the master key to your wallet. With it, anyone can access your funds.
                </ThemedText>
              </View>

              <View style={styles.securityTips}>
                <ThemedText style={styles.tipsTitle}>Security Tips:</ThemedText>
                <View style={styles.tipItem}>
                  <ThemedText style={styles.tipBullet}>•</ThemedText>
                  <ThemedText style={styles.tipText}>Write it down on paper and store it safely</ThemedText>
                </View>
                <View style={styles.tipItem}>
                  <ThemedText style={styles.tipBullet}>•</ThemedText>
                  <ThemedText style={styles.tipText}>Never share it with anyone</ThemedText>
                </View>
                <View style={styles.tipItem}>
                  <ThemedText style={styles.tipBullet}>•</ThemedText>
                  <ThemedText style={styles.tipText}>Don&apos;t store it digitally or take screenshots</ThemedText>
                </View>
                <View style={styles.tipItem}>
                  <ThemedText style={styles.tipBullet}>•</ThemedText>
                  <ThemedText style={styles.tipText}>Keep multiple copies in secure locations</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.revealButton}
                onPress={handleRevealPhrase}
              >
                <IconSymbol name="shield.fill" size={20} color={SparkColors.black} />
                <ThemedText style={styles.revealButtonText}>Reveal Recovery Phrase</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.revealedContainer}>
              <View style={styles.phraseHeader}>
                <ThemedText style={styles.phraseTitle}>Your 12-Word Recovery Phrase</ThemedText>
                <ThemedText style={styles.phraseSubtitle}>
                  Write down these words in the exact order shown
                </ThemedText>
              </View>

              <View style={styles.wordsContainer}>
                {words.map((word, index) => (
                  <View key={index} style={styles.wordItem}>
                    <View style={styles.wordNumber}>
                      <ThemedText style={styles.wordNumberText}>{index + 1}</ThemedText>
                    </View>
                    <View style={styles.wordBox}>
                      <ThemedText style={styles.wordText}>{word}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAll}
              >
                <IconSymbol name="creditcard.fill" size={20} color={SparkColors.black} />
                <ThemedText style={styles.copyButtonText}>Copy All Words</ThemedText>
              </TouchableOpacity>

              <View style={styles.finalWarning}>
                <IconSymbol name="shield.fill" size={16} color={SparkColors.gold} />
                <ThemedText style={styles.finalWarningText}>
                  Store this phrase safely. You&apos;ll need it to recover your wallet.
                </ThemedText>
              </View>
            </View>
          )}
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
  // Hidden state styles
  hiddenContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  warningTitle: {
    color: SparkColors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  warningText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  securityTips: {
    width: '100%',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  tipsTitle: {
    color: SparkColors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    color: SparkColors.gold,
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    color: SparkColors.white,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  revealButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  revealButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Revealed state styles
  revealedContainer: {
    flex: 1,
  },
  phraseHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  phraseTitle: {
    color: SparkColors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phraseSubtitle: {
    color: SparkColors.lightGray,
    fontSize: 14,
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  wordItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SparkColors.brown,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  wordNumberText: {
    color: SparkColors.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  wordBox: {
    flex: 1,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  wordText: {
    color: SparkColors.white,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  copyButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  finalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: SparkColors.gold,
  },
  finalWarningText: {
    color: SparkColors.white,
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
  },
});
