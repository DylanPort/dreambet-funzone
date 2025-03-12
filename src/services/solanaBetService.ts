import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BetPrediction, Bet } from '@/types/bet';
import { toast } from '@/hooks/use-toast';
import { createSupabaseBet } from './supabaseService';

// Mock PDA (Program Derived Address) for bet contract
const BET_PROGRAM_ID = new PublicKey('BETh1cV519tFPhe6GWzGJmcfdshugH7XAi3iNGnXx5z');

// Map BetPrediction to SolanaContractPrediction values
const getPredictionValue = (prediction: BetPrediction): number => {
  switch (prediction) {
    case 'migrate':
    case 'up':
      return 1;
    case 'die':
    case 'down':
      return 0;
    default:
      throw new Error(`Invalid prediction: ${prediction}`);
  }
};

// Function to safely get wallet public key
const getWalletPublicKey = (wallet: any): PublicKey => {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const publicKey = wallet.publicKey || wallet.adapter?.publicKey;
  if (!publicKey) {
    throw new Error('Wallet public key not found');
  }
  
  return publicKey;
};

// Function to create a bet on Solana blockchain
export const createSolanaBet = async (
  wallet: any,
  tokenMint: string,
  tokenName: string,
  tokenSymbol: string,
  prediction: BetPrediction,
  durationMinutes: number,
  solAmount: number
): Promise<{ betId: number; txSignature: string }> => {
  try {
    // Validate wallet connection
    const publicKey = getWalletPublicKey(wallet);
    console.log(`Creating bet with wallet: ${publicKey.toString()}`);

    // Convert duration from minutes to seconds
    const durationSeconds = durationMinutes * 60;

    // Log bet details
    console.log(`Creating Solana bet for token: ${tokenMint} (${tokenName})`);
    console.log(`Bettor: ${publicKey.toString()}`);
    console.log(`Prediction: ${prediction}`);
    console.log(`Amount: ${solAmount} SOL`);
    console.log(`Duration: ${durationMinutes} minutes (${durationSeconds} seconds)`);

    // Use a slightly more reliable RPC URL
    const rpcUrl = process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    console.log(`Using RPC URL: ${rpcUrl}`);
    
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // For local development: Check if we're in test/development mode to bypass actual chain interaction
    const isTestMode = process.env.NODE_ENV === 'development' || !rpcUrl.includes('mainnet');
    console.log(`Running in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

    let txSignature: string;
    let betId: number;

    if (isTestMode) {
      // In test mode, simulate the transaction with a local mock
      console.log("Using test mode simulation for bet creation");
      
      // Generate random IDs for development purposes
      betId = Math.floor(Math.random() * 9000) + 1000;
      txSignature = 'simulated_' + Math.random().toString(36).substring(2, 15);
      
      // Simulate a short delay to mimic blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Simulated bet created: ID ${betId}, tx: ${txSignature}`);
      
      // Create a record in Supabase for the simulated bet
      try {
        await createSupabaseBet(
          tokenMint,
          prediction,
          durationMinutes,
          solAmount,
          publicKey.toString(),
          betId.toString(),
          txSignature
        );
      } catch (error) {
        console.warn("Failed to create Supabase record for simulated bet:", error);
        // Continue anyway since this is just for data consistency
      }
    } else {
      // In production mode, create a real transaction
      const recentBlockhash = await connection.getLatestBlockhash('confirmed');
      
      // Create a new transaction
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: recentBlockhash.blockhash,
      });

      // Simplified: In a real app, this would be an actual program instruction
      const predictionValue = getPredictionValue(prediction);
      const mockInstruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey(tokenMint), isSigner: false, isWritable: false },
        ],
        programId: BET_PROGRAM_ID,
        data: Buffer.from([
          predictionValue,
          ...new Uint8Array(new Float64Array([solAmount]).buffer),
          ...new Uint8Array(new Uint32Array([durationSeconds]).buffer),
        ]),
      });

      // Also add a small SOL transfer to ensure the transaction is seen as valid
      // This helps with some wallet blockers
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Transfer to self
          lamports: 100, // Very small amount (0.0000001 SOL)
        })
      );

      transaction.add(mockInstruction);

      // Try to sign and send transaction
      let signedTransaction;
      try {
        console.log("Attempting to sign transaction...");
        
        // Check each possible way to sign the transaction
        if (typeof wallet.signTransaction === 'function') {
          console.log("Using wallet.signTransaction method");
          signedTransaction = await wallet.signTransaction(transaction);
        } 
        else if (wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
          console.log("Using wallet.adapter.signTransaction method");
          signedTransaction = await wallet.adapter.signTransaction(transaction);
        }
        else if (wallet.signAllTransactions) {
          console.log("Using wallet.signAllTransactions method");
          const signedTransactions = await wallet.signAllTransactions([transaction]);
          signedTransaction = signedTransactions[0];
        }
        else {
          throw new Error("Wallet does not have a compatible transaction signing method");
        }
        
        console.log("Transaction signed successfully");
      } catch (err: any) {
        console.error("Error during transaction signing:", err);
        
        // Provide clearer error messages for common wallet issues
        if (err.message && err.message.includes('User rejected')) {
          throw new Error("Transaction was rejected by the wallet. Please try again.");
        }
        
        if (err.message && err.message.includes("'emit'")) {
          throw new Error("Wallet connection issue: Please refresh the page and try again");
        }
        
        if (err.message && err.message.includes("blocked")) {
          throw new Error("Your wallet blocked this transaction. For testing, you can create a simulated bet instead.");
        }
        
        // Fallback to simulated transaction if we're in development
        if (isTestMode) {
          console.log("Falling back to simulated transaction due to signing error");
          betId = Math.floor(Math.random() * 9000) + 1000;
          txSignature = 'simulated_fallback_' + Math.random().toString(36).substring(2, 15);
          
          // Create a record in Supabase for the simulated bet
          try {
            await createSupabaseBet(
              tokenMint,
              prediction,
              durationMinutes,
              solAmount,
              publicKey.toString(),
              betId.toString(),
              txSignature
            );
          } catch (error) {
            console.warn("Failed to create Supabase record for simulated bet:", error);
          }
          
          console.log(`Simulated bet created: ID ${betId}, tx: ${txSignature}`);
          
          // Show an informative toast
          toast({
            title: "Simulated Bet Created",
            description: "Your wallet blocked the real transaction, so we created a simulated bet for testing purposes.",
            variant: "default",
          });
          
          return { betId, txSignature };
        }
        
        throw err;
      }

      try {
        // Actually send the transaction
        console.log("Sending signed transaction to network...");
        txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log(`Transaction sent: ${txSignature}`);
        
        // Generate a consistent bet ID based on transaction signature
        const txSignatureBytes = Buffer.from(txSignature);
        betId = txSignatureBytes.reduce((acc, byte) => acc + byte, 0) % 10000;
        
        // Create a record in Supabase for the real bet
        try {
          await createSupabaseBet(
            tokenMint,
            prediction,
            durationMinutes,
            solAmount,
            publicKey.toString(),
            betId.toString(),
            txSignature
          );
        } catch (error) {
          console.warn("Failed to create Supabase record for real bet:", error);
        }
      } catch (sendError: any) {
        console.error("Error sending transaction:", sendError);
        
        // If we're in test mode, fall back to simulation
        if (isTestMode) {
          console.log("Falling back to simulated transaction due to sending error");
          betId = Math.floor(Math.random() * 9000) + 1000;
          txSignature = 'simulated_fallback_' + Math.random().toString(36).substring(2, 15);
          
          // Create a record in Supabase for the simulated bet
          try {
            await createSupabaseBet(
              tokenMint,
              prediction,
              durationMinutes,
              solAmount,
              publicKey.toString(),
              betId.toString(),
              txSignature
            );
          } catch (error) {
            console.warn("Failed to create Supabase record for simulated bet:", error);
          }
          
          toast({
            title: "Simulated Bet Created",
            description: "Transaction failed, but we created a simulated bet for testing purposes.",
            variant: "default",
          });
          
          return { betId, txSignature };
        }
        
        // Otherwise propagate the error
        throw sendError;
      }
    }

    console.log(`Bet created with ID: ${betId}, tx: ${txSignature}`);
    
    // Store bet in local storage as a fallback for persistence
    const localBet: Bet = {
      id: `local-${Date.now()}`,
      tokenId: tokenMint,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      initiator: publicKey.toString(),
      amount: solAmount,
      prediction: prediction,
      timestamp: Date.now(),
      expiresAt: Date.now() + (durationMinutes * 60 * 1000),
      status: 'open',
      duration: durationMinutes,
      onChainBetId: betId.toString(),
      transactionSignature: txSignature
    };
    
    try {
      // Get existing bets from local storage
      const existingBetsJson = localStorage.getItem('localBets');
      const existingBets = existingBetsJson ? JSON.parse(existingBetsJson) : [];
      
      // Add new bet
      existingBets.push(localBet);
      
      // Save back to local storage
      localStorage.setItem('localBets', JSON.stringify(existingBets));
      console.log("Bet saved to local storage");
    } catch (err) {
      console.warn("Failed to save bet to local storage:", err);
    }

    // Display a global toast notification for everyone about the new bet
    toast({
      title: "New Bet Created! 🎯",
      description: `A new bet of ${solAmount} SOL has been placed predicting the token will ${prediction}`,
      variant: "default",
    });

    // Broadcast a custom event to notify all components about the new bet
    const newBetEvent = new CustomEvent('newBetCreated', { 
      detail: { 
        betId,
        tokenId: tokenMint,
        tokenName,
        tokenSymbol,
        amount: solAmount,
        prediction,
        txSignature
      } 
    });
    window.dispatchEvent(newBetEvent);

    return {
      betId,
      txSignature,
    };
  } catch (error) {
    console.error('Error creating Solana bet:', error);
    throw error;
  }
};

