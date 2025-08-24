// StarkNet Smart Contract Wallet Service
// Phase 1: Smart Contract Wallet Deployment
// This service handles StarkNet account abstraction and smart contract wallets

// Import crypto polyfill first - MUST be before starknet imports
import 'react-native-get-random-values';

import { Account, CallData, RpcProvider, cairo, ec, hash, stark } from 'starknet';
import priceService from './PriceService';
import StorageService from './StorageService';
import NetworkConfigService from './NetworkConfigService';
import MnemonicService from './MnemonicService';

export interface StarkNetWalletData {
  id?: string;
  address: string;
  publicKey: string;
  privateKey: string;
  salt: string;
  name?: string;
  mnemonic?: string;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class StarkNetWalletService {
  private static instance: StarkNetWalletService;
  private provider!: RpcProvider;

  // Account class hash will be loaded from NetworkConfigService

  static getInstance(): StarkNetWalletService {
    if (!StarkNetWalletService.instance) {
      StarkNetWalletService.instance = new StarkNetWalletService();
    }
    return StarkNetWalletService.instance;
  }

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const rpcUrl = NetworkConfigService.getRpcUrl();
    console.log(`Initializing StarkNet provider with RPC: ${rpcUrl}`);
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    console.log('StarkNet provider initialized with:', rpcUrl);
  }

  /**
   * Reinitialize provider when network changes
   */
  public reinitializeProvider() {
    console.log('Reinitializing provider for network change...');
    this.initializeProvider();
  }

  // Ensure proper address formatting (matches extension implementation)
  private ensureAddressFormat(address: string): string {
    if (!address.startsWith('0x')) {
      address = '0x' + address;
    }
    // Ensure proper StarkNet address format
    if (address.length < 66) {
      address = '0x' + address.slice(2).padStart(64, '0');
    }
    return address;
  }

  // Phase 1: Create a new smart wallet using Spark account
  async createSmartWallet(): Promise<StarkNetWalletData> {
    try {
      console.log('Creating new StarkNet smart wallet...');
      
      console.log('Step 1: Generating private key...');
      const privateKey = stark.randomAddress();
      console.log('Private key generated:', privateKey);
      
      console.log('Step 2: Deriving public key...');
      const publicKey = ec.starkCurve.getStarkKey(privateKey);
      console.log('Public key derived:', publicKey);
      
      console.log('Step 3: Generating mnemonic phrase...');
      const mnemonic = MnemonicService.generateMnemonicFromPrivateKey(privateKey);
      console.log('Mnemonic generated (12 words)');
      
      console.log('Step 4: Compiling constructor calldata...');
      const constructorCalldata = CallData.compile([publicKey]);
      console.log('Constructor calldata:', constructorCalldata);
      
      console.log('Step 5: Calculating contract address...');
      const accountClassHash = NetworkConfigService.getAccountClassHash();
      console.log('Using account class hash:', accountClassHash);
      console.log('Using salt (public key):', publicKey);
      
      const rawAddress = hash.calculateContractAddressFromHash(
        publicKey, // salt
        accountClassHash,
        constructorCalldata,
        0 // deployer address
      );
      console.log('Raw calculated address:', rawAddress);
      
      const formattedAddress = this.ensureAddressFormat(rawAddress);
      console.log('Formatted wallet address:', formattedAddress);
      
      const walletData: StarkNetWalletData = {
        address: formattedAddress,
        publicKey: publicKey,
        privateKey: privateKey,
        salt: publicKey,
        mnemonic: mnemonic,
        name: undefined // Name will be assigned by StorageService based on account count
      };
      
      console.log('Final wallet data object:', {
        address: walletData.address,
        publicKey: walletData.publicKey,
        privateKey: '[REDACTED]',
        salt: walletData.salt,
        mnemonic: '[REDACTED]'
      });
      
      console.log('Smart wallet created successfully');
      return walletData;
    } catch (error) {
      console.error('Error creating smart wallet:', error);
      if (error instanceof Error) {
        console.error('Creation error stack:', error.stack);
      }
      throw error;
    }
  }

