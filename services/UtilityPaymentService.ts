/**
 * Utility Payment Service for Spark Wallet
 * Integrates VTpass API with Spark Payment Processor contract
 * Handles the complete flow: USDC payment -> VTpass service fulfillment
 */

import VTpassService, { VTpassConfig, VTPASS_SERVICES } from './VTpassService';
import VTpassConfigManager from './VTpassConfig';
import StarkNetWalletService from './StarkNetWalletService';
import { CurrencyService } from './CurrencyService';

export interface UtilityPaymentRequest {
  type: 'electricity' | 'airtime' | 'data' | 'tv';
  serviceProvider: string; // e.g., 'PHED', 'MTN', 'DSTV'
  accountNumber: string; // Meter number, phone number, smart card number
  amount: number; // Amount in NGN (Naira)
  customerPhone: string; // Customer contact number
  customerName?: string;
  variationCode?: string; // For data plans, TV packages, etc.
  meterType?: 'prepaid' | 'postpaid'; // For electricity only
  subscriptionType?: 'change' | 'renew'; // For TV subscriptions only
}

export interface UtilityPaymentResult {
  success: boolean;
  transactionHash?: string; // StarkNet transaction hash
  vtpassTransactionId?: string; // VTpass transaction ID
  token?: string; // For prepaid electricity
  error?: string;
  receipt?: {
    service: string;
    amount: number; // NGN amount
    strkAmount?: number; // STRK amount deducted
    exchangeRate?: number; // USD to NGN rate
    strkPrice?: number; // STRK to USD rate
    accountNumber: string;
    transactionDate: string;
    status: string;
  };
}

class UtilityPaymentService {
  private static instance: UtilityPaymentService;
  private vtpassService: VTpassService | null = null;

  static getInstance(): UtilityPaymentService {
    if (!UtilityPaymentService.instance) {
      UtilityPaymentService.instance = new UtilityPaymentService();
    }
    return UtilityPaymentService.instance;
  }

  /**
   * Initialize the service with VTpass configuration
   */
  initialize(config?: VTpassConfig): void {
    const vtpassConfig = config || VTpassConfigManager.getSandboxConfig();
    VTpassConfigManager.getInstance().initialize(vtpassConfig);
    this.vtpassService = new VTpassService(vtpassConfig);
    console.log('UtilityPaymentService initialized');
  }

