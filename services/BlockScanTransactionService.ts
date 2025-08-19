import { RpcProvider } from 'starknet';

export interface BlockScanTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  type: 'sent' | 'received' | 'swapped' | 'deployed' | 'contract_call';
  senderAddress: string;
  contractAddress?: string;
  calldata?: string[];
  maxFee: string;
  version: string;
  nonce?: string;
  status: 'success' | 'failed' | 'pending';
  // Token transfer details
  tokenSymbol?: string;
  tokenAddress?: string;
  amount?: string;
  fromAddress?: string;
  toAddress?: string;
}

export interface PaginationState {
  currentBlock: number;
  transactionsFound: number;
  isComplete: boolean;
  lastScannedBlock: number;
}

export class BlockScanTransactionService {
  private provider: RpcProvider;
  private readonly TRANSACTIONS_PER_PAGE = 6;
  private readonly MAX_BLOCKS_PER_SCAN = 50; // Limit blocks per scan to avoid timeouts
  
  // Token contracts for parsing transfers
  private readonly TOKEN_CONTRACTS = {
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': { symbol: 'ETH', decimals: 18 },
    '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d': { symbol: 'STRK', decimals: 18 },
    '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080': { symbol: 'USDC', decimals: 6 }
  };
  
  // Function selectors for common operations
  private readonly FUNCTION_SELECTORS = {
    TRANSFER: '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
    APPROVE: '0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c',
    SWAP: '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e'
  };
  
  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8'
    });
  }

  /**
   * Get initial transactions (first page)
   */
  async getInitialTransactions(accountAddress: string): Promise<{
    transactions: BlockScanTransaction[];
    pagination: PaginationState;
  }> {
    const latestBlock = await this.provider.getBlock('latest');
    
    const pagination: PaginationState = {
      currentBlock: latestBlock.block_number,
      transactionsFound: 0,
      isComplete: false,
      lastScannedBlock: latestBlock.block_number
    };

    const transactions = await this.scanForTransactions(accountAddress, pagination);
    
    return {
      transactions,
      pagination
    };
  }

  /**
   * Load more transactions (next page)
   */
  async loadMoreTransactions(
    accountAddress: string, 
    currentPagination: PaginationState
  ): Promise<{
    transactions: BlockScanTransaction[];
    pagination: PaginationState;
  }> {
    if (currentPagination.isComplete) {
      return {
        transactions: [],
        pagination: currentPagination
      };
    }

    const newPagination: PaginationState = {
      ...currentPagination,
      transactionsFound: 0 // Reset for this scan
    };

    const transactions = await this.scanForTransactions(accountAddress, newPagination);
    
    return {
      transactions,
      pagination: newPagination
    };
  }

  /**
   * Scan blocks for transactions involving the account
   */
  private async scanForTransactions(
    accountAddress: string,
    pagination: PaginationState
  ): Promise<BlockScanTransaction[]> {
    const transactions: BlockScanTransaction[] = [];
    const normalizedAccountAddress = this.normalizeAddress(accountAddress);
    let blocksScanned = 0;

    try {
      while (
        transactions.length < this.TRANSACTIONS_PER_PAGE && 
        pagination.currentBlock >= 0 &&
        blocksScanned < this.MAX_BLOCKS_PER_SCAN
      ) {
        try {
          console.log(`Scanning block ${pagination.currentBlock}...`);
          
          // Get block with transactions
          const blk = await this.provider.getBlockWithTxs(pagination.currentBlock);
          
          if (blk.transactions && blk.transactions.length > 0) {
            // Process transactions in reverse order (newest first within block)
            for (let i = blk.transactions.length - 1; i >= 0; i--) {
              const tx = blk.transactions[i];
              
              if (this.isAccountTransaction(tx, normalizedAccountAddress)) {
                const parsedTx = await this.parseTransaction(tx, pagination.currentBlock, normalizedAccountAddress);
                if (parsedTx) {
                  transactions.push(parsedTx);
                  pagination.transactionsFound++;
                  
                  // Stop if we have enough transactions for this page
                  if (transactions.length >= this.TRANSACTIONS_PER_PAGE) {
                    break;
                  }
                }
              }
            }
          }
          
          pagination.currentBlock--;
          pagination.lastScannedBlock = pagination.currentBlock;
          blocksScanned++;
          
          // Add small delay to avoid overwhelming the RPC
          if (blocksScanned % 10 === 0) {
            await this.delay(100);
          }
          
        } catch (blockError) {
          console.warn(`Error scanning block ${pagination.currentBlock}:`, blockError);
          pagination.currentBlock--;
          blocksScanned++;
          continue;
        }
      }
      
      // Mark as complete if we've reached block 0 or scanned max blocks without finding enough
      if (pagination.currentBlock < 0) {
        pagination.isComplete = true;
      }
      
    } catch (error) {
      console.error('Error during block scanning:', error);
    }

    console.log(`Scan complete: Found ${transactions.length} transactions in ${blocksScanned} blocks`);
    return transactions;
  }

  /**
   * Check if transaction involves the account
   */
  private isAccountTransaction(tx: any, normalizedAccountAddress: string): boolean {
    // Check sender address
    if (tx.sender_address) {
      const normalizedSender = this.normalizeAddress(tx.sender_address);
      if (normalizedSender === normalizedAccountAddress) {
        return true;
      }
    }

    // For deploy_account transactions, check contract address
    if (tx.type === 'DEPLOY_ACCOUNT' && tx.contract_address) {
      const normalizedContract = this.normalizeAddress(tx.contract_address);
      if (normalizedContract === normalizedAccountAddress) {
        return true;
      }
    }

    // For invoke transactions, check calldata for transfers involving the account
    if (tx.type === 'INVOKE' && tx.calldata) {
      try {
        const calldata = Array.isArray(tx.calldata) ? tx.calldata : [];
        for (const data of calldata) {
          const normalizedData = this.normalizeAddress(data);
          if (normalizedData === normalizedAccountAddress) {
            return true;
          }
        }
      } catch (error) {
        // Ignore calldata parsing errors
      }
    }

    return false;
  }

  /**
   * Parse transaction into our format with token transfer detection
   */
  private async parseTransaction(
    tx: any, 
    blockNumber: number,
    walletAddress: string
  ): Promise<BlockScanTransaction | null> {
    try {
      // Get transaction receipt for status
      let status: 'success' | 'failed' | 'pending' = 'pending';
      try {
        const receipt = await this.provider.getTransactionReceipt(tx.transaction_hash);
        status = (receipt as any).execution_status === 'SUCCEEDED' ? 'success' : 'failed';
      } catch {
        // If receipt not found, transaction might be pending
        status = 'pending';
      }

      // Parse token transfer details from calldata
      const transferDetails = this.parseTokenTransfer(tx, walletAddress);
      
      return {
        hash: tx.transaction_hash,
        blockNumber,
        timestamp: Date.now() - (blockNumber * 30 * 1000), // Rough timestamp estimation
        type: this.determineTransactionType(tx, walletAddress, transferDetails),
        senderAddress: tx.sender_address || tx.contract_address || '0x0',
        contractAddress: tx.contract_address,
        calldata: tx.calldata,
        maxFee: tx.max_fee || '0',
        version: tx.version || '0',
        nonce: tx.nonce,
        status,
        ...transferDetails
      };
    } catch {
      console.error('Error parsing transaction');
      return null;
    }
  }

  /**
   * Parse token transfer details from transaction calldata
   */
  private parseTokenTransfer(tx: any, walletAddress: string): {
    tokenSymbol?: string;
    tokenAddress?: string;
    amount?: string;
    fromAddress?: string;
    toAddress?: string;
  } {
    if (!tx.calldata || !Array.isArray(tx.calldata) || tx.calldata.length < 4) {
      return {};
    }

    try {
      // Check if this is a token contract call
      const contractAddress = tx.calldata[0];
      const functionSelector = tx.calldata[1];
      
      const tokenInfo = this.TOKEN_CONTRACTS[contractAddress as keyof typeof this.TOKEN_CONTRACTS];
      if (!tokenInfo) {
        return {};
      }

      // Parse transfer function call
      if (functionSelector === this.FUNCTION_SELECTORS.TRANSFER && tx.calldata.length >= 5) {
        const toAddress = tx.calldata[2];
        const amountLow = BigInt(tx.calldata[3] || '0');
        const amountHigh = BigInt(tx.calldata[4] || '0');
        const amount = amountLow + (amountHigh << 128n);
        
        const formattedAmount = this.formatTokenAmount(amount, tokenInfo.decimals);
        
        return {
          tokenSymbol: tokenInfo.symbol,
          tokenAddress: contractAddress,
          amount: formattedAmount,
          fromAddress: tx.sender_address,
          toAddress: toAddress
        };
      }
    } catch (error) {
      console.warn('Error parsing token transfer:', error);
    }

    return {};
  }

  /**
   * Determine transaction type based on context
   */
  private determineTransactionType(
    tx: any, 
    walletAddress: string, 
    transferDetails: any
  ): 'sent' | 'received' | 'swapped' | 'deployed' | 'contract_call' {
    const txType = tx.type?.toUpperCase();
    
    if (txType === 'DEPLOY_ACCOUNT') {
      return 'deployed';
    }
    
    // If we have token transfer details
    if (transferDetails.tokenSymbol && transferDetails.amount) {
      const normalizedWallet = this.normalizeAddress(walletAddress);
      const normalizedFrom = this.normalizeAddress(transferDetails.fromAddress || '');
      const normalizedTo = this.normalizeAddress(transferDetails.toAddress || '');
      
      if (normalizedFrom === normalizedWallet) {
        return 'sent';
      } else if (normalizedTo === normalizedWallet) {
        return 'received';
      }
    }
    
    // Check for swap operations (simplified detection)
    if (tx.calldata && tx.calldata.length > 10) {
      return 'swapped';
    }
    
    return 'contract_call';
  }

  /**
   * Format token amount with proper decimals
   */
  private formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    if (fractionalPart === 0n) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
  }

  /**
   * Normalize address for comparison
   */
  private normalizeAddress(address: string): string {
    if (!address) return '';
    return address.toLowerCase().replace('0x', '').padStart(64, '0');
  }

  /**
   * Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get estimated blocks to scan for a time period
   */
  getEstimatedBlocksForPeriod(days: number): number {
    const secondsPerDay = 24 * 60 * 60;
    const avgBlockTime = 30; // ~30 seconds per block on StarkNet
    return Math.ceil((days * secondsPerDay) / avgBlockTime);
  }

  /**
   * Get scanning progress information
   */
  getScanProgress(pagination: PaginationState, latestBlock: number): {
    blocksScanned: number;
    totalBlocks: number;
    progressPercentage: number;
  } {
    const blocksScanned = latestBlock - pagination.lastScannedBlock;
    const totalBlocks = latestBlock;
    const progressPercentage = (blocksScanned / totalBlocks) * 100;

    return {
      blocksScanned,
      totalBlocks,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  }
}

// Export singleton instance
export const blockScanTransactionService = new BlockScanTransactionService();