// Function to accept a bet on Solana blockchain
export const acceptSolanaBet = async (
  wallet: any,
  betId: number
): Promise<{ txSignature: string }> => {
  try {
    // Validate wallet connection
    const publicKey = getWalletPublicKey(wallet);
    console.log(`Accepting bet ID: ${betId} with wallet: ${publicKey.toString()}`);

    // Use a slightly more reliable RPC URL
    const rpcUrl = process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // For local development: Check if we're in test/development mode to bypass actual chain interaction
    const isTestMode = process.env.NODE_ENV === 'development' || !rpcUrl.includes('mainnet');
    console.log(`Running in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode for accepting bet`);

    let txSignature: string;

    if (isTestMode) {
      // In test mode, simulate the transaction with a local mock
      console.log("Using test mode simulation for accepting bet");
      
      txSignature = 'accept_simulated_' + Math.random().toString(36).substring(2, 15);
      
      // Simulate a short delay to mimic blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Simulated bet acceptance: tx: ${txSignature}`);
    } else {
      // In production mode, create a real transaction
      const recentBlockhash = await connection.getLatestBlockhash('confirmed');
      
      // Create a new transaction
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: recentBlockhash.blockhash,
      });

      // Create a mock instruction for accepting the bet
      const mockInstruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: BET_PROGRAM_ID,
        data: Buffer.from([
          ...new Uint8Array(new Uint32Array([betId]).buffer)
        ]),
      });

      transaction.add(mockInstruction);

      // Try to sign and send transaction
      let signedTransaction;
      try {
        console.log("Attempting to sign accept bet transaction...");
        
        if (typeof wallet.signTransaction === 'function') {
          console.log("Using wallet.signTransaction method");
          signedTransaction = await wallet.signTransaction(transaction);
        } 
        else if (wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
          console.log("Using wallet.adapter.signTransaction method");
          signedTransaction = await wallet.adapter.signTransaction(transaction);
        }
        else if (wallet.signAllTransactions) {
          console.log("Using wallet.signAllTransactions method");
          const signedTransactions = await wallet.signAllTransactions([transaction]);
          signedTransaction = signedTransactions[0];
        }
        else {
          throw new Error("Wallet does not have a compatible transaction signing method");
        }
      } catch (err: any) {
        console.error("Error during transaction signing for bet acceptance:", err);
        
        // If we're in test mode, fall back to simulation
        if (isTestMode) {
          console.log("Falling back to simulated acceptance due to signing error");
          txSignature = 'accept_simulated_fallback_' + Math.random().toString(36).substring(2, 15);
          
          toast({
            title: "Simulated Bet Acceptance",
            description: "Your wallet blocked the real transaction, so we created a simulated acceptance for testing.",
            variant: "default",
          });
          
          return { txSignature };
        }
        
        throw err;
      }

      try {
        // Send the transaction
        txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log(`Bet acceptance transaction sent: ${txSignature}`);
      } catch (sendError: any) {
        console.error("Error sending bet acceptance transaction:", sendError);
        
        // If we're in test mode, fall back to simulation
        if (isTestMode) {
          console.log("Falling back to simulated acceptance due to sending error");
          txSignature = 'accept_simulated_fallback_' + Math.random().toString(36).substring(2, 15);
          
          toast({
            title: "Simulated Bet Acceptance",
            description: "Transaction failed, but we created a simulated acceptance for testing.",
            variant: "default",
          });
          
          return { txSignature };
        }
        
        throw sendError;
      }
    }

    console.log(`Bet accepted on-chain, tx: ${txSignature}`);

    // Display a toast notification when a bet is accepted
    toast({
      title: "Bet Accepted! 🤝",
      description: `Bet #${betId} has been accepted and is now active.`,
      variant: "default",
    });

    // Broadcast a custom event to notify all components about the accepted bet
    const betAcceptedEvent = new CustomEvent('betAccepted', { 
      detail: { betId, txSignature } 
    });
    window.dispatchEvent(betAcceptedEvent);

    return {
      txSignature,
    };
  } catch (error) {
    console.error('Error accepting Solana bet:', error);
    throw error;
  }
};

