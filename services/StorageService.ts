import AsyncStorage from '@react-native-async-storage/async-storage';
import { StarkNetWalletData } from './StarkNetWalletService';

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

export interface MultiWalletData {
  wallets: StarkNetWalletData[];
  activeWalletId: string;
}

// Using StarkNetWalletData from StarkNetWalletService instead of local WalletData
export type WalletData = StarkNetWalletData;

class StorageService {
  private static instance: StorageService;
  private readonly USER_DATA_KEY = 'spark_user_data';
  private readonly WALLET_DATA_KEY = 'spark_wallet_data';
  private readonly MULTI_WALLET_DATA_KEY = 'spark_multi_wallet_data';
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

  // Wallet Data Management - Legacy methods for backward compatibility
  async saveWalletData(walletData: WalletData): Promise<void> {
    try {
      console.log('=== STORAGE SERVICE DEBUG ===');
      console.log('Attempting to save wallet data:', walletData);
      
      // Update in multi-wallet structure
      const multiWalletData = await this.getMultiWalletData();
      if (multiWalletData) {
        const walletIndex = multiWalletData.wallets.findIndex(w => w.address === walletData.address);
        if (walletIndex >= 0) {
          multiWalletData.wallets[walletIndex] = { ...walletData, id: walletData.address };
          await this.saveMultiWalletData(multiWalletData);
          console.log('Updated wallet in multi-wallet structure');
        }
      }
      
      console.log('Wallet data saved successfully');
    } catch (error) {
      console.error('Error saving wallet data:', error);
      if (error instanceof Error) {
        console.error('Save error stack:', error.stack);
      }
      throw error;
    }
  }

