
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowDown, ArrowUp, Check, X, Info } from 'lucide-react';

export interface TokenTransactionConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: 'buy' | 'sell';
  tokenSymbol: string;
  tokenName: string;
  pxbAmount: number;
  tokenAmount: number;
  tokenPrice: number;
  percentageChange?: number;
}

export const formatLargeNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const TokenTransactionConfirmDialog: React.FC<TokenTransactionConfirmProps> = ({
  open,
  onOpenChange,
  onConfirm,
  type,
  tokenSymbol,
  tokenName,
  pxbAmount,
  tokenAmount,
  tokenPrice,
  percentageChange = 0,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-black border border-dream-accent1/20 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-xl">
            {type === 'buy' ? (
              <>
                <ArrowUp className="w-5 h-5 mr-2 text-green-400" />
                <span>Confirm Purchase</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-5 h-5 mr-2 text-red-400" />
                <span>Confirm Sale</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Please confirm the details of your transaction
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="glass-panel border border-dream-accent1/20 p-4 rounded-lg my-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {tokenSymbol ? tokenSymbol.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="ml-2">
                <div className="font-semibold">{tokenName}</div>
                <div className="text-xs text-gray-400">{tokenSymbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Token Price</div>
              <div className="font-semibold">${tokenPrice.toFixed(9)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {type === 'buy' ? (
              <>
                <div className="bg-black/40 p-2 rounded-md border border-white/5">
                  <div className="text-sm text-gray-400">You Pay</div>
                  <div className="font-bold text-purple-400">{pxbAmount} PXB</div>
                </div>
                <div className="bg-black/40 p-2 rounded-md border border-white/5">
                  <div className="text-sm text-gray-400">You Receive</div>
                  <div className="font-bold text-white">{formatLargeNumber(tokenAmount)} {tokenSymbol}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-black/40 p-2 rounded-md border border-white/5">
                  <div className="text-sm text-gray-400">You Sell</div>
                  <div className="font-bold text-white">{formatLargeNumber(tokenAmount)} {tokenSymbol}</div>
                </div>
                <div className="bg-black/40 p-2 rounded-md border border-white/5">
                  <div className="text-sm text-gray-400">You Receive</div>
                  <div className="font-bold text-purple-400">{pxbAmount} PXB</div>
                </div>
              </>
            )}
          </div>

          {type === 'sell' && percentageChange !== 0 && (
            <div className={`p-2 rounded-md border ${percentageChange >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} mb-4`}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Price Change</div>
                <div className={`font-semibold ${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-start">
            <Info className="w-4 h-4 text-blue-400 mr-2 mt-0.5" />
            <div className="text-xs text-gray-300">
              {type === 'buy' 
                ? `You are about to purchase ${tokenSymbol} tokens with your PXB points. Token prices fluctuate based on market conditions.`
                : `You are about to sell your ${tokenSymbol} tokens. The PXB amount you receive reflects the current market value of your tokens.`
              }
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={type === 'buy' 
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            }
          >
            <Check className="w-4 h-4 mr-2" />
            {type === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TokenTransactionConfirmDialog;
