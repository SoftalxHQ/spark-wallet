import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
  privateKey?: string;
  hasCompletedOnboarding: boolean;
  authMethod: 'google' | 'email' | 'guest';
  createdAt: string;
  lastLoginAt: string;
}

export interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  deploymentTxHash?: string;
  isDeployed: boolean;
  balance?: string;
}

class StorageService {
  private static instance: StorageService;
  private readonly USER_DATA_KEY = 'spark_user_data';
  private readonly WALLET_DATA_KEY = 'spark_wallet_data';
  private readonly ONBOARDING_KEY = 'spark_onboarding_completed';

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Data Management
  async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async updateUserData(updates: Partial<UserData>): Promise<void> {
    try {
      const currentData = await this.getUserData();
      if (currentData) {
        const updatedData = { ...currentData, ...updates };
        await this.saveUserData(updatedData);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Wallet Data Management
  async saveWalletData(walletData: WalletData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.WALLET_DATA_KEY, JSON.stringify(walletData));
      console.log('Wallet data saved successfully');
    } catch (error) {
      console.error('Error saving wallet data:', error);
      throw error;
    }
  }

  async getWalletData(): Promise<WalletData | null> {
    try {
      const walletData = await AsyncStorage.getItem(this.WALLET_DATA_KEY);
      return walletData ? JSON.parse(walletData) : null;
    } catch (error) {
      console.error('Error getting wallet data:', error);
      return null;
    }
  }

  async updateWalletData(updates: Partial<WalletData>): Promise<void> {
    try {
      const currentData = await this.getWalletData();
      if (currentData) {
        const updatedData = { ...currentData, ...updates };
        await this.saveWalletData(updatedData);
      }
    } catch (error) {
      console.error('Error updating wallet data:', error);
      throw error;
    }
  }

  // Onboarding Management
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ONBOARDING_KEY, 'true');
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
      throw error;
    }
  }

  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Authentication State
  async isUserLoggedIn(): Promise<boolean> {
    try {
      const userData = await this.getUserData();
      return userData !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Clear Data (Logout)
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.USER_DATA_KEY,
        this.WALLET_DATA_KEY,
        this.ONBOARDING_KEY
      ]);
      console.log('All user data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  // Utility Methods
  async getStorageInfo(): Promise<{
    hasUser: boolean;
    hasWallet: boolean;
    hasCompletedOnboarding: boolean;
  }> {
    try {
      const [userData, walletData, onboardingCompleted] = await Promise.all([
        this.getUserData(),
        this.getWalletData(),
        this.hasCompletedOnboarding()
      ]);

      return {
        hasUser: userData !== null,
        hasWallet: walletData !== null,
        hasCompletedOnboarding: onboardingCompleted
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        hasUser: false,
        hasWallet: false,
        hasCompletedOnboarding: false
      };
    }
  }
}

export default StorageService.getInstance();
