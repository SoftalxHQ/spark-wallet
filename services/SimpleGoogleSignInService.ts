import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

interface SignInResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  error?: string;
}

class SimpleGoogleSignInService {
  private static instance: SimpleGoogleSignInService;

  private constructor() {
    this.configure();
  }

  public static getInstance(): SimpleGoogleSignInService {
    if (!SimpleGoogleSignInService.instance) {
      SimpleGoogleSignInService.instance = new SimpleGoogleSignInService();
    }
    return SimpleGoogleSignInService.instance;
  }

  private configure() {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // Replace with actual Web Client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  async signIn(): Promise<SignInResult> {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response.type === 'success') {
        return {
          success: true,
          user: {
            id: response.data.user.id,
            name: response.data.user.name || '',
            email: response.data.user.email,
            photo: response.data.user.photo || undefined,
          },
        };
      } else {
        return { success: false, error: 'Sign in was cancelled' };
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign in was cancelled' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign in is already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Play services not available' };
      } else {
        return { success: false, error: error.message || 'Unknown error occurred' };
      }
    }
  }

  async signOut(): Promise<boolean> {
    try {
      await GoogleSignin.signOut();
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<SignInResult> {
    try {
      const response = await GoogleSignin.signInSilently();
      if (response.type === 'success') {
        return {
          success: true,
          user: {
            id: response.data.user.id,
            name: response.data.user.name || '',
            email: response.data.user.email,
            photo: response.data.user.photo || undefined,
          },
        };
      } else {
        return { success: false, error: 'No saved credential found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'No user signed in' };
    }
  }

  // Placeholder for future wallet backup functionality
  async hasWalletBackup(): Promise<boolean> {
    // TODO: Implement Google Drive backup check
    return false;
  }

  async createWalletBackup(privateKey: string, walletAddress: string, password: string): Promise<boolean> {
    // TODO: Implement encrypted backup to Google Drive
    console.log('Creating wallet backup...', { walletAddress });
    return true;
  }

  async restoreWalletBackup(password: string): Promise<{ success: boolean; privateKey?: string; walletAddress?: string; error?: string }> {
    // TODO: Implement wallet restoration from Google Drive
    return { success: false, error: 'Backup restoration not yet implemented' };
  }
}

export default SimpleGoogleSignInService.getInstance();
