
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { BN, Program, Provider, web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, SolanaContractPrediction, SolanaContractStatus, BetPrediction, BetStatus } from '@/types/bet';

// Constants
// Using the real program ID provided by the user
const PROGRAM_ID = "9Y1rKMgRMaDxhkUkUn3ib9AJJqapjkzKqFrsMKwhBVVd";

// Solana connection
export const getSolanaConnection = () => {
  return new Connection(
    process.env.NODE_ENV === 'production' 
      ? 'https://api.devnet.solana.com' 
      : 'https://api.devnet.solana.com'
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
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    console.log(`Creating bet on Solana: token=${tokenMint}, prediction=${prediction}, duration=${durationMinutes}min, amount=${solAmount}SOL`);
    
    const connection = getSolanaConnection();
    const programId = new PublicKey(PROGRAM_ID);
    const betId = Math.floor(Date.now() / 1000);
    const betPDA = await findBetPDA(betId);

    // Find the counter PDA
    const [counterPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("counter")],
      programId
    );

    // Create transaction
    const durationSeconds = durationMinutes * 60;
    const solLamports = solAmount * web3.LAMPORTS_PER_SOL;

    const data = Buffer.alloc(1 + 32 + 1 + 8 + 8);
    data.writeUInt8(0, 0); // CreateBet instruction
    new PublicKey(tokenMint).toBuffer().copy(data, 1);
    data.writeUInt8(prediction === 'migrate' ? 0 : 1, 33);
    new BN(durationSeconds).toArrayLike(Buffer, 'le', 8).copy(data, 34);
    new BN(solLamports).toArrayLike(Buffer, 'le', 8).copy(data, 42);

    const instruction = new web3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: betPDA, isSigner: false, isWritable: true },
        { pubkey: counterPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    await connection.confirmTransaction(txId, 'confirmed');
    
    console.log(`Transaction confirmed: ${txId}`);
    return { betId };
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

    // Create transaction
    const data = Buffer.alloc(1 + 8);
    data.writeUInt8(1, 0); // CounterBet instruction
    new BN(betId).toArrayLike(Buffer, 'le', 8).copy(data, 1);

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
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    await connection.confirmTransaction(txId, 'confirmed');
    
    console.log(`Transaction confirmed: ${txId}`);
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

    const accountInfo = await connection.getAccountInfo(betPDA);
    if (!accountInfo) {
      console.log(`No account info found for bet ${betId}`);
      return null;
    }

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

    // Try to get token info - in a real implementation, you might want to fetch this from your database
    // or from a token registry
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
