// Test USDC balance fetching with updated contract address
require('react-native-get-random-values');
const { RpcProvider } = require('starknet');

const testUSDCBalance = async () => {
  console.log('Testing USDC balance fetching with updated contract address...');
  
  const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8'
  });

  // Updated USDC contract address from official starknet-addresses repo
  const USDC_ADDRESS = '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080';
  
  // Test wallet address (replace with actual wallet address from your app)
  const TEST_WALLET = '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

  try {
    console.log('USDC Contract:', USDC_ADDRESS);
    console.log('Test Wallet:', TEST_WALLET);
    console.log('RPC Endpoint:', provider.channel.nodeUrl);

    const result = await provider.callContract({
      contractAddress: USDC_ADDRESS,
      entrypoint: "balanceOf",
      calldata: [TEST_WALLET],
    });

    console.log('USDC Balance Response:', result);

    if (result && result.length > 0) {
      if (result.length >= 2) {
        // Uint256 format (low, high)
        const low = BigInt(result[0]);
        const high = BigInt(result[1]) << 128n;
        const balanceInWei = low + high;
        const balanceFormatted = Number(balanceInWei) / (10 ** 6); // USDC has 6 decimals
        
        console.log('USDC Balance Details:', {
          low: low.toString(),
          high: high.toString(),
          combined: balanceInWei.toString(),
          formatted: balanceFormatted,
          display: `${balanceFormatted.toFixed(6)} USDC`
        });
      } else {
        // Single value format
        const balanceInWei = BigInt(result[0]);
        const balanceFormatted = Number(balanceInWei) / (10 ** 6);
        
        console.log('USDC Balance (single value):', {
          raw: balanceInWei.toString(),
          formatted: balanceFormatted,
          display: `${balanceFormatted.toFixed(6)} USDC`
        });
      }
    } else {
      console.log('No balance data returned');
    }

    console.log('✅ USDC balance test completed successfully');
    
  } catch (error) {
    console.error('❌ USDC balance test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      data: error.data
    });
  }
};

testUSDCBalance();