// Function to get bet data from Solana blockchain
export const getSolanaBetData = async (betId: number): Promise<Bet | null> => {
  // This is a mock implementation - in a real app, you would query the blockchain
  console.log(`Fetching bet data for ID: ${betId}`);
  
  try {
    // First try to find the bet in local storage
    const localBetsJson = localStorage.getItem('localBets');
    if (localBetsJson) {
      const localBets = JSON.parse(localBetsJson);
      const matchingBet = localBets.find((bet: Bet) => bet.onChainBetId === betId.toString());
      
      if (matchingBet) {
        console.log("Found bet in local storage:", matchingBet);
        return matchingBet;
      }
    }
    
    // Simulate a delay like a real blockchain query
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return null 30% of the time to simulate non-existent bets
    if (Math.random() < 0.3) {
      return null;
    }
    
    // Create mock bet data
    const mockBet: Bet = {
      id: `solana-${betId}`,
      tokenId: 'GALn4FcBs5PxZkhLX8DGFEZWAHdSD8LiWo48s9yPpump',
      tokenName: 'Mock Token',
      tokenSymbol: 'MOCK',
      initiator: '7FzXBBPjzrNJbm9MrZKZcyvP3ojVeYPUG2hTuzV892Fj',
      amount: 0.1,
      prediction: Math.random() > 0.5 ? 'up' : 'down',
      timestamp: Date.now() - 3600000, // 1 hour ago
      expiresAt: Date.now() + 3600000, // 1 hour from now
      status: 'open',
      duration: 60,
      onChainBetId: betId.toString(),
      transactionSignature: 'mock_tx_' + Math.random().toString(36).substring(2, 15)
    };
    
    return mockBet;
  } catch (error) {
    console.error('Error fetching bet data:', error);
    return null;
  }
};
