// Mock Google Sign-In Service for testing UI flows without native dependencies
// This allows us to test the authentication screens and flows

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

export interface SignInResult {
  success: boolean;
  user?: GoogleUser;
  error?: string;
}

class MockGoogleSignInService {
  private static instance: MockGoogleSignInService;
  private currentUser: GoogleUser | null = null;
  private isConfigured = false;

  static getInstance(): MockGoogleSignInService {
    if (!MockGoogleSignInService.instance) {
      MockGoogleSignInService.instance = new MockGoogleSignInService();
    }
    return MockGoogleSignInService.instance;
  }

  configure(config: { webClientId: string }): void {
    console.log('Mock Google Sign-In configured with:', config);
    this.isConfigured = true;
  }

  async signIn(): Promise<SignInResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful sign-in
    const mockUser: GoogleUser = {
      id: 'mock_user_123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      photo: 'https://via.placeholder.com/150'
    };

    this.currentUser = mockUser;
    
    return {
      success: true,
      user: mockUser
    };
  }

  async signOut(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.currentUser = null;
    console.log('Mock Google Sign-Out completed');
  }

  async isSignedIn(): Promise<boolean> {
    return this.currentUser !== null;
  }

  async getCurrentUser(): Promise<SignInResult> {
    if (this.currentUser) {
      return {
        success: true,
        user: this.currentUser
      };
    } else {
      return {
        success: false,
        error: 'No user signed in'
      };
    }
  }

  // Mock wallet backup functionality (simplified)
  async hasWalletBackup(): Promise<boolean> {
    // For testing, randomly return true/false
    return Math.random() > 0.5;
  }

  async createWalletBackup(privateKey: string, walletAddress: string, password: string): Promise<boolean> {
    console.log('Mock: Creating wallet backup for address:', walletAddress);
    // Simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }

  async restoreWalletBackup(password: string): Promise<{ success: boolean; privateKey?: string; walletAddress?: string; error?: string }> {
    console.log('Mock: Restoring wallet backup');
    // Simulate backup restoration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      privateKey: 'mock_private_key_123',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
    };
  }
}

export default MockGoogleSignInService.getInstance();
