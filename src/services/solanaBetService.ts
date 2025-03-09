
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { BetPrediction, Bet } from '@/types/bet';
import { toast } from '@/hooks/use-toast';

// Mock PDA (Program Derived Address) for bet contract
const BET_PROGRAM_ID = new PublicKey('BETh1cV519tFPhe6GWzGJmcfdshugH7XAi3iNGnXx5z');

// This is a simplified mock implementation for demo purposes
// In a real app, you would interact with an actual on-chain program

// Function to create a bet on Solana blockchain
export const createSolanaBet = async (
  wallet: any,
  tokenMint: string,
  prediction: BetPrediction,
  durationMinutes: number,
  solAmount: number
): Promise<{ betId: number; txSignature: string }> => {
  try {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    // Add additional validation for wallet.publicKey or wallet.adapter.publicKey
    const publicKey = wallet.publicKey || wallet.adapter?.publicKey;
    if (!publicKey) {
      throw new Error('Wallet public key not found');
    }

    // Convert duration from minutes to seconds
    const durationSeconds = durationMinutes * 60;

    // For demonstration purposes, we're not actually sending a transaction
    // but simulating the creation of a bet ID
    console.log(`Creating Solana bet for token: ${tokenMint}`);
    console.log(`Bettor: ${publicKey.toString()}`);
    console.log(`Prediction: ${prediction}`);
    console.log(`Amount: ${solAmount} SOL`);
    console.log(`Duration: ${durationMinutes} minutes (${durationSeconds} seconds)`);

    // Get current blockhash
    const connection = new Connection(
      process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    // Create a mock transaction
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    
    // Create a new transaction
    const transaction = new Transaction({
      feePayer: publicKey,
      recentBlockhash: recentBlockhash.blockhash,
    });

    // Simplified: In a real app, this would be an actual program instruction
    const predictionValue = prediction === 'migrate' ? 1 : 0;
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

    transaction.add(mockInstruction);

    // Safe way to attempt wallet signing
    let signedTransaction;
    try {
      // Check if wallet.signTransaction exists and is a function
      if (typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } 
      // Fall back to adapter if available
      else if (wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      }
      else {
        throw new Error("Wallet does not have a signTransaction method");
      }
    } catch (err: any) {
      console.error("Error during transaction signing:", err);
      
      // Check specifically for emit undefined error
      if (err.message && err.message.includes("'emit'")) {
        throw new Error("Wallet connection issue: Please refresh the page and try again");
      }
      
      throw err;
    }

    // Simulate transaction submission - in a real app, you would send it
    // const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
    const txSignature = 'simulated_' + Math.random().toString(36).substring(2, 15);
    
    // Generate a random bet ID between 1000-9999 for demo purposes
    const betId = Math.floor(Math.random() * 9000) + 1000;

    console.log(`Bet created on-chain with ID: ${betId}, tx: ${txSignature}`);

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
        amount: solAmount,
        prediction
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
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // For demonstration purposes, we're simulating accepting a bet
    console.log(`Accepting Solana bet ID: ${betId}`);
    console.log(`Counter-party: ${wallet.publicKey.toString()}`);

    // Creating a mock transaction
    const connection = new Connection(
      process.env.VITE_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
    });

    // Create a mock instruction for accepting the bet
    const mockInstruction = new TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: BET_PROGRAM_ID,
      data: Buffer.from([
        ...new Uint8Array(new Uint32Array([betId]).buffer)
      ]),
    });

    transaction.add(mockInstruction);

    // Safe way to attempt wallet signing
    let signedTransaction;
    try {
      // Check if wallet.signTransaction exists and is a function
      if (typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } 
      // Fall back to adapter if available
      else if (wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      }
      else {
        throw new Error("Wallet does not have a signTransaction method");
      }
    } catch (err) {
      console.error("Error during transaction signing:", err);
      throw err;
    }

    // Simulate transaction submission
    const txSignature = 'accept_' + Math.random().toString(36).substring(2, 15);

    console.log(`Bet accepted on-chain, tx: ${txSignature}`);

    // Display a toast notification when a bet is accepted
    toast({
      title: "Bet Accepted! 🤝",
      description: `Bet #${betId} has been accepted and is now active.`,
      variant: "default",
    });

    // Broadcast a custom event to notify all components about the accepted bet
    const betAcceptedEvent = new CustomEvent('betAccepted', { 
      detail: { betId } 
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
    prediction: Math.random() > 0.5 ? 'migrate' : 'die',
    timestamp: Date.now() - 3600000, // 1 hour ago
    expiresAt: Date.now() + 3600000, // 1 hour from now
    status: 'open',
    duration: 60,
    onChainBetId: betId.toString()
  };
  
  return mockBet;
};
