
import React from 'react';
import { AlertDialogHeader, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface TokenTransactionConfirmDialogProps {
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
  isDemo?: boolean;
}

const TokenTransactionConfirmDialog: React.FC<TokenTransactionConfirmDialogProps> = ({
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
  isDemo = false
}) => {
  const isBuy = type === 'buy';
  const isPositive = percentageChange >= 0;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-black/70 border border-white/10 backdrop-blur-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center flex items-center justify-center gap-2">
            {isBuy ? (
              <>
                <ArrowDownRight className="w-4 h-4 text-purple-500" />
                {isDemo ? 'Confirm Demo Purchase' : 'Confirm Purchase'}
              </>
            ) : (
              <>
                <ArrowUpRight className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                {isDemo ? 'Confirm Demo Sale' : 'Confirm Sale'}
              </>
            )}
          </AlertDialogTitle>
          
          <div className="border-t border-white/10 my-2"></div>
          
          <AlertDialogDescription className="space-y-4">
            {isDemo && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-md p-2 text-center mb-2">
                <p className="text-sm font-medium text-yellow-200">
                  Demo Mode: This transaction won't affect your PXB balance
                </p>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {isBuy ? 'You are buying' : 'You are selling'}
              </p>
              <p className="text-xl font-bold">
                {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tokenSymbol}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                for
              </p>
              <p className="text-xl font-bold">
                {pxbAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} PXB
              </p>
              
              {!isBuy && (
                <div className={`mt-2 flex items-center justify-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span>
                    {isPositive ? '+' : ''}{percentageChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-black/40 rounded-md p-3 text-xs">
              <p className="flex justify-between py-1">
                <span className="text-gray-400">Token:</span>
                <span className="font-medium">{tokenName} ({tokenSymbol})</span>
              </p>
              <p className="flex justify-between py-1">
                <span className="text-gray-400">Price per token:</span>
                <span className="font-medium">{tokenPrice.toFixed(6)} PXB</span>
              </p>
              <p className="flex justify-between py-1">
                <span className="text-gray-400">Transaction type:</span>
                <span className="font-medium">{isBuy ? 'Buy' : 'Sell'}</span>
              </p>
              {isDemo && (
                <p className="flex justify-between py-1">
                  <span className="text-gray-400">Mode:</span>
                  <span className="font-medium text-yellow-400">Demo (No PXB impact)</span>
                </p>
              )}
            </div>
            
            <p className="text-center text-gray-400 text-xs">
              {isBuy ? 'Buy tokens to experience price movement and earn PXB on upward trends.' : 'Selling tokens will convert their current value to PXB.'}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border border-white/20 hover:bg-white/10 text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={`text-white ${isBuy 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : isPositive 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isBuy ? 'Buy Tokens' : 'Sell Tokens'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TokenTransactionConfirmDialog;