  // Create wallet from mnemonic phrase
  async createWalletFromMnemonic(mnemonic: string): Promise<StarkNetWalletData> {
    try {
      console.log('Creating wallet from mnemonic phrase...');
      
      // Validate mnemonic
      if (!MnemonicService.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      console.log('Step 1: Deriving private key from mnemonic...');
      const privateKey = MnemonicService.derivePrivateKeyFromMnemonic(mnemonic);
      console.log('Private key derived from mnemonic');
      
      console.log('Step 2: Deriving public key...');
      const publicKey = ec.starkCurve.getStarkKey(privateKey);
      console.log('Public key derived:', publicKey);
      
      console.log('Step 3: Compiling constructor calldata...');
      const constructorCalldata = CallData.compile([publicKey]);
      console.log('Constructor calldata:', constructorCalldata);
      
      console.log('Step 4: Calculating contract address...');
      const accountClassHash = NetworkConfigService.getAccountClassHash();
      console.log('Using account class hash:', accountClassHash);
      
      const rawAddress = hash.calculateContractAddressFromHash(
        publicKey, // salt
        accountClassHash,
        constructorCalldata,
        0 // deployer address
      );
      console.log('Raw calculated address:', rawAddress);
      
      const formattedAddress = this.ensureAddressFormat(rawAddress);
      console.log('Formatted wallet address:', formattedAddress);
      
      const walletData: StarkNetWalletData = {
        address: formattedAddress,
        publicKey: publicKey,
        privateKey: privateKey,
        salt: publicKey,
        mnemonic: mnemonic,
        name: undefined
      };
      
      console.log('Wallet restored from mnemonic successfully');
      return walletData;
    } catch (error) {
      console.error('Error creating wallet from mnemonic:', error);
      throw error;
    }
  }

  // Phase 2: Deploy wallet (when first transaction is made)
  async deployWallet(walletData: StarkNetWalletData): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('Deploying wallet:', walletData.address);
      
      // Create account instance
      const account = new Account(this.provider, walletData.address, walletData.privateKey);
      
      // Deploy account contract
      const accountClassHash = NetworkConfigService.getAccountClassHash();
      const deployAccountPayload = {
        classHash: accountClassHash,
        constructorCalldata: CallData.compile([walletData.publicKey]),
        contractAddress: walletData.address,
        addressSalt: walletData.salt
      };

      const { transaction_hash: transactionHash } = await account.deployAccount(deployAccountPayload);
      
      console.log('Wallet deployment transaction:', transactionHash);
      
      // Wait for transaction confirmation
      await this.provider.waitForTransaction(transactionHash);
      console.log('Wallet deployed successfully');
      
      return {
        success: true,
        transactionHash: transactionHash
      };
      
    } catch (error) {
      console.error('Error deploying wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  // Phase 3: Get token balances using proper StarkNet.js methods
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      console.log('=== BALANCE FETCHING DEBUG ===');
      console.log('Fetching token balances for:', walletAddress);
      console.log('Using RPC endpoint:', this.provider.channel.nodeUrl);
      console.log('Network:', NetworkConfigService.getCurrentNetwork());
      
      const balances: TokenBalance[] = [];

      // Token configurations from NetworkConfigService
      const tokens = NetworkConfigService.getSupportedTokens();

      // Fetch balances for each token using multiple methods for debugging
      for (const token of tokens) {
        try {
          console.log(`\n--- Fetching ${token.symbol} balance ---`);
          console.log(`Wallet address: ${walletAddress}`);
          console.log(`Token contract: ${token.address}`);
          
          // Method 1: Direct provider.callContract (current approach)
          const result = await this.provider.callContract({
            contractAddress: token.address,
            entrypoint: "balanceOf",
            calldata: [walletAddress],
          });

          console.log(`${token.symbol} Raw response:`, result);

          let balanceValue = 0;
          let balanceString = '0';

          // Handle different response formats (matches extension logic)
          if (result && result.length > 0) {
            if (result.length >= 2) {
              // Uint256 format (low, high) - exact extension implementation
              const low = BigInt(result[0]);
              const high = BigInt(result[1]) << 128n;
              const balanceInWei = low + high;
              
              balanceString = balanceInWei.toString();
              balanceValue = Number(balanceInWei) / (10 ** token.decimals);
              
              console.log(`${token.symbol} Uint256 conversion (extension pattern):`, {
                low: low.toString(),
                high: high.toString(),
                combined: balanceInWei.toString(),
                formatted: balanceValue
              });
            } else {
              // Single value format
              const balanceInWei = BigInt(result[0]);
              balanceString = balanceInWei.toString();
              balanceValue = Number(balanceInWei) / (10 ** token.decimals);
              
              console.log(`${token.symbol} Single value:`, {
                raw: balanceInWei.toString(),
                formatted: balanceValue
              });
            }
          }
          
          // Get live USD price
          const usdPrice = await priceService.getTokenPrice(token.symbol);
          const usdValue = (balanceValue * usdPrice).toFixed(2);
          
          console.log(`${token.symbol} Final values:`, {
            balance: balanceString,
            balanceValue: balanceValue,
            usdPrice: usdPrice,
            usdValue: usdValue
          });
          
          balances.push({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            decimals: token.decimals,
            balance: balanceString,
            balanceFormatted: balanceValue > 0 ? balanceValue.toFixed(6).toString().slice(0, 10) : '0.0',
            usdValue: usdValue
          });

        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          
          // Add zero balance on error
          balances.push({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            balance: '0',
            balanceFormatted: '0.0',
            usdValue: '0.00'
          });
        }
      }

      console.log('\n=== FINAL BALANCES ===');
      console.log('All balances:', balances);
      return balances;

    } catch (error) {
      console.error('Error getting token balances:', error);
      return [];
    }
  }

