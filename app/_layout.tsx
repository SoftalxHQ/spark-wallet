import { useFonts } from 'expo-font';

import { SparkColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, Image, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
// import SimpleGoogleSignInService from '../services/SimpleGoogleSignInService';
import MockGoogleSignInService from '../services/MockGoogleSignInService';
import StorageService from '../services/StorageService';
import StarkNetWalletService from '../services/StarkNetWalletService';



function SplashScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const circleRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo appears with scale and fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for decorative circles
    Animated.loop(
      Animated.timing(circleRotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim, circleRotateAnim]);

  // Animation interpolations
  const circleRotation = circleRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.splashContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Animated decorative circles */}
      <Animated.View 
        style={[
          styles.decorCircle, 
          { 
            top: 80, 
            right: -60, 
            width: 260, 
            height: 260,
            transform: [{ rotate: circleRotation }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.decorCircle, 
          { 
            bottom: 120, 
            left: -70, 
            width: 220, 
            height: 220, 
            opacity: 0.18,
            transform: [{ rotate: circleRotation }]
          }
        ]} 
      />
      
      {/* Animated logo */}
      <Animated.View 
        style={[
          styles.logoCircle,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) }
            ]
          }
        ]}
      >
        <Image source={require('../assets/images/logo.png')} style={styles.logoImage} />
      </Animated.View>
      
      {/* Static title */}
      <Text style={styles.splashTitle}>
        Spark Wallet
      </Text>
      
      {/* Static tagline */}
      <Text style={styles.splashTagline}>
        Crypto & Everyday Payments
      </Text>
    </LinearGradient>
  );
}

// Onboarding carousel

type OnboardingScreenProps = {
  onComplete: () => void;
};

type OnboardingPage = {
  title: string;
  subtitle: string;
  description: string;
  iconName: 'creditcard.fill' | 'person.circle.fill' | 'bolt.circle.fill' | 'house.fill' | 'paperplane.fill' | 'shield.fill' | 'bolt.fill' | 'lightbulb.fill';
};

