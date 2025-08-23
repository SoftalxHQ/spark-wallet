import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Alert, TextInput, Modal, ActivityIndicator, StyleSheet, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SparkColors } from '@/constants/Colors';
import UtilityPaymentService, { UtilityPaymentRequest, SUPPORTED_PROVIDERS } from '../../services/UtilityPaymentService';
import VTpassConfigManager from '../../services/VTpassConfig';
import StorageService from '../../services/StorageService';
import UtilityPaymentSuccessModal from '../../components/UtilityPaymentSuccessModal';

export default function UtilityScreen() {
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [availableDataPlans, setAvailableDataPlans] = useState<any[]>([]);
  const [selectedDataPlan, setSelectedDataPlan] = useState<any>(null);
  const [showDataPlanDropdown, setShowDataPlanDropdown] = useState(false);
  const [isLoadingDataPlans, setIsLoadingDataPlans] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'change' | 'renew'>('change');
  const [showSubscriptionTypeDropdown, setShowSubscriptionTypeDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const utilities = [
    { name: 'Electricity', icon: '⚡', color: SparkColors.gold, type: 'electricity' },
    { name: 'Airtime', icon: '📱', color: '#4CAF50', type: 'airtime' },
    { name: 'Data', icon: '📶', color: '#2196F3', type: 'data' },
    { name: 'Cable TV', icon: '📺', color: '#9C27B0', type: 'tv' },
  ];

  useEffect(() => {
    initializeVTpass();
    loadRecentPayments();
  }, []);

  const initializeVTpass = () => {
    try {
      const utilityService = UtilityPaymentService.getInstance();
      utilityService.initialize(VTpassConfigManager.getSandboxConfig());
      console.log('VTpass service initialized');
    } catch (error) {
      console.error('Failed to initialize VTpass:', error);
    }
  };

  const loadRecentPayments = async () => {
    // TODO: Load recent payments from storage
    setRecentPayments([]);
  };

  const handleUtilityPress = (utility: any) => {
    setSelectedUtility(utility.type);
    setSelectedProvider('');
    setAccountNumber('');
    setAmount('');
    setCustomerPhone('');
    setCustomerDetails(null);
    setSelectedPlan('');
    setAvailablePlans([]);
    setAvailableProviders([]);
    setShowPaymentModal(true);
    // Fetch providers for this utility type
    fetchProvidersForUtility(utility.type);
  };

  const fetchProvidersForUtility = async (utilityType: string) => {
    setIsLoadingProviders(true);
    try {
      const utilityService = UtilityPaymentService.getInstance();
      const services = await utilityService.getAvailableServices(utilityType as any);
      
      // Ensure all provider objects have required fields
      const sanitizedServices = services.map((provider: any) => ({
        serviceID: provider.serviceID || provider.name?.toLowerCase() || 'unknown',
        name: provider.name || 'Unknown Provider',
        minimium_amount: provider.minimium_amount || '0',
        maximum_amount: provider.maximum_amount || '0',
        image: provider.image || null
      }));
      
      setAvailableProviders(sanitizedServices);
    } catch (error) {
      console.error('Error fetching providers:', error);
      Alert.alert('Error', 'Failed to load service providers');
      // Fallback to hardcoded providers if API fails
      const fallbackProviders = getProvidersForUtility(utilityType);
      setAvailableProviders(fallbackProviders.map(name => ({ 
        serviceID: name.toLowerCase(), 
        name: name || 'Unknown Provider',
        minimium_amount: '0',
        maximum_amount: '0',
        image: null
      })));
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const fetchPlans = async (provider: string) => {
    if (selectedUtility !== 'tv' || !provider) return;

    setIsLoadingPlans(true);
    try {
      const utilityService = UtilityPaymentService.getInstance();
      const packages = await utilityService.getTVPackages(provider);
      
      if (packages && packages.content && packages.content.variations) {
        const plans = packages.content.variations.map((variation: any) => ({
          code: variation.variation_code,
          name: variation.name,
          amount: parseFloat(variation.variation_amount)
        }));
        setAvailablePlans(plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to mock data on error
      const mockPlans = getMockPlansForProvider(provider);
      setAvailablePlans(mockPlans);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchDataPlans = async (provider: string) => {
    if (selectedUtility !== 'data' || !provider) return;

    setIsLoadingDataPlans(true);
    try {
      const utilityService = UtilityPaymentService.getInstance();
      // Find the actual serviceID from the available providers
      const selectedProviderData = availableProviders.find(p => p.name === provider);
      const serviceId = selectedProviderData?.serviceID || 'mtn-data';
      const variationsResponse = await utilityService.getDataVariations(serviceId);
      
      if (variationsResponse && variationsResponse.content && variationsResponse.content.variations) {
        const plans = variationsResponse.content.variations.map((variation: any) => ({
          code: variation.variation_code,
          name: variation.name,
          amount: parseFloat(variation.variation_amount)
        }));
        setAvailableDataPlans(plans);
      }
    } catch (error) {
      console.error('Error fetching data plans:', error);
      setAvailableDataPlans([]);
    } finally {
      setIsLoadingDataPlans(false);
    }
  };



  const getMockPlansForProvider = (provider: string) => {
    const plans: { [key: string]: any[] } = {
      'dstv': [
        { code: 'dstv-padi', name: 'DStv Padi', amount: 2150 },
        { code: 'dstv-yanga', name: 'DStv Yanga', amount: 2950 },
        { code: 'dstv-confam', name: 'DStv Confam', amount: 5300 },
        { code: 'dstv-compact', name: 'DStv Compact', amount: 9000 },
        { code: 'dstv-compact-plus', name: 'DStv Compact Plus', amount: 14250 },
        { code: 'dstv-premium', name: 'DStv Premium', amount: 21000 }
      ],
      'gotv': [
        { code: 'gotv-smallie', name: 'GOtv Smallie', amount: 900 },
        { code: 'gotv-jinja', name: 'GOtv Jinja', amount: 1900 },
        { code: 'gotv-jolli', name: 'GOtv Jolli', amount: 2800 },
        { code: 'gotv-max', name: 'GOtv Max', amount: 4150 },
        { code: 'gotv-super', name: 'GOtv Super', amount: 5500 }
      ],
      'startimes': [
        { code: 'nova', name: 'Nova', amount: 900 },
        { code: 'basic', name: 'Basic', amount: 1800 },
        { code: 'smart', name: 'Smart', amount: 2500 },
        { code: 'classic', name: 'Classic', amount: 2700 },
        { code: 'super', name: 'Super', amount: 4200 }
      ]
    };
    return plans[provider.toLowerCase()] || [];
  };

  const getProvidersForUtility = (utilityType: string): string[] => {
    switch (utilityType) {
      case 'electricity': return SUPPORTED_PROVIDERS.ELECTRICITY;
      case 'airtime': return SUPPORTED_PROVIDERS.AIRTIME;
      case 'data': return SUPPORTED_PROVIDERS.DATA;
      case 'tv': return SUPPORTED_PROVIDERS.TV;
      default: return [];
    }
  };

  const validateForm = (): boolean => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a service provider');
      return false;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Please enter account/meter number');
      return false;
    }
    // For data, check if plan is selected instead of amount
    if (selectedUtility === 'data') {
      if (!selectedDataPlan) {
        Alert.alert('Error', 'Please select a data plan');
        return false;
      }
    } else {
      if (!amount.trim() || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return false;
      }
    }
    
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter customer phone number');
      return false;
    }
    return true;
  };

  const verifyCustomer = async () => {
    // For airtime, data, and TV, skip verification and go directly to payment
    if (selectedUtility === 'airtime' || selectedUtility === 'data') {
      if (!selectedProvider || !accountNumber || !amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      processPayment();
      return;
    }

    // For TV, check if plan is selected
    if (selectedUtility === 'tv') {
      if (!selectedProvider || !accountNumber || !selectedPlan) {
        Alert.alert('Error', 'Please select a provider, enter smartcard number, and choose a plan');
        return;
      }
      processPayment();
      return;
    }

    if (!validateForm()) return;
    setIsVerifying(true);
    try {
      const utilityService = UtilityPaymentService.getInstance();
      const verification = await utilityService.verifyCustomer({
        type: selectedUtility as any,
        serviceProvider: selectedProvider,
        accountNumber: accountNumber.trim(),
        ...(selectedUtility === 'electricity' && { meterType })
      });

      if (verification.code === '000') {
        setCustomerDetails(verification.content);
        Alert.alert(
          'Customer Verified',
          `Name: ${verification.content.Customer_Name}\nStatus: ${verification.content.Status}`,
          [{ text: 'Continue', onPress: () => {} }]
        );
      } else {
        Alert.alert('Verification Failed', verification.response_description);
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify customer details. Please check your inputs.');
    } finally {
      setIsVerifying(false);
    }
  };

  const processPayment = async () => {
    // For airtime/data/tv, skip customer details check (TV handles verification internally)
    if ((selectedUtility !== 'airtime' && selectedUtility !== 'data' && selectedUtility !== 'tv') && !customerDetails) {
      Alert.alert('Error', 'Please verify customer details first');
      return;
    }

    setIsProcessing(true);
    try {
      const walletData = await StorageService.getWalletData();
      if (!walletData) {
        Alert.alert('Error', 'Wallet not found. Please create a wallet first.');
        return;
      }

      const paymentRequest: UtilityPaymentRequest = {
        type: selectedUtility as any,
        serviceProvider: selectedProvider,
        accountNumber: accountNumber.trim(),
        amount: selectedUtility === 'data' && selectedDataPlan ? selectedDataPlan.amount : parseFloat(amount),
        // For airtime/data, use the phone number as both account and customer phone
        customerPhone: (selectedUtility === 'airtime' || selectedUtility === 'data') ? 
          accountNumber.trim() : customerPhone.trim(),
        ...(selectedUtility === 'electricity' && { meterType }),
        ...(selectedUtility === 'data' && selectedDataPlan && { variationCode: selectedDataPlan.code }),
        ...(selectedUtility === 'tv' && selectedPlan && { variationCode: selectedPlan, subscriptionType })
      };

      const utilityService = UtilityPaymentService.getInstance();
      const result = await utilityService.processUtilityPayment(walletData, paymentRequest);

      if (result.success) {
        // Prepare payment details for success modal
        const paymentDetails = {
          utilityType: selectedUtility!,
          provider: availableProviders.find(p => p.serviceID === selectedProvider)?.name || selectedProvider,
          amount: selectedUtility === 'data' && selectedDataPlan ? selectedDataPlan.amount : parseFloat(amount),
          accountNumber: accountNumber.trim(),
          transactionHash: result.transactionHash!,
          token: result.token,
          customerName: customerDetails?.Customer_Name
        };
        
        setPaymentResult(paymentDetails);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        loadRecentPayments();
      } else {
        Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <LinearGradient
      colors={[SparkColors.black, SparkColors.darkBrown]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Utility Payments</ThemedText>
          <ThemedText style={styles.subtitle}>Pay your bills with crypto</ThemedText>
        </View>

        <View style={styles.utilitiesGrid}>
          {utilities.map((utility, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.utilityCard}
              onPress={() => handleUtilityPress(utility)}
            >
              <View style={[styles.utilityIcon, { backgroundColor: utility.color }]}>
                <ThemedText style={styles.utilityIconText}>{utility.icon}</ThemedText>
              </View>
              <ThemedText style={styles.utilityName}>{utility.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentPayments}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Payments</ThemedText>
          {recentPayments.length > 0 ? (
            recentPayments.map((payment, index) => (
              <View key={index} style={styles.paymentCard}>
                <View style={styles.paymentInfo}>
                  <ThemedText style={styles.paymentService}>{payment.service}</ThemedText>
                  <ThemedText style={styles.paymentAmount}>${payment.amount}</ThemedText>
                </View>
                <ThemedText style={styles.paymentDate}>{payment.date}</ThemedText>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>No recent payments</ThemedText>
              <ThemedText style={styles.emptySubtext}>Your payment history will appear here</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      {paymentResult && (
        <UtilityPaymentSuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setPaymentResult(null);
          }}
          paymentDetails={paymentResult}
        />
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <LinearGradient
          colors={[SparkColors.black, SparkColors.darkBrown]}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <IconSymbol size={24} name="chevron.left" color={SparkColors.lightGray} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>
              {utilities.find(u => u.type === selectedUtility)?.name} Payment
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Service Provider Selection */}
            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Service Provider</ThemedText>
              <TouchableOpacity 
                style={styles.providerSelector}
                onPress={() => setShowProviderDropdown(!showProviderDropdown)}
              >
                <ThemedText style={styles.providerText}>
                  {selectedProvider ? 
                    (availableProviders.find(p => p.serviceID === selectedProvider)?.name || selectedProvider || 'Unknown Provider')
                    : 'Select Provider'}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={SparkColors.white} />
              </TouchableOpacity>
              
              {showProviderDropdown && (
                <View style={styles.providerDropdown}>
                  {isLoadingProviders ? (
                    <View style={[styles.providerOption, { flexDirection: 'row', alignItems: 'center' }]}>
                      <ActivityIndicator color={SparkColors.gold} />
                      <ThemedText style={[styles.providerOptionText, { marginLeft: 8 }]}>
                        Loading providers...
                      </ThemedText>
                    </View>
                  ) : (
                    availableProviders.map((provider) => (
                      <TouchableOpacity
                        key={provider.serviceID}
                        style={styles.providerOptionWithImage}
                        onPress={() => {
                          setSelectedProvider(provider.serviceID);
                          setShowProviderDropdown(false);
                          // Auto-fetch plans for TV when provider is selected
                          if (selectedUtility === 'tv') {
                            fetchPlans(provider.name);
                          }
                          // Auto-fetch data plans when provider is selected
                          if (selectedUtility === 'data') {
                            fetchDataPlans(provider.name);
                          }
                        }}
                      >
                        {provider.image && (
                          <Image
                            source={{ uri: provider.image }}
                            style={styles.providerImage}
                            resizeMode="contain"
                          />
                        )}
                        <View style={styles.providerInfo}>
                          <ThemedText style={styles.providerOptionText}>
                            {provider.name || 'Unknown Provider'}
                          </ThemedText>
                          <ThemedText style={styles.providerDetails}>
                            ₦{provider.minimium_amount || '0'} - ₦{provider.maximum_amount || '0'}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Meter Type for Electricity */}
            {selectedUtility === 'electricity' && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Meter Type</ThemedText>
                <View style={styles.meterTypeContainer}>
                  <TouchableOpacity
                    style={[styles.meterTypeButton, meterType === 'prepaid' && styles.meterTypeActive]}
                    onPress={() => setMeterType('prepaid')}
                  >
                    <ThemedText style={[styles.meterTypeText, meterType === 'prepaid' && styles.meterTypeActiveText]}>
                      Prepaid
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.meterTypeButton, meterType === 'postpaid' && styles.meterTypeActive]}
                    onPress={() => setMeterType('postpaid')}
                  >
                    <ThemedText style={[styles.meterTypeText, meterType === 'postpaid' && styles.meterTypeActiveText]}>
                      Postpaid
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Phone Number (for airtime/data), Smartcard Number (for TV), or Account Number */}
            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>
                {selectedUtility === 'electricity' ? 'Meter Number' : 
                 selectedUtility === 'airtime' || selectedUtility === 'data' ? 'Phone Number to Top Up' : 
                 selectedUtility === 'tv' ? 'Smartcard Number' :
                 'Account Number'}
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={accountNumber}
                onChangeText={(text) => {
                  setAccountNumber(text);
                  // Auto-fetch plans when smartcard number is entered for TV
                  if (selectedUtility === 'tv' && selectedProvider && text.length >= 10) {
                    fetchPlans(selectedProvider);
                  }
                }}
                placeholder={selectedUtility === 'electricity' ? 'Enter meter number' : 
                           selectedUtility === 'airtime' || selectedUtility === 'data' ? 'Enter phone number to top up' : 
                           selectedUtility === 'tv' ? 'Enter smartcard number' :
                           'Enter account number'}
                placeholderTextColor={SparkColors.darkGray}
                keyboardType={selectedUtility === 'airtime' || selectedUtility === 'data' ? 'phone-pad' : 'numeric'}
              />
            </View>

            {/* Subscription Type Selection (for Cable TV) */}
            {selectedUtility === 'tv' && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Subscription Type</ThemedText>
                <TouchableOpacity 
                  style={styles.providerSelector}
                  onPress={() => setShowSubscriptionTypeDropdown(!showSubscriptionTypeDropdown)}
                >
                  <ThemedText style={styles.providerText}>
                    {subscriptionType === 'change' ? 'New/Change Bouquet' : 'Renew Current Bouquet'}
                  </ThemedText>
                  <ThemedText style={styles.providerText}>▼</ThemedText>
                </TouchableOpacity>
                
                {showSubscriptionTypeDropdown && (
                  <View style={styles.providerDropdown}>
                    <TouchableOpacity 
                      style={styles.providerOption}
                      onPress={() => {
                        setSubscriptionType('change');
                        setShowSubscriptionTypeDropdown(false);
                      }}
                    >
                      <ThemedText style={styles.providerOptionText}>New/Change Bouquet</ThemedText>
                      <ThemedText style={[styles.providerOptionText, { fontSize: 12, opacity: 0.7 }]}>Subscribe to new or different package</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.providerOption}
                      onPress={() => {
                        setSubscriptionType('renew');
                        setShowSubscriptionTypeDropdown(false);
                      }}
                    >
                      <ThemedText style={styles.providerOptionText}>Renew Current Bouquet</ThemedText>
                      <ThemedText style={[styles.providerOptionText, { fontSize: 12, opacity: 0.7 }]}>Extend current subscription</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Plan Selection (for Cable TV) */}
            {selectedUtility === 'tv' && availablePlans.length > 0 && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Select Plan</ThemedText>
                <TouchableOpacity 
                  style={styles.providerSelector}
                  onPress={() => setShowPlanDropdown(!showPlanDropdown)}
                >
                  <ThemedText style={styles.providerText}>
                    {selectedPlan ? availablePlans.find(p => p.code === selectedPlan)?.name : 'Select Plan'}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={SparkColors.white} />
                </TouchableOpacity>
                
                {showPlanDropdown && (
                  <View style={styles.providerDropdown}>
                    {availablePlans.map((plan) => (
                      <TouchableOpacity
                        key={plan.code}
                        style={styles.providerOption}
                        onPress={() => {
                          setSelectedPlan(plan.code);
                          setAmount((plan.amount || 0).toString());
                          setShowPlanDropdown(false);
                        }}
                      >
                        <ThemedText style={styles.providerOptionText}>
                          {plan.name || 'Unknown Plan'} - ₦{(plan.amount || 0).toLocaleString()}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Data Plan Selection */}
            {selectedUtility === 'data' && selectedProvider && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Data Plan</ThemedText>
                <TouchableOpacity 
                  style={styles.providerSelector}
                  onPress={() => {
                    if (availableDataPlans.length === 0) {
                      fetchDataPlans(selectedProvider);
                    }
                    setShowDataPlanDropdown(!showDataPlanDropdown);
                  }}
                >
                  <ThemedText style={styles.providerText}>
                    {selectedDataPlan ? selectedDataPlan.name : 'Select Data Plan'}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={SparkColors.white} />
                </TouchableOpacity>
                
                {showDataPlanDropdown && (
                  <View style={styles.providerDropdown}>
                    {isLoadingDataPlans ? (
                      <View style={[styles.providerOption, { flexDirection: 'row', alignItems: 'center' }]}>
                        <ActivityIndicator color={SparkColors.gold} />
                        <ThemedText style={[styles.providerOptionText, { marginLeft: 8 }]}>
                          Loading data plans...
                        </ThemedText>
                      </View>
                    ) : (
                      availableDataPlans.map((plan, index) => (
                        <TouchableOpacity
                          key={`${plan.code}-${index}`}
                          style={styles.providerOption}
                          onPress={() => {
                            setSelectedDataPlan(plan);
                            setAmount(plan.amount.toString());
                            setShowDataPlanDropdown(false);
                          }}
                        >
                          <View>
                            <ThemedText style={styles.providerOptionText}>
                              {plan.name}
                            </ThemedText>
                            <ThemedText style={[styles.providerOptionText, { fontSize: 12, color: SparkColors.gold }]}>
                              ₦{plan.amount.toLocaleString()}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Loading Plans Indicator */}
            {selectedUtility === 'tv' && isLoadingPlans && (
              <View style={styles.inputSection}>
                <View style={[styles.providerSelector, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}>
                  <ActivityIndicator color={SparkColors.gold} />
                  <ThemedText style={[styles.providerText, { marginLeft: 8 }]}>
                    Loading plans...
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Amount */}
            {selectedUtility !== 'tv' && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>
                  Amount {selectedUtility === 'airtime' || selectedUtility === 'data' ? '(₦ Naira)' : ''}
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={selectedUtility === 'airtime' || selectedUtility === 'data' ? 'Enter amount in naira (e.g. 1000)' : 'Enter amount'}
                  placeholderTextColor={SparkColors.darkGray}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Amount Display for TV (read-only) */}
            {selectedUtility === 'tv' && selectedPlan && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Amount (₦ Naira)</ThemedText>
                <View style={[styles.textInput, { justifyContent: 'center' }]}>
                  <ThemedText style={{ color: SparkColors.gold, fontSize: 16, fontWeight: '600' }}>
                    ₦{parseFloat(amount || '0').toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Customer Phone (for electricity only) */}
            {selectedUtility === 'electricity' && (
              <View style={styles.inputSection}>
                <ThemedText style={styles.inputLabel}>Customer Phone</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="Enter customer phone number"
                  placeholderTextColor={SparkColors.darkGray}
                  keyboardType="phone-pad"
                />
              </View>
            )}
            
            {/* Customer Details */}
            {customerDetails && (
              <View style={styles.customerDetails}>
                <ThemedText style={styles.customerDetailsTitle}>Customer Details</ThemedText>
                <ThemedText style={styles.customerDetailsText}>
                  Name: {customerDetails.Customer_Name}
                </ThemedText>
                <ThemedText style={styles.customerDetailsText}>
                  Status: {customerDetails.Status}
                </ThemedText>
                {customerDetails.Address && (
                  <ThemedText style={styles.customerDetailsText}>
                    Address: {customerDetails.Address}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!customerDetails && selectedUtility === 'electricity' ? (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={verifyCustomer}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={SparkColors.black} />
                  ) : (
                    <ThemedText style={styles.verifyButtonText}>
                      Verify Customer
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={verifyCustomer}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={SparkColors.black} />
                  ) : (
                    <ThemedText style={styles.payButtonText}>
                      {selectedUtility === 'airtime' || selectedUtility === 'data' ? 'Buy Now' : 
                       selectedUtility === 'tv' ? 'Subscribe Now' : 'Pay Now'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    color: SparkColors.white,
    marginBottom: 8,
  },
  subtitle: {
    color: SparkColors.lightGray,
    fontSize: 16,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  utilityCard: {
    width: '48%',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  utilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  utilityIconText: {
    fontSize: 24,
    color: SparkColors.black,
  },
  utilityName: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentPayments: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: SparkColors.white,
    marginBottom: 16,
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    padding: 32,
  },
  emptyText: {
    color: SparkColors.lightGray,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: SparkColors.darkGray,
    fontSize: 14,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentService: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  paymentAmount: {
    color: SparkColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  paymentDate: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalTitle: {
    color: SparkColors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  providerSelector: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerText: {
    color: SparkColors.white,
    fontSize: 16,
  },
  providerDropdown: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  providerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
  },
  providerOptionText: {
    color: SparkColors.white,
    fontSize: 16,
  },
  providerOptionWithImage: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: SparkColors.brown,
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerDetails: {
    color: SparkColors.darkGray,
    fontSize: 12,
    marginTop: 2,
  },
  meterTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  meterTypeButton: {
    flex: 1,
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    alignItems: 'center',
  },
  meterTypeActive: {
    backgroundColor: SparkColors.gold,
    borderColor: SparkColors.gold,
  },
  meterTypeText: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  meterTypeActiveText: {
    color: SparkColors.black,
  },
  textInput: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SparkColors.brown,
    color: SparkColors.white,
    fontSize: 16,
  },
  customerDetails: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  customerDetailsTitle: {
    color: SparkColors.gold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customerDetailsText: {
    color: SparkColors.white,
    fontSize: 14,
    marginBottom: 8,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  verifyButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: SparkColors.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: SparkColors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: SparkColors.darkBrown,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SparkColors.brown,
  },
  actionTitle: {
    color: SparkColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: SparkColors.darkGray,
    fontSize: 14,
  },
});