  async estimateTransferGas(
    fromAddress: string,
    tokenAddress: string,
    toAddress: string,
    amount: string,
    decimals: number
  ): Promise<string> {
    try {
      // Use network-specific RPC endpoint
      const rpcUrl = NetworkConfigService.getRpcUrl();
      const provider = new RpcProvider({ nodeUrl: rpcUrl });
      
      console.log(`Estimating gas using ${NetworkConfigService.getCurrentNetwork()} network: ${rpcUrl}`);

      // Get wallet data to use real private key
      const walletData = await StorageService.getWalletData();
      if (!walletData) {
        throw new Error('No wallet data found');
      }

      // Check if wallet is deployed first
      const isDeployed = await this.isWalletDeployed(fromAddress);
      
      if (!isDeployed) {
        // For undeployed wallets, return a combined estimate:
        // Deployment cost (~0.002 STRK) + Transfer cost (~0.0005 STRK)
        console.log('Wallet not deployed, returning combined deployment + transfer estimate');
        return '0.0025';
      }

      // Convert amount to proper format
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
      
      // Create account instance with real private key for accurate estimation
      const account = new Account(
        provider,
        fromAddress,
        walletData.privateKey
      );

      // Use proper estimateInvokeFee method with correct calldata format
      const feeEstimate = await account.estimateInvokeFee({
        contractAddress: tokenAddress,
        entrypoint: 'transfer',
        calldata: [toAddress, cairo.uint256(amountInWei)]
      });

      // Handle different fee units (WEI for legacy, FRI for V3)
      let feeInStrk: number;
      if (feeEstimate.unit === 'FRI') {
        // V3 transaction - fee is already in STRK (FRI)
        feeInStrk = Number(feeEstimate.overall_fee) / (10 ** 18);
      } else {
        // Legacy transaction - fee is in WEI, convert to STRK
        feeInStrk = Number(feeEstimate.overall_fee) / (10 ** 18);
      }
      
      console.log('Gas estimation:', {
        overall_fee: feeEstimate.overall_fee.toString(),
        unit: feeEstimate.unit,
        suggestedMaxFee: feeEstimate.suggestedMaxFee.toString(),
        feeInStrk: feeInStrk.toFixed(4)
      });

      return feeInStrk.toFixed(4);
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return fallback estimate
      return '0.002';
    }
  }

  // Phase 4: Check if wallet is deployed
  async isWalletDeployed(address: string): Promise<boolean> {
    try {
      const classHash = await this.provider.getClassHashAt(address);
      const isDeployed = classHash !== '0x0';
      return isDeployed;
    } catch {
      // Expected error for undeployed wallets - "Contract not found"
      // This is normal behavior, not an actual error
      return false;
    }
  }

