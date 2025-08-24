/**
 * AutoSwapper Service for Spark Wallet
 * Integrates with AutoSwapper SDK for token swapping on StarkNet
 */

import { AutoSwappr, TOKEN_ADDRESSES } from 'autoswap-sdk';
import NetworkConfigService from './NetworkConfigService';


export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  version?: string;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  amountOut?: string;
}

class AutoSwapperService {
  private static instance: AutoSwapperService;
  private autoswappr: AutoSwappr | null = null;

  private constructor() {
    // SDK will be initialized when needed with wallet data
  }

  private getAutoswapperAddress(): string {
    return NetworkConfigService.getContractAddresses().autoswapper;
  }

  private getTokenAddresses() {
    return NetworkConfigService.getTokenAddresses();
  }

  /**
   * Initialize AutoSwappr SDK with wallet data
   */
  private initializeSDK(walletData: any) {
    if (!this.autoswappr) {
      this.autoswappr = new AutoSwappr({
        contractAddress: this.getAutoswapperAddress(),
        rpcUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
        accountAddress: walletData.address,
        privateKey: walletData.privateKey
      });
    }
  }

  static getInstance(): AutoSwapperService {
    if (!AutoSwapperService.instance) {
      AutoSwapperService.instance = new AutoSwapperService();
    }
    return AutoSwapperService.instance;
  }



  /**
   * Execute token swap using AutoSwappr SDK
   */
  async executeSwap(walletData: any, params: SwapParams): Promise<SwapResult> {
    try {
      console.log('AutoSwapper SDK: Executing swap', params);

      // Initialize SDK with wallet data
      this.initializeSDK(walletData);

      if (!this.autoswappr) {
        throw new Error('Failed to initialize AutoSwappr SDK');
      }

      // Map our token addresses to SDK token addresses
      const fromTokenAddress = this.mapToSDKTokenAddress(params.fromToken);
      const toTokenAddress = this.mapToSDKTokenAddress(params.toToken);

      // Execute swap using SDK
      const result = await this.autoswappr.executeSwap(
        fromTokenAddress,
        toTokenAddress,
        {
          amount: params.amount,
        }
      );

      console.log('AutoSwapper SDK: Swap result:', result);

      return {
        success: true,
        transactionHash: result.result.transaction_hash,
        amountOut: params.amount // SDK doesn't return amount out, use input amount as placeholder
      };

    } catch (error) {
      console.error('AutoSwapper SDK: Swap execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get token decimals
   */
  private getTokenDecimals(tokenAddress: string): number {
    // Standard decimals for known tokens
    const tokenAddresses = this.getTokenAddresses();
    switch (tokenAddress.toLowerCase()) {
      case tokenAddresses.STRK.toLowerCase():
      case tokenAddresses.ETH.toLowerCase():
        return 18;
      case tokenAddresses.USDC.toLowerCase():
      case tokenAddresses.USDT.toLowerCase():
        return 6;
      default:
        return 18; // Default to 18 decimals
    }
  }

  /**
   * Parse token amount to BigInt with decimals
   */
  private parseTokenAmount(amount: string, decimals: number): bigint {
    const amountFloat = parseFloat(amount);
    const multiplier = BigInt(10 ** decimals);
    return BigInt(Math.floor(amountFloat * Number(multiplier)));
  }

  /**
   * Format token amount from BigInt to string with decimals
   */
  private formatTokenAmount(amount: string, decimals: number): string {
    const amountBigInt = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return wholePart.toString();
    }
    
    return `${wholePart}.${trimmedFractional}`;
  }

  /**
   * Map our token addresses to SDK token addresses
   */
  private mapToSDKTokenAddress(tokenAddress: string): string {
    const tokenAddresses = this.getTokenAddresses();
    
    // Map to SDK TOKEN_ADDRESSES constants
    if (tokenAddress.toLowerCase() === tokenAddresses.STRK.toLowerCase()) {
      return TOKEN_ADDRESSES.STRK;
    }
    if (tokenAddress.toLowerCase() === tokenAddresses.ETH.toLowerCase()) {
      return TOKEN_ADDRESSES.ETH;
    }
    if (tokenAddress.toLowerCase() === tokenAddresses.USDC.toLowerCase()) {
      return TOKEN_ADDRESSES.USDC;
    }
    if (tokenAddress.toLowerCase() === tokenAddresses.USDT.toLowerCase()) {
      return TOKEN_ADDRESSES.USDT;
    }
    
    // Fallback to original address if no mapping found
    return tokenAddress;
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens() {
    const tokenAddresses = this.getTokenAddresses();
    return [
      { address: tokenAddresses.STRK, symbol: 'STRK', name: 'StarkNet Token', decimals: 18 },
      { address: tokenAddresses.ETH, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: tokenAddresses.USDC, symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: tokenAddresses.USDT, symbol: 'USDT', name: 'Tether', decimals: 6 },
    ];
  }

  /**
   * Get token info by address
   */
  getTokenInfo(address: string) {
    return this.getSupportedTokens().find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    );
  }
}

export default AutoSwapperService.getInstance();
