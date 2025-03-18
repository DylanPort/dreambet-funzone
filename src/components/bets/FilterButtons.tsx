
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface FilterButtonsProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ filter, setFilter }) => {
  return (
    <div className="flex gap-1 items-center">
      <button 
        onClick={() => setFilter('all')} 
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          filter === 'all' 
            ? 'bg-dream-accent1/20 text-dream-accent1 border border-dream-accent1/30' 
            : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
        }`}
      >
        All
      </button>
      <button 
        onClick={() => setFilter('migrate')} 
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          filter === 'migrate' 
            ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
            : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
        }`}
      >
        <ArrowUp className="w-3 h-3 inline mr-1" />
        Moon
      </button>
      <button 
        onClick={() => setFilter('die')} 
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          filter === 'die' 
            ? 'bg-red-500/20 text-red-400 border border-red-400/30' 
            : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
        }`}
      >
        <ArrowDown className="w-3 h-3 inline mr-1" />
        Dust
      </button>
    </div>
  );
};

export default FilterButtons;
