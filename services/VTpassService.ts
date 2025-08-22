/**
 * VTpass API Service for Spark Wallet
 * Handles utility payments, airtime, data, and TV subscriptions
 * Uses sandbox environment for testing
 */

export interface VTpassConfig {
  apiKey: string;
  publicKey: string;
  secretKey: string;
  environment: 'sandbox' | 'live';
}

export interface ElectricityPaymentRequest {
  serviceID: string; // e.g., 'phed', 'ikedc', 'ekedc', 'kedco', 'jos-electric'
  billersCode: string; // Meter number
  variation_code: string; // 'prepaid' or 'postpaid'
  amount: number;
  phone: string; // Customer phone number
  request_id: string; // Unique transaction ID
}

export interface AirtimeRequest {
  serviceID: string; // 'mtn', 'airtel', 'glo', '9mobile'
  amount: number;
  phone: string;
  request_id: string;
}

export interface DataVariation {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

export interface DataVariationsResponse {
  response_description: string;
  content: {
    ServiceName: string;
    serviceID: string;
    convinience_fee: string;
    variations: DataVariation[];
  };
}

export interface DataRequest {
  serviceID: string; // 'mtn-data', 'airtel-data', 'glo-data', '9mobile-data'
  billersCode: string; // Phone number
  variation_code: string; // Data plan variation code
  amount: number; // Amount in NGN (ignored by VTpass, determined by variation)
  phone: string; // Customer contact number
  request_id: string;
}

export interface TVSubscriptionRequest {
  serviceID: string; // 'dstv', 'gotv', 'startimes'
  billersCode: string; // Smart card number
  variation_code: string; // Package code
  amount: number;
  phone: string;
  request_id: string;
  subscription_type: string; // 'change' for new/bouquet change, 'renew' for renewal
}

export interface VTpassResponse {
  code: string;
  content: {
    transactions: {
      status: string;
      product_name: string;
      unique_element: string;
      unit_price: number;
      quantity: number;
      service_verification: any;
      channel: string;
      commission: number;
      total_amount: number;
      discount: any;
      type: string;
      email: string;
      phone: string;
      name: any;
      convinience_fee: string;
      amount: number;
      platform: string;
      method: string;
      transactionId: string;
    };
  };
  response_description: string;
  requestId: string;
  amount: string;
  transaction_date: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
  purchased_code: string;
}

export interface ServiceVerificationRequest {
  serviceID: string;
  billersCode: string;
  type?: string; // For electricity: 'prepaid' or 'postpaid'
}

export interface ServiceVerificationResponse {
  code: string;
  content: {
    Customer_Name: string;
    Status: string;
    Customer_Number: string;
    Due_Date?: string;
    Outstanding_Balance?: string;
    District?: string;
    Address?: string;
    Meter_Number?: string;
    Customer_Type?: string;
    Tariff?: string;
    Minimum_Purchase_Amount?: number;
  };
  response_description: string;
}

class VTpassService {
  private config: VTpassConfig;
  private baseUrl: string;

  constructor(config: VTpassConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://sandbox.vtpass.com/api/' 
      : 'https://vtpass.com/api/';
  }

