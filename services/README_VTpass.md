# VTpass Integration for Spark Wallet

Complete implementation of VTpass API integration for utility payments in Spark Wallet. This enables users to pay electricity bills, buy airtime, purchase data bundles, and renew TV subscriptions using USDC tokens.

## Architecture Overview

```
User (Spark Wallet) 
    ↓ USDC Payment
Spark Payment Processor Contract (StarkNet)
    ↓ Service Fulfillment  
VTpass API (Nigerian Utility Services)
    ↓ Real Service Delivery
Service Providers (PHED, MTN, DSTV, etc.)
```

## Files Created

### 1. `VTpassService.ts`
Core VTpass API integration with full functionality:
- **Authentication**: API key-based auth for sandbox/live environments
- **Service Verification**: Validate meter numbers, smart cards before payment
- **Payment Processing**: Electricity, airtime, data, TV subscriptions
- **Transaction Status**: Check payment status and get receipts
- **Validation**: Nigerian phone number validation and formatting

### 2. `VTpassConfig.ts`
Configuration management for API credentials:
- **Environment Management**: Sandbox vs Live configuration
- **Credential Storage**: Secure API key management
- **Initialization**: Easy setup for different environments

### 3. `UtilityPaymentService.ts`
Complete integration layer connecting Spark Wallet to VTpass:
- **End-to-End Flow**: USDC payment → VTpass service fulfillment
- **Service Mapping**: Maps UI selections to VTpass service IDs
- **Error Handling**: Comprehensive error management and validation
- **Receipt Generation**: Transaction receipts with all details

## Supported Services

### Electricity Payments
- **PHED** - Port Harcourt Electricity Distribution Company
- **IKEDC** - Ikeja Electricity Distribution Company  
- **EKEDC** - Eko Electricity Distribution Company
- **KEDCO** - Kano Electricity Distribution Company
- **JOS** - Jos Electricity Distribution PLC
- **Types**: Prepaid (token generation) & Postpaid (bill payment)

### Telecom Services
- **Airtime**: MTN, Airtel, Glo, 9mobile
- **Data Bundles**: All major networks with various plans
- **Validation**: Automatic phone number validation

### TV Subscriptions
- **DSTV**: All packages and bouquets
- **GOTV**: All subscription plans
- **Startimes**: All available packages

## Usage Examples

### Initialize VTpass Service

```typescript
import UtilityPaymentService from './services/UtilityPaymentService';
import VTpassConfigManager from './services/VTpassConfig';

// Initialize with sandbox credentials for testing
const service = UtilityPaymentService.getInstance();
service.initialize(VTpassConfigManager.getSandboxConfig());
```

### Pay Electricity Bill

```typescript
const paymentRequest = {
  type: 'electricity' as const,
  serviceProvider: 'PHED',
  accountNumber: '1234567890', // Meter number
  amount: 5000, // 5000 USDC
  customerPhone: '08012345678',
  meterType: 'prepaid' as const
};

const result = await service.processUtilityPayment(walletData, paymentRequest);

if (result.success) {
  console.log('Payment successful!');
  console.log('Transaction Hash:', result.transactionHash);
  console.log('Prepaid Token:', result.token);
} else {
  console.error('Payment failed:', result.error);
}
```

### Buy Airtime

```typescript
const airtimeRequest = {
  type: 'airtime' as const,
  serviceProvider: 'MTN',
  accountNumber: '08012345678', // Phone number to recharge
  amount: 1000, // 1000 USDC
  customerPhone: '08012345678'
};

const result = await service.processUtilityPayment(walletData, airtimeRequest);
```

### Purchase Data Bundle

```typescript
// First get available data plans
const dataPlans = await service.getDataPlans('MTN');

const dataRequest = {
  type: 'data' as const,
  serviceProvider: 'MTN',
  accountNumber: '08012345678',
  amount: 2000,
  customerPhone: '08012345678',
  variationCode: 'mtn-20gb-30days' // From data plans
};

const result = await service.processUtilityPayment(walletData, dataRequest);
```

### Verify Customer Details

```typescript
// Verify meter number before payment
const verification = await service.verifyCustomer({
  type: 'electricity',
  serviceProvider: 'PHED',
  accountNumber: '1234567890',
  meterType: 'prepaid'
});

console.log('Customer Name:', verification.content.Customer_Name);
console.log('Meter Status:', verification.content.Status);
```

## Integration with Spark Wallet UI

### 1. Update Utility Screen
Add service provider selection, account number input, and amount selection.

### 2. Payment Flow
1. User selects service type and provider
2. Enters account details (meter number, phone, smart card)
3. System verifies account details via VTpass
4. User confirms payment amount
5. USDC payment processed via Spark Payment Processor
6. Service fulfilled via VTpass API
7. Receipt displayed with transaction details

### 3. Transaction History
Store VTpass transaction IDs alongside StarkNet transaction hashes for complete audit trail.

## Environment Setup

### Sandbox Testing (Recommended)
1. Register at: https://sandbox.vtpass.com/register
2. Generate API keys from dashboard
3. Use sandbox configuration in app
4. Test all services with pre-funded sandbox wallet

### Production Deployment
1. Register at: https://vtpass.com/register
2. Complete KYC verification
3. Request API access from VTpass support
4. Switch to live configuration
5. Deploy with proper error handling

## Security Considerations

- **API Keys**: Store securely using React Native Keychain
- **Validation**: Always verify service details before payment
- **Error Handling**: Implement retry logic for network failures
- **Logging**: Log transactions but never log sensitive data
- **Rate Limiting**: Respect VTpass API rate limits

## Error Handling

The service includes comprehensive error handling:
- **Network Errors**: Automatic retry with exponential backoff
- **Validation Errors**: Clear user-friendly error messages
- **Service Errors**: Proper error codes from VTpass API
- **Payment Failures**: Rollback mechanisms where possible

## Testing Strategy

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test complete payment flows
3. **Sandbox Testing**: Use VTpass sandbox for all testing
4. **Error Scenarios**: Test failure cases and edge conditions
5. **Performance Tests**: Ensure acceptable response times

## Deployment Checklist

- [ ] VTpass sandbox account created
- [ ] API keys generated and stored securely
- [ ] All service types tested in sandbox
- [ ] Error handling implemented
- [ ] UI integration completed
- [ ] Transaction logging implemented
- [ ] Production API access requested
- [ ] Live environment testing completed

## Support and Troubleshooting

- **VTpass Support**: support@vtpass.com
- **API Documentation**: https://vtpass.com/documentation
- **Sandbox Environment**: https://sandbox.vtpass.com
- **Technical Support**: Skype "vtpass.techsupport"

This implementation provides a complete, production-ready integration between Spark Wallet and VTpass API, enabling real utility payments with USDC tokens on StarkNet.
