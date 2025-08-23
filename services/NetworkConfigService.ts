/**
 * Network Configuration Service for Spark Wallet
 * Manages network switching between Mainnet and Sepolia testnet
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type NetworkType = 'mainnet' | 'sepolia';

export interface NetworkConfig {
  name: string;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId: string;
  tokens: {
    STRK: string;
    ETH: string;
    USDC: string;
    USDT: string;
  };
  contracts: {
    autoswapper: string;
  };
  accountClassHash: string;
}

class NetworkConfigService {
  private static instance: NetworkConfigService;
  private currentNetwork: NetworkType = 'mainnet'; // Default to mainnet
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  private readonly STORAGE_KEY = 'spark_wallet_network';
  
  private readonly NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
    mainnet: {
      name: 'mainnet',
      displayName: 'StarkNet Mainnet',
      rpcUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8',
      explorerUrl: 'https://voyager.online',
      chainId: '0x534e5f4d41494e',
      tokens: {
        STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
        USDT: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
      },
      contracts: {
        autoswapper: '0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b', // Update with mainnet address
      },
      accountClassHash: '0x0320a6a6e7f7b7cbc6fd794a35754146bb4d0d5aef1d366842c1d59b813a8ec7' // Mainnet account class hash
    },
    sepolia: {
      name: 'sepolia',
      displayName: 'StarkNet Sepolia',
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
      explorerUrl: 'https://sepolia.voyager.online',
      chainId: '0x534e5f5345504f4c4941',
      tokens: {
        STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
        ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        USDC: '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080',
        USDT: '0x02ab8758891e84b968ff11361789070c6b1af2df618d6d2f4a78b0757573c6eb',
      },
      contracts: {
        autoswapper: '0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b',
      },
      accountClassHash: '0x0320a6a6e7f7b7cbc6fd794a35754146bb4d0d5aef1d366842c1d59b813a8ec7' // Sepolia account class hash
    }
  };

  private constructor() {
    // Don't call loadSavedNetwork here - it will be called via initialize()
  }

  static getInstance(): NetworkConfigService {
    if (!NetworkConfigService.instance) {
      NetworkConfigService.instance = new NetworkConfigService();
    }
    return NetworkConfigService.instance;
  }

  /**
   * Initialize the network configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.loadSavedNetwork();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  /**
   * Load saved network from storage
   */
  private async loadSavedNetwork(): Promise<void> {
    try {
      console.log('NetworkConfigService: Loading saved network from storage...');
      const savedNetwork = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedNetwork && (savedNetwork === 'mainnet' || savedNetwork === 'sepolia')) {
        this.currentNetwork = savedNetwork as NetworkType;
        console.log('NetworkConfigService: Loaded network:', this.currentNetwork);
      } else {
        console.log('NetworkConfigService: No saved network found, using default:', this.currentNetwork);
      }
    } catch (error) {
      console.error('Failed to load saved network:', error);
    }
  }

  /**
   * Get current network configuration
   */
  getCurrentNetwork(): NetworkType {
    return this.currentNetwork;
  }

  /**
   * Get current network config
   */
  getCurrentConfig(): NetworkConfig {
    return this.NETWORK_CONFIGS[this.currentNetwork];
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(): { value: NetworkType; label: string }[] {
    return [
      { value: 'mainnet', label: 'Mainnet' },
      { value: 'sepolia', label: 'Sepolia' }
    ];
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(network: NetworkType): Promise<void> {
    try {
      this.currentNetwork = network;
      await AsyncStorage.setItem(this.STORAGE_KEY, network);
      console.log(`Switched to ${network} network`);
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw new Error('Failed to switch network');
    }
  }

  /**
   * Get RPC URL for current network
   */
  getRpcUrl(): string {
    return this.getCurrentConfig().rpcUrl;
  }

  /**
   * Get token addresses for current network
   */
  getTokenAddresses() {
    return this.getCurrentConfig().tokens;
  }

  /**
   * Get contract addresses for current network
   */
  getContractAddresses() {
    return this.getCurrentConfig().contracts;
  }

  /**
   * Get account class hash for current network
   */
  getAccountClassHash(): string {
    return this.getCurrentConfig().accountClassHash;
  }

  /**
   * Get explorer URL for current network
   */
  getExplorerUrl(): string {
    return this.getCurrentConfig().explorerUrl;
  }

  /**
   * Get supported tokens with current network addresses
   */
  getSupportedTokens() {
    const tokens = this.getTokenAddresses();
    return [
      { address: tokens.STRK, symbol: 'STRK', name: 'StarkNet Token', decimals: 18 },
      { address: tokens.ETH, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: tokens.USDC, symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: tokens.USDT, symbol: 'USDT', name: 'Tether', decimals: 6 },
    ];
  }
}

export default NetworkConfigService.getInstance();