  // Phase 5: Send tokens with deploy-on-first-transfer pattern
  async sendToken(
    fromWalletData: StarkNetWalletData,
    toAddress: string,
    tokenAddress: string,
    amount: string,
    decimals: number = 18
  ): Promise<TransactionResult> {
    try {
      console.log('Sending token transaction...');
      console.log('From:', fromWalletData.address);
      console.log('To:', toAddress);
      console.log('Token:', tokenAddress);
      console.log('Amount:', amount);
      console.log('Decimals:', decimals);
      
      // Create account instance
      const account = new Account(this.provider, fromWalletData.address, fromWalletData.privateKey);
      
      // Check if wallet is deployed
      const isDeployed = await this.isWalletDeployed(fromWalletData.address);
      
      if (!isDeployed) {
        console.log('Wallet not deployed, deploying first...');
        const deployResult = await this.deployWallet(fromWalletData);
        if (!deployResult.success) {
          return {
            success: false,
            error: `Failed to deploy wallet: ${deployResult.error}`
          };
        }
        console.log('Wallet deployed successfully');
      } else {
        console.log('Wallet already deployed');
      }
      
      // Convert amount to uint256 format
      const amountInWei = BigInt(parseFloat(amount) * (10 ** decimals));
      const amountUint256 = {
        low: amountInWei & ((1n << 128n) - 1n),
        high: amountInWei >> 128n
      };
      
      console.log('Amount in wei:', amountInWei.toString());
      console.log('Amount uint256:', amountUint256);
      
      // Prepare transfer calldata
      const transferCalldata = CallData.compile({
        recipient: toAddress,
        amount: amountUint256
      });
      
      console.log('Transfer calldata:', transferCalldata);
      
      // Execute transfer transaction
      const result = await account.execute(
        [
          {
            contractAddress: tokenAddress,
            entrypoint: "transfer",
            calldata: transferCalldata,
          },
        ]
      );
      
      const transaction_hash = result.transaction_hash;
      
      console.log('Transaction sent with hash:', transaction_hash);
      
      // Wait for transaction confirmation
      await this.provider.waitForTransaction(transaction_hash);
      console.log('Transaction confirmed');
      
      return {
        success: true,
        transactionHash: transaction_hash
      };
    } catch (error) {
      console.error('Error sending transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transaction error'
      };
    }
  }


  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<'pending' | 'accepted' | 'rejected'> {
    try {
      // TODO: Implement actual status check when starknet.js is available
      // const receipt = await this.provider.getTransactionReceipt(txHash);
      // return receipt.status;
      
      // Mock status for now
      const statuses: ('pending' | 'accepted' | 'rejected')[] = ['pending', 'accepted', 'rejected'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'rejected';
    }
  }

  // Switch network
  async switchNetwork(network: 'mainnet' | 'sepolia') {
    await NetworkConfigService.switchNetwork(network);
    this.initializeProvider();
    console.log('Switched to', network);
  }

  // Get current network
  getNetwork(): 'mainnet' | 'sepolia' {
    return NetworkConfigService.getCurrentNetwork();
  }

  /**
   * Refresh network configuration (call when network changes)
   */
  refreshNetworkConfig() {
    this.initializeProvider();
  }

  // Helper method to format token amounts
  private formatTokenAmount(balance: string, decimals: number): string {
    try {
      const balanceNum = BigInt(balance);
      const divisor = BigInt(10 ** decimals);
      
      // Calculate integer and fractional parts
      const integerPart = balanceNum / divisor;
      const fractionalPart = balanceNum % divisor;
      
      // Convert to decimal string
      if (fractionalPart === 0n) {
        return integerPart.toString() + '.0';
      }
      
      // Format fractional part with proper decimal places
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');
      
      if (trimmedFractional === '') {
        return integerPart.toString() + '.0';
      }
      
      return `${integerPart.toString()}.${trimmedFractional}`;
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0.0';
    }
  }

  /**
   * Process utility payment via Spark Payment Processor contract
   */
  async processUtilityPayment(
    walletData: StarkNetWalletData,
    amount: number,
    utilityType: string,
    transactionId: string,
    paymentToken?: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('=== PROCESSING UTILITY PAYMENT ===');
      console.log('Amount:', amount);
      console.log('Utility Type:', utilityType);
      console.log('Transaction ID:', transactionId);

      // Create account instance
      const account = new Account(this.provider, walletData.address, walletData.privateKey);

      // Check if wallet is deployed
      const isDeployed = await this.isWalletDeployed(walletData.address);
      if (!isDeployed) {
        console.log('Wallet not deployed, deploying first...');
        const deployResult = await this.deployWallet(walletData);
        if (!deployResult.success) {
          return {
            success: false,
            error: `Failed to deploy wallet: ${deployResult.error}`
          };
        }
      }

      // Get network-specific configuration
      const currentNetwork = NetworkConfigService.getCurrentNetwork();
      const tokenToUse = paymentToken || (currentNetwork === 'sepolia' ? 'STRK' : 'USDC');
      
      // Use network-specific payment processor contract address
      const processorAddress = NetworkConfigService.getContractAddresses().paymentProcessor;
      
      console.log('=== SPARK PAYMENT PROCESSOR ===');
      console.log(`Processing ${tokenToUse} token payment for utility bill on ${currentNetwork}`);
      console.log(`Amount: ${amount} ${tokenToUse}`);
      console.log(`Utility Type: ${utilityType}`);
      console.log(`Transaction ID: ${transactionId}`);
      console.log(`Contract Address: ${processorAddress}`);
      
      // Check token balance before attempting payment
      const balances = await this.getTokenBalances(walletData.address);
      const paymentTokenBalance = balances.find(token => token.symbol === tokenToUse);
      const tokenBalance = paymentTokenBalance?.balanceFormatted || '0';
      console.log(`Current ${tokenToUse} balance: ${tokenBalance}`);
      console.log(`Required ${tokenToUse} amount: ${amount}`);
      
      if (parseFloat(tokenBalance) < amount) {
        return {
          success: false,
          error: `Insufficient ${tokenToUse} balance. Required: ${amount} ${tokenToUse}, Available: ${tokenBalance} ${tokenToUse}. Please add ${tokenToUse} tokens to your wallet.`
        };
      }
      
      // Convert amount to uint256 format (STRK has 18 decimals, USDC has 6 decimals)
      const decimals = tokenToUse === 'STRK' ? 18 : 6;
      const amountInUnits = BigInt(Math.floor(amount * Math.pow(10, decimals)));
      const amountUint256 = {
        low: amountInUnits & ((1n << 128n) - 1n),
        high: amountInUnits >> 128n
      };

      // Get the token address for the payment token
      const tokenAddresses = NetworkConfigService.getTokenAddresses();
      const paymentTokenAddress = tokenAddresses[tokenToUse as keyof typeof tokenAddresses];
      
      // Approve payment processor to spend tokens
      const approveCalldata = CallData.compile({
        spender: processorAddress,
        amount: amountUint256
      });

      console.log(`Approving ${tokenToUse} token spending...`);
      const approveResult = await account.execute({
        contractAddress: paymentTokenAddress,
        entrypoint: 'approve',
        calldata: approveCalldata
      });

      console.log('Approve transaction result:', approveResult);
      await this.provider.waitForTransaction(approveResult.transaction_hash);

      // Now execute the utility payment
      const paymentCalldata = CallData.compile({
        amount: amountUint256,
        utility_type: utilityType,
        transaction_id: transactionId
      });

      console.log('Payment calldata:', paymentCalldata);
      console.log('Transaction ID:', transactionId);

      // Execute utility payment transaction
      const result = await account.execute({
        contractAddress: processorAddress,
        entrypoint: 'pay_utility',
        calldata: paymentCalldata
      });

      console.log('Payment transaction result:', result);
      await this.provider.waitForTransaction(result.transaction_hash);

      return {
        success: true,
        transactionHash: result.transaction_hash
      };

    } catch (error) {
      console.error('Utility payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default StarkNetWalletService.getInstance();