  /**
   * Process utility payment - complete flow
   */
  async processUtilityPayment(
    walletData: any,
    request: UtilityPaymentRequest
  ): Promise<UtilityPaymentResult> {
    try {
      if (!this.vtpassService) {
        throw new Error('UtilityPaymentService not initialized');
      }

      console.log('Processing utility payment:', request);

      // Step 1: Validate request
      this.validatePaymentRequest(request);

      // Step 2: Verify service details with VTpass (skip for airtime and data)
      const serviceId = this.getServiceId(request);
      if (request.type === 'electricity' || request.type === 'tv') {
        await this.vtpassService.verifyService({
          serviceID: serviceId,
          billersCode: request.accountNumber,
          ...(request.meterType && { type: request.meterType })
        });
      } else {
        console.log(`VTpass: Skipping verification for ${request.type} - not required`);
      }

      // Step 3: Convert NGN amount to STRK tokens
      const currencyService = CurrencyService.getInstance();
      const conversion = await currencyService.convertNgnToStrk(request.amount);
      console.log(`Currency conversion: ₦${request.amount} = ${conversion.strkAmount} STRK`);

      // Step 4: Process STRK payment via Spark Payment Processor
      const requestId = VTpassService.generateRequestId();
      const paymentResult = await StarkNetWalletService.processUtilityPayment(
        walletData,
        conversion.strkAmount, // Use STRK amount instead of NGN
        this.getUtilityTypeCode(request.type),
        requestId
      );

      if (!paymentResult.success) {
        throw new Error(`STRK payment failed: ${paymentResult.error}`);
      }

      // Step 5: Fulfill service via VTpass API
      const vtpassResult = await this.fulfillVTpassService(request, requestId);

      // Step 5: Return combined result
      return {
        success: true,
        transactionHash: paymentResult.transactionHash,
        vtpassTransactionId: vtpassResult.content.transactions.transactionId,
        token: vtpassResult.purchased_code || undefined,
        receipt: {
          service: `${request.type.toUpperCase()} - ${request.serviceProvider}`,
          amount: request.amount, // NGN amount
          strkAmount: conversion.strkAmount, // STRK amount deducted
          exchangeRate: conversion.exchangeRate, // USD to NGN rate
          strkPrice: conversion.strkPrice, // STRK to USD rate
          accountNumber: request.accountNumber,
          transactionDate: new Date().toISOString(),
          status: 'completed'
        }
      };

    } catch (error) {
      console.error('Utility payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fulfill VTpass service based on payment type
   */
  private async fulfillVTpassService(request: UtilityPaymentRequest, requestId: string): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    // For TV, use default phone if not provided; for others, format the provided phone
    const phone = request.type === 'tv' ? 
      (request.customerPhone ? VTpassService.formatNigerianPhone(request.customerPhone) : '08000000000') :
      VTpassService.formatNigerianPhone(request.customerPhone);

    switch (request.type) {
      case 'electricity':
        return await this.vtpassService.payElectricityBill({
          serviceID: this.getServiceId(request),
          billersCode: request.accountNumber,
          variation_code: request.meterType || 'prepaid',
          amount: request.amount,
          phone: phone,
          request_id: requestId
        });

      case 'airtime':
        const airtimeRequestId = `SPARK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return await this.vtpassService.buyAirtime({
          serviceID: this.getServiceId(request),
          amount: request.amount,
          phone: request.accountNumber, // For airtime, account number is the phone
          request_id: airtimeRequestId
        });

      case 'data':
        if (!request.variationCode) {
          throw new Error('Data plan variation code is required');
        }
        return await this.vtpassService.buyData({
          serviceID: this.getServiceId(request),
          billersCode: request.accountNumber,
          variation_code: request.variationCode,
          amount: request.amount,
          phone: phone,
          request_id: requestId
        });

      case 'tv':
        if (!request.variationCode) {
          throw new Error('TV package variation code is required');
        }
        return await this.vtpassService.buyTVSubscription({
          serviceID: this.getServiceId(request),
          billersCode: request.accountNumber,
          variation_code: request.variationCode,
          amount: request.amount,
          phone: phone,
          request_id: requestId,
          subscription_type: request.subscriptionType || 'change' // Use user selection or default to 'change'
        });

      default:
        throw new Error(`Unsupported payment type: ${request.type}`);
    }
  }

  /**
   * Get VTpass service ID from request
   */
  private getServiceId(request: UtilityPaymentRequest): string {
    let provider = request.serviceProvider.toUpperCase();

    // For data services, extract network name from service ID (e.g., "mtn-data" -> "MTN")
    if (request.type === 'data' && provider.includes('-DATA')) {
      provider = provider.replace('-DATA', '');
    }

    switch (request.type) {
      case 'electricity':
        switch (provider) {
          case 'PHED': return VTPASS_SERVICES.ELECTRICITY.PHED;
          case 'IKEDC': return VTPASS_SERVICES.ELECTRICITY.IKEDC;
          case 'EKEDC': return VTPASS_SERVICES.ELECTRICITY.EKEDC;
          case 'KEDCO': return VTPASS_SERVICES.ELECTRICITY.KEDCO;
          case 'JOS': return VTPASS_SERVICES.ELECTRICITY.JOS_ELECTRIC;
          default: throw new Error(`Unsupported electricity provider: ${provider}`);
        }

      case 'airtime':
        switch (provider) {
          case 'MTN': return VTPASS_SERVICES.AIRTIME.MTN;
          case 'AIRTEL': return VTPASS_SERVICES.AIRTIME.AIRTEL;
          case 'GLO': return VTPASS_SERVICES.AIRTIME.GLO;
          case '9MOBILE': return VTPASS_SERVICES.AIRTIME.NINE_MOBILE;
          default: throw new Error(`Unsupported airtime provider: ${provider}`);
        }

      case 'data':
        switch (provider) {
          case 'MTN': return VTPASS_SERVICES.DATA.MTN;
          case 'AIRTEL': return VTPASS_SERVICES.DATA.AIRTEL;
          case 'GLO': return VTPASS_SERVICES.DATA.GLO;
          case '9MOBILE': return VTPASS_SERVICES.DATA.NINE_MOBILE;
          default: throw new Error(`Unsupported data provider: ${provider}`);
        }

      case 'tv':
        // Handle both service names and provider names
        if (provider.includes('DSTV') || provider === 'DSTV') return VTPASS_SERVICES.TV.DSTV;
        if (provider.includes('GOTV') || provider === 'GOTV') return VTPASS_SERVICES.TV.GOTV;
        if (provider.includes('STARTIMES') || provider === 'STARTIMES') return VTPASS_SERVICES.TV.STARTIMES;
        
        // Direct serviceID mapping (when serviceID is passed directly)
        if (provider === 'DSTV' || provider.toLowerCase() === 'dstv') return 'dstv';
        if (provider === 'GOTV' || provider.toLowerCase() === 'gotv') return 'gotv';
        if (provider === 'STARTIMES' || provider.toLowerCase() === 'startimes') return 'startimes';
        
        throw new Error(`Unsupported TV provider: ${provider}`);

      default:
        throw new Error(`Unsupported service type: ${request.type}`);
    }
  }

  /**
   * Get utility type code for Spark Payment Processor
   */
  private getUtilityTypeCode(type: string): string {
    const codes: Record<string, string> = {
      'electricity': '0x01',
      'airtime': '0x02',
      'data': '0x03',
      'tv': '0x04'
    };
    return codes[type] || '0x00';
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: UtilityPaymentRequest): void {
    if (!request.type || !request.serviceProvider || !request.accountNumber || !request.amount) {
      throw new Error('Missing required payment parameters');
    }

    // Phone number is optional for TV subscriptions
    if (request.type !== 'tv' && !request.customerPhone) {
      throw new Error('Customer phone number is required');
    }

    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Validate phone number only if provided
    if (request.customerPhone && !VTpassService.validateNigerianPhone(request.customerPhone)) {
      throw new Error('Invalid Nigerian phone number format');
    }

    // Type-specific validations
    if (request.type === 'electricity' && !request.meterType) {
      throw new Error('Meter type (prepaid/postpaid) is required for electricity payments');
    }

    if ((request.type === 'data' || request.type === 'tv') && !request.variationCode) {
      throw new Error(`Variation code is required for ${request.type} payments`);
    }
  }

  /**
   * Get available data plans for a network
   */
  async getDataPlans(network: string): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    const serviceId = this.getServiceId({
      type: 'data',
      serviceProvider: network,
      accountNumber: '',
      amount: 0,
      customerPhone: ''
    });

    return await this.vtpassService.getVariationCodes(serviceId);
  }

  /**
   * Get available services for a utility type from VTpass API
   */
  async getAvailableServices(utilityType: 'electricity' | 'airtime' | 'data' | 'tv'): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    try {
      const response = await this.vtpassService.getServices(utilityType);
      return response.content || [];
    } catch (error) {
      console.error(`Error fetching ${utilityType} services:`, error);
      throw error;
    }
  }

  /**
   * Get data variations for a specific service
   */
  async getDataVariations(serviceId: string) {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }
    
    return await this.vtpassService.getDataVariations(serviceId);
  }

  /**
   * Get available TV packages for a provider
   */
  async getTVPackages(provider: string): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    const serviceId = this.getServiceId({
      type: 'tv',
      serviceProvider: provider,
      accountNumber: '',
      amount: 0,
      customerPhone: ''
    });

    return await this.vtpassService.getServiceVariations(serviceId);
  }

  /**
   * Verify customer details before payment
   */
  async verifyCustomer(request: Omit<UtilityPaymentRequest, 'amount' | 'customerPhone'>): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    return await this.vtpassService.verifyService({
      serviceID: this.getServiceId({ ...request, amount: 0, customerPhone: '' }),
      billersCode: request.accountNumber,
      ...(request.meterType && { type: request.meterType })
    });
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(requestId: string): Promise<any> {
    if (!this.vtpassService) {
      throw new Error('VTpass service not initialized');
    }

    return await this.vtpassService.checkTransactionStatus(requestId);
  }
}

// Supported service providers
export const SUPPORTED_PROVIDERS = {
  ELECTRICITY: ['PHED', 'IKEDC', 'EKEDC', 'KEDCO', 'JOS'],
  AIRTIME: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'],
  DATA: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'],
  TV: ['DSTV', 'GOTV', 'STARTIMES']
};

export default UtilityPaymentService;
