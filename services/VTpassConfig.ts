/**
 * VTpass Configuration for Spark Wallet
 * Manages API credentials and environment settings
 */

import Constants from 'expo-constants';
import { VTpassConfig } from './VTpassService';

class VTpassConfigManager {
  private static instance: VTpassConfigManager;
  private config: VTpassConfig | null = null;

  static getInstance(): VTpassConfigManager {
    if (!VTpassConfigManager.instance) {
      VTpassConfigManager.instance = new VTpassConfigManager();
    }
    return VTpassConfigManager.instance;
  }

  /**
   * Initialize VTpass configuration
   * For development, use sandbox credentials
   * For production, use live credentials
   */
  initialize(config: VTpassConfig): void {
    this.config = config;
    console.log(`VTpass initialized in ${config.environment} mode`);
  }

  /**
   * Get current configuration
   */
  getConfig(): VTpassConfig {
    if (!this.config) {
      throw new Error('VTpass not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Check if VTpass is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Get sandbox configuration for testing
   * Note: Replace with actual sandbox credentials from VTpass dashboard
   */
  static getSandboxConfig(): VTpassConfig {
    return {
      apiKey: Constants.expoConfig?.extra?.VTPASS_SANDBOX_API_KEY || 'your_sandbox_api_key',
      publicKey: Constants.expoConfig?.extra?.VTPASS_SANDBOX_PUBLIC_KEY || 'PK_your_sandbox_public_key',
      secretKey: Constants.expoConfig?.extra?.VTPASS_SANDBOX_SECRET_KEY || 'SK_your_sandbox_secret_key',
      environment: 'sandbox'
    };
  }

  /**
   * Get live configuration for production
   * Note: Replace with actual live credentials from VTpass dashboard
   */
  static getLiveConfig(): VTpassConfig {
    return {
      apiKey: Constants.expoConfig?.extra?.VTPASS_LIVE_API_KEY || 'your_live_api_key',
      publicKey: Constants.expoConfig?.extra?.VTPASS_LIVE_PUBLIC_KEY || 'PK_your_live_public_key',
      secretKey: Constants.expoConfig?.extra?.VTPASS_LIVE_SECRET_KEY || 'SK_your_live_secret_key',
      environment: 'live'
    };
  }
}

export default VTpassConfigManager;