  /**
   * Get authentication headers for GET requests
   */
  private getGetHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'api-key': this.config.apiKey,
      'public-key': this.config.publicKey,
    };
  }

  /**
   * Get authentication headers for POST requests
   */
  private getPostHeaders(): Record<string, string> {
    console.log('VTpass: Using credentials:', {
      apiKey: this.config.apiKey?.substring(0, 8) + '...',
      secretKey: this.config.secretKey?.substring(0, 8) + '...',
      environment: this.config.environment
    });
    
    return {
      'Content-Type': 'application/json',
      'api-key': this.config.apiKey,
      'secret-key': this.config.secretKey,
    };
  }

  /**
   * Verify service details before payment (e.g., meter number validation)
   */
  async verifyService(request: ServiceVerificationRequest): Promise<ServiceVerificationResponse> {
    try {
      const url = `${this.baseUrl}merchant-verify`;
      const payload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        ...(request.type && { type: request.type })
      };

      console.log('VTpass: Verifying service:', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('VTpass: Verification response:', data);

      if (!response.ok) {
        throw new Error(`Verification failed: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Service verification error:', error);
      throw error;
    }
  }

  /**
   * Pay electricity bill (prepaid or postpaid)
   */
  async payElectricityBill(request: ElectricityPaymentRequest): Promise<VTpassResponse> {
    try {
      console.log('VTpass: Processing electricity payment:', request);

      // First verify the meter number
      await this.verifyService({
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        type: request.variation_code
      });

      const url = `${this.baseUrl}pay`;
      const payload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        variation_code: request.variation_code,
        amount: request.amount,
        phone: request.phone,
        request_id: request.request_id,
      };

      console.log('VTpass: Electricity payment payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('VTpass: Electricity payment response:', data);

      if (!response.ok || data.code !== '000') {
        throw new Error(`Payment failed: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Electricity payment error:', error);
      throw error;
    }
  }

  /**
   * Buy airtime for any network
   * Note: Airtime purchases don't require verification
   */
  async buyAirtime(request: AirtimeRequest): Promise<VTpassResponse> {
    try {
      console.log('VTpass: Processing airtime purchase:', request);

      const url = `${this.baseUrl}pay`;
      const payload = {
        serviceID: request.serviceID,
        amount: request.amount,
        phone: request.phone,
        request_id: request.request_id,
      };

      console.log('VTpass: Airtime payload:', payload);
      console.log('VTpass: Request URL:', url);
      console.log('VTpass: Request headers:', this.getPostHeaders());

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('VTpass: Airtime response:', data);
      console.log('VTpass: Response status:', response.status);
      console.log('VTpass: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok || data.code !== '000') {
        console.error('VTpass: Detailed error info:', {
          status: response.status,
          statusText: response.statusText,
          responseCode: data.code,
          message: data.message,
          responseDescription: data.response_description
        });
        throw new Error(`Airtime purchase failed: ${data.message || data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Airtime purchase error:', error);
      throw error;
    }
  }

  /**
   * Get data bundle variations for any network
   */
  async getDataVariations(serviceID: string): Promise<DataVariationsResponse> {
    const url = `${this.baseUrl}service-variations?serviceID=${serviceID}`;
    
    try {
      console.log('VTpass: Fetching data variations from:', url);
      console.log('VTpass: Using credentials:', { 
        apiKey: this.config.apiKey?.substring(0, 8) + '...', 
        publicKey: this.config.publicKey?.substring(0, 8) + '...', 
        environment: this.config.environment 
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getGetHeaders()
      });

      console.log('VTpass: Data variations response status:', response.status);
      const data = await response.json();
      console.log('VTpass: Data variations response:', JSON.stringify(data, null, 2));

      if (!response.ok || data.response_description !== '000') {
        throw new Error(`Failed to get data variations: ${data.message || data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass get data variations error:', error);
      throw error;
    }
  }

  /**
   * Buy data bundle
   */
  async buyData(request: DataRequest): Promise<VTpassResponse> {
    try {
      console.log('VTpass: Processing data bundle purchase:', request);

      const url = `${this.baseUrl}pay`;
      const payload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        variation_code: request.variation_code,
        amount: request.amount, // This will be ignored by VTpass, variation determines price
        phone: request.phone,
        request_id: request.request_id,
      };

      console.log('VTpass: Data bundle payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('VTpass: Data bundle response:', data);

      if (!response.ok || data.code !== '000') {
        throw new Error(`Data purchase failed: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Data bundle purchase error:', error);
      throw error;
    }
  }

  /**
   * Buy TV subscription (DSTV, GOTV, Startimes)
   * Requires smartcard verification first
   */
  async buyTVSubscription(request: TVSubscriptionRequest): Promise<VTpassResponse> {
    try {
      console.log('VTpass: Processing TV subscription purchase:', request);

      // Step 1: Verify smartcard number first
      const verificationUrl = `${this.baseUrl}merchant-verify`;
      const verifyPayload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
      };

      console.log('VTpass: Verifying smartcard before purchase:', verifyPayload);
      console.log('VTpass: Using credentials:', {
        apiKey: this.config.apiKey.substring(0, 8) + '...',
        publicKey: this.config.publicKey.substring(0, 15) + '...',
        environment: this.config.environment
      });

      const verifyResponse = await fetch(verificationUrl, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await verifyResponse.json();
      console.log('VTpass: Smartcard verification response:', verifyData);

      if (!verifyResponse.ok || verifyData.code !== '000') {
        throw new Error(`Smartcard verification failed: ${verifyData.response_description || 'Invalid smartcard number'}`);
      }

      // Step 2: Proceed with payment
      const paymentUrl = `${this.baseUrl}pay`;
      const paymentPayload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        variation_code: request.variation_code,
        amount: request.amount,
        phone: request.phone,
        request_id: request.request_id,
        subscription_type: request.subscription_type,
      };

      console.log('VTpass: TV subscription payment payload:', paymentPayload);

      const paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();
      console.log('VTpass: TV subscription payment response:', paymentData);

      if (!paymentResponse.ok || paymentData.code !== '000') {
        throw new Error(`TV subscription payment failed: ${paymentData.response_description || paymentResponse.statusText}`);
      }

      return paymentData;
    } catch (error) {
      console.error('VTpass: TV subscription purchase error:', error);
      throw error;
    }
  }

  /**
   * Pay TV subscription (renewal) - includes smartcard verification
   * For existing subscriptions that need renewal
   */
  async payTVSubscription(request: TVSubscriptionRequest): Promise<VTpassResponse> {
    try {
      console.log('VTpass: Processing TV subscription payment:', request);

      // First verify the smartcard number
      const verificationUrl = `${this.baseUrl}merchant-verify`;
      const verifyPayload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
      };

      console.log('VTpass: Verifying smartcard:', verifyPayload);

      const verifyResponse = await fetch(verificationUrl, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await verifyResponse.json();
      console.log('VTpass: Smartcard verification response:', verifyData);

      if (!verifyResponse.ok || verifyData.code !== '000') {
        throw new Error(`Smartcard verification failed: ${verifyData.response_description || 'Invalid smartcard number'}`);
      }

      // Proceed with payment if verification successful
      const paymentUrl = `${this.baseUrl}pay`;
      const paymentPayload = {
        serviceID: request.serviceID,
        billersCode: request.billersCode,
        variation_code: request.variation_code,
        amount: request.amount,
        phone: request.phone,
        request_id: request.request_id,
        subscription_type: request.subscription_type,
      };

      console.log('VTpass: TV payment payload:', paymentPayload);

      const paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        headers: this.getPostHeaders(),
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();
      console.log('VTpass: TV payment response:', paymentData);

      if (!paymentResponse.ok || paymentData.code !== '000') {
        throw new Error(`TV subscription payment failed: ${paymentData.response_description || paymentResponse.statusText}`);
      }

      return paymentData;
    } catch (error) {
      console.error('VTpass: TV subscription payment error:', error);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(requestId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}requery`;
      const params = new URLSearchParams({ request_id: requestId });

      console.log('VTpass: Checking transaction status:', requestId);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getGetHeaders(),
      });

      const data = await response.json();
      console.log('VTpass: Transaction status response:', data);

      return data;
    } catch (error) {
      console.error('VTpass: Transaction status check error:', error);
      throw error;
    }
  }

  /**
   * Get available services by identifier (electricity, airtime, data, tv)
   */
  async getServices(identifier: string): Promise<any> {
    try {
      // TV services use a different endpoint pattern
      if (identifier === 'tv') {
        return await this.getTVServices();
      }

      const url = `${this.baseUrl}services`;
      const params = new URLSearchParams({ identifier });

      console.log('VTpass: Getting services for:', identifier);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getGetHeaders(),
      });

      const data = await response.json();
      console.log('VTpass: Services response:', data);

      if (!response.ok || data.response_description !== '000') {
        throw new Error(`Failed to fetch services: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Get services error:', error);
      throw error;
    }
  }

  /**
   * Get TV services (DSTV, GOTV, Startimes) with their variations
   */
  async getTVServices(): Promise<any> {
    try {
      console.log('VTpass: Getting TV services');

      // Get DSTV, GOTV, and Startimes services
      const tvProviders = ['dstv', 'gotv', 'startimes'];
      const services = [];

      for (const serviceID of tvProviders) {
        try {
          const variations = await this.getServiceVariations(serviceID);
          if (variations && variations.content) {
            services.push({
              serviceID: serviceID,
              name: variations.content.ServiceName || serviceID.toUpperCase(),
              image: null, // TV services don't have provider images in the same way
              variations: variations.content.variations || []
            });
          }
        } catch (error) {
          console.warn(`VTpass: Failed to fetch ${serviceID} variations:`, error);
        }
      }

      return {
        response_description: '000',
        content: services
      };
    } catch (error) {
      console.error('VTpass: Get TV services error:', error);
      throw error;
    }
  }

  /**
   * Get service variations for a specific service (used for TV services)
   */
  async getServiceVariations(serviceID: string): Promise<any> {
    try {
      const url = `${this.baseUrl}service-variations`;
      const params = new URLSearchParams({ serviceID });

      console.log('VTpass: Getting service variations for:', serviceID);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getGetHeaders(),
      });

      const data = await response.json();
      console.log('VTpass: Service variations response:', JSON.stringify(data, null, 2));

      if (!response.ok || data.response_description !== '000') {
        throw new Error(`Failed to fetch service variations: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Get service variations error:', error);
      throw error;
    }
  }

  /**
   * Get available variation codes for a service
   */
  async getVariationCodes(serviceId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}service-variations`;
      const params = new URLSearchParams({ serviceID: serviceId });

      console.log('VTpass: Getting variation codes for:', serviceId);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: this.getGetHeaders(),
      });

      const data = await response.json();
      console.log('VTpass: Variation codes response:', data);

      if (!response.ok || data.response_description !== '000') {
        throw new Error(`Failed to fetch variations: ${data.response_description || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('VTpass: Get variation codes error:', error);
      throw error;
    }
  }

  /**
   * Generate unique request ID for transactions
   */
  static generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `SPARK_${timestamp}_${random}`;
  }

  /**
   * Validate Nigerian phone number
   */
  static validateNigerianPhone(phone: string): boolean {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Nigerian number (11 digits starting with 0, or 10 digits without 0)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      return /^0[789][01]\d{8}$/.test(cleanPhone);
    } else if (cleanPhone.length === 10) {
      return /^[789][01]\d{8}$/.test(cleanPhone);
    }
    
    return false;
  }

  /**
   * Format Nigerian phone number to standard format
   */
  static formatNigerianPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return '0' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      return cleanPhone;
    }
    
    throw new Error('Invalid Nigerian phone number format');
  }
}

// Service ID constants for easy reference
export const VTPASS_SERVICES = {
  // Electricity
  ELECTRICITY: {
    PHED: 'phed',
    IKEDC: 'ikedc', 
    EKEDC: 'ekedc',
    KEDCO: 'kedco',
    JOS_ELECTRIC: 'jos-electric',
  },
  
  // Airtime
  AIRTIME: {
    MTN: 'mtn',
    AIRTEL: 'airtel',
    GLO: 'glo',
    NINE_MOBILE: '9mobile',
  },
  
  // Data
  DATA: {
    MTN: 'mtn-data',
    AIRTEL: 'airtel-data', 
    GLO: 'glo-data',
    NINE_MOBILE: '9mobile-data',
  },

  // Get all supported data service IDs
  getSupportedDataServices(): string[] {
    return Object.values(this.DATA);
  },
  
  // TV
  TV: {
    DSTV: 'dstv',
    GOTV: 'gotv',
    STARTIMES: 'startimes',
  },
  
  // Variation codes
  VARIATIONS: {
    ELECTRICITY: {
      PREPAID: 'prepaid',
      POSTPAID: 'postpaid',
    }
  }
};

export default VTpassService;