  async getWalletData(): Promise<WalletData | null> {
    try {
      // Get active wallet from multi-wallet structure
      const activeWallet = await this.getActiveWallet();
      return activeWallet;
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

  async updateWalletName(name: string): Promise<void> {
    try {
      await this.updateWalletData({ name });
      console.log('Wallet name updated successfully');
    } catch (error) {
      console.error('Error updating wallet name:', error);
      throw error;
    }
  }

  // Multi-Wallet Management
  async getMultiWalletData(): Promise<MultiWalletData | null> {
    try {
      const data = await AsyncStorage.getItem(this.MULTI_WALLET_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting multi-wallet data:', error);
      return null;
    }
  }

  async saveMultiWalletData(multiWalletData: MultiWalletData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.MULTI_WALLET_DATA_KEY, JSON.stringify(multiWalletData));
      console.log('Multi-wallet data saved successfully');
    } catch (error) {
      console.error('Error saving multi-wallet data:', error);
      throw error;
    }
  }

  async addWallet(walletData: StarkNetWalletData): Promise<void> {
    try {
      let multiWalletData = await this.getMultiWalletData();
      
      if (!multiWalletData) {
        // Check if there's an existing single wallet to migrate first
        const existingWallet = await this.getWalletData();
        if (existingWallet) {
          // Assign Account1 to existing wallet, Account2 to new wallet
          const existingWalletName = existingWallet.address.endsWith('88c') ? 'Account1' : (existingWallet.name || 'Account1');
          multiWalletData = {
            wallets: [
              { ...existingWallet, id: existingWallet.address, name: existingWalletName },
              { ...walletData, id: walletData.address, name: 'Account2' }
            ],
            activeWalletId: walletData.address
          };
          console.log('Migrating existing wallet and adding new wallet');
        } else {
          // First wallet - create new multi-wallet structure
          multiWalletData = {
            wallets: [{ ...walletData, id: walletData.address, name: 'Account1' }],
            activeWalletId: walletData.address
          };
        }
      } else {
        // Add new wallet to existing structure with incremental name
        const nextAccountNumber = multiWalletData.wallets.length + 1;
        const newWallet = { ...walletData, id: walletData.address, name: `Account${nextAccountNumber}` };
        multiWalletData.wallets.push(newWallet);
        multiWalletData.activeWalletId = walletData.address; // Make new wallet active
      }
      
      await this.saveMultiWalletData(multiWalletData);
      
      // Also update the legacy single wallet data for backward compatibility
      await this.saveWalletData(walletData);
      
      console.log('Wallet added successfully:', walletData.address);
      console.log('Total wallets now:', multiWalletData.wallets.length);
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  }

  async switchActiveWallet(walletId: string): Promise<void> {
    try {
      const multiWalletData = await this.getMultiWalletData();
      if (!multiWalletData) {
        throw new Error('No multi-wallet data found');
      }

      const wallet = multiWalletData.wallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      multiWalletData.activeWalletId = walletId;
      await this.saveMultiWalletData(multiWalletData);
      
      // Also update the legacy single wallet data for backward compatibility
      await this.saveWalletData(wallet);
      
      console.log('Active wallet switched successfully');
    } catch (error) {
      console.error('Error switching active wallet:', error);
      throw error;
    }
  }

  async getActiveWallet(): Promise<StarkNetWalletData | null> {
    try {
      const multiWalletData = await this.getMultiWalletData();
      if (!multiWalletData) {
        console.log('No multi-wallet data found');
        return null;
      }

      console.log('Active wallet ID:', multiWalletData.activeWalletId);
      console.log('Available wallets:', multiWalletData.wallets.map(w => ({ id: w.id, name: w.name, address: w.address })));

      const activeWallet = multiWalletData.wallets.find(w => w.id === multiWalletData.activeWalletId);
      console.log('Found active wallet:', activeWallet ? { id: activeWallet.id, name: activeWallet.name, address: activeWallet.address } : null);
      
      return activeWallet || null;
    } catch (error) {
      console.error('Error getting active wallet:', error);
      return null;
    }
  }

  async getAllWallets(): Promise<StarkNetWalletData[]> {
    try {
      const multiWalletData = await this.getMultiWalletData();
      console.log('Multi-wallet data from storage:', multiWalletData);
      
      if (!multiWalletData) {
        console.log('No multi-wallet data found');
        return [];
      }

      console.log('Returning wallets from multi-wallet data:', multiWalletData.wallets);
      return multiWalletData.wallets;
    } catch (error) {
      console.error('Error getting all wallets:', error);
      return [];
    }
  }

  async updateWalletInMultiWallet(walletId: string, updates: Partial<StarkNetWalletData>): Promise<void> {
    try {
      const multiWalletData = await this.getMultiWalletData();
      if (!multiWalletData) {
        throw new Error('No multi-wallet data found');
      }

      const walletIndex = multiWalletData.wallets.findIndex(w => w.id === walletId);
      if (walletIndex === -1) {
        throw new Error('Wallet not found');
      }

      multiWalletData.wallets[walletIndex] = { ...multiWalletData.wallets[walletIndex], ...updates };
      await this.saveMultiWalletData(multiWalletData);
      
      // If updating the active wallet, also update legacy storage
      if (walletId === multiWalletData.activeWalletId) {
        await this.saveWalletData(multiWalletData.wallets[walletIndex]);
      }
      
      console.log('Wallet updated in multi-wallet successfully');
    } catch (error) {
      console.error('Error updating wallet in multi-wallet:', error);
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

  // App Lock Management
  async setAppLocked(locked: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('spark_app_locked', locked.toString());
    } catch (error) {
      console.error('Error setting app lock status:', error);
    }
  }

  async isAppLocked(): Promise<boolean> {
    try {
      const locked = await AsyncStorage.getItem('spark_app_locked');
      return locked === 'true';
    } catch (error) {
      console.error('Error checking app lock status:', error);
      return false;
    }
  }

  async saveUserPassword(password: string): Promise<void> {
    try {
      // In a real app, you'd hash this password
      await AsyncStorage.setItem('spark_user_password', password);
    } catch (error) {
      console.error('Error saving user password:', error);
      throw error;
    }
  }

  async validateUserPassword(password: string): Promise<boolean> {
    try {
      const storedPassword = await AsyncStorage.getItem('spark_user_password');
      return storedPassword === password;
    } catch (error) {
      console.error('Error validating user password:', error);
      return false;
    }
  }

  async hasUserPassword(): Promise<boolean> {
    try {
      const password = await AsyncStorage.getItem('spark_user_password');
      return password !== null;
    } catch (error) {
      console.error('Error checking user password:', error);
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

  // Debug storage state and get storage info
  async getStorageInfo(): Promise<any> {
    try {
      const userData = await this.getUserData();
      const walletData = await this.getWalletData();
      const multiWalletData = await this.getMultiWalletData();
      const onboardingCompleted = await this.isOnboardingCompleted();
      
      return {
        hasUserData: !!userData,
        hasWalletData: !!walletData,
        hasMultiWalletData: !!multiWalletData,
        onboardingCompleted,
        userDataKeys: userData ? Object.keys(userData) : [],
        walletDataKeys: walletData ? Object.keys(walletData) : [],
        multiWalletWalletCount: multiWalletData ? multiWalletData.wallets.length : 0,
        activeWalletId: multiWalletData ? multiWalletData.activeWalletId : null
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }
}

export default StorageService.getInstance();
