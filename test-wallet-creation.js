// Import starknet.js directly to test wallet creation logic
const { stark, ec, hash, CallData } = require('starknet');

// Mock AsyncStorage for Node.js testing
const AsyncStorage = {
  storage: new Map(),
  async setItem(key, value) {
    console.log(`AsyncStorage.setItem called with key: ${key}`);
    this.storage.set(key, value);
    console.log(`AsyncStorage.setItem completed for key: ${key}`);
  },
  async getItem(key) {
    console.log(`AsyncStorage.getItem called with key: ${key}`);
    const value = this.storage.get(key) || null;
    console.log(`AsyncStorage.getItem returned for key ${key}:`, value);
    return value;
  },
  async removeItem(key) {
    this.storage.delete(key);
  }
};

// Mock React Native AsyncStorage
global.AsyncStorage = AsyncStorage;

// Replicate wallet creation logic from StarkNetWalletService
const ACCOUNT_CLASS_HASH = '0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f';

function ensureAddressFormat(address) {
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  if (address.length < 66) {
    address = '0x' + address.slice(2).padStart(64, '0');
  }
  return address;
}

async function createSmartWallet() {
  console.log('=== STARKNET WALLET CREATION DEBUG ===');
  console.log('Creating new StarkNet smart wallet...');
  
  console.log('Step 1: Generating private key...');
  const privateKey = stark.randomAddress();
  console.log('Private key generated:', privateKey);
  
  console.log('Step 2: Deriving public key...');
  const publicKey = ec.starkCurve.getStarkKey(privateKey);
  console.log('Public key derived:', publicKey);
  
  console.log('Step 3: Compiling constructor calldata...');
  const constructorCalldata = CallData.compile({ publicKey });
  console.log('Constructor calldata:', constructorCalldata);
  
  console.log('Step 4: Calculating contract address...');
  console.log('Using account class hash:', ACCOUNT_CLASS_HASH);
  console.log('Using salt (public key):', publicKey);
  
  const rawAddress = hash.calculateContractAddressFromHash(
    publicKey, // salt
    ACCOUNT_CLASS_HASH,
    constructorCalldata,
    0 // deployer address
  );
  console.log('Raw calculated address:', rawAddress);
  
  const address = ensureAddressFormat(rawAddress);
  console.log('Formatted wallet address:', address);
  
  const walletData = {
    address: address,
    publicKey: publicKey,
    privateKey: privateKey,
    salt: publicKey
  };
  
  console.log('Final wallet data object:', {
    address: walletData.address,
    publicKey: walletData.publicKey,
    privateKey: '[REDACTED]',
    salt: walletData.salt
  });
  
  console.log('Smart wallet created successfully');
  return walletData;
}

// Mock storage service
const WALLET_DATA_KEY = '@spark_wallet_data';

async function saveWalletData(walletData) {
  console.log('=== STORAGE SERVICE DEBUG ===');
  console.log('Attempting to save wallet data:', walletData);
  console.log('Storage key:', WALLET_DATA_KEY);
  
  const serializedData = JSON.stringify(walletData);
  console.log('Serialized data:', serializedData);
  
  await AsyncStorage.setItem(WALLET_DATA_KEY, serializedData);
  console.log('AsyncStorage.setItem completed successfully');
  
  // Immediate verification
  const verification = await AsyncStorage.getItem(WALLET_DATA_KEY);
  console.log('Immediate verification - data retrieved:', verification);
  
  console.log('Wallet data saved successfully');
}

async function getWalletData() {
  const walletData = await AsyncStorage.getItem(WALLET_DATA_KEY);
  return walletData ? JSON.parse(walletData) : null;
}

async function testWalletCreationAndStorage() {
  try {
    console.log('=== TESTING WALLET CREATION AND STORAGE ===');
    
    console.log('\n1. Testing wallet creation...');
    const walletData = await createSmartWallet();
    console.log('Wallet created successfully:', {
      address: walletData.address,
      publicKey: walletData.publicKey,
      privateKey: '[REDACTED]',
      salt: walletData.salt
    });
    
    console.log('\n2. Testing wallet storage...');
    await saveWalletData(walletData);
    
    console.log('\n3. Testing wallet retrieval...');
    const retrievedWallet = await getWalletData();
    console.log('Retrieved wallet:', retrievedWallet);
    
    console.log('\n4. Verification...');
    if (retrievedWallet && retrievedWallet.address === walletData.address) {
      console.log('✅ SUCCESS: Wallet creation and storage working correctly!');
      console.log('Generated wallet address:', walletData.address);
    } else {
      console.log('❌ FAILURE: Wallet storage/retrieval mismatch');
      console.log('Original:', walletData.address);
      console.log('Retrieved:', retrievedWallet?.address || 'null');
    }
    
  } catch (error) {
    console.error('❌ ERROR during testing:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testWalletCreationAndStorage();
