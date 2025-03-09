
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN, Program, Provider, web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, SolanaContractPrediction, SolanaContractStatus, BetPrediction, BetStatus } from '@/types/bet';

// Constants
const PROGRAM_ID = "9Y1rKMgRMaDxhkUkUn3ib9AJJqapjkzKqFrsMKwhBVVd";
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// Solana connection
export const getSolanaConnection = () => {
  console.log("Creating Solana connection to:", DEVNET_RPC_URL);
  return new Connection(
    DEVNET_RPC_URL,
    'confirmed'
  );
};

// Helper functions to convert between our frontend types and contract types
const convertPrediction = (prediction: BetPrediction): SolanaContractPrediction => {
  return prediction === 'migrate' 
    ? SolanaContractPrediction.Migrate 
    : SolanaContractPrediction.Die;
};

const convertStatus = (status: SolanaContractStatus): BetStatus => {
  switch (status) {
    case SolanaContractStatus.Open:
      return 'open';
    case SolanaContractStatus.Confirmed:
      return 'matched';
    case SolanaContractStatus.Closed:
      return 'closed';
    case SolanaContractStatus.Resolved:
      return 'completed';
    case SolanaContractStatus.Expired:
      return 'expired';
    default:
      return 'open';
  }
};

// Find the PDA for a bet account
export const findBetPDA = async (betId: number) => {
  const programId = new PublicKey(PROGRAM_ID);
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from("bet"),
      new BN(betId).toArrayLike(Buffer, 'le', 8)
    ],
    programId
  );
  return pda;
};

