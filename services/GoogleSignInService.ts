import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import GDrive from '@robinbobin/react-native-google-drive-api-wrapper';
import CryptoJS from 'crypto-js';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface GoogleSignInResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
  accessToken?: string;
  error?: string;
}

export interface WalletBackup {
  version: string;
  encrypted_private_key: string;
  encrypted_seed_phrase?: string;
  wallet_address: string;
  created_at: string;
  device_id: string;
  backup_metadata: any;
}

class GoogleSignInService {
  private gdrive: any;
  private readonly BACKUP_FOLDER_NAME = 'Spark Wallet';
  private readonly BACKUP_FILE_NAME = 'encrypted_wallet_backup.json';

  constructor() {
    this.gdrive = new GDrive();
    this.configureGoogleSignIn();
  }

  private configureGoogleSignIn() {
    GoogleSignin.configure({
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  async signIn(): Promise<GoogleSignInResult> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Initialize Google Drive with access token
      this.gdrive.accessToken = tokens.accessToken;
      await this.gdrive.init();

      return {
        success: true,
        user: {
          id: userInfo.user.id,
          email: userInfo.user.email,
          name: userInfo.user.name || '',
          photo: userInfo.user.photo || undefined,
        },
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign-in cancelled by user' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign-in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Play Services not available' };
      } else {
        return { success: false, error: error.message || 'Unknown error occurred' };
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }

  async isSignedIn(): Promise<boolean> {
    return await GoogleSignin.isSignedIn();
  }

  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo.user;
    } catch (error) {
      return null;
    }
  }

  // Wallet Backup Functions
  async createWalletBackup(privateKey: string, walletAddress: string, password: string): Promise<boolean> {
    try {
      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        throw new Error('User not signed in to Google');
      }

      // Generate device-specific salt
      const deviceId = await this.getDeviceId();
      const salt = CryptoJS.lib.WordArray.random(256/8);
      
      // Create encryption key from password + salt
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      // Encrypt private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, key.toString()).toString();

      // Create backup object
      const backup: WalletBackup = {
        version: '1.0',
        encrypted_private_key: encryptedPrivateKey,
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        device_id: deviceId,
        backup_metadata: {
          salt: salt.toString(),
          encryption_method: 'AES-256',
        }
      };

      // Create or find backup folder
      const folderId = await this.createBackupFolder();
      
      // Upload backup file
      await this.gdrive.files.createFileMultipart(
        JSON.stringify(backup),
        'application/json',
        {
          name: this.BACKUP_FILE_NAME,
          parents: [folderId],
        }
      );

      return true;
    } catch (error) {
      console.error('Backup creation error:', error);
      return false;
    }
  }

  async restoreWalletBackup(password: string): Promise<{ success: boolean; privateKey?: string; walletAddress?: string; error?: string }> {
    try {
      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        return { success: false, error: 'User not signed in to Google' };
      }

      // Find backup file
      const backupFile = await this.findBackupFile();
      if (!backupFile) {
        return { success: false, error: 'No wallet backup found in Google Drive' };
      }

      // Download and parse backup
      const backupContent = await this.gdrive.files.get(backupFile.id, { alt: 'media' });
      const backup: WalletBackup = JSON.parse(backupContent);

      // Recreate encryption key
      const deviceId = await this.getDeviceId();
      const salt = CryptoJS.enc.Hex.parse(backup.backup_metadata.salt);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      // Decrypt private key
      const decryptedBytes = CryptoJS.AES.decrypt(backup.encrypted_private_key, key.toString());
      const privateKey = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!privateKey) {
        return { success: false, error: 'Invalid password or corrupted backup' };
      }

      return {
        success: true,
        privateKey,
        walletAddress: backup.wallet_address,
      };
    } catch (error) {
      console.error('Backup restoration error:', error);
      return { success: false, error: 'Failed to restore wallet backup' };
    }
  }

  async hasWalletBackup(): Promise<boolean> {
    try {
      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) return false;

      const backupFile = await this.findBackupFile();
      return !!backupFile;
    } catch (error) {
      console.error('Error checking for backup:', error);
      return false;
    }
  }

  private async createBackupFolder(): Promise<string> {
    try {
      // Check if folder already exists
      const folderQuery = `name='${this.BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`;
      const existingFolders = await this.gdrive.files.list({ q: folderQuery });
      
      if (existingFolders.files && existingFolders.files.length > 0) {
        return existingFolders.files[0].id;
      }

      // Create new folder
      const folder = await this.gdrive.files.create({
        name: this.BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      });

      return folder.id;
    } catch (error) {
      console.error('Error creating backup folder:', error);
      throw error;
    }
  }

  private async findBackupFile(): Promise<any> {
    try {
      const query = `name='${this.BACKUP_FILE_NAME}' and parents in '${await this.createBackupFolder()}'`;
      const files = await this.gdrive.files.list({ q: query });
      
      return files.files && files.files.length > 0 ? files.files[0] : null;
    } catch (error) {
      console.error('Error finding backup file:', error);
      return null;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await EncryptedStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = CryptoJS.lib.WordArray.random(128/8).toString();
        await EncryptedStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return 'unknown_device';
    }
  }
}

export default new GoogleSignInService();
