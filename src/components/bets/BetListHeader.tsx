
import React from 'react';
import { RefreshCw } from 'lucide-react';
import FilterButtons from './FilterButtons';

interface BetListHeaderProps {
  title: string;
  count: number;
  filter: string;
  setFilter: (filter: string) => void;
  onRefresh: () => void;
}

const BetListHeader: React.FC<BetListHeaderProps> = ({ 
  title, 
  count, 
  filter, 
  setFilter, 
  onRefresh 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
        <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-6 w-6" />
        <span>{title}</span>
        <span className="text-sm bg-dream-accent2/20 px-2 py-0.5 rounded-full text-dream-accent2">
          {count}
        </span>
      </h2>
      
      <div className="flex items-center gap-2">
        <FilterButtons filter={filter} setFilter={setFilter} />
        
        <button 
          onClick={onRefresh} 
          className="p-2 rounded-full bg-dream-background/30 text-dream-foreground/60 hover:text-dream-foreground transition-colors" 
          title="Refresh bets"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BetListHeader;
