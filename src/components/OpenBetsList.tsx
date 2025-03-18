
import React from 'react';
import { Link } from 'react-router-dom';

const OpenBetsList = () => {
  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 via-[#2a203e]/10 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:via-[#2a203e]/20 group-hover:to-dream-accent3/10 transition-all duration-500 animate-pulse-slow">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};

export default OpenBetsList;
