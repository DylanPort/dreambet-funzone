
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface TokenInfoTableProps {
  token: {
    token_mint: string;
    token_name: string;
    token_symbol: string;
    initial_market_cap: number;
    current_market_cap: number;
  };
  tokenMetrics: any;
}

const TokenInfoTable: React.FC<TokenInfoTableProps> = ({ token, tokenMetrics }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Token Information</h3>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Token Mint</TableCell>
            <TableCell className="break-all">
              <div className="max-w-full overflow-hidden text-ellipsis">
                {token.token_mint}
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Token Name</TableCell>
            <TableCell>{token.token_name || "Unknown"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Token Symbol</TableCell>
            <TableCell>{token.token_symbol || "UNKNOWN"}</TableCell>
          </TableRow>
          {token.initial_market_cap > 0 && (
            <TableRow>
              <TableCell className="font-medium">Initial Market Cap</TableCell>
              <TableCell>${token.initial_market_cap.toLocaleString()}</TableCell>
            </TableRow>
          )}
          {token.current_market_cap > 0 && (
            <TableRow>
              <TableCell className="font-medium">Current Market Cap</TableCell>
              <TableCell>${token.current_market_cap.toLocaleString()}</TableCell>
            </TableRow>
          )}
          {tokenMetrics && tokenMetrics.marketCap && (
            <TableRow>
              <TableCell className="font-medium">Market Cap (DexScreener)</TableCell>
              <TableCell>${tokenMetrics.marketCap.toLocaleString()}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TokenInfoTable;
