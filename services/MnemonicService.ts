import 'react-native-get-random-values';
import { ec, stark } from 'starknet';
import CryptoJS from 'crypto-js';

// Simplified BIP39 word list (256 words for demonstration)
const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest',
  'arrive', 'arrow', 'art', 'article', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake',
  'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge',
  'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit',
  'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology',
  'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
  'blind', 'blood', 'blossom', 'blow', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss',
  'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread',
  'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze',
  'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy',
  'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable'
];

export interface MnemonicResult {
  mnemonic: string;
  privateKey: string;
  publicKey: string;
}

class MnemonicService {
  private static instance: MnemonicService;

  static getInstance(): MnemonicService {
    if (!MnemonicService.instance) {
      MnemonicService.instance = new MnemonicService();
    }
    return MnemonicService.instance;
  }

  /**
   * Generate a 12-word mnemonic phrase from a private key
   */
  generateMnemonicFromPrivateKey(privateKey: string): string {
    try {
      // Remove 0x prefix if present
      const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      
      // Convert private key to bytes
      const privateKeyBytes = this.hexToBytes(cleanPrivateKey);
      
      // Create entropy from private key using SHA256
      const entropy = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(privateKeyBytes)).toString();
      
      // Take first 128 bits (32 hex chars) for 12-word mnemonic
      const entropyBits = entropy.slice(0, 32);
      
      // Convert to binary
      const binaryEntropy = this.hexToBinary(entropyBits);
      
      // Add checksum (first 4 bits of SHA256 hash)
      const checksumHash = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(entropyBits)).toString();
      const checksum = this.hexToBinary(checksumHash.slice(0, 1)).slice(0, 4);
      
      const fullBinary = binaryEntropy + checksum;
      
      // Split into 11-bit groups (12 words)
      const words: string[] = [];
      for (let i = 0; i < 12; i++) {
        const bits = fullBinary.slice(i * 11, (i + 1) * 11);
        const wordIndex = parseInt(bits, 2) % BIP39_WORDLIST.length;
        words.push(BIP39_WORDLIST[wordIndex]);
      }
      
      return words.join(' ');
    } catch (error) {
      console.error('Error generating mnemonic from private key:', error);
      throw new Error('Failed to generate mnemonic phrase');
    }
  }

  /**
   * Derive private key from 12-word mnemonic phrase
   */
  derivePrivateKeyFromMnemonic(mnemonic: string): string {
    try {
      const words = mnemonic.trim().toLowerCase().split(/\s+/);
      
      if (words.length !== 12) {
        throw new Error('Mnemonic must contain exactly 12 words');
      }

      // Validate all words exist in wordlist
      for (const word of words) {
        if (!BIP39_WORDLIST.includes(word)) {
          throw new Error(`Invalid word in mnemonic: ${word}`);
        }
      }

      // Convert words to indices
      const indices = words.map(word => BIP39_WORDLIST.indexOf(word));
      
      // Convert to binary
      let binaryString = '';
      for (const index of indices) {
        binaryString += index.toString(2).padStart(11, '0');
      }
      
      // Extract entropy (first 128 bits)
      const entropyBinary = binaryString.slice(0, 128);
      const checksumBinary = binaryString.slice(128, 132);
      
      // Convert entropy to hex
      const entropyHex = this.binaryToHex(entropyBinary);
      
      // Verify checksum
      const expectedChecksum = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(entropyHex)).toString().slice(0, 1);
      const expectedChecksumBinary = this.hexToBinary(expectedChecksum).slice(0, 4);
      
      if (checksumBinary !== expectedChecksumBinary) {
        throw new Error('Invalid mnemonic checksum');
      }
      
      // Derive private key from entropy using PBKDF2
      const seed = CryptoJS.PBKDF2(mnemonic, 'starknet', {
        keySize: 256 / 32,
        iterations: 2048
      });
      
      // Generate StarkNet-compatible private key
      const privateKeyHex = seed.toString(CryptoJS.enc.Hex);
      
      // Ensure it's a valid StarkNet private key (within field order)
      const privateKeyBigInt = BigInt('0x' + privateKeyHex);
      const fieldOrder = BigInt('0x800000000000011000000000000000000000000000000000000000000000001');
      const validPrivateKey = (privateKeyBigInt % fieldOrder).toString(16).padStart(64, '0');
      
      return '0x' + validPrivateKey;
    } catch (error) {
      console.error('Error deriving private key from mnemonic:', error);
      throw error;
    }
  }

  /**
   * Generate a new mnemonic phrase with corresponding keys
   */
  generateNewMnemonic(): MnemonicResult {
    try {
      // Generate a new private key
      const privateKey = stark.randomAddress();
      
      // Generate mnemonic from private key
      const mnemonic = this.generateMnemonicFromPrivateKey(privateKey);
      
      // Derive public key
      const publicKey = ec.starkCurve.getStarkKey(privateKey);
      
      return {
        mnemonic,
        privateKey,
        publicKey
      };
    } catch (error) {
      console.error('Error generating new mnemonic:', error);
      throw new Error('Failed to generate new mnemonic');
    }
  }

  /**
   * Validate a mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    try {
      const words = mnemonic.trim().toLowerCase().split(/\s+/);
      
      if (words.length !== 12) {
        return false;
      }

      // Check if all words exist in wordlist
      for (const word of words) {
        if (!BIP39_WORDLIST.includes(word)) {
          return false;
        }
      }

      // Try to derive private key (will throw if invalid checksum)
      this.derivePrivateKeyFromMnemonic(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  // Helper methods
  private hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  private hexToBinary(hex: string): string {
    return hex.split('').map(char => 
      parseInt(char, 16).toString(2).padStart(4, '0')
    ).join('');
  }

  private binaryToHex(binary: string): string {
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.slice(i, i + 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  }
}

export default MnemonicService.getInstance();
