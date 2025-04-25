
import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Loader, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatAddress } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import TokenSearchBar from '@/components/TokenSearchBar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const TradingSimulator = () => {
  const { rawTokens, isConnected } = usePumpPortal();

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Trading Simulator
        </h1>
        <p className="text-dream-foreground/60 mt-2">
          Practice trading with virtual funds on newly listed tokens
        </p>
      </div>

      <div className="mb-8">
        <TokenSearchBar />
      </div>

      <div className="relative px-12">
        <Carousel 
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {rawTokens.map((token, index) => (
              <CarouselItem key={token.mint} className="basis-1/3 pl-2">
                <Card className="overflow-hidden transition-all duration-300 h-24 border border-dream-accent1/20 bg-dream-background/40 backdrop-blur-sm hover:bg-dream-background/60">
                  <div className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-dream-accent2" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-dream-foreground truncate">
                          {token.symbol || 'Unknown'}
                        </h3>
                        <p className="text-xs text-dream-foreground/60 truncate">{formatAddress(token.mint)}</p>
                        <div className="mt-2">
                          <Button 
                            size="sm"
                            className="bg-dream-accent1/20 hover:bg-dream-accent1/30 text-dream-accent1 text-xs px-3 py-1 h-7"
                            asChild
                          >
                            <Link to={`/token/${token.mint}`}>
                              Trade
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default TradingSimulator;
