/**
 * Currency conversion service for NGN to USD rates and STRK token pricing
 */

import Constants from 'expo-constants';

export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
    NGN: number;
  };
}

export interface CoinGeckoResponse {
  starknet: {
    usd: number;
  };
}

export class CurrencyService {
  private static instance: CurrencyService;
  private cachedUsdToNgnRate: number | null = null;
  private cachedStrkToUsdRate: number | null = null;
  private lastRateUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Get current USD to NGN exchange rate
   */
  async getUsdToNgnRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.cachedUsdToNgnRate && (now - this.lastRateUpdate) < this.CACHE_DURATION) {
      return this.cachedUsdToNgnRate;
    }

    // Retry logic - attempt API call twice before falling back
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Currency: Attempt ${attempt}/2 to fetch exchange rate`);
        
        // Using exchangerate-api.com v6 with API key
        const apiKey = Constants.expoConfig?.extra?.EXCHANGE_RATE_API_KEY;
        console.log('Currency: API Key loaded:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT FOUND');
        
        const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
        console.log('Currency: Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Currency: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: ExchangeRateResponse = await response.json();
        
        if (data.result === 'success' && data.conversion_rates && data.conversion_rates.NGN) {
          this.cachedUsdToNgnRate = data.conversion_rates.NGN;
          this.lastRateUpdate = now;
          console.log(`Currency: USD to NGN rate updated: ${this.cachedUsdToNgnRate} (attempt ${attempt})`);
          return this.cachedUsdToNgnRate;
        }
        
        console.error('Currency: Invalid response structure:', {
          result: data.result,
          hasConversionRates: !!data.conversion_rates,
          hasNGN: data.conversion_rates ? !!data.conversion_rates.NGN : false
        });
        
        throw new Error(`Invalid exchange rate response: ${data.result || 'unknown error'}`);
      } catch (error) {
        console.error(`Currency: Attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, use fallback
        if (attempt === 2) {
          console.error('Currency: All attempts failed, using fallback rate');
          const fallbackRate = 1650; // Approximate USD to NGN rate
          console.log(`Currency: Using fallback USD to NGN rate: ${fallbackRate}`);
          return fallbackRate;
        }
        
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // This should never be reached, but just in case
    return 1650;
  }

  /**
   * Get current STRK token price in USD
   */
  async getStrkToUsdRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.cachedStrkToUsdRate && (now - this.lastRateUpdate) < this.CACHE_DURATION) {
      return this.cachedStrkToUsdRate;
    }

    try {
      // Using CoinGecko API (free tier)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd');
      const data: CoinGeckoResponse = await response.json();
      
      if (data.starknet && data.starknet.usd) {
        this.cachedStrkToUsdRate = data.starknet.usd;
        this.lastRateUpdate = now;
        console.log(`Currency: STRK to USD rate updated: $${this.cachedStrkToUsdRate}`);
        return this.cachedStrkToUsdRate;
      }
      
      throw new Error('Invalid STRK price response');
    } catch (error) {
      console.error('Currency: Failed to fetch STRK to USD rate:', error);
      
      // Fallback to approximate rate if API fails
      const fallbackRate = 0.50; // Approximate STRK to USD rate
      console.log(`Currency: Using fallback STRK to USD rate: $${fallbackRate}`);
      return fallbackRate;
    }
  }

  /**
   * Convert NGN amount to equivalent STRK tokens
   * Flow: NGN -> USD -> STRK
   */
  async convertNgnToStrk(ngnAmount: number): Promise<{
    strkAmount: number;
    usdAmount: number;
    exchangeRate: number;
    strkPrice: number;
  }> {
    try {
      console.log(`Currency: Converting ₦${ngnAmount} to STRK tokens`);
      
      // Get current exchange rates
      const [usdToNgnRate, strkToUsdRate] = await Promise.all([
        this.getUsdToNgnRate(),
        this.getStrkToUsdRate()
      ]);

      // Convert NGN to USD
      const usdAmount = ngnAmount / usdToNgnRate;
      
      // Convert USD to STRK tokens
      const strkAmount = usdAmount / strkToUsdRate;

      const result = {
        strkAmount: parseFloat(strkAmount.toFixed(6)), // 6 decimal places for precision
        usdAmount: parseFloat(usdAmount.toFixed(2)),
        exchangeRate: usdToNgnRate,
        strkPrice: strkToUsdRate
      };

      console.log(`Currency conversion result:`, result);
      return result;
      
    } catch (error) {
      console.error('Currency: Conversion error:', error);
      throw new Error(`Failed to convert NGN to STRK: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get formatted conversion display for UI
   */
  async getConversionDisplay(ngnAmount: number): Promise<string> {
    try {
      const conversion = await this.convertNgnToStrk(ngnAmount);
      return `₦${ngnAmount.toLocaleString()} ≈ $${conversion.usdAmount} ≈ ${conversion.strkAmount} STRK`;
    } catch {
      return `₦${ngnAmount.toLocaleString()} (conversion unavailable)`;
    }
  }

  /**
   * Clear cached rates (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cachedUsdToNgnRate = null;
    this.cachedStrkToUsdRate = null;
    this.lastRateUpdate = 0;
    console.log('Currency: Cache cleared');
  }
}
