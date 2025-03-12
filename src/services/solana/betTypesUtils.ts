
import { BetPrediction } from '@/types/bet';

// Map BetPrediction to SolanaContractPrediction values
export const getPredictionValue = (prediction: BetPrediction): number => {
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

// Convert database prediction to frontend format
export const convertToPredictionValue = (dbPrediction: string): BetPrediction => {
  if (dbPrediction === 'up') return 'migrate';
  if (dbPrediction === 'down') return 'die';
  return dbPrediction as BetPrediction;
};
