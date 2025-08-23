/**
 * AutoSwapper Service for Spark Wallet
 * Integrates with AutoSwapper SDK for token swapping on StarkNet
 */

import { RpcProvider, Contract, CallData, Account, cairo } from 'starknet';
import NetworkConfigService from './NetworkConfigService';

// Import AutoSwap SDK (uncomment when package is installed)
// import { AutoswapClient } from 'autoswap-sdk';)
// Note: Temporarily commented out until SDK is properly installed
// import { AutoswapClient } from 'autoswap-sdk';

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number; // in basis points (e.g., 50 = 0.5%)
  recipient?: string;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  amountOut?: string;
}

class AutoSwapperService {
  private static instance: AutoSwapperService;
  private provider!: RpcProvider;
  // private autoswapClient!: AutoswapClient; // Uncomment when SDK is installed
  
  // Network-specific addresses will be loaded from NetworkConfigService

  // AutoSwapper ABI - Basic functions for swapping
  private readonly AUTOSWAPPER_ABI = [
    {
      "type": "function",
      "name": "swap_exact_tokens_for_tokens",
      "inputs": [
        { "name": "amount_in", "type": "core::integer::u256" },
        { "name": "amount_out_min", "type": "core::integer::u256" },
        { "name": "path", "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>" },
        { "name": "to", "type": "core::starknet::contract_address::ContractAddress" },
        { "name": "deadline", "type": "core::integer::u64" }
      ],
      "outputs": [
        { "type": "core::array::Array::<core::integer::u256>" }
      ],
      "state_mutability": "external"
    },
    {
      "type": "function",
      "name": "get_amounts_out",
      "inputs": [
        { "name": "amount_in", "type": "core::integer::u256" },
        { "name": "path", "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>" }
      ],
      "outputs": [
        { "type": "core::array::Array::<core::integer::u256>" }
      ],
      "state_mutability": "view"
    }
  ];

  private constructor() {
    this.initializeProvider();
    
    // Initialize AutoSwap SDK client (uncomment when SDK is installed)
    // this.autoswapClient = new AutoswapClient({ 
    //   apiKey: process.env.EXPO_PUBLIC_AUTOSWAP_API_KEY || process.env.AUTOSWAP_API_KEY || ''
    // });
  }

  private initializeProvider() {
    const rpcUrl = NetworkConfigService.getRpcUrl();
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
  }

  private getAutoswapperAddress(): string {
    return NetworkConfigService.getContractAddresses().autoswapper;
  }

  private getTokenAddresses() {
    return NetworkConfigService.getTokenAddresses();
  }

  /**
   * Refresh network configuration (call when network changes)
   */
  refreshNetworkConfig() {
    this.initializeProvider();
  }

  static getInstance(): AutoSwapperService {
    if (!AutoSwapperService.instance) {
      AutoSwapperService.instance = new AutoSwapperService();
    }
    return AutoSwapperService.instance;
  }

  /**
   * Create payment using AutoSwap SDK
   * This is the new SDK-based payment method
   */
  async createPayment(amount: number, currency: string, recipient: string): Promise<{ paymentUrl: string; transactionId: string }> {
    try {
      console.log('AutoSwap SDK: Creating payment', { amount, currency, recipient });
      
      // TODO: Uncomment when SDK is properly installed
      // const tx = await this.autoswapClient.createPayment({
      //   amount,
      //   currency,
      //   recipient
      // });
      // return { paymentUrl: tx.paymentUrl, transactionId: tx.id };
      
      // Temporary fallback - remove when SDK is working
      throw new Error('AutoSwap SDK not yet configured. Please install autoswap-sdk and configure API key.');
      
    } catch (error) {
      console.error('AutoSwap SDK: Failed to create payment:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get swap quote for token pair
   */
  async getSwapQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      console.log('AutoSwapper: Getting quote for swap', params);

      // Create contract instance
      const contract = new Contract(this.AUTOSWAPPER_ABI, this.getAutoswapperAddress(), this.provider);

      // Convert amount to proper format based on token decimals
      const fromTokenDecimals = this.getTokenDecimals(params.fromToken);
      const toTokenDecimals = this.getTokenDecimals(params.toToken);
      
      const amountIn = this.parseTokenAmount(params.amount, fromTokenDecimals);
      const path = [params.fromToken, params.toToken];

      // Get amounts out from AutoSwapper
      const amountsOut = await contract.get_amounts_out(amountIn, path);
      const amountOut = amountsOut[amountsOut.length - 1];

      // Calculate minimum received with slippage
      const slippageMultiplier = (10000 - params.slippage) / 10000;
      const minimumReceived = BigInt(Math.floor(Number(amountOut) * slippageMultiplier));

      // Format amounts for display
      const fromAmountFormatted = this.formatTokenAmount(amountIn.toString(), fromTokenDecimals);
      const toAmountFormatted = this.formatTokenAmount(amountOut.toString(), toTokenDecimals);
      const minimumReceivedFormatted = this.formatTokenAmount(minimumReceived.toString(), toTokenDecimals);

      // Calculate price impact (simplified)
      const priceImpact = 0.1; // This would need proper calculation based on pool reserves

      return {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: fromAmountFormatted,
        toAmount: toAmountFormatted,
        priceImpact,
        minimumReceived: minimumReceivedFormatted,
        route: path
      };

    } catch (error) {
      console.error('AutoSwapper: Failed to get quote:', error);
      throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute token swap
   */
  async executeSwap(walletData: any, params: SwapParams): Promise<SwapResult> {
    try {
      console.log('AutoSwapper: Executing swap', params);

      // Create account instance
      const account = new Account(this.provider, walletData.address, walletData.privateKey);

      // Get quote first to determine amounts
      const quote = await this.getSwapQuote(params);
      
      const fromTokenDecimals = this.getTokenDecimals(params.fromToken);
      const toTokenDecimals = this.getTokenDecimals(params.toToken);
      
      const amountIn = this.parseTokenAmount(params.amount, fromTokenDecimals);
      const amountOutMin = this.parseTokenAmount(quote.minimumReceived, toTokenDecimals);
      
      const path = [params.fromToken, params.toToken];
      const recipient = params.recipient || walletData.address;
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now

      // First, approve AutoSwapper to spend the from token
      console.log('AutoSwapper: Approving token spending...');
      const approveCalldata = CallData.compile({
        contract_address: this.getAutoswapperAddress(),
        amount: cairo.uint256(amountIn)
      });

      const approveResult = await account.execute({
        contractAddress: params.fromToken,
        entrypoint: 'approve',
        calldata: approveCalldata
      });

      console.log('AutoSwapper: Approve transaction:', approveResult.transaction_hash);
      await this.provider.waitForTransaction(approveResult.transaction_hash);

      // Execute the swap
      console.log('AutoSwapper: Executing swap transaction...');
      const swapCalldata = CallData.compile({
        amount_in: cairo.uint256(amountIn),
        amount_out_min: cairo.uint256(amountOutMin),
        path: path,
        to: recipient,
        deadline: deadline
      });

      const swapResult = await account.execute({
        contractAddress: this.getAutoswapperAddress(),
        entrypoint: 'swap_exact_tokens_for_tokens',
        calldata: swapCalldata
      });

      console.log('AutoSwapper: Swap transaction:', swapResult.transaction_hash);
      await this.provider.waitForTransaction(swapResult.transaction_hash);

      return {
        success: true,
        transactionHash: swapResult.transaction_hash,
        amountOut: quote.toAmount
      };

    } catch (error) {
      console.error('AutoSwapper: Swap execution failed:', error);
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
