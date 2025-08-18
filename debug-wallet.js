const { RpcProvider } = require('starknet');

async function debugWallet() {
  console.log('=== Wallet Debug Tool ===');
  
  // Initialize provider
  const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8'
  });
  
  console.log('RPC Endpoint:', provider.channel.nodeUrl);
  
  // Token addresses
  const STRK_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
  const ETH_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  
  // Transaction hash from Voyager
  const txHash = '0x8acdacb177049ce7311f0e2176b7f27e3c1757f1cf7f14f2a54be97f071b1f';
  
  try {
    // Get transaction details
    console.log('\n=== Transaction Details ===');
    const tx = await provider.getTransaction(txHash);
    console.log('Transaction:', JSON.stringify(tx, null, 2));
    
    // Extract recipient from transaction calldata
    if (tx.calldata && tx.calldata.length > 1) {
      console.log('\n=== Transaction Calldata Analysis ===');
      console.log('Full calldata:', tx.calldata);
      console.log('Calldata[0] (num calls):', tx.calldata[0]);
      console.log('Calldata[1] (contract):', tx.calldata[1]);
      console.log('Calldata[2] (selector):', tx.calldata[2]);
      console.log('Calldata[3] (num params):', tx.calldata[3]);
      console.log('Calldata[4] (to address):', tx.calldata[4]);
      console.log('Calldata[5] (amount low):', tx.calldata[5]);
      console.log('Calldata[6] (amount high):', tx.calldata[6]);
      
      // The actual recipient is in calldata[4] for STRK transfers
      const recipient = tx.calldata[4];
      console.log('\n=== CORRECT RECIPIENT IDENTIFIED ===');
      console.log('Actual wallet recipient:', recipient);
      
      // Helper function to get and log token balance
      async function getTokenBalance(tokenAddress, tokenSymbol, walletAddress) {
        console.log(`\n=== Checking ${tokenSymbol} Balance ===`);
        console.log(`Token Address: ${tokenAddress}`);
        console.log(`Wallet Address: ${walletAddress}`);
        
        try {
          const result = await provider.callContract({
            contractAddress: tokenAddress,
            entrypoint: "balanceOf",
            calldata: [walletAddress],
          });
          
          console.log(`${tokenSymbol} Balance response:`, result);
          
          if (result && result.length >= 1) {
            let balanceInWei;
            
            if (result.length >= 2) {
              // Uint256 format (low, high)
              const low = BigInt(result[0]);
              const high = BigInt(result[1]) << 128n;
              balanceInWei = low + high;
              console.log(`${tokenSymbol} Raw balance (Uint256 - low):`, low.toString());
              console.log(`${tokenSymbol} Raw balance (Uint256 - high):`, high.toString());
            } else {
              // Single value format
              balanceInWei = BigInt(result[0]);
            }
            
            const balanceFormatted = (Number(balanceInWei) / 1e18).toFixed(6);
        
        console.log('=== MANUAL CALCULATION TEST ===');
        console.log('Your Voyager result: ["0x2f91b1d0fcd593075b", "0x0"]');
        const testLow = BigInt('0x2f91b1d0fcd593075b');
        const testHigh = BigInt('0x0');
        const testBalance = testLow + (testHigh << 128n);
        const testFormatted = (Number(testBalance) / 1e18).toFixed(6);
        console.log('Expected STRK balance:', testFormatted, 'STRK');
        console.log('Raw wei value:', testBalance.toString());
            
            console.log(`${tokenSymbol} Raw balance (wei):`, balanceInWei.toString());
            console.log(`${tokenSymbol} Formatted balance:`, balanceFormatted, tokenSymbol);
            
            return { raw: balanceInWei, formatted: balanceFormatted };
          } else {
            console.log(`${tokenSymbol} No balance data returned`);
            return { raw: 0n, formatted: '0.000000' };
          }
        } catch (error) {
          console.error(`Error fetching ${tokenSymbol} balance:`, error);
          return { raw: 0n, formatted: '0.000000' };
        }
      }
      
      // Check both STRK and ETH balances
      const strkBalance = await getTokenBalance(STRK_ADDRESS, 'STRK', recipient);
      const ethBalance = await getTokenBalance(ETH_ADDRESS, 'ETH', recipient);
      
      console.log('\n=== Balance Summary ===');
      console.log(`STRK: ${strkBalance.formatted} STRK`);
      console.log(`ETH: ${ethBalance.formatted} ETH`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugWallet();