// Create a bet on the Solana blockchain
export const createSolanaBet = async (
  wallet: any,
  tokenMint: string,
  prediction: BetPrediction,
  durationMinutes: number,
  solAmount: number
): Promise<{ betId: number }> => {
  try {
    // Improved wallet validation to handle both types of wallet objects
    const walletAdapter = wallet?.adapter;
    const publicKey = wallet?.publicKey || walletAdapter?.publicKey;
    const isAdapterConnected = walletAdapter?.connected || false;
    
    console.log("Wallet state in createSolanaBet:", {
      hasPublicKey: !!publicKey,
      publicKeyString: publicKey?.toString(),
      hasAdapter: !!walletAdapter,
      adapterConnected: isAdapterConnected,
    });
    
    if (!publicKey) {
      throw new Error("Wallet not connected - no public key found");
    }
    
    console.log(`Creating bet on Solana (Devnet): token=${tokenMint}, prediction=${prediction}, duration=${durationMinutes}min, amount=${solAmount}SOL`);
    
    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    
    // Generate a unique bet ID based on timestamp
    const betId = Math.floor(Date.now() / 1000);
    console.log(`Generated betId: ${betId}`);
    
    // Find the bet PDA
    const betPDA = await findBetPDA(betId);
    console.log(`Bet PDA: ${betPDA.toString()}`);

    // Find the counter PDA
    const [counterPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("counter")],
      programId
    );
    console.log(`Counter PDA: ${counterPDA.toString()}`);

    // Create transaction
    const durationSeconds = durationMinutes * 60;
    const solLamports = solAmount * web3.LAMPORTS_PER_SOL;

    console.log(`Creating transaction with: duration=${durationSeconds}s, amount=${solLamports} lamports`);
    
    // Create instruction data
    const data = Buffer.alloc(1 + 32 + 1 + 8 + 8);
    data.writeUInt8(0, 0); // CreateBet instruction
    new PublicKey(tokenMint).toBuffer().copy(data, 1);
    data.writeUInt8(prediction === 'migrate' ? 0 : 1, 33);
    new BN(durationSeconds).toArrayLike(Buffer, 'le', 8).copy(data, 34);
    new BN(solLamports).toArrayLike(Buffer, 'le', 8).copy(data, 42);

    console.log(`Instruction data created: prediction=${prediction === 'migrate' ? 0 : 1}`);

    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: betPDA, isSigner: false, isWritable: true },
        { pubkey: counterPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = publicKey;
    
    // Get recent blockhash with a connection configured with 'confirmed' commitment
    const blockhashObj = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhashObj.blockhash;
    console.log(`Got blockhash: ${blockhashObj.blockhash}`);

    console.log(`Transaction created, getting signature from wallet`);

    // Determine which signing method to use based on what's available
    // First try adapter's signTransaction, then wallet's signTransaction
    const signTransaction = walletAdapter?.signTransaction || wallet?.signTransaction;
    
    if (!signTransaction) {
      throw new Error("Wallet does not support signTransaction method");
    }

    // Sign and send transaction
    try {
      console.log("Using signTransaction method:", !!signTransaction);
      const signedTx = await signTransaction(transaction);
      console.log(`Transaction signed, sending to Devnet`);
      
      const txId = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      
      console.log(`Transaction sent to Devnet with ID: ${txId}`);
      console.log(`Waiting for confirmation...`);
      
      const confirmation = await connection.confirmTransaction({
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: blockhashObj.lastValidBlockHeight,
        signature: txId
      }, 'confirmed');
      
      if (confirmation.value.err) {
        console.error("Transaction confirmed but with error:", confirmation.value.err);
        throw new Error(`Transaction error: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log(`Transaction confirmed! Bet created with ID: ${betId}`);
      return { betId };
    } catch (signError) {
      console.error("Error signing or sending transaction:", signError);
      throw signError;
    }
  } catch (error) {
    console.error("Error creating bet on Solana:", error);
    throw error;
  }
};

// Accept a bet
export const acceptSolanaBet = async (
  wallet: any,
  betId: number
): Promise<void> => {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    console.log(`Accepting bet on Solana: betId=${betId}`);
    
    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betPDA = await findBetPDA(betId);

    console.log(`Bet PDA: ${betPDA.toString()}`);

    // Create transaction
    const data = Buffer.alloc(1 + 8);
    data.writeUInt8(1, 0); // CounterBet instruction
    new BN(betId).toArrayLike(Buffer, 'le', 8).copy(data, 1);

    console.log(`Creating instruction for counterbet`);

    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: betPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

    console.log(`Transaction created, getting signature from wallet`);

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    console.log(`Transaction signed, sending to network`);
    
    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    
    console.log(`Transaction sent with ID: ${txId}`);
    console.log(`Waiting for confirmation...`);
    
    await connection.confirmTransaction({
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight,
      signature: txId
    }, 'confirmed');
    
    console.log(`Transaction confirmed! Bet accepted with ID: ${betId}`);
  } catch (error) {
    console.error("Error accepting bet on Solana:", error);
    throw error;
  }
};

// Get bet data from the blockchain
export const getSolanaBetData = async (betId: number): Promise<Bet | null> => {
  try {
    console.log(`Getting bet data from Solana: betId=${betId}`);
    
    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betPDA = await findBetPDA(betId);

    console.log(`Bet PDA: ${betPDA.toString()}`);

    const accountInfo = await connection.getAccountInfo(betPDA);
    if (!accountInfo) {
      console.log(`No account info found for bet ${betId}`);
      return null;
    }

    console.log(`Account data found, deserializing...`);

    // Deserializing from binary data
    const data = accountInfo.data;
    
    const id = new BN(data.slice(0, 8), 'le').toNumber();
    const tokenMint = new PublicKey(data.slice(8, 40)).toString();
    const bettor1 = new PublicKey(data.slice(40, 72)).toString();
    
    const bettor2Option = data[72];
    let bettor2 = null;
    if (bettor2Option === 1) {
      bettor2 = new PublicKey(data.slice(73, 105)).toString();
    }
    
    const predictionOffset = bettor2Option === 1 ? 105 : 73;
    const predictionBettor1 = data[predictionOffset];
    const duration = new BN(data.slice(predictionOffset + 1, predictionOffset + 9), 'le').toNumber();
    const creationTime = new BN(data.slice(predictionOffset + 9, predictionOffset + 17), 'le').toNumber();
    const startTime = new BN(data.slice(predictionOffset + 17, predictionOffset + 25), 'le').toNumber();
    const endTime = new BN(data.slice(predictionOffset + 25, predictionOffset + 33), 'le').toNumber();
    const initialMarketCap = new BN(data.slice(predictionOffset + 33, predictionOffset + 41), 'le').toNumber();
    const solAmount = new BN(data.slice(predictionOffset + 41, predictionOffset + 49), 'le').toNumber() / web3.LAMPORTS_PER_SOL;
    const status = data[predictionOffset + 49];

    console.log(`Successfully deserialized bet data: token=${tokenMint}, initiator=${bettor1}, status=${status}`);

    // Try to get token info
    const tokenName = "Unknown Token";
    const tokenSymbol = "UNKNOWN";

    return {
      id: betId.toString(),
      tokenId: tokenMint,
      tokenName,
      tokenSymbol,
      initiator: bettor1,
      counterParty: bettor2,
      amount: solAmount,
      prediction: predictionBettor1 === SolanaContractPrediction.Migrate ? 'migrate' : 'die',
      timestamp: creationTime * 1000,
      expiresAt: endTime * 1000,
      status: convertStatus(status),
      initialMarketCap,
      duration: duration / 60, // Convert seconds to minutes
      onChainBetId: betId.toString()
    };
  } catch (error) {
    console.error("Error fetching bet data from Solana:", error);
    return null;
  }
};