function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const pages: OnboardingPage[] = [
    {
      title: 'Welcome to Spark',
      subtitle: 'Your Digital Wallet',
      description: 'Experience the future of digital payments with secure, fast, and reliable transactions.',
      iconName: 'creditcard.fill',
    },
    {
      title: 'Secure & Protected',
      subtitle: 'Bank-Level Security',
      description: 'Your funds are protected with advanced encryption and multi-layer security protocols.',
      iconName: 'shield.fill',
    },
    {
      title: 'Lightning Fast',
      subtitle: 'Instant Transactions',
      description: 'Send and receive payments instantly with our optimized blockchain technology.',
      iconName: 'bolt.fill',
    },
    {
      title: 'Pay Utilities Easily',
      subtitle: 'Airtime, Data, Bills',
      description: 'Pay electricity, airtime, data, and cable directly from your wallet.',
      iconName: 'lightbulb.fill',
    },
  ];

  const [index, setIndex] = useState(0);
  const isLast = index === pages.length - 1;
  const page = pages[index];

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      setIndex((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  }

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.onboardingRoot}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={[styles.decorCircle, { top: 80, right: -60, width: 260, height: 260 }]} />
      <View style={[styles.decorCircle, { bottom: 120, left: -70, width: 220, height: 220, opacity: 0.18 }]} />

      {/* Top controls */}
      <View style={styles.topRow}>
        <View style={styles.dotsRow}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : undefined,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onComplete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.heroIconWrapper}>
          <LinearGradient
            colors={[SparkColors.gold, '#B8860B']}
            style={styles.heroIconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconSymbol name={page.iconName} size={64} color={SparkColors.black} />
          </LinearGradient>
        </View>

        {/* Text content */}
        <View style={styles.content}>
          <Text style={styles.heroTitle}>{page.title}</Text>
          <Text style={styles.heroSubtitle}>{page.subtitle}</Text>
          <Text style={styles.heroDescription}>{page.description}</Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        {index > 0 ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
              <Text style={styles.ctaButtonText}>{isLast ? 'Get Started' : 'Next'}  →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.ctaButtonCentered} onPress={handleNext}>
            <Text style={styles.ctaButtonText}>{isLast ? 'Get Started' : 'Next'}  →</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

// Auth screens

type WelcomeScreenProps = {
  onSignUp: () => void;
  onLogin: () => void;
};

type BackOnlyProps = {
  onBack: () => void;
};

function AuthWelcomeScreen({ onSignUp, onLogin }: WelcomeScreenProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await MockGoogleSignInService.signIn();
      if (result.success) {
        // For now, assume no backup exists since we're using simplified service
        const hasBackup = false;
        if (hasBackup) {
          Alert.alert(
            'Wallet Found',
            'We found an existing wallet backup in your Google Drive. Would you like to restore it?',
            [
              { text: 'Create New', onPress: () => onSignUp() },
              { text: 'Restore', onPress: () => handleWalletRestore() }
            ]
          );
        } else {
          // No backup found, save user data and create StarkNet wallet
          if (result.user) {
            const userData = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              hasCompletedOnboarding: true,
              authMethod: 'google' as const,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            };
            await StorageService.saveUserData(userData);
            await StorageService.setOnboardingCompleted();
            
            // Create StarkNet smart contract wallet
            try {
              const walletData = await StarkNetWalletService.createSmartWallet();
              await StorageService.saveWalletData(walletData);
              console.log('StarkNet wallet created and saved:', walletData.address);
            } catch (walletError) {
              console.error('Error creating StarkNet wallet:', walletError);
              // Continue with onboarding even if wallet creation fails
            }
          }
          onSignUp();
        }
      } else {
        Alert.alert('Sign In Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleWalletRestore = () => {
    // TODO: Navigate to wallet restore screen
    Alert.alert('Restore Wallet', 'Wallet restore functionality will be implemented in the next phase.');
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.onboardingContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Image source={require('../assets/images/logo.png')} style={styles.onboardingLogo} />
      <Text style={styles.title}>Welcome to Spark Wallet</Text>
      <Text style={styles.subtitle}>A next-generation StarkNet wallet for crypto and everyday payments.</Text>
      
      {/* Google Sign-In Button */}
      <TouchableOpacity 
        style={[styles.googleButton, isGoogleLoading && styles.disabledButton]} 
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <View style={styles.googleButtonContent}>
          <Image 
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
            style={styles.googleIcon} 
          />
          <Text style={styles.googleButtonText}>
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TouchableOpacity style={styles.primaryButton} onPress={onSignUp}>
        <Text style={styles.primaryButtonText}>Sign Up with Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onLogin}>
        <Text style={styles.secondaryButtonText}>Log In with Email</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

function SignUpScreen({ onBack }: BackOnlyProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    // Simulate account creation
    alert('Account created successfully!');
    onBack();
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await MockGoogleSignInService.signIn();
      if (result.success) {
        // For now, assume no backup exists since we're using simplified service
        const hasBackup = false;
        if (hasBackup) {
          Alert.alert(
            'Wallet Found',
            'We found an existing wallet backup in your Google Drive. Would you like to restore it or create a new wallet?',
            [
              { text: 'Create New', onPress: () => handleCreateNewWallet() },
              { text: 'Restore', onPress: () => handleWalletRestore() }
            ]
          );
        } else {
          // No backup found, proceed with new wallet creation
          handleCreateNewWallet();
        }
      } else {
        Alert.alert('Sign Up Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      Alert.alert('Error', 'Failed to sign up with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCreateNewWallet = () => {
    // TODO: Implement wallet creation with automatic Google Drive backup
    Alert.alert('Success', 'Google account connected! Wallet creation with automatic backup will be implemented in Phase 1.');
    onBack();
  };

  const handleWalletRestore = () => {
    // TODO: Navigate to wallet restore screen
    Alert.alert('Restore Wallet', 'Wallet restore functionality will be implemented in the next phase.');
  };
  
  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.onboardingContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Image source={require('../assets/images/logo.png')} style={styles.onboardingLogoSmall} />
      <Text style={styles.title}>Create Account</Text>
      
      {/* Google Sign-Up Button */}
      <TouchableOpacity 
        style={[styles.googleButton, isGoogleLoading && styles.disabledButton]} 
        onPress={handleGoogleSignUp}
        disabled={isGoogleLoading}
      >
        <View style={styles.googleButtonContent}>
          <Image 
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
            style={styles.googleIcon} 
          />
          <Text style={styles.googleButtonText}>
            {isGoogleLoading ? 'Signing up...' : 'Sign Up with Google'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={SparkColors.darkGray}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={SparkColors.darkGray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={SparkColors.darkGray}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
        <Text style={styles.primaryButtonText}>Sign Up with Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

function LoginScreen({ onBack, onLogin }: BackOnlyProps & { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      
      // Simple validation for demo purposes - accept any valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email) && password.length >= 6) {
        alert('Login successful!');
        onLogin();
      } else {
        alert('Please enter a valid email and password (min 6 characters)');
      }
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await MockGoogleSignInService.signIn();
      if (result.success) {
        // For now, assume no backup exists since we're using simplified service
        const hasBackup = false;
        if (hasBackup) {
          // User has backup, proceed to restore wallet
          Alert.alert(
            'Wallet Found',
            'We found your wallet backup. Please enter your password to restore it.',
            [{ text: 'OK', onPress: () => handleWalletRestore() }]
          );
        } else {
          // No backup found, user needs to create wallet or import
          Alert.alert(
            'No Wallet Found',
            'No wallet backup found in your Google Drive. Would you like to create a new wallet or import an existing one?',
            [
              { text: 'Create New', onPress: () => handleCreateNewWallet() },
              { text: 'Import', onPress: () => handleImportWallet() }
            ]
          );
        }
      } else {
        Alert.alert('Login Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Google Login error:', error);
      Alert.alert('Error', 'Failed to login with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleWalletRestore = () => {
    // TODO: Navigate to wallet restore screen
    Alert.alert('Restore Wallet', 'Wallet restore functionality will be implemented in the next phase.');
    onLogin(); // For now, proceed to main app
  };

  const handleCreateNewWallet = () => {
    // TODO: Navigate to wallet creation
    Alert.alert('Create Wallet', 'New wallet creation will be implemented in Phase 1.');
    onLogin(); // For now, proceed to main app
  };

  const handleImportWallet = () => {
    // TODO: Navigate to wallet import screen
    Alert.alert('Import Wallet', 'Wallet import functionality will be implemented in Phase 1.');
  };
  
  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.onboardingContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Image source={require('../assets/images/logo.png')} style={styles.onboardingLogoSmall} />
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your Spark Wallet</Text>
      
      {/* Google Login Button */}
      <TouchableOpacity 
        style={[styles.googleButton, isGoogleLoading && styles.disabledButton]} 
        onPress={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
      >
        <View style={styles.googleButtonContent}>
          <Image 
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
            style={styles.googleIcon} 
          />
          <Text style={styles.googleButtonText}>
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={SparkColors.darkGray}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading && !isGoogleLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={SparkColors.darkGray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading && !isGoogleLoading}
      />
      
      <TouchableOpacity 
        style={[styles.primaryButton, (isLoading || isGoogleLoading) && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={isLoading || isGoogleLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Signing In...' : 'Sign In with Email'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={onBack}
        disabled={isLoading || isGoogleLoading}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}



export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check for existing user data on app start
  useEffect(() => {
    const checkUserData = async () => {
      try {
        const storageInfo = await StorageService.getStorageInfo();
        console.log('Storage info:', storageInfo);
        
        // If user has completed onboarding or has user data, skip onboarding
        if (storageInfo.hasCompletedOnboarding || storageInfo.hasUser) {
          setShowOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking user data:', error);
        // On error, show onboarding to be safe
        setShowOnboarding(true);
      } finally {
        setIsCheckingStorage(false);
      }
    };

    if (!showSplash) {
      checkUserData();
    }
  }, [showSplash]);

  if (!loaded) {
    return null;
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show loading while checking storage
  if (isCheckingStorage) {
    return <SplashScreen />;
  }

  // Show onboarding flow
  if (showOnboarding) {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingFlow onComplete={async () => {
          await StorageService.setOnboardingCompleted();
          setShowOnboarding(false);
        }} />
      </View>
    );
  }

  // Show main app
  return (
    <View style={{ flex: 1, backgroundColor: SparkColors.black }}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: SparkColors.black },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            contentStyle: { backgroundColor: SparkColors.black },
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: SparkColors.black,
            },
            headerTintColor: SparkColors.gold,
            headerTitle: 'Profile',
            headerTitleStyle: {
              color: SparkColors.white,
              fontWeight: 'bold',
            },
            contentStyle: { backgroundColor: SparkColors.black },
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
    </View>
  );
}

// Combined onboarding flow component
function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'onboarding' | 'authWelcome' | 'signup' | 'login'>('onboarding');

  if (step === 'onboarding') {
    return <OnboardingScreen onComplete={() => setStep('authWelcome')} />;
  }
  if (step === 'authWelcome') {
    return (
      <AuthWelcomeScreen 
        onSignUp={() => setStep('signup')} 
        onLogin={() => setStep('login')} 
      />
    );
  }
  if (step === 'signup') {
    return <SignUpScreen onBack={() => setStep('authWelcome')} />;
  }
  if (step === 'login') {
    return <LoginScreen onBack={() => setStep('authWelcome')} onLogin={onComplete} />;
  }

  return null;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SparkColors.darkBrown,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SparkColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: SparkColors.gold,
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SparkColors.white,
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: SparkColors.black,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  splashTagline: {
    fontSize: 16,
    color: SparkColors.gold,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  onboardingRoot: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
  },
  dotActive: {
    backgroundColor: SparkColors.gold,
    width: 22,
    borderRadius: 5,
  },
  skipText: {
    color: SparkColors.gold,
    fontWeight: '600',
    fontSize: 16,
  },
  heroIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  heroIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SparkColors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    tintColor: '#ffffff',
    opacity: 0.95,
    resizeMode: 'contain',
  },
  content: {
    paddingHorizontal: 8,
    marginTop: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'left',
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: SparkColors.gold,
    marginTop: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#dcdcdc',
    marginTop: 16,
    lineHeight: 22,
  },
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    gap: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SparkColors.gold,
    shadowColor: SparkColors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    color: SparkColors.gold,
    fontWeight: 'bold',
    fontSize: 14,
  },
  ctaButton: {
    width: '85%',
    height: 56,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonCentered: {
    width: '85%',
    height: 56,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#2C1A0B',
    fontWeight: '800',
    fontSize: 18,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },

  onboardingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  onboardingLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  onboardingLogoSmall: {
    width: 120,
    height: 120,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SparkColors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: SparkColors.lightGray,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: SparkColors.brown,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: SparkColors.darkBrown,
    color: SparkColors.white,
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: SparkColors.darkGold,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: SparkColors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: SparkColors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SparkColors.gold,
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: SparkColors.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },
  
  // Google Sign-In Button Styles
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: SparkColors.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: SparkColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: SparkColors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SparkColors.brown,
  },
  dividerText: {
    marginHorizontal: 16,
    color: SparkColors.lightGray,
    fontSize: 14,
  },
});
