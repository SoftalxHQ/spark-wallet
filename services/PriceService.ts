interface TokenPrices {
  ethereum?: { usd: number };
  starknet?: { usd: number };
  'usd-coin'?: { usd: number };
}

export class PriceService {
  private cache = new Map<string, any>();
  private lastFetch = 0;
  private CACHE_DURATION = 30000; // 30 seconds to respect rate limits

  private static readonly TOKEN_IDS = {
    ETH: 'ethereum',
    STRK: 'starknet',
    USDC: 'usd-coin',
  };

  async getTokenPrices(): Promise<TokenPrices> {
    // Check cache first to respect rate limits
    if (Date.now() - this.lastFetch < this.CACHE_DURATION && this.cache.has('prices')) {
      return this.cache.get('prices');
    }

    try {
      // Use CoinGecko's simple price endpoint
      const tokenIds = Object.values(PriceService.TOKEN_IDS).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const prices = await response.json();
      
      // Cache the result
      this.cache.set('prices', prices);
      this.lastFetch = Date.now();
      
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      
      // Return cached data if available, otherwise fallback to zeros
      if (this.cache.has('prices')) {
        return this.cache.get('prices');
      }
      
      // Fallback prices
      return {
        ethereum: { usd: 0 },
        starknet: { usd: 0 },
        'usd-coin': { usd: 0 },
      };
    }
  }

  async getTokenPrice(symbol: string): Promise<number> {
    const prices = await this.getTokenPrices();
    const tokenId = PriceService.TOKEN_IDS[symbol as keyof typeof PriceService.TOKEN_IDS];
    
    if (!tokenId || !prices[tokenId as keyof TokenPrices]) {
      return 0;
    }
    
    return prices[tokenId as keyof TokenPrices]?.usd || 0;
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

export default new PriceService();
